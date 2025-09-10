#!/usr/bin/env python3
import os, sys, re
from pathlib import Path
from utils import gh, sh

REPO = os.environ.get("REPO")
ISSUE_NUMBER = os.environ.get("ISSUE_NUMBER")

if not (REPO and ISSUE_NUMBER):
    print("Missing REPO or ISSUE_NUMBER", file=sys.stderr)
    sys.exit(1)

# 1) Fetch issue and repo info
issue = gh("GET", f"/repos/{REPO}/issues/{ISSUE_NUMBER}")
repo = gh("GET", f"/repos/{REPO}")
default_branch = repo["default_branch"]
ref = gh("GET", f"/repos/{REPO}/git/ref/heads/{default_branch}")
base_sha = ref["object"]["sha"]

# 2) Branch name
slug = re.sub(r"[^a-z0-9]+", "-", issue["title"].lower()).strip("-")[:40] or "task"
branch = f"farm/{ISSUE_NUMBER}-{slug}"

# 3) Create branch ref if missing
try:
    gh("POST", f"/repos/{REPO}/git/refs", body={"ref": f"refs/heads/{branch}", "sha": base_sha})
except Exception:
    # already exists → continue
    pass

# 4) Checkout and write seed plan
sh(f"git fetch origin {branch}", check=False)
sh(f"git checkout -B {branch} origin/{branch} || git checkout -B {branch}", check=False)

plan_path = Path(f".farm/plan-{ISSUE_NUMBER}.md")
plan_path.parent.mkdir(parents=True, exist_ok=True)
plan = f"""# Farm Plan for #{ISSUE_NUMBER} – {issue['title']}

**Goal**: {issue['title']}

## Steps
1. Read codeowners and policies
2. Generate patch plan (files to edit)
3. Implement and add unit tests
4. Update docs/CHANGELOG
5. Open PR with template

## Context
{issue.get('body') or '(no description)'}
"""
plan_path.write_text(plan, encoding="utf-8")

# 5) Commit & push
sh("git add .farm/plan-*.md")
sh(f"git commit -m 'farm: seed plan for #{ISSUE_NUMBER}'", check=False)
sh(f"git push -u origin {branch}", check=False)
print(f"Created/updated branch {branch}")
