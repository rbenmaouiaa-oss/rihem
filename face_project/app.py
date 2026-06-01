from flask import Flask, request, jsonify
import face_recognition
import numpy as np
import cv2
from supabase import create_client
from datetime import datetime
import json

app = Flask(__name__)

# ================= SUPABASE =================
url = "https://npouyrppjqbxifuvpqan.supabase.co"
key = "sb_secret_i1bGnoLOPvDPJuHfiV4znw_ynOW3raJ"
supabase = create_client(url, key)

# ================= IMAGE DECODE =================
def decode_img(data):
    nparr = np.frombuffer(data, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

# ================= REGISTER =================
@app.route('/register', methods=['POST'])
def register():

    try:

        name = request.args.get("name", "unknown")

        img = decode_img(request.data)

        if img is None:
            return jsonify({"status": "invalid_image"})

        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        faces = face_recognition.face_locations(rgb)

        print("REGISTER FACE COUNT:", len(faces))

        if len(faces) == 0:
            return jsonify({"status": "no_face"})

        encoding = face_recognition.face_encodings(rgb, faces)[0]
        enc_json = json.dumps(encoding.tolist())

        # ================= IMAGE UPLOAD =================
        filename = f"{name}_{int(datetime.now().timestamp())}.jpg"

        _, buffer = cv2.imencode(".jpg", img)
        image_bytes = buffer.tobytes()

        # upload to storage bucket "faces"
        supabase.storage.from_("faces").upload(
            filename,
            image_bytes,
            {"content-type": "image/jpeg"}
        )

        # get public url
        image_url = supabase.storage.from_("faces").get_public_url(filename)

        # ================= INSERT USER =================
        result = supabase.table("users").insert({
            "name": name,
            "encoding": enc_json,
            "image_url": image_url,
            "created_at": str(datetime.now())
        }).execute()

        print("REGISTER RESULT:", result)

        return jsonify({
            "status": "registered",
            "name": name,
            "image_url": image_url
        })

    except Exception as e:

        print("REGISTER ERROR:", str(e))

        return jsonify({
            "status": "error",
            "message": str(e)
        })


# ================= RECOGNIZE =================
@app.route('/recognize', methods=['POST'])
def recognize():

    try:

        img = decode_img(request.data)

        if img is None:
            return jsonify({"status": "invalid_image"})

        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        faces = face_recognition.face_locations(rgb)

        print("RECOGNIZE FACE COUNT:", len(faces))

        if len(faces) == 0:
            return jsonify({"status": "no_face"})

        unknown_encoding = face_recognition.face_encodings(rgb, faces)[0]

        users_response = supabase.table("users").select("*").execute()
        users = users_response.data

        print("USERS COUNT:", len(users))

        known_encodings = []
        names = []

        for user in users:

            if not user.get("encoding"):
                continue

            try:
                encoding = np.array(json.loads(user["encoding"]))
                known_encodings.append(encoding)
                names.append(user["name"])
            except:
                continue

        if len(known_encodings) == 0:
            return jsonify({"status": "no_users"})

        distances = face_recognition.face_distance(
            known_encodings,
            unknown_encoding
        )

        best_match_index = np.argmin(distances)

        print("BEST DISTANCE:", distances[best_match_index])

        if distances[best_match_index] < 0.5:

            matched_name = names[best_match_index]
            parts = matched_name.split(" ", 1)
            prenom = parts[0] if len(parts) > 0 else "Rihem"
            nom = parts[1] if len(parts) > 1 else "Ben Maouia"

            supabase.table("attendance_logs").insert({
                "employee_id": "EMP001",
                "nom": nom,
                "prenom": prenom,
                "date": datetime.now().strftime("%Y-%m-%d"),
                "entree1": datetime.now().strftime("%H:%M"),
                "status_qr": True,
                "status_face": True,
                "status": "valide"
            }).execute()

            return jsonify({
                "status": "valid",
                "name": matched_name
            })

        else:

            supabase.table("attendance_logs").insert({
                "employee_id": "UNKNOWN",
                "nom": "Inconnu",
                "prenom": "Visage",
                "date": datetime.now().strftime("%Y-%m-%d"),
                "entree1": datetime.now().strftime("%H:%M"),
                "status_qr": False,
                "status_face": False,
                "status": "invalide"
            }).execute()

            return jsonify({
                "status": "invalid"
            })

    except Exception as e:

        print("RECOGNIZE ERROR:", str(e))

        return jsonify({
            "status": "error",
            "message": str(e)
        })


# ================= DEBUG USERS =================
@app.route('/debug_users')
def debug_users():

    try:

        data = supabase.table("users").select("*").execute()

        return jsonify({
            "count": len(data.data),
            "data": data.data
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        })


# ================= TEST INSERT =================
@app.route('/test_insert')
def test_insert():

    try:

        result = supabase.table("users").insert({
            "name": "test_user",
            "encoding": "test_encoding",
            "image_url": "",
            "created_at": str(datetime.now())
        }).execute()

        return jsonify({
            "status": "inserted",
            "data": result.data
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        })


# ================= HOME =================
@app.route('/')
def home():

    return jsonify({
        "status": "server_running"
    })


# ================= RUN =================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)