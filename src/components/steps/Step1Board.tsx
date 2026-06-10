import { useConfigStore } from '../../store/configStore'
import { BOARDS } from '../../data/boards'
import { BoardId } from '../../types'
import { Input } from '../ui/Input'

export function Step1Board() {
  const { config, setBoard, setNodeName } = useConfigStore()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-mono font-semibold text-gray-100">Selectează placa</h2>
        <p className="text-sm text-gray-400 mt-1">
          Pinii disponibili și I2C sunt configurați automat per placă.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {BOARDS.map((b) => {
          const selected = config.board === b.id
          return (
            <button
              key={b.id}
              onClick={() => setBoard(b.id as BoardId)}
              className={`text-left p-4 rounded-lg border-2 transition-all cursor-pointer
                ${selected
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'}`}
            >
              <div className={`font-mono font-bold text-sm ${selected ? 'text-cyan-400' : 'text-gray-200'}`}>
                {b.label}
              </div>
              <div className="text-xs text-gray-500 mt-1 font-mono">
                GPIO disponibili: {b.availableGpios.length}
                &nbsp;|&nbsp;
                ADC1: {b.adcPins.length} canale
                &nbsp;|&nbsp;
                I2C: SDA={b.i2cSda} SCL={b.i2cScl}
              </div>
            </button>
          )
        })}
      </div>

      <div className="border-t border-gray-800 pt-4">
        <Input
          label="Nume nod"
          value={config.nodeName}
          onChange={setNodeName}
          placeholder="ex: Dormitor, Bucatarie, Fereastra_Living"
          hint='Apare în JSON ca "node_name". Fără spații — folosește underscore.'
          monospace
        />
      </div>
    </div>
  )
}
