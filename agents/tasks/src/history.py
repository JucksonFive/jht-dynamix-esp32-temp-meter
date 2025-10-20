"""Helpers for reading ticket history so agents can avoid duplicates."""

from __future__ import annotations

from pathlib import Path
from typing import List

from .config import TICKETS_DIR, log


def load_previous_ideas() -> List[str]:
    titles: List[str] = []
    if not TICKETS_DIR.exists():
        log("[HISTORY] Ticket folder missing; treating as empty history.")
        return titles

    try:
        for ticket_file in sorted(TICKETS_DIR.glob("*.md")):
            title = _extract_title(ticket_file)
            if title:
                titles.append(title)
    except Exception as exc:  # noqa: BLE001
        log(f"[WARNING] Could not load previous ideas: {exc}")

    if titles:
        log(f"[HISTORY] Loaded {len(titles)} previous idea titles")
    else:
        log("[HISTORY] No previous ideas found")
    return titles


def _extract_title(ticket_file: Path) -> str:
    try:
        for line in ticket_file.read_text(encoding="utf-8").splitlines():
            if line.startswith("# ") or line.startswith("## "):
                title = line.lstrip("# ").strip()
                if ":" in title:
                    title = title.split(":", 1)[1].strip()
                return title
    except (UnicodeDecodeError, OSError):
        return ""
    return ""
