from supabase import create_client, Client
from datetime import datetime, timedelta, timezone

url = "https://npouyrppjqbxifuvpqan.supabase.co"
key = "sb_secret_i1bGnoLOPvDPJuHfiV4znw_ynOW3raJ"
supabase: Client = create_client(url, key)

# Retrieve existing IDs
try:
    print("Fetching seeded references...")
    users = supabase.table("users").select("id, company_id").execute().data
    devices = supabase.table("devices").select("id").execute().data
    
    if not users or not devices:
        print("Error: Please run migration_schema.sql first! Seed users/devices not found.")
        exit(1)
        
    co_id = users[0]["company_id"]
    emp_id = next(u["id"] for u in users if u["id"] == "f3333333-cdee-4d97-b5ae-a3867e6f3a33")
    man_id = next(u["id"] for u in users if u["id"] == "f2222222-cdee-4d97-b5ae-a3867e6f3a32")
    dev_id = devices[0]["id"]
    
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    yesterday_str = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    prev_day_str = (now - timedelta(days=2)).strftime("%Y-%m-%d")

    print("Seeding Attendance Logs...")
    # Clear old entries to prevent duplicates
    supabase.table("attendance_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    
    # 3 days of historical pointages
    attendance_data = [
        # Today
        {"company_id": co_id, "employee_id": emp_id, "device_id": dev_id, "type": "check_in", "status": "present", "qr_verified": True, "face_verified": True, "face_score": 0.321, "date": today_str, "time": "07:56:00"},
        # Yesterday
        {"company_id": co_id, "employee_id": emp_id, "device_id": dev_id, "type": "check_in", "status": "late", "qr_verified": True, "face_verified": True, "face_score": 0.345, "date": yesterday_str, "time": "08:14:00"},
        {"company_id": co_id, "employee_id": emp_id, "device_id": dev_id, "type": "check_out", "status": "present", "qr_verified": True, "face_verified": True, "face_score": 0.312, "date": yesterday_str, "time": "17:05:00"},
        # Previous Day
        {"company_id": co_id, "employee_id": emp_id, "device_id": dev_id, "type": "check_in", "status": "present", "qr_verified": True, "face_verified": True, "face_score": 0.298, "date": prev_day_str, "time": "07:51:00"},
        {"company_id": co_id, "employee_id": emp_id, "device_id": dev_id, "type": "check_out", "status": "present", "qr_verified": True, "face_verified": True, "face_score": 0.334, "date": prev_day_str, "time": "17:02:00"}
    ]
    supabase.table("attendance_logs").insert(attendance_data).execute()

    print("Seeding Absence Requests...")
    supabase.table("absence_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    absences_data = [
        {
            "employee_id": emp_id,
            "manager_id": man_id,
            "type": "sick",
            "date_from": (now + timedelta(days=2)).strftime("%Y-%m-%d"),
            "date_to": (now + timedelta(days=4)).strftime("%Y-%m-%d"),
            "reason": "Consultation médicale dentaire chirurgicale. Certificat ci-joint.",
            "manager_status": "pending",
            "admin_status": "pending"
        },
        {
            "employee_id": emp_id,
            "manager_id": man_id,
            "type": "vacation",
            "date_from": (now - timedelta(days=10)).strftime("%Y-%m-%d"),
            "date_to": (now - timedelta(days=5)).strftime("%Y-%m-%d"),
            "reason": "Congé annuel d'été en famille.",
            "manager_status": "approved",
            "admin_status": "approved"
        }
    ]
    supabase.table("absence_requests").insert(absences_data).execute()

    print("Seeding Reclamations...")
    supabase.table("reclamations").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    reclamations_data = [
        {
            "employee_id": emp_id,
            "subject": "Oubli de pointage check-out",
            "message": "J'ai oublié de pointer mon check-out hier soir en sortant du bureau à 17h15 en raison d'une urgence.",
            "priority": "normal",
            "status": "new"
        },
        {
            "employee_id": emp_id,
            "subject": "Erreur scan QR camera",
            "message": "Le scanner Tunis Entrée A n'a pas réussi à lire mon QR code ce matin. J'ai dû scanner à deux reprises.",
            "priority": "normal",
            "status": "resolved",
            "admin_reply": "Terminal redémarré. Les lentilles optiques ont été nettoyées par l'équipe maintenance."
        }
    ]
    supabase.table("reclamations").insert(reclamations_data).execute()

    print("Seeding Device Health Logs...")
    supabase.table("device_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    device_logs_data = [
        {"device_id": dev_id, "log_type": "boot", "message": "ESP32-S3 firmware v1.0.0 successfully loaded. WiFi Connected to Tunis_Office_5G."},
        {"device_id": dev_id, "log_type": "scan_success", "message": "QR validation succeeded for employee Mohamed Bouslama"},
        {"device_id": dev_id, "log_type": "scan_success", "message": "Double-verification check-in recorded for Mohamed Bouslama (check_in)"}
    ]
    supabase.table("device_logs").insert(device_logs_data).execute()

    print("Seeding Face Profile Vectors...")
    supabase.table("face_profiles").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    mock_vector = Array_from = [0.0123] * 128 # 128 elements float vector representation
    supabase.table("face_profiles").insert({
        "user_id": emp_id,
        "encoding_vector": mock_vector,
        "photo_url": f"https://api.dicebear.com/7.x/adventurer/svg?seed={emp_id}"
    }).execute()

    print("Database transactional tables populated successfully! 🎉")
except Exception as e:
    print(f"Error seeding transactional data: {e}")
