import uuid
from supabase import create_client, Client
from datetime import datetime, timedelta, timezone
import random

url = "https://npouyrppjqbxifuvpqan.supabase.co"
key = "sb_secret_i1bGnoLOPvDPJuHfiV4znw_ynOW3raJ"
supabase: Client = create_client(url, key)

# ==================== HELPERS ====================
def gen_id():
    return str(uuid.uuid4())

def now_utc():
    return datetime.now(timezone.utc)

def date_str(days_offset=0):
    return (now_utc() + timedelta(days=days_offset)).strftime("%Y-%m-%d")

def time_str(h, m, s=0):
    return f"{h:02d}:{m:02d}:{s:02d}"

# ==================== CLEAR ALL TABLES ====================
print("Clearing all tables...")
tables = [
    "used_tokens", "manual_corrections", "holidays", "device_logs",
    "face_profiles", "notifications", "reclamations", "absence_requests",
    "attendance_logs", "user_shifts", "shifts", "devices", "users",
    "departments", "branches", "companies", "team_members", "teams", "plannings"
]
for t in tables:
    pk = "token" if t == "used_tokens" else "id"
    supabase.table(t).delete().neq(pk, "00000000-0000-0000-0000-000000000000").execute()
print("All tables cleared.\n")

# ==================== 1. COMPANY ====================
print("Seeding companies...")
co_id = "e8f9c122-38b4-4b53-8f67-85bdeee7a99f"
supabase.table("companies").insert({
    "id": co_id, "name": "SaaS Corp", "subscription_status": "active",
    "company_secret_key": "super-secret-company-hmac-key-123", "max_employees": 100
}).execute()

# ==================== 2. BRANCHES ====================
print("Seeding branches...")
branch_tunis = gen_id()
branch_sousse = gen_id()
branches = [
    {"id": branch_tunis, "company_id": co_id, "name": "Tunis Office", "city": "Tunis", "timezone": "Africa/Tunis"},
    {"id": branch_sousse, "company_id": co_id, "name": "Sousse Office", "city": "Sousse", "timezone": "Africa/Tunis"},
    {"id": gen_id(), "company_id": co_id, "name": "Sfax Office", "city": "Sfax", "timezone": "Africa/Tunis"},
]
supabase.table("branches").insert(branches).execute()

# ==================== 3. DEPARTMENTS ====================
print("Seeding departments...")
dept_rd = "d51fb0cf-916c-48c9-8d18-2e0618dbbc89"
dept_hr = "f881b0a1-7788-444a-8d11-b0dbac2b99cf"
dept_finance = gen_id()
dept_marketing = gen_id()
dept_it = gen_id()
departments = [
    {"id": dept_rd, "company_id": co_id, "name": "R&D Robotics"},
    {"id": dept_hr, "company_id": co_id, "name": "Human Resources"},
    {"id": dept_finance, "company_id": co_id, "name": "Finance & Comptabilité"},
    {"id": dept_marketing, "company_id": co_id, "name": "Marketing & Communication"},
    {"id": dept_it, "company_id": co_id, "name": "IT Support"},
]
supabase.table("departments").insert(departments).execute()

# ==================== 4. SHIFTS ====================
print("Seeding shifts...")
shift_day_id = "511fb0cf-7777-4444-8d18-2e0618dbbc77"
shift_night_id = "522fb0cf-8888-4444-8d18-2e0618dbbc88"
shift_flex_id = gen_id()
shifts = [
    {"id": shift_day_id, "company_id": co_id, "name": "Standard Day", "start_time": "08:00", "end_time": "17:00", "late_tolerance_minutes": 10},
    {"id": shift_night_id, "company_id": co_id, "name": "Night Shift", "start_time": "22:00", "end_time": "06:00", "late_tolerance_minutes": 15},
    {"id": shift_flex_id, "company_id": co_id, "name": "Flexible", "start_time": "09:00", "end_time": "18:00", "late_tolerance_minutes": 30},
]
supabase.table("shifts").insert(shifts).execute()

