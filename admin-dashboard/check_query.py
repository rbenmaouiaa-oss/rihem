import requests

headers = {"apikey": "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv", "Authorization": "Bearer sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"}

company_id = "e8f9c122-38b4-4b53-8f67-85bdeee7a99f"

# Simulate the frontend query: attendance_logs filtered by company_id
resp = requests.get(
    f"https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/attendance_logs",
    headers=headers,
    params={"company_id": f"eq.{company_id}", "select": "employee_id", "limit": 6000}
)
logs = resp.json()
print(f"Attendance logs returned: {len(logs)}")

# Count per employee
from collections import Counter
emp_counts = Counter(l["employee_id"] for l in logs)
print(f"Distinct employees: {len(emp_counts)}")
for emp_id, count in sorted(emp_counts.items(), key=lambda x: -x[1]):
    print(f"  {emp_id[:8]}... {count} pointages")
