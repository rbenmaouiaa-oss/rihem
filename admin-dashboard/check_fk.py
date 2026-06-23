import requests
headers = {"apikey": "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv", "Authorization": "Bearer sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"}

# Check if f2222222 user exists
uid = "f2222222-cdee-4d97-b5ae-a3867e6f3a30"
r = requests.get(f"https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/users?id=eq.{uid}", headers=headers)
print("f2222222 check:", r.status_code, r.json())

# Also check f3333333
uid2 = "f3333333-cdee-4d97-b5ae-a3867e6f3a30"
r2 = requests.get(f"https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/users?id=eq.{uid2}", headers=headers)
print("f3333333 check:", r2.status_code, r2.json())

# Try inserting with a known user ID
uid3 = "27b9cf66-484d-4902-9983-205564410330"
payload = {"company_id": "e8f9c122-38b4-4b53-8f67-85bdeee7a99f", "employee_id": uid3, "type": "check_in", "status": "present", "qr_verified": True, "face_verified": True, "face_score": 0.5, "date": "2026-06-30", "time": "08:00:00"}
r3 = requests.post("https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/attendance_logs", headers={**headers, "Content-Type": "application/json"}, json=payload, timeout=10)
print("Insert with 27b9cf66:", r3.status_code, r3.text[:100])
