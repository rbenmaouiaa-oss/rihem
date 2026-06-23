import requests

headers = {"apikey": "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv", "Authorization": "Bearer sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"}

# Check users and their company_ids
users = requests.get("https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/users?select=id,nom,prenom,company_id,email,role", headers=headers).json()

company_ids = set()
for u in users:
    name = f"{u.get('prenom','')} {u.get('nom','')}".strip()
    cid = u.get("company_id")
    company_ids.add(str(cid))
    # Get one attendance_log for this user
    r = requests.get(f"https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/attendance_logs?select=company_id&employee_id=eq.{u['id']}&limit=1", headers=headers)
    logs = r.json()
    log_cid = logs[0].get("company_id") if logs else "NO_DATA"
    match = "OK" if str(log_cid) == str(cid) else f"MISMATCH (log={log_cid}, user={cid})"
    print(f"{name:25s} role={str(u.get('role','')):15s} user_cid={str(cid)[:12]:12s} log_cid={str(log_cid)[:12]:12s} {match}")

print(f"\nCompany IDs: {company_ids}")
