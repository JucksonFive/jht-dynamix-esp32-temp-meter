from pathlib import Path
import os

import pytest

from agents.tasks.src.ai_core import _extract_ideas, _extract_json  # type: ignore
from agents.tasks.src.file_utils import _slugify, save_ticket_to_file  # type: ignore
from agents.tasks.src.history import load_previous_ideas  # type: ignore
from agents.tasks.src.config import TICKETS_DIR  # type: ignore

IDEA_TEXT = """Ideas:\n1. Implement structured logging\n2. Add metrics collection\n3. Refactor data layer\n"""

CRITIC_JSON_TEXT = "RANDOM PREFIX {\n  \"verdict\": \"accept\",\n  \"rationale\": \"Looks good\",\n  \"specific_feedback\": \"None\",\n  \"suggested_improvements\": \"N/A\"\n} TRAILING"  # noqa


def test_extract_ideas_basic():
    ideas = _extract_ideas(IDEA_TEXT)
    assert len(ideas) == 3
    assert ideas[0].startswith("Implement structured logging")


def test_extract_json_basic():
    data = _extract_json(CRITIC_JSON_TEXT)
    assert data.get("verdict") == "accept"
    assert "rationale" in data


def test_slugify_limits():
    original = "This is A Title With Many Characters & Symbols !!!"
    slug = _slugify(original)
    assert slug.startswith("this-is-a-title")
    assert len(slug) <= 50


def test_save_ticket_and_history(tmp_path: Path, monkeypatch):
    # Redirect tickets dir to temp
    monkeypatch.setenv("MAX_TICKETS", "5")
    monkeypatch.setenv("MAX_IDEAS", "5")
    # Use temp directory as root for tickets
    monkeypatch.setenv("GEMINI_API_KEY", "dummy")
    os.chdir(tmp_path)
    # Create faux tickets directory
    local_tickets = tmp_path / "agents" / "tasks" / "tickets"
    local_tickets.mkdir(parents=True)
    # Create two tickets
    t1 = save_ticket_to_file("## Ticket: First Feature\nDetails", 1)
    t2 = save_ticket_to_file("## Ticket: Second Feature\nDetails", 2)
    assert t1.is_file() and t2.is_file()
    # Monkeypatch TICKETS_DIR reference if needed (already used inside save)
    prev = load_previous_ideas()
    assert "First Feature" in prev[0] or "first-feature" in prev[0].lower()
    assert len(prev) >= 2
