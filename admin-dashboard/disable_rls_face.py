import requests
url = 'https://npouyrppjqbxifuvpqan.supabase.co'
key = 'sb_secret_i1bGnoLOPvDPJuHfiV4znw_ynOW3raJ'
h = {'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'}

# Disable RLS on face_profiles via the pg REST API
r = requests.post(url + '/rest/v1/rpc/', headers=h, json={})
if r.status_code == 404:
    print("No RPC endpoint, trying direct SQL...")

# Use the pg_database endpoint to run SQL
# First, let's try the storage/sql endpoint
sql = "ALTER TABLE face_profiles DISABLE ROW LEVEL SECURITY;"
r = requests.post(url + '/rest/v1/', headers=h, data=sql)
print(f"Direct SQL result: {r.status_code} - {r.text[:200]}")

# Alternative: Use function-based approach
print("\nTrying to check current RLS status...")
r = requests.get(url + '/rest/v1/face_profiles?select=id&limit=1', headers=h)
print(f"Read test: {r.status_code}")
