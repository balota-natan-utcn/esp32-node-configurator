import { useConfigStore } from '../../store/configStore'
import { NODE_TYPES } from '../../data/nodeTypes'
import { NodeType } from '../../types'

const COLOR: Record<string, string> =
{
    cyan:   'border-cyan-500 bg-cyan-500/10 text-cyan-400',
    green:  'border-green-500 bg-green-500/10 text-green-400',
    yellow: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
    purple: 'border-purple-500 bg-purple-500/10 text-purple-400',
}

const COLOR_IDLE: Record<string, string> =
{
    cyan:   'border-gray-700 hover:border-cyan-600',
    green:  'border-gray-700 hover:border-green-600',
    yellow: 'border-gray-700 hover:border-yellow-600',
    purple: 'border-gray-700 hover:border-purple-600',
}

export function Step0NodeType() {
    const { config, setNodeType } = useConfigStore()

    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-mono font-semibold 
  text-gray-100">Alege tipul nodului</h2>
        <p className="text-sm text-gray-400">Fiecare tip generează
  cod diferit. Poți rula wizard-ul de mai multe ori pentru noduri
  diferite.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 
  mt-2">
          {NODE_TYPES.map((nt) => {
            const selected = config.nodeType === nt.id
            return (
              <button
                key={nt.id}
                onClick={() => setNodeType(nt.id as NodeType)}
                className={`text-left p-4 rounded-lg border-2 transition-all cursor-pointer${selected ? COLOR[nt.color] : `bg-gray-800/50 ${COLOR_IDLE[nt.color]} text-gray-300`}`}>
                <div className="font-mono font-bold text-sm mb-1">{nt.label}</div>
                <div className="text-xs leading-relaxed opacity-80">{nt.description}</div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }