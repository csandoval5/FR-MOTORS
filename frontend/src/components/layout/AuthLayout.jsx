import { Outlet } from 'react-router-dom'

/**
 * Layout para páginas de autenticación
 * Simple y minimalista, sin sidebar ni navbar
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50 to-secondary-50">
      <Outlet />
    </div>
  )
}

