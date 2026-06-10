import { useState } from 'react'
import { useConfigStore } from '../../store/configStore'
import { NodeType } from '../../types'
import { Input } from '../ui/Input'

export function Step3Network() {
  const { config, setNetworkField } = useConfigStore()

  const [sendIntervalDisplay, setSendIntervalDisplay]   = useState(String(config.network.sendInterval))
  const [nodeTimeoutDisplay,  setNodeTimeoutDisplay]    = useState(String(config.network.nodeTimeout))
  const isMain      = config.nodeType === NodeType.MAIN
  const isSemiMain  = config.nodeType === NodeType.SEMI_MAIN
  const isLeaf      = config.nodeType === NodeType.LEAF
  const isSecondary = config.nodeType === NodeType.SECONDARY

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-mono font-semibold text-gray-100">Configurare rețea</h2>
        <p className="text-sm text-gray-400 mt-1">
          Adresele MAC sunt necesare pentru comunicarea ESP-NOW între noduri.
        </p>
      </div>

      {/* Info helper MAC */}
      <div className="bg-blue-900/30 border border-blue-700 rounded-lg px-4 py-3 text-xs text-blue-300 font-mono leading-relaxed">
        Nu știi adresa MAC a unui nod? Descarcă sketch-ul helper <span className="text-white">get_mac_address.ino</span> din zip-ul generat,
        încarcă-l pe placa respectivă și citește MAC-ul din Serial Monitor (115200 baud).
      </div>

      {/* MAC nod principal — pentru Secondary, Leaf, Semi-Main */}
      {(isSecondary || isLeaf || isSemiMain) && (
        <Input
          label="MAC adresă nod principal"
          value={config.network.masterMac}
          onChange={(v) => setNetworkField('masterMac', v)}
          placeholder="ex: D4:E9:F4:E8:DB:60"
          hint="Adresa MAC a nodului care primește datele (Principal sau Semi-Principal)"
          monospace
        />
      )}

      {/* WiFi — pentru Main și Secondary (nu Leaf — el nu se conectează la router) */}
      {(isMain || isSecondary || isSemiMain) && (
        <div className="flex flex-col gap-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Rețea WiFi</div>
          <Input
            label="SSID router"
            value={config.network.routerSsid}
            onChange={(v) => setNetworkField('routerSsid', v)}
            placeholder="ex: Balota"
          />
          <Input
            label="Parolă WiFi"
            value={config.network.routerPassword}
            onChange={(v) => setNetworkField('routerPassword', v)}
            placeholder="parola rețelei"
          />
        </div>
      )}

      {/* Interval trimitere — Secondary și Semi-Main */}
      {(isSecondary || isSemiMain) && (
        <Input
          label="Interval trimitere (ms)"
          value={sendIntervalDisplay}
          onChange={setSendIntervalDisplay}
          onBlur={(v) => {
            const n = parseInt(v, 10)
            if (!isNaN(n) && n > 0) setNetworkField('sendInterval', n)
            else setSendIntervalDisplay(String(config.network.sendInterval))
          }}
          placeholder="60000"
          hint="Cât de des trimite nodul date la principal. Default: 60000ms (1 minut)"
          monospace
        />
      )}

      {/* Timeout noduri remote — Main și Semi-Main */}
      {(isMain || isSemiMain) && (
        <Input
          label="Timeout nod remote (ms)"
          value={nodeTimeoutDisplay}
          onChange={setNodeTimeoutDisplay}
          onBlur={(v) => {
            const n = parseInt(v, 10)
            if (!isNaN(n) && n > 0) setNetworkField('nodeTimeout', n)
            else setNodeTimeoutDisplay(String(config.network.nodeTimeout))
          }}
          placeholder="15000"
          hint="Date mai vechi de acest interval sunt ignorate în JSON. Default: 15000ms"
          monospace
        />
      )}

      {/* Leaf — info special */}
      {isLeaf && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg px-4 py-3 text-xs text-yellow-300 font-mono leading-relaxed">
          Leaf node-ul nu se conectează la router. Scanează canalul WiFi al routerului
          doar pentru a sincroniza canalul ESP-NOW cu nodul principal, apoi intră imediat în deep sleep.
        </div>
      )}
    </div>
  )
}
