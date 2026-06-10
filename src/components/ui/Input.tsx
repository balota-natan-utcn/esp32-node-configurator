interface Props {
  label:        string
  value:        string
  onChange:     (v: string) => void
  onBlur?:      (v: string) => void
  placeholder?: string
  hint?:        string
  monospace?:   boolean
}

export function Input({ label, value, onChange, onBlur, placeholder, hint, monospace }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400 uppercase tracking-wider">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur ? (e) => onBlur(e.target.value) : undefined}
        placeholder={placeholder}
        className={`bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 text-sm outline-none focus:border-cyan-500 transition-colors ${monospace ? 'font-mono' : ''}`}
      />
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </div>
  )
}