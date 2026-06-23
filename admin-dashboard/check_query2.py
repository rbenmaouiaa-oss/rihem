import requests

headers = {"apikey": "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv", "Authorization": "Bearer sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"}
company_id = "e8f9c122-38b4-4b53-8f67-85bdeee7a99f"

# Same query as frontend: select * from attendance_logs where company_id = X order by created_at desc
# With limit 10000 (the fix)
params = {
    "select": "*",
    "company_id": f"eq.{company_id}",
    "order": "created_at.desc.nullslast",
    "limit": "10000"
}
resp = requests.get(f"https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/attendance_logs", headers=headers, params=params)
logs = resp.json()
print("Total records returned:", len(logs))

# Count by employee_id
from collections import Counter
emp_counts = Counter(l["employee_id"] for l in logs)
print(f"Distinct employees: {len(emp_counts)}")
for emp_id, count in sorted(emp_counts.items(), key=lambda x: -x[1]):
    # Get user name
    r = requests.get(f"https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/users?select=nom,prenom&id=eq.{emp_id}", headers=headers)
    users = r.json()
    name = f"{users[0].get('prenom','')} {users[0].get('nom','')}" if users else "???"
    print(f"  {name:25s} {count} pointages")

# Check if created_at is null for any records
null_created = sum(1 for l in logs if l.get("created_at") is None)
print(f"\nRecords with NULL created_at: {null_created}")
