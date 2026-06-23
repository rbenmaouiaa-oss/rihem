from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import cv2
import numpy as np
import base64
import hmac
import hashlib
import json
from supabase import create_client, Client
from datetime import datetime, timezone, timedelta

# ================= CONFIG =================
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://npouyrppjqbxifuvpqan.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sb_secret_i1bGnoLOPvDPJuHfiV4znw_ynOW3raJ")
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "5000"))
COMPANY_SECRET = os.getenv("COMPANY_SECRET", "super-secret-company-hmac-key-123")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = Flask(__name__)
CORS(app)

# ================= FACE RECOGNITION =================
try:
    import face_recognition
    FACE_REC_AVAILABLE = True
    print("face_recognition library loaded")
except ImportError:
    FACE_REC_AVAILABLE = False
    print("face_recognition not available - using mock mode")


def verify_qr_signature(employee_id, timestamp, token, signature):
    try:
        message = f"{employee_id}{timestamp}{token}".encode('utf-8')
        computed = hmac.new(COMPANY_SECRET.encode('utf-8'), message, hashlib.sha256).hexdigest()
        return hmac.compare_digest(computed, signature)
    except Exception as e:
        print(f"Signature error: {e}")
        return False


def calculate_attendance_status(company_id, user_id, check_time):
    try:
        user_shift = supabase.table("user_shifts").select("*, shifts(*)").eq("user_id", user_id).execute()
        if not user_shift.data or not user_shift.data[0].get("shifts"):
            return "present"

        shift = user_shift.data[0]["shifts"]
        start_time_str = shift.get("start_time", "08:00:00")
        late_tolerance = shift.get("late_tolerance_minutes", 10)

        shift_start = datetime.strptime(start_time_str, "%H:%M:%S").time()
        check_t = datetime.strptime(check_time, "%H:%M:%S").time()

        shift_minutes = shift_start.hour * 60 + shift_start.minute
        check_minutes = check_t.hour * 60 + check_t.minute

        if check_minutes > (shift_minutes + late_tolerance):
            return "late"
        return "present"
    except Exception as e:
        print(f"Status calculation error: {e}")
        return "present"


# ================= ROUTE 1: SCAN QR =================
@app.route('/api/device/scan-qr', methods=['POST'])
def scan_qr():
    try:
        req_data = request.get_json()
        if not req_data:
            return jsonify({"status": "rejected", "reason": "EMPTY_PAYLOAD"}), 400

        device_uid = req_data.get("device_uid")
        qr_payload_str = req_data.get("qr_payload")

        if not device_uid or not qr_payload_str:
            return jsonify({"status": "rejected", "reason": "MISSING_FIELDS"}), 400

        # 1. Verify device exists
        device_res = supabase.table("devices").select("*").eq("device_uid", device_uid).execute()
        if not device_res.data:
            return jsonify({"status": "rejected", "reason": "DEVICE_BLOCKED"}), 403

        device = device_res.data[0]

        # Update device online status
        supabase.table("devices").update({
            "status": "online",
            "last_online": datetime.now(timezone.utc).isoformat()
        }).eq("id", device["id"]).execute()

        # 2. Parse QR payload
        try:
            payload = json.loads(qr_payload_str)
        except Exception:
            return jsonify({"status": "rejected", "reason": "INVALID_JSON_FORMAT"}), 400

        employee_id = payload.get("employee_id")
        timestamp_str = payload.get("timestamp")
        token = payload.get("token")
        signature = payload.get("signature")

        if not all([employee_id, timestamp_str, token, signature]):
            return jsonify({"status": "rejected", "reason": "INCOMPLETE_QR_FIELDS"}), 400

        # 3. Check expiration (60s)
        try:
            ts_cleaned = timestamp_str.replace("Z", "+00:00")
            qr_time = datetime.fromisoformat(ts_cleaned)
            now_utc = datetime.now(timezone.utc)
            if abs((now_utc - qr_time).total_seconds()) > 60.0:
                return jsonify({"status": "rejected", "reason": "QR_EXPIRED"}), 401
        except Exception:
            return jsonify({"status": "rejected", "reason": "INVALID_TIMESTAMP"}), 400

        # 4. Anti-replay
        token_check = supabase.table("used_tokens").select("*").eq("token", token).execute()
        if token_check.data:
            return jsonify({"status": "rejected", "reason": "ALREADY_USED"}), 401

        # 5. Verify signature
        if not verify_qr_signature(employee_id, timestamp_str, token, signature):
            return jsonify({"status": "rejected", "reason": "INVALID_SIGNATURE"}), 401

        # 6. Verify user exists and is active
        user_res = supabase.table("users").select("*").eq("id", employee_id).execute()
        if not user_res.data:
            return jsonify({"status": "rejected", "reason": "EMPLOYEE_NOT_FOUND"}), 404

        employee = user_res.data[0]
        if employee.get("status") != "active":
            return jsonify({"status": "rejected", "reason": "ACCOUNT_DISABLED"}), 403

        # Log QR success
        supabase.table("device_logs").insert({
            "device_id": device["id"],
            "log_type": "scan_success",
            "message": f"QR valid for {employee.get('nom', '')} {employee.get('prenom', '')}"
        }).execute()

        # Mark token as used
        supabase.table("used_tokens").insert({
            "token": token,
            "employee_id": employee_id,
            "device_id": device["id"]
        }).execute()

        return jsonify({
            "status": "authorized",
            "employee_id": employee["id"],
            "nom": employee.get("nom", ""),
            "prenom": employee.get("prenom", "")
        })

    except Exception as e:
        print(f"scan-qr error: {e}")
        return jsonify({"status": "rejected", "reason": "SERVER_ERROR", "details": str(e)}), 500


