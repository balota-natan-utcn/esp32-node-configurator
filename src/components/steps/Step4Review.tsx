import { useState } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useConfigStore } from '../../store/configStore'
import { SENSORS } from '../../data/sensors'
import { BOARDS } from '../../data/boards'
import { NODE_TYPES } from '../../data/nodeTypes'
import { NodeType } from '../../types'
import { allocatePins } from '../../utils/pinAllocator'
import { generateFiles } from '../../generators'
import { Button } from '../ui/Button'

export function Step4Review() {
  const { config } = useConfigStore()
  const [previewFile, setPreviewFile] = useState(0)

  const boardDef    = BOARDS.find((b) => b.id === config.board)!
  const nodeTypeDef = NODE_TYPES.find((n) => n.id === config.nodeType)!
  const withPins    = allocatePins(config.board, config.sensors)
  const files       = generateFiles(config)

  function pinLabel(idx: number): string {
    const s = withPins[idx]
    if (!s) return '—'
    if (s.pinTrig !== undefined && s.pinEcho !== undefined)
      return `TRIG=GPIO${s.pinTrig} / ECHO=GPIO${s.pinEcho}`
    if (s.sensorID && SENSORS.find(d => d.id === s.sensorID)?.interface === 'I2C')
      return `SDA=GPIO${boardDef.i2cSda} / SCL=GPIO${boardDef.i2cScl}`
    if (s.pin !== undefined) return `GPIO${s.pin}`
    return '—'
  }

  async function handleDownload() {
    const zip  = new JSZip()
    const slug = config.nodeName.replace(/\s+/g, '_') || 'nod'
    const root = `esp32_${slug}/`

    for (const f of files) {
      zip.file(`${root}${f.folder}/${f.name}`, f.content)
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, `esp32_${slug}.zip`)
  }

  function handleCopy() {
    navigator.clipboard.writeText(files[previewFile]?.content ?? '')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-mono font-semibold text-gray-100">Review configurație</h2>
        <p className="text-sm text-gray-400 mt-1">Verifică totul înainte de a descărca codul.</p>
      </div>

      {/* Rezumat */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-2 font-mono text-sm">
        <div className="flex gap-3">
          <span className="text-gray-500 w-32">Tip nod</span>
          <span className="text-cyan-400">{nodeTypeDef.label}</span>
        </div>
        <div className="flex gap-3">
          <span className="text-gray-500 w-32">Nume nod</span>
          <span className="text-gray-200">
            {config.nodeName || <span className="text-red-400">— lipsă —</span>}
          </span>
        </div>
        <div className="flex gap-3">
          <span className="text-gray-500 w-32">Placă</span>
          <span className="text-gray-200">{boardDef.label}</span>
        </div>
        {config.network.routerSsid && (
          <div className="flex gap-3">
            <span className="text-gray-500 w-32">WiFi SSID</span>
            <span className="text-gray-200">{config.network.routerSsid}</span>
          </div>
        )}
        {config.network.masterMac && (
          <div className="flex gap-3">
            <span className="text-gray-500 w-32">MAC principal</span>
            <span className="text-green-400">{config.network.masterMac}</span>
          </div>
        )}
        {config.nodeType === NodeType.LEAF && config.leafConfig && (
          <div className="flex gap-3">
            <span className="text-gray-500 w-32">Wake mode</span>
            <span className="text-yellow-400">{config.leafConfig.wakeMode}</span>
          </div>
        )}
      </div>

      {/* Tabel pini */}
      {config.sensors.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Ghid conectare pini</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono border-collapse">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-700">
                  <th className="pb-2 pr-4">Senzor</th>
                  <th className="pb-2 pr-4">json_key</th>
                  <th className="pb-2 pr-4">Pin(i)</th>
                  <th className="pb-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {config.sensors.map((s, idx) => {
                  const def = SENSORS.find((d) => d.id === s.sensorID)!
                  return (
                    <tr key={s.id} className="border-b border-gray-800">
                      <td className="py-2 pr-4 text-gray-200">{def.label}</td>
                      <td className="py-2 pr-4 text-cyan-400">{s.jsonKey}</td>
                      <td className="py-2 pr-4 text-green-400">{pinLabel(idx)}</td>
                      <td className="py-2 text-gray-500 text-xs">{def.notes}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview cod */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Preview cod generat</div>
          <div className="flex gap-1">
            {files.map((f, i) => (
              <button
                key={i}
                onClick={() => setPreviewFile(i)}
                className={`text-xs font-mono px-2 py-1 rounded transition-colors
                  ${previewFile === i
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-600'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500'}`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
        <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-xs font-mono text-gray-300 overflow-auto max-h-72 leading-relaxed">
          {files[previewFile]?.content}
        </pre>
      </div>

      {/* Actiuni */}
      <div className="border-t border-gray-800 pt-4 flex gap-3">
        <Button onClick={handleDownload} className="flex-1">
          Descarcă .zip
        </Button>
        <Button variant="secondary" onClick={handleCopy}>
          Copiază fișier curent
        </Button>
      </div>
    </div>
  )
}
