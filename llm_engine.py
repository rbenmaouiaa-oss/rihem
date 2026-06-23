"""
LLM Engine for Rihem HR System (Groq-powered)
=============================================
A thin, reusable wrapper around the Groq Chat API used by the AI recruitment
module. All recruitment AI features go through this file:

    1. analyze_cv(text)            -> structured CV data + summary + red flags
    2. classify_cv(text)           -> job category, department, seniority, fit
    3. match_cv_to_job(cv, job)    -> match score + reasoning + missing skills

Design notes
------------
* The Groq API key is read from the GROQ_API_KEY environment variable
  (loaded from .env). It is never hardcoded.
* Every function asks the model for strict JSON (response_format json_object)
  and we parse defensively, so the rest of the app always receives a dict.
* Groq is OpenAI-compatible; swapping providers later only touches this file.
"""

import os
import json
import logging

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("rihem.llm")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Lazy singleton so importing this module never crashes if the key is missing.
_client = None


class LLMConfigError(RuntimeError):
    """Raised when the LLM cannot be used (e.g. missing API key)."""


def get_client():
    """Return a cached Groq client, creating it on first use."""
    global _client
    if _client is None:
        if not GROQ_API_KEY:
            raise LLMConfigError(
                "GROQ_API_KEY is not set. Add it to your .env file "
                "(see .env.example)."
            )
        try:
            from groq import Groq
        except ImportError as exc:  # pragma: no cover
            raise LLMConfigError(
                "The 'groq' package is not installed. Run: pip install groq"
            ) from exc
        _client = Groq(api_key=GROQ_API_KEY)
    return _client


_JSON_RULE = (
    " Réponds UNIQUEMENT avec un seul objet JSON valide. "
    "Ne recopie pas le texte d'entrée. N'ajoute aucun commentaire, aucune "
    "explication, aucun bloc de code markdown — uniquement le JSON."
)


def _extract_json(text: str):
    """Best-effort extraction of a JSON object from a raw model response."""
    if not text:
        return None
    text = text.strip()
    # Strip ```json ... ``` fences if present
    if "```" in text:
        import re
        m = re.search(r"```(?:json)?\s*(.*?)```", text, re.S)
        if m:
            text = m.group(1).strip()
    # Fast path
    try:
        return json.loads(text)
    except Exception:
        pass
    # Scan for balanced {...} blocks and return the last one that parses
    candidates, depth, start = [], 0, None
    for i, ch in enumerate(text):
        if ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}" and depth > 0:
            depth -= 1
            if depth == 0 and start is not None:
                candidates.append(text[start:i + 1])
    for cand in reversed(candidates):
        try:
            return json.loads(cand)
        except Exception:
            continue
    return None


def _chat_json(system_prompt: str, user_prompt: str, temperature: float = 0.2) -> dict:
    """
    Send a chat completion to Groq and return the parsed JSON object.

    Strategy: first try strict JSON mode; if the model wraps the JSON in extra
    text (Groq raises json_validate_failed) or returns invalid JSON, retry once
    in plain mode and extract the JSON block defensively.

    Always returns a dict. On failure returns {"_error": "<message>"} so callers
    can degrade gracefully and surface the error to the UI.
    """
    system_prompt = system_prompt + _JSON_RULE
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    try:
        client = get_client()

        # Attempt 1 — plain mode + defensive extraction (this model tends to wrap
        # JSON in prose, which makes Groq's strict json_object mode 400, so we do
        # the tolerant path first and keep strict mode as a fallback).
        raw = client.chat.completions.create(
            model=GROQ_MODEL, temperature=temperature, messages=messages,
        ).choices[0].message.content
        parsed = _extract_json(raw)
        if parsed is not None:
            return parsed

        # Attempt 2 — strict JSON mode
        try:
            raw = client.chat.completions.create(
                model=GROQ_MODEL, temperature=temperature,
                response_format={"type": "json_object"}, messages=messages,
            ).choices[0].message.content
            parsed = _extract_json(raw)
            if parsed is not None:
                return parsed
        except Exception as exc:
            logger.warning("Strict JSON fallback failed: %s", exc)

        logger.error("Could not extract JSON from model output: %s", (raw or "")[:300])
        return {"_error": "Le modèle n'a pas renvoyé de JSON exploitable. Réessayez."}

    except LLMConfigError as exc:
        logger.error("LLM config error: %s", exc)
        return {"_error": str(exc)}
    except Exception as exc:  # network, rate limit, etc.
        logger.exception("LLM call failed")
        return {"_error": f"LLM call failed: {exc}"}


def _truncate(text: str, max_chars: int = 14000) -> str:
    """Keep prompts within a safe size for the context window."""
    text = (text or "").strip()
    if len(text) > max_chars:
        return text[:max_chars] + "\n\n[...CV tronqué...]"
    return text


