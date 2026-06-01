import face_recognition
import numpy as np

image = face_recognition.load_image_file("known_faces/me.jpg")

encodings = face_recognition.face_encodings(image)

if len(encodings) > 0:
    np.save("face_encoding.npy", encodings[0])
    print("Face encoding saved")
else:
    print("No face found")