import os
from supabase import create_client

url = "https://npouyrppjqbxifuvpqan.supabase.co"
key = "sb_secret_i1bGnoLOPvDPJuHfiV4znw_ynOW3raJ"

print("Connecting to Supabase...")
supabase = create_client(url, key)

print("Seeding admin user...")
try:
    res = supabase.auth.admin.create_user({
        "email": "admin@lavance.com",
        "password": "adminpassword123",
        "email_confirm": True,
        "user_metadata": {"full_name": "Administrator"}
    })
    print("SUCCESS: User admin@lavance.com has been seeded programmatically!")
    print(res)
except Exception as e:
    print("ERROR:", e)
