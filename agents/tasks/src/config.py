import os
from pathlib import Path
from typing import Optional

import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables once so every module can rely on them
load_dotenv()

# --- Basic configuration --------------------------------------------------
VERBOSE = os.getenv("VERBOSE", "1").lower() not in {"0", "false"}
MAX_IDEAS = int(os.getenv("MAX_IDEAS", "15"))
MAX_TICKETS = int(os.getenv("MAX_TICKETS", "3"))
DEFAULT_RATE_LIMIT_DELAY = int(os.getenv("RATE_LIMIT_DELAY_SECONDS", "30"))
ENABLE_CODER_AGENT = os.getenv("ENABLE_CODER_AGENT", "1").lower() not in {"0", "false"}
ENABLE_AUTO_IMPLEMENT = os.getenv("ENABLE_AUTO_IMPLEMENT", "0").lower() not in {"0", "false"}
ENABLE_AUTO_IMPLEMENT_GIT = os.getenv("ENABLE_AUTO_IMPLEMENT_GIT", "0").lower() not in {"0", "false"}
AUTO_IMPLEMENT_GIT_REMOTE = os.getenv("AUTO_IMPLEMENT_GIT_REMOTE", "origin")
AUTO_IMPLEMENT_GIT_BASE = os.getenv("AUTO_IMPLEMENT_GIT_BASE", "main")
ENABLE_AUTO_PR = os.getenv("ENABLE_AUTO_PR", "0").lower() not in {"0", "false"}
PR_BASE = os.getenv("PR_BASE", "main")
ENABLE_PRE_COMMIT_CHECKS = os.getenv("ENABLE_PRE_COMMIT_CHECKS", "0").lower() not in {"0", "false"}
ENABLE_PR_DESCRIPTION_GENERATION = os.getenv("ENABLE_PR_DESCRIPTION_GENERATION", "0").lower() not in {"0", "false"}
PRE_COMMIT_COMMANDS_RAW = os.getenv("PRE_COMMIT_COMMANDS", "").strip()
PRE_COMMIT_COMMANDS: list[list[str]] = []
if PRE_COMMIT_COMMANDS_RAW:
    # Commands separated by ';' and arguments by space
    for segment in PRE_COMMIT_COMMANDS_RAW.split(";"):
        cleaned = segment.strip()
        if cleaned:
            PRE_COMMIT_COMMANDS.append(cleaned.split())

# --- Paths ----------------------------------------------------------------
TASK_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = (TASK_DIR / Path("../../")).resolve()
DEFINITIONS_DIR = TASK_DIR.parent / "definitions"
TICKETS_DIR = TASK_DIR / "tickets"
CODER_OUTPUT_DIR = TASK_DIR / "coder_output"

# Ensure output directories exist for downstream writers
for folder in (TICKETS_DIR, CODER_OUTPUT_DIR):
    folder.mkdir(exist_ok=True)


def log(message: str) -> None:
    """Lightweight logging helper that honours VERBOSE."""
    if VERBOSE:
        print(message)


def _load_instruction(path: Path, fallback: str) -> str:
    try:
        return path.read_text(encoding="utf-8").strip() or fallback
    except FileNotFoundError:
        return fallback


# --- Gemini model bootstrap -----------------------------------------------
API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY is missing. Set it in the .env file before running agents.")

genai.configure(api_key=API_KEY)

innovator_instructions = _load_instruction(
    DEFINITIONS_DIR / "innovator_instructions.md",
    "You are the Innovator: generate bold, concrete improvement ideas for the project.",
)
critic_instructions = _load_instruction(
    DEFINITIONS_DIR / "critic_instructions.md",
    "You are the Critic: evaluate ideas based on realism, value, and scope.",
)
coder_instructions = _load_instruction(
    DEFINITIONS_DIR / "coder_instructions.md",
    "You are the Coder: produce safe, incremental code changes that implement the ticket requirements.",
)

innovator_model = genai.GenerativeModel(
    model_name="gemini-pro-latest",
    system_instruction=innovator_instructions,
)
critic_model = genai.GenerativeModel(
    model_name="gemini-pro-latest",
    system_instruction=critic_instructions,
)
coder_model = genai.GenerativeModel(
    model_name="gemini-pro-latest",
    system_instruction=coder_instructions,
)

log(
    f"[INIT] AUTO_IMPLEMENT={'ON' if ENABLE_AUTO_IMPLEMENT else 'OFF'} | GIT_AUTO={'ON' if ENABLE_AUTO_IMPLEMENT_GIT else 'OFF'} | PRE_COMMIT={'ON' if ENABLE_PRE_COMMIT_CHECKS else 'OFF'} | PR_DESC={'ON' if ENABLE_PR_DESCRIPTION_GENERATION else 'OFF'}"
)

log("[INIT] Configuration and models ready.")
