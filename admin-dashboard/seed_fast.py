import requests, random, concurrent.futures, sys
from datetime import datetime, timedelta

SUPABASE_URL = "https://npouyrppjqbxifuvpqan.supabase.co"
SUPABASE_KEY = "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}

resp = requests.get(f"{SUPABASE_URL}/rest/v1/users?select=id,nom,prenom,company_id", headers=HEADERS)
# Filtrer les employés qui n'ont pas assez de données
users = []
for u in resp.json():
    uid = u["id"]
    r = requests.get(f"{SUPABASE_URL}/rest/v1/attendance_logs?select=id&employee_id=eq.{uid}&limit=500", headers=HEADERS)
    count = len(r.json())
    name = f"{u.get('prenom','')} {u.get('nom','')}".strip()
    if count < 400 and "superadmin" not in u.get("email",""):
        print(f"  {name}: {count} pointages -> besoin de donnees")
        users.append(u)
    else:
        print(f"  {name}: {count} pointages -> OK")

if not users:
    print("Tous les employés ont assez de données !")
    sys.exit(0)

start = datetime(2026, 2, 1)
end = datetime(2026, 6, 30)

def insert_pointage(payload):
    try:
        r = requests.post(f"{SUPABASE_URL}/rest/v1/attendance_logs", headers=HEADERS, json=payload, timeout=15)
        return 1 if r.status_code in (200, 201) else 0
    except:
        return 0

all_payloads = []
for user in users:
    uid = user["id"]
    company_id = user.get("company_id")
    # Supprimer anciens
    requests.delete(f"{SUPABASE_URL}/rest/v1/attendance_logs?employee_id=eq.{uid}", headers=HEADERS)
    d = start
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
            all_payloads.append({
                "company_id": company_id, "employee_id": uid,
                "type": ptg_type, "status": ptg_status,
                "qr_verified": True, "face_verified": face_ok,
                "face_score": round(random.uniform(0.1, 0.45), 4),
                "date": date_str, "time": ptg_time,
            })
        d += timedelta(days=1)

print(f"Insertion de {len(all_payloads)} pointages avec 10 workers...")
inserted = 0
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    futures = [executor.submit(insert_pointage, p) for p in all_payloads]
    for i, f in enumerate(concurrent.futures.as_completed(futures)):
        inserted += f.result()
        if (i+1) % 100 == 0:
            print(f"  {i+1}/{len(all_payloads)} ({inserted} OK)")

print(f"\n=== TERMINE === {inserted}/{len(all_payloads)} pointages inseres")
