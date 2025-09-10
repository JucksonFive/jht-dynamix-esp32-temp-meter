# AI Coder Farm – Starter Kit

This package drops into your monorepo and gives you:

- **/farm run** issue‑comment trigger → orchestrator → branch → PR
- PR quality gates: **lint + test + secret scan + Semgrep + SonarCloud**
- Agent policies (Planner, CodeGen, Reviewer), coding standards, security rules
- Minimal RAG indexer hooks (plug your docs later)

> **Assumptions**: monorepo with workspaces:
> `frontend/` (Vite + React + TS), `backend/` (AWS CDK + Lambdas Node 22), `esp32/` (PlatformIO), `ops/` (misc). Uses npm/pnpm.

---

## 1) File Tree
```
.farm/
  policies/
    arch.md
    security.md
    coding-standards.md
    reviewer-checklist.md
  prompts/
    planner.md
    codegen.md
    reviewer.md
  runners/
    orchestrator.js
    open-pr.js
    utils.js
  tools/
    rag/
      README.md
      index-local.sh
      patterns.txt
.github/
  workflows/
    farm-run.yml
    pr-guard.yml
.semgrep.yml
.gitleaks.toml
sonar-project.properties
README.FARM.md
```

---

## 2) Workflows

### `.github/workflows/farm-run.yml`
```yaml
name: farm-run
on:
  issue_comment:
    types: [created]
permissions:
  contents: write
  pull-requests: write
  issues: read
  actions: read
  checks: read
jobs:
  run:
    if: contains(github.event.comment.body, '/farm run')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - name: Setup Python
        uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - name: Install Python deps
        run: |
          python -m pip install --upgrade pip
          pip install -r ./.farm/runners/requirements.txt
      - name: Start Orchestrator (Python)
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REPO: ${{ github.repository }}
          ISSUE_NUMBER: ${{ github.event.issue.number }}
          ACTOR: ${{ github.actor }}
        run: python ./.farm/runners/orchestrator.py
      - name: Open PR if branch exists (Python)
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REPO: ${{ github.repository }}
        run: python ./.farm/runners/open_pr.py
```yaml
name: farm-run
on:
  issue_comment:
    types: [created]
permissions:
  contents: write
  pull-requests: write
  issues: read
  actions: read
  checks: read
jobs:
  run:
    if: contains(github.event.comment.body, '/farm run')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - name: Install deps (root)
        run: |
          corepack enable || true
          pnpm -v || npm i -g pnpm || true
          pnpm i -w || npm i -w
      - name: Setup Python (optional)
        uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - name: Start Orchestrator
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REPO: ${{ github.repository }}
          ISSUE_NUMBER: ${{ github.event.issue.number }}
          ACTOR: ${{ github.actor }}
        run: node ./.farm/runners/orchestrator.js
      - name: Open PR if branch exists
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REPO: ${{ github.repository }}
        run: node ./.farm/runners/open-pr.js
```

### `.github/workflows/pr-guard.yml`
```yaml
name: pr-guard
on: [pull_request]
permissions:
  contents: read
  pull-requests: write
  checks: write
jobs:
  guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - name: Install deps
        run: |
          corepack enable || true
          pnpm -v || npm i -g pnpm || true
          pnpm i -w || npm i -w
      - name: Lint
        run: |
          npm run -w backend lint || true
          npm run -w frontend lint || true
      - name: Test (produce coverage)
        run: |
          npm run -w backend test -- --coverage || true
          npm run -w frontend test -- --coverage || true
      - name: Secret scan (Gitleaks)
        uses: gitleaks/gitleaks-action@v2
        with:
          config-path: ./.gitleaks.toml
          args: --redact
      - name: Semgrep SAST
        uses: returntocorp/semgrep-action@v1
        with:
          config: ./.semgrep.yml
      - name: SonarCloud scan
        uses: SonarSource/sonarcloud-github-action@v2
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        with:
          args: >-
            -Dsonar.organization=${{ secrets.SONAR_ORG }}
            -Dsonar.projectKey=${{ secrets.SONAR_PROJECT_KEY }}
