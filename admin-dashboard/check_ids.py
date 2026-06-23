import requests

headers = {"apikey": "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv", "Authorization": "Bearer sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"}

users = requests.get("https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/users?select=id,nom,prenom,email", headers=headers).json()

for u in users:
    name = f"{u.get('prenom','')} {u.get('nom','')}".strip()
    uid = u["id"]
    r = requests.get(f"https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/attendance_logs?select=id&employee_id=eq.{uid}&limit=1", headers=headers)
    has_data = len(r.json()) > 0
    print(f"{name:30s} id={uid[:8]}... data={'YES' if has_data else 'NO'}")
