import { useAuth } from '../context/AuthContext'
import { 
  Package, Users, ShoppingCart, TrendingUp, 
  AlertTriangle, Wrench, DollarSign, Calendar,
  BarChart3, Bike 
} from 'lucide-react'

/**
 * Dashboard principal del sistema FR MOTORS
 * Muestra resúmenes y acceso rápido a los módulos según el rol
 */
export default function DashboardPage() {
  const { user, roleName } = useAuth()

  const statsCards = [
    { 
      title: 'Productos en Stock', 
      value: '1,206', 
      subtitle: 'Artículos activos', 
      icon: Package, 
      color: 'bg-primary-500',
      textColor: 'text-primary-600',
      bgLight: 'bg-primary-50'
    },
    { 
      title: 'Proveedores', 
      value: '1,763', 
      subtitle: 'Red de proveedores', 
      icon: Users, 
      color: 'bg-secondary-500',
      textColor: 'text-secondary-600',
      bgLight: 'bg-secondary-50'
    },
    { 
      title: 'Ventas del Día', 
      value: '$0', 
      subtitle: 'Sin ventas registradas', 
      icon: TrendingUp, 
      color: 'bg-warning-500',
      textColor: 'text-warning-600',
      bgLight: 'bg-warning-50'
    },
    { 
      title: 'Órdenes Activas', 
      value: '0', 
      subtitle: 'Taller en curso', 
      icon: Wrench, 
      color: 'bg-danger-500',
      textColor: 'text-danger-600',
      bgLight: 'bg-danger-50'
    }
  ]

  const quickActions = [
    {
      title: 'Punto de Venta',
      description: 'Facturación rápida en mostrador',
      icon: ShoppingCart,
      href: '/pos',
      color: 'bg-primary-500',
      roles: ['Administrador', 'Vendedor']
    },
    {
      title: 'Inventario',
      description: 'Gestión de repuestos y stock',
      icon: Package,
      href: '/productos',
      color: 'bg-secondary-500',
      roles: ['Administrador', 'Vendedor']
    },
    {
      title: 'Órdenes de Taller',
      description: 'Reparaciones y servicio',
      icon: Wrench,
      href: '/ordenes-taller',
      color: 'bg-warning-500',
      roles: ['Administrador', 'Mecánico']
    },
    {
      title: 'Dashboard Analítico',
      description: 'Gráficos y reportes',
      icon: BarChart3,
      href: '/analytics',
      color: 'bg-indigo-500',
      roles: ['Administrador']
    }
  ]

  const filteredActions = quickActions.filter(
    action => action.roles.includes(roleName)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Bienvenido, {user?.nombres}
          </h2>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('es-EC', { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="mt-1 text-xs text-gray-400">{stat.subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgLight}`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Acceso Rápido
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredActions.map((action) => {
            const Icon = action.icon
            return (
              <a
                key={action.title}
                href={action.href}
                className="group card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {action.title}
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  {action.description}
                </p>
              </a>
            )
          })}
        </div>
      </div>

      {/* Placeholder para gráficos futuros */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Dashboard Analítico
          </h3>
        </div>
        <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            Los gráficos de ingresos semanales, anuales y top productos se mostrarán aquí
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Módulo disponible en la Fase 3 del proyecto
          </p>
        </div>
      </div>
    </div>
  )
}

