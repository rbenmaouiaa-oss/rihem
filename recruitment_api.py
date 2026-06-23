"""
AI Recruitment API (Flask Blueprint) for Rihem HR System
========================================================
Exposes the Groq-powered recruitment features over HTTP and persists results
to Supabase. Registered in app.py as:

    from recruitment_api import recruitment_bp
    app.register_blueprint(recruitment_bp)

Routes (all prefixed /api/ai):
    GET  /health                      -> Groq connectivity check
    GET  /jobs?company_id=            -> list job offers
    POST /jobs                        -> create a job offer
    POST /cv/analyze                  -> upload CV (PDF/DOCX/TXT or raw text),
                                         analyse + classify (+ match if job_offer_id)
    GET  /candidates?company_id=&job_offer_id=  -> list candidates (ranked)
    GET  /candidates/<id>             -> full analysis for one candidate
    POST /cv/match                    -> (re)match a candidate to a job offer
"""

import os
import io
import logging

from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
from supabase import create_client, Client

import llm_engine

load_dotenv()
logger = logging.getLogger("rihem.recruitment")

# Own Supabase client (decoupled from app.py, configured via .env)
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://npouyrppjqbxifuvpqan.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

recruitment_bp = Blueprint("recruitment", __name__, url_prefix="/api/ai")

ALLOWED_EXT = {".pdf", ".docx", ".txt"}


# ──────────────────────────────────────────────────────────────────────────
# CV text extraction
# ──────────────────────────────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    import pdfplumber
    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text_parts.append(page.extract_text() or "")
    return "\n".join(text_parts).strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    import docx
    document = docx.Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in document.paragraphs).strip()


def extract_cv_text(filename: str, file_bytes: bytes) -> str:
    ext = os.path.splitext(filename.lower())[1]
    if ext == ".pdf":
        return extract_text_from_pdf(file_bytes)
    if ext == ".docx":
        return extract_text_from_docx(file_bytes)
    if ext == ".txt":
        return file_bytes.decode("utf-8", errors="ignore").strip()
    raise ValueError(f"Format non supporté: {ext}. Utilisez PDF, DOCX ou TXT.")


def _safe_int(value, default=None):
    try:
        return int(round(float(value)))
    except (TypeError, ValueError):
        return default


def _clean_text(s):
    """Remove NUL bytes / control chars that Postgres text & jsonb reject (22P05)."""
    if not isinstance(s, str):
        return s
    # Drop \x00 and other C0 control chars except \t \n \r
    return "".join(
        ch for ch in s
        if ch == "\t" or ch == "\n" or ch == "\r" or ord(ch) >= 0x20
    )


def _deep_clean(obj):
    """Recursively strip NUL/control chars from all strings in a dict/list."""
    if isinstance(obj, str):
        return _clean_text(obj)
    if isinstance(obj, list):
        return [_deep_clean(x) for x in obj]
    if isinstance(obj, dict):
        return {k: _deep_clean(v) for k, v in obj.items()}
    return obj


# ──────────────────────────────────────────────────────────────────────────
# Health
# ──────────────────────────────────────────────────────────────────────────

@recruitment_bp.route("/health", methods=["GET"])
def ai_health():
    return jsonify(llm_engine.health_check())


# ──────────────────────────────────────────────────────────────────────────
# Job offers
# ──────────────────────────────────────────────────────────────────────────

@recruitment_bp.route("/jobs", methods=["GET"])
def list_jobs():
    company_id = request.args.get("company_id")
    query = supabase.table("job_offers").select("*").order("created_at", desc=True)
    if company_id:
        query = query.eq("company_id", company_id)
    res = query.execute()
    return jsonify({"jobs": res.data or []})


@recruitment_bp.route("/jobs", methods=["POST"])
def create_job():
    body = request.get_json(force=True, silent=True) or {}
    title = (body.get("title") or "").strip()
    description = (body.get("description") or "").strip()
    if not title or not description:
        return jsonify({"error": "title et description sont requis"}), 400

    row = {
        "company_id": body.get("company_id"),
        "department_id": body.get("department_id"),
        "created_by": body.get("created_by"),
        "title": title,
        "description": description,
        "location": body.get("location"),
        "seniority": body.get("seniority"),
        "status": body.get("status", "open"),
    }
    # Drop None FKs to avoid type errors on empty strings
    row = {k: v for k, v in row.items() if v not in (None, "")}
    res = supabase.table("job_offers").insert(row).execute()
    return jsonify({"job": res.data[0] if res.data else None}), 201


