import requests, random, time
from datetime import datetime, timedelta

SUPABASE_URL = "https://npouyrppjqbxifuvpqan.supabase.co"
SUPABASE_KEY = "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}

# Récupérer tous les employés
resp = requests.get(f"{SUPABASE_URL}/rest/v1/users?select=id,nom,prenom,email,company_id", headers=HEADERS)
users = resp.json()
print(f"{len(users)} employés trouvés")

today = datetime.now()
today_str = today.strftime("%Y-%m-%d")
total_inserted = 0

for user in users:
    uid = user["id"]
    company_id = user.get("company_id")

    # Supprimer les pointages existants pour pouvoir les recréer proprement
    del_resp = requests.delete(
        f"{SUPABASE_URL}/rest/v1/attendance_logs?employee_id=eq.{uid}",
        headers=HEADERS
    )
    print(f"  {user.get('prenom','')} {user.get('nom','')}: reinitialisation -> ajout de donnees...")

    # Ajouter des pointages pour les 5 derniers jours ouvrés
    for i in range(7, 0, -1):
        d = today - timedelta(days=i)
        if d.weekday() >= 5:
            continue  # skip weekend

        date_str = d.strftime("%Y-%m-%d")
        status = "late" if random.random() < 0.2 else "present"
        est_retard = status == "late"

        # 1) check_in matin (entree1, 07:00 - 09:00)
        h1 = random.randint(7, 9)
        m1 = random.randint(0, 59)
        heure_entree1 = f"{h1:02d}:{m1:02d}"

        # 2) check_out midi (sortie1, 11:30 - 12:30)
        h2 = random.choice([11, 12])
        m2 = 30 if h2 == 11 else random.randint(0, 30)
        heure_sortie1 = f"{h2:02d}:{m2:02d}"

        # 3) check_in apres-midi (entree2, 13:00 - 14:00)
        h3 = random.randint(13, 14)
        m3 = random.randint(0, 30)
        heure_entree2 = f"{h3:02d}:{m3:02d}"

        # 4) check_out soir (sortie2, 16:00 - 18:00)
        h4 = random.randint(16, 18)
        m4 = random.randint(0, 59)
        heure_sortie2 = f"{h4:02d}:{m4:02d}"

        for heure, type_ptg in [
            (heure_entree1, "check_in"),
            (heure_sortie1, "check_out"),
            (heure_entree2, "check_in"),
            (heure_sortie2, "check_out"),
        ]:
            payload = {
                "company_id": company_id,
                "employee_id": uid,
                "type": type_ptg,
                "status": status if type_ptg == "check_in" else "present",
                "qr_verified": True,
                "face_verified": True if (type_ptg == "check_in" and random.random() > 0.3) else True,
                "face_score": round(random.uniform(0.1, 0.45), 4),
                "date": date_str,
                "time": heure
            }
            time.sleep(0.03)
            r = requests.post(f"{SUPABASE_URL}/rest/v1/attendance_logs", headers=HEADERS, json=payload)
            if r.status_code in (200, 201):
                total_inserted += 1
            else:
                print(f"    ERREUR insertion {type_ptg} {heure}: {r.status_code} {r.text[:100]}")

    print(f"    OK {total_inserted} pointages au total")

print(f"\nTermine. {total_inserted} pointages inseres au total.")
