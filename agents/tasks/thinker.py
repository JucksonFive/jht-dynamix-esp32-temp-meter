import os
from pathlib import Path
from typing import List, Dict
import textwrap
import time
import google.generativeai as genai
import json
import random
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)
    
def _load_instruction(path: Path, fallback: str) -> str:
    try:
        return path.read_text(encoding="utf-8").strip() or fallback
    except FileNotFoundError:
        return fallback

# Define paths (TASK_DIR needed before loading instructions)
TASK_DIR = Path(__file__).resolve().parent
VERBOSE = os.getenv("VERBOSE", "1") not in {"0", "false", "False"}

def log(msg: str):
    if VERBOSE:
        print(msg)

log(f"[INIT] Task directory: {TASK_DIR}")
DEFINITIONS_DIR = TASK_DIR.parent / "definitions"
log(f"[INIT] Definitions directory: {DEFINITIONS_DIR}")
innovator_instructions = _load_instruction(
    DEFINITIONS_DIR / "innovator_instructions.md",
    "You are the Innovator: generate bold, concrete improvement ideas for the project.",
)
critic_instructions = _load_instruction(
    DEFINITIONS_DIR / "critic_instructions.md",
    "You are the Critic: evaluate ideas based on realism, value, and scope.",
)


innovator_model = genai.GenerativeModel(
    model_name="gemini-pro-latest",  # Use this stable name
    system_instruction=innovator_instructions,
)
critic_model = genai.GenerativeModel(
    model_name="gemini-pro-latest",  # And here too
    system_instruction=critic_instructions,
)

PROJECT_ROOT = (TASK_DIR / Path("../../")).resolve()
log(f"[INIT] Project root resolved to: {PROJECT_ROOT}")


