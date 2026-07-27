import { useAuth } from '../../context/AuthContext'
import { useLocation } from 'react-router-dom'
import {
  Menu,
  LogOut,
  Bell,
  User,
  ChevronDown,
  Settings,
  HelpCircle
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

/**
 * Barra superior del sistema FR MOTORS
 * Muestra el título de la página actual, notificaciones y perfil del usuario
 */
export default function Navbar({ onMenuToggle }) {
  const { user, roleName, logout } = useAuth()
  const location = useLocation()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileRef = useRef(null)

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Obtener título de la página actual
  const getPageTitle = () => {
    const path = location.pathname
    const titles = {
      '/dashboard': 'Dashboard',
      '/pos': 'Punto de Venta',
      '/productos': 'Inventario',
      '/proveedores': 'Proveedores',
      '/compras': 'Compras',
      '/cuentas-pagar': 'Cuentas por Pagar',
      '/ordenes-taller': 'Órdenes de Taller',
      '/caja': 'Arqueo de Caja',
      '/analytics': 'Dashboard Analítico',
      '/usuarios': 'Usuarios',
      '/configuracion': 'Configuración'
    }
    return titles[path] || 'FR MOTORS'
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {getPageTitle()}
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              {new Date().toLocaleDateString('es-EC', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 sm:gap-3 p-1.5 sm:pr-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary-700">
                  {user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {user?.nombres} {user?.apellidos}
                </p>
                <p className="text-[11px] text-gray-500 leading-tight">
                  {roleName}
                </p>
              </div>
              <ChevronDown className="hidden sm:block w-4 h-4 text-gray-400" />
            </button>

            {/* Dropdown menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-fadeIn">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.nombres} {user?.apellidos}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary-50 text-primary-700">
                    {roleName}
                  </span>
                </div>

                <div className="py-1">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>Mi Perfil</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span>Configuración</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                    <span>Ayuda</span>
                  </button>
                </div>

                <div className="border-t border-gray-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

