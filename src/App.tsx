import { useRef, useState } from 'react'
import { useConfigStore } from './store/configStore'
import { Step0NodeType } from './components/steps/Step0NodeType'
import { Step1Board } from './components/steps/Step1Board'
import { Step2Sensors } from './components/steps/Step2Sensors'
import { Step3Network } from './components/steps/Step3Network'
import { Step4Review } from './components/steps/Step4Review'
import { Button } from './components/ui/Button'
import { GhidModal } from './components/ui/GhidModal'
import type { NodeConfig } from './types'

const STEPS =
[
  { label: 'Node Type' },
  { label: 'Board' },
  { label: 'Sensors' },
  { label: 'Network' },
  { label: 'Review' },
]

function ProgressBar({ current }: { current: number })
{
  return (
      <div className="flex items-center gap-0 w-full">
        {STEPS.map((s, i) => {
          const done    = i < current
          const active  = i === current
          const isLast  = i === STEPS.length - 1
          return (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold border-2 transition-colors ${done   ? 'bg-cyan-500 border-cyan-500 text-gray-950' : ''} ${active ? 'bg-gray-900 border-cyan-400 text-cyan-400' : ''} ${!done && !active ? 'bg-gray-900 border-gray-600 text-gray-500' : ''}`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-mono whitespace-nowrap ${active ? 'text-cyan-400' : 'text-gray-500'}`}>
                  {s.label}
                </span>
              </div>
              {!isLast && (
                <div className={`flex-1 h-0.5 mb-4 mx-1 ${done ? 'bg-cyan-500' : 'bg-gray-700'}`} />
              )}
            </div>
          )
        })}
      </div>
    )
}

const STEP_COMPONENTS =
[
  <Step0NodeType />,
  <Step1Board />,
  <Step2Sensors />,
  <Step3Network />,
  <Step4Review />,
]

  export default function App() {
    const { step, nextStep, prevStep, loadConfig } = useConfigStore()
    const importRef = useRef<HTMLInputElement>(null)
    const [ghidOpen, setGhidOpen] = useState(false)

    function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const config = JSON.parse(ev.target?.result as string) as NodeConfig
          loadConfig(config)
        } catch {
          alert('Fișier JSON invalid sau corupt.')
        }
      }
      reader.readAsText(file)
      e.target.value = ''
    }

    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center py-10 px-4">
        <div className="w-full max-w-3xl flex flex-col gap-8">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-mono font-bold text-cyan-400 tracking-tight">
                ESP32 Node Configurator
              </h1>
              <p className="text-xs text-gray-500 font-mono mt-1">
                Generează cod Arduino gata de compilat pentru rețeaua ta de senzori
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setGhidOpen(true)} className="text-xs">
                Ghid
              </Button>
              <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              <Button variant="ghost" onClick={() => importRef.current?.click()} className="text-xs">
                Încarcă config
              </Button>
            </div>
          </div>

          {/* Progress */}
          <ProgressBar current={step} />

          {/* Step content */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 min-h-64">
            {STEP_COMPONENTS[step]}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="secondary" onClick={prevStep} disabled={step === 0}>
              ← Back
            </Button>
            {step < STEPS.length - 1 && (
              <Button onClick={nextStep}>
                Continue →
              </Button>
            )}
          </div>

        </div>

        <GhidModal open={ghidOpen} onClose={() => setGhidOpen(false)} />
      </div>
    )
  }