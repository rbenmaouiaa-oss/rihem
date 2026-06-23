import requests, random, time
from datetime import datetime, timedelta

SUPABASE_URL = "https://npouyrppjqbxifuvpqan.supabase.co"
SUPABASE_KEY = "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}

resp = requests.get(f"{SUPABASE_URL}/rest/v1/users?select=id,nom,prenom,company_id", headers=HEADERS)
users = resp.json()
print(f"{len(users)} employes trouves")

# Date range: 1er Fevrier 2026 -> aujourd'hui
start = datetime(2026, 2, 1)
end = datetime.now()
total = 0
skipped_users = []
processed_users = []

for user in users:
    uid = user["id"]
    company_id = user.get("company_id")
    name = f"{user.get('prenom','')} {user.get('nom','')}".strip()

    # Skip Super Admin (company_id likely null)
    if "Super" in name or "superadmin" in name.lower():
        skipped_users.append(name)
        continue

    # Delete all existing pointages for this user
    del_resp = requests.delete(
        f"{SUPABASE_URL}/rest/v1/attendance_logs?employee_id=eq.{uid}",
        headers=HEADERS
    )
    if del_resp.status_code not in (200, 204):
        print(f"  ERREUR suppression {name}: {del_resp.status_code}")
        continue

    day_count = 0
    d = start
    while d <= end:
        if d.weekday() >= 5:  # skip weekend
            d += timedelta(days=1)
            continue

        date_str = d.strftime("%Y-%m-%d")
        status = "late" if random.random() < 0.2 else "present"

        # Heures aleatoires dans les plages
        h1, m1 = random.randint(7, 9), random.randint(0, 59)           # entree1 07-09h
        h2, m2 = random.choice([(11, random.randint(30,59)), (12, random.randint(0,30))])  # sortie1 11:30-12:30
        h3, m3 = random.randint(13, 14), random.randint(0, 30)         # entree2 13-14h
        h4, m4 = random.randint(16, 18), random.randint(0, 59)         # sortie2 16-18h

        entries = [
            ("check_in", f"{h1:02d}:{m1:02d}:00"),
            ("check_out", f"{h2:02d}:{m2:02d}:00"),
            ("check_in", f"{h3:02d}:{m3:02d}:00"),
            ("check_out", f"{h4:02d}:{m4:02d}:00"),
        ]

        for ptg_type, ptg_time in entries:
            payload = {
                "company_id": company_id,
                "employee_id": uid,
                "type": ptg_type,
                "status": status if ptg_type == "check_in" else "present",
                "qr_verified": True,
                "face_verified": True if (ptg_type == "check_in" and random.random() > 0.3) else True,
                    "face_score": round(random.uniform(0.1, 0.45), 4),
                "date": date_str,
                "time": ptg_time,
            }
            try:
                r = requests.post(f"{SUPABASE_URL}/rest/v1/attendance_logs", headers=HEADERS, json=payload, timeout=10)
                if r.status_code in (200, 201):
                    total += 1
            except Exception as e:
                print(f"    ERREUR {ptg_type} {ptg_time}: {e}")
                time.sleep(0.5)
                # retry once
                try:
                    r = requests.post(f"{SUPABASE_URL}/rest/v1/attendance_logs", headers=HEADERS, json=payload, timeout=10)
                    if r.status_code in (200, 201):
                        total += 1
                except Exception as e2:
                    print(f"    RETRY ECHEC {ptg_type} {ptg_time}: {e2}")
            time.sleep(0.05)

        day_count += 1
        d += timedelta(days=1)

    processed_users.append((name, day_count))
    print(f"  {name}: {day_count} jours ({day_count*4} pointages)")

print(f"\n=== RESULTAT ===")
for name, days in processed_users:
    print(f"  {name}: {days} jours, {days*4} pointages")
print(f"Total: {total} pointages inseres")
if skipped_users:
    print(f"Ignored: {', '.join(skipped_users)}")
