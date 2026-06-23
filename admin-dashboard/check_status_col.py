import requests
url = 'https://npouyrppjqbxifuvpqan.supabase.co'
key = 'sb_secret_i1bGnoLOPvDPJuHfiV4znw_ynOW3raJ'
h = {'apikey': key, 'Authorization': 'Bearer ' + key}
r = requests.get(url + '/rest/v1/users?select=id,email,role,status', headers=h)
print('Status:', r.status_code)
if r.status_code == 200:
    for u in r.json():
        uid = u['id'][:12]
        role = u['role']
        email = u['email']
        st = u.get('status', 'MISSING')
        print(role.ljust(15), email.ljust(25), 'status=' + str(st)[:10])
else:
    print(r.text[:300])
