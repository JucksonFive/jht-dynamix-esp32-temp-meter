#!/usr/bin/env python3
from pathlib import Path
from typing import List

import sys

# Ensure local src/ package is importable when running the script directly
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from src.ai_core import (
    create_ticket,
    critique_idea,
    generate_raw_ideas,
    improve_idea,
    propose_code_changes,
)
from src.config import ENABLE_CODER_AGENT, MAX_IDEAS, MAX_TICKETS, PROJECT_ROOT, log
from src.context import collect_project_context
from src.file_utils import save_coder_output, save_ticket_to_file
from src.history import load_previous_ideas


def run_round() -> None:
    log("[CTX] Collecting project context…")
    context = collect_project_context(PROJECT_ROOT)
    log(f"[CTX] Context collected ({len(context)} chars)")

    previous_ideas = load_previous_ideas()
    accepted_count = 0
    ticket_files: List[Path] = []
    coder_outputs: List[Path] = []

    log("[FLOW] Starting idea round")
    idea_batch = generate_raw_ideas(min(5, MAX_IDEAS), context, previous_ideas)
    log(f"[FLOW] Got {len(idea_batch)} idea(s) for first round")

    for index, original_idea in enumerate(idea_batch, start=1):
        if accepted_count >= MAX_TICKETS or index > MAX_IDEAS:
            break
        accepted_count = _handle_idea(
            index,
            original_idea,
            accepted_count,
            ticket_files,
            coder_outputs,
            context,
        )

    if ticket_files:
        log(f"\n[DONE] {len(ticket_files)} ticket(s) saved:")
        for path in ticket_files:
            log(f"  - {path}")
    else:
        log("\n[DONE] No accepted ideas in this round.")

    if coder_outputs:
        log("[CODER] Generated implementation plans:")
        for path in coder_outputs:
            log(f"  - {path}")
    elif ENABLE_CODER_AGENT:
        log("[CODER] No coder outputs produced in this round.")
def _handle_idea(
    index: int,
    original_idea: str,
    accepted_count: int,
    ticket_files: List[Path],
    coder_outputs: List[Path],
    project_context: str,
) -> int:
    log(f"\n[FLOW][IDEA {index}] Original: {original_idea}")
    idea_candidate = original_idea

    for iteration in range(1, 4):
        critique = critique_idea(idea_candidate)
        verdict = critique.get("verdict", "needs_improvement").lower()

        log(f"[ITERATION {iteration}] Critic's verdict: {verdict}")
        log(f"Rationale: {critique.get('rationale', '')[:200]}…")

        if verdict == "accept":
            new_index = accepted_count + 1
            ticket_markdown = create_ticket(idea_candidate, critique, new_index)
            ticket_path = save_ticket_to_file(ticket_markdown, new_index)
            ticket_files.append(ticket_path)
            log(f"[RESULT] Accepted on round {iteration}! Ticket #{new_index} saved to {ticket_path.name}")

            if ENABLE_CODER_AGENT:
                coder_markdown = propose_code_changes(ticket_markdown, project_context)
                coder_path = save_coder_output(new_index, coder_markdown)
                coder_outputs.append(coder_path)
                log(f"[CODER] Implementation plan saved to {coder_path.name}")
            else:
                log("[CODER] Skipping coder agent (disabled)")
            return new_index

        if iteration == 3:
            log("[RESULT] Maximum improvement rounds reached; moving on")
            break

        log(f"[FEEDBACK] Feedback: {critique.get('specific_feedback', '')[:150]}…")
        log(f"[FEEDBACK] Improvements: {critique.get('suggested_improvements', '')[:150]}…")
        idea_candidate = improve_idea(idea_candidate, critique)
        log(f"[IMPROVED] Improved idea: {idea_candidate[:200]}…")

    return accepted_count


if __name__ == "__main__":
    run_round()