# ──────────────────────────────────────────────────────────────────────────
# CV analyse + classify (+ optional match)
# ──────────────────────────────────────────────────────────────────────────

@recruitment_bp.route("/cv/analyze", methods=["POST"])
def analyze_cv_route():
    """
    Accepts either:
      * multipart/form-data with a 'file' (PDF/DOCX/TXT) + form fields, OR
      * application/json with {"cv_text": "...", ...}
    Optional fields: company_id, job_offer_id.
    """
    company_id = None
    job_offer_id = None
    cv_text = ""
    filename = "cv.txt"

    if request.files.get("file"):
        upload = request.files["file"]
        filename = upload.filename or "cv"
        ext = os.path.splitext(filename.lower())[1]
        if ext not in ALLOWED_EXT:
            return jsonify({"error": f"Extension non supportée: {ext}"}), 400
        try:
            cv_text = extract_cv_text(filename, upload.read())
        except Exception as exc:
            return jsonify({"error": f"Extraction du texte échouée: {exc}"}), 400
        company_id = request.form.get("company_id") or None
        job_offer_id = request.form.get("job_offer_id") or None
    else:
        body = request.get_json(force=True, silent=True) or {}
        cv_text = (body.get("cv_text") or "").strip()
        company_id = body.get("company_id") or None
        job_offer_id = body.get("job_offer_id") or None
        filename = body.get("filename", "cv.txt")

    # Strip NUL/control chars that Postgres rejects (22P05) before anything else
    cv_text = _clean_text(cv_text)

    if not cv_text or len(cv_text) < 30:
        return jsonify({"error": "Texte du CV vide ou trop court."}), 400

    # 1) Analyse  2) Classify  (sequential Groq calls)
    analysis = _deep_clean(llm_engine.analyze_cv(cv_text))
    if analysis.get("_error"):
        return jsonify({"error": analysis["_error"]}), 502
    classification = _deep_clean(llm_engine.classify_cv(cv_text))

    # 3) Optional match against a job offer
    match = None
    job = None
    if job_offer_id:
        job_res = supabase.table("job_offers").select("*").eq("id", job_offer_id).execute()
        if job_res.data:
            job = job_res.data[0]
            match = _deep_clean(llm_engine.match_cv_to_job(cv_text, job["title"], job["description"]))

    # 4) Persist candidate
    candidate_row = {
        "company_id": company_id,
        "job_offer_id": job_offer_id,
        "full_name": analysis.get("full_name"),
        "email": analysis.get("email"),
        "phone": analysis.get("phone"),
        "location": analysis.get("location"),
        "current_title": analysis.get("current_title"),
        "cv_filename": filename,
        "cv_text": cv_text,
        "job_category": (classification or {}).get("job_category"),
        "seniority_level": (classification or {}).get("seniority_level"),
        "overall_score": _safe_int(analysis.get("overall_score")),
        "match_score": _safe_int((match or {}).get("match_score")),
        "status": "new",
    }
    candidate_row = {k: v for k, v in candidate_row.items() if v not in (None, "")}
    cand_res = supabase.table("candidates").insert(candidate_row).execute()
    candidate = cand_res.data[0] if cand_res.data else None

    # 5) Persist full analysis history
    if candidate:
        supabase.table("cv_analyses").insert({
            "candidate_id": candidate["id"],
            "job_offer_id": job_offer_id,
            "analysis_json": analysis,
            "classification_json": classification,
            "match_json": match,
            "model": llm_engine.GROQ_MODEL,
        }).execute()

    return jsonify({
        "candidate": candidate,
        "analysis": analysis,
        "classification": classification,
        "match": match,
        "job": job,
    }), 201


# ──────────────────────────────────────────────────────────────────────────
# Candidates listing / detail
# ──────────────────────────────────────────────────────────────────────────

@recruitment_bp.route("/candidates", methods=["GET"])
def list_candidates():
    company_id = request.args.get("company_id")
    job_offer_id = request.args.get("job_offer_id")
    category = request.args.get("category")

    cols = ("id, full_name, email, current_title, job_category, seniority_level, "
            "overall_score, match_score, status, job_offer_id, created_at")
    query = supabase.table("candidates").select(cols)
    if company_id:
        query = query.eq("company_id", company_id)
    if job_offer_id:
        query = query.eq("job_offer_id", job_offer_id)
    if category:
        query = query.eq("job_category", category)

    res = query.execute()
    rows = res.data or []
    # Rank: match_score first (if linked to a job), else CV quality
    rows.sort(
        key=lambda r: (r.get("match_score") or -1, r.get("overall_score") or -1),
        reverse=True,
    )
    return jsonify({"candidates": rows})


