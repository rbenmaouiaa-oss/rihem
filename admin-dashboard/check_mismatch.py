import requests

headers = {"apikey": "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv", "Authorization": "Bearer sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"}

users_resp = requests.get("https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/users?select=id", headers=headers)
user_ids = {u["id"] for u in users_resp.json()}
print("Users in table:", len(user_ids))

att_resp = requests.get("https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/attendance_logs?select=employee_id&limit=5000", headers=headers)
emp_ids = {a["employee_id"] for a in att_resp.json()}
print("Distinct employee_ids in attendance_logs:", len(emp_ids))

missing = emp_ids - user_ids
extra = user_ids - emp_ids

if missing:
    print("employee_ids NOT in users table:", missing)
else:
    print("All employee_ids match user ids OK")

if extra:
    print("Users without pointages:")
    for e in extra:
        r = requests.get("https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/users?select=nom,prenom,email&id=eq."+e, headers=headers)
        name = r.json()
        if name:
            u = name[0]
            print("  ", u.get('prenom',''), u.get('nom',''), u.get('email',''))
        else:
            print("  ", e[:8])
else:
    print("All user ids have pointages OK")
