import requests, json

url = 'https://npouyrppjqbxifuvpqan.supabase.co'
key = 'sb_secret_i1bGnoLOPvDPJuHfiV4znw_ynOW3raJ'
h = {'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'Accept': 'application/json'}

query = 'ALTER TABLE users ADD COLUMN IF NOT EXISTS status text DEFAULT \'absent\''

# Try pg_sql rpc
r = requests.post(url + '/rest/v1/rpc/pg_sql', json={'query': query}, headers=h)
print('pg_sql rpc:', r.status_code, r.text[:200])

# Try /sql endpoint
r2 = requests.post(url + '/sql', json={'query': query}, headers=h)
print('/sql:', r2.status_code, r2.text[:200])

# Try management API
r3 = requests.post('https://api.supabase.com/v1/projects/npouyrppjqbxifuvpqan/sql', json={'query': query}, headers=h)
print('mgmt API:', r3.status_code, r3.text[:200])
