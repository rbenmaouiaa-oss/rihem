"""
AI Intelligence Engine for Rihem Attendance System
==================================================
1. Fraud Detection  - Analyzes attendance_logs for anomalies
2. Sentiment Analysis - Classifies reclamations priority & category

Usage:  python ai_intelligence.py
"""

import os
import sys
from datetime import datetime, timedelta

try:
    from supabase import create_client, Client
except ImportError:
    print("ERROR: supabase Python package not installed.")
    print("Run: pip install supabase")
    sys.exit(1)

SUPABASE_URL = "https://npouyrppjqbxifuvpqan.supabase.co"
SUPABASE_KEY = "sb_secret_i1bGnoLOPvDPJuHfiV4znw_ynOW3raJ"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ──────────────────────────────────────────────
# FRAUD DETECTION RULES
# ──────────────────────────────────────────────

def detect_anomalies():
    print("\n" + "="*60)
    print("  FRAUD DETECTION ENGINE")
    print("="*60)

    today = datetime.utcnow().date()
    thirty_days_ago = today - timedelta(days=30)

    resp = supabase.table("attendance_logs") \
        .select("*") \
        .gte("created_at", thirty_days_ago.isoformat()) \
        .order("employee_id", desc=False) \
        .order("created_at", desc=False) \
        .execute()

    logs = resp.data
    if not logs:
        print("  No attendance logs found in last 30 days.")
        return []

    print(f"  Analyzing {len(logs)} attendance logs...\n")

    # Group logs by employee
    from collections import defaultdict
    emp_logs = defaultdict(list)
    for log in logs:
        emp_logs[log["employee_id"]].append(log)

    alerts = []

    for emp_id, emp_att_list in emp_logs.items():
        emp_att_list.sort(key=lambda x: x.get("created_at", ""))

        for i, att in enumerate(emp_att_list):
            face_score = att.get("face_score")
            qr_ok = att.get("qr_verified")
            face_ok = att.get("face_verified")
            log_type = att.get("type")
            log_time_str = att.get("time")
            log_date_str = att.get("date")

            # Rule 1: Face score too low (< 0.15) - possible photo spoofing
            if face_score is not None and face_score < 0.15:
                alerts.append({
                    "attendance_log_id": att["id"],
                    "employee_id": emp_id,
                    "alert_type": "face_spoof_suspicion",
                    "severity": "high",
                    "description": f"Face score anormalement bas ({face_score:.3f}). Possible tentative de spoofing photo.",
                    "face_score": face_score,
                    "qr_verified": qr_ok,
                    "face_verified": face_ok,
                    "log_time": log_time_str,
                    "log_date": log_date_str,
                })

            # Rule 2: Face not verified but QR verified - partial verification
            if qr_ok and face_ok is False:
                alerts.append({
                    "attendance_log_id": att["id"],
                    "employee_id": emp_id,
                    "alert_type": "face_verification_failed",
                    "severity": "medium",
                    "description": "QR vérifié mais reconnaissance faciale échouée.",
                    "face_score": face_score,
                    "qr_verified": qr_ok,
                    "face_verified": face_ok,
                    "log_time": log_time_str,
                    "log_date": log_date_str,
                })

            # Rule 3: Neither QR nor face verified
            if qr_ok is False and face_ok is False:
                alerts.append({
                    "attendance_log_id": att["id"],
                    "employee_id": emp_id,
                    "alert_type": "double_verification_failed",
                    "severity": "critical",
                    "description": "Double vérification (QR + visage) échouée. Accès non authorisé.",
                    "face_score": face_score,
                    "qr_verified": qr_ok,
                    "face_verified": face_ok,
                    "log_time": log_time_str,
                    "log_date": log_date_str,
                })

            # Rule 4: Duplicate check-in within 5 minutes
            if i > 0:
                prev = emp_att_list[i-1]
                prev_time = prev.get("created_at")
                curr_time = att.get("created_at")
                if prev_time and curr_time:
                    try:
                        diff = (
                            datetime.fromisoformat(curr_time.replace("Z", "+00:00"))
                            - datetime.fromisoformat(prev_time.replace("Z", "+00:00"))
                        ).total_seconds()
                        if 0 < diff < 300 and log_type == prev.get("type"):
                            alerts.append({
                                "attendance_log_id": att["id"],
                                "employee_id": emp_id,
                                "alert_type": "rapid_duplicate",
                                "severity": "medium",
                                "description": f"Deux pointages '{log_type}' en moins de 5 min ({int(diff)}s). Possible badge sharing.",
                                "face_score": face_score,
                                "qr_verified": qr_ok,
                                "face_verified": face_ok,
                                "log_time": log_time_str,
                                "log_date": log_date_str,
                            })
                    except (ValueError, KeyError):
                        pass

            # Rule 5: Check-in at unusual hours (before 06:00 or after 22:00)
            if log_time_str:
                try:
                    parts = str(log_time_str).split(":")
                    hour = int(parts[0])
                    if hour < 6 or hour >= 22:
                        alerts.append({
                            "attendance_log_id": att["id"],
                            "employee_id": emp_id,
                            "alert_type": "unusual_hours",
                            "severity": "low",
                            "description": f"Pointage à {log_time_str} (en dehors des heures ouvrables 06:00-22:00).",
                            "face_score": face_score,
                            "qr_verified": qr_ok,
                            "face_verified": face_ok,
                            "log_time": log_time_str,
                            "log_date": log_date_str,
                        })
                except (ValueError, IndexError):
                    pass

    print(f"  Total alerts generated: {len(alerts)}")
    sev_counts = defaultdict(int)
    for a in alerts:
        sev_counts[a["severity"]] += 1
    for sev, count in sev_counts.items():
        print(f"    {sev.upper()}: {count}")

    # Insert alerts into Supabase (clear old ones first)
    if alerts:
        supabase.table("fraud_alerts").delete().gte("created_at", thirty_days_ago.isoformat()).execute()
        batch_size = 50
        for i in range(0, len(alerts), batch_size):
            batch = alerts[i:i+batch_size]
            supabase.table("fraud_alerts").insert(batch).execute()
        print(f"\n  Inserted {len(alerts)} fraud alerts into Supabase.")

    return alerts


