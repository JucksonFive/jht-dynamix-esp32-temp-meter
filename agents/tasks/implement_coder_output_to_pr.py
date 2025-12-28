#!/usr/bin/env python3
"""Implement coder_output plans and open a PR.

This task is intentionally independent from the Gemini-based agents pipeline so it can
run without `GEMINI_API_KEY`. It consumes existing coder plan markdown files under
`agents/tasks/coder_output/`.

What it does per plan:
- Validate patch via dry-run.
- Create/switch to a new branch.
- Apply patch, optionally run pre-commit commands.
- Commit and push.
- Create (or reuse) a GitHub Pull Request.

Required env for PR creation:
- GITHUB_TOKEN: token with `repo` scope (or Actions GITHUB_TOKEN on internal branches)
- REPO: "owner/name"

Optional env:
- PR_BASE: base branch for PRs (default: main)
- AUTO_IMPLEMENT_GIT_REMOTE: git remote name (default: origin)
- AUTO_IMPLEMENT_GIT_BASE: git base branch to branch off (default: main)
- GIT_AUTHOR_NAME / GIT_AUTHOR_EMAIL: if git identity is not configured

Usage examples:
  # Process a single plan
  python agents/tasks/implement_coder_output_to_pr.py --plan agents/tasks/coder_output/001-foo-coder-plan.md

  # Process all plans in coder_output
  python agents/tasks/implement_coder_output_to_pr.py --all
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

import requests

from src.executor import apply_coder_plan


REPO_ROOT = Path(__file__).resolve().parents[2]
TASK_DIR = Path(__file__).resolve().parent
CODER_OUTPUT_DIR = TASK_DIR / "coder_output"


@dataclass(frozen=True)
class GitHubConfig:
    token: str
    repo: str  # owner/name
    base: str


def _env(name: str, default: str | None = None) -> str | None:
    value = os.environ.get(name)
    if value is None or value.strip() == "":
        return default
    return value.strip()


def _require_env(name: str) -> str:
    value = _env(name)
    if not value:
        print(f"Missing env: {name}", file=sys.stderr)
        sys.exit(2)
    return value


def _derive_repo_from_origin() -> str | None:
    try:
        url = _git_capture("remote", "get-url", "origin", check=False)
    except Exception:  # noqa: BLE001
        return None
    if not url:
        return None

    # Support common URL shapes:
    # - https://github.com/owner/name.git
    # - git@github.com:owner/name.git
    url = url.strip()
    if url.endswith(".git"):
        url = url[: -len(".git")]

    if url.startswith("https://github.com/"):
        return url.removeprefix("https://github.com/")
    if url.startswith("git@github.com:"):
        return url.removeprefix("git@github.com:")
    return None


def _require_github_token() -> str:
    # Common aliases (GitHub Actions / gh CLI conventions)
    token = _env("GITHUB_TOKEN") or _env("GH_TOKEN")
    if not token:
        print("Missing env: GITHUB_TOKEN (or GH_TOKEN)", file=sys.stderr)
        sys.exit(2)
    return token


def _load_github_config(args: argparse.Namespace) -> GitHubConfig | None:
    if args.no_pr:
        return None

    token = _require_github_token()
    repo = _env("REPO") or _derive_repo_from_origin()
    if not repo:
        print("Missing env: REPO (owner/name). Could not derive it from git origin.", file=sys.stderr)
        sys.exit(2)

    return GitHubConfig(token=token, repo=repo, base=args.pr_base)


def _git(*args: str, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(["git", *args], cwd=REPO_ROOT, text=True, check=check, capture_output=False)


def _git_capture(*args: str, check: bool = True) -> str:
    res = subprocess.run(["git", *args], cwd=REPO_ROOT, text=True, check=check, capture_output=True)
    return res.stdout.strip()


def _ensure_git_identity() -> None:
    name = _git_capture("config", "--get", "user.name", check=False)
    email = _git_capture("config", "--get", "user.email", check=False)

    if name and email:
        return

    fallback_name = _env("GIT_AUTHOR_NAME", "agents-bot")
    fallback_email = _env("GIT_AUTHOR_EMAIL", "agents-bot@users.noreply.github.com")

    if not name:
        _git("config", "user.name", fallback_name)
    if not email:
        _git("config", "user.email", fallback_email)


def _extract_ticket_number(plan_path: Path) -> int | None:
    # Expected: 001-...-coder-plan.md
    match = re.match(r"^(\d{3})-", plan_path.name)
    if not match:
        return None
    return int(match.group(1))


def _extract_slug_from_filename(plan_path: Path) -> str:
    stem = plan_path.stem
    # Remove leading ticket number
    stem = re.sub(r"^\d{3}-", "", stem)
    # Remove trailing -coder-plan
    stem = re.sub(r"-?coder-plan$", "", stem)
    # Safety: only keep url-friendly characters
    cleaned = re.sub(r"[^a-zA-Z0-9._-]+", "-", stem).strip("-")
    return cleaned or "auto-implement"


def _derive_branch_name(plan_path: Path) -> str:
    ticket = _extract_ticket_number(plan_path)
    slug = _extract_slug_from_filename(plan_path)
    if ticket is not None:
        return f"ticket-{ticket:03d}-{slug}"[:80]
    return f"ticket-unknown-{slug}"[:80]


def _derive_commit_message(plan_path: Path) -> str:
    ticket = _extract_ticket_number(plan_path)
    slug = _extract_slug_from_filename(plan_path)
    if ticket is not None:
        return f"ticket-{ticket:03d}: auto-implement {slug}"[:72]
    return f"auto-implement {slug}"[:72]


def _derive_pr_title(plan_path: Path) -> str:
    ticket = _extract_ticket_number(plan_path)
    slug = _extract_slug_from_filename(plan_path).replace("-", " ")
    title = slug.strip() or "Auto-implemented change"
    if ticket is not None:
        return f"ticket-{ticket:03d}: {title}"[:120]
    return title[:120]


def _load_pr_body_from_executor_result(pr_description_path: Path | None, plan_path: Path) -> str:
    if pr_description_path and pr_description_path.is_file():
        return pr_description_path.read_text(encoding="utf-8")
    return (
        "Automated implementation applied from coder plan.\n\n"
        f"Plan source: `{plan_path.as_posix()}`\n"
    )


def _github_session(token: str) -> requests.Session:
    s = requests.Session()
    s.headers.update(
        {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
    )
    return s


def _gh_request(session: requests.Session, method: str, url: str, *, params=None, body=None) -> dict | list:
    r = session.request(method.upper(), url, params=params, json=body)
    if r.status_code >= 400:
        raise RuntimeError(f"GitHub API {method} {url} failed: {r.status_code} {r.text}")
    if not r.text.strip():
        return {}
    return r.json()


def _find_existing_pr(cfg: GitHubConfig, branch: str) -> str | None:
    # GitHub API expects head as "owner:branch"
    owner = cfg.repo.split("/", 1)[0]
    url = f"https://api.github.com/repos/{cfg.repo}/pulls"
    session = _github_session(cfg.token)
    prs = _gh_request(
        session,
        "GET",
        url,
        params={"state": "open", "head": f"{owner}:{branch}", "base": cfg.base, "per_page": 10},
    )
    if isinstance(prs, list) and prs:
        pr = prs[0]
        return str(pr.get("html_url") or pr.get("url") or "") or None
    return None


def _create_pr(cfg: GitHubConfig, branch: str, title: str, body: str) -> str:
    existing = _find_existing_pr(cfg, branch)
    if existing:
        return existing

    url = f"https://api.github.com/repos/{cfg.repo}/pulls"
    session = _github_session(cfg.token)
    payload = {
        "title": title,
        "head": branch,
        "base": cfg.base,
        "body": body,
        "maintainer_can_modify": True,
    }
    pr = _gh_request(session, "POST", url, body=payload)
    if isinstance(pr, dict) and pr.get("html_url"):
        return str(pr["html_url"])
    raise RuntimeError("PR creation succeeded but no URL was returned")


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Implement coder_output plans and open PRs.")
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--plan", help="Path to a single coder plan markdown file")
    g.add_argument("--all", action="store_true", help="Process all plans under agents/tasks/coder_output")

    p.add_argument("--no-pr", action="store_true", help="Do not create a PR (still branches/commits/pushes).")
    p.add_argument("--remote", default=_env("AUTO_IMPLEMENT_GIT_REMOTE", "origin"), help="Git remote name")
    p.add_argument("--base", default=_env("AUTO_IMPLEMENT_GIT_BASE", "main"), help="Git base branch")
    p.add_argument("--pr-base", default=_env("PR_BASE", "main"), help="PR base branch")
    return p.parse_args()


def _resolve_plan_paths(args: argparse.Namespace) -> list[Path]:
    if args.plan:
        return [Path(args.plan)]
    if args.all:
        if not CODER_OUTPUT_DIR.exists():
            return []
        return sorted(CODER_OUTPUT_DIR.glob("*.md"))
    return []


def main() -> int:
    args = _parse_args()

    plans = _resolve_plan_paths(args)
    if not plans:
        print("No plan files found.")
        return 1

    gh_cfg = _load_github_config(args)

    _ensure_git_identity()

    overall_ok = True

    for plan_path in plans:
        if not plan_path.is_file():
            print(f"[SKIP] Plan not found: {plan_path}")
            overall_ok = False
            continue

        branch = _derive_branch_name(plan_path)
        commit_msg = _derive_commit_message(plan_path)

        print(f"\n[PLAN] {plan_path}")
        print(f"[GIT] branch={branch}")

        # 1) Dry-run validation
        dry = apply_coder_plan(plan_path, apply=False)
        print(f"[DRY] success={dry.success} msg='{dry.message}' blocks={dry.diff_blocks}")
        if not dry.success:
            overall_ok = False
            continue

        # 2) Apply + branch + commit + push
        applied = apply_coder_plan(
            plan_path,
            apply=True,
            git_branch=branch,
            git_commit_message=commit_msg,
            git_push=True,
            remote=args.remote,
            base=args.base,
            pre_commit_commands=None,
            generate_pr_description=True,
        )
        print(
            f"[APPLY] success={applied.success} committed={applied.committed} pushed={applied.pushed} pr_desc={applied.pr_description_path}"
        )
        if not applied.success or not applied.committed or not applied.pushed:
            overall_ok = False
            continue

        # 3) PR creation
        if gh_cfg is not None:
            title = _derive_pr_title(plan_path)
            body = _load_pr_body_from_executor_result(applied.pr_description_path, plan_path)
            try:
                pr_url = _create_pr(gh_cfg, branch, title, body)
                print(f"[PR] {pr_url}")
            except Exception as exc:  # noqa: BLE001
                overall_ok = False
                print(f"[PR][ERROR] {exc}")

    return 0 if overall_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
