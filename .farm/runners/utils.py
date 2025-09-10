import os, subprocess, json, sys
import requests

API = "https://api.github.com"
TOKEN = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
REPO = os.environ.get("REPO")  # owner/name

if not TOKEN:
    print("Missing GITHUB_TOKEN in env", file=sys.stderr)
    sys.exit(1)

session = requests.Session()
session.headers.update({
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
})


def gh(method: str, path: str, *, params=None, body=None):
    url = f"{API}{path}"
    resp = session.request(method.upper(), url, params=params, json=body)
    if resp.status_code >= 400:
        raise RuntimeError(f"GitHub API {method} {path} failed: {resp.status_code} {resp.text}")
    if resp.text.strip():
        return resp.json()
    return {}


def sh(cmd: str, check: bool = True) -> str:
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if check and res.returncode != 0:
        raise RuntimeError(f"Command failed: {cmd}\n{res.stdout}\n{res.stderr}")
    return (res.stdout or "").strip()
