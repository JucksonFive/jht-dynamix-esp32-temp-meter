import os
from pathlib import Path
from typing import Iterable
import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)
    
# 2. Agenttien määrittely (ohjeet, kuten aiemmin)
innovator_instructions = "Olet 'Ideanikkari', luova ja rohkea ideoija, joka etsii innovatiivisia tapoja ratkaista ongelmia. Tuo esiin uusia näkökulmia ja lähestymistapoja, ehdota monipuolisia ratkaisuja ja pyri rikkomaan vallitsevia ajatusmalleja. Tuota ideakirjoja, varioi mahdollisia ratkaisuja ja kerro, miksi jokainen niistä voi toimia. Muista, ettei tässä vaiheessa arvioida toimivuutta, vaan ideointia."
critic_instructions = "Olet 'Kriitikko', analyyttinen arkkitehti, joka arvioi huolellisesti Ideanikkarin ehdotuksia. Tutki, mitkä ideat ovat realistisia ja järkeviä toteuttaa, ja keskity tunnistamaan niiden heikkoudet ja vahvuudet. Arvioi ehdotuksia objektiivisesti, esitä kysymyksiä ja perusteluja siitä, mitkä ideat toimivat parhaiten käytännössä. Tarjoa vaihtoehtoja tai parannuksia niihin kohtiin, jotka koet ongelmallisiksi."


innovator_model = genai.GenerativeModel(
    model_name="gemini-pro-latest",  # Use this stable name
    system_instruction=innovator_instructions,
)
critic_model = genai.GenerativeModel(
    model_name="gemini-pro-latest",  # And here too
    system_instruction=critic_instructions,
)

TASK_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = (TASK_DIR / Path("../../../")).resolve()


def collect_project_context(root: Path, max_bytes: int = 20000) -> str:
    """Kokoaa projektin keskeiset tekstit mallille."""
    chunks = []
    for path in sorted(root.glob("**/*")):
        if path.is_dir() or "venv" in path.parts:
            continue
        if path.suffix.lower() not in {".py", ".md", ".txt"}:
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


# 3. Syöte: Projektin tiedot
project_context = collect_project_context(PROJECT_ROOT)

# 4. Vaihe 1: Ideanikkari tuottaa ideoita
print("Ideanikkari miettii...")
innovator_response = innovator_model.generate_content(
    f"Analysoi seuraava projekti ja keksi 5 kehitysideaa:\n\n{project_context}"
)
development_ideas = innovator_response.text

print("--- Ideanikkarin ehdotukset ---")
print(development_ideas)

# 5. Vaihe 2: Kriitikko arvioi ideat
print("\nKriitikko arvioi...")
critic_response = critic_model.generate_content(
    f"Arvioi seuraavat kehitysideat, jotka toinen AI ehdotti:\n\n{development_ideas}"
)
critique = critic_response.text

print("--- Kriitikon arvio ---")
print(critique)