# ================= ROUTE 1B: SCAN QR TOKEN (ESP32 simple QR code) =================
@app.route('/api/device/scan-qr-token', methods=['POST'])
def scan_qr_token():
    try:
        req_data = request.get_json()
        if not req_data:
            return jsonify({"status": "rejected", "reason": "EMPTY_PAYLOAD"}), 400

        device_uid = req_data.get("device_uid")
        qr_token = req_data.get("qr_token")

        if not device_uid or not qr_token:
            return jsonify({"status": "rejected", "reason": "MISSING_FIELDS"}), 400

        # 1. Verify device
        device_res = supabase.table("devices").select("*").eq("device_uid", device_uid).execute()
        if not device_res.data:
            return jsonify({"status": "rejected", "reason": "DEVICE_BLOCKED"}), 403
        device = device_res.data[0]

        supabase.table("devices").update({
            "status": "online",
            "last_online": datetime.now(timezone.utc).isoformat()
        }).eq("id", device["id"]).execute()

        # 2. Look up user by qr_code
        user_res = supabase.table("users").select("*").eq("qr_code", qr_token).execute()
        if not user_res.data:
            return jsonify({"status": "rejected", "reason": "QR_CODE_INVALID"}), 401

        employee = user_res.data[0]
        if employee.get("status") != "active":
            return jsonify({"status": "rejected", "reason": "ACCOUNT_DISABLED"}), 403

        # 3. Log success
        supabase.table("device_logs").insert({
            "device_id": device["id"],
            "log_type": "scan_success",
            "message": f"QR token valid for {employee.get('nom', '')} {employee.get('prenom', '')}"
        }).execute()

        return jsonify({
            "status": "authorized",
            "employee_id": employee["id"],
            "nom": employee.get("nom", ""),
            "prenom": employee.get("prenom", "")
        })

    except Exception as e:
        print(f"scan-qr-token error: {e}")
        return jsonify({"status": "rejected", "reason": "SERVER_ERROR", "details": str(e)}), 500


