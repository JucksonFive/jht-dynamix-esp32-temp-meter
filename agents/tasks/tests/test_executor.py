import os
from pathlib import Path

import pytest

from agents.tasks.src.executor import extract_diff_blocks, apply_coder_plan, _detect_conflicts  # type: ignore

SIMPLE_PLAN = """### Plan\n```diff\ndiff --git a/sample.txt b/sample.txt\n--- a/sample.txt\n+++ b/sample.txt\n@@\n-Hello\n+Hello world\n```\n"""

MULTI_BLOCK_PLAN = """Header\n```diff\ndiff --git a/a.txt b/a.txt\n--- a/a.txt\n+++ b/a.txt\n@@\n-Old A\n+New A\n```\nStuff\n```diff\ndiff --git a/b.txt b/b.txt\n--- a/b.txt\n+++ b/b.txt\n@@\n-Old B\n+New B\n```\n"""


def test_extract_diff_blocks_single():
    blocks = extract_diff_blocks(SIMPLE_PLAN)
    assert len(blocks) == 1
    assert blocks[0].startswith("diff --git a/sample.txt")


def test_extract_diff_blocks_multiple():
    blocks = extract_diff_blocks(MULTI_BLOCK_PLAN)
    assert len(blocks) == 2
    assert all(b.startswith("diff --git") for b in blocks)


def test_apply_coder_plan_dry_run_and_apply(tmp_path: Path):
    # Create repo-like structure
    repo_root = tmp_path
    os.chdir(repo_root)
    # Provide initial file
    (repo_root / "sample.txt").write_text("Hello\n", encoding="utf-8")
    plan_path = repo_root / "plan.md"
    plan_path.write_text(SIMPLE_PLAN, encoding="utf-8")

    # Dry run should succeed
    dry = apply_coder_plan(plan_path, apply=False)
    assert dry.success is True
    assert dry.applied is False

    # Apply should modify file
    applied = apply_coder_plan(plan_path, apply=True)
    assert applied.success is True
    content = (repo_root / "sample.txt").read_text(encoding="utf-8")
    assert "Hello world" in content


def test_conflict_detection(tmp_path: Path):
    # File content changed so removed line won't match
    repo_root = tmp_path
    os.chdir(repo_root)
    (repo_root / "a.txt").write_text("Changed line\n", encoding="utf-8")
    conflict_plan = """```diff\ndiff --git a/a.txt b/a.txt\n--- a/a.txt\n+++ b/a.txt\n@@\n-Original line\n+Original line updated\n```\n"""
    p = repo_root / "plan.md"
    p.write_text(conflict_plan, encoding="utf-8")
    res = apply_coder_plan(p, apply=False)
    # In dry-run we still attempt patch; conflict heuristic should flag
    assert res.conflicts is not None
    assert any("a.txt" in c for c in res.conflicts)


@pytest.mark.parametrize("pre_commit_ok", [True, False])
def test_pre_commit_checks(tmp_path: Path, pre_commit_ok: bool):
    repo_root = tmp_path
    os.chdir(repo_root)
    (repo_root / "sample.txt").write_text("Hello\n", encoding="utf-8")
    (repo_root / "plan.md").write_text(SIMPLE_PLAN, encoding="utf-8")
    commands = [["bash", "-c", "exit 0"]] if pre_commit_ok else [["bash", "-c", "exit 3"]]
    result = apply_coder_plan(
        repo_root / "plan.md",
        apply=True,
        pre_commit_commands=commands,
        git_branch="test-branch" if pre_commit_ok else None,
        git_commit_message="test commit" if pre_commit_ok else None,
    )
    if pre_commit_ok:
        assert result.pre_commit_passed is True
    else:
        assert result.pre_commit_passed is False or result.committed is False
