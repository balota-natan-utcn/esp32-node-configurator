export function macToArray(mac: string): string {
  return mac
    .split(':')
    .map((b) => `0x${b.toUpperCase()}`)
    .join(', ')
}

export function generateMacHelper(): string {
  return `// get_mac_address.ino
// Incarca pe orice ESP32 pentru a-i afla adresa MAC.
// Citeste rezultatul in Serial Monitor la 115200 baud.

#include <WiFi.h>

void setup() {
  Serial.begin(115200);
  delay(1000);
  WiFi.mode(WIFI_STA);
  Serial.println("\\n=== Adresa MAC a acestui ESP32 ===");
  Serial.println(WiFi.macAddress());
  Serial.println("===================================");
  Serial.println("Copiaza aceasta adresa in configuratorul de noduri.");
}

void loop() {}
`
}
