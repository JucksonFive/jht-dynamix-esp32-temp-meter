"""GitHub Pull Request helpers (no Gemini dependency).

These helpers are used by automation tasks that need to open a PR after pushing a branch.
They intentionally avoid importing `src.config` so they can run without `GEMINI_API_KEY`.
"""

from __future__ import annotations

from dataclasses import dataclass

import requests


@dataclass(frozen=True)
class GitHubClient:
    token: str
    repo: str  # "owner/name"

    def _session(self) -> requests.Session:
        s = requests.Session()
        s.headers.update(
            {
                "Authorization": f"Bearer {self.token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            }
        )
        return s

    def _request(self, method: str, path: str, *, params=None, body=None) -> dict | list:
        url = f"https://api.github.com{path}"
        session = self._session()
        r = session.request(method.upper(), url, params=params, json=body)
        if r.status_code >= 400:
            raise RuntimeError(f"GitHub API {method} {path} failed: {r.status_code} {r.text}")
        if not r.text.strip():
            return {}
        return r.json()


def find_open_pr(client: GitHubClient, *, head_branch: str, base: str) -> str | None:
    """Return PR URL if an open PR already exists for head_branch -> base."""
    owner = client.repo.split("/", 1)[0]
    prs = client._request(
        "GET",
        f"/repos/{client.repo}/pulls",
        params={"state": "open", "head": f"{owner}:{head_branch}", "base": base, "per_page": 10},
    )
    if isinstance(prs, list) and prs:
        pr = prs[0]
        return str(pr.get("html_url") or pr.get("url") or "") or None
    return None


def create_or_get_pr(
    client: GitHubClient,
    *,
    head_branch: str,
    base: str,
    title: str,
    body: str,
) -> str:
    """Create a PR if missing; otherwise return existing PR URL."""
    existing = find_open_pr(client, head_branch=head_branch, base=base)
    if existing:
        return existing

    pr = client._request(
        "POST",
        f"/repos/{client.repo}/pulls",
        body={
            "title": title,
            "head": head_branch,
            "base": base,
            "body": body,
            "maintainer_can_modify": True,
        },
    )
    if isinstance(pr, dict) and pr.get("html_url"):
        return str(pr["html_url"])
    raise RuntimeError("PR creation succeeded but no URL was returned")