# ──────────────────────────────────────────────────────────────────────────
# 1. CV ANALYSER
# ──────────────────────────────────────────────────────────────────────────

_ANALYZE_SYSTEM = (
    "Tu es un expert RH spécialisé dans l'analyse de CV. "
    "Tu extrais des informations structurées d'un CV et tu réponds "
    "UNIQUEMENT en JSON valide, en français. "
    "Si une information est absente, mets null ou une liste vide."
)

_ANALYZE_SCHEMA = """Réponds avec EXACTEMENT cette structure JSON:
{
  "full_name": string|null,
  "email": string|null,
  "phone": string|null,
  "location": string|null,
  "current_title": string|null,
  "years_experience": number|null,
  "summary": string,                       // 2-3 phrases résumant le profil
  "skills": [string],                      // compétences techniques & soft skills
  "languages": [{"language": string, "level": string}],
  "education": [{"degree": string, "institution": string, "year": string|null}],
  "experience": [{"title": string, "company": string, "duration": string|null,
                  "highlights": [string]}],
  "certifications": [string],
  "strengths": [string],                   // 3-5 points forts
  "red_flags": [string],                    // trous, incohérences, manques (peut être vide)
  "overall_score": number                   // 0-100, qualité globale du CV
}"""


def analyze_cv(cv_text: str) -> dict:
    """Extract structured information and an assessment from raw CV text."""
    user = f"{_ANALYZE_SCHEMA}\n\n--- CV ---\n{_truncate(cv_text)}"
    return _chat_json(_ANALYZE_SYSTEM, user, temperature=0.1)


# ──────────────────────────────────────────────────────────────────────────
# 2. CV CLASSIFIER
# ──────────────────────────────────────────────────────────────────────────

_CLASSIFY_SYSTEM = (
    "Tu es un système de classification de CV pour un logiciel RH. "
    "Tu catégorises un CV et réponds UNIQUEMENT en JSON valide, en français."
)

_CLASSIFY_SCHEMA = """Réponds avec EXACTEMENT cette structure JSON:
{
  "job_category": string,        // ex: "Développement Logiciel", "Marketing", "Finance", "RH", "Design", "Vente", "Support", "Opérations", "Autre"
  "suggested_department": string,// département RH le plus adapté
  "seniority_level": string,     // "Stagiaire", "Junior", "Confirmé", "Senior", "Lead", "Manager", "Directeur"
  "primary_skills": [string],    // 3-6 compétences clés qui justifient la catégorie
  "confidence": number           // 0.0-1.0
}"""


def classify_cv(cv_text: str) -> dict:
    """Categorise a CV into job family, department and seniority."""
    user = f"{_CLASSIFY_SCHEMA}\n\n--- CV ---\n{_truncate(cv_text)}"
    return _chat_json(_CLASSIFY_SYSTEM, user, temperature=0.1)


# ──────────────────────────────────────────────────────────────────────────
# 3. JOB ↔ CV MATCHING / RANKING
# ──────────────────────────────────────────────────────────────────────────

_MATCH_SYSTEM = (
    "Tu es un expert en recrutement. Tu évalues l'adéquation entre un CV et "
    "une offre d'emploi de façon objective. Tu réponds UNIQUEMENT en JSON "
    "valide, en français."
)

_MATCH_SCHEMA = """Réponds avec EXACTEMENT cette structure JSON:
{
  "match_score": number,          // 0-100, adéquation globale candidat/poste
  "recommendation": string,       // "Fortement recommandé" | "Recommandé" | "À considérer" | "Non recommandé"
  "matching_skills": [string],    // compétences du candidat qui correspondent à l'offre
  "missing_skills": [string],     // compétences requises absentes du CV
  "strengths_for_role": [string], // pourquoi le candidat convient
  "concerns": [string],           // risques / écarts
  "summary": string               // 2-3 phrases de synthèse pour le recruteur
}"""


def match_cv_to_job(cv_text: str, job_title: str, job_description: str) -> dict:
    """Score a CV against a specific job offer."""
    user = (
        f"{_MATCH_SCHEMA}\n\n"
        f"--- OFFRE D'EMPLOI ---\nTitre: {job_title}\n"
        f"Description:\n{_truncate(job_description, 4000)}\n\n"
        f"--- CV DU CANDIDAT ---\n{_truncate(cv_text, 10000)}"
    )
    return _chat_json(_MATCH_SYSTEM, user, temperature=0.2)


# ──────────────────────────────────────────────────────────────────────────
# 4. SMART RECLAMATION AI  (replaces keyword classifier in ai_intelligence.py)
# ──────────────────────────────────────────────────────────────────────────

