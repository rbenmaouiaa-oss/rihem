import requests
headers = {"apikey": "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv", "Authorization": "Bearer sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"}

r = requests.get("https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/attendance_logs?select=id,time,status&type=eq.check_in&limit=10&order=time.asc", headers=headers)
print("First 10 check-ins (by time):")
for log in r.json():
    print(f"  {log['time']} -> {log['status']}")

r2 = requests.get("https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/attendance_logs?select=id,time,status&type=eq.check_in&time=gte.09:00:00&limit=5", headers=headers)
print("\nLate check-ins:")
for log in r2.json():
    print(f"  {log['time']} -> {log['status']}")
