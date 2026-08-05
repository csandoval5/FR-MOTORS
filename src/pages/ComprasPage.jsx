import { useState, useEffect, useCallback } from 'react'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  Truck,
  Package,
  CreditCard,
  Printer
} from 'lucide-react'
import { useCompras } from '../hooks/useCompras'
import { useProveedores } from '../hooks/useProveedores'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Table from '../components/ui/Table'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import { formatCurrency } from '../utils/formatCurrency'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

/**
 * Página de Compras a Proveedores
 * - Historial de compras con datos del proveedor
 * - Registro de nueva compra (modal)
 * - Búsqueda y agregado de productos
 * - Actualización de stock (AUMENTA, no disminuye)
 */
export default function ComprasPage() {
  const {
    compras,
    total,
    loading,
    page,
    setPage,
    totalPages,
    search,
    setSearch,
    searchProductos,
    registrarCompra
  } = useCompras()

  const { proveedores, fetchProveedores } = useProveedores()
  const { session } = useAuth()

  // Lista de proveedores activos (para el dropdown)
  const [proveedoresActivos, setProveedoresActivos] = useState([])

  // Estado del modal
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Estado del formulario de compra
  const [idProveedor, setidProveedor] = useState('')
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [items, setItems] = useState([])

  // Búsqueda de productos en el modal
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Cargar proveedores activos
  useEffect(() => {
    const loadProveedores = async () => {
      try {
        await fetchProveedores()
        setProveedoresActivos(proveedores)
      } catch (err) {
        console.error('❌ Error al cargar proveedores:', err)
      }
    }
    loadProveedores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProveedores])

  // Búsqueda debounced de productos
  const searchProductosDebounced = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchResults([])
      setSearchError('')
      return
    }
    setSearching(true)
    setSearchError('')
    try {
      const results = await searchProductos(query)
      console.log('🔍 Resultados en ComprasPage:', results)
      setSearchResults(results)
      if (results.length === 0) {
        setSearchError(`No se encontraron productos para "${query}"`)
      }
    } catch (err) {
      console.error('❌ Error en búsqueda de productos:', err)
      setSearchResults([])
      setSearchError(err.message || 'Error al buscar productos')
    } finally {
      setSearching(false)
    }
  }, [searchProductos])

  useEffect(() => {
    const timer = setTimeout(() => {
      searchProductosDebounced(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchProductosDebounced])

  // ====== Agregar producto a la lista de items ======
  const addItem = (producto) => {
    setItems(prev => {
      const existing = prev.find(item => item.id_producto === producto.id_producto)
      if (existing) {
        return prev.map(item =>
          item.id_producto === producto.id_producto
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: Math.round(Number(item.precio_unitario) * (item.cantidad + 1) * 100) / 100
              }
            : item
        )
      }
      const precioCompra = Number(producto.precio_compra) > 0 ? Number(producto.precio_compra) : 0
      return [...prev, {
        id_producto: producto.id_producto,
        nombre_producto: producto.nombre_producto,
        sku: producto.sku,
        stock_actual: Number(producto.stock_actual),
        precio_unitario: precioCompra,
        cantidad: 1,
        subtotal: precioCompra
      }]
    })
    setSearchQuery('')
    setSearchResults([])
  }

  // ====== Actualizar cantidad ======
  const updateCantidad = (id, delta) => {
    setItems(prev => prev.map(item => {
      if (item.id_producto !== id) return item
      const newCantidad = Math.max(1, item.cantidad + delta)
      return {
        ...item,
        cantidad: newCantidad,
        subtotal: Math.round(Number(item.precio_unitario) * newCantidad * 100) / 100
      }
    }))
  }

  // ====== Actualizar cantidad por input directo ======
  const handleCantidadInput = (id, value) => {
    const cantidad = parseInt(value, 10)
    if (isNaN(cantidad) || cantidad < 1) return
    setItems(prev => prev.map(item => {
      if (item.id_producto !== id) return item
      return {
        ...item,
        cantidad,
        subtotal: Math.round(Number(item.precio_unitario) * cantidad * 100) / 100
      }
    }))
  }

  // ====== Actualizar precio unitario ======
  const handlePrecioInput = (id, value) => {
    const precio = parseFloat(value)
    if (isNaN(precio) || precio <= 0) return
    setItems(prev => prev.map(item => {
      if (item.id_producto !== id) return item
      return {
        ...item,
        precio_unitario: precio,
        subtotal: Math.round(precio * item.cantidad * 100) / 100
      }
    }))
  }

  // ====== Eliminar item ======
  const removeItem = (id) => {
    setItems(prev => prev.filter(item => item.id_producto !== id))
  }

  // ====== Cálculos de resumen ======
  const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0)
  const ivaTotal = subtotal * 0.15
  const totalCompra = subtotal + ivaTotal

  // ====== Opciones de proveedores para el dropdown ======
  const proveedorOptions = proveedoresActivos.length > 0
    ? proveedoresActivos.map(p => ({
        value: String(p.id_proveedor),
        label: `${p.razon_social} (${p.ruc_cedula || 'Sin RUC'})`
      }))
    : []

  // ====== Guardar compra ======
  const handleGuardar = async () => {
    // Validaciones
    if (items.length === 0) {
      toast.error('Agrega al menos un producto a la compra')
      return
    }
    if (!idProveedor) {
      toast.error('Selecciona un proveedor')
      return
    }
    for (const item of items) {
      if (item.cantidad <= 0) {
        toast.error(`La cantidad de "${item.nombre_producto}" debe ser mayor a 0`)
        return
      }
      if (item.precio_unitario <= 0) {
        toast.error(`El precio unitario de "${item.nombre_producto}" debe ser mayor a 0`)
        return
      }
    }

    setSubmitting(true)
    try {
      const compraData = {
        id_proveedor: Number(idProveedor),
        subtotal: Math.round(subtotal * 100) / 100,
        iva: Math.round(ivaTotal * 100) / 100,
        total: Math.round(totalCompra * 100) / 100,
        metodo_pago: metodoPago,
        estado: 'COMPLETADA'
      }

      const detalleData = items.map(item => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: Math.round(item.subtotal * 100) / 100
      }))

      console.log('🟢 Guardando compra:', { compra: compraData, detalle: detalleData })

      const compraGuardada = await registrarCompra({ compra: compraData, detalle: detalleData }, session)

      console.log('🎉 Compra guardada en BD:', compraGuardada)

      toast.success(`✅ Compra registrada exitosamente. Compra: ${compraGuardada.numero_compra}`)

      // Limpiar formulario
      setItems([])
      setidProveedor('')
      setMetodoPago('EFECTIVO')
      setSearchQuery('')
      setSearchResults([])
      setShowModal(false)
    } catch (err) {
      console.error('🔴 ERROR al guardar la compra:', err)
      toast.error(`❌ Error al guardar la compra: ${err.message || 'Error desconocido'}`)
    } finally {
      setSubmitting(false)
    }
  }

  // ====== Columnas del historial ======
  const columnsHistorial = [
    { key: 'numero_compra', label: '# Compra' },
    {
      key: 'creado_en',
      label: 'Fecha',
      render: (val) => new Date(val).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    },
    {
      key: 'proveedores',
      label: 'Proveedor',
      render: (val) => val?.razon_social || 'Sin proveedor'
    },
    { key: 'subtotal', label: 'Subtotal', render: (val) => formatCurrency(val), align: 'right' },
    { key: 'iva', label: 'IVA', render: (val) => formatCurrency(val), align: 'right' },
    { key: 'total', label: 'Total', render: (val) => <span className="font-bold text-primary-600">{formatCurrency(val)}</span>, align: 'right' },
    { key: 'metodo_pago', label: 'Pago', render: (val) => <Badge variant="info">{val}</Badge> },
    {
      key: 'estado',
      label: 'Estado',
      render: (val) => (
        <Badge variant={val === 'COMPLETADA' ? 'success' : 'danger'} dot>
          {val === 'COMPLETADA' ? 'Completada' : 'Anulada'}
        </Badge>
      )
    }
  ]

  // ====== Opciones de método de pago ======
  const metodoPagoOptions = [
    { value: 'EFECTIVO', label: 'Efectivo' },
    { value: 'TRANSFERENCIA', label: 'Transferencia' },
    { value: 'CREDITO', label: 'Crédito' }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-primary-600" />
          Compras
        </h1>
        <Button icon={Plus} onClick={() => setShowModal(true)}>
          Nueva Compra
        </Button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por número de compra o proveedor..."
          className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
        />
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>

      {/* Tabla de compras */}
      <Card>
        <Table
          columns={columnsHistorial}
          data={compras}
          loading={loading}
          emptyMessage="No hay compras registradas"
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          onPageChange={setPage}
        />
      </Card>

      {/* Modal de nueva compra */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nueva Compra"
        subtitle="Registrar compra a proveedor"
        icon={Truck}
        size="full"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button
              icon={CreditCard}
              onClick={handleGuardar}
              loading={submitting}
              disabled={items.length === 0}
            >
              Guardar Compra ({formatCurrency(totalCompra)})
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Proveedor y método de pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Proveedor *"
              options={proveedorOptions}
              placeholder="Seleccionar proveedor..."
              value={idProveedor}
              onChange={(e) => setidProveedor(e.target.value)}
            />
            <Select
              label="Método de Pago"
              options={metodoPagoOptions}
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
            />
          </div>

          {/* Búsqueda de productos */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1.5">Buscar Productos</p>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o SKU..."
                className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            {searching && <p className="text-sm text-gray-400 mt-2">Buscando...</p>}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                {searchResults.map((p) => (
                  <button
                    key={p.id_producto}
                    onClick={() => addItem(p)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.nombre_producto}</p>
                      <p className="text-xs text-gray-500">SKU: {p.sku} | Stock: {p.stock_actual}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <p className="text-sm font-bold text-primary-600">{formatCurrency(p.precio_compra)}</p>
                      <Plus className="w-4 h-4 text-primary-500" />
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

          {/* Tabla de items */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1.5">Detalle de Compra ({items.length} items)</p>
            {items.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">Busca y agrega productos a la compra</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
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
                    {items.map((item) => (
                      <tr key={item.id_producto} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{item.nombre_producto}</p>
                          <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.precio_unitario}
                            onChange={(e) => handlePrecioInput(item.id_producto, e.target.value)}
                            className="w-24 text-right text-sm font-medium border border-gray-200 rounded-lg py-1 px-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </td>
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
                            onClick={() => removeItem(item.id_producto)}
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
          </div>

          {/* Resumen */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">IVA (15%)</span>
              <span className="font-medium">{formatCurrency(ivaTotal)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-lg font-bold text-primary-600">{formatCurrency(totalCompra)}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
