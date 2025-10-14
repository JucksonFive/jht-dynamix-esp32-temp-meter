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
    """Collects key project texts for the model."""
    chunks = []
    for path in sorted(root.glob("**/*")):
        if path.is_dir() or "venv" in path.parts:
            continue
        if path.suffix.lower() not in {".py", ".md", ".txt", ".ts", ".tsx", }:
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        snippet = content[: max_bytes // 5]
        chunks.append(f"# File: {path.relative_to(root)}\n{snippet}\n")
        if sum(len(chunk) for chunk in chunks) >= max_bytes:
            break
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
    tickets_file = TASK_DIR / "generated_tickets.md"
    previous_ideas = []
    if tickets_file.exists():
        try:
            content = tickets_file.read_text(encoding="utf-8")
            # Extract ticket titles from markdown headers
            for line in content.splitlines():
                if line.startswith("## Ticket"):
                    title = line.split(":", 1)[1].strip() if ":" in line else ""
                    if title:
                        previous_ideas.append(title)
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

accepted = 0
log("[FLOW] Starting idea round")
idea_batch = generate_raw_ideas(min(5, MAX_IDEAS), previous_ideas)
log(f"[FLOW] Got {len(idea_batch)} ideas for first round")
tickets_out: List[str] = []

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
            tickets_out.append(ticket_md)
            log(f"[RESULT] Accepted on round {iteration + 1}! Ticket #{accepted} created")
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

if tickets_out:
    tickets_file = TASK_DIR / "generated_tickets.md"
    with tickets_file.open("a", encoding="utf-8") as f:
        f.write("\n\n".join(tickets_out) + "\n")
    log(f"\n[DONE] {len(tickets_out)} ticket(s) saved to file: {tickets_file}")
else:
    log("\n[DONE] No accepted ideas in this round.")
