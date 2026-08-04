import { Spinner } from './Spinner'

/**
 * Botón reutilizable con variantes y estados
 *
 * Props:
 * - variant: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
 * - size: 'sm' | 'md' | 'lg'
 * - loading: boolean - Muestra spinner de carga
 * - disabled: boolean
 * - icon: Lucide icon component
 * - fullWidth: boolean
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-sm',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400',
    danger: 'bg-danger-600 hover:bg-danger-700 text-white focus:ring-danger-500 shadow-sm',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-400',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500'
  }

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5'
  }

  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" />
          <span>{children || 'Cargando...'}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className={`${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />}
          {children}
        </>
      )}
    </button>
  )
}

