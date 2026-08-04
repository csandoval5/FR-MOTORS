import { AlertCircle, ChevronDown } from 'lucide-react'

/**
 * Select desplegable reutilizable con label, opciones y error
 *
 * Props:
 * - label: string
 * - options: Array<{ value: string, label: string }>
 * - placeholder: string
 * - error: string
 */
export default function Select({
  label,
  options = [],
  placeholder = 'Seleccionar...',
  error,
  className = '',
  id,
  ...props
}) {
  const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, '-')}`

  const baseClasses = 'w-full px-4 py-2.5 border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 transition-all duration-200 appearance-none disabled:bg-gray-50 disabled:text-gray-500'

  const stateClasses = error
    ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
    : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          className={`${baseClasses} ${stateClasses} pr-10 ${className}`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-1 text-sm text-danger-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