```

---

## 3) Runner Scripts

> Python‑pohjaiset runnerit: eivät vaadi `gh`‑CLI:tä. Käyttävät GitHub REST APIa ja `git`-komentoja.

### `.farm/runners/requirements.txt`
```
requests>=2.32.3
```

### `.farm/runners/utils.py`
```python
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
        raise RuntimeError(f"Command failed: {cmd}
{res.stdout}
{res.stderr}")
    return (res.stdout or "").strip()
```

### `.farm/runners/orchestrator.py`
```python
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
```

### `.farm/runners/open_pr.py`
```python
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
```

---

## 4) Policies & Prompts

### `.farm/policies/arch.md`
```md
# Architecture Principles
- Prefer simple, composable modules; avoid global state.
- Backend: Node 22.x, AWS CDK v2, least‑privilege IAM.
- React: Type‑safe components, no implicit any, hooks over classes.
- Observability: logs with correlation IDs; avoid noisy logs.
- Public APIs: validate input, consistent errors, rate‑limit capable.
```

### `.farm/policies/security.md`
```md
# Security Policy (Farm)
- No secrets in code, tests, or commits. Use env/Secrets Manager.
- Denylist patterns: passwords, tokens, private keys.
- Dependencies: run `npm audit` weekly, pin critical patches.
- LLM Redaction: mask emails, tokens, PII before agent context.
```

### `.farm/policies/coding-standards.md`
```md
# Coding Standards
- TypeScript strict, ES2022, no `any` unless justified.
- ESLint + Prettier mandatory; CI fails on errors.
- Tests: `*.spec.ts(x)` colocated; keep fast; coverage targets evolve.
- Commit style: conventional commits (feat/fix/chore/docs/refactor/test/build/ci).
```

### `.farm/policies/reviewer-checklist.md`
```md
# Reviewer Checklist
- [ ] Input validation and error handling
- [ ] Security: authZ/authN, secrets, logs
- [ ] Performance and DX
- [ ] Tests cover success + failures
- [ ] Docs/CHANGELOG updated
```

### `.farm/prompts/planner.md`
```md
You are Planner. Decompose the ticket into concrete file edits (paths), outline tests, and note risks. Output: markdown list of file diffs to create.
```

### `.farm/prompts/codegen.md`
```md
You are CodeGen. Produce minimal diffs that compile and pass tests. Keep changes scoped. Never hardcode secrets. Always include unit tests.
```

### `.farm/prompts/reviewer.md`
```md
You are Reviewer. Critique diffs with a focus on security, standards, and regressions. Return actionable patch suggestions.
```

---

## 5) RAG Stubs

### `.farm/tools/rag/README.md`
```md
This folder hosts a lightweight indexer hook. Start by listing file patterns in patterns.txt and running index-local.sh to produce a plain text bundle for agents.
```

### `.farm/tools/rag/patterns.txt`
```
README.md
**/*.md
backend/src/**/*.ts
frontend/src/**/*.ts*
esp32/**/src/**/*.cpp
**/*.openapi.*
```

### `.farm/tools/rag/index-local.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail
OUT=.farm/tools/rag/corpus.txt
> "$OUT"
while read -r pattern; do
  rg --no-heading --line-number "$pattern" | sed 's/^/>> /' >> "$OUT" || true
done < .farm/tools/rag/patterns.txt
echo "Wrote $OUT"
```

---

## 6) Static Analysis Configs

### `.semgrep.yml`
```yaml
rules:
  - id: no-secrets-in-code
    languages: [generic]
    message: Potential secret detected
    severity: ERROR
    patterns:
      - pattern-regex: "(?i)(api[_-]?key|secret|private[_-]?key|passwd|password|token)\s*[:=]\s*['\"]?[A-Za-z0-9_\-]{12,}"
  - id: node-child-process-shell
    languages: [javascript, typescript]
    message: Avoid unsafe shell execution; sanitize inputs
    severity: WARNING
    pattern: exec*(...)
```

### `.gitleaks.toml`
```toml
title = "JT-DYNAMIX Gitleaks"
[rules.allowlist]
paths = ["^\.farm/tools/rag/corpus.txt$"]
[[rules]]
id = "generic-api-key"
regex = '''(?i)(api[_-]?key|secret|token)[=:]\s*['\"]?[A-Za-z0-9_\-]{16,}'''
entropy = 3.5
```

### `sonar-project.properties`
```properties
sonar.organization=${env:SONAR_ORG}
sonar.projectKey=${env:SONAR_PROJECT_KEY}
sonar.sources=backend/src,frontend/src
sonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,backend/src/cdk/**
sonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info
sonar.typescript.lcov.reportPaths=backend/coverage/lcov.info
sonar.sourceEncoding=UTF-8
```

---

## 7) Readme for Operators

### `README.FARM.md`
```md
# How to use the Farm

## Trigger
Comment on an issue: `/farm run`
The workflow creates/updates a branch `farm/<ISSUE>-<slug>` and drafts a PR.

## Quality Gates
PR must pass: lint, tests, Gitleaks, Semgrep, Sonar.

## Secrets Required
- SONAR_TOKEN (repo secret)
- SONAR_ORG (repo/org variable)
- SONAR_PROJECT_KEY (repo/org variable)

## Local dev
- Node 22+, pnpm or npm
- gh CLI authenticated: `gh auth login`

## Extend with LLMs
Wire your preferred models inside `.farm/runners/orchestrator.js` after step 3. Use `.farm/prompts/*` and `.farm/tools/rag/corpus.txt` as context.
```

---

## 8) Suggested package.json scripts (optional)
Add to root `package.json` if you want unified commands:

```json
{
  "scripts": {
    "lint": "npm -w backend -s run lint && npm -w frontend -s run lint",
    "test": "npm -w backend -s run test && npm -w frontend -s run test",
    "rag:index": "bash ./.farm/tools/rag/index-local.sh"
  }
}
```

---

## 9) First‑run Checklist
- Commit all files above.
- Set repo secrets: **SONAR_TOKEN**, repo/org vars: **SONAR_ORG**, **SONAR_PROJECT_KEY**.
- Ensure backend/frontend have working `lint` and `test` scripts producing coverage to `backend/coverage/lcov.info` and `frontend/coverage/lcov.info`.
- Create an issue and comment `/farm run`.
- Observe: branch created → draft PR → pr-guard runs.

---

### Notes for JT‑DYNAMIX
- Backend: Node 22 and CDK v2 already assumed; Lambda tests should output coverage to `backend/coverage/lcov.info` (Vitest/Jest ok).
- Frontend: Vite + Vitest coverage to `frontend/coverage/lcov.info`.
- ESP32: tests are optional; you can later add PlatformIO CI.

---

**Done.** Drop these into the repo root and push. Then open a test issue and type `/farm run`. The system will bootstrap a branch and draft a PR with a seed plan ready for agentified implementation. 


---

## 10) Repo‑specific PR bundles (dashboard, backend, board)
Below are **ready‑to‑commit** file sets and PR texts for each workspace. Create one branch per PR (commands included). If your repo already has some of these files, merge carefully.

### A) Dashboard (frontend)
**Branch name**: `farm/dashboard-bootstrap`

**Commands**
```bash
git checkout -b farm/dashboard-bootstrap
# Files below → add to repo, then:
git add .
git commit -m "farm(frontend): bootstrap farm gates, lint/test/coverage"
git push -u origin farm/dashboard-bootstrap
```

**Files**

`frontend/package.json` (merge scripts)
```jsonc
{
  "scripts": {
    "lint": "eslint --ext .ts,.tsx src",
    "test": "vitest run --coverage",
    "test:watch": "vitest",
    "build": "vite build"
  }
}
```

`frontend/vitest.config.ts`
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    coverage: {
      reporter: ['lcov', 'text-summary'],
      reportsDirectory: 'coverage'
    }
  }
})
```

`frontend/.eslintrc.cjs`
```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  settings: { react: { version: 'detect' } },
}
```

`frontend/src/smoke.spec.ts`
```ts
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('runs', () => expect(1 + 1).toBe(2))
})
```

**PR title**: `farm(frontend): enable lint/test/coverage for PR gates`

**PR body**
- Adds Vitest + coverage → `frontend/coverage/lcov.info`
- ESLint baseline for TS/React
- Ensures farm PR‑gates can read coverage

---

### B) Backend
**Branch name**: `farm/backend-bootstrap`

**Commands**
```bash
git checkout -b farm/backend-bootstrap
# Files below → add to repo, then:
git add .
git commit -m "farm(backend): jest+ts-jest coverage, scripts, quality gates"
git push -u origin farm/backend-bootstrap
```

**Files**

`backend/package.json` (merge scripts)
```jsonc
{
  "scripts": {
    "lint": "eslint --ext .ts src",
    "test": "jest --coverage",
    "build": "tsc -p tsconfig.json"
  },
  "devDependencies": {
    "jest": "^29",
    "ts-jest": "^29",
    "@types/jest": "^29"
  }
}
```

`backend/jest.config.ts`
```ts
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text-summary'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1'
  }
}
export default config
```

`backend/src/smoke.spec.ts`
```ts
describe('smoke', () => {
  it('runs', () => {
    expect(true).toBe(true)
  })
})
```

**Optional** (if not present): `backend/.eslintrc.cjs`
```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
}
```

**PR title**: `farm(backend): enable Jest coverage + ESLint for PR gates`

**PR body**
- Adds ts‑jest setup
- Produces `backend/coverage/lcov.info`
- Aligns moduleNameMapper with `src/` alias

---

### C) Board (esp32 / PlatformIO)
**Branch name**: `farm/board-bootstrap`

**Commands**
```bash
git checkout -b farm/board-bootstrap
# Files below → add to repo, then:
git add .
git commit -m "farm(board): platformio CI smoke test and unit test harness"
git push -u origin farm/board-bootstrap
```

**Files**

`.github/workflows/esp32-ci.yml`
```yaml
name: esp32-ci
on:
  pull_request:
    paths:
      - 'esp32/**'
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Python
        uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - name: Install PlatformIO
        run: pip install platformio
      - name: Build firmware
        working-directory: esp32
        run: pio run
      - name: Unit tests (native)
        working-directory: esp32
        run: pio test -e native || true
```

`esp32/test/test_smoke/test_main.cpp`
```cpp
#include <unity.h>
void test_truthy() { TEST_ASSERT_TRUE(true); }
int main(int, char**) {
  UNITY_BEGIN();
  RUN_TEST(test_truthy);
  return UNITY_END();
}
```

> Note: The board build uses your existing `platformio.ini`. The native env lets unit tests run on CI without hardware.

**PR title**: `farm(board): CI build + native unit test harness`

**PR body**
- Adds GitHub Action to build ESP32 and run native unit tests
- Provides a minimal Unity test to exercise the harness

---

## 11) Root‑level tweaks for PR gates
1. Keep **Sonar** coverage paths as in this starter: `frontend/coverage/lcov.info`, `backend/coverage/lcov.info`.
2. Ensure root `package.json` has helper scripts (optional):
```jsonc
{
  "scripts": {
    "lint": "npm -w backend run lint && npm -w frontend run lint",
    "test": "npm -w backend run test && npm -w frontend run test"
  }
}
```
3. Set repo secrets/vars: `SONAR_TOKEN`, `SONAR_ORG`, `SONAR_PROJECT_KEY`.

---

## 12) How to open the three PRs quickly
```bash
# Dashboard
git checkout -b farm/dashboard-bootstrap && git add frontend && git commit -m "farm(frontend): bootstrap" && git push -u origin HEAD
# Backend
git checkout -b farm/backend-bootstrap && git add backend && git commit -m "farm(backend): bootstrap" && git push -u origin HEAD
# Board
git checkout -b farm/board-bootstrap && git add .github/workflows esp32 && git commit -m "farm(board): CI + tests" && git push -u origin HEAD
```

After pushing, the `pr-guard.yml` and `esp32-ci.yml` will run automatically. Open the PRs or let the farm runner open them for you.

