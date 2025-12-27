"""Utilities for gathering project context snippets for the agents."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable, List

from .config import log

INCLUDED_SUFFIXES = {".py", ".md", ".txt", ".ts", ".tsx", ".cpp", ".h", ".ino", ".json", ".yaml", ".yml"}
EXCLUDED_FILE_NAMES = {"package-lock.json", ".gitignore"}
EXCLUDED_DIR_PARTS = {"venv", "node_modules", "__pycache__"}
IMPORTANT_AREAS = [
    "backend",      # AWS CDK + Lambda backend
    "dashboard",    # React dashboard
    "homepage",     # Marketing site
    "board",        # ESP32 firmware
    "agents",       # Automation scripts
]


def collect_project_context(root: Path, max_bytes: int = 20_000) -> str:
    """Collect snippets across the repository capped to ``max_bytes``."""
    snippets: List[str] = []
    total = 0

    for area in IMPORTANT_AREAS:
        area_path = root / area
        if not area_path.exists():
            continue
        log(f"[CTX] Scanning {area}/…")
        area_snippets, consumed = _collect_area_snippets(area_path, root, max_bytes, total)
        snippets.extend(area_snippets)
        total += consumed
        if total >= max_bytes:
            break

    if total < max_bytes:
        root_snippets, consumed = _collect_root_metadata(root, max_bytes, total)
        snippets.extend(root_snippets)
        total += consumed

    log(f"[CTX] Compiled {len(snippets)} snippets ({total} bytes)")
    return "\n".join(snippets)


def _collect_area_snippets(area_path: Path, root: Path, max_bytes: int, current_total: int) -> tuple[List[str], int]:
    snippets: List[str] = []
    consumed = 0
    area_budget = max_bytes // max(len(IMPORTANT_AREAS), 1)

    for file_path in _iter_candidate_files(area_path):
        snippet = _slice_file(file_path, root, max_bytes, current_total + consumed, area_budget - consumed)
        if not snippet:
            continue
        snippet_len = len(snippet)
        snippets.append(snippet)
        consumed += snippet_len
        if current_total + consumed >= max_bytes or consumed >= area_budget:
            break
    return snippets, consumed


def _collect_root_metadata(root: Path, max_bytes: int, current_total: int) -> tuple[List[str], int]:
    snippets: List[str] = []
    consumed = 0
    for path in sorted(root.glob("*")):
        if not path.is_file() or path.suffix.lower() not in {".md", ".json", ".yaml", ".yml"}:
            continue
        snippet = _slice_file(path, root, max_bytes, current_total + consumed, max_bytes - current_total - consumed)
        if not snippet:
            continue
        snippet_len = len(snippet)
        snippets.append(snippet)
        consumed += snippet_len
        if current_total + consumed >= max_bytes:
            break
    return snippets, consumed


def _iter_candidate_files(folder: Path) -> Iterable[Path]:
    for path in sorted(folder.rglob("*")):
        # On Windows some entries (notably in node_modules/.bin) can raise OSError
        # during stat() calls triggered by is_dir()/is_file(). Avoid probing them.
        if any(part in EXCLUDED_DIR_PARTS for part in path.parts):
            continue

        try:
            if path.is_dir():
                continue
        except OSError:
            # Skip unreadable/broken entries
            continue
        if path.suffix.lower() not in INCLUDED_SUFFIXES:
            continue
        if path.name in EXCLUDED_FILE_NAMES:
            continue
        yield path


def _slice_file(file_path: Path, root: Path, max_bytes: int, current_total: int, remaining_budget: int) -> str:
    if remaining_budget <= 0 or current_total >= max_bytes:
        return ""
    try:
        content = file_path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return ""
    snippet_size = min(len(content), max(remaining_budget, 0))
    if snippet_size <= 0:
        return ""
    snippet = content[:snippet_size]
    header = f"# File: {file_path.relative_to(root)}\n"
    return f"{header}{snippet}\n"
