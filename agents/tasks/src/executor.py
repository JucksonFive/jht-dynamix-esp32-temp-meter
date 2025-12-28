"""Executor for applying coder plan implementation diffs automatically.

Responsibilities:
    * Extract ```edit (Aider-style SEARCH/REPLACE) or ```diff fenced blocks from coder plan markdown.
    * Prefer applying ```edit blocks directly (string replacement) for robustness.
    * Fall back to unified diff application via system 'patch' when needed.
  * Provide structured result object for logging.

We intentionally reuse system 'patch' for reliability; deeper semantic validation
could be added later if needed.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re
import subprocess
import tempfile
import os
import shutil
import difflib

DIFF_FENCE_RE = re.compile(r"```diff\n(.*?)```", re.DOTALL)
EDIT_FENCE_RE = re.compile(r"```edit\n(.*?)```", re.DOTALL)


@dataclass(frozen=True)
class EditOperation:
    file_path: str
    search: str
    replace: str


@dataclass
class ExecutionResult:
    applied: bool
    success: bool
    exit_code: int
    message: str
    diff_blocks: int
    patch_length: int
    branch: str | None = None
    committed: bool = False
    pushed: bool = False
    conflicts: list[str] | None = None
    pre_commit_passed: bool | None = None
    pr_description_path: Path | None = None


def extract_diff_blocks(markdown: str) -> list[str]:
    blocks = DIFF_FENCE_RE.findall(markdown)
    return [b.strip() + ("\n" if not b.endswith("\n") else "") for b in blocks]


def extract_edit_operations(markdown: str) -> list[EditOperation]:
    """Extract Aider-style SEARCH/REPLACE operations from ```edit fenced blocks.

    Expected block format:
    FILE: relative/path.ext
    <<<<<<< SEARCH
    ...
    =======
    ...
    >>>>>>> REPLACE
    """
    operations: list[EditOperation] = []
    for block in EDIT_FENCE_RE.findall(markdown):
        raw = block.strip("\n")
        lines = raw.splitlines()
        if not lines:
            continue
        file_line = next((l for l in lines if l.strip().lower().startswith("file:")), None)
        if not file_line:
            continue
        file_path = file_line.split(":", 1)[1].strip()

        # Parse one or more SEARCH/REPLACE segments
        pattern = re.compile(
            r"<<<<<<< SEARCH\n(.*?)\n=======\n(.*?)\n>>>>>>> REPLACE",
            re.DOTALL,
        )
        for match in pattern.finditer(raw):
            search, replace = match.group(1), match.group(2)
            operations.append(EditOperation(file_path=file_path, search=search, replace=replace))
    return operations


def _ensure_patch_available() -> None:
    if shutil.which("patch") is None:
        raise RuntimeError("'patch' command not found (install via package manager, e.g. apt install patch).")


def _resolve_repo_root(plan_path: Path) -> Path:
    """Resolve repository root reliably.

    Strategy:
    1) Walk upward from plan_path looking for common repo markers.
    2) Fall back to walking upward from this file looking for 'agents' directory.
    """
    markers = {"pnpm-workspace.yaml", "sonar-project.properties", ".git"}
    current = plan_path.resolve()
    for parent in [current] + list(current.parents):
        for marker in markers:
            if (parent / marker).exists():
                return parent

    current = Path(__file__).resolve()
    while current.name != "agents" and current.parent != current:
        current = current.parent
    if current.name == "agents":
        return current.parent

    # Worst-case fallback
    return Path.cwd()


def _apply_edit_operations(
    repo_root: Path,
    ops: list[EditOperation],
    apply: bool,
) -> tuple[bool, list[str]]:
    """Apply edit operations; returns (success, error_messages)."""
    errors: list[str] = []

    # Group by file and apply sequentially to avoid stale reads
    ops_by_file: dict[str, list[EditOperation]] = {}
    for op in ops:
        ops_by_file.setdefault(op.file_path, []).append(op)

    for rel_path, file_ops in ops_by_file.items():
        target = repo_root / rel_path
        exists = target.exists()

        if not exists:
            # Allow create only when there is exactly one op with empty SEARCH
            if len(file_ops) == 1 and file_ops[0].search == "":
                if apply:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_text(file_ops[0].replace, encoding="utf-8")
                continue
            errors.append(f"{rel_path}: target file does not exist")
            continue

        content = target.read_text(encoding="utf-8")
        for op in file_ops:
            if op.search == "":
                errors.append(f"{rel_path}: empty SEARCH not allowed for existing file")
                break
            occurrences = content.count(op.search)
            if occurrences == 0:
                errors.append(f"{rel_path}: SEARCH block not found")
                break
            if occurrences > 1:
                errors.append(f"{rel_path}: SEARCH block is ambiguous ({occurrences} matches)")
                break
            content = content.replace(op.search, op.replace, 1)
        else:
            if apply:
                target.write_text(content, encoding="utf-8")

    return (len(errors) == 0, errors)


def apply_coder_plan(
    plan_path: Path,
    apply: bool = False,
    git_branch: str | None = None,
    git_commit_message: str | None = None,
    git_push: bool = False,
    remote: str = "origin",
    base: str = "main",
    pre_commit_commands: list[list[str]] | None = None,
    generate_pr_description: bool = False,
) -> ExecutionResult:
    if not plan_path.is_file():
        return ExecutionResult(apply, False, 1, f"Plan file not found: {plan_path}", 0, 0)

    content = plan_path.read_text(encoding="utf-8")
    edit_ops = extract_edit_operations(content)
    blocks = extract_diff_blocks(content)
    if not edit_ops and not blocks:
        return ExecutionResult(apply, False, 2, "No edit or diff blocks found in plan file.", 0, 0)

    combined = "\n".join(blocks)

    # Basic conflict detection before applying (only when applying) - only for diffs
    potential_conflicts: list[str] = []
    if apply and blocks:
        potential_conflicts = _detect_conflicts(blocks)

    repo_root = _resolve_repo_root(plan_path)

    # Prefer edit operations if present
    if edit_ops:
        ok, errors = _apply_edit_operations(repo_root, edit_ops, apply=apply)
        msg = _status_message(ok, apply) if ok else f"Edit apply failed: {'; '.join(errors[:3])}"
        result = ExecutionResult(
            apply,
            ok,
            0 if ok else 1,
            msg,
            diff_blocks=len(edit_ops),
            patch_length=sum(len(o.search) + len(o.replace) for o in edit_ops),
            conflicts=None,
        )
        if ok and apply:
            _post_patch_actions(
                result,
                repo_root,
                plan_path,
                git_branch,
                base,
                pre_commit_commands,
                git_commit_message,
                git_push,
                remote,
                generate_pr_description,
            )
        return result

    try:
        _ensure_patch_available()
    except RuntimeError as e:
        return ExecutionResult(apply, False, 3, str(e), len(blocks), len(combined))

    # Write patch to temp file and invoke system patch
    with tempfile.NamedTemporaryFile("w", delete=False) as tf:
        tf.write(combined)
        patch_file = tf.name

    cmd = ["patch", "-p1"]
    if not apply:
        cmd.append("--dry-run")

    try:
        with open(patch_file, "r", encoding="utf-8") as patch_in:
            proc = subprocess.run(cmd, cwd=repo_root, stdin=patch_in, text=True)
        success = proc.returncode == 0
        msg = _status_message(success, apply)
        result = ExecutionResult(
            apply,
            success,
            proc.returncode,
            msg,
            len(blocks),
            len(combined),
            conflicts=potential_conflicts or None,
        )
        if success and apply:
            _post_patch_actions(
                result,
                repo_root,
                plan_path,
                git_branch,
                base,
                pre_commit_commands,
                git_commit_message,
                git_push,
                remote,
                generate_pr_description,
            )
        return result
    finally:
        try:
            os.unlink(patch_file)
        except OSError:
            pass


def _git_run(repo: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(["git", *args], cwd=repo, text=True, check=check)


def _git_prepare_branch(repo: Path, branch: str, base: str) -> None:
    subprocess.run(["git", "fetch"], cwd=repo, text=True)
    existing = subprocess.run(["git", "rev-parse", "--verify", branch], cwd=repo, text=True)
    if existing.returncode == 0:
        _git_run(repo, "checkout", branch)
    else:
        _git_run(repo, "checkout", base)
        _git_run(repo, "checkout", "-b", branch)


def _git_commit_all(repo: Path, message: str) -> bool:
    _git_run(repo, "add", ".")
    diff = subprocess.run(["git", "diff", "--cached", "--name-only"], cwd=repo, text=True, capture_output=True)
    if not diff.stdout.strip():
        return False
    _git_run(repo, "commit", "-m", message)
    return True


def _git_push(repo: Path, branch: str, remote: str) -> bool:
    push = subprocess.run(["git", "push", remote, branch], cwd=repo, text=True)
    return push.returncode == 0


def _status_message(success: bool, applied: bool) -> str:
    if not success:
        return "Patch failed"
    return "Patch applied successfully" if applied else "Patch validated (dry-run) successfully"


def _run_pre_commit_checks(repo: Path, commands: list[list[str]]) -> bool:
    for cmd in commands:
        res = subprocess.run(cmd, cwd=repo, text=True)
        if res.returncode != 0:
            return False
    return True


def _generate_pr_description(
    repo: Path,
    plan_path: Path,
    branch: str,
    commit_message: str,
    pre_commit_commands: list[list[str]] | None,
) -> Path:
    ticket_num = _extract_ticket_number(plan_path)
    body_lines: list[str] = []
    body_lines.append(f"# PR: {commit_message}")
    body_lines.append(f"Branch: `{branch}`")
    body_lines.append("")
    body_lines.append("## Summary")
    body_lines.append("Automated implementation applied from coder plan.")
    body_lines.append("")
    body_lines.append("## Ticket")
    body_lines.append(f"Linked ticket: {ticket_num if ticket_num else '(unknown)'}")
    body_lines.append("")
    body_lines.append("## Pre-Commit Checks")
    if pre_commit_commands:
        body_lines.append("All passed.")
    else:
        body_lines.append("(none configured)")
    body_lines.append("")
    body_lines.append("## Plan Source")
    body_lines.append(f"Coder plan: `{plan_path}`")
    pr_dir = repo / "agents" / "tasks" / "generated_pr_descriptions"
    pr_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{branch}.md"
    out_path = pr_dir / filename
    out_path.write_text("\n".join(body_lines), encoding="utf-8")
    return out_path


def _extract_ticket_number(plan_path: Path) -> str | None:
    stem = plan_path.stem
    parts = stem.split("-")
    if parts and parts[0].isdigit():
        return parts[0]
    return None


def _post_patch_actions(
    result: ExecutionResult,
    repo_root: Path,
    plan_path: Path,
    git_branch: str | None,
    base: str,
    pre_commit_commands: list[list[str]] | None,
    git_commit_message: str | None,
    git_push: bool,
    remote: str,
    generate_pr_description: bool,
) -> None:
    if git_branch:
        _git_prepare_branch(repo_root, git_branch, base)
        result.branch = git_branch
    if pre_commit_commands:
        checks_pass = _run_pre_commit_checks(repo_root, pre_commit_commands)
        result.pre_commit_passed = checks_pass
        if not checks_pass:
            result.message += " | pre-commit checks FAILED"
            return
    if git_commit_message:
        committed = _git_commit_all(repo_root, git_commit_message)
        result.committed = committed
        if committed and git_push and git_branch:
            result.pushed = _git_push(repo_root, git_branch, remote)
    if generate_pr_description and git_branch and git_commit_message:
        pr_path = _generate_pr_description(repo_root, plan_path, git_branch, git_commit_message, pre_commit_commands)
        result.pr_description_path = pr_path


def _detect_conflicts(diff_blocks: list[str]) -> list[str]:
    """Very lightweight conflict detection.

    For each diff block, inspect removed lines; if any removed line no longer exists in
    the target file (fuzzy match), flag a potential conflict.
    This is heuristic and aims to warn early rather than guarantee correctness.
    """
    conflicts: list[str] = []
    for block in diff_blocks:
        lines = block.splitlines()
        header = next((l for l in lines if l.startswith("diff --git ")), None)
        if not header:
            continue
        try:
            _, _, a_path, b_path = header.split()
        except ValueError:
            continue
        # Use b_path as target path
        target_rel = b_path.split("b/", 1)[-1] if "b/" in b_path else b_path
        target_file = Path(__file__).resolve().parents[2] / target_rel
        if not target_file.is_file():
            # new file additions are not conflicts
            continue
        current_content = target_file.read_text(encoding="utf-8").splitlines()
        removed = [l[1:] for l in lines if l.startswith("-") and not l.startswith("--- ")]  # exclude metadata
        for rline in removed:
            if rline.strip() and _line_missing_fuzzy(rline, current_content):
                conflicts.append(f"{target_rel}: '{rline[:80]}' not found")
                if len(conflicts) > 25:  # cap noise
                    return conflicts
    return conflicts


def _line_missing_fuzzy(line: str, content: list[str]) -> bool:
    # Direct match first
    if line in content:
        return False
    # Fuzzy partial ratio using difflib (simple heuristic): if any line has >0.85 similarity treat as present
    for existing in content:
        if len(line) > 5 and difflib.SequenceMatcher(a=line, b=existing).ratio() > 0.85:
            return False
    return True
