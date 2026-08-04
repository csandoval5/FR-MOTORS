import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

/**
 * Barra de búsqueda con debounce
 *
 * Props:
 * - value: string (controlado)
 * - onChange: function(value)
 * - placeholder: string
 * - debounceMs: number (default: 300)
 * - onClear: function
 * - className: string
 * - autoFocus: boolean
 */
export default function SearchBar({
  value: externalValue,
  onChange,
  placeholder = 'Buscar...',
  debounceMs = 300,
  onClear,
  className = '',
  autoFocus = false
}) {
  const [localValue, setLocalValue] = useState(externalValue || '')
  const inputRef = useRef(null)
  const debounceTimer = useRef(null)

  // Sincronizar valor externo
  useEffect(() => {
    setLocalValue(externalValue || '')
  }, [externalValue])

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  const handleChange = (e) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      if (onChange) onChange(newValue)
    }, debounceMs)
  }

  const handleClear = () => {
    setLocalValue('')
    if (onChange) onChange('')
    if (onClear) onClear()
    if (inputRef.current) inputRef.current.focus()
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <Search className="w-4 h-4 text-gray-400" />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all duration-200"
      />

      {localValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

