import type { NodeConfig } from '../types'

export function generateMainNode(config: NodeConfig): string {
  const ssid     = config.network.routerSsid || 'YOUR_SSID'
  const password = config.network.routerPassword || 'YOUR_PASSWORD'
  const timeout  = config.network.nodeTimeout ?? 15000

  return `// Dependente necesare in Arduino IDE / platformio.ini:
// - ESP32 Arduino Core (board manager)

#include <WiFi.h>
#include <WebServer.h>
#include <esp_now.h>
#include "mesh_protocol.h"

// ── Configurare WiFi ─────────────────────────────────────────
const char* ssid     = "${ssid}";
const char* password = "${password}";

WebServer server(80);

// ── Stocarea nodurilor remote ────────────────────────────────
#define MAX_REMOTE_NODES  8
#define NODE_TIMEOUT_MS   ${timeout}UL

struct RemoteNode {
  MessagePayload data;
  unsigned long  lastSeen;
  bool           active;
  uint8_t        mac[6];
};

RemoteNode remoteNodes[MAX_REMOTE_NODES];

int findOrAllocNode(const char* name) {
  int freeSlot = -1;
  for (int i = 0; i < MAX_REMOTE_NODES; i++) {
    if (remoteNodes[i].active && strcmp(remoteNodes[i].data.node_name, name) == 0)
      return i;
    if (!remoteNodes[i].active && freeSlot == -1)
      freeSlot = i;
  }
  return freeSlot;
}

// ── Callback ESP-NOW ─────────────────────────────────────────
void OnDataRecv(const esp_now_recv_info_t* info, const uint8_t* data, int len) {
  if (len != sizeof(MessagePayload)) {
    Serial.printf("Pachet ignorat: marime incorecta %d (asteptat %d)\\n", len, sizeof(MessagePayload));
    return;
  }

  MessagePayload incoming;
  memcpy(&incoming, data, sizeof(incoming));

  int slot = findOrAllocNode(incoming.node_name);
  if (slot == -1) {
    Serial.println("AVERTISMENT: Toate sloturile sunt ocupate!");
    return;
  }

  bool isNew = !remoteNodes[slot].active;

  remoteNodes[slot].data     = incoming;
  remoteNodes[slot].lastSeen = millis();
  remoteNodes[slot].active   = true;
  memcpy(remoteNodes[slot].mac, info->src_addr, 6);

  if (isNew && !esp_now_is_peer_exist(info->src_addr)) {
    esp_now_peer_info_t peer = {};
    memcpy(peer.peer_addr, info->src_addr, 6);
    peer.channel = 0;
    peer.encrypt = false;
    peer.ifidx   = WIFI_IF_STA;
    esp_now_add_peer(&peer);
    Serial.printf("[ESP-NOW] Peer nou inregistrat: '%s'\\n", incoming.node_name);
  }

  Serial.printf("[ESP-NOW] Date primite de la '%s' (slot %d)\\n", incoming.node_name, slot);
}

// ── Helper: numele tipului de senzor ─────────────────────────
const char* sensorTypeName(uint8_t type) {
  switch (type) {
    case SENSOR_TEMP:     return "temperature";
    case SENSOR_HUMID:    return "humidity";
    case SENSOR_GAS:      return "gas_level";
    case SENSOR_POWER:    return "power";
    case SENSOR_FLOOD:    return "flood";
    case SENSOR_LIGHT:    return "light_level";
    case SENSOR_DISTANCE: return "distance_cm";
    case SENSOR_PRESSURE: return "pressure_hpa";
    default:              return "unknown";
  }
}

// ── Handler HTTP GET /sensor ──────────────────────────────────
void handleSensor() {
  String json = "{";
  bool firstNode = true;

  unsigned long now = millis();
  for (int i = 0; i < MAX_REMOTE_NODES; i++) {
    if (!remoteNodes[i].active) continue;
    if (now - remoteNodes[i].lastSeen > NODE_TIMEOUT_MS) continue;

    MessagePayload& p = remoteNodes[i].data;

    if (!firstNode) json += ",";
    firstNode = false;

    json += "\\"";
    json += p.node_name;
    json += "\\":{\\"sensors\\":{";

    for (int s = 0; s < p.sensor_count; s++) {
      if (s > 0) json += ",";
      json += "\\"";
      json += sensorTypeName(p.sensors[s].type);
      json += "\\":";
      json += String(p.sensors[s].value, 2);
    }

    json += "}";

    if (p.reed_count > 0) {
      json += ",\\"magnetic_sensors\\":{";
      for (int r = 0; r < p.reed_count; r++) {
        if (r > 0) json += ",";
        json += "\\"";
        json += p.reed_sensors[r].json_key;
        json += "\\":";
        json += p.reed_sensors[r].closed ? "true" : "false";
      }
      json += "}";
    }

    json += "}";
  }

  json += "}";

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", json);
}

// ── Handler HTTP POST|GET /control ───────────────────────────
void handleControl() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  if (server.method() == HTTP_OPTIONS) {
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(204);
    return;
  }

  String nodeName = server.arg("node");
  int    relayIdx = server.arg("relay").toInt();
  bool   state    = server.arg("state") == "1" || server.arg("state") == "true";

  if (nodeName.isEmpty()) {
    server.send(400, "application/json", "{\\"error\\":\\"param 'node' lipsa\\"}");
    return;
  }

  int slot = -1;
  for (int i = 0; i < MAX_REMOTE_NODES; i++) {
    if (remoteNodes[i].active && String(remoteNodes[i].data.node_name) == nodeName) {
      slot = i; break;
    }
  }

  if (slot == -1) {
    server.send(404, "application/json", "{\\"error\\":\\"nod negasit\\"}");
    return;
  }

  ControlPayload cmd;
  memset(&cmd, 0, sizeof(cmd));
  strncpy(cmd.target_node, nodeName.c_str(), NODE_NAME_LEN);
  cmd.relay_index = (uint8_t)relayIdx;
  cmd.state       = state;

  esp_err_t res = esp_now_send(remoteNodes[slot].mac, (uint8_t*)&cmd, sizeof(cmd));
  server.send(res == ESP_OK ? 200 : 500,
              "application/json",
              res == ESP_OK ? "{\\"ok\\":true}" : "{\\"error\\":\\"send esuat\\"}");
}

// ── Setup ─────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  memset(remoteNodes, 0, sizeof(remoteNodes));

  WiFi.mode(WIFI_AP_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\\nConectat!");
  Serial.print("MAC: ");  Serial.println(WiFi.macAddress());
  Serial.print("IP:  ");  Serial.println(WiFi.localIP());

  if (esp_now_init() != ESP_OK) {
    Serial.println("EROARE: esp_now_init() esuat!");
  } else {
    esp_now_register_recv_cb(OnDataRecv);
    Serial.println("ESP-NOW activ, asteptam noduri...");
  }

  server.on("/sensor",  handleSensor);
  server.on("/control", handleControl);
  server.begin();
  Serial.println("HTTP server pornit pe /sensor si /control");
}

// ── Loop ──────────────────────────────────────────────────────
void loop() {
  server.handleClient();
}
`
}
