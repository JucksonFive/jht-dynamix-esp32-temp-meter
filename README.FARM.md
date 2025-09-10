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
