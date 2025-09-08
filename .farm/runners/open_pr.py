#!/usr/bin/env python3
import os, sys
from utils import gh, sh

REPO = os.environ.get("REPO")
if not REPO:
    print("Missing REPO", file=sys.stderr)
    sys.exit(1)

owner = REPO.split("/")[0]
branch = os.environ.get("BRANCH") or sh("git rev-parse --abbrev-ref HEAD")

# If branch doesn't exist remotely, exit quietly
try:
    gh("GET", f"/repos/{REPO}/git/ref/heads/{branch}")
except Exception:
    print(f"No remote branch {branch}; skipping PR")
    sys.exit(0)

# Already has PR?
prs = gh("GET", f"/repos/{REPO}/pulls", params={"head": f"{owner}:{branch}", "state": "open"})
if isinstance(prs, list) and prs:
    print("PR already exists:", prs[0].get("html_url"))
    sys.exit(0)

repo = gh("GET", f"/repos/{REPO}")
base = repo["default_branch"]

body = (
    "This PR was bootstrapped by the farm runner.

"
    "- [ ] Build passes
- [ ] Lint/test
- [ ] Secrets/SAST clean
- [ ] Add screenshots / diffs"
)

pr = gh("POST", f"/repos/{REPO}/pulls", body={
    "title": f"farm: {branch}",
    "head": branch,
    "base": base,
    "body": body,
    "draft": True,
})
print("Opened PR:", pr.get("html_url"))
