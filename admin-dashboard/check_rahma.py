import requests

headers = {"apikey": "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv", "Authorization": "Bearer sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"}

# Check specific users
users_to_check = ["rahma", "rania", "Super Admin"]
users_resp = requests.get("https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/users?select=id,nom,prenom,email", headers=headers)

for u in users_resp.json():
    name = f"{u.get('prenom','')} {u.get('nom','')}".strip()
    if any(x in name.lower() for x in ["rahma", "rania", "super admin"]):
        uid = u["id"]
        r = requests.get(f"https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/attendance_logs?select=id&employee_id=eq.{uid}&limit=500", headers=headers)
        print(f"{name:25s} id={uid}  pointages={len(r.json())}")

# Now get ALL records and check the count
count_resp = requests.get("https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/attendance_logs?select=id&limit=1", headers=headers)
# Use count query
cnt = requests.get("https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/attendance_logs?select=id", headers=headers, params={"select": "id", "limit": "10000"})
print(f"\nTotal attendance_logs records: {len(cnt.json())}")
