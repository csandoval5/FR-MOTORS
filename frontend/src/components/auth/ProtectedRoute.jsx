import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../ui/Spinner'

/**
 * Componente de Ruta Protegida
 * 
 * Redirige al login si el usuario no está autenticado.
 * Opcionalmente valida roles de acceso.
 *
 * Props:
 * - children: Componente hijo a renderizar si está autenticado
 * - allowedRoles: Array de nombres de roles permitidos (opcional)
 * - redirectTo: Ruta de redirección si no está autenticado (default: '/login')
 */
export function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/login' 
}) {
  const { isAuthenticated, loading, roleName } = useAuth()

  // Mostrar spinner mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500 font-medium">
            Verificando acceso...
          </p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  // Si se especificaron roles permitidos, validar que el usuario tenga uno de ellos
  if (allowedRoles.length > 0 && !allowedRoles.includes(roleName)) {
    // Redirigir al dashboard con mensaje de error
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-danger-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-6">
            No tienes permisos suficientes para acceder a esta sección.
            Tu rol actual es <strong>{roleName}</strong>.
          </p>
          <p className="text-sm text-gray-400">
            Contacta al administrador si necesitas acceso.
          </p>
        </div>
      </div>
    )
  }

  // Usuario autenticado y con rol válido
  return children
}

/**
 * HOC para proteger rutas específicas de administrador
 */
export function AdminRoute({ children }) {
  return (
    <ProtectedRoute allowedRoles={['Administrador']}>
      {children}
    </ProtectedRoute>
  )
}

/**
 * HOC para proteger rutas de vendedor y admin
 */
export function VendedorRoute({ children }) {
  return (
    <ProtectedRoute allowedRoles={['Administrador', 'Vendedor']}>
      {children}
    </ProtectedRoute>
  )
}

/**
 * HOC para proteger rutas de mecánico y admin
 */
export function MecanicoRoute({ children }) {
  return (
    <ProtectedRoute allowedRoles={['Administrador', 'Mecánico']}>
      {children}
    </ProtectedRoute>
  )
}

