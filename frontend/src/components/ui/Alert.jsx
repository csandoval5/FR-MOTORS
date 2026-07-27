import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useState } from 'react'

/**
 * Componente de alerta/notificación
 *
 * Props:
 * - type: 'success' | 'error' | 'warning' | 'info'
 * - title: string - Título de la alerta
 * - message: string - Mensaje descriptivo
 * - dismissible: boolean - Mostrar botón de cerrar
 * - onDismiss: function - Callback al cerrar
 * - className: string
 */
export default function Alert({
  type = 'info',
  title,
  message,
  dismissible = false,
  onDismiss,
  className = '',
  children
}) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const config = {
    success: {
      bg: 'bg-secondary-50 border-secondary-200',
      icon: CheckCircle,
      iconColor: 'text-secondary-600',
      titleColor: 'text-secondary-800',
      messageColor: 'text-secondary-700'
    },
    error: {
      bg: 'bg-danger-50 border-danger-200',
      icon: AlertCircle,
      iconColor: 'text-danger-600',
      titleColor: 'text-danger-800',
      messageColor: 'text-danger-700'
    },
    warning: {
      bg: 'bg-warning-50 border-warning-200',
      icon: AlertTriangle,
      iconColor: 'text-warning-600',
      titleColor: 'text-warning-800',
      messageColor: 'text-warning-700'
    },
    info: {
      bg: 'bg-primary-50 border-primary-200',
      icon: Info,
      iconColor: 'text-primary-600',
      titleColor: 'text-primary-800',
      messageColor: 'text-primary-700'
    }
  }

  const { bg, icon: Icon, iconColor, titleColor, messageColor } = config[type] || config.info

  const handleDismiss = () => {
    setIsVisible(false)
    if (onDismiss) onDismiss()
  }

  return (
    <div className={`rounded-xl border p-4 ${bg} ${className}`} role="alert">
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`text-sm font-semibold ${titleColor}`}>
              {title}
            </h3>
          )}
          {message && (
            <p className={`mt-1 text-sm ${messageColor}`}>
              {message}
            </p>
          )}
          {children}
        </div>

        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors ${iconColor}`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

