/**
 * Badge para mostrar estados, roles o etiquetas
 *
 * Props:
 * - variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
 * - size: 'sm' | 'md'
 * - children: Contenido del badge
 * - dot: boolean - Muestra un punto indicador
 * - className: string
 */
export default function Badge({
  variant = 'default',
  size = 'md',
  children,
  dot = false,
  className = ''
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-secondary-100 text-secondary-700',
    warning: 'bg-warning-100 text-warning-700',
    danger: 'bg-danger-100 text-danger-700',
    info: 'bg-primary-100 text-primary-700',
    purple: 'bg-purple-100 text-purple-700'
  }

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-1'
  }

  const dotColors = {
    default: 'bg-gray-500',
    success: 'bg-secondary-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    info: 'bg-primary-500',
    purple: 'bg-purple-500'
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variants[variant] || variants.default}
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.default}`} />
      )}
      {children}
    </span>
  )
}

/**
 * Badge para estados predefinidos de órdenes de taller
 */
export function EstadoTallerBadge({ estado }) {
  const estadosMap = {
    PENDIENTE: { label: 'Pendiente', variant: 'default' },
    EN_REVISION: { label: 'En Revisión', variant: 'info' },
    EN_REPARACION: { label: 'En Reparación', variant: 'warning' },
    ESPERANDO_REPUESTOS: { label: 'Esperando Repuestos', variant: 'purple' },
    FINALIZADA: { label: 'Finalizada', variant: 'success' },
    ENTREGADA: { label: 'Entregada', variant: 'info' },
    CANCELADA: { label: 'Cancelada', variant: 'danger' }
  }

  const config = estadosMap[estado] || { label: estado, variant: 'default' }

  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  )
}

/**
 * Badge para estados de cuentas por pagar
 */
export function EstadoCuentaBadge({ estado }) {
  const estadosMap = {
    PENDIENTE: { label: 'Pendiente', variant: 'warning' },
    PARCIAL: { label: 'Pago Parcial', variant: 'info' },
    PAGADA: { label: 'Pagada', variant: 'success' },
    VENCIDA: { label: 'Vencida', variant: 'danger' }
  }

  const config = estadosMap[estado] || { label: estado, variant: 'default' }

  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  )
}