# ================= ROUTE 2: VERIFY FACE =================
@app.route('/api/device/verify-face', methods=['POST'])
def verify_face():
    try:
        req_data = request.get_json()
        if not req_data:
            return jsonify({"status": "denied", "reason": "EMPTY_PAYLOAD"}), 400

        device_uid = req_data.get("device_uid")
        employee_id = req_data.get("employee_id")
        face_base64 = req_data.get("face_image_base64")

        if not all([device_uid, employee_id, face_base64]):
            return jsonify({"status": "denied", "reason": "MISSING_FIELDS"}), 400

        # 1. Fetch device
        device_res = supabase.table("devices").select("*").eq("device_uid", device_uid).execute()
        if not device_res.data:
            return jsonify({"status": "denied", "reason": "DEVICE_BLOCKED"}), 403
        device = device_res.data[0]

        # 2. Fetch face profile
        face_res = supabase.table("face_profiles").select("*").eq("user_id", employee_id).execute()
        if not face_res.data:
            return jsonify({"status": "denied", "reason": "FACE_NOT_ENROLLED"}), 404

        stored_vector = face_res.data[0]["encoding_vector"]

        # 3. Decode image (skip in mock mode)
        frame = None
        if FACE_REC_AVAILABLE:
            try:
                if "," in face_base64:
                    face_base64 = face_base64.split(",")[1]
                img_data = base64.b64decode(face_base64)
                nparr = np.frombuffer(img_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if frame is None:
                    raise ValueError("Empty frame")
            except Exception as e:
                return jsonify({"status": "denied", "reason": "IMAGE_DECODE_FAILED"}), 400

        # 4. Face matching
        face_distance = 0.35
        verified = True

        if FACE_REC_AVAILABLE:
            try:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                encodings = face_recognition.face_encodings(rgb_frame)

                if not encodings:
                    return jsonify({"status": "denied", "reason": "FACE_NOT_DETECTED"}), 422

                captured = encodings[0]
                stored = np.array(stored_vector)
                distances = face_recognition.face_distance([stored], captured)
                face_distance = float(distances[0])
                verified = face_distance < 0.48
                print(f"Face match distance: {face_distance:.4f}")
            except Exception as e:
                print(f"Face matching error: {e}")

        # 5. Face must match to record attendance
        if face_distance >= FACE_THRESHOLD:
            # QR ok but face failed → create alert for admin
            employee_res = supabase.table("users").select("*").eq("id", employee_id).execute()
            employee = employee_res.data[0] if employee_res.data else {}
            supabase.table("fraud_alerts").insert({
                "employee_id": employee_id,
                "severity": "medium",
                "message": f"QR validé mais visage non reconnu pour {employee.get('prenom', '')} {employee.get('nom', '')} (score: {face_distance:.4f})"
            }).execute()
            supabase.table("notifications").insert({
                "title": "Alerte Pointage",
                "message": f"QR validé mais visage non reconnu pour {employee.get('prenom', '')} {employee.get('nom', '')}",
                "type": "warning",
                "user_email": device.get("company_id", "")
            }).execute()
            supabase.table("device_logs").insert({
                "device_id": device["id"],
                "log_type": "scan_failed",
                "message": f"Face mismatch for {employee_id} — alert sent to admin"
            }).execute()
            return jsonify({"status": "denied", "reason": "FACE_NOT_RECOGNIZED", "alert": True}), 401

        now_utc = datetime.now(timezone.utc)
        current_date = now_utc.strftime("%Y-%m-%d")
        current_time = now_utc.strftime("%H:%M:%S")

        attendance_status = calculate_attendance_status(device["company_id"], employee_id, current_time)

        employee_res = supabase.table("users").select("*").eq("id", employee_id).execute()
        employee = employee_res.data[0]

        # Check if already checked in today
        already = supabase.table("attendance_logs")\
            .select("*")\
            .eq("employee_id", employee_id)\
            .eq("date", current_date)\
            .eq("type", "check_in")\
            .execute()

        clock_type = "check_out" if already.data else "check_in"

        log = {
            "company_id": device["company_id"],
            "employee_id": employee_id,
            "device_id": device["id"],
            "type": clock_type,
            "status": attendance_status if clock_type == "check_in" else "present",
            "qr_verified": True,
            "face_verified": True,
            "face_score": face_distance,
            "date": current_date,
            "time": current_time,
            "photo_proof_url": f"data:image/jpeg;base64,{face_base64[:100]}..."
        }

        supabase.table("attendance_logs").insert(log).execute()

        supabase.table("device_logs").insert({
            "device_id": device["id"],
            "log_type": "scan_success",
            "message": f"Double-auth for {employee.get('nom', '')} {employee.get('prenom', '')} ({clock_type})"
        }).execute()

        supabase.table("notifications").insert({
            "user_id": employee_id,
            "title": "Pointage Réussi!",
            "message": f"{clock_type} validé à {current_time}"
        }).execute()

        return jsonify({
            "status": "success",
            "message": f"Attendance saved as {clock_type} at {current_time}"
        })

    except Exception as e:
        print(f"verify-face error: {e}")
        return jsonify({"status": "denied", "reason": "SERVER_ERROR", "details": str(e)}), 500


# ================= ROUTE 3: SYNC OFFLINE QUEUE =================
@app.route('/api/device/sync-offline-queue', methods=['POST'])
def sync_offline_queue():
    try:
        req_data = request.get_json()
        if not req_data or "queue" not in req_data:
            return jsonify({"status": "error", "message": "Missing queue payload"}), 400

        device_uid = req_data.get("device_uid")
        queue = req_data.get("queue")

        device_res = supabase.table("devices").select("*").eq("device_uid", device_uid).execute()
        if not device_res.data:
            return jsonify({"status": "error", "message": "Device blocked"}), 403
        device = device_res.data[0]

        synced = 0
        for log in queue:
            employee_id = log.get("employee_id")
            log_date = log.get("date")
            log_time = log.get("time")
            log_type = log.get("type", "check_in")

            user_res = supabase.table("users").select("*").eq("id", employee_id).execute()
            if not user_res.data:
                continue

            status = calculate_attendance_status(device["company_id"], employee_id, log_time)

            supabase.table("attendance_logs").insert({
                "company_id": device["company_id"],
                "employee_id": employee_id,
                "device_id": device["id"],
                "type": log_type,
                "status": status,
                "qr_verified": True,
                "face_verified": True,
                "face_score": 0.0,
                "date": log_date,
                "time": log_time
            }).execute()
            synced += 1

        supabase.table("device_logs").insert({
            "device_id": device["id"],
            "log_type": "offline_queue_sync",
            "message": f"Synced {synced} offline records"
        }).execute()

        return jsonify({"status": "success", "synced_count": synced})

    except Exception as e:
        print(f"sync error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ================= ROUTE 4: ENROLL FACE =================
@app.route('/api/face/enroll', methods=['POST'])
def enroll_face():
    try:
        req_data = request.get_json()
        employee_id = req_data.get("employee_id")
        face_base64 = req_data.get("face_image_base64")

        if not employee_id or not face_base64:
            return jsonify({"status": "error", "reason": "MISSING_FIELDS"}), 400

        # Decode image
        if "," in face_base64:
            face_base64 = face_base64.split(",")[1]
        img_data = base64.b64decode(face_base64)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"status": "error", "reason": "IMAGE_DECODE_FAILED"}), 400

        if FACE_REC_AVAILABLE:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            faces = face_recognition.face_locations(rgb)
            if not faces:
                return jsonify({"status": "error", "reason": "NO_FACE_DETECTED"}), 422
            encoding = face_recognition.face_encodings(rgb, faces)[0].tolist()
        else:
            encoding = [float(f"{x:.6f}") for x in np.random.uniform(-0.2, 0.2, 128)]

        # Upload image to storage
        filename = f"face_{employee_id}_{int(datetime.now().timestamp())}.jpg"
        _, buffer = cv2.imencode(".jpg", frame)
        supabase.storage.from_("faces").upload(filename, buffer.tobytes(), {"content-type": "image/jpeg"})
        image_url = supabase.storage.from_("faces").get_public_url(filename)

        # Upsert face profile
        supabase.table("face_profiles").upsert({
            "user_id": employee_id,
            "encoding_vector": encoding,
            "photo_url": image_url
        }, on_conflict="user_id").execute()

        return jsonify({"status": "success", "image_url": image_url})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ================= ROUTE ESP32: UPLOAD QR (photo directe) =================
