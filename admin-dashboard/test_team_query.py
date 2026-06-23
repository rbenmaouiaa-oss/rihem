import requests
url = 'https://npouyrppjqbxifuvpqan.supabase.co'
anon_key = 'sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv'
headers = {'apikey': anon_key, 'Authorization': f'Bearer {anon_key}'}

# Exact query the JS client makes
manager_id = 'f2222222-cdee-4d97-b5ae-a3867e6f3a32'
r = requests.get(
    f'{url}/rest/v1/teams',
    params={'select': '*', 'manager_id': f'eq.{manager_id}'},
    headers=headers
)
print(f"Status: {r.status_code}")
print(f"URL: {r.url}")
print(f"Response: {r.text[:500]}")

# Also check RLS info
r2 = requests.get(
    f'{url}/rest/v1/rpc/check_rls',
    headers=headers
)
print(f"\nRLS check status: {r2.status_code}")
print(f"RLS response: {r2.text[:200]}")
