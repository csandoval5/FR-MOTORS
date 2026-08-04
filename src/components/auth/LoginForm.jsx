import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../ui/Spinner'
import { 
  LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, 
  Bike, Wrench, LayoutDashboard, Users 
} from 'lucide-react'

/**
 * Formulario de Inicio de Sesión
 * 
 * Características:
 * - Validación de campos en tiempo real
 * - Mostrar/ocultar contraseña
 * - Manejo de errores con mensajes descriptivos en español
 * - Animaciones de transición
 * - Diseño responsivo (mobile-first)
 * - Roles de prueba visibles para facilitar el acceso
 */
export function LoginForm() {
  const navigate = useNavigate()
  const { login, isAuthenticated, loading, error, clearError } = useAuth()

  // Estados del formulario
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberSession, setRememberSession] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginError, setLoginError] = useState(null)

  // Si ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Limpiar errores al cambiar los campos
  useEffect(() => {
    if (error) clearError()
    if (loginError) setLoginError(null)
  }, [email, password])

  /**
   * Validar formato de email
   */
  const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  /**
   * Validar campos del formulario
   */
  const validateForm = () => {
    const errors = {}

    if (!email.trim()) {
      errors.email = 'El correo electrónico es requerido'
    } else if (!isValidEmail(email)) {
      errors.email = 'Ingresa un correo electrónico válido'
    }

    if (!password) {
      errors.password = 'La contraseña es requerida'
    } else if (password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    setLoginError(null)

    try {
      const sessionData = await login(email.trim(), password)
      
      // Redirigir según el rol
      const roleName = sessionData?.role?.nombre
      if (roleName === 'Administrador') {
        navigate('/dashboard', { replace: true })
      } else if (roleName === 'Vendedor') {
        navigate('/pos', { replace: true })
      } else if (roleName === 'Mecánico') {
        navigate('/ordenes-taller', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setLoginError(err.message || 'Error al iniciar sesión. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Auto-completar con cuentas de prueba (solo en desarrollo)
   */
  const fillTestCredentials = (email, password) => {
    setEmail(email)
    setPassword(password)
    setFormErrors({})
    setLoginError(null)
  }

  // Cuentas de prueba para desarrollo
  const testAccounts = [
    { label: 'Administrador', email: 'admin@frmotors.com', password: 'Admin123!', icon: LayoutDashboard, color: 'bg-primary-100 text-primary-700 border-primary-200' },
    { label: 'Vendedor', email: 'empleado@frmotors.com', password: 'Empleado123!', icon: Users, color: 'bg-secondary-100 text-secondary-700 border-secondary-200' },
    { label: 'Mecánico', email: 'mecanico@frmotors.com', password: 'Mecanico123!', icon: Wrench, color: 'bg-warning-100 text-warning-700 border-warning-200' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-primary-50 to-secondary-50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md animate-fadeIn">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-2xl shadow-lg mb-4">
            <Bike className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            FR MOTORS
          </h1>
          <p className="mt-2 text-gray-600 font-medium">
            Sistema de Gestión Integral
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Taller y Almacén de Repuestos
          </p>
        </div>

        {/* Card del formulario */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Error de login */}
          {loginError && (
            <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-danger-800">
                  Error al iniciar sesión
                </p>
                <p className="text-sm text-danger-600 mt-1">
                  {loginError}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className={`w-5 h-5 ${formErrors.email ? 'text-danger-500' : 'text-gray-400'}`} />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@frmotors.com"
                  className={`input-field pl-11 ${
                    formErrors.email 
                      ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' 
                      : ''
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {formErrors.email && (
                <p className="mt-1.5 text-sm text-danger-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className={`w-5 h-5 ${formErrors.password ? 'text-danger-500' : 'text-gray-400'}`} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`input-field pl-11 pr-11 ${
                    formErrors.password 
                      ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' 
                      : ''
                  }`}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1.5 text-sm text-danger-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Recordar sesión */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-600">
                Recordar sesión
              </label>
            </div>

            {/* Botón de inicio de sesión */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Cuentas de prueba (solo desarrollo) */}
        <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-warning-500 rounded-full animate-pulse" />
            <p className="text-sm font-medium text-gray-500">
              Cuentas de prueba — Entorno de desarrollo
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {testAccounts.map((account) => {
              const Icon = account.icon
              return (
                <button
                  key={account.label}
                  onClick={() => fillTestCredentials(account.email, account.password)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${account.color}`}
                  disabled={isSubmitting}
                  title={`Click para autocompletar con cuenta de ${account.label}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-semibold">{account.label}</p>
                    <p className="text-[10px] opacity-75 truncate max-w-[100px]">{account.email}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} FR MOTORS — El Coca, Ecuador
        </p>
      </div>
    </div>
  )
}

