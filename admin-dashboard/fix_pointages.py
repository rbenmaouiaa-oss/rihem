import requests, random, time
from datetime import datetime

SUPABASE_URL = "https://npouyrppjqbxifuvpqan.supabase.co"
SUPABASE_KEY = "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}

resp = requests.get(f"{SUPABASE_URL}/rest/v1/users?select=id,nom,prenom,company_id", headers=HEADERS)
users = resp.json()
total = 0

for user in users:
    uid = user["id"]
    company_id = user.get("company_id")

    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/attendance_logs?select=id,date,type,time&employee_id=eq.{uid}&order=date.asc,time.asc&limit=100",
        headers=HEADERS,
    )
    logs = r.json()

    dates = {}
    for log in logs:
        dates.setdefault(log["date"], []).append(log)

    for date_str, entries in sorted(dates.items()):
        times_in = sorted([e["time"] for e in entries if e["type"] == "check_in"])
        times_out = sorted([e["time"] for e in entries if e["type"] == "check_out"])

        needs_sortie1 = True
        needs_entree2 = True
        needs_sortie2 = True

        for t in times_out:
            h = int(t.split(":")[0])
            if h < 13:
                needs_sortie1 = False  # already has sortie1

        for t in times_in:
            h = int(t.split(":")[0])
            if h >= 12:
                needs_entree2 = False  # already has entree2

        for t in times_out:
            h = int(t.split(":")[0])
            if h >= 13:
                needs_sortie2 = False

        # If only 2 entries, add sortie1 around 12:00 and entree2 around 13:00
        if needs_sortie1 and times_out:
            # Add check_out around lunch time
            h = random.randint(11, 12)
            m = random.randint(0, 59)
            sortie1_time = f"{h:02d}:{m:02d}:00"
            payload = {
                "company_id": company_id,
                "employee_id": uid,
                "type": "check_out",
                "status": "present",
                "qr_verified": True,
                "face_verified": True,
                "face_score": round(random.uniform(0.1, 0.45), 4),
                "date": date_str,
                "time": sortie1_time,
            }
            time.sleep(0.03)
            r2 = requests.post(f"{SUPABASE_URL}/rest/v1/attendance_logs", headers=HEADERS, json=payload)
            if r2.status_code in (200, 201):
                total += 1
                print(f"  + sortie1 {sortie1_time} le {date_str} pour {user['prenom']} {user['nom']}")

        if needs_entree2:
            h = random.randint(13, 14)
            m = random.randint(0, 30)
            entree2_time = f"{h:02d}:{m:02d}:00"
            payload = {
                "company_id": company_id,
                "employee_id": uid,
                "type": "check_in",
                "status": "present",
                "qr_verified": True,
                "face_verified": True,
                "face_score": round(random.uniform(0.1, 0.45), 4),
                "date": date_str,
                "time": entree2_time,
            }
            time.sleep(0.03)
            r2 = requests.post(f"{SUPABASE_URL}/rest/v1/attendance_logs", headers=HEADERS, json=payload)
            if r2.status_code in (200, 201):
                total += 1
                print(f"  + entree2 {entree2_time} le {date_str} pour {user['prenom']} {user['nom']}")

print(f"\nTermine. {total} pointages ajoutes.")
