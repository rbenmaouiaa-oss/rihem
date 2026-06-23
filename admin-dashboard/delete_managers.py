import requests, json

url = 'https://npouyrppjqbxifuvpqan.supabase.co'
key = 'sb_secret_i1bGnoLOPvDPJuHfiV4znw_ynOW3raJ'
h = {'apikey': key, 'Authorization': f'Bearer {key}', 'Content-Type': 'application/json', 'Prefer': 'return=minimal'}

# Managers to delete (all except manager@saas.com)
to_delete = [
    ('21db3e2e-4b3a-4140-9e71-00530904825d', 'haythem.karoui@saas.com'),
    ('4ca9a6cf-2244-46e9-b14a-e31083feda72', 'moez.trabelsi@saas.com'),
    ('621250ed-a3a3-48b7-869a-3d3d72fe8a25', 'montassar.khemiri@saas.com'),
    ('67d1fcf0-262a-4804-9917-69830668bc09', 'amira.lassoued@saas.com'),
]

for uid, email in to_delete:
    # Delete team_members for this user
    r = requests.delete(f'{url}/rest/v1/team_members?user_id=eq.{uid}', headers=h)
    print(f'team_members {email[:20]:20s} -> {r.status_code}')
    
    # Delete attendance_logs for this user
    r = requests.delete(f'{url}/rest/v1/attendance_logs?employee_id=eq.{uid}', headers=h)
    print(f'attendance     {email[:20]:20s} -> {r.status_code}')
    
    # Delete profil_employes for this user
    r = requests.delete(f'{url}/rest/v1/profil_employes?email=eq.{email}', headers=h)
    print(f'profil         {email[:20]:20s} -> {r.status_code}')
    
    # Delete user
    r = requests.delete(f'{url}/rest/v1/users?id=eq.{uid}', headers=h)
    print(f'USER           {email[:20]:20s} -> {r.status_code}')

print('\nDone!')