@app.route('/upload', methods=['POST'])
def upload_qr():
    try:
        img_data = request.get_data()
        if not img_data:
            return jsonify({"status": "no_qr"}), 400

        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"status": "no_qr"})

        detector = cv2.QRCodeDetector()
        data, _, _ = detector.detectAndDecode(frame)

        if not data:
            return jsonify({"status": "no_qr"})

        data = data.strip()

        user_res = supabase.table("users").select("*").eq("qr_code", data).execute()
        if not user_res.data:
            return jsonify({"status": "invalid"})

        employee = user_res.data[0]
        employee_id = employee["id"]
        company_id = employee.get("company_id")

        if not company_id:
            return jsonify({"status": "valid", "message": "QR code valide, mais company_id manquant pour le pointage"})

        now_utc = datetime.now(timezone.utc)
        current_date = now_utc.strftime("%Y-%m-%d")
        current_time = now_utc.strftime("%H:%M:%S")

        attendance_status = calculate_attendance_status(company_id, employee_id, current_time)

        last = supabase.table("attendance_logs")\
            .select("type")\
            .eq("employee_id", employee_id)\
            .eq("date", current_date)\
            .order("time", desc=True)\
            .limit(1)\
            .execute()

        clock_type = "check_in"
        if last.data and last.data[0]["type"] == "check_in":
            clock_type = "check_out"

        log = {
            "company_id": company_id,
            "employee_id": employee_id,
            "type": clock_type,
            "status": attendance_status if clock_type == "check_in" else "present",
            "qr_verified": True,
            "face_verified": False,
            "face_score": 0.0,
            "date": current_date,
            "time": current_time
        }

        supabase.table("attendance_logs").insert(log).execute()

        supabase.table("notifications").insert({
            "user_id": employee_id,
            "title": "Pointage QR Réussi!",
            "message": f"{clock_type} validé à {current_time}"
        }).execute()

        return jsonify({
            "status": "valid",
            "attendance": {
                "type": clock_type,
                "time": current_time,
                "date": current_date,
                "status": log["status"]
            },
            "employee": {
                "id": employee_id,
                "nom": employee.get("nom", ""),
                "prenom": employee.get("prenom", "")
            }
        })

    except Exception as e:
        print(f"Upload error: {e}")
        return jsonify({"status": "no_qr"})


# ================= ROUTE 5: HEALTH CHECK =================
@app.route('/api/health')
def health():
    return jsonify({"status": "running", "face_recognition": FACE_REC_AVAILABLE})


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=BACKEND_PORT, debug=True)
