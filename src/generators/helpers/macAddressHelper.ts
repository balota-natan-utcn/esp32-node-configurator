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
// Foloseste esp_efuse_mac_get_default() — citeste direct din eFuse,
// fara sa necesite conexiune WiFi.

#include <Arduino.h>
#include "esp_mac.h"

void setup() {
  Serial.begin(115200);
  delay(1000);

  uint8_t mac[6];
  esp_efuse_mac_get_default(mac);

  Serial.println("\\n=== Adresa MAC WiFi STA a acestui ESP32 ===");
  Serial.printf("%02X:%02X:%02X:%02X:%02X:%02X\\n",
                mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  Serial.println("============================================");
  Serial.println("Copiaza aceasta adresa in configuratorul de noduri.");
}

void loop() {}
`
}
