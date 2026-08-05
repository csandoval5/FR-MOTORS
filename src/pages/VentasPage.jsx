import { useState, useEffect, useCallback } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, Search, CreditCard, User, Package, UserPlus } from 'lucide-react'
import { useVentas } from '../hooks/useVentas'
import { useProductos } from '../hooks/useProductos'
import { useClientes } from '../hooks/useClientes'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Table from '../components/ui/Table'
import Badge from '../components/ui/Badge'
import Pagination from '../components/ui/Pagination'
import Modal from '../components/ui/Modal'
import { formatCurrency } from '../utils/formatCurrency'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

/**
 * Página de Punto de Venta (POS)
 * - Búsqueda de productos por nombre, SKU o código de barras
 * - Carrito de compras con cantidades editables
 * - Cálculo de subtotal, IVA (15%) y total
 * - Selección de cliente real (dropdown) + alta rápida desde el POS
 * - Registro de venta con detalle, actualización de stock y movimiento de caja
 */
export default function VentasPage() {
  const { ventas, total, loading, error, page, setPage, totalPages, metodosPago, registrarVenta, obtenerNumeroFactura } = useVentas()
  const { searchProductos } = useProductos()
  const { clientesActivos, crearCliente, fetchClientesActivos } = useClientes()
  const { user, session } = useAuth()

  // ====== Logging de diagnóstico del historial ======
  useEffect(() => {
    console.log('📊 Historial de ventas - datos recibidos:', ventas)
    console.log('📊 Total de ventas:', total)
    if (error) {
      console.error('❌ Error al cargar historial:', error)
      toast.error(`No se pudo cargar el historial de ventas: ${error}`)
    }
  }, [ventas, total, error])

  // POS State
  const [activeTab, setActiveTab] = useState('pos') // pos | historial
  const [carrito, setCarrito] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  // id_cliente numérico. Default = 1 (Consumidor Final)
  const [cliente, setCliente] = useState('1')
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [montoPagado, setMontoPagado] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ====== Modal de nuevo cliente rápido ======
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre_completo: '',
    tipo_identificacion: 'CEDULA',
    numero_identificacion: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: 'El Coca'
  })
  const [clienteModalLoading, setClienteModalLoading] = useState(false)

  const searchDebounced = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchResults([])
      setSearchError('')
      return
    }
    setSearching(true)
    setSearchError('')
    try {
      const results = await searchProductos(query)
      console.log('🔍 Resultados en VentasPage:', results)
      setSearchResults(results)
      if (results.length === 0) {
        setSearchError(`No se encontraron productos para "${query}"`)
      }
    } catch (err) {
      console.error('❌ Error en búsqueda POS:', err)
      setSearchResults([])
      setSearchError(err.message || 'Error al buscar productos')
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

  // ====== Agregar producto al carrito ======
  const addToCart = (producto) => {
    if (Number(producto.stock_actual) <= 0) {
      toast.error(`"${producto.nombre_producto}" no tiene stock disponible`)
      return
    }

    setCarrito(prev => {
      const existing = prev.find(item => item.id_producto === producto.id_producto)
      if (existing) {
        if (existing.cantidad + 1 > Number(producto.stock_actual)) {
          toast.error(`Stock máximo disponible: ${producto.stock_actual}`)
          return prev
        }
        return prev.map(item =>
          item.id_producto === producto.id_producto
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: Number(item.precio_unitario) * (item.cantidad + 1)
              }
            : item
        )
      }
      return [...prev, {
        id_producto: producto.id_producto,
        nombre_producto: producto.nombre_producto,
        sku: producto.sku,
        stock_actual: Number(producto.stock_actual),
        precio_unitario: Number(producto.precio_venta),
        cantidad: 1,
        subtotal: Number(producto.precio_venta)
      }]
    })
    setSearchQuery('')
    setSearchResults([])
  }

  // ====== Actualizar cantidad ======
  const updateCantidad = (id, delta) => {
    setCarrito(prev => prev.map(item => {
      if (item.id_producto !== id) return item
      const newCantidad = Math.max(1, item.cantidad + delta)
      if (newCantidad > item.stock_actual) {
        toast.error(`Stock máximo disponible: ${item.stock_actual}`)
        return item
      }
      return {
        ...item,
        cantidad: newCantidad,
        subtotal: Number(item.precio_unitario) * newCantidad
      }
    }))
  }

  // ====== Actualizar cantidad por input directo ======
  const handleCantidadInput = (id, value) => {
    const cantidad = parseInt(value, 10)
    if (isNaN(cantidad) || cantidad < 1) return
    setCarrito(prev => prev.map(item => {
      if (item.id_producto !== id) return item
      if (cantidad > item.stock_actual) {
        toast.error(`Stock máximo disponible: ${item.stock_actual}`)
        return item
      }
      return {
        ...item,
        cantidad,
        subtotal: Number(item.precio_unitario) * cantidad
      }
    }))
  }

  // ====== Eliminar del carrito ======
  const removeFromCart = (id) => {
    setCarrito(prev => prev.filter(item => item.id_producto !== id))
  }

  // ====== Cálculos de resumen ======
  const subtotal = carrito.reduce((sum, item) => sum + Number(item.subtotal), 0)
  const ivaTotal = subtotal * 0.15
  const totalVenta = subtotal + ivaTotal

  const cambioData = montoPagado && Number(montoPagado) >= totalVenta
    ? { cambio: Number(montoPagado) - totalVenta, suficiente: true }
    : { cambio: 0, suficiente: false }

  // ====== Opciones de clientes para el dropdown ======
  const clienteOptions = clientesActivos.length > 0
    ? clientesActivos.map(c => ({
        value: String(c.id_cliente),
        label: `${c.nombre_completo} ${c.numero_identificacion ? `(${c.numero_identificacion})` : ''}`
      }))
    : [{ value: '1', label: 'Consumidor Final' }]

  // ====== Crear cliente rápido desde el POS ======
  const handleCrearCliente = async (e) => {
    e.preventDefault()
    if (!nuevoCliente.nombre_completo.trim()) {
      toast.error('El nombre del cliente es requerido')
      return
    }
    if (!nuevoCliente.numero_identificacion.trim()) {
      toast.error('El número de identificación es requerido')
      return
    }
    setClienteModalLoading(true)
    try {
      const creado = await crearCliente(nuevoCliente)
      await fetchClientesActivos()
      setCliente(String(creado.id_cliente))
      setShowClienteModal(false)
      setNuevoCliente({
        nombre_completo: '',
        tipo_identificacion: 'CEDULA',
        numero_identificacion: '',
        telefono: '',
        email: '',
        direccion: '',
        ciudad: 'El Coca'
      })
      toast.success(`Cliente "${creado.nombre_completo}" creado y seleccionado`)
    } catch (err) {
      console.error('❌ Error al crear cliente rápido:', err)
      toast.error(err.message)
    } finally {
      setClienteModalLoading(false)
    }
  }

  // ====== Procesar venta ======
  const handlePagar = async () => {
    if (carrito.length === 0) {
      toast.error('Agrega productos al carrito antes de finalizar la venta')
      return
    }

    if (metodoPago === 'EFECTIVO' && montoPagado && Number(montoPagado) < totalVenta) {
      toast.error('El monto recibido es menor al total de la venta')
      return
    }

    setSubmitting(true)
    try {
      // Generar número de factura automático
      const numeroFactura = await obtenerNumeroFactura()

      console.log('🔵 Usuario logueado (Auth):', user)
      console.log('🔵 Session ID (auth_id):', session?.user?.id)
      console.log('🔵 Cliente seleccionado (id_cliente):', cliente)

      const ventaData = {
        numero_factura: numeroFactura,
        id_cliente: Number(cliente), // Guardar id_cliente (FK a clientes)
        subtotal: Math.round(subtotal * 100) / 100,
        iva: Math.round(ivaTotal * 100) / 100,
        total: Math.round(totalVenta * 100) / 100,
        forma_pago: metodoPago,
        estado: 'COMPLETADA'
      }

      const detalleData = carrito.map(item => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: Math.round(item.subtotal * 100) / 100
      }))

      // Registrar la venta. Pasamos la session para que el servicio resuelva el
      // id_usuario numérico (FK válida) desde la tabla usuarios vía auth_id.
      const ventaGuardada = await registrarVenta({ venta: ventaData, detalle: detalleData }, session)

      console.log('🎉 Venta guardada en BD:', ventaGuardada)

      toast.success(`✅ Venta registrada exitosamente. Factura: ${numeroFactura}`)

      // Limpiar carrito y campos
      setCarrito([])
      setCliente('1') // Volver a Consumidor Final
      setMontoPagado('')
      setSearchQuery('')
      setSearchResults([])
    } catch (err) {
      console.error('🔴 ERROR al guardar la venta:', err)
      toast.error(`❌ Error al guardar la venta: ${err.message || 'Error desconocido'}`)
    } finally {
      setSubmitting(false)
    }
  }

  // ====== Columnas del historial ======
  const columnsHistorial = [
    { key: 'numero_factura', label: 'Factura' },
    { key: 'creado_en', label: 'Fecha', render: (val) => new Date(val).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
    { key: 'clientes', label: 'Cliente', render: (_, row) => row.clientes?.nombre_completo || 'Consumidor Final' },
    { key: 'subtotal', label: 'Subtotal', render: (val) => formatCurrency(val), align: 'right' },
    { key: 'iva', label: 'IVA', render: (val) => formatCurrency(val), align: 'right' },
    { key: 'total', label: 'Total', render: (val) => <span className="font-bold text-primary-600">{formatCurrency(val)}</span>, align: 'right' },
    { key: 'forma_pago', label: 'Pago', render: (val) => <Badge variant="info">{val}</Badge> },
    { key: 'estado', label: 'Estado', render: (val) => (
      <Badge variant={val === 'COMPLETADA' ? 'success' : 'danger'} dot>
        {val === 'COMPLETADA' ? 'Completada' : 'Anulada'}
      </Badge>
    )}
  ]

  // Opciones de métodos de pago
  const metodoPagoOptions = metodosPago.length > 0
    ? metodosPago.map(m => ({ value: m.value, label: m.label }))
    : [
        { value: 'EFECTIVO', label: 'Efectivo' },
        { value: 'TRANSFERENCIA', label: 'Transferencia' },
        { value: 'TARJETA', label: 'Tarjeta' }
      ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <ShoppingCart className="w-6 h-6 text-primary-600" />
        Punto de Venta
      </h1>

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ===== Columna izquierda: Búsqueda + Carrito ===== */}
          <div className="lg:col-span-2 space-y-4">
            {/* Búsqueda de productos */}
            <Card title="Buscar Productos" icon={Search}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, SKU o código de barras..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  autoFocus
                />
                {searching && <p className="text-sm text-gray-400 mt-2">Buscando...</p>}
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
                    {searchResults.map((p) => (
                      <button
                        key={p.id_producto}
                        onClick={() => addToCart(p)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
                        disabled={Number(p.stock_actual) <= 0}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.nombre_producto}</p>
                          <p className="text-xs text-gray-500">SKU: {p.sku} | Stock: {p.stock_actual}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          <p className="text-sm font-bold text-primary-600">{formatCurrency(p.precio_venta)}</p>
                          {Number(p.stock_actual) <= 0 ? (
                            <Badge variant="danger">Sin stock</Badge>
                          ) : (
                            <Plus className="w-4 h-4 text-primary-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                  <p className="text-sm text-danger-600 mt-2">
                    {searchError || `No se encontraron productos para "${searchQuery}"`}
                  </p>
                )}
              </div>
            </Card>

            {/* Carrito de compras */}
            <Card title={`Carrito de Compras (${carrito.length} items)`} icon={ShoppingCart}>
              {carrito.length === 0 ? (
                <div className="text-center py-10">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">Busca productos para agregar al carrito</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Producto</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Precio Unit.</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Cantidad</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {carrito.map((item) => (
                        <tr key={item.id_producto} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{item.nombre_producto}</p>
                            <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-700">{formatCurrency(item.precio_unitario)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => updateCantidad(item.id_producto, -1)}
                                className="p-1 rounded hover:bg-gray-200 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={item.stock_actual}
                                value={item.cantidad}
                                onChange={(e) => handleCantidadInput(item.id_producto, e.target.value)}
                                className="w-14 text-center text-sm font-medium border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                              <button
                                onClick={() => updateCantidad(item.id_producto, 1)}
                                className="p-1 rounded hover:bg-gray-200 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{formatCurrency(item.subtotal)}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => removeFromCart(item.id_producto)}
                              className="p-1.5 rounded hover:bg-danger-50 text-danger-500 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* ===== Columna derecha: Datos cliente + Resumen ===== */}
          <div className="space-y-4">
            {/* Datos del cliente */}
            <Card title="Datos del Cliente" icon={User}>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Select
                    label="Cliente"
                    options={clienteOptions}
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={UserPlus}
                  onClick={() => setShowClienteModal(true)}
                  className="mb-0.5"
                >
                  Nuevo
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Selecciona un cliente registrado o crea uno nuevo desde el punto de venta.
              </p>
            </Card>

            {/* Resumen de venta */}
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
                  options={metodoPagoOptions}
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
                      {formatCurrency(cambioData.cambio)}
                    </p>
                  </div>
                )}

                {montoPagado && Number(montoPagado) < totalVenta && (
                  <p className="text-sm text-danger-600 text-center">
                    Monto insuficiente. Faltan {formatCurrency(totalVenta - Number(montoPagado))}
                  </p>
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
        /* ===== Historial de ventas ===== */
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

      {/* ===== Modal: Nuevo Cliente rápido ===== */}
      <Modal
        isOpen={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        title="Nuevo Cliente"
        subtitle="Alta rápida desde el punto de venta"
        icon={UserPlus}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowClienteModal(false)}>Cancelar</Button>
            <Button onClick={handleCrearCliente} loading={clienteModalLoading}>Crear y Seleccionar</Button>
          </div>
        }
      >
        <form onSubmit={handleCrearCliente} className="space-y-4">
          <Input
            label="Nombre Completo"
            value={nuevoCliente.nombre_completo}
            onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre_completo: e.target.value })}
            placeholder="Nombre y apellidos"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Tipo Identificación"
              options={[
                { value: 'CEDULA', label: 'Cédula' },
                { value: 'RUC', label: 'RUC' },
                { value: 'PASAPORTE', label: 'Pasaporte' }
              ]}
              value={nuevoCliente.tipo_identificacion}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, tipo_identificacion: e.target.value })}
            />
            <Input
              label="Número"
              value={nuevoCliente.numero_identificacion}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, numero_identificacion: e.target.value })}
              placeholder="Cédula, RUC o pasaporte"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              value={nuevoCliente.telefono}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
              placeholder="Ej: 0987654321"
            />
            <Input
              label="Email"
              type="email"
              value={nuevoCliente.email}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
              placeholder="cliente@email.com"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Dirección"
              value={nuevoCliente.direccion}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
              placeholder="Dirección"
            />
            <Input
              label="Ciudad"
              value={nuevoCliente.ciudad}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, ciudad: e.target.value })}
              placeholder="El Coca"
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