_RECLAMATION_SYSTEM = (
    "Tu es l'assistant RH de Rihem, un logiciel de gestion des présences et du "
    "personnel. Tu traites les réclamations des employés: tu détermines la "
    "priorité, la catégorie, le sentiment, et tu rédiges un brouillon de réponse "
    "professionnel et empathique. Tu réponds UNIQUEMENT en JSON valide, en français."
)

_RECLAMATION_SCHEMA = """Réponds avec EXACTEMENT cette structure JSON:
{
  "priority": string,        // "urgent" | "normal" | "faible"
  "category": string,        // "Pointage" | "Retard" | "Absence" | "Congés" | "Salaire" | "Technique" | "Autre"
  "sentiment": string,       // "positif" | "neutre" | "négatif" | "très négatif"
  "confidence": number,      // 0.0-1.0
  "summary": string,         // 1 phrase résumant le problème
  "suggested_reply": string  // brouillon de réponse RH, ton professionnel et empathique
}"""


def classify_reclamation(subject: str, message: str) -> dict:
    """LLM analysis of an employee complaint: priority, category, sentiment, reply."""
    user = (
        f"{_RECLAMATION_SCHEMA}\n\n"
        f"--- RÉCLAMATION ---\nObjet: {subject or '(sans objet)'}\n"
        f"Message:\n{_truncate(message, 4000)}"
    )
    return _chat_json(_RECLAMATION_SYSTEM, user, temperature=0.3)


# ──────────────────────────────────────────────────────────────────────────
# 5. INTERVIEW QUESTION GENERATOR
# ──────────────────────────────────────────────────────────────────────────

_INTERVIEW_SYSTEM = (
    "Tu es un recruteur expert. À partir d'un CV et d'une offre d'emploi, tu "
    "génères des questions d'entretien pertinentes et personnalisées. Tu réponds "
    "UNIQUEMENT en JSON valide, en français."
)

_INTERVIEW_SCHEMA = """Réponds avec EXACTEMENT cette structure JSON:
{
  "technical": [string],     // 4-6 questions techniques liées aux compétences requises
  "experience": [string],    // 3-4 questions sur le parcours/projets du candidat
  "behavioral": [string],    // 3-4 questions comportementales (soft skills)
  "to_clarify": [string],    // 2-3 points du CV à clarifier (trous, incohérences)
  "tips": [string]           // 2-3 conseils pour le recruteur pendant l'entretien
}"""


def generate_interview_questions(cv_text: str, job_title: str, job_description: str) -> dict:
    """Generate tailored interview questions from a CV + a job offer."""
    user = (
        f"{_INTERVIEW_SCHEMA}\n\n"
        f"--- OFFRE ---\nTitre: {job_title}\nDescription:\n{_truncate(job_description, 3000)}\n\n"
        f"--- CV ---\n{_truncate(cv_text, 9000)}"
    )
    return _chat_json(_INTERVIEW_SYSTEM, user, temperature=0.5)


# ──────────────────────────────────────────────────────────────────────────
# 6. HR INSIGHTS SUMMARIZER
# ──────────────────────────────────────────────────────────────────────────

_INSIGHTS_SYSTEM = (
    "Tu es un analyste RH. À partir de statistiques de présence et d'alertes de "
    "fraude, tu rédiges un rapport clair et actionnable pour un manager, en "
    "langage naturel. Tu réponds UNIQUEMENT en JSON valide, en français."
)

_INSIGHTS_SCHEMA = """Réponds avec EXACTEMENT cette structure JSON:
{
  "headline": string,            // titre court résumant la situation
  "summary": string,             // 3-4 phrases de synthèse en langage naturel
  "key_findings": [string],      // 3-5 constats chiffrés importants
  "risks": [string],             // risques RH détectés (retards, fraude, absentéisme)
  "recommendations": [string]    // 3-4 actions concrètes recommandées
}"""


def summarize_hr_insights(stats: dict) -> dict:
    """Turn raw attendance/fraud statistics into a manager-readable report."""
    user = (
        f"{_INSIGHTS_SCHEMA}\n\n"
        f"--- STATISTIQUES (JSON) ---\n{json.dumps(stats, ensure_ascii=False, indent=2)}"
    )
    return _chat_json(_INSIGHTS_SYSTEM, user, temperature=0.3)


# ──────────────────────────────────────────────────────────────────────────
# Health check
# ──────────────────────────────────────────────────────────────────────────

def health_check() -> dict:
    """Quick connectivity test used by /api/ai/health."""
    if not GROQ_API_KEY:
        return {"ok": False, "reason": "GROQ_API_KEY missing"}
    result = _chat_json(
        "You reply only in JSON.",
        'Reply with {"status":"ok"} exactly.',
        temperature=0.0,
    )
    return {
        "ok": result.get("status") == "ok",
        "model": GROQ_MODEL,
        "raw": result,
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("Groq health check:", json.dumps(health_check(), indent=2, ensure_ascii=False))
