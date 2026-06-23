import requests
url = 'https://npouyrppjqbxifuvpqan.supabase.co'
key = 'sb_secret_i1bGnoLOPvDPJuHfiV4znw_ynOW3raJ'
h = {'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'Prefer': 'return=minimal'}

fixes = [('presnte', 'present'), ('presnt', 'present'), ('retard', 'late')]
for wrong, correct in fixes:
    r = requests.patch(url + '/rest/v1/users?status=eq.' + wrong, headers=h, json={'status': correct})
    print(f'Fix {wrong} -> {correct}: {r.status_code}')
print('Done!')
