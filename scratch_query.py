import json
from supabase import create_client, Client

url = "https://npouyrppjqbxifuvpqan.supabase.co"
key = "sb_secret_i1bGnoLOPvDPJuHfiV4znw_ynOW3raJ"
supabase: Client = create_client(url, key)

try:
    print("Querying public.users table...")
    res = supabase.table("users").select("*").execute()
    print("Found rows count: " + str(len(res.data)))
    print("Rows details:")
    print(json.dumps(res.data, indent=2))
except Exception as e:
    print("Error querying users table: " + str(e))
