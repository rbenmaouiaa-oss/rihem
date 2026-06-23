import requests

SUPABASE_URL = "https://npouyrppjqbxifuvpqan.supabase.co"
SUPABASE_KEY = "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}

resp = requests.get(f"{SUPABASE_URL}/rest/v1/users?select=id,nom,prenom", headers=HEADERS)
users = resp.json()
print(f"{len(users)} employes")

for user in users:
    uid = user["id"]
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/attendance_logs?select=id,date,type,time&employee_id=eq.{uid}&order=date.asc,time.asc&limit=100",
        headers=HEADERS,
    )
    logs = r.json()
    # group by date
    dates = {}
    for log in logs:
        dates.setdefault(log["date"], []).append({"type": log["type"], "time": log["time"]})
    # show first 2 dates
    for d in sorted(dates.keys())[:2]:
        entries = dates[d]
        types = [e["type"] for e in entries]
        times = [e["time"] for e in entries]
        print(f"  {user['prenom']} {user['nom']}  {d}: {len(entries)} pointages")
        for t, tm in zip(types, times):
            print(f"    {t} {tm}")