# ==================== 5. USERS ====================
print("Seeding users...")
admin_id = "f1111111-cdee-4d97-b5ae-a3867e6f3a31"
manager_id = "f2222222-cdee-4d97-b5ae-a3867e6f3a32"
emp1_id = "f3333333-cdee-4d97-b5ae-a3867e6f3a33"

emp2_id = gen_id()
emp3_id = gen_id()
emp4_id = gen_id()
emp5_id = gen_id()
emp6_id = gen_id()
emp7_id = gen_id()
emp8_id = gen_id()
emp9_id = gen_id()
emp10_id = gen_id()

lavance_admin_id = gen_id()
users = [
    {"id": admin_id, "company_id": co_id, "department_id": dept_hr, "branch_id": branch_tunis, "email": "admin@saas.com", "password_hash": "admin123", "nom": "Eddine", "prenom": "Ala", "role": "CompanyAdmin", "phone": "+216 99 888 777", "status": "active", "leave_balance_annual": 14, "leave_balance_sick": 5},
    {"id": lavance_admin_id, "company_id": co_id, "department_id": dept_hr, "branch_id": branch_tunis, "email": "admin@lavance.com", "password_hash": "adminpassword123", "nom": "Admin", "prenom": "Lavance", "role": "CompanyAdmin", "phone": "+216 00 000 000", "status": "active", "leave_balance_annual": 14, "leave_balance_sick": 5},
    {"id": manager_id, "company_id": co_id, "department_id": dept_rd, "branch_id": branch_tunis, "email": "manager@saas.com", "password_hash": "manager123", "nom": "Ben Maouia", "prenom": "Rihem", "role": "Manager", "phone": "+216 22 333 444", "status": "active", "leave_balance_annual": 12, "leave_balance_sick": 5},
    {"id": emp1_id, "company_id": co_id, "department_id": dept_rd, "branch_id": branch_tunis, "manager_id": manager_id, "email": "employee@saas.com", "password_hash": "employee123", "nom": "Bouslama", "prenom": "Mohamed", "role": "Employee", "phone": "+216 55 666 777", "status": "active", "leave_balance_annual": 10, "leave_balance_sick": 4},
    {"id": emp2_id, "company_id": co_id, "department_id": dept_rd, "branch_id": branch_tunis, "manager_id": manager_id, "email": "sarra.benali@saas.com", "password_hash": "emp123", "nom": "Ben Ali", "prenom": "Sarra", "role": "Employee", "phone": "+216 50 111 222", "status": "active", "leave_balance_annual": 14, "leave_balance_sick": 5},
    {"id": emp3_id, "company_id": co_id, "department_id": dept_hr, "branch_id": branch_tunis, "email": "haythem.karoui@saas.com", "password_hash": "emp123", "nom": "Karoui", "prenom": "Haythem", "role": "Manager", "phone": "+216 50 333 444", "status": "active", "leave_balance_annual": 15, "leave_balance_sick": 5},
    {"id": emp4_id, "company_id": co_id, "department_id": dept_hr, "branch_id": branch_tunis, "manager_id": emp3_id, "email": "nour.mbarek@saas.com", "password_hash": "emp123", "nom": "Mbarek", "prenom": "Nour", "role": "Employee", "phone": "+216 50 555 666", "status": "active", "leave_balance_annual": 8, "leave_balance_sick": 3},
    {"id": emp5_id, "company_id": co_id, "department_id": dept_finance, "branch_id": branch_sousse, "email": "moez.trabelsi@saas.com", "password_hash": "emp123", "nom": "Trabelsi", "prenom": "Moez", "role": "Manager", "phone": "+216 50 777 888", "status": "active", "leave_balance_annual": 18, "leave_balance_sick": 5},
    {"id": emp6_id, "company_id": co_id, "department_id": dept_finance, "branch_id": branch_sousse, "manager_id": emp5_id, "email": "ines.gharbi@saas.com", "password_hash": "emp123", "nom": "Gharbi", "prenom": "Ines", "role": "Employee", "phone": "+216 50 999 000", "status": "active", "leave_balance_annual": 6, "leave_balance_sick": 2},
    {"id": emp7_id, "company_id": co_id, "department_id": dept_marketing, "branch_id": branch_tunis, "email": "amira.lassoued@saas.com", "password_hash": "emp123", "nom": "Lassoued", "prenom": "Amira", "role": "Manager", "phone": "+216 55 111 222", "status": "active", "leave_balance_annual": 12, "leave_balance_sick": 5},
    {"id": emp8_id, "company_id": co_id, "department_id": dept_marketing, "branch_id": branch_tunis, "manager_id": emp7_id, "email": "skander.jaziri@saas.com", "password_hash": "emp123", "nom": "Jaziri", "prenom": "Skander", "role": "Employee", "phone": "+216 55 333 444", "status": "active", "leave_balance_annual": 9, "leave_balance_sick": 4},
    {"id": emp9_id, "company_id": co_id, "department_id": dept_it, "branch_id": branch_tunis, "email": "montassar.khemiri@saas.com", "password_hash": "emp123", "nom": "Khemiri", "prenom": "Montassar", "role": "Manager", "phone": "+216 55 555 666", "status": "active", "leave_balance_annual": 14, "leave_balance_sick": 5},
    {"id": emp10_id, "company_id": co_id, "department_id": dept_it, "branch_id": branch_sousse, "manager_id": emp9_id, "email": "eya.fourati@saas.com", "password_hash": "emp123", "nom": "Fourati", "prenom": "Eya", "role": "Employee", "phone": "+216 55 777 888", "status": "active", "leave_balance_annual": 7, "leave_balance_sick": 3},
]
supabase.table("users").insert(users).execute()

