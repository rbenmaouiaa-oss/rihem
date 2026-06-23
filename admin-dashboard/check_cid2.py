import requests

headers = {"apikey": "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv", "Authorization": "Bearer sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"}

# Check company_id in pointages for a "broken" employee vs a "working" one
users_resp = requests.get("https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/users?select=id,nom,prenom,company_id,email", headers=headers)

for u in users_resp.json():
    name = f"{u.get('prenom','')} {u.get('nom','')}".strip()
    uid = u["id"]
    uid_short = uid[:8]
    
    # Get first 3 pointages and check company_id
    r = requests.get(f"https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/attendance_logs?select=company_id,date,time&employee_id=eq.{uid}&limit=3&order=date.desc", headers=headers)
    logs = r.json()
    if logs:
        cids = set(l.get("company_id") for l in logs)
        dates = [l.get("date") for l in logs]
        print(f"{name:25s} uid={uid_short}  company_ids={cids}  dates={dates}")
    else:
        print(f"{name:25s} uid={uid_short}  NO DATA")
