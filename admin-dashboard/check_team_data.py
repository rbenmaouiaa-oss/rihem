import requests
url = 'https://npouyrppjqbxifuvpqan.supabase.co'
key = 'sb_secret_i1bGnoLOPvDPJuHfiV4znw_ynOW3raJ'
h = {'apikey': key, 'Authorization': 'Bearer ' + key}

r = requests.get(url + '/rest/v1/team_members?select=*&team_id=eq.f946ad89-ec46-439c-a5c5-d087e68d9d33', headers=h)
print('Team members:', r.json())

r2 = requests.get(url + '/rest/v1/users?select=id,email,status&order=email.asc', headers=h)
for u in r2.json():
    print(u['email'].ljust(25), 'status=' + str(u.get('status','NULL')))
