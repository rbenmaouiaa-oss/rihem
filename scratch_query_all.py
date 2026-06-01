from supabase import create_client, Client

url = "https://npouyrppjqbxifuvpqan.supabase.co"
key = "sb_secret_i1bGnoLOPvDPJuHfiV4znw_ynOW3raJ"
supabase: Client = create_client(url, key)

tables = [
    "companies", "branches", "departments", "users", "shifts", 
    "user_shifts", "devices", "attendance_logs", "absence_requests", 
    "reclamations", "notifications", "face_profiles", "device_logs", 
    "holidays", "manual_corrections", "used_tokens"
]

print("Checking Supabase tables row counts:")
for t in tables:
    try:
        res = supabase.table(t).select("*", count="exact").limit(1).execute()
        count = res.count if hasattr(res, 'count') else len(res.data)
        print(f"Table '{t}': {count} rows")
    except Exception as e:
        print(f"Table '{t}': Error -> {e}")