# ==================== 6. USER SHIFTS ====================
print("Seeding user shifts...")
emp_ids = [admin_id, lavance_admin_id, manager_id, emp1_id, emp2_id, emp3_id, emp4_id, emp5_id, emp6_id, emp7_id, emp8_id, emp9_id, emp10_id]
night_emps = [emp2_id, emp6_id, emp10_id]
user_shifts_data = []
for eid in emp_ids:
    sid = shift_night_id if eid in night_emps else shift_day_id
    user_shifts_data.append({"user_id": eid, "shift_id": sid})
supabase.table("user_shifts").insert(user_shifts_data).execute()

# ==================== 7. DEVICES ====================
print("Seeding devices...")
dev1_id = "d11fb0cf-abcd-ef01-2345-6789abcdef01"
devices = [
    {"id": dev1_id, "company_id": co_id, "branch_id": branch_tunis, "device_uid": "ESP32_TUNIS_01_A8:B4:C2", "name": "Tunis S3 CAM Entrance", "ip_address": "192.168.1.150", "status": "online", "firmware_version": "1.0.0"},
    {"id": gen_id(), "company_id": co_id, "branch_id": branch_sousse, "device_uid": "ESP32_SOUSSE_01_D1:E2:F3", "name": "Sousse S3 CAM Entrance", "ip_address": "192.168.2.150", "status": "online", "firmware_version": "1.0.0"},
    {"id": gen_id(), "company_id": co_id, "branch_id": branch_tunis, "device_uid": "ESP32_TUNIS_02_G4:H5:I6", "name": "Tunis BACKUP Scanner", "ip_address": "192.168.1.151", "status": "offline", "firmware_version": "1.0.1"},
]
supabase.table("devices").insert(devices).execute()

# ==================== 8. ATTENDANCE LOGS ====================
print("Seeding attendance logs for ALL employees (90 days)...")

