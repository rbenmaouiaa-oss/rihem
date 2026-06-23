import requests
from datetime import datetime

SUPABASE_URL = "https://npouyrppjqbxifuvpqan.supabase.co"
SUPABASE_KEY = "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}

resp = requests.get(f"{SUPABASE_URL}/rest/v1/users?select=id,nom,prenom,email", headers=HEADERS)
for u in resp.json()[:3]:
    uid = u["id"]
    r2 = requests.get(f"{SUPABASE_URL}/rest/v1/attendance_logs?select=date&employee_id=eq.{uid}&order=date.asc", headers=HEADERS)
    rows = r2.json()
    dates = sorted(set(row["date"] for row in rows))
    first = dates[0] if dates else "-"
    last = dates[-1] if dates else "-"
    name = f"{u.get('prenom','')} {u.get('nom','')}".strip()
    print(f"{name}: {len(dates)} jours uniques, {first} -> {last}")
