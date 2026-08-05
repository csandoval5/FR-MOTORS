import { useState, useEffect, useCallback } from 'react'
import { 
  Package, Users, ShoppingCart, TrendingUp, 
  AlertTriangle, Wrench, DollarSign, Calendar,
  BarChart3, Bike, Boxes, RefreshCw, UserCheck 
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { formatCurrency } from '../utils/formatCurrency'
import {
  getResumenGeneral,
  getVentasUltimos7Dias,
  getProductosMasVendidos,
  getIngresosMensuales,
  getProductosStockBajo
} from '../api/dashboardService'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'

/**
 * Dashboard principal del sistema FR MOTORS
 * Muestra resúmenes reales de la BD, gráficos analíticos y alertas de stock
 */
export default function DashboardPage() {
  const { user, roleName } = useAuth()

  // ====== Estado de datos ======
  const [resumen, setResumen] = useState({
    productos: 0,
    proveedores: 0,
    ventasDia: 0,
    cantidadVentasDia: 0,
    ordenesActivas: 0
  })
  const [ventas7Dias, setVentas7Dias] = useState([])
  const [topProductos, setTopProductos] = useState([])
  const [ingresosMensuales, setIngresosMensuales] = useState([])
  const [productosStockBajo, setProductosStockBajo] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Colores corporativos FR MOTORS (azul)
  const COLORS = ['#2563eb', '#0ea5e9', '#6366f1', '#14b8a6', '#f59e0b']

  // ====== Cargar datos al montar ======
  const cargarDatos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [resumenData, ventas7, top, ingresos, stockBajo] = await Promise.all([
        getResumenGeneral(),
        getVentasUltimos7Dias(),
        getProductosMasVendidos(),
        getIngresosMensuales(),
        getProductosStockBajo()
      ])

      setResumen(resumenData)
      setVentas7Dias(ventas7)
      setTopProductos(top)
      setIngresosMensuales(ingresos)
      setProductosStockBajo(stockBajo)
    } catch (err) {
      console.error('❌ Error al cargar dashboard:', err)
      setError(err.message || 'Error al cargar los datos del dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  // ====== Tarjetas de resumen ======
  const statsCards = [
    { 
      title: 'Productos en Stock', 
      value: resumen.productos.toLocaleString('es-EC'), 
      subtitle: 'Artículos activos', 
      icon: Package, 
      color: 'bg-primary-500',
      textColor: 'text-primary-600',
      bgLight: 'bg-primary-50'
    },
    { 
      title: 'Proveedores', 
      value: resumen.proveedores.toLocaleString('es-EC'), 
      subtitle: 'Red de proveedores', 
      icon: Users, 
      color: 'bg-secondary-500',
      textColor: 'text-secondary-600',
      bgLight: 'bg-secondary-50'
    },
    { 
      title: 'Ventas del Día', 
      value: formatCurrency(resumen.ventasDia), 
      subtitle: `${resumen.cantidadVentasDia} venta(s) registrada(s) hoy`, 
      icon: TrendingUp, 
      color: 'bg-warning-500',
      textColor: 'text-warning-600',
      bgLight: 'bg-warning-50'
    },
    { 
      title: 'Órdenes Activas', 
      value: resumen.ordenesActivas.toLocaleString('es-EC'), 
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Bienvenido, {user?.nombres || 'Usuario'}
          </h2>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('es-EC', { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })}
          </p>
        </div>
        <button
          onClick={cargarDatos}
          disabled={loading}
          className="mt-2 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error al cargar el dashboard</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="w-10 h-10 text-primary-500 animate-spin mb-3" />
          <p className="text-sm text-gray-500">Cargando datos del dashboard...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <h3 className="text-base font-semibold text-gray-900 mb-2">
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

          {/* Dashboard Analítico */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Dashboard Analítico
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Gráfico de Barras - Ventas últimos 7 días */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-500" />
                  Ventas últimos 7 días
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ventas7Dias}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="total" name="Ventas" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico Circular - Top 5 Productos */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Bike className="w-4 h-4 text-primary-500" />
                  Top 5 Productos Más Vendidos
                </h4>
                <div className="h-64">
                  {topProductos.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topProductos}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {topProductos.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} unidades`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <Calendar className="w-10 h-10 mb-2" />
                      <p className="text-sm">Sin ventas para mostrar</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Gráfico de Línea - Ingresos Mensuales */}
              <div className="bg-white rounded-xl p-4 border border-gray-100 lg:col-span-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-500" />
                  Ingresos Mensuales ({new Date().getFullYear()})
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ingresosMensuales}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="total" name="Ingresos" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Productos con Stock Bajo */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-danger-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Productos con Stock Bajo
              </h3>
              {productosStockBajo.length > 0 && (
                <span className="ml-auto text-xs font-semibold px-2.5 py-1 bg-danger-50 text-danger-600 rounded-full">
                  {productosStockBajo.length} alerta(s)
                </span>
              )}
            </div>

            {productosStockBajo.length === 0 ? (
              <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-6 text-center">
                <Boxes className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">
                  No hay productos con stock bajo
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Todos los productos están por encima de su stock mínimo
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Producto</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Stock Actual</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Stock Mínimo</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {productosStockBajo.map((p) => (
                      <tr key={p.id_producto} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.sku}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.nombre_producto}</td>
                        <td className={`px-4 py-3 text-right text-sm font-bold ${Number(p.stock_actual) === 0 ? 'text-danger-600' : 'text-warning-600'}`}>
                          {p.stock_actual}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-500">{p.stock_minimo}</td>
                        <td className="px-4 py-3 text-center">
                          {Number(p.stock_actual) === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-danger-100 text-danger-700 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              Sin stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-warning-100 text-warning-700 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              Stock bajo
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
