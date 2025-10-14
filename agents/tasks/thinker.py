import os
from pathlib import Path
from typing import List, Dict
import textwrap
import time
import google.generativeai as genai
import json
from dotenv import load_dotenv

# Lataa ympäristömuuttujat .env-tiedostosta
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)
    
def _load_instruction(path: Path, fallback: str) -> str:
    try:
        return path.read_text(encoding="utf-8").strip() or fallback
    except FileNotFoundError:
        return fallback

# Määritellään polut (TASK_DIR tarvitaan ennen ohjeiden latausta)
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
    "Olet Ideanikkari: generoi rohkeita, konkreettisia parannusideoita projektiin.",
)
critic_instructions = _load_instruction(
    DEFINITIONS_DIR / "critic_instructions.md",
    "Olet Kriitikko: arvioi ideat realistisuuden, arvon ja rajattavuuden mukaan.",
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
    """Kokoaa projektin keskeiset tekstit mallille."""
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
        chunks.append(f"# Tiedosto: {path.relative_to(root)}\n{snippet}\n")
        if sum(len(chunk) for chunk in chunks) >= max_bytes:
            break
    return "\n".join(chunks)


MAX_IDEAS = int(os.getenv("MAX_IDEAS", "15"))
MAX_TICKETS = int(os.getenv("MAX_TICKETS", "3"))

log("[CTX] Kerätään projektikontekstia...")
_t0 = time.time()
project_context = collect_project_context(PROJECT_ROOT)
log(f"[CTX] Konteksti koottu ({len(project_context)} merkkiä) ajassa {time.time()-_t0:.2f}s")

def generate_raw_ideas(n: int) -> List[str]:
    prompt = textwrap.dedent(f"""
        Tutki projektin konteksti ja generoi {n} priorisoitua kehitysideaa muodossa:
        IDEA <numero>: <lyhyt otsikko> - <1 lauseen kuvaus>
        Keskity konkreettisiin arvoa tuottaviin parannuksiin (testit, suorituskyky, DX, tietoturva, monitorointi, arkkitehtuuri).
        Konteksti:
        {project_context}
    """)
    log(f"[IDEAS] Generoidaan {n} ideaa...")
    t0 = time.time()
    try:
        rsp = innovator_model.generate_content(prompt)
        log(f"[IDEAS] Generointi valmis {time.time()-t0:.2f}s")
    except Exception as e:
        log(f"[ERROR][IDEAS] Virhe ideageneroinnissa: {e}")
        return ["Paranna virheenkäsittelyä AI-skriptissä"]
    lines = [l.strip() for l in rsp.text.splitlines() if l.strip()]
    ideas: List[str] = []
    for line in lines:
        if line.lower().startswith("idea"):
            # Poista mahdollinen 'IDEA X:' prefiksi
            parts = line.split(':', 1)
            idea_text = parts[1].strip() if len(parts) > 1 else line
            ideas.append(idea_text)
    # fallback jos parser ei löytänyt
    if not ideas:
        ideas = lines[:n]
    return ideas[:n]

def critique_idea(idea: str) -> Dict[str, str]:
    prompt = textwrap.dedent(f"""
        Arvioi seuraava kehitysidea:
        "{idea}"
        Vastaa JSON muodossa avaimilla: verdict ("accept" tai "reject"), rationale, risks, improvements.
        Kriteerit hyväksynnälle: selkeä arvo, toteutettavissa < 1 viikko, rajattavissa pieniin tehtäviin.
    """)
    log("[CRITIC] Arvioidaan idea...")
    t0 = time.time()
    try:
        rsp = critic_model.generate_content(prompt)
        log(f"[CRITIC] Arvio valmis {time.time()-t0:.2f}s")
    except Exception as e:
        return {"verdict": "reject", "rationale": f"API-virhe: {e}", "risks": "", "improvements": ""}
    text = rsp.text.strip()
    # Etsi ensimmäinen JSON-lohko
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1:
        snippet = text[start:end+1]
        try:
            data = json.loads(snippet)
            return {k: str(v) for k,v in data.items()}
        except Exception:
            pass
    return {"verdict": "reject", "rationale": text[:400], "risks": "", "improvements": ""}

def create_ticket(idea: str, critique: Dict[str,str], idx: int) -> str:
    prompt = textwrap.dedent(f"""
        Laadi hyväksytystä ideasta selkeä kehitystiketti.
        Idea: {idea}
        Perustelut: {critique.get('rationale','')}
        Muotoile MARKDOWN:
        ## Ticket {idx}: <otsikko>
        Lyhyt kuvaus.
        ### Tausta
        ### Hyödyt
        ### Toteutus
        ### Tehtävät
        - [ ] ...
        ### Hyväksymiskriteerit
        - ...
        Pidä konkreettinen ja priorisoitu.
    """)
    log(f"[TICKET] Luodaan tiketti #{idx}...")
    t0 = time.time()
    try:
        rsp = innovator_model.generate_content(prompt)
        log(f"[TICKET] Tiketti #{idx} valmis {time.time()-t0:.2f}s")
    except Exception as e:
        return f"## Ticket {idx}: (virhe luodessa)\nVirhe: {e}\n"
    return rsp.text

accepted = 0
log("[FLOW] Aloitetaan ideakierros")
idea_batch = generate_raw_ideas(min(5, MAX_IDEAS))
log(f"[FLOW] Saatiin {len(idea_batch)} ideaa ensikierrokselle")
tickets_out: List[str] = []

for i, idea in enumerate(idea_batch, start=1):
    if accepted >= MAX_TICKETS or i > MAX_IDEAS:
        break
    log(f"\n[FLOW][IDEA {i}] {idea}")
    critique = critique_idea(idea)
    verdict = critique.get("verdict", "reject").lower()
    log(f"Kriitikon tuomio: {verdict}\nPerustelut: {critique.get('rationale','')[:300]}")
    if verdict == "accept":
        accepted += 1
        ticket_md = create_ticket(idea, critique, accepted)
        tickets_out.append(ticket_md)
        log(f"[RESULT] Hyväksytty ja tiketti #{accepted} luotu")
    else:
        log("[RESULT] Hylätty, siirrytään eteenpäin")

if tickets_out:
    tickets_file = TASK_DIR / "generated_tickets.md"
    with tickets_file.open("a", encoding="utf-8") as f:
        f.write("\n\n".join(tickets_out) + "\n")
    log(f"\n[DONE] {len(tickets_out)} tiketti(ä) tallennettu tiedostoon: {tickets_file}")
else:
    log("\n[DONE] Ei hyväksyttyjä ideoita tällä kierroksella.")
