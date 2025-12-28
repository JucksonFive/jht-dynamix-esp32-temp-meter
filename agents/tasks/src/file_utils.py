from __future__ import annotations

from pathlib import Path

from .config import CODER_OUTPUT_DIR, TICKETS_DIR


def save_ticket_to_file(ticket_content: str, ticket_number: int) -> Path:
    """Persist a ticket to ``tickets/`` with a tidy filename."""
    title_line = _extract_title(ticket_content)
    safe_title = _slugify(title_line or f"ticket-{ticket_number}")
    filename = f"{ticket_number:03d}-{safe_title}.md"
    output_path = TICKETS_DIR / filename
    output_path.write_text(ticket_content, encoding="utf-8")
    return output_path


def _extract_title(content: str) -> str:
    for line in content.splitlines():
        if line.startswith("## Ticket"):
            return line.split(":", 1)[1].strip() if ":" in line else line
    return ""


def _slugify(value: str) -> str:
    sanitized = "".join(char for char in value if char.isalnum() or char in {" ", "-", "_"})
    return sanitized.strip().replace(" ", "-").lower()[:50] or "ticket"
def save_coder_output(ticket_number: int, content: str, ticket_content: str = "") -> Path:
    title_line = _extract_title(ticket_content) if ticket_content else ""
    safe_title = _slugify(title_line) if title_line else "coder-plan"
    filename = f"{ticket_number:03d}-{safe_title}-coder-plan.md"
    output_path = CODER_OUTPUT_DIR / filename
    output_path.write_text(content, encoding="utf-8")
    return output_path