emp_attendance_patterns = {
    admin_id: {"early": True, "late_pct": 5, "absent_pct": 3, "face_min": 0.28, "face_max": 0.38},
    lavance_admin_id: {"early": True, "late_pct": 8, "absent_pct": 5, "face_min": 0.30, "face_max": 0.40},
    manager_id: {"early": True, "late_pct": 10, "absent_pct": 2, "face_min": 0.25, "face_max": 0.35},
    emp1_id: {"early": False, "late_pct": 35, "absent_pct": 10, "face_min": 0.32, "face_max": 0.48},
    emp2_id: {"early": False, "late_pct": 45, "absent_pct": 15, "face_min": 0.30, "face_max": 0.50},
    emp3_id: {"early": True, "late_pct": 12, "absent_pct": 5, "face_min": 0.28, "face_max": 0.42},
    emp4_id: {"early": True, "late_pct": 8, "absent_pct": 8, "face_min": 0.26, "face_max": 0.40},
    emp5_id: {"early": False, "late_pct": 25, "absent_pct": 8, "face_min": 0.30, "face_max": 0.45},
    emp6_id: {"early": False, "late_pct": 40, "absent_pct": 18, "face_min": 0.28, "face_max": 0.52},
    emp7_id: {"early": True, "late_pct": 10, "absent_pct": 4, "face_min": 0.26, "face_max": 0.38},
    emp8_id: {"early": False, "late_pct": 30, "absent_pct": 12, "face_min": 0.30, "face_max": 0.48},
    emp9_id: {"early": True, "late_pct": 8, "absent_pct": 3, "face_min": 0.24, "face_max": 0.36},
    emp10_id: {"early": False, "late_pct": 50, "absent_pct": 20, "face_min": 0.32, "face_max": 0.55},
}

attendance_logs = []
for day_offset in range(-89, 1):
    d = date_str(day_offset)
    weekday = (now_utc() + timedelta(days=day_offset)).weekday()
    if weekday >= 5:
        continue
    for eid in emp_ids:
        pat = emp_attendance_patterns[eid]
        if random.random() * 100 < pat["absent_pct"]:
            continue
        if pat["early"]:
            base_hour = random.choice([7, 7, 7, 8])
            base_min = random.randint(30, 55) if base_hour == 7 else random.randint(0, 8)
        else:
            base_hour = random.choice([8, 8, 8, 9])
            base_min = random.randint(0, 15) if base_hour == 8 else random.randint(0, 30)
        is_late = (base_hour > 8) or (base_hour == 8 and base_min > 10)
        if not is_late and random.random() * 100 < pat["late_pct"]:
            base_min = random.randint(15, 45)
            is_late = True
        status = "late" if is_late else "present"
        face_score = round(random.uniform(pat["face_min"], pat["face_max"]), 3)
        attendance_logs.append({
            "company_id": co_id, "employee_id": eid, "device_id": dev1_id,
            "type": "check_in", "status": status, "qr_verified": True,
            "face_verified": face_score < 0.48, "face_score": face_score,
            "date": d, "time": time_str(base_hour, base_min, random.randint(0, 59))
        })
        out_hour = random.randint(16, 18)
        out_min = random.randint(0, 59)
        attendance_logs.append({
            "company_id": co_id, "employee_id": eid, "device_id": dev1_id,
            "type": "check_out", "status": "present", "qr_verified": True,
            "face_verified": True, "face_score": round(random.uniform(0.20, 0.35), 3),
            "date": d, "time": time_str(out_hour, out_min, random.randint(0, 59))
        })

BATCH_SIZE = 500
for i in range(0, len(attendance_logs), BATCH_SIZE):
    batch = attendance_logs[i:i + BATCH_SIZE]
    supabase.table("attendance_logs").insert(batch).execute()
    print(f"  Inserted attendance batch {i // BATCH_SIZE + 1}/{(len(attendance_logs) + BATCH_SIZE - 1) // BATCH_SIZE} ({len(batch)} logs)")
print(f"  Total attendance logs inserted: {len(attendance_logs)}")

