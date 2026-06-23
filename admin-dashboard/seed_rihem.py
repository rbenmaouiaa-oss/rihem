import requests, random
from datetime import datetime, timedelta

SUPABASE_URL = "https://npouyrppjqbxifuvpqan.supabase.co"
SUPABASE_KEY = "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}

# Only seed the 2 Rihem accounts
resp = requests.get(f"{SUPABASE_URL}/rest/v1/users?select=id,nom,prenom,company_id,email", headers=HEADERS)
users = [u for u in resp.json() if "rihem" in u.get("nom","").lower() or "rihem" in u.get("prenom","").lower()]
print(f"{len(users)} employes Rihem a traiter")

start = datetime(2026, 2, 1)
end = datetime(2026, 6, 30)
total = 0

for user in users:
    uid = user["id"]
    company_id = user.get("company_id")
    name = f"{user.get('prenom','')} {user.get('nom','')}".strip()

    # Delete old pointages if any
    requests.delete(f"{SUPABASE_URL}/rest/v1/attendance_logs?employee_id=eq.{uid}", headers=HEADERS)

    d = start
    day_count = 0
    inserted = 0

    while d <= end:
        if d.weekday() >= 5:
            d += timedelta(days=1)
            continue
        date_str = d.strftime("%Y-%m-%d")
        status = "late" if random.random() < 0.2 else "present"

        entries = [
            ("check_in", f"{random.randint(7,9):02d}:{random.randint(0,59):02d}:00", status),
            ("check_out", f"{random.choice([11,12])}:{random.randint(0,59):02d}:00", "present"),
            ("check_in", f"{random.randint(13,14):02d}:{random.randint(0,30):02d}:00", status),
            ("check_out", f"{random.randint(16,18):02d}:{random.randint(0,59):02d}:00", "present"),
        ]

        for ptg_type, ptg_time, ptg_status in entries:
            face_ok = True if ptg_type == "check_out" else (random.random() > 0.3)
            payload = {
                "company_id": company_id, "employee_id": uid,
                "type": ptg_type, "status": ptg_status,
                "qr_verified": True, "face_verified": face_ok,
                "face_score": round(random.uniform(0.1, 0.45), 4),
                "date": date_str, "time": ptg_time,
            }
            r = requests.post(f"{SUPABASE_URL}/rest/v1/attendance_logs", headers=HEADERS, json=payload, timeout=10)
            if r.status_code in (200, 201):
                inserted += 1

        day_count += 1
        d += timedelta(days=1)

    total += inserted
    print(f"  {name}: {day_count} jours ({inserted} pointages)")

print(f"\nTermine. {total} pointages ajoutes.")
