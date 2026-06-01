import json
from supabase import create_client, Client

url = "https://npouyrppjqbxifuvpqan.supabase.co"
key = "sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv" # Publishable key under test
supabase: Client = create_client(url, key)

try:
    print("Testing select from public.users table with publishable key...")
    res = supabase.table("users").select("*").execute()
    print("Success! Row count returned: " + str(len(res.data)))
    if len(res.data) > 0:
        print("First row email: " + str(res.data[0].get("email")))
except Exception as e:
    print("Error querying users: " + str(e))
