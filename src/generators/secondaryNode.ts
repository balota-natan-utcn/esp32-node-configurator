import { SensorId } from '../types'
import type { NodeConfig } from '../types'
import { allocatePins } from '../utils/pinAllocator'
import { macToArray } from './helpers/macAddressHelper'
import { BOARDS } from '../data/boards'

export function generateSecondaryNode(config: NodeConfig): string {
  const sensors  = allocatePins(config.board, config.sensors)
  const mac      = macToArray(config.network.masterMac || 'FF, FF, FF, FF, FF, FF')
  const ssid     = config.network.routerSsid || 'YOUR_SSID'
  const password = config.network.routerPassword || 'YOUR_PASSWORD'
  const interval = config.network.sendInterval ?? 60000
  const nodeName = config.nodeName || 'Nod_Secundar'
  const board    = BOARDS.find(b => b.id === config.board)!

  const hasDHT22  = sensors.some(s => s.sensorID === SensorId.DHT22)
  const hasBME280 = sensors.some(s => s.sensorID === SensorId.BME280)
  const hasMQ135  = sensors.some(s => s.sensorID === SensorId.MQ135)
  const hasMQ2    = sensors.some(s => s.sensorID === SensorId.MQ2)
  const hasLDR    = sensors.some(s => s.sensorID === SensorId.LDR)
  const hasHCSR04 = sensors.some(s => s.sensorID === SensorId.HCSR04)

  const reedSensors   = sensors.filter(s => s.sensorID === SensorId.REED_NO || s.sensorID === SensorId.REED_NC)
  const pirSensors    = sensors.filter(s => s.sensorID === SensorId.PIR_501 || s.sensorID === SensorId.PIR_AM312)
  const relaySensors  = sensors.filter(s => s.sensorID === SensorId.RELAY)

  // ── Includes ─────────────────────────────────────────────
  const includes = [
    '#include <WiFi.h>',
    '#include <esp_now.h>',
    '#include <esp_wifi.h>',
    '#include "mesh_protocol.h"',
    hasDHT22  ? '#include <DHT.h>' : '',
    hasBME280 ? '#include <Wire.h>\n#include <Adafruit_BME280.h>' : '',
  ].filter(Boolean).join('\n')

  // ── Defines și obiecte globale ────────────────────────────
  const defines: string[] = []

  sensors.filter(s => s.sensorID === SensorId.DHT22).forEach((s, i) => {
    defines.push(`#define DHT${i > 0 ? i + 1 : ''}_PIN  ${s.pin ?? 0}`)
    defines.push(`DHT dht${i > 0 ? i + 1 : ''}(DHT${i > 0 ? i + 1 : ''}_PIN, DHT22);`)
  })

  if (hasBME280) {
    defines.push(`// BME280 pe I2C: SDA=GPIO${board.i2cSda} SCL=GPIO${board.i2cScl}`)
    defines.push(`Adafruit_BME280 bme;`)
  }

  sensors.filter(s => s.sensorID === SensorId.MQ135).forEach((s, i) => {
    defines.push(`#define MQ135${i > 0 ? `_${i + 1}` : ''}_PIN  ${s.pin ?? 0}`)
  })
  sensors.filter(s => s.sensorID === SensorId.MQ2).forEach((s, i) => {
    defines.push(`#define MQ2${i > 0 ? `_${i + 1}` : ''}_PIN  ${s.pin ?? 0}`)
  })
  sensors.filter(s => s.sensorID === SensorId.LDR).forEach((s, i) => {
    defines.push(`#define LDR${i > 0 ? `_${i + 1}` : ''}_PIN  ${s.pin ?? 0}`)
  })
  sensors.filter(s => s.sensorID === SensorId.HCSR04).forEach((s, i) => {
    defines.push(`#define HCSR04${i > 0 ? `_${i + 1}` : ''}_TRIG  ${s.pinTrig ?? 0}`)
    defines.push(`#define HCSR04${i > 0 ? `_${i + 1}` : ''}_ECHO  ${s.pinEcho ?? 0}`)
  })
  reedSensors.forEach((s, i) => {
    defines.push(`#define REED${i > 0 ? `_${i + 1}` : ''}_PIN  ${s.pin ?? 0}`)
  })
  pirSensors.forEach((s, i) => {
    defines.push(`#define PIR${i > 0 ? `_${i + 1}` : ''}_PIN  ${s.pin ?? 0}`)
  })
  relaySensors.forEach((s, i) => {
    defines.push(`#define RELAY${i > 0 ? `_${i + 1}` : ''}_PIN  ${s.pin ?? 0}`)
  })

  // ── HC-SR04 helper function ───────────────────────────────
  const hcsr04Fns = sensors.filter(s => s.sensorID === SensorId.HCSR04).map((s, i) => {
    const suf  = i > 0 ? `_${i + 1}` : ''
    const trig = `HCSR04${suf}_TRIG`
    const echo = `HCSR04${suf}_ECHO`
    return `float readDistance${i > 0 ? i + 1 : ''}() {
  digitalWrite(${trig}, LOW);  delayMicroseconds(2);
  digitalWrite(${trig}, HIGH); delayMicroseconds(10);
  digitalWrite(${trig}, LOW);
  long dur = pulseIn(${echo}, HIGH, 30000UL);
  return dur == 0 ? -1.0f : dur * 0.034f / 2.0f;
}`
  }).join('\n\n')

  // ── Setup sensors ─────────────────────────────────────────
  const setupSensors: string[] = []
  if (hasDHT22)  setupSensors.push('  dht.begin();')
  if (hasBME280) setupSensors.push(`  if (!bme.begin(0x76)) {\n    Serial.println("BME280 negasit! Verifica conexiunile.");\n  }`)
  sensors.filter(s => s.sensorID === SensorId.HCSR04).forEach((s, i) => {
    const suf = i > 0 ? `_${i + 1}` : ''
    setupSensors.push(`  pinMode(HCSR04${suf}_TRIG, OUTPUT);\n  pinMode(HCSR04${suf}_ECHO, INPUT);`)
  })
  reedSensors.forEach((s, i) => {
    const suf = i > 0 ? `_${i + 1}` : ''
    setupSensors.push(`  pinMode(REED${suf}_PIN, INPUT_PULLUP);`)
  })
  pirSensors.forEach((s, i) => {
    const suf = i > 0 ? `_${i + 1}` : ''
    setupSensors.push(`  pinMode(PIR${suf}_PIN, INPUT);`)
  })
  relaySensors.forEach((s, i) => {
    const suf = i > 0 ? `_${i + 1}` : ''
    setupSensors.push(`  pinMode(RELAY${suf}_PIN, OUTPUT);\n  digitalWrite(RELAY${suf}_PIN, LOW);`)
  })

  // ── readSensors() body ────────────────────────────────────
  const readLines: string[] = []
  let sensorSlot = 0

  sensors.filter(s => s.sensorID === SensorId.DHT22).forEach((s, i) => {
    const obj = i > 0 ? `dht${i + 1}` : 'dht'
    readLines.push(`  // ${s.jsonKey} — DHT22`)
    readLines.push(`  float temp${i > 0 ? i + 1 : ''} = ${obj}.readTemperature();`)
    readLines.push(`  float hum${i > 0 ? i + 1 : ''}  = ${obj}.readHumidity();`)
    readLines.push(`  if (!isnan(temp${i > 0 ? i + 1 : ''})) { p.sensors[p.sensor_count] = {SENSOR_TEMP,  temp${i > 0 ? i + 1 : ''}}; p.sensor_count++; }`)
    readLines.push(`  if (!isnan(hum${i > 0 ? i + 1 : ''}))  { p.sensors[p.sensor_count] = {SENSOR_HUMID, hum${i > 0 ? i + 1 : ''}}; p.sensor_count++; }`)
    sensorSlot += 2
  })

  if (hasBME280) {
    readLines.push(`  // BME280`)
    readLines.push(`  p.sensors[p.sensor_count] = {SENSOR_TEMP,     bme.readTemperature()}; p.sensor_count++;`)
    readLines.push(`  p.sensors[p.sensor_count] = {SENSOR_HUMID,    bme.readHumidity()};    p.sensor_count++;`)
    readLines.push(`  p.sensors[p.sensor_count] = {SENSOR_PRESSURE, bme.readPressure() / 100.0f}; p.sensor_count++;`)
    sensorSlot += 3
  }

  sensors.filter(s => s.sensorID === SensorId.MQ135).forEach((s, i) => {
    const pinDef = `MQ135${i > 0 ? `_${i + 1}` : ''}_PIN`
    readLines.push(`  // ${s.jsonKey} — MQ135`)
    readLines.push(`  p.sensors[p.sensor_count] = {SENSOR_GAS, analogRead(${pinDef}) * (3.3f / 4095.0f)}; p.sensor_count++;`)
    sensorSlot++
  })

  sensors.filter(s => s.sensorID === SensorId.MQ2).forEach((s, i) => {
    const pinDef = `MQ2${i > 0 ? `_${i + 1}` : ''}_PIN`
    readLines.push(`  // ${s.jsonKey} — MQ2`)
    readLines.push(`  p.sensors[p.sensor_count] = {SENSOR_GAS, analogRead(${pinDef}) * (3.3f / 4095.0f)}; p.sensor_count++;`)
    sensorSlot++
  })

  sensors.filter(s => s.sensorID === SensorId.LDR).forEach((s, i) => {
    const pinDef = `LDR${i > 0 ? `_${i + 1}` : ''}_PIN`
    readLines.push(`  // ${s.jsonKey} — LDR`)
    readLines.push(`  p.sensors[p.sensor_count] = {SENSOR_LIGHT, (float)analogRead(${pinDef})}; p.sensor_count++;`)
    sensorSlot++
  })

  sensors.filter(s => s.sensorID === SensorId.HCSR04).forEach((s, i) => {
    const fn = `readDistance${i > 0 ? i + 1 : ''}()`
    readLines.push(`  // ${s.jsonKey} — HC-SR04`)
    readLines.push(`  p.sensors[p.sensor_count] = {SENSOR_DISTANCE, ${fn}}; p.sensor_count++;`)
    sensorSlot++
  })

  reedSensors.forEach((s, i) => {
    const pinDef = `REED${i > 0 ? `_${i + 1}` : ''}_PIN`
    const isNC   = s.sensorID === SensorId.REED_NC
    readLines.push(`  // ${s.jsonKey} — Reed ${isNC ? 'NC' : 'NO'}`)
    readLines.push(`  strncpy(p.reed_sensors[p.reed_count].json_key, "${s.jsonKey}", 20);`)
    readLines.push(`  p.reed_sensors[p.reed_count].closed = (digitalRead(${pinDef}) == ${isNC ? 'HIGH' : 'LOW'});`)
    readLines.push(`  p.reed_count++;`)
  })

  pirSensors.forEach((s, i) => {
    const pinDef = `PIR${i > 0 ? `_${i + 1}` : ''}_PIN`
    readLines.push(`  // ${s.jsonKey} — PIR`)
    readLines.push(`  strncpy(p.reed_sensors[p.reed_count].json_key, "${s.jsonKey}", 20);`)
    readLines.push(`  p.reed_sensors[p.reed_count].closed = (digitalRead(${pinDef}) == HIGH);`)
    readLines.push(`  p.reed_count++;`)
  })

  return `// Dependente necesare in Arduino IDE / platformio.ini:
// - ESP32 Arduino Core (board manager)
// - ArduinoJson (v7.x) — Benoit Blanchon${hasDHT22 ? '\n// - DHT sensor library — Adafruit' : ''}${hasBME280 ? '\n// - Adafruit BME280 Library — Adafruit\n// - Adafruit Unified Sensor — Adafruit' : ''}

${includes}

// ── Configurare retea ────────────────────────────────────────
uint8_t masterMAC[]     = {${mac}};
const char* ROUTER_SSID = "${ssid}";
const char* ROUTER_PASS = "${password}";

#define NODE_NAME     "${nodeName}"
#define SEND_INTERVAL ${interval}UL

// ── Hardware ─────────────────────────────────────────────────
${defines.join('\n')}

unsigned long lastSend = 0;

// ────────────────────────────────────────────────────────────
void OnDataSent(const wifi_tx_info_t* tx_info, esp_now_send_status_t status) {
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? ">> Trimis OK" : ">> EROARE trimitere");
}

int32_t getRouterChannel(const char* ssid) {
  int n = WiFi.scanNetworks();
  for (int i = 0; i < n; i++)
    if (WiFi.SSID(i) == ssid) return WiFi.channel(i);
  return 1;
}
${hcsr04Fns ? '\n' + hcsr04Fns + '\n' : ''}
void readSensors(MessagePayload& p) {
  p.sensor_count = 0;
  p.reed_count   = 0;
${readLines.join('\n')}
}

// ────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(2000);

${setupSensors.join('\n')}

  WiFi.mode(WIFI_STA);
  int32_t ch = getRouterChannel(ROUTER_SSID);
  Serial.printf("Canal router: %d\\n", ch);

  WiFi.disconnect();
  WiFi.mode(WIFI_OFF);
  delay(100);
  WiFi.mode(WIFI_STA);
  esp_wifi_set_channel(ch, WIFI_SECOND_CHAN_NONE);

  if (esp_now_init() != ESP_OK) { Serial.println("ESP-NOW init esuat!"); return; }
  esp_now_register_send_cb(OnDataSent);

  esp_now_peer_info_t peer;
  memset(&peer, 0, sizeof(peer));
  memcpy(peer.peer_addr, masterMAC, 6);
  peer.channel = ch;
  peer.encrypt = false;
  peer.ifidx   = WIFI_IF_STA;

  if (esp_now_add_peer(&peer) != ESP_OK) { Serial.println("Add peer esuat!"); return; }
  Serial.println("Configurare completa! Nod: " NODE_NAME);
}

// ────────────────────────────────────────────────────────────
void loop() {
  if (millis() - lastSend >= SEND_INTERVAL) {
    lastSend = millis();

    MessagePayload payload;
    memset(&payload, 0, sizeof(payload));
    strncpy(payload.node_name, NODE_NAME, NODE_NAME_LEN);

    readSensors(payload);

    esp_now_send(masterMAC, (uint8_t*)&payload, sizeof(payload));
    Serial.printf("[%s] Trimis: %d senzori, %d reed\\n",
                  NODE_NAME, payload.sensor_count, payload.reed_count);
  }
}
`
}