# ==================== 9. ABSENCE REQUESTS ====================
print("Seeding absence requests...")
absences = [
    {"employee_id": emp1_id, "manager_id": manager_id, "type": "sick", "date_from": date_str(2), "date_to": date_str(4), "reason": "Consultation médicale dentaire chirurgicale", "manager_status": "pending", "admin_status": "pending"},
    {"employee_id": emp1_id, "manager_id": manager_id, "type": "vacation", "date_from": date_str(-10), "date_to": date_str(-5), "reason": "Congé annuel d'été en famille", "manager_status": "approved", "admin_status": "approved"},
    {"employee_id": emp4_id, "manager_id": emp3_id, "type": "personal", "date_from": date_str(5), "date_to": date_str(6), "reason": "Affaire personnelle urgente", "manager_status": "approved", "admin_status": "pending"},
    {"employee_id": emp6_id, "manager_id": emp5_id, "type": "sick", "date_from": date_str(-3), "date_to": date_str(-1), "reason": "Fièvre et fatigue générale", "manager_status": "approved", "admin_status": "approved"},
    {"employee_id": emp8_id, "manager_id": emp7_id, "type": "vacation", "date_from": date_str(10), "date_to": date_str(14), "reason": "Vacances printanières", "manager_status": "pending", "admin_status": "pending"},
    {"employee_id": emp10_id, "manager_id": emp9_id, "type": "unpaid", "date_from": date_str(20), "date_to": date_str(22), "reason": "Congé sans solde pour voyage", "manager_status": "pending", "admin_status": "pending"},
]
supabase.table("absence_requests").insert(absences).execute()

# ==================== 10. RECLAMATIONS ====================
print("Seeding reclamations...")
reclamations = [
    {"employee_id": emp1_id, "subject": "Oubli de pointage check-out", "message": "J'ai oublié de pointer mon check-out hier soir en sortant du bureau.", "priority": "normal", "status": "new"},
    {"employee_id": emp1_id, "subject": "Erreur scan QR camera", "message": "Le scanner Tunis Entrée n'a pas réussi à lire mon QR code.", "priority": "normal", "status": "resolved", "admin_reply": "Terminal redémarré. Lentilles nettoyées."},
    {"employee_id": emp2_id, "subject": "Problème badge", "message": "Mon QR code ne fonctionne plus depuis la mise à jour.", "priority": "urgent", "status": "in_progress"},
    {"employee_id": emp6_id, "subject": "Horaires incorrects", "message": "Mon pointage d'hier affiche 8h14 mais j'étais là à 7h50.", "priority": "normal", "status": "new"},
    {"employee_id": emp8_id, "subject": "Demande correction pointage", "message": "Je n'ai pas pu pointer le 15 à cause d'une panne de courant.", "priority": "normal", "status": "new"},
]
supabase.table("reclamations").insert(reclamations).execute()

# ==================== 11. NOTIFICATIONS ====================
print("Seeding notifications...")
notifications = []
for eid in emp_ids:
    notifications.append({
        "user_id": eid, "title": "Pointage enregistré",
        "message": f"Votre pointage check-in a été validé à {time_str(8, random.randint(0, 30))}.",
        "read": random.choice([True, True, False])
    })
    notifications.append({
        "user_id": eid, "title": "Rappel congés",
        "message": "Il vous reste des jours de congé à prendre avant la fin du mois.",
        "read": False
    })
supabase.table("notifications").insert(notifications).execute()

# ==================== 12. FACE PROFILES ====================
print("Seeding face profiles for all employees...")
for eid in emp_ids:
    supabase.table("face_profiles").insert({
        "user_id": eid,
        "encoding_vector": [round(random.uniform(-0.2, 0.2), 4) for _ in range(128)],
        "photo_url": f"https://api.dicebear.com/7.x/adventurer/svg?seed={eid}"
    }).execute()

# ==================== 13. DEVICE LOGS ====================
print("Seeding device logs...")
device_logs = [
    {"device_id": dev1_id, "log_type": "boot", "message": "ESP32-S3 firmware v1.0.0 loaded. WiFi Connected."},
    {"device_id": dev1_id, "log_type": "boot", "message": "SD card initialized. Ready for scan operations."},
    {"device_id": dev1_id, "log_type": "scan_success", "message": "QR validation succeeded - multiple employees"},
    {"device_id": dev1_id, "log_type": "scan_failed", "message": "Face match below threshold for unknown user"},
]
supabase.table("device_logs").insert(device_logs).execute()

