interface Props
{
    onClick?: () => void
    disabled?: boolean
    variant?: 'primary' | 'secondary' | 'ghost'
    type?: 'button' | 'submit'
    children: React.ReactNode
    className?: string
}

export function Button({ onClick, disabled, variant = 'primary', type = 'button', children, className = '' }: Props)
{
    const base = 'px-4 py-2 rounded font-mono text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
    const variants =
    {
        primary: 'bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold',
        secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-100',
        ghost: 'bg-transparent hover:bg-gray-800 text-gray-400 hover:text-gray-100',
    }
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
            {children}
        </button>
    )
}