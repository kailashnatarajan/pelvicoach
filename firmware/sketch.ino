// PelviCoach firmware v2 (Wokwi, ESP32). Biofeedback only, no stimulation output.
// POT1 = pelvic floor squeeze, POT2 = abdominal activity, BTN = cycle fault (none > lift-off > 50 Hz mains)
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// ---- EDIT THESE (HiveMQ Cloud). Use a PUBLISH-ONLY credential for the device. ----
const char* DEVICE_ID = "pfm13-01";
const char* MQTT_HOST = "YOUR-CLUSTER.s1.eu.hivemq.cloud";
const int   MQTT_PORT = 8883;
const char* MQTT_USER = "pfm13-device";
const char* MQTT_PASS = "CHANGE-ME";
// -----------------------------------------------------------------------------------

#define PF 34
#define AB 35
#define BTN 25
#define LG 2   // green: signal accepted
#define LR 4   // red: signal rejected
const int N = 200;                 // 200 samples at 1 kHz = 200 ms window (bins fall on 5 Hz steps)
const float MAINS_AMP = 80;        // injected 50 Hz pickup (uV) for the fault demo
const float LINE_RATIO = 10;       // flag if 50 Hz bin power > 10x mean of neighbouring bins...
const int NB = 9, MAINS_K = 4;     // ...in 2 consecutive windows (index 4 below = 50 Hz)
const int BIN_HZ[NB] = {30, 35, 40, 45, 50, 55, 60, 65, 70};
static float CT[NB][N], ST[NB][N];

WiFiClientSecure wc; PubSubClient mq(wc);
int fault = 0, mainsRun = 0;
uint32_t lastTry = 0, lastWifi = 0, lastBtn = 0, seq = 0;
String tWin, tSta;

float g() { return (random(-1000, 1000) + random(-1000, 1000) + random(-1000, 1000)) / 1000.0; } // ~unit variance
inline void pollBtn() { if (!digitalRead(BTN) && millis() - lastBtn > 300) { fault = (fault + 1) % 3; lastBtn = millis(); } }

void setup() {
  Serial.begin(115200);
  pinMode(BTN, INPUT_PULLUP); pinMode(LG, OUTPUT); pinMode(LR, OUTPUT);
  for (int k = 0; k < NB; k++) for (int i = 0; i < N; i++) {
    float w = 2 * PI * BIN_HZ[k] * i / 1000.0; CT[k][i] = cos(w); ST[k][i] = sin(w);
  }
  tWin = String("pelvicoach/") + DEVICE_ID + "/window";
  tSta = String("pelvicoach/") + DEVICE_ID + "/status";
  WiFi.begin("Wokwi-GUEST", "", 6);
  wc.setInsecure();                       // demo only: no certificate pinning
  mq.setServer(MQTT_HOST, MQTT_PORT); mq.setBufferSize(256);
}

void loop() {
  float ap = 4 + 96 * analogRead(PF) / 4095.0;   // pelvic floor rms in uV (rest 4, max 100)
  float aa = 4 + 96 * analogRead(AB) / 4095.0;   // abdominal rms
  if (fault == 1) ap = 0.4;                      // electrode lift-off: flat line
  float sp = 0, sa = 0, re[NB] = {0}, im[NB] = {0};
  for (int i = 0; i < N; i++) {
    uint32_t t0 = micros();
    pollBtn();                                   // checked every sample, so short clicks are not missed
    float x = ap * g(); if (fault == 2) x += MAINS_AMP * ST[MAINS_K][i];
    float y = aa * g();
    sp += x * x; sa += y * y;
    for (int k = 0; k < NB; k++) { re[k] += x * CT[k][i]; im[k] += x * ST[k][i]; }
    while (micros() - t0 < 1000);
  }
  float pf = sqrt(sp / N), ab = sqrt(sa / N), p[NB], nb = 0;
  for (int k = 0; k < NB; k++) { p[k] = re[k] * re[k] + im[k] * im[k]; if (k != MAINS_K) nb += p[k]; }
  nb /= (NB - 1);
  float ml = p[MAINS_K] / (nb + 1e-6);           // narrow-band peak vs neighbours: works at any squeeze level
  float amp = 2 * sqrt(p[MAINS_K]) / N;
  float mr = (amp * amp / 2) / (sp / N + 1e-6);  // share of total power at 50 Hz (kept for the web app)
  mainsRun = ml > LINE_RATIO ? mainsRun + 1 : 0;
  int q = pf < 1.5 ? 1 : (mainsRun >= 2 ? 2 : 0);   // 0 ok, 1 flat, 2 mains
  digitalWrite(LG, q == 0); digitalWrite(LR, q != 0);

  char b[160];
  snprintf(b, sizeof b, "{\"d\":\"%s\",\"s\":%lu,\"up\":%lu,\"pf\":%.1f,\"ab\":%.1f,\"mr\":%.2f,\"ml\":%.1f,\"q\":%d}",
           DEVICE_ID, (unsigned long)seq++, (unsigned long)millis(), pf, ab, mr, ml, q);
  Serial.println(b);

  if (WiFi.status() == WL_CONNECTED) {
    if (!mq.connected() && millis() - lastTry > 5000) {
      lastTry = millis();
      String cid = String(DEVICE_ID) + "-" + String(random(99999));
      if (mq.connect(cid.c_str(), MQTT_USER, MQTT_PASS, tSta.c_str(), 0, true, "offline")) mq.publish(tSta.c_str(), "online", true);
    }
    if (mq.connected()) { mq.publish(tWin.c_str(), b); mq.loop(); }
  } else if (millis() - lastWifi > 10000) { lastWifi = millis(); WiFi.reconnect(); }
}
