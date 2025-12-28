#!/usr/bin/env python3
from pathlib import Path
from typing import List

import os
import subprocess
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
    ENABLE_AUTO_PR,
    AUTO_IMPLEMENT_GIT_REMOTE,
    AUTO_IMPLEMENT_GIT_BASE,
    PR_BASE,
    MAX_IDEAS,
    MAX_TICKETS,
    CODER_OUTPUT_DIR,
    PROJECT_ROOT,
    log,
)
from src.context import collect_project_context
from src.file_utils import save_coder_output, save_ticket_to_file
from src.executor import apply_coder_plan
from src.history import load_previous_ideas


def _log_auto_implement_guidance(coder_outputs: List[Path]) -> None:
    if not coder_outputs:
        return

    if not ENABLE_AUTO_IMPLEMENT:
        log(
            "[NEXT] Auto-implementation is OFF, so no code is applied and no PR will be created. "
            "To auto-implement + open a PR, set: ENABLE_AUTO_IMPLEMENT=1, ENABLE_AUTO_IMPLEMENT_GIT=1, ENABLE_AUTO_PR=1."
        )
        log("[NEXT] PR creation also requires env: REPO=<owner/name> and GITHUB_TOKEN=<token with repo scope>.")
        sample_plan = coder_outputs[0]
        log(
            "[NEXT] Or run manually: python agents/tasks/implement_coder_output_to_pr.py "
            f"--plan {sample_plan}"
        )
        return

    if ENABLE_AUTO_IMPLEMENT and not ENABLE_AUTO_IMPLEMENT_GIT:
        log(
            "[NEXT] Auto-implementation is ON but git automation is OFF; changes may be applied locally without a branch/push/PR. "
            "Enable git automation with ENABLE_AUTO_IMPLEMENT_GIT=1."
        )
        return

    if ENABLE_AUTO_PR:
        missing = [name for name in ("REPO", "GITHUB_TOKEN") if not os.environ.get(name)]
        if missing:
            log(
                "[NEXT] ENABLE_AUTO_PR=1 but required env is missing: "
                + ", ".join(missing)
                + ". PR creation will fail until these are set."
            )


def _run_implement_coder_output_to_pr(plan_paths: List[Path] | None = None) -> int:
    script_path = CURRENT_DIR / "implement_coder_output_to_pr.py"
    if not script_path.exists():
        log(f"[EXEC][ERROR] Missing implement script: {script_path}")
        return 2

    cmd: list[str] = [sys.executable, str(script_path)]
    if plan_paths:
        for plan_path in plan_paths:
            cmd.extend(["--plan", str(plan_path)])
    else:
        cmd.append("--all")

    if not ENABLE_AUTO_PR:
        cmd.append("--no-pr")

    cmd.extend(["--remote", AUTO_IMPLEMENT_GIT_REMOTE, "--base", AUTO_IMPLEMENT_GIT_BASE, "--pr-base", PR_BASE])

    log(f"[EXEC] Running implement_coder_output_to_pr: {' '.join(cmd)}")
    completed = subprocess.run(cmd, check=False)
    return int(completed.returncode)


def _apply_existing_plans_locally(plan_paths: List[Path]) -> int:
    overall_ok = True
    for plan_path in plan_paths:
        log(f"[EXEC] Local apply for plan: {plan_path}")
        dry = apply_coder_plan(plan_path, apply=False)
        log(f"[EXEC] Dry-run: success={dry.success} blocks={dry.diff_blocks} msg='{dry.message}'")
        if not dry.success:
            overall_ok = False
            continue
        applied = apply_coder_plan(plan_path, apply=True)
        log(f"[EXEC] Apply: success={applied.success} msg='{applied.message}'")
        if not applied.success:
            overall_ok = False
    return 0 if overall_ok else 1


def _maybe_process_existing_plans() -> int | None:
    """If coder_output contains queued plans and auto-implement is enabled, process them and return an exit code."""
    existing_plans = sorted(CODER_OUTPUT_DIR.glob("*.md"))
    if not existing_plans or not ENABLE_AUTO_IMPLEMENT:
        return None
    log(f"[FLOW] Found {len(existing_plans)} existing coder plan(s) in {CODER_OUTPUT_DIR}")
    if ENABLE_AUTO_IMPLEMENT_GIT:
        return _run_implement_coder_output_to_pr(None)
    return _apply_existing_plans_locally(existing_plans)


def _maybe_process_generated_plans(coder_outputs: List[Path]) -> int | None:
    """If this round produced plans and auto-implement is enabled, process them and return an exit code."""
    if not coder_outputs or not ENABLE_AUTO_IMPLEMENT:
        return None
    if ENABLE_AUTO_IMPLEMENT_GIT:
        return _run_implement_coder_output_to_pr(coder_outputs)
    return _apply_existing_plans_locally(coder_outputs)


def run_round() -> int:
    existing_exit = _maybe_process_existing_plans()
    if existing_exit is not None:
        return existing_exit

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
        _log_auto_implement_guidance(coder_outputs)
    elif ENABLE_CODER_AGENT:
        log("[CODER] No coder outputs produced in this round.")

    generated_exit = _maybe_process_generated_plans(coder_outputs)
    if generated_exit is not None:
        return generated_exit

    return 0


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
        # Auto-implementation is handled after the round so we can process existing plans first.
    else:
        log("[CODER] Skipping coder agent (disabled)")
    return new_index


if __name__ == "__main__":
    raise SystemExit(run_round())