# ──────────────────────────────────────────────
# SENTIMENT ANALYSIS FOR RECLAMATIONS
# ──────────────────────────────────────────────

URGENT_KEYWORDS = [
    "urgent", "immédiat", "tout de suite", "vite", "urgence",
    "bloquant", "bloqué", "critique", "grave", "problème majeur",
    "bug", "ne marche pas", "erreur", "plante", "casse",
]

CATEGORY_RULES = [
    ("Pointage", [
        "pointage", "badge", "qr", "scan", "check-in", "checkin",
        "check out", "checkout", "pointeuse", "carte", "lecteur",
        "empreinte", "doigt", "scanner", "esp32", "terminal",
    ]),
    ("Retard", [
        "retard", "en retard", "tard", "retardataire",
    ]),
    ("Absence", [
        "absence", "absent", "manquant", "manqué", "pas venu",
        "pas venue", "justificatif",
    ]),
    ("Congés", [
        "congé", "vacance", "vacances", "rtt", "repos",
        "jour férié", "férié", "week-end",
    ]),
    ("Salaire", [
        "salaire", "paie", "paye", "salaire", "rémunération",
        "prime", "indemnité", "avance", "smic",
    ]),
    ("Technique", [
        "appli", "application", "mobile", "login", "connexion",
        "mot de passe", "password", "compte", "bug appli",
        "crashe", "crash", "freeze", "lent",
    ]),
]

