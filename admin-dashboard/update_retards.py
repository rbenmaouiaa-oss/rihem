import requests

headers = {"apikey": "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv", "Authorization": "Bearer sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv", "Content-Type": "application/json"}

# Fetch all check_in with time >= 09:00 using pagination
all_logs = []
for offset in range(0, 10000, 1000):
    params = {
        "select": "id",
        "type": "eq.check_in",
        "time": "gte.09:00:00",
        "limit": "1000",
        "offset": str(offset)
    }
    resp = requests.get("https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/attendance_logs", headers=headers, params=params)
    records = resp.json()
    if not records:
        break
    all_logs.extend(records)
    print(f"  offset={offset}: {len(records)} records")

print(f"Total check-ins >= 09:00: {len(all_logs)}")

# PATCH in batches
updated = 0
for log in all_logs:
    r = requests.patch(f"https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/attendance_logs?id=eq.{log['id']}", 
                       headers={**headers, "Prefer": "resolution=merge-duplicates"}, json={"status": "late"}, timeout=10)
    if r.status_code in (200, 204):
        updated += 1
    if updated % 500 == 0:
        print(f"  Updated: {updated}")

print(f"Termine. {updated}/{len(all_logs)} pointages mis a jour en retard")
