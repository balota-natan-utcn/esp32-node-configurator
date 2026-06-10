import { SensorId, WakeMode } from '../types'
import type { NodeConfig } from '../types'
import { allocatePins } from '../utils/pinAllocator'
import { macToArray } from './helpers/macAddressHelper'

export function generateLeafNode(config: NodeConfig): string {
  const sensors  = allocatePins(config.board, config.sensors)
  const wakeMode = config.leafConfig?.wakeMode ?? WakeMode.EVENT_DRIVEN
  const sleepSec = config.leafConfig?.timerSleepSec ?? 300
  const mac      = macToArray(config.network.masterMac || 'FF, FF, FF, FF, FF, FF')
  const ssid     = config.network.routerSsid || 'YOUR_SSID'
  const nodeName = config.nodeName || 'LeafNode'

  const reedSensors = sensors.filter(s =>
    [SensorId.REED_NO, SensorId.REED_NC, SensorId.PIR_501, SensorId.PIR_AM312].includes(s.sensorID)
  )

  if (reedSensors.length === 0) {
    return '// EROARE: Leaf node-ul necesita cel putin un senzor reed switch sau PIR.\n'
  }

  const primary = reedSensors[0]
  const primaryPin = primary.pin ?? 0
  const primaryNC  = primary.sensorID === SensorId.REED_NC
  const primaryPIR = primary.sensorID === SensorId.PIR_501 || primary.sensorID === SensorId.PIR_AM312

  // Wakeup mask — all sensor pins ORed together
  const wakeMask = reedSensors.map(s => `(1ULL << ${s.pin ?? 0})`).join(' | ')

  // Reed payload block — all sensors in reed_sensors[]
  const reedPayloadLines = reedSensors.map((s, i) => {
    const pin = s.pin ?? 0
    const isNC  = s.sensorID === SensorId.REED_NC
    const isPIR = s.sensorID === SensorId.PIR_501 || s.sensorID === SensorId.PIR_AM312
    const readExpr = isPIR
      ? `(digitalRead(${pin}) == HIGH)`
      : isNC
        ? `(digitalRead(${pin}) == HIGH)`
        : `(digitalRead(${pin}) == LOW)`
    return `  strncpy(payload.reed_sensors[${i}].json_key, "${s.jsonKey}", 20);
  payload.reed_sensors[${i}].closed = ${readExpr};`
  }).join('\n')

  // pinMode lines for all sensors
  const pinModes = reedSensors.map(s => {
    const pin = s.pin ?? 0
    const isPIR = s.sensorID === SensorId.PIR_501 || s.sensorID === SensorId.PIR_AM312
    return `  pinMode(${pin}, ${isPIR ? 'INPUT' : 'INPUT_PULLUP'});`
  }).join('\n')

  // currentState: based on primary sensor type
  const currentStateExpr = primaryPIR
    ? `(digitalRead(${primaryPin}) == HIGH)`
    : primaryNC
      ? `(digitalRead(${primaryPin}) == HIGH)`
      : `(digitalRead(${primaryPin}) == LOW)`

  // goToSleep: wake on opposite of current state
  const goToSleepBody = wakeMode === WakeMode.EVENT_DRIVEN
    ? `  int wakeLevel = currentState ? HIGH : LOW;
  Serial.printf("Deep sleep. Urmatorul wake la: %s\\n",
                wakeLevel == LOW ? "LOW" : "HIGH");
  Serial.flush();
  esp_deep_sleep_enable_gpio_wakeup(
    ${wakeMask},
    wakeLevel == LOW ? ESP_GPIO_WAKEUP_GPIO_LOW : ESP_GPIO_WAKEUP_GPIO_HIGH
  );
  esp_deep_sleep_start();`
    : `  Serial.printf("Deep sleep. Urmatorul wake dupa %d secunde.\\n", ${sleepSec});
  Serial.flush();
  esp_sleep_enable_timer_wakeup((uint64_t)${sleepSec} * 1000000ULL);
  esp_deep_sleep_start();`

  return `// Dependente necesare in Arduino IDE / platformio.ini:
// - ESP32 Arduino Core (board manager)
// - ArduinoJson (v7.x) — Benoit Blanchon  (neutilizata direct, dar inclusa in core)

#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <esp_sleep.h>
#include "mesh_protocol.h"

// ── Configurare ──────────────────────────────────────────────
uint8_t masterMAC[]     = {${mac}};
const char* ROUTER_SSID = "${ssid}";

#define NODE_NAME       "${nodeName}"
#define SEND_TIMEOUT_MS  2000
#define CHANNEL_INVALID  0

// ── RTC Memory — supravietuieste deep sleep ──────────────────
RTC_DATA_ATTR bool    lastKnownState = false;
RTC_DATA_ATTR int     bootCount      = 0;
RTC_DATA_ATTR int32_t savedChannel   = CHANNEL_INVALID;

volatile bool sendConfirmed = false;

// ────────────────────────────────────────────────────────────
void OnDataSent(const wifi_tx_info_t* tx_info, esp_now_send_status_t status) {
  sendConfirmed = (status == ESP_NOW_SEND_SUCCESS);
  Serial.println(sendConfirmed ? ">> Trimis OK" : ">> EROARE trimitere");
}

int32_t scanForChannel(const char* ssid) {
  Serial.println("Scanez retele WiFi...");
  int n = WiFi.scanNetworks();
  for (int i = 0; i < n; i++) {
    if (WiFi.SSID(i) == ssid) {
      Serial.printf("Gasit '%s' pe canalul %d\\n", ssid, WiFi.channel(i));
      return WiFi.channel(i);
    }
  }
  Serial.println("Reteaua nu a fost gasita!");
  return -1;
}

bool tryChannel(int32_t ch, const MessagePayload& payload) {
  esp_now_deinit();
  WiFi.disconnect();
  WiFi.mode(WIFI_OFF);
  delay(100);
  WiFi.mode(WIFI_STA);
  esp_wifi_set_channel(ch, WIFI_SECOND_CHAN_NONE);

  if (esp_now_init() != ESP_OK) return false;
  esp_now_register_send_cb(OnDataSent);

  esp_now_peer_info_t peer;
  memset(&peer, 0, sizeof(peer));
  memcpy(peer.peer_addr, masterMAC, 6);
  peer.channel = ch;
  peer.encrypt = false;
  peer.ifidx   = WIFI_IF_STA;

  if (esp_now_add_peer(&peer) != ESP_OK) return false;

  sendConfirmed = false;
  esp_now_send(masterMAC, (const uint8_t*)&payload, sizeof(payload));
  Serial.printf("Pachet trimis pe canalul %d, astept confirmare...\\n", ch);

  unsigned long t = millis();
  while (!sendConfirmed && (millis() - t < SEND_TIMEOUT_MS)) delay(10);
  return sendConfirmed;
}

void goToSleep(bool currentState) {
${goToSleepBody}
}

// ────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);

  bootCount++;
${pinModes}

  bool currentState = ${currentStateExpr};

  Serial.printf("\\n=== Boot #%d ===\\n", bootCount);
  Serial.printf("Stare: %s | Anterioara: %s | Canal salvat: %d\\n",
                currentState   ? "ACTIV"  : "INACTIV",
                lastKnownState ? "ACTIV"  : "INACTIV",
                savedChannel);

  // Glitch/bounce — stare neschimbata
  if (currentState == lastKnownState && bootCount > 1) {
    Serial.println("Stare neschimbata. Reconfigurez wake-up si dorm.");
    goToSleep(currentState);
    return;
  }

  lastKnownState = currentState;

  // ── Construim pachetul ───────────────────────────────────
  MessagePayload payload;
  memset(&payload, 0, sizeof(payload));
  strncpy(payload.node_name, NODE_NAME, NODE_NAME_LEN);
  payload.sensor_count = 0;
  payload.reed_count   = ${reedSensors.length};
${reedPayloadLines}

  // ── Strategie canal in 3 pasi ───────────────────────────
  bool sent = false;

  if (savedChannel != CHANNEL_INVALID) {
    Serial.printf("Incerc canalul salvat: %d\\n", savedChannel);
    WiFi.mode(WIFI_STA);
    sent = tryChannel(savedChannel, payload);
    if (!sent) Serial.printf("Canalul salvat %d nu a functionat. Rescanez...\\n", savedChannel);
  } else {
    WiFi.mode(WIFI_STA);
  }

  if (!sent) {
    int32_t freshChannel = scanForChannel(ROUTER_SSID);
    if (freshChannel == -1) {
      Serial.println("Reteaua nu e disponibila. Dorm.");
      goToSleep(currentState);
      return;
    }
    if (freshChannel == savedChannel) {
      Serial.println("Scan confirma acelasi canal dar tot esueaza. Dorm.");
      goToSleep(currentState);
      return;
    }
    sent = tryChannel(freshChannel, payload);
    if (sent) {
      savedChannel = freshChannel;
      Serial.printf("Succes! Canal actualizat la %d.\\n", savedChannel);
    }
  }

  if (!sent) Serial.println("Pachetul NU a fost livrat. Dorm oricum.");

  goToSleep(currentState);
}

void loop() {
  // Nu ruleaza niciodata
}
`
}
