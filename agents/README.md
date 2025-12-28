# Agents Overview

This folder hosts autonomous / semi-autonomous agents that iterate on project improvement.

## Pipeline

1. Innovator generates idea candidates.
2. Critic iteratively refines (up to 3 rounds) until accept or abandon.
3. Ticket is created and saved under `agents/tasks/tickets/`.
4. Coder produces an implementation plan + diffs (stored under `agents/tasks/coder_output/`).
5. (Optional) Auto-implementation applies diffs and (optionally) creates a git branch & commit.
6. (Optional) Implementer can open a PR from existing `coder_output` plan(s).

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `MAX_IDEAS` | 15 | Upper bound ideas per round. |
| `MAX_TICKETS` | 3 | Max accepted tickets per run. |
| `ENABLE_CODER_AGENT` | 1 | Toggle coder plan generation. |
| `ENABLE_AUTO_IMPLEMENT` | 0 | Apply coder diffs after dry-run validation. |
| `ENABLE_AUTO_IMPLEMENT_GIT` | 0 | Also create branch, commit, push. |
| `AUTO_IMPLEMENT_GIT_BASE` | main | Base branch for new feature branches. |
| `AUTO_IMPLEMENT_GIT_REMOTE` | origin | Remote used for push. |
| `ENABLE_AUTO_PR` | 0 | After push, open (or reuse) a PR for the new branch. |
| `GITHUB_TOKEN` | (none) | Token for PR creation (used by implementer task). |
| `REPO` | (none) | Repo in `owner/name` format (used by implementer task). |
| `PR_BASE` | main | Base branch for PRs (used by implementer task). |
| `RATE_LIMIT_DELAY_SECONDS` | 30 | Base delay for Gemini rate-limit retries. |

### Test Writer (LLM) variables

The GitHub workflow `.github/workflows/write-tests.yml` can optionally generate tests using an LLM.

| Variable | Default | Purpose |
|----------|---------|---------|
| `TEST_WRITER_MODE` | `stub` | `stub` creates smoke tests, `auto` tries LLM and falls back, `llm` requires LLM and fails otherwise. |
| `GEMINI_API_KEY` | (none) | Gemini API key from Google AI Studio (secret). Required for `auto`/`llm`. |
| `GEMINI_MODEL` | `gemini-pro-latest` | Gemini model name (repo variable). |

Local run:

```bash
TEST_WRITER_MODE=auto GEMINI_API_KEY=... python agents/tasks/generate_tests.py
```

## Auto-Implementation Safety

Diffs are first validated (`patch --dry-run`). Only if validation passes do they apply. Git automation creates branch `ticket-<NNN>-<slug>` and commit message `ticket-<NNN>: auto-implement <slug>` truncated to 72 chars.

## Extensibility

Planned future enhancements:
- Test auto-run before commit.
- PR description generator.
- Conflict detection across multiple plans.

## Running

```bash
# Example: enable auto implement and git
export ENABLE_AUTO_IMPLEMENT=1
export ENABLE_AUTO_IMPLEMENT_GIT=1
python agents/tasks/thinker.py
```

## Implement coder_output → branch → PR

This task consumes existing coder plans under `agents/tasks/coder_output/` and does:
dry-run → apply → branch+commit+push → open PR.

```bash
# Single plan
GITHUB_TOKEN=... REPO=Hizaguru/jht-dynamix-esp32-temp-meter \
python agents/tasks/implement_coder_output_to_pr.py --plan agents/tasks/coder_output/001-...-coder-plan.md

# All plans
GITHUB_TOKEN=... REPO=Hizaguru/jht-dynamix-esp32-temp-meter \
python agents/tasks/implement_coder_output_to_pr.py --all
```

## Manual Patch Application

```bash
python agents/tasks/apply_coder_plan.py --plan agents/tasks/coder_output/001-coder-plan.md --apply
```

## Notes

Ensure `patch` is installed (Ubuntu: `sudo apt install patch`). Git automation assumes a clean working tree.

## Running Tests

Unit tests (pytest) for executor and parsers live under `agents/tasks/tests/`.

Example run:

```bash
cd agents/tasks
pytest -q
```

To run a single test file:

```bash
pytest tests/test_executor.py::test_apply_coder_plan_dry_run_and_apply -vv
```

If you need to simulate Gemini responses without calling the API, monkeypatch `_call_gemini` in `src/ai_core.py` inside a test fixture.
