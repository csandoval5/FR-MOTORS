/**
 * Componente Card reutilizable con header, body y footer
 *
 * Props:
 * - title: string - Título en el header
 * - subtitle: string - Subtítulo
 * - icon: Lucide icon component - Icono en el header
 * - action: ReactNode - Acciones en el header (botones, etc.)
 * - children: Contenido del body
 * - footer: ReactNode - Contenido del footer
 * - hover: boolean - Efecto hover
 * - className: string - Clases adicionales
 */
export default function Card({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  footer,
  hover = false,
  className = '',
  ...props
}) {
  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border border-gray-100
        ${hover ? 'hover:shadow-md transition-all duration-200 hover:-translate-y-0.5' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Header */}
      {(title || Icon || action) && (
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {Icon && (
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-sm text-gray-500 truncate">{subtitle}</p>
                )}
              </div>
            </div>
            {action && (
              <div className="flex-shrink-0">{action}</div>
            )}
          </div>
        </div>
      )}

      {/* Body */}
      {children && (
        <div className="px-6 py-4">
          {children}
        </div>
      )}

      {/* Footer */}
      {footer && (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  )
}