def collect_project_context(root: Path, max_bytes: int = 20000) -> str:
    """Collects key project texts for the model from all project areas."""
    chunks = []
    total_bytes = 0
    
    # Define important project areas to ensure coverage
    important_areas = [
        "backend",     # AWS CDK + Lambdas
        "dashboard",   # React frontend
        "homepage",    # Landing page
        "board",       # ESP32 firmware
        "agents",      # AI automation scripts
    ]
    
    # First, collect from important areas to ensure representation
    for area in important_areas:
        area_path = root / area
        if not area_path.exists():
            continue
            
        log(f"[CTX] Scanning {area}/...")
        area_files = []
        
        for path in sorted(area_path.glob("**/*")):
            if path.is_dir() or "venv" in path.parts or "node_modules" in path.parts:
                continue
            if path.suffix.lower() not in {".py", ".md", ".txt", ".ts", ".tsx", ".cpp", ".h", ".ino", ".json"}:
                continue
            if path.name in {"package-lock.json", ".gitignore"}:
                continue
                
            try:
                content = path.read_text(encoding="utf-8")
                # Take a reasonable snippet from each file
                snippet_size = min(len(content), max_bytes // (len(important_areas) * 3))
                snippet = content[:snippet_size]
                
                file_info = f"# File: {path.relative_to(root)}\n{snippet}\n"
                area_files.append((len(file_info), file_info))
                
            except (UnicodeDecodeError, OSError):
                continue
        
        # Sort by size and add largest files first from this area
        area_files.sort(key=lambda x: x[0], reverse=True)
        area_budget = max_bytes // len(important_areas)
        area_bytes = 0
        
        for file_size, file_content in area_files:
            if total_bytes + file_size > max_bytes or area_bytes + file_size > area_budget:
                break
            chunks.append(file_content)
            total_bytes += file_size
            area_bytes += file_size
            
        log(f"[CTX] {area}: {len([f for s, f in area_files if total_bytes >= s])} files, {area_bytes} bytes")
    
    # Add any remaining important files from root
    for path in sorted(root.glob("*")):
        if path.is_file() and path.suffix.lower() in {".md", ".json", ".yaml", ".yml"}:
            if total_bytes >= max_bytes:
                break
            try:
                content = path.read_text(encoding="utf-8")
                snippet = content[:min(len(content), max_bytes - total_bytes)]
                file_info = f"# File: {path.relative_to(root)}\n{snippet}\n"
                chunks.append(file_info)
                total_bytes += len(file_info)
            except (UnicodeDecodeError, OSError):
                continue
    
    return "\n".join(chunks)


MAX_IDEAS = int(os.getenv("MAX_IDEAS", "15"))
MAX_TICKETS = int(os.getenv("MAX_TICKETS", "3"))

log("[CTX] Collecting project context...")
_t0 = time.time()
project_context = collect_project_context(PROJECT_ROOT)
log(f"[CTX] Context collected ({len(project_context)} chars) in {time.time()-_t0:.2f}s")

# Load previous ideas to avoid repetition
def load_previous_ideas() -> List[str]:
    """Load previously generated ideas to avoid repetition."""
    tickets_dir = TASK_DIR / "tickets"
    previous_ideas = []
    if tickets_dir.exists():
        try:
            # Read all markdown files in tickets directory
            for ticket_file in tickets_dir.glob("*.md"):
                content = ticket_file.read_text(encoding="utf-8")
                # Extract ticket title from first markdown header
                for line in content.splitlines():
                    if line.startswith("# ") or line.startswith("## "):
                        title = line.lstrip("# ").strip()
                        if ":" in title:
                            title = title.split(":", 1)[1].strip()
                        if title:
                            previous_ideas.append(title)
                        break
        except Exception as e:
            log(f"[WARNING] Could not load previous ideas: {e}")
    return previous_ideas

previous_ideas = load_previous_ideas()
if previous_ideas:
    log(f"[HISTORY] Found {len(previous_ideas)} previous ideas to avoid repeating")
else:
    log("[HISTORY] No previous ideas found")

def generate_raw_ideas(n: int, previous_ideas: List[str]) -> List[str]:
    # Add variety and randomness to idea generation
    focus_areas = [
        "testing and quality assurance",
        "observability and monitoring", 
        "security and compliance",
        "performance optimization",
        "developer experience",
        "infrastructure reliability", 
        "cost optimization",
        "documentation and onboarding",
        "firmware efficiency",
        "data pipeline resilience"
    ]
    
    # Randomly select 2-3 focus areas for this session
    selected_areas = random.sample(focus_areas, k=random.randint(2, 3))
    focus_hint = f"Prioritize these areas: {', '.join(selected_areas)}."
    
    # Add timestamp for uniqueness
    timestamp_context = f"Session timestamp: {datetime.now().isoformat()}"
    
    # Add previous ideas to avoid repetition
    avoid_repetition = ""
    if previous_ideas:
        avoid_repetition = "\nAVOID repeating these previous ideas:\n" + "\n".join(f"- {idea}" for idea in previous_ideas[:10])
    
    prompt = textwrap.dedent(f"""
        Study the project context and generate {n} prioritized development ideas in the format:
        IDEA <number>: <short title> - <1 sentence description>
        
        {focus_hint}
        Focus on concrete value-adding improvements (tests, performance, DX, security, monitoring, architecture).
        Be creative and consider different aspects. Generate FRESH ideas not covered before.
        {avoid_repetition}
        
        {timestamp_context}
        
        Context:
        {project_context}
    """)
    log(f"[IDEAS] Generating {n} ideas with focus on: {', '.join(selected_areas)}")
    t0 = time.time()
    try:
        rsp = innovator_model.generate_content(prompt)
        log(f"[IDEAS] Generation complete in {time.time()-t0:.2f}s")
    except Exception as e:
        log(f"[ERROR][IDEAS] Error in idea generation: {e}")
        return ["Improve error handling in AI script"]
    lines = [l.strip() for l in rsp.text.splitlines() if l.strip()]
    ideas: List[str] = []
    for line in lines:
        if line.lower().startswith("idea"):
            # Remove possible 'IDEA X:' prefix
            parts = line.split(':', 1)
            idea_text = parts[1].strip() if len(parts) > 1 else line
            ideas.append(idea_text)
    # fallback if parser didn't find any
    if not ideas:
        ideas = lines[:n]
    return ideas[:n]

def critique_idea(idea: str) -> Dict[str, str]:
    prompt = textwrap.dedent(f"""
        Evaluate the following development idea:
        "{idea}"
        
        Respond in JSON format with keys: 
        - verdict: "accept" (approve) or "needs_improvement" (requires improvement)
        - rationale: reasoning for your decision
        - specific_feedback: concrete feedback on what's good and what needs improvement in the idea
        - suggested_improvements: list of concrete improvement suggestions
        
        Acceptance criteria: clear value, implementable in < 1 week, can be scoped to small tasks.
        If the idea doesn't meet criteria, provide constructive feedback for improvement.
    """)
    log("[CRITIC] Evaluating idea...")
    t0 = time.time()
    try:
        rsp = critic_model.generate_content(prompt)
        log(f"[CRITIC] Evaluation complete in {time.time()-t0:.2f}s")
    except Exception as e:
        return {"verdict": "needs_improvement", "rationale": f"API error: {e}", "specific_feedback": "", "suggested_improvements": ""}
    text = rsp.text.strip()
    # Find first JSON block
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1:
        snippet = text[start:end+1]
        try:
            data = json.loads(snippet)
            return {k: str(v) for k,v in data.items()}
        except Exception:
            pass
    return {"verdict": "needs_improvement", "rationale": text[:400], "specific_feedback": "", "suggested_improvements": ""}

def improve_idea(original_idea: str, feedback: Dict[str, str]) -> str:
    """Improve the idea based on critic's feedback."""
    prompt = textwrap.dedent(f"""
        Your original idea was:
        "{original_idea}"
        
        The critic provided the following feedback:
        Rationale: {feedback.get('rationale', '')}
        Specific feedback: {feedback.get('specific_feedback', '')}
        Improvement suggestions: {feedback.get('suggested_improvements', '')}
        
        Develop the idea based on the critic's feedback. Respond in the format:
        IMPROVED IDEA: <new improved version of the idea>
        
        Focus on making the idea more concrete, more scoped, and more implementable.
    """)
    log("[INNOVATOR] Improving idea based on critic's feedback...")
    t0 = time.time()
    try:
        rsp = innovator_model.generate_content(prompt)
        log(f"[INNOVATOR] Idea improvement complete in {time.time()-t0:.2f}s")
        # Find improved idea from response
        text = rsp.text.strip()
        if "IMPROVED IDEA:" in text:
            improved = text.split("IMPROVED IDEA:")[1].strip()
            return improved
        return text
    except Exception as e:
        log(f"[ERROR][INNOVATOR] Error in idea improvement: {e}")
        return original_idea

def create_ticket(idea: str, critique: Dict[str,str], idx: int) -> str:
    prompt = textwrap.dedent(f"""
        Create a clear development ticket from the approved idea.
        Idea: {idea}
        Rationale: {critique.get('rationale','')}
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
        Keep it concrete and prioritized.
    """)
    log(f"[TICKET] Creating ticket #{idx}...")
    t0 = time.time()
    try:
        rsp = innovator_model.generate_content(prompt)
        log(f"[TICKET] Ticket #{idx} complete in {time.time()-t0:.2f}s")
    except Exception as e:
        return f"## Ticket {idx}: (error creating)\nError: {e}\n"
    return rsp.text

def save_ticket_to_file(ticket_content: str, ticket_number: int) -> Path:
    """Save individual ticket to its own file in tickets/ directory."""
    tickets_dir = TASK_DIR / "tickets"
    tickets_dir.mkdir(exist_ok=True)
    
    # Extract title for filename
    title_line = ""
    for line in ticket_content.splitlines():
        if line.startswith("## Ticket"):
            title_line = line.split(":", 1)[1].strip() if ":" in line else f"ticket-{ticket_number}"
            break
    
    # Create safe filename
    safe_title = "".join(c for c in title_line if c.isalnum() or c in (' ', '-', '_')).strip()
    safe_title = safe_title.replace(' ', '-').lower()[:50]  # Max 50 chars
    if not safe_title:
        safe_title = f"ticket-{ticket_number}"
    
    filename = f"{ticket_number:03d}-{safe_title}.md"
    file_path = tickets_dir / filename
    
    with file_path.open("w", encoding="utf-8") as f:
        f.write(ticket_content)
    
    return file_path

accepted = 0
log("[FLOW] Starting idea round")
idea_batch = generate_raw_ideas(min(5, MAX_IDEAS), previous_ideas)
log(f"[FLOW] Got {len(idea_batch)} ideas for first round")
ticket_files: List[Path] = []

for i, original_idea in enumerate(idea_batch, start=1):
    if accepted >= MAX_TICKETS or i > MAX_IDEAS:
        break
    
    current_idea = original_idea
    max_iterations = 3  # Maximum 3 improvement rounds per idea
    
    log(f"\n[FLOW][IDEA {i}] Original: {original_idea}")
    
    for iteration in range(max_iterations):
        critique = critique_idea(current_idea)
        verdict = critique.get("verdict", "needs_improvement").lower()
        
        log(f"[ITERATION {iteration + 1}] Critic's verdict: {verdict}")
        log(f"Rationale: {critique.get('rationale','')[:200]}...")
        
        if verdict == "accept":
            accepted += 1
            ticket_md = create_ticket(current_idea, critique, accepted)
            ticket_file = save_ticket_to_file(ticket_md, accepted)
            ticket_files.append(ticket_file)
            log(f"[RESULT] Accepted on round {iteration + 1}! Ticket #{accepted} saved to {ticket_file.name}")
            break
        elif verdict == "needs_improvement":
            if iteration < max_iterations - 1:  # Not the last round
                log(f"[FEEDBACK] Feedback: {critique.get('specific_feedback','')[:150]}...")
                log(f"[FEEDBACK] Improvements: {critique.get('suggested_improvements','')[:150]}...")
                
                # Improve the idea
                improved_idea = improve_idea(current_idea, critique)
                log(f"[IMPROVED] Improved idea: {improved_idea[:200]}...")
                current_idea = improved_idea
            else:
                log(f"[RESULT] Maximum improvement rounds ({max_iterations}) reached, giving up")
        else:
            log(f"[RESULT] Unknown verdict: {verdict}, moving to next")
            break

if ticket_files:
    log(f"\n[DONE] {len(ticket_files)} ticket(s) saved to individual files:")
    for ticket_file in ticket_files:
        log(f"  - {ticket_file}")
else:
    log("\n[DONE] No accepted ideas in this round.")