def classify_reclamation(subject: str, message: str):
    text = f"{subject or ''} {message or ''}".lower()

    # Priority classification
    urgent_score = sum(1 for kw in URGENT_KEYWORDS if kw in text)
    if urgent_score >= 2:
        predicted_priority = "urgent"
        confidence = min(0.95, 0.6 + urgent_score * 0.1)
    elif urgent_score == 1:
        predicted_priority = "urgent"
        confidence = 0.55
    else:
        predicted_priority = "normal"
        confidence = 0.7

    # Category classification
    best_cat = "Autre"
    best_score = 0
    for cat_name, keywords in CATEGORY_RULES:
        score = sum(1 for kw in keywords if kw in text)
        if score > best_score:
            best_score = score
            best_cat = cat_name

    # Override if subject explicitly mentions type
    for cat_name, keywords in CATEGORY_RULES:
        for kw in keywords:
            if subject and kw in subject.lower():
                best_cat = cat_name
                break

    if best_score == 0:
        best_cat = "Autre"
        confidence = min(confidence, 0.4)

    return predicted_priority, best_cat, round(confidence, 2)


# Try to load the Groq LLM engine; fall back to keyword rules if unavailable.
try:
    import llm_engine
    _LLM_OK = bool(llm_engine.GROQ_API_KEY)
except Exception:
    _LLM_OK = False


def classify_reclamation_smart(subject: str, message: str):
    """
    Returns (priority, category, confidence, extra) using the Groq LLM when
    available, otherwise the keyword classifier. `extra` carries sentiment,
    summary and the suggested reply (empty dict in fallback mode).
    """
    if _LLM_OK:
        res = llm_engine.classify_reclamation(subject, message)
        if not res.get("_error"):
            return (
                res.get("priority", "normal"),
                res.get("category", "Autre"),
                res.get("confidence", 0.7),
                {
                    "sentiment": res.get("sentiment"),
                    "summary": res.get("summary"),
                    "suggested_reply": res.get("suggested_reply"),
                },
            )
    p, c, conf = classify_reclamation(subject, message)
    return p, c, conf, {}


def analyze_reclamations():
    print("\n" + "="*60)
    print("  SENTIMENT ANALYSIS ENGINE  " + ("[LLM:Groq]" if _LLM_OK else "[keywords]"))
    print("="*60)

    resp = supabase.table("reclamations") \
        .select("id, subject, message, priority, ai_predicted_priority, ai_predicted_category") \
        .execute()

    recs = resp.data
    if not recs:
        print("  No reclamations found.")
        return

    print(f"  Analyzing {len(recs)} reclamations...\n")

    stats = {"normal": 0, "urgent": 0, "faible": 0, "category_counts": {}}
    for rec in recs:
        subj = rec.get("subject", "")
        msg = rec.get("message", "")
        predicted_priority, predicted_category, confidence, extra = \
            classify_reclamation_smart(subj, msg)

        update = {
            "ai_predicted_priority": predicted_priority,
            "ai_predicted_category": predicted_category,
            "ai_confidence": confidence,
        }
        if extra.get("sentiment"):
            update["ai_sentiment"] = extra["sentiment"]
        if extra.get("summary"):
            update["ai_summary"] = extra["summary"]
        if extra.get("suggested_reply"):
            update["ai_suggested_reply"] = extra["suggested_reply"]

        supabase.table("reclamations") \
            .update(update) \
            .eq("id", rec["id"]) \
            .execute()

        stats[predicted_priority] = stats.get(predicted_priority, 0) + 1
        stats["category_counts"][predicted_category] = stats["category_counts"].get(predicted_category, 0) + 1

        # Show interesting classifications
        if predicted_priority == "urgent" or confidence > 0.8:
            print(f"    [{predicted_priority.upper():6s}][{predicted_category:12s}] ({confidence:.0%}) {subj or '(no subject)'}")

    print(f"\n  Results:")
    print(f"    Normal: {stats.get('normal', 0)}")
    print(f"    Urgent: {stats.get('urgent', 0)}")
    print(f"    Categories:")
    for cat, count in sorted(stats["category_counts"].items(), key=lambda x: -x[1]):
        print(f"      {cat}: {count}")


# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────

if __name__ == "__main__":
    print("="*60)
    print("  RIHEM AI INTELLIGENCE ENGINE")
    print("="*60)

    fraud_alerts = detect_anomalies()
    analyze_reclamations()

    print("\n" + "="*60)
    print("  AI ANALYSIS COMPLETE")
    print(f"  Fraud alerts: {len(fraud_alerts)}")
    print("="*60)
