import requests, random, time
from datetime import datetime, timedelta

SUPABASE_URL = "https://npouyrppjqbxifuvpqan.supabase.co"
SUPABASE_KEY = "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}

# Récupérer tous les employés
resp = requests.get(f"{SUPABASE_URL}/rest/v1/users?select=id,nom,prenom,email", headers=HEADERS)
users = resp.json()
print(f"{len(users)} employés trouvés")

# Générer les pointages du 2026-01-01 à aujourd'hui
start = datetime(2026, 1, 1)
end = datetime.now()
today_str = end.strftime("%Y-%m-%d")

total = 0
for user in users:
    uid = user["id"]
    d = start
    while d <= end:
        if d.weekday() < 5:  # Lundi=0, Vendredi=4
            date_str = d.strftime("%Y-%m-%d")
            if date_str == today_str:
                d += timedelta(days=1)
                continue
            prob = random.random()
            if prob < 0.1:  # 10% absent
                continue
            status = "late" if random.random() < 0.15 else "present"
            entree1 = f"{random.randint(7,9):02d}:{random.randint(0,59):02d}"
            sortie1 = f"12:{random.randint(0,30):02d}"
            entree2 = f"13:{random.randint(0,30):02d}"
            sortie2 = f"{random.randint(16,18):02d}:{random.randint(0,59):02d}"
            payload = {
                "employee_id": uid,
                "date": date_str,
                "entree1": entree1,
                "sortie1": sortie1,
                "entree2": entree2,
                "sortie2": sortie2,
                "status": status,
                "status_qr": True,
                "status_face": True
            }
            time.sleep(0.05)
            r = requests.post(f"{SUPABASE_URL}/rest/v1/attendance_logs", headers=HEADERS, json=payload)
            if r.status_code in (200, 201):
                total += 1
            else:
                print(f"  Erreur {uid[:8]} {date_str}: {r.status_code} {r.text[:80]}")
        d += timedelta(days=1)
    print(f"  {user.get('prenom','')} {user.get('nom','')}: OK")

print(f"\n{total} pointages insérés de 2026-01-01 à {today_str}")
