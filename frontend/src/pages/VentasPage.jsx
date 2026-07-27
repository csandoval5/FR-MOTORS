import { useState, useEffect, useCallback } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, Search, CreditCard, Printer, X } from 'lucide-react'
import { useVentas } from '../hooks/useVentas'
import { useProductos } from '../hooks/useProductos'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Table from '../components/ui/Table'
import Badge from '../components/ui/Badge'
import SearchBar from '../components/ui/SearchBar'
import Pagination from '../components/ui/Pagination'
import { formatCurrency } from '../utils/formatCurrency'
import { calcularIVA, calcularCambio, generarSecuencial } from '../utils/helpers'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

/**
 * Página de Punto de Venta (POS)
 */
export default function VentasPage() {
  const { ventas, total, loading, setPage, totalPages, metodosPago, registrarVenta } = useVentas()
  const { searchProductos } = useProductos()
  const { user } = useAuth()

  // POS State
  const [activeTab, setActiveTab] = useState('pos') // pos | historial
  const [carrito, setCarrito] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [cliente, setCliente] = useState({ nombre: '', identificacion: '' })
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [montoPagado, setMontoPagado] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const searchDebounced = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const results = await searchProductos(query)
      setSearchResults(results)
    } catch (err) {
      console.error('Error searching:', err)
    } finally {
      setSearching(false)
    }
  }, [searchProductos])

  useEffect(() => {
    const timer = setTimeout(() => {
      searchDebounced(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchDebounced])

  const addToCart = (producto) => {
    setCarrito(prev => {
      const existing = prev.find(item => item.id_producto === producto.id_producto)
      if (existing) {
        return prev.map(item =>
          item.id_producto === producto.id_producto
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      }
      return [...prev, {
        id_producto: producto.id_producto,
        nombre_producto: producto.nombre_producto,
        sku: producto.sku,
        precio_unitario: Number(producto.precio_venta),
        cantidad: 1,
        subtotal: Number(producto.precio_venta),
        iva: Number(producto.precio_venta) * 0.15,
        total_linea: Number(producto.precio_venta) * 1.15
      }]
    })
    setSearchQuery('')
    setSearchResults([])
  }

  const updateCantidad = (id, delta) => {
    setCarrito(prev => prev.map(item => {
      if (item.id_producto !== id) return item
      const newCantidad = Math.max(1, item.cantidad + delta)
      return {
        ...item,
        cantidad: newCantidad,
        subtotal: item.precio_unitario * newCantidad,
        iva: (item.precio_unitario * newCantidad) * 0.15,
        total_linea: (item.precio_unitario * newCantidad) * 1.15
      }
    }))
  }

  const removeFromCart = (id) => {
    setCarrito(prev => prev.filter(item => item.id_producto !== id))
  }

  const subtotal = carrito.reduce((sum, item) => sum + item.subtotal, 0)
  const ivaTotal = carrito.reduce((sum, item) => sum + item.iva, 0)
  const totalVenta = carrito.reduce((sum, item) => sum + item.total_linea, 0)

  const handlePagar = async () => {
    if (carrito.length === 0) {
      toast.error('Agrega productos al carrito')
      return
    }

    setSubmitting(true)
    try {
      await registrarVenta({
        venta: {
          id_usuario: user?.id_usuario,
          id_cliente_nombre: cliente.nombre || 'CONSUMIDOR FINAL',
          id_cliente_identificacion: cliente.identificacion || '9999999999999',
          numero_factura: generarSecuencial('FAC', Date.now()),
          id_metodo_pago: metodosPago.find(m => m.nombre_metodo === metodoPago)?.id_metodo_pago || 1,
          subtotal,
          iva_total: ivaTotal,
          total: totalVenta,
          estado: 'COMPLETADA'
        },
        detalle: carrito.map(item => ({
          id_producto: item.id_producto,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal,
          iva: item.iva,
          total_linea: item.total_linea
        }))
      })

      toast.success('Venta registrada exitosamente')
      setCarrito([])
      setCliente({ nombre: '', identificacion: '' })
      setMontoPagado('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const columnsHistorial = [
    { key: 'numero_factura', label: 'Factura' },
    { key: 'id_cliente_nombre', label: 'Cliente' },
    { key: 'fecha_venta', label: 'Fecha', render: (val) => new Date(val).toLocaleDateString('es-EC') },
    { key: 'total', label: 'Total', render: (val) => formatCurrency(val), align: 'right' },
    { key: 'estado', label: 'Estado', render: (val) => (
      <Badge variant={val === 'COMPLETADA' ? 'success' : 'danger'}>{val === 'COMPLETADA' ? 'Completada' : 'Anulada'}</Badge>
    )}
  ]

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('pos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pos' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <ShoppingCart className="w-4 h-4 inline mr-2" />Punto de Venta
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'historial' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Historial de Ventas
        </button>
      </div>

      {activeTab === 'pos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Búsqueda y productos */}
          <div className="lg:col-span-2 space-y-4">
            <Card title="Buscar Productos" icon={Search}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o SKU..."
                  className="input-field"
                  autoFocus
                />
                {searching && <p className="text-sm text-gray-400 mt-2">Buscando...</p>}
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                    {searchResults.map((p) => (
                      <button
                        key={p.id_producto}
                        onClick={() => addToCart(p)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.nombre_producto}</p>
                          <p className="text-xs text-gray-500">SKU: {p.sku} | Stock: {p.stock_actual}</p>
                        </div>
                        <p className="text-sm font-bold text-primary-600">{formatCurrency(p.precio_venta)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Carrito */}
            <Card title="Carrito de Compras" icon={ShoppingCart}>
              {carrito.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Busca productos para agregar al carrito</p>
              ) : (
                <div className="space-y-3">
                  {carrito.map((item) => (
                    <div key={item.id_producto} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.nombre_producto}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(item.precio_unitario)} c/u</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateCantidad(item.id_producto, -1)} className="p-1 rounded hover:bg-gray-200 transition-colors"><Minus className="w-4 h-4" /></button>
                          <span className="w-8 text-center text-sm font-medium">{item.cantidad}</span>
                          <button onClick={() => updateCantidad(item.id_producto, 1)} className="p-1 rounded hover:bg-gray-200 transition-colors"><Plus className="w-4 h-4" /></button>
                        </div>
                        <p className="text-sm font-bold text-gray-900 w-20 text-right">{formatCurrency(item.total_linea)}</p>
                        <button onClick={() => removeFromCart(item.id_producto)} className="p-1 rounded hover:bg-danger-50 text-danger-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Resumen y pago */}
          <div className="space-y-4">
            <Card title="Datos del Cliente" icon={CreditCard}>
              <div className="space-y-3">
                <Input
                  placeholder="Nombre del cliente"
                  value={cliente.nombre}
                  onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                />
                <Input
                  placeholder="Identificación"
                  value={cliente.identificacion}
                  onChange={(e) => setCliente({ ...cliente, identificacion: e.target.value })}
                />
              </div>
            </Card>

            <Card title="Resumen de Venta">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">IVA (15%)</span>
                  <span className="font-medium">{formatCurrency(ivaTotal)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-primary-600">{formatCurrency(totalVenta)}</span>
                </div>

                <Select
                  label="Método de Pago"
                  options={metodosPago.map(m => ({ value: m.nombre_metodo, label: m.nombre_metodo }))}
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                />

                {metodoPago === 'EFECTIVO' && (
                  <Input
                    label="Monto recibido"
                    type="number"
                    value={montoPagado}
                    onChange={(e) => setMontoPagado(e.target.value)}
                    placeholder="0.00"
                  />
                )}

                {montoPagado && Number(montoPagado) >= totalVenta && (
                  <div className="p-3 bg-secondary-50 rounded-xl text-center">
                    <p className="text-sm text-gray-500">Cambio</p>
                    <p className="text-2xl font-bold text-secondary-600">
                      {formatCurrency(Number(montoPagado) - totalVenta)}
                    </p>
                  </div>
                )}

                <Button
                  fullWidth
                  icon={CreditCard}
                  onClick={handlePagar}
                  loading={submitting}
                  disabled={carrito.length === 0}
                  size="lg"
                >
                  Cobrar {formatCurrency(totalVenta)}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* Historial */
        <Card>
          <Table
            columns={columnsHistorial}
            data={ventas}
            loading={loading}
            emptyMessage="No hay ventas registradas"
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            onPageChange={setPage}
          />
        </Card>
      )}
    </div>
  )
}

