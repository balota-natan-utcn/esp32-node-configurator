import { useConfigStore } from '../../store/configStore'
import { SENSORS } from '../../data/sensors'
import { BOARDS } from '../../data/boards'
import { SensorId, WakeMode, NodeType } from '../../types'
import { allocatePins } from '../../utils/pinAllocator'
import { Input } from '../ui/Input'

export function Step2Sensors() {
  const { config, addSensor, removeSensor, updateSensor, setLeafField } = useConfigStore()

  const compatible = SENSORS.filter((s) => s.compatibleNodes.includes(config.nodeType))
  const boardDef   = BOARDS.find((b) => b.id === config.board)!
  const withPins   = allocatePins(config.board, config.sensors)

  const countOf = (id: SensorId) => config.sensors.filter((s) => s.sensorId === id).length

  const usedAdcCount = withPins.filter((s) =>
    [SensorId.MQ135, SensorId.MQ2, SensorId.LDR].includes(s.sensorId)
  ).length
  const adcOverflow = usedAdcCount > boardDef.maxAdcChannels

  function handleAdd(sensorId: SensorId, defaultJsonKey: string) {
    const existing = countOf(sensorId)
    addSensor({
      id:       crypto.randomUUID(),
      sensorId,
      jsonKey:  existing === 0 ? defaultJsonKey : `${defaultJsonKey}_${existing + 1}`,
    })
  }

  function pinLabel(idx: number): string {
    const s = withPins[idx]
    if (!s) return '—'
    if (s.pinTrig !== undefined && s.pinEcho !== undefined)
      return `TRIG=GPIO${s.pinTrig} ECHO=GPIO${s.pinEcho}`
    if (s.sensorId === SensorId.BME280)
      return `SDA=GPIO${boardDef.i2cSda} SCL=GPIO${boardDef.i2cScl}`
    if (s.pin !== undefined) return `GPIO${s.pin}`
    return '—'
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-mono font-semibold text-gray-100">Senzori și actuatori</h2>
        <p className="text-sm text-gray-400 mt-1">
          Pinii sunt alocați automat. Editează <span className="font-mono text-cyan-500">json_key</span> dacă vrei alt nume în JSON.
        </p>
      </div>

      {adcOverflow && (
        <div className="bg-red-900/40 border border-red-500 rounded-lg px-4 py-3 text-sm text-red-300 font-mono">
          ⚠ Prea mulți senzori analogici — placa suportă maxim {boardDef.maxAdcChannels} canale ADC1.
        </div>
      )}

      {/* Catalog senzori disponibili */}
      <div className="flex flex-col gap-2">
        <div className="text-xs text-gray-500 uppercase tracking-wider">Senzori disponibili</div>
        {compatible.map((def) => {
          const count  = countOf(def.id)
          const canAdd = count < def.maxCount
          return (
            <div key={def.id} className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3">
              <div>
                <span className="font-mono text-sm text-gray-200">{def.label}</span>
                <span className="ml-2 text-xs text-gray-500">{def.interface}</span>
                {count > 0 && (
                  <span className="ml-2 text-xs bg-cyan-500/20 text-cyan-400 font-mono px-1.5 py-0.5 rounded">
                    {count}/{def.maxCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleAdd(def.id, def.defaultJsonKey)}
                disabled={!canAdd}
                className="text-xs font-mono px-3 py-1 rounded border transition-colors
                  border-cyan-600 text-cyan-400 hover:bg-cyan-500/20
                  disabled:opacity-30 disabled:cursor-not-allowed"
              >
                + Adaugă
              </button>
            </div>
          )
        })}
      </div>

      {/* Lista senzorilor adăugați */}
      {config.sensors.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Senzori configurați</div>
          {config.sensors.map((s, idx) => {
            const def = SENSORS.find((d) => d.id === s.sensorId)!
            return (
              <div key={s.id} className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-cyan-400">{def.label}</span>
                  <button
                    onClick={() => removeSensor(s.id)}
                    className="text-xs text-red-400 hover:text-red-300 font-mono transition-colors"
                  >
                    Șterge
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="json_key"
                    value={s.jsonKey}
                    onChange={(v) => updateSensor(s.id, { jsonKey: v })}
                    monospace
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Pin alocat</span>
                    <div className="bg-gray-700/50 border border-gray-600 rounded px-3 py-2 font-mono text-sm text-green-400">
                      {pinLabel(idx)}
                    </div>
                  </div>
                </div>

                {def.notes && (
                  <div className="text-xs text-yellow-600/80 font-mono">⚠ {def.notes}</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Configurare specifică Leaf Node */}
      {config.nodeType === NodeType.LEAF && config.leafConfig && (
        <div className="border-t border-gray-800 pt-4 flex flex-col gap-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Configurare Leaf Node</div>

          <div className="flex gap-3">
            {[WakeMode.EVENT_DRIVEN, WakeMode.TIMER].map((mode) => (
              <button
                key={mode}
                onClick={() => setLeafField('wakeMode', mode)}
                className={`flex-1 py-3 rounded-lg border-2 font-mono text-sm transition-all
                  ${config.leafConfig!.wakeMode === mode
                    ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                    : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-500'}`}
              >
                {mode === WakeMode.EVENT_DRIVEN ? '⚡ Event-driven' : '⏱ Timer'}
              </button>
            ))}
          </div>

          {config.leafConfig.wakeMode === WakeMode.TIMER && (
            <Input
              label="Interval deep sleep (secunde)"
              value={String(config.leafConfig.timerSleepSec)}
              onChange={(v) => setLeafField('timerSleepSec', Number(v))}
              placeholder="300"
              hint="Default: 300s (5 minute)"
              monospace
            />
          )}

          {config.leafConfig.wakeMode === WakeMode.EVENT_DRIVEN && (
            <div className="text-xs text-gray-400 font-mono bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3">
              Nodul doarme până la schimbarea stării reed switch / PIR.
              La fiecare schimbare trimite imediat un pachet ESP-NOW și revine la deep sleep.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
