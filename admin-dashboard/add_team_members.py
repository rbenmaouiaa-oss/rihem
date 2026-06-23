import requests
url = 'https://npouyrppjqbxifuvpqan.supabase.co'
key = 'sb_secret_i1bGnoLOPvDPJuHfiV4znw_ynOW3raJ'
h = {'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'}

# Get user IDs
r = requests.get(url + '/rest/v1/users?select=id,email', headers={**h, 'Prefer': 'return=representation'})
users = r.json()
targets = ['eya.fourati@saas.com', 'ines.gharbi@saas.com']

team_id = 'f946ad89-ec46-439c-a5c5-d087e68d9d33'

for u in users:
    email = u['email']
    if email in targets:
        payload = {'team_id': team_id, 'user_id': u['id']}
        r2 = requests.post(url + '/rest/v1/team_members', headers=h, json=payload)
        print('Added ' + email.ljust(25) + ' -> ' + str(r2.status_code))

print('Done!')