# ==================== 14. HOLIDAYS ====================
print("Seeding holidays...")
holidays = [
    {"company_id": co_id, "name": "Jour de l'An", "date": f"{now_utc().year}-01-01"},
    {"company_id": co_id, "name": "Fête de l'Indépendance", "date": f"{now_utc().year}-03-20"},
    {"company_id": co_id, "name": "Fête du Travail", "date": f"{now_utc().year}-05-01"},
    {"company_id": co_id, "name": "Fête de la République", "date": f"{now_utc().year}-07-25"},
    {"company_id": co_id, "name": "Fête de l'Évacuation", "date": f"{now_utc().year}-10-15"},
]
supabase.table("holidays").insert(holidays).execute()

# ==================== 15. MANUAL CORRECTIONS ====================
print("Seeding manual corrections...")
some_logs = supabase.table("attendance_logs").select("id, employee_id").limit(2).execute().data
for log in some_logs:
    supabase.table("manual_corrections").insert({
        "attendance_log_id": log["id"],
        "employee_id": log["employee_id"],
        "requested_time": "08:00:00",
        "reason": "Correction d'horaire suite à réclamation approuvée",
        "manager_status": "approved",
        "admin_status": "approved"
    }).execute()

# ==================== 16. USED TOKENS (sample) ====================
print("Seeding used tokens...")
supabase.table("used_tokens").insert([
    {"token": f"TOKEN_SAMPLE_{i:03d}"} for i in range(1, 4)
]).execute()

# ==================== 17. TEAMS ====================
print("Seeding teams...")
team_rd_id = gen_id()
team_hr_id = gen_id()
team_it_id = gen_id()
teams = [
    {"id": team_rd_id, "name": "R&D Robotics", "description": "Équipe de recherche et développement en robotique", "manager_id": manager_id},
    {"id": team_hr_id, "name": "HR Operations", "description": "Équipe des opérations des ressources humaines", "manager_id": emp3_id},
    {"id": team_it_id, "name": "IT Support", "description": "Équipe du support informatique", "manager_id": emp9_id},
]
supabase.table("teams").insert(teams).execute()

# ==================== 18. TEAM MEMBERS ====================
print("Seeding team members...")
team_members = [
    {"team_id": team_rd_id, "user_id": emp1_id},
    {"team_id": team_rd_id, "user_id": emp2_id},
    {"team_id": team_hr_id, "user_id": emp4_id},
    {"team_id": team_it_id, "user_id": emp10_id},
]
supabase.table("team_members").insert(team_members).execute()

# ==================== 19. PLANNINGS ====================
print("Seeding plannings...")
plannings = [
    {"id": gen_id(), "name": "Horaire Standard", "description": "Planning standard de travail : Lundi au Vendredi", "start_time": "08:00", "end_time": "17:00", "working_days": ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"]},
    {"id": gen_id(), "name": "Horaire Flexible", "description": "Planning flexible : Lundi au Samedi", "start_time": "09:00", "end_time": "18:00", "working_days": ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]},
]
supabase.table("plannings").insert(plannings).execute()

print("\n=== ALL DATA SEEDED SUCCESSFULLY ===")
print(f"  Companies: 1")
print(f"  Branches: {len(branches)}")
print(f"  Departments: {len(departments)}")
print(f"  Shifts: {len(shifts)}")
print(f"  Users: {len(users)}")
print(f"  Teams: {len(teams)}")
print(f"  Attendance Logs: {len(attendance_logs)}")
print(f"  Absence Requests: {len(absences)}")
print(f"  Reclamations: {len(reclamations)}")
print(f"  Notifications: {len(notifications)}")
print(f"  Holidays: {len(holidays)}")
print(f"  Plannings: {len(plannings)}")
