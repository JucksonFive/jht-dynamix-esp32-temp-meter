"""Shared Gemini interaction helpers for the agents."""

from __future__ import annotations

import json
import random
import re
import time
from datetime import datetime
from typing import Dict, List, Optional

from google.api_core.exceptions import ResourceExhausted

from .config import (
    DEFAULT_RATE_LIMIT_DELAY,
    coder_model,
    critic_model,
    innovator_model,
    log,
)


def generate_raw_ideas(n: int, project_context: str, previous_ideas: List[str]) -> List[str]:
    focus_areas = [
        "User interface features and improvements",
        "Testing and quality assurance",
        "Observability and monitoring",
        "Security and compliance",
        "Performance optimization",
        "Developer experience",
        "Infrastructure reliability",
        "Cost optimization",
        "Documentation and onboarding",
        "Firmware efficiency",
        "Data pipeline resilience",
        "API design and usability",
        "Automation and tooling",
    ]
    selected = random.sample(focus_areas, k=min(3, max(2, n if n < 3 else 3)))
    focus_hint = f"Prioritise these areas: {', '.join(selected)}."
    timestamp_context = f"Session timestamp: {datetime.now().isoformat()}"
    avoid_repetition = ""
    if previous_ideas:
        previous_lines = "\n".join(f"- {idea}" for idea in previous_ideas[:10])
        avoid_repetition = f"\nAVOID repeating these previous ideas:\n{previous_lines}"

    prompt = f"""
Study the project context and generate {n} prioritised development ideas in the format:
IDEA <number>: <short title> - <1 sentence description>

{focus_hint}
Focus on concrete value-adding improvements (tests, performance, DX, security, monitoring, architecture).
Be creative and consider different aspects. Generate FRESH ideas not covered before.
{avoid_repetition}

{timestamp_context}

Context:
{project_context}
""".strip()

    log(f"[IDEAS] Generating {n} ideas with focus on: {', '.join(selected)}")
    response = _call_gemini(innovator_model, prompt, "idea generation", fallback="IDEA 1: Improve error handling in AI script")
    return _extract_ideas(response, n)


def critique_idea(idea: str) -> Dict[str, str]:
    prompt = f"""
Evaluate the following development idea and respond in JSON with keys:
- verdict: "accept" or "needs_improvement"
- rationale: reasoning for your decision
- specific_feedback: concrete feedback on what's good and what needs improvement
- suggested_improvements: list of concrete improvement suggestions

Idea:
"{idea}"

Acceptance criteria: clear value, implementable in < 1 week, can be scoped to small tasks.
If the idea doesn't meet criteria, provide constructive feedback for improvement.
""".strip()

    default = {
        "verdict": "needs_improvement",
        "rationale": "API error during critique",
        "specific_feedback": "",
        "suggested_improvements": "",
    }
    response = _call_gemini(critic_model, prompt, "idea critique", fallback=json.dumps(default))
    try:
        payload = _extract_json(response) or default
        return {key: str(value) for key, value in payload.items()}
    except json.JSONDecodeError:
        log(f"[WARNING] Critic response was not JSON: {response[:200]}")
        default["rationale"] = response[:400]
        return default


def improve_idea(original_idea: str, feedback: Dict[str, str]) -> str:
    prompt = f"""
Your original idea was:
"{original_idea}"

The critic provided the following feedback:
Rationale: {feedback.get('rationale', '')}
Specific feedback: {feedback.get('specific_feedback', '')}
Improvement suggestions: {feedback.get('suggested_improvements', '')}

Develop the idea based on the critic's feedback. Respond in the format:
IMPROVED IDEA: <new improved version of the idea>

Focus on making the idea more concrete, more scoped, and more implementable.
""".strip()

    response = _call_gemini(innovator_model, prompt, "idea improvement", fallback=original_idea)
    if "IMPROVED IDEA:" in response:
        return response.split("IMPROVED IDEA:", 1)[1].strip()
    return response or original_idea


