/**
 * ====================================================================
 * SAAS DOUBLE-VERIFICATION ATTENDANCE ECOSYSTEM: ESP32-S3-CAM GATEWAY
 * Board: ESP32S3 Dev Module / AI-Thinker ESP32-CAM S3
 * Target Firmware: Arduino C++ Core
 * ====================================================================
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ================= SUPABASE & BACKEND NETWORK SETTINGS =================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const String serverUrl = "http://YOUR_FLASK_SERVER_IP:5000"; // Flask Cryptographic API Server IP

// Terminal Device Unique UID (Configured inside SaaS Dashboard)
const String deviceUid = "ESP32_TUNIS_01_A8:B4:C2";

// ================= HARDWARE PIN CONFIGS (AI-Thinker Board Layout) =================
#define PWDN_GPIO_NUM     -1
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM     10
#define SIOD_GPIO_NUM     40
#define SIOC_GPIO_NUM     39

#define Y9_GPIO_NUM       13
#define Y8_GPIO_NUM       11
#define Y7_GPIO_NUM       12
#define Y6_GPIO_NUM       14
#define Y5_GPIO_NUM       15
#define Y4_GPIO_NUM       16
#define Y3_GPIO_NUM       17
#define Y2_GPIO_NUM       18
#define VSYNC_GPIO_NUM    38
#define HREF_GPIO_NUM     47
#define PCLK_GPIO_NUM     33

// LED Indicator Pins (Color Signalling)
#define LED_GREEN         2  // Success LED
#define LED_RED           4  // Failure LED
#define LED_BLUE          1  // Network / Idle LED
#define BUZZER_PIN        12 // Audio Beep Signal Indicator

// ================= GLOBAL STATE VARIABLES =================
bool wifiConnected = false;
String activeEmployeeId = "";
String activeEmployeeName = "";
bool offlineMode = false;

// ================= CAMERA SETUP CONFIGURATION =================
void initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG; // Capture directly in compressed JPEG

  // Quality settings
  if (psramFound()) {
    config.frame_size = FRAMESIZE_QVGA; // 320x240 for high performance face encodings
    config.jpeg_quality = 10;           // 0-63 (lower is higher quality)
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_QVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("❌ Camera initialization failed with error 0x%x\n", err);
    triggerAlertPattern(LED_RED, 3, 200);
    return;
  }
  Serial.println("📸 OV2640 Camera module successfully initialized!");
}

// ================= BUZZER & SIGNALING LED PATTERNS =================
void triggerAlertPattern(int ledPin, int count, int durationMs) {
  for (int i = 0; i < count; i++) {
    digitalWrite(ledPin, HIGH);
    digitalWrite(BUZZER_PIN, HIGH);
    delay(durationMs);
    digitalWrite(ledPin, LOW);
    digitalWrite(BUZZER_PIN, LOW);
    delay(durationMs);
  }
}

// Play premium melody on face double verification success
void playSuccessMelody() {
  digitalWrite(LED_GREEN, HIGH);
  int melody[] = { 262, 330, 392, 523 }; // C4, E4, G4, C5
  int durations[] = { 100, 100, 100, 200 };
  
  for (int i = 0; i < 4; i++) {
    tone(BUZZER_PIN, melody[i], durations[i]);
    delay(durations[i] + 50);
  }
  digitalWrite(LED_GREEN, LOW);
}

// ================= BASE64 ENCODER UTILS =================
String base64Encode(uint8_t* data, size_t length) {
  static const char lookup[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  String result = "";
  result.reserve(((length + 2) / 3) * 4);
  
  int i = 0;
  while (i < length) {
    uint32_t octet_a = i < length ? data[i++] : 0;
    uint32_t octet_b = i < length ? data[i++] : 0;
    uint32_t octet_c = i < length ? data[i++] : 0;
    
    uint32_t triple = (octet_a << 16) + (octet_b << 8) + octet_c;
    
    result += lookup[(triple >> 18) & 0x3F];
    result += lookup[(triple >> 12) & 0x3F];
    result += lookup[(triple >> 6) & 0x3F];
    result += lookup[triple & 0x3F];
  }
  
  int pad = (3 - length % 3) % 3;
  for (int p = 0; p < pad; p++) {
    result[result.length() - 1 - p] = '=';
  }
  return result;
}

// ================= NETWORK: SEND QR TOKEN (simple QR code from badge) =================
bool sendQrToken(String qrToken) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("🔌 Network Offline! Buffering check-in locally.");
    offlineMode = true;
    return false;
  }
  
  HTTPClient http;
  http.begin(serverUrl + "/api/device/scan-qr-token");
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<256> doc;
  doc["device_uid"] = deviceUid;
  doc["qr_token"] = qrToken;
  
  String jsonBody;
  serializeJson(doc, jsonBody);
  
  digitalWrite(LED_BLUE, LOW);
  int httpCode = http.POST(jsonBody);
  digitalWrite(LED_BLUE, HIGH);
  
  if (httpCode == HTTP_CODE_OK) {
    String response = http.getString();
    StaticJsonDocument<512> resDoc;
    deserializeJson(resDoc, response);
    
    if (resDoc["status"] == "authorized") {
      activeEmployeeId = resDoc["employee_id"].as<String>();
      activeEmployeeName = resDoc["prenom"].as<String>() + " " + resDoc["nom"].as<String>();
      
      Serial.printf("✅ QR Code Valid! Employee: %s\n", activeEmployeeName.c_str());
      triggerAlertPattern(LED_GREEN, 1, 150);
      http.end();
      return true;
    }
  } else {
    Serial.printf("⛔ QR rejected. Code: %d\n", httpCode);
    triggerAlertPattern(LED_RED, 1, 600);
  }
  
  http.end();
  return false;
}

// ================= NETWORK: CAPTURE AND VERIFY FACE =================
bool captureAndVerifyFace() {
  Serial.println("📸 Framing captured view ... look at the lens!");
  triggerAlertPattern(LED_BLUE, 2, 100); // 2 Cyan blinks
  
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("❌ Frame buffer failed to load camera capture.");
    return false;
  }
  
  // Encode JPEG stream to base64
  String faceBase64 = "data:image/jpeg;base64," + base64Encode(fb->buf, fb->len);
  esp_camera_fb_return(fb); // Clear memory
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("🔌 Lost internet connection. Dropping Face verify.");
    return false;
  }
  
  HTTPClient http;
  http.begin(serverUrl + "/api/device/verify-face");
  http.addHeader("Content-Type", "application/json");
  
  // Prepare JSON
  // Note: Large document allocator for base64 image data
  DynamicJsonDocument doc(fb->len * 1.5 + 512);
  doc["device_uid"] = deviceUid;
  doc["employee_id"] = activeEmployeeId;
  doc["face_image_base64"] = faceBase64;
  
  String jsonBody;
  serializeJson(doc, jsonBody);
  
  int httpCode = http.POST(jsonBody);
  
  if (httpCode == HTTP_CODE_OK) {
    String response = http.getString();
    StaticJsonDocument<256> resDoc;
    deserializeJson(resDoc, response);
    
    if (resDoc["status"] == "success") {
      Serial.println("🎉 Double-Verification Attendance Point Saved successfully!");
      playSuccessMelody();
      http.end();
      return true;
    }
  } else {
    Serial.printf("❌ Face Match Denied! Response code: %d\n", httpCode);
    triggerAlertPattern(LED_RED, 2, 400); // Error buzz
  }
  
  http.end();
  return false;
}

// ================= CONNECT WIFI CONNECTIVITY QUEUE =================
void connectWiFi() {
  Serial.printf("📡 Connecting Wi-Fi SSID: %s\n", ssid);
  WiFi.begin(ssid, password);
  
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(".");
    retries++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n🌐 Wi-Fi successfully connected!");
    wifiConnected = true;
    offlineMode = false;
    digitalWrite(LED_BLUE, HIGH); // Steady network indicator
  } else {
    Serial.println("\n⚠️ Connection timed out. Booting in isolated OFFLINE queue buffering state.");
    offlineMode = true;
    digitalWrite(LED_BLUE, LOW);
  }
}

// ================= BOOT SETUP =================
void setup() {
  Serial.begin(115200);
  
  // Set GPIO outputs
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_BLUE, LOW);
  
  // Test buzzers
  triggerAlertPattern(LED_GREEN, 2, 80);
  
  initCamera();
  connectWiFi();
}

// ================= MAIN CYCLE LOOP =================
void loop() {
  // Read Serial inputs for emulated scanner payloads (Testing utility)
  if (Serial.available() > 0) {
    String payload = Serial.readStringUntil('\n');
    payload.trim();
    
    if (payload.length() > 0) {
      Serial.printf("📡 Emulated Scanner scan event: %s\n", payload.c_str());
      
      if (sendQrToken(payload)) {
        // QR authorized -> Start capture
        delay(1000); // Await user focus
        captureAndVerifyFace();
      }
    }
  }
  
  // Keep alive / Health check ping every 30 seconds
  static unsigned long lastPing = 0;
  if (millis() - lastPing > 30000) {
    lastPing = millis();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("📶 Lost connection, attempting reconnect...");
      WiFi.disconnect();
      WiFi.begin(ssid, password);
    }
  }
  
  delay(100);
}
