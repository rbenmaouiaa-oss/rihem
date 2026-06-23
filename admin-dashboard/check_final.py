import requests

SUPABASE_URL = "https://npouyrppjqbxifuvpqan.supabase.co"
SUPABASE_KEY = "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}

resp = requests.get(f"{SUPABASE_URL}/rest/v1/users?select=id,nom,prenom,email", headers=HEADERS)
for u in resp.json():
    uid = u["id"]
    r = requests.get(f"{SUPABASE_URL}/rest/v1/attendance_logs?select=id&employee_id=eq.{uid}&limit=500", headers=HEADERS)
    # Check distinct dates
    r2 = requests.get(f"{SUPABASE_URL}/rest/v1/attendance_logs?select=date&employee_id=eq.{uid}&order=date.asc", headers=HEADERS)
    dates = set(row["date"] for row in r2.json())
    name = f"{u.get('prenom','')} {u.get('nom','')}".strip()
    print(f"{name:25s} {len(r.json()):4d} pointages, {len(dates):3d} jours unique - de {list(dates)[:1]} à {list(dates)[-1:]}")