def create_ticket(idea: str, critique: Dict[str, str], idx: int) -> str:
    prompt = f"""
Create a clear development ticket from the approved idea.
Idea: {idea}
Rationale: {critique.get('rationale', '')}
Format as MARKDOWN:
## Ticket {idx}: <title>
Brief description.
### Background
### Benefits
### Implementation
### Tasks
- [ ] ...
### Acceptance Criteria
- ...
Keep it concrete and prioritised.
""".strip()

    fallback = f"## Ticket {idx}: (error creating)\nError: unable to create ticket.\n"
    return _call_gemini(innovator_model, prompt, f"ticket generation #{idx}", fallback=fallback)


def propose_code_changes(ticket_markdown: str, project_context: str) -> str:
    """Ask the coder model to produce a plan plus diff for the ticket."""
    prompt = f"""
You are assisting with an existing TypeScript/Python/Embedded project. A ticket is provided.

Ticket:
{ticket_markdown}

Project context snippets:
{project_context}

Produce a Markdown response with the following sections:
1. Summary – 2 sentences describing the change.
2. Implementation Plan – numbered list of small, safe steps.
3. Code Changes – provide unified diffs for any files that need edits. Use ```diff fenced blocks.
4. Tests – list manual or automated checks to run.

Only propose changes that are realistically implementable without breaking the build. If the ticket lacks information, note the missing details and stop.
""".strip()

    fallback = "Unable to propose code changes; insufficient context or quota."
    return _call_gemini(coder_model, prompt, "code implementation", fallback=fallback)


# ---------------------------------------------------------------------------
# Internal helpers


def _call_gemini(model, prompt: str, label: str, fallback: str, attempts: int = 3) -> str:
    for attempt in range(1, attempts + 1):
        try:
            log(f"[{model.model_name.upper()}] Calling API for {label} (attempt {attempt}/{attempts})…")
            response = model.generate_content(prompt)
            log(f"[{model.model_name.upper()}] API call succeeded")
            return response.text
        except ResourceExhausted as exc:
            message = str(exc)
            if _is_daily_quota_exceeded(message):
                log(f"[RATE] Daily quota exhausted for model {model.model_name}. Aborting {label}.")
                return fallback
            delay = _extract_retry_delay_seconds(message) or DEFAULT_RATE_LIMIT_DELAY
            log(f"[RATE] Rate limit hit during {label}; sleeping for {delay}s")
            time.sleep(delay)
        except KeyboardInterrupt:
            log(f"[ABORT] Interrupted during {label}")
            raise
        except Exception as exc:  # noqa: BLE001
            log(f"[ERROR] Unexpected failure during {label}: {exc}")
            time.sleep(DEFAULT_RATE_LIMIT_DELAY)
    return fallback


def _extract_ideas(raw_response: str, limit: int) -> List[str]:
    ideas: List[str] = []
    for line in raw_response.splitlines():
        candidate = line.strip()
        if not candidate:
            continue
        if candidate.lower().startswith("idea"):
            parts = candidate.split(":", 1)
            idea = parts[1].strip() if len(parts) > 1 else candidate
            ideas.append(idea)
        elif len(ideas) < limit:
            ideas.append(candidate)
        if len(ideas) >= limit:
            break
    return ideas or [raw_response]


def _extract_json(response: str) -> Optional[Dict[str, str]]:
    match = re.search(r"\{.*\}", response, re.DOTALL)
    if not match:
        return None
    return json.loads(match.group(0))


def _extract_retry_delay_seconds(message: str) -> Optional[int]:
    match = re.search(r"retry_delay\s*\{\s*seconds:\s*(\d+)", message)
    if match:
        return int(match.group(1))
    match = re.search(r"retry in ([0-9]+(?:\.[0-9]+)?)s", message)
    if match:
        return int(float(match.group(1)))
    return None


def _is_daily_quota_exceeded(message: str) -> bool:
    return "GenerateRequestsPerDayPerProjectPerModel" in message
