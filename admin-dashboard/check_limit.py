import requests

headers = {"apikey": "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv", "Authorization": "Bearer sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"}
company_id = "e8f9c122-38b4-4b53-8f67-85bdeee7a99f"

# Try different limits
for limit in [1000, 2000, 5000, 10000]:
    params = {
        "select": "id",
        "company_id": f"eq.{company_id}",
        "limit": str(limit)
    }
    resp = requests.get(f"https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/attendance_logs", headers=headers, params=params)
    print(f"limit={limit:5d} -> returned {len(resp.json()):5d} records")

# Try without order
params2 = {"select": "id", "company_id": f"eq.{company_id}", "limit": "10000"}
resp2 = requests.get(f"https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/attendance_logs", headers=headers, params=params2)
print(f"\nWithout order: returned {len(resp2.json())}")

# Try with offset
params3 = {"select": "id", "company_id": f"eq.{company_id}", "limit": "5000", "offset": "1000"}
resp3 = requests.get(f"https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/attendance_logs", headers=headers, params=params3)
print(f"With offset 1000: returned {len(resp3.json())}")
