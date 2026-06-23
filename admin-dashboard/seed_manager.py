import requests

SUPABASE_URL = "https://npouyrppjqbxifuvpqan.supabase.co"
SUPABASE_KEY = "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv"
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}

resp = requests.get(f"{SUPABASE_URL}/rest/v1/users?select=id,email,nom,prenom,role,company_id,manager_id", headers=HEADERS)
users = resp.json()
print(f"{len(users)} utilisateurs trouves")

managers = [u for u in users if u.get('role') == 'Manager']
employees = [u for u in users if u.get('role') == 'Employee']

print(f"\nManagers ({len(managers)}) :")
for m in managers:
    print(f"  - {m.get('prenom','')} {m.get('nom','')} ({m.get('email','')}) [{m['id'][:8]}]")

print(f"\nEmployes ({len(employees)}) :")
for e in employees:
    print(f"  - {e.get('prenom','')} {e.get('nom','')} ({e.get('email','')}) [{e['id'][:8]}] manager_id={e.get('manager_id','null')[:8] if e.get('manager_id') else 'null'}")

if len(managers) == 0:
    print("\nAucun manager trouve. Creez d'abord un utilisateur avec role 'Manager'.")
    exit()

if len(employees) == 0:
    print("\nAucun employe trouve. Rien a assigner.")
    exit()

print("\n--- Assignation des employes aux managers ---")
updated = 0
for i, emp in enumerate(employees):
    manager = managers[i % len(managers)]
    mid = manager['id']

    if emp.get('manager_id'):
        print(f"  SKIP {emp.get('prenom','')} {emp.get('nom','')} deja assigne a un manager")
        continue

    resp = requests.patch(
        f"{SUPABASE_URL}/rest/v1/users?id=eq.{emp['id']}",
        headers=HEADERS,
        json={"manager_id": mid}
    )

    if resp.status_code in (200, 204):
        print(f"  OK {emp.get('prenom','')} {emp.get('nom','')} -> {manager.get('prenom','')} {manager.get('nom','')}")
        updated += 1
    else:
        print(f"  ERR {emp.get('prenom','')} {emp.get('nom','')}: {resp.status_code} {resp.text[:80]}")

print(f"\nOK {updated} employes mis a jour avec un manager_id")
