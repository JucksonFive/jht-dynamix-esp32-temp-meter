#!/usr/bin/env python3
"""Apply code changes described in a coder plan markdown file.

Features:
  * Extract all ```diff fenced blocks from a coder output file.
  * (Dry-run by default) validate patch application using the system `patch` command.
  * Optionally create a git branch, apply the patch, commit, and push.

Limitations:
  * Requires the `patch` command to be installed (common on Linux/macOS).
  * Unified diff blocks must be valid; script does not deeply validate hunk headers beyond delegating to `patch`.

Usage examples:
  Dry run (show what would be applied):
    python agents/tasks/apply_coder_plan.py --plan agents/tasks/coder_output/001-coder-plan.md

  Create branch and apply:
    python agents/tasks/apply_coder_plan.py --plan agents/tasks/coder_output/001-coder-plan.md \
        --create-branch ticket-012-add-temperature-threshold-alerts --apply

  Apply, commit and push:
    python agents/tasks/apply_coder_plan.py --plan agents/tasks/coder_output/001-coder-plan.md \
        --apply --commit -m "ticket-012: implement structured logging" --push
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # repository root (../../)

DIFF_FENCE_PATTERN = re.compile(r"```diff\n(.*?)```", re.DOTALL)


def extract_diff_blocks(markdown: str) -> list[str]:
    """Return list of raw unified diff blocks from the coder plan markdown."""
    blocks = DIFF_FENCE_PATTERN.findall(markdown)
    # Remove leading/trailing whitespace but keep internal newlines
    cleaned = [b.strip() + ("\n" if not b.endswith("\n") else "") for b in blocks]
    return cleaned


def ensure_patch_available() -> None:
    if shutil.which("patch") is None:
        print("ERROR: 'patch' command not found. Please install (e.g. apt install patch) and retry.", file=sys.stderr)
        sys.exit(2)


def run_patch(patch_text: str, apply: bool) -> int:
    """Run patch in dry-run or apply mode. Returns patch command exit code."""
    ensure_patch_available()
    # --batch prevents interactive prompts like "File to patch:" which would hang automation.
    mode_args = ["patch", "-p1", "--batch"]
    if not apply:
        mode_args.append("--dry-run")
    # Use a temp file for robust stdin handling (some patch versions behave differently on piped input)
    with tempfile.NamedTemporaryFile("w", delete=False) as tf:
        tf.write(patch_text)
        temp_path = tf.name
    try:
        print(f"[INFO] Invoking: {' '.join(mode_args)} < {temp_path}")
        proc = subprocess.run(mode_args, stdin=open(temp_path, "r"), cwd=ROOT, text=True)
        return proc.returncode
    finally:
        os.unlink(temp_path)


def git(*args: str, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(["git", *args], cwd=ROOT, check=check, text=True)


def create_branch(name: str) -> None:
    # Check if branch already exists
    existing = subprocess.run(["git", "rev-parse", "--verify", name], cwd=ROOT, text=True)
    if existing.returncode == 0:
        print(f"[INFO] Branch '{name}' already exists; reusing.")
        git("checkout", name)
    else:
        git("checkout", "-b", name)


def commit_changes(message: str) -> None:
    git("add", ".")
    status = subprocess.run(["git", "diff", "--cached", "--name-only"], cwd=ROOT, text=True, capture_output=True)
    if not status.stdout.strip():
        print("[WARN] No changes staged; skipping commit.")
        return
    git("commit", "-m", message)


def push_current_branch(set_upstream: bool = True) -> None:
    # Determine branch name
    res = subprocess.run(["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=ROOT, text=True, capture_output=True)
    branch = res.stdout.strip()
    args = ["git", "push"]
    if set_upstream:
        args.extend(["-u", "origin", branch])
    subprocess.run(args, cwd=ROOT, check=True, text=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply coder plan unified diff blocks.")
    parser.add_argument("--plan", required=True, help="Path to coder plan markdown file.")
    parser.add_argument("--apply", action="store_true", help="Actually apply changes (default is dry-run).")
    parser.add_argument("--create-branch", metavar="BRANCH", help="Create/switch to this branch before applying.")
    parser.add_argument("--commit", action="store_true", help="Commit changes after applying.")
    parser.add_argument("-m", "--message", help="Commit message (required if --commit and no default resolvable).")
    parser.add_argument("--push", action="store_true", help="Push branch to origin after commit.")
    parser.add_argument("--print-diff", action="store_true", help="Print the combined diff before patching.")
    args = parser.parse_args()

    plan_path = Path(args.plan)
    if not plan_path.is_file():
        print(f"ERROR: Plan file not found: {plan_path}", file=sys.stderr)
        sys.exit(1)

    content = plan_path.read_text(encoding="utf-8")
    diff_blocks = extract_diff_blocks(content)
    if not diff_blocks:
        print("ERROR: No diff blocks (```diff) found in plan file.", file=sys.stderr)
        sys.exit(1)

    combined_diff = "\n".join(diff_blocks)
    if args.print_diff:
        print("===== COMBINED DIFF BEGIN =====")
        print(combined_diff)
        print("===== COMBINED DIFF END =====")

    if args.create_branch:
        create_branch(args.create_branch)

    rc = run_patch(combined_diff, apply=args.apply)
    if rc != 0:
        mode = "apply" if args.apply else "dry-run"
        print(f"ERROR: patch command failed during {mode} (exit code {rc}).", file=sys.stderr)
        sys.exit(rc)
    else:
        print(f"[SUCCESS] Patch {('applied' if args.apply else 'validated (dry-run)')} successfully.")

    if args.apply and args.commit:
        message = args.message
        if not message:
            # Derive a simple default message from plan file name
            ticket_hint = plan_path.stem.replace("_", "-")
            message = f"Apply coder plan {ticket_hint}"
        commit_changes(message)
        if args.push:
            push_current_branch()


if __name__ == "__main__":  # pragma: no cover
    main()
