from flask import Flask, render_template, send_file, Response
import cv2
import dlib
from scipy.spatial import distance
import time
import pyaudio
import wave
from threading import Timer
from datetime import datetime  # 수정된 import 문
import base64
import numpy as np
from flask_socketio import SocketIO

app = Flask(__name__)

socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

    

frame = None
lastsave = time.time()  # Initialize lastsave

def calculate_EAR(eye):
    A = distance.euclidean(eye[1], eye[5])
    B = distance.euclidean(eye[2], eye[4])
    C = distance.euclidean(eye[0], eye[3])
    ear_aspect_ratio = (A + B) / (2.0 * C)
    return ear_aspect_ratio

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Error: Could not open camera.")


hog_face_detector = dlib.get_frontal_face_detector()
dlib_facelandmark = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")

# Define constants for audio playback
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100
WAVE_FILENAME = "wa.wav"

p = pyaudio.PyAudio()

# Define global variables for drowsiness detection
drowsiness_duration = 0
drowsiness_timer = None

@socketio.on('play_alarm_event')  # New event for playing alarm
def play_alarm():
    global drowsiness_duration
    
    wf = wave.open(WAVE_FILENAME, 'rb')
    stream = p.open(format=p.get_format_from_width(wf.getsampwidth()),
                    channels=wf.getnchannels(),
                    rate=wf.getframerate(),
                    output=True)

    data = wf.readframes(CHUNK)
    while data and drowsiness_duration < 15:  # Play for up to 15 seconds
        stream.write(data)
        data = wf.readframes(CHUNK)
        drowsiness_duration += 0.05  # Increment the duration
        time.sleep(0.05)

    stream.stop_stream()
    stream.close()
    wf.close()

    # test
    print('Playing alarm')
    # You can add more logic here if needed
    socketio.emit('alarm_played', {'status': 'Alarm played successfully'})

def stop_alarm():
    global drowsiness_duration
    
    # Reset the drowsiness duration
    drowsiness_duration = 0
    print("Driver is awake now")

def counter(func):
    def wrapper(*args, **kwargs):
        wrapper.count += 1
        time.sleep(0.05)
        global frame, lastsave, drowsiness_duration, drowsiness_timer
        if time.time() - lastsave > 5:
            lastsave = time.time()
            wrapper.count = 0
            # Reset drowsiness duration when no drowsiness is detected
            drowsiness_duration = 0
            if drowsiness_timer and drowsiness_timer.is_alive():
                drowsiness_timer.cancel()
        return func(*args, **kwargs)
    wrapper.count = 0
    return wrapper

@counter
def close():
    global lastsave
    

@app.route('/sleep_image')
def get_drowsiness_image():
    # Provide the correct path to the saved drowsiness image
    image_path = './static/drowst_image.jpg'

    with open(image_path, "rb") as image_file:
        encoded_image = base64.b64encode(image_file.read()).decode('utf-8')

    return {'image': encoded_image}

@app.route('/video_feed')
def video_feed():
    
    def generate():
        while True:
            _, frame = cap.read()
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            faces = hog_face_detector(gray)

            for face in faces:
                face_landmarks = dlib_facelandmark(gray, face)
                leftEye = []
                rightEye = []

                for n in range(36, 42):
                    x = face_landmarks.part(n).x
                    y = face_landmarks.part(n).y
                    leftEye.append((x, y))
                    next_point = n + 1
                    if n == 41:
                        next_point = 36
                    x2 = face_landmarks.part(next_point).x
                    y2 = face_landmarks.part(next_point).y
                    cv2.line(frame, (x, y), (x2, y2), (0, 255, 0), 1)

                for n in range(42, 48):
                    x = face_landmarks.part(n).x
                    y = face_landmarks.part(n).y
                    rightEye.append((x, y))
                    next_point = n + 1
                    if n == 47:
                        next_point = 42
                    x2 = face_landmarks.part(next_point).x
                    y2 = face_landmarks.part(next_point).y
                    cv2.line(frame, (x, y), (x2, y2), (0, 255, 0), 1)

                left_ear = calculate_EAR(leftEye)
                right_ear = calculate_EAR(rightEye)

                EAR = (left_ear + right_ear) / 2
                EAR = round(EAR, 2)
                
                if EAR < 0.15:
                    close()
                    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    print(f'close count : {close.count}')
                    if close.count == 15:
                       
                        print("Driver is sleeping")
                        play_alarm()
                        save_path = './static/drowst_image.jpg'
                        cv2.putText(frame, f"Current Time: {current_time}", (20, frame.shape[0]-20), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2) 
                        cv2.putText(frame, "DROWSY", (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 3, (0, 0, 255), 4)
                        print(f'Image saved: {save_path}')
                        cv2.imwrite(save_path, frame)

                
            jpeg = cv2.imencode('.jpg', frame)[1].tobytes()
            frame_bytes = jpeg
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n\r\n')

    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='172.30.1.34')
    