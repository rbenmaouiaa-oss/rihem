import requests
url = 'https://npouyrppjqbxifuvpqan.supabase.co'
anon_key = 'sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv'
service_key = 'sb_secret_i1bGnoLOPvDPJuHfiV4znw_ynOW3raJ'

h_anon = {'apikey': anon_key, 'Authorization': f'Bearer {anon_key}'}
h_service = {'apikey': service_key, 'Authorization': f'Bearer {service_key}'}

print("=== TEAMS (anon key) ===")
r = requests.get(f'{url}/rest/v1/teams?select=*', headers=h_anon)
print(f"  Status: {r.status_code}")
try:
    data = r.json()
    print(f"  Count: {len(data)}")
    for t in data:
        print(f"    {t.get('name','?')}")
except:
    print(f"  Response: {r.text[:200]}")

print("\n=== TEAMS (service key) ===")
r = requests.get(f'{url}/rest/v1/teams?select=*', headers=h_service)
print(f"  Status: {r.status_code}")
try:
    data = r.json()
    print(f"  Count: {len(data)}")
    for t in data:
        print(f"    {t.get('name','?')} manager_id={str(t.get('manager_id',''))[:12]}")
except:
    print(f"  Response: {r.text[:200]}")
