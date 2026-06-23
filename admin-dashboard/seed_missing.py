import requests, random
from datetime import datetime, timedelta

SUPABASE_URL = "https://npouyrppjqbxifuvpqan.supabase.co"
SUPABASE_KEY = "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}

print("Chargement des employés...")
resp = requests.get(f"{SUPABASE_URL}/rest/v1/users?select=id,nom,prenom,company_id", headers=HEADERS)
users = resp.json()

# Vérifier combien de pointages chaque employé a
print("Vérification des pointages existants...")
for user in users:
    uid = user["id"]
    r = requests.get(f"{SUPABASE_URL}/rest/v1/attendance_logs?select=id&employee_id=eq.{uid}&limit=1", headers=HEADERS)
    count_resp = requests.get(f"{SUPABASE_URL}/rest/v1/attendance_logs?select=id&employee_id=eq.{uid}&limit=500", headers=HEADERS)
    count = len(count_resp.json())
    name = f"{user.get('prenom','')} {user.get('nom','')}".strip()
    print(f"  {name}: {count} pointages")

print("\nEmployés avec < 400 pointages (besoin de données):")
start = datetime(2026, 2, 1)
end = datetime(2026, 6, 30)
total = 0

for user in users:
    uid = user["id"]
    company_id = user.get("company_id")
    name = f"{user.get('prenom','')} {user.get('nom','')}".strip()

    r = requests.get(f"{SUPABASE_URL}/rest/v1/attendance_logs?select=id&employee_id=eq.{uid}&limit=500", headers=HEADERS)
    existing_count = len(r.json())

    if existing_count >= 400:
        print(f"  {name}: déjà {existing_count} - ignoré")
        continue

    # Supprimer les anciens pointages
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

        h1, m1 = random.randint(7, 9), random.randint(0, 59)
        h2a, m2a, h2b, m2b = 11, random.randint(30, 59), 12, random.randint(0, 30)
        h2, m2 = random.choice([(h2a, m2a), (h2b, m2b)])
        h3, m3 = random.randint(13, 14), random.randint(0, 30)
        h4, m4 = random.randint(16, 18), random.randint(0, 59)

        entries = [
            ("check_in", f"{h1:02d}:{m1:02d}:00", status),
            ("check_out", f"{h2:02d}:{m2:02d}:00", "present"),
            ("check_in", f"{h3:02d}:{m3:02d}:00", status),
            ("check_out", f"{h4:02d}:{m4:02d}:00", "present"),
        ]

        for ptg_type, ptg_time, ptg_status in entries:
            face_ok = True if ptg_type == "check_out" else (random.random() > 0.3)
            payload = {
                "company_id": company_id,
                "employee_id": uid,
                "type": ptg_type,
                "status": ptg_status,
                "qr_verified": True,
                "face_verified": face_ok,
                "face_score": round(random.uniform(0.1, 0.45), 4),
                "date": date_str,
                "time": ptg_time,
            }
            try:
                r = requests.post(f"{SUPABASE_URL}/rest/v1/attendance_logs", headers=HEADERS, json=payload, timeout=10)
                if r.status_code in (200, 201):
                    inserted += 1
            except Exception as e:
                print(f"    ERREUR {ptg_type} {ptg_time}: {e}")

        day_count += 1
        d += timedelta(days=1)

    total += inserted
    print(f"  {name}: {day_count} jours ({inserted} pointages)")

print(f"\n=== TERMINE === {total} pointages ajoutés")
