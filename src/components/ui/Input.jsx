import { AlertCircle } from 'lucide-react'

/**
 * Input reutilizable con label, error e icono
 *
 * Props:
 * - label: string - Texto del label
 * - error: string - Mensaje de error
 * - icon: Lucide icon component (izquierda)
 * - rightIcon: Lucide icon component (derecha)
 * - onRightIconClick: function
 * - helperText: string - Texto de ayuda
 */
export default function Input({
  label,
  error,
  icon: Icon,
  rightIcon: RightIcon,
  onRightIconClick,
  helperText,
  className = '',
  id,
  ...props
}) {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`

  const baseClasses = 'w-full px-4 py-2.5 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500'
  
  const stateClasses = error
    ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
    : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'

  const iconPadding = Icon ? 'pl-11' : ''
  const rightIconPadding = RightIcon ? 'pr-11' : ''

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Icon className={`w-5 h-5 ${error ? 'text-danger-500' : 'text-gray-400'}`} />
          </div>
        )}

        <input
          id={inputId}
          className={`${baseClasses} ${stateClasses} ${iconPadding} ${rightIconPadding} ${className}`}
          {...props}
        />

        {RightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            <RightIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1 text-sm text-danger-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {helperText && !error && (
        <p className="text-xs text-gray-400">{helperText}</p>
      )}
    </div>
  )
}

