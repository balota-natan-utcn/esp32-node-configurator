interface Props {
  open: boolean
  onClose: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-mono font-bold text-cyan-400 border-b border-gray-700 pb-1">{title}</h3>
      <div className="text-sm text-gray-300 leading-relaxed flex flex-col gap-2">{children}</div>
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
      <span>{children}</span>
    </div>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="bg-gray-800 text-green-400 font-mono text-xs px-1.5 py-0.5 rounded">{children}</code>
}

export function GhidModal({ open, onClose }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">

        {/* Header modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="font-mono font-bold text-gray-100">Ghid — De la configurator la placă</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 transition-colors text-lg font-mono">✕</button>
        </div>

        {/* Conținut scrollabil */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-6">

          <Section title="1. Pregătire Arduino IDE">
            <Step n={1}>
              Descarcă și instalează <Code>Arduino IDE 2.x</Code> de pe arduino.cc
            </Step>
            <Step n={2}>
              Adaugă suportul pentru ESP32: <strong>File → Preferences → Additional boards manager URLs</strong> și adaugă:
              <div className="mt-1 bg-gray-800 rounded px-3 py-2 font-mono text-xs text-green-400 break-all">
                https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
              </div>
            </Step>
            <Step n={3}>
              <strong>Tools → Board → Boards Manager</strong> → caută <Code>esp32</Code> → instalează pachetul <em>esp32 by Espressif Systems</em>
            </Step>
          </Section>

          <Section title="2. Instalare biblioteci">
            <p className="text-gray-400 text-xs">Prin <strong>Tools → Manage Libraries</strong> în Arduino IDE:</p>
            <div className="bg-gray-800 rounded px-3 py-2 font-mono text-xs text-gray-300 flex flex-col gap-1">
              <span><span className="text-cyan-400">ArduinoJson</span> — de Benoît Blanchon (v7.x)</span>
              <span><span className="text-cyan-400">DHT sensor library</span> — de Adafruit (dacă ai DHT22)</span>
              <span><span className="text-cyan-400">Adafruit BME280 Library</span> — de Adafruit (dacă ai BME280)</span>
              <span><span className="text-cyan-400">Adafruit Unified Sensor</span> — de Adafruit (dependință BME280)</span>
            </div>
            <p className="text-gray-500 text-xs">ESP-NOW și WiFi sunt incluse automat în ESP32 Arduino Core.</p>
          </Section>

          <Section title="3. Găsirea adresei MAC">
            <Step n={1}>
              Descarcă zip-ul generat și deschide <Code>helpers/get_mac_address.ino</Code> în Arduino IDE
            </Step>
            <Step n={2}>
              <strong>Tools → Board</strong> → selectează placa ta (ex: <em>ESP32 Dev Module</em> sau <em>ESP32C3 Dev Module</em>)
            </Step>
            <Step n={3}>
              <strong>Tools → Port</strong> → selectează portul COM/tty al plăcii (apare după conectare USB)
            </Step>
            <Step n={4}>
              Apasă <strong>Upload</strong> (→), așteptați până scrie <em>Done uploading</em>
            </Step>
            <Step n={5}>
              Deschide <strong>Tools → Serial Monitor</strong>, setează viteza la <Code>115200 baud</Code>
            </Step>
            <Step n={6}>
              Adresa MAC apare în format <Code>D4:E9:F4:E8:DB:60</Code> — notează-o și introdu-o în configurator la Step 3
            </Step>
            <p className="text-gray-500 text-xs">
              Sketch-ul folosește <Code>esp_efuse_mac_get_default()</Code> — citește direct din memoria eFuse a cipului, fără conexiune WiFi. Funcționează pe toate variantele ESP32.
            </p>
            <div className="bg-blue-900/30 border border-blue-700 rounded px-3 py-2 text-xs text-blue-300 font-mono">
              Ordinea recomandată: află MAC-ul nodului principal primul, apoi configurează și uploadează nodurile secundare și leaf nodes care au nevoie de acea adresă.
            </div>
          </Section>

          <Section title="4. Setări specifice per placă">
            <div className="bg-orange-900/30 border border-orange-600 rounded px-3 py-2 text-xs text-orange-300 font-mono flex flex-col gap-1">
              <span className="font-bold text-orange-200">ESP32-C3 SuperMini</span>
              <span>
                Înainte de upload activează: <strong>Tools → USB CDC On Boot → Enabled</strong>
              </span>
              <span className="text-orange-400/80">
                Fără această setare, Serial Monitor nu afișează nimic — placa folosește USB nativ (CDC) în loc de UART tradițional.
              </span>
            </div>
            <div className="bg-gray-800/60 border border-gray-700 rounded px-3 py-2 text-xs text-gray-400 font-mono flex flex-col gap-1">
              <span className="font-bold text-gray-300">ESP32 Dev Module / ESP32-S3</span>
              <span>Nu necesită setări suplimentare față de cele standard.</span>
            </div>
          </Section>

          <Section title="5. Upload cod generat">
            <Step n={1}>
              Extrage arhiva <Code>.zip</Code> descărcată din configurator
            </Step>
            <Step n={2}>
              Deschide folderul <Code>main/</Code> și dublu-click pe fișierul <Code>.ino</Code> — Arduino IDE va deschide sketch-ul împreună cu <Code>mesh_protocol.h</Code>
            </Step>
            <Step n={3}>
              Selectează placa și portul corect. Dacă folosești ESP32-C3 SuperMini, verifică setarea de la pasul 4.
            </Step>
            <Step n={4}>
              Apasă <strong>Upload</strong> și urmărește Serial Monitor la <Code>115200 baud</Code> pentru confirmare
            </Step>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded px-3 py-2 text-xs text-yellow-300 font-mono">
              ⚠ <Code>mesh_protocol.h</Code> trebuie să fie identic pe toate plăcile. Nu modifica acest fișier manual — folosește întotdeauna versiunea din zip-ul generat de configurator.
            </div>
          </Section>

          <Section title="6. Conectare senzori la pini">
            <p>Pinii alocați automat sunt afișați în tabelul din <strong>Step 4 → Review</strong>. Reguli generale:</p>
            <div className="bg-gray-800 rounded px-3 py-2 font-mono text-xs text-gray-300 flex flex-col gap-1">
              <span><span className="text-green-400">VCC</span> → 3.3V (majoritatea senzorilor) sau 5V (HC-SR04, unele relee)</span>
              <span><span className="text-green-400">GND</span> → GND (comun cu ESP32)</span>
              <span><span className="text-green-400">DHT22 DATA</span> → rezistență pull-up 10kΩ între DATA și VCC</span>
              <span><span className="text-green-400">HC-SR04 ECHO</span> → divizor tensiune (1kΩ + 2kΩ) — iese la 5V</span>
              <span><span className="text-green-400">Reed Switch</span> → între GPIO și GND (INPUT_PULLUP activ în cod)</span>
              <span><span className="text-green-400">MQ-135 / MQ-2</span> → preheat 24h pentru citiri precise</span>
            </div>
          </Section>

          <Section title="7. Verificare sistem">
            <Step n={1}>
              Pornește mai întâi <strong>nodul principal</strong> — trebuie să se conecteze la WiFi și să afișeze IP-ul în Serial Monitor
            </Step>
            <Step n={2}>
              Pornește nodurile secundare — trebuie să afișeze <Code>Trimis OK</Code> la fiecare trimitere
            </Step>
            <Step n={3}>
              Accesează <Code>http://[IP_nod_principal]/sensor</Code> din browser — trebuie să apară JSON-ul cu datele tuturor nodurilor
            </Step>
            <Step n={4}>
              Leaf node-urile se verifică acționând reed switch-ul/PIR-ul — nodul principal trebuie să primească și să afișeze noile date
            </Step>
          </Section>

        </div>
      </div>
    </div>
  )
}
