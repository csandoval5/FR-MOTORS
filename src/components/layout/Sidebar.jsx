import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  ClipboardList,
  DollarSign,
  Wrench,
  Wallet,
  BarChart3,
  Settings,
  Bike,
  X,
  Truck,
  UserRound,
  ChevronDown
} from 'lucide-react'
import { useState } from 'react'

/**
 * Menú de navegación lateral del sistema FR MOTORS
 * Filtra opciones según el rol del usuario autenticado
 */
export default function Sidebar({ isOpen, onClose }) {
  const { user, roleName } = useAuth()
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState({})

  const menuItems = [
    {
      section: 'Principal',
      items: [
        {
          label: 'Dashboard',
          icon: LayoutDashboard,
          path: '/dashboard',
          roles: ['Administrador', 'Vendedor', 'Mecánico']
        }
      ]
    },
    {
      section: 'Gestión',
      items: [
        {
          label: 'Punto de Venta',
          icon: ShoppingCart,
          path: '/pos',
          roles: ['Administrador', 'Vendedor']
        },
{
          label: 'Inventario',
          icon: Package,
          path: '/productos',
          roles: ['Administrador', 'Vendedor']
        },
        {
          label: 'Clientes',
          icon: UserRound,
          path: '/clientes',
          roles: ['Administrador', 'Vendedor']
        },
        {
          label: 'Proveedores',
          icon: Truck,
          path: '/proveedores',
          roles: ['Administrador']
        },
        {
          label: 'Compras',
          icon: ClipboardList,
          path: '/compras',
          roles: ['Administrador']
        },
        {
          label: 'Cuentas por Pagar',
          icon: DollarSign,
          path: '/cuentas-pagar',
          roles: ['Administrador']
        }
      ]
    },
    {
      section: 'Taller',
      items: [
        {
          label: 'Órdenes de Taller',
          icon: Wrench,
          path: '/ordenes-taller',
          roles: ['Administrador', 'Mecánico']
        }
      ]
    },
    {
      section: 'Financiero',
      items: [
        {
          label: 'Caja',
          icon: Wallet,
          path: '/caja',
          roles: ['Administrador']
        },
        {
          label: 'Analytics',
          icon: BarChart3,
          path: '/analytics',
          roles: ['Administrador']
        }
      ]
    },
    {
      section: 'Configuración',
      items: [
        {
          label: 'Usuarios',
          icon: Users,
          path: '/usuarios',
          roles: ['Administrador']
        },
        {
          label: 'Configuración',
          icon: Settings,
          path: '/configuracion',
          roles: ['Administrador']
        }
      ]
    }
  ]

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  const filteredSections = menuItems
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.roles.includes(roleName))
    }))
    .filter(section => section.items.length > 0)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-64 bg-white border-r border-gray-200 
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bike className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 truncate">FR MOTORS</h1>
            <p className="text-[10px] text-gray-500 truncate leading-tight">Sistema de Gestión</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary-700">
                {user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.nombres} {user?.apellidos}
              </p>
              <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary-50 text-primary-700">
                {roleName}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {filteredSections.map((section) => (
            <div key={section.section} className="mb-4">
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {section.section}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.path)
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={onClose}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                          transition-all duration-200
                          ${active 
                            ? 'bg-primary-50 text-primary-700 shadow-sm' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }
                        `}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary-600' : 'text-gray-400'}`} />
                        <span>{item.label}</span>
                        {active && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600" />
                        )}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Version footer */}
        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 text-center">
            v1.0.0 — © {new Date().getFullYear()} FR MOTORS
          </p>
        </div>
      </aside>
    </>
  )
}

