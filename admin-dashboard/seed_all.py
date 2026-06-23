import requests, random
from datetime import datetime, timedelta
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

SUPABASE_URL = "https://npouyrppjqbxifuvpqan.supabase.co"
SUPABASE_KEY = "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}

session = requests.Session()
retries = Retry(total=5, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
session.mount("https://", HTTPAdapter(max_retries=retries, pool_connections=10, pool_maxsize=20))

print("1. Suppression de tous les pointages...")
del_resp = session.delete(f"{SUPABASE_URL}/rest/v1/attendance_logs?select=id", headers=HEADERS)
print(f"   DELETE: {del_resp.status_code}")

print("2. Chargement des employés...")
resp = session.get(f"{SUPABASE_URL}/rest/v1/users?select=id,nom,prenom,company_id", headers=HEADERS)
users = [u for u in resp.json() if "Super" not in u.get("nom","") and "superadmin" not in u.get("email","")]
print(f"   {len(users)} employés")

start = datetime(2026, 2, 1)
end = datetime(2026, 6, 30)
total = 0

for user in users:
    uid = user["id"]
    company_id = user.get("company_id")
    name = f"{user.get('prenom','')} {user.get('nom','')}".strip()

    d = start
    day_count = 0
    payloads = []

    while d <= end:
        if d.weekday() >= 5:
            d += timedelta(days=1)
            continue
        date_str = d.strftime("%Y-%m-%d")

        h1, m1 = random.randint(7, 9), random.randint(0, 59)
        h2a, m2a = random.randint(11, 11), random.randint(30, 59)
        h2b, m2b = random.randint(12, 12), random.randint(0, 30)
        h2, m2 = random.choice([(h2a, m2a), (h2b, m2b)])
        h3, m3 = random.randint(13, 14), random.randint(0, 30)
        h4, m4 = random.randint(16, 18), random.randint(0, 59)
        status = "late" if h1 >= 9 or (h1 == 9 and m1 > 0) else "present"

        entries = [
            ("check_in", f"{h1:02d}:{m1:02d}:00", status),
            ("check_out", f"{h2:02d}:{m2:02d}:00", "present"),
            ("check_in", f"{h3:02d}:{m3:02d}:00", status),
            ("check_out", f"{h4:02d}:{m4:02d}:00", "present"),
        ]

        for ptg_type, ptg_time, ptg_status in entries:
            face_ok = True if ptg_type == "check_out" else (random.random() > 0.3)
            payloads.append({
                "company_id": company_id,
                "employee_id": uid,
                "type": ptg_type,
                "status": ptg_status,
                "qr_verified": True,
                "face_verified": face_ok,
                "face_score": round(random.uniform(0.1, 0.45), 4),
                "date": date_str,
                "time": ptg_time,
            })

        day_count += 1
        d += timedelta(days=1)

    # Insérer par lots de 50 pour éviter le rate limiting
    batch_size = 50
    inserted = 0
    for i in range(0, len(payloads), batch_size):
        batch = payloads[i:i+batch_size]
        for p in batch:
            try:
                r = session.post(f"{SUPABASE_URL}/rest/v1/attendance_logs", headers=HEADERS, json=p, timeout=15)
                if r.status_code in (200, 201):
                    inserted += 1
            except Exception as e:
                print(f"    ERREUR {p['type']} {p['time']}: {e}")

    total += inserted
    print(f"   {name}: {day_count} jours ({inserted} pointages)")

print(f"\n=== TERMINE === {total} pointages au total")
