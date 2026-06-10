# ESP32 Node Configurator

Aplicație web care generează cod Arduino gata de compilat pentru o rețea de senzori ESP32. Configurezi vizual fiecare nod printr-un wizard, iar aplicația produce un `.zip` cu sketch-ul principal, fișierul de protocol partajat și un ghid de conectare hardware.

Proiect de licență — Rețea de senzori IoT cu ESP32 și ESP-NOW.

---

## Ce face

- **Wizard pe 5 pași:** tip nod → placă → senzori & actuatori → configurare rețea → preview & download
- **4 tipuri de noduri** generate cu cod specific fiecăruia:
  - **Nod Principal** — receiver ESP-NOW + HTTP server (`/sensor`, `/control`)
  - **Nod Secundar** — citire senzori + trimitere periodică via ESP-NOW
  - **Leaf Node** — deep sleep event-driven, trezire pe întrerupere GPIO (reed switch / PIR)
  - **Nod Semi-Principal** — agregator pentru rețele cu mai multe clădiri
- **Control bidirecțional** — relee/actuatori controlați prin HTTP de la nodul principal
- **Export / import** configurație JSON
- **Ghid integrat** de conectare hardware și upload

## Senzori și actuatori suportați

| Tip | Senzori |
|-----|---------|
| Temperatură & umiditate | DHT22, BME280 (+ presiune) |
| Calitatea aerului | MQ-135, MQ-2 |
| Distanță / lumină | HC-SR04, LDR |
| Contact magnetic / mișcare | Reed Switch NO/NC, PIR SR501, PIR AM312 |
| Actuatori | Modul releu |

## Plăci suportate

- ESP32 Dev Module
- ESP32-C3 SuperMini
- ESP32-S3

## Stack

- **React** + **TypeScript** + **Vite**
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **Zustand** — state management
- **JSZip** + **file-saver** — generare și descărcare arhivă

## Instalare și rulare

```bash
npm install
npm run dev
```

Aplicația rulează la `http://localhost:5173`.

## Structura proiectului

```
src/
├── components/
│   ├── steps/          # Pașii wizard (Step0–Step4)
│   └── ui/             # Componente reutilizabile + GhidModal
├── generators/
│   ├── mainNode.ts
│   ├── secondaryNode.ts
│   ├── leafNode.ts
│   ├── index.ts        # Entry point + mesh_protocol.h
│   └── helpers/
│       └── macAddressHelper.ts
├── data/               # Definiții plăci, senzori, tipuri noduri
├── store/              # Zustand store
├── types/              # TypeScript interfaces & enums
└── utils/
    └── pinAllocator.ts # Alocare automată pini fără conflicte
```

## Protocolul de comunicare

Toate nodurile folosesc același fișier `mesh_protocol.h` generat în zip:

```cpp
struct MessagePayload { ... };   // date senzori: nod → principal
struct ControlPayload  { ... };  // comenzi actuatori: principal → nod
```

Fișierul este inclus verbatim în fiecare sketch — nu se modifică manual.

## Control actuatori

Nodul principal expune un endpoint HTTP pentru controlul releelor:

```
GET http://[IP_PRINCIPAL]/control?node=[NUME_NOD]&relay=0&state=1
GET http://[IP_PRINCIPAL]/control?node=[NUME_NOD]&relay=0&state=0
```

Comanda ajunge la nodul secundar prin ESP-NOW în mai puțin de 10ms.

## Biblioteci Arduino necesare

Instalate prin **Tools → Manage Libraries** în Arduino IDE:

- `ArduinoJson` — Benoît Blanchon (v7.x)
- `DHT sensor library` — Adafruit
- `Adafruit BME280 Library` — Adafruit
- `Adafruit Unified Sensor` — Adafruit

ESP-NOW și WiFi sunt incluse în ESP32 Arduino Core.