@recruitment_bp.route("/candidates/<candidate_id>", methods=["GET"])
def candidate_detail(candidate_id):
    cand = supabase.table("candidates").select("*").eq("id", candidate_id).execute()
    if not cand.data:
        return jsonify({"error": "Candidat introuvable"}), 404
    analysis = (
        supabase.table("cv_analyses")
        .select("*")
        .eq("candidate_id", candidate_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return jsonify({
        "candidate": cand.data[0],
        "analysis": analysis.data[0] if analysis.data else None,
    })


# ──────────────────────────────────────────────────────────────────────────
# Re-match an existing candidate to a job offer
# ──────────────────────────────────────────────────────────────────────────

@recruitment_bp.route("/cv/match", methods=["POST"])
def rematch_route():
    body = request.get_json(force=True, silent=True) or {}
    candidate_id = body.get("candidate_id")
    job_offer_id = body.get("job_offer_id")
    if not candidate_id or not job_offer_id:
        return jsonify({"error": "candidate_id et job_offer_id requis"}), 400

    cand = supabase.table("candidates").select("*").eq("id", candidate_id).execute()
    job = supabase.table("job_offers").select("*").eq("id", job_offer_id).execute()
    if not cand.data or not job.data:
        return jsonify({"error": "Candidat ou offre introuvable"}), 404

    candidate = cand.data[0]
    job_row = job.data[0]
    match = _deep_clean(llm_engine.match_cv_to_job(
        _clean_text(candidate.get("cv_text", "")), job_row["title"], job_row["description"]
    ))
    if match.get("_error"):
        return jsonify({"error": match["_error"]}), 502

    supabase.table("candidates").update({
        "job_offer_id": job_offer_id,
        "match_score": _safe_int(match.get("match_score")),
    }).eq("id", candidate_id).execute()

    supabase.table("cv_analyses").insert({
        "candidate_id": candidate_id,
        "job_offer_id": job_offer_id,
        "match_json": match,
        "model": llm_engine.GROQ_MODEL,
    }).execute()

    return jsonify({"match": match, "job": job_row})


# ══════════════════════════════════════════════════════════════════════════
# FEATURE 4 — SMART RECLAMATION AI
# ══════════════════════════════════════════════════════════════════════════

def _save_reclamation_ai(reclamation_id, result):
    """Persist LLM reclamation analysis onto the reclamations row."""
    update = {
        "ai_predicted_priority": result.get("priority"),
        "ai_predicted_category": result.get("category"),
        "ai_confidence": result.get("confidence"),
        "ai_sentiment": result.get("sentiment"),
        "ai_summary": result.get("summary"),
        "ai_suggested_reply": result.get("suggested_reply"),
    }
    update = {k: v for k, v in update.items() if v is not None}
    supabase.table("reclamations").update(update).eq("id", reclamation_id).execute()


@recruitment_bp.route("/reclamation/classify", methods=["POST"])
def reclamation_classify():
    """Analyse a single complaint. If reclamation_id is given, persist the result."""
    body = request.get_json(force=True, silent=True) or {}
    subject = body.get("subject", "")
    message = body.get("message", "")
    reclamation_id = body.get("reclamation_id")

    if not message and not subject:
        return jsonify({"error": "subject ou message requis"}), 400

    result = _deep_clean(llm_engine.classify_reclamation(subject, message))
    if result.get("_error"):
        return jsonify({"error": result["_error"]}), 502

    if reclamation_id:
        _save_reclamation_ai(reclamation_id, result)

    return jsonify({"result": result})


@recruitment_bp.route("/reclamation/analyze-all", methods=["POST"])
def reclamation_analyze_all():
    """Batch-process complaints that have no AI priority yet."""
    body = request.get_json(force=True, silent=True) or {}
    limit = int(body.get("limit", 25))

    query = supabase.table("reclamations").select(
        "id, subject, message, ai_predicted_priority"
    )
    if body.get("only_new", True):
        query = query.is_("ai_predicted_priority", "null")
    recs = (query.limit(limit).execute().data) or []

    processed = []
    for rec in recs:
        result = _deep_clean(llm_engine.classify_reclamation(rec.get("subject"), rec.get("message")))
        if result.get("_error"):
            continue
        _save_reclamation_ai(rec["id"], result)
        processed.append({"id": rec["id"], **result})

    return jsonify({"processed_count": len(processed), "items": processed})


# ══════════════════════════════════════════════════════════════════════════
# FEATURE 5 — INTERVIEW QUESTION GENERATOR
# ══════════════════════════════════════════════════════════════════════════

@recruitment_bp.route("/interview/generate", methods=["POST"])
def interview_generate():
    """
    Generate interview questions. Either:
      * {candidate_id, job_offer_id?}  (uses stored CV + job), OR
      * {cv_text, job_title, job_description}
    """
    body = request.get_json(force=True, silent=True) or {}
    candidate_id = body.get("candidate_id")

    if candidate_id:
        cand = supabase.table("candidates").select("*").eq("id", candidate_id).execute()
        if not cand.data:
            return jsonify({"error": "Candidat introuvable"}), 404
        candidate = cand.data[0]
        cv_text = candidate.get("cv_text", "")
        job_offer_id = body.get("job_offer_id") or candidate.get("job_offer_id")
        job_title, job_desc = candidate.get("current_title") or "Poste", ""
        if job_offer_id:
            job = supabase.table("job_offers").select("*").eq("id", job_offer_id).execute()
            if job.data:
                job_title = job.data[0]["title"]
                job_desc = job.data[0]["description"]
    else:
        cv_text = body.get("cv_text", "")
        job_title = body.get("job_title", "Poste")
        job_desc = body.get("job_description", "")
        job_offer_id = None
        candidate = None

    if not cv_text or len(cv_text) < 30:
        return jsonify({"error": "CV manquant ou trop court"}), 400

    questions = _deep_clean(llm_engine.generate_interview_questions(_clean_text(cv_text), job_title, job_desc))
    if questions.get("_error"):
        return jsonify({"error": questions["_error"]}), 502

    if candidate_id:
        supabase.table("cv_analyses").insert({
            "candidate_id": candidate_id,
            "job_offer_id": job_offer_id,
            "interview_json": questions,
            "model": llm_engine.GROQ_MODEL,
        }).execute()

    return jsonify({"questions": questions, "job_title": job_title})


# ══════════════════════════════════════════════════════════════════════════
# FEATURE 6 — HR INSIGHTS SUMMARIZER
# ══════════════════════════════════════════════════════════════════════════

@recruitment_bp.route("/insights/summary", methods=["GET"])
def insights_summary():
    """Aggregate attendance + fraud stats and produce a natural-language report."""
    from datetime import datetime, timedelta
    from collections import Counter

    company_id = request.args.get("company_id")
    days = int(request.args.get("days", 30))
    since = (datetime.utcnow().date() - timedelta(days=days)).isoformat()

    att_q = supabase.table("attendance_logs").select(
        "status, type, date, employee_id"
    ).gte("date", since)
    if company_id:
        att_q = att_q.eq("company_id", company_id)
    logs = att_q.execute().data or []

    fraud_q = supabase.table("fraud_alerts").select("alert_type, severity").gte(
        "created_at", since
    )
    alerts = fraud_q.execute().data or []

    status_counts = Counter((l.get("status") or "?") for l in logs)
    type_counts = Counter((l.get("type") or "?") for l in logs)
    severity_counts = Counter((a.get("severity") or "?") for a in alerts)
    alert_type_counts = Counter((a.get("alert_type") or "?") for a in alerts)

    stats = {
        "période_jours": days,
        "total_pointages": len(logs),
        "employés_actifs": len({l.get("employee_id") for l in logs}),
        "statuts": dict(status_counts),
        "types": dict(type_counts),
        "retards": status_counts.get("late", 0),
        "total_alertes_fraude": len(alerts),
        "alertes_par_sévérité": dict(severity_counts),
        "alertes_par_type": dict(alert_type_counts),
    }

    if not logs and not alerts:
        return jsonify({"stats": stats, "report": {
            "headline": "Pas de données",
            "summary": "Aucun pointage ni alerte sur la période sélectionnée.",
            "key_findings": [], "risks": [], "recommendations": [],
        }})

    report = llm_engine.summarize_hr_insights(stats)
    if report.get("_error"):
        return jsonify({"error": report["_error"], "stats": stats}), 502

    return jsonify({"stats": stats, "report": report})
