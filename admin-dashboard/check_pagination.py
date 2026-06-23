import requests

headers = {"apikey": "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv", "Authorization": "Bearer sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"}
company_id = "e8f9c122-38b4-4b53-8f67-85bdeee7a99f"

# Fetch in ranges like the frontend pagination will do
all_records = []
for offset in range(0, 10000, 1000):
    params = {
        "select": "*",
        "company_id": f"eq.{company_id}",
        "order": "created_at.desc.nullslast",
        "limit": "1000",
        "offset": str(offset)
    }
    resp = requests.get("https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/attendance_logs", headers=headers, params=params)
    records = resp.json()
    if not records:
        break
    all_records.extend(records)
    print(f"offset={offset}: got {len(records)} records (total: {len(all_records)})")

print(f"\nTotal records fetched: {len(all_records)}")

from collections import Counter
emp_counts = Counter(l["employee_id"] for l in all_records)
print(f"Distinct employees: {len(emp_counts)}")
for emp_id, count in sorted(emp_counts.items(), key=lambda x: -x[1]):
    r = requests.get(f"https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/users?select=nom,prenom&id=eq.{emp_id}", headers=headers)
    users = r.json()
    name = f"{users[0].get('prenom','')} {users[0].get('nom','')}" if users else "???"
    print(f"  {name:30s} {count}")
