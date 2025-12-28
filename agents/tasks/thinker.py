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
from src.config import (
    ENABLE_CODER_AGENT,
    ENABLE_AUTO_IMPLEMENT,
    ENABLE_AUTO_IMPLEMENT_GIT,
    ENABLE_AUTO_STASH,
    AUTO_IMPLEMENT_GIT_REMOTE,
    AUTO_IMPLEMENT_GIT_BASE,
    ENABLE_PRE_COMMIT_CHECKS,
    ENABLE_PR_DESCRIPTION_GENERATION,
    PRE_COMMIT_COMMANDS,
    MAX_IDEAS,
    MAX_TICKETS,
    PROJECT_ROOT,
    log,
)
from src.context import collect_project_context
from src.file_utils import save_coder_output, save_ticket_to_file
from src.executor import apply_coder_plan
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
    accepted = _iterate_improvements(
        idea_candidate,
        accepted_count,
        ticket_files,
        coder_outputs,
        project_context,
    )
    return accepted


def _iterate_improvements(
    idea_candidate: str,
    accepted_count: int,
    ticket_files: List[Path],
    coder_outputs: List[Path],
    project_context: str,
) -> int:
    new_accepted_count = accepted_count
    for iteration in range(1, 4):
        critique = critique_idea(idea_candidate)
        verdict = critique.get("verdict", "needs_improvement").lower()

        log(f"[ITERATION {iteration}] Critic's verdict: {verdict}")
        log(f"Rationale: {critique.get('rationale', '')[:200]}…")

        if verdict == "accept":
            new_accepted_count = _accept_ticket(
                iteration,
                idea_candidate,
                critique,
                new_accepted_count,
                ticket_files,
                coder_outputs,
                project_context,
            )
            break

        if iteration == 3:
            log("[RESULT] Maximum improvement rounds reached; moving on")
            break

        log(f"[FEEDBACK] Feedback: {critique.get('specific_feedback', '')[:150]}…")
        log(f"[FEEDBACK] Improvements: {critique.get('suggested_improvements', '')[:150]}…")
        idea_candidate = improve_idea(idea_candidate, critique)
        log(f"[IMPROVED] Improved idea: {idea_candidate[:200]}…")
    return new_accepted_count


def _accept_ticket(
    iteration: int,
    idea_candidate: str,
    critique: dict,
    accepted_count: int,
    ticket_files: List[Path],
    coder_outputs: List[Path],
    project_context: str,
) -> int:
    new_index = accepted_count + 1
    ticket_markdown = create_ticket(idea_candidate, critique, new_index)
    ticket_path = save_ticket_to_file(ticket_markdown, new_index)
    ticket_files.append(ticket_path)
    log(f"[RESULT] Accepted on round {iteration}! Ticket #{new_index} saved to {ticket_path.name}")

    if ENABLE_CODER_AGENT:
        coder_markdown = propose_code_changes(ticket_markdown, project_context)
        coder_path = save_coder_output(new_index, coder_markdown, ticket_markdown)
        coder_outputs.append(coder_path)
        log(f"[CODER] Implementation plan saved to {coder_path.name}")

        if ENABLE_AUTO_IMPLEMENT:
            _auto_implement_ticket(new_index, ticket_path, coder_path)
    else:
        log("[CODER] Skipping coder agent (disabled)")
    return new_index


def _auto_implement_ticket(new_index: int, ticket_path: Path, coder_path: Path) -> None:
    log(f"[EXEC] Dry-run validation for ticket #{new_index}…")
    result = apply_coder_plan(coder_path, apply=False, auto_stash=ENABLE_AUTO_STASH)
    log(
        f"[EXEC] Dry-run: success={result.success} blocks={result.diff_blocks} patch_len={result.patch_length} msg='{result.message}'"
    )
    if not result.success:
        log("[EXEC][WARN] Dry-run failed; skipping apply.")
        return
    branch_name = None
    commit_msg = None
    if ENABLE_AUTO_IMPLEMENT_GIT:
        branch_slug = ticket_path.stem.split("-", 1)[1] if "-" in ticket_path.stem else ticket_path.stem
        branch_name = f"ticket-{new_index:03d}-{branch_slug}"
        commit_msg = f"ticket-{new_index:03d}: auto-implement {branch_slug}"[:72]
        log(f"[EXEC][GIT] Will use branch '{branch_name}'")
    log("[EXEC] Applying patch…")
    apply_result = apply_coder_plan(
        coder_path,
        apply=True,
        git_branch=branch_name,
        git_commit_message=commit_msg,
        git_push=ENABLE_AUTO_IMPLEMENT_GIT,
        remote=AUTO_IMPLEMENT_GIT_REMOTE,
        base=AUTO_IMPLEMENT_GIT_BASE,
        pre_commit_commands=PRE_COMMIT_COMMANDS if ENABLE_PRE_COMMIT_CHECKS else None,
        generate_pr_description=ENABLE_PR_DESCRIPTION_GENERATION,
        auto_stash=ENABLE_AUTO_STASH,
    )
    log(
        f"[EXEC] Apply: success={apply_result.success} exit={apply_result.exit_code} msg='{apply_result.message}' branch={apply_result.branch} committed={apply_result.committed} pushed={apply_result.pushed} pre_commit_passed={apply_result.pre_commit_passed} pr_desc={apply_result.pr_description_path}"
    )


if __name__ == "__main__":
    run_round()
