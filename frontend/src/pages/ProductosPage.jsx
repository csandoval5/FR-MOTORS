import { useState } from 'react'
import {
  Package, Plus, Edit3, Trash2, AlertTriangle, XCircle, CheckCircle2, Layers
} from 'lucide-react'
import { useProductos } from '../hooks/useProductos'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import Button from '../components/ui/Button'
import SearchBar from '../components/ui/SearchBar'
import Pagination from '../components/ui/Pagination'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import Alert from '../components/ui/Alert'
import { formatCurrency } from '../utils/formatCurrency'
import { UNIDADES_MEDIDA } from '../utils/constants'
import { validatePrecio, validateStock, validateRequired } from '../utils/validators'
import toast from 'react-hot-toast'

/**
 * Página de gestión de inventario/productos - CRUD completo
 * Incluye: crear, editar, eliminar (soft delete), buscar, filtrar,
 * ordenar, paginar y badges de estado de stock.
 */
export default function ProductosPage() {
  const {
    productos, total, loading, error, page, search, categoria, filtroStock,
    categorias, proveedores, pageSize, sortColumn, sortDirection,
    setPage, setSearch, setCategoria, setFiltroStock, setPageSize, handleSort,
    crearProducto, editarProducto, eliminarProducto, verificarSku
  } = useProductos()

  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productoAEliminar, setProductoAEliminar] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    nombre_producto: '',
    sku: '',
    descripcion: '',
    id_categoria: '',
    precio_compra: '',
    precio_venta: '',
    stock_actual: '',
    stock_minimo: '5',
    unidad_medida: 'UNIDAD',
    id_proveedor: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [saveLoading, setSaveLoading] = useState(false)

  // ====== Helpers de estado de stock ======
  const getEstadoStock = (row) => {
    if (row.stock_actual <= 0) {
      return { variant: 'danger', label: 'Sin Stock', icon: XCircle }
    }
    if (row.stock_actual <= row.stock_minimo) {
      return { variant: 'warning', label: 'Stock Bajo', icon: AlertTriangle }
    }
    return { variant: 'success', label: 'Activo', icon: CheckCircle2 }
  }

  // ====== Columnas de la tabla ======
  const columns = [
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
      render: (val) => (
        <span className="font-mono text-xs font-medium text-primary-700 bg-primary-50 px-2 py-1 rounded-md">
          {val}
        </span>
      )
    },
    {
      key: 'nombre_producto',
      label: 'Producto',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-900">{val}</p>
          <p className="text-xs text-gray-500">
            {row.categorias?.nombre_categoria}
            {row.unidad_medida ? ` · ${row.unidad_medida}` : ''}
          </p>
        </div>
      )
    },
    {
      key: 'precio_venta',
      label: 'Precio Venta',
      sortable: true,
      align: 'right',
      render: (val) => <span className="font-semibold text-gray-900">{formatCurrency(val)}</span>
    },
    {
      key: 'stock_actual',
      label: 'Stock',
      sortable: true,
      align: 'center',
      render: (val, row) => {
        const estado = getEstadoStock(row)
        return (
          <div className="flex items-center justify-center gap-2">
            <span className={`font-bold ${val <= row.stock_minimo ? 'text-danger-600' : 'text-gray-900'}`}>
              {val}
            </span>
            {val <= row.stock_minimo && <AlertTriangle className="w-4 h-4 text-warning-500" />}
          </div>
        )
      }
    },
    {
      key: 'estado',
      label: 'Estado',
      align: 'center',
      render: (_, row) => {
        const estado = getEstadoStock(row)
        const Icon = estado.icon
        return <Badge variant={estado.variant} dot><Icon className="w-3 h-3" />{estado.label}</Badge>
      }
    },
    {
      key: 'acciones',
      label: 'Acciones',
      align: 'center',
      render: (_, row) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors"
            title="Editar producto"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-2 rounded-lg hover:bg-danger-50 text-danger-600 transition-colors"
            title="Eliminar producto"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  // ====== Validación del formulario ======
  const validateForm = async () => {
    const errors = {}

    // Nombre
    const nombreVal = validateRequired(formData.nombre_producto, 'El nombre')
    if (!nombreVal.isValid) errors.nombre_producto = nombreVal.message

    // SKU
    const skuVal = validateRequired(formData.sku, 'El SKU')
    if (!skuVal.isValid) {
      errors.sku = skuVal.message
    } else if (formData.sku.length < 3) {
      errors.sku = 'El SKU debe tener al menos 3 caracteres'
    } else {
      // Verificar unicidad (solo si no está editando)
      const existe = await verificarSku(formData.sku, editing?.id_producto)
      if (existe) errors.sku = 'Este SKU ya existe. Usa uno diferente.'
    }

    // Categoría
    if (!formData.id_categoria) errors.id_categoria = 'Selecciona una categoría'

    // Precios
    const precioCompra = validatePrecio(formData.precio_compra, { min: 0 })
    if (!precioCompra.isValid) errors.precio_compra = precioCompra.message

    const precioVenta = validatePrecio(formData.precio_venta, { min: 0.01 })
    if (!precioVenta.isValid) errors.precio_venta = precioVenta.message

    // Stock
    const stockActual = validateStock(formData.stock_actual)
    if (!stockActual.isValid) errors.stock_actual = stockActual.message

    const stockMinimo = validateStock(formData.stock_minimo)
    if (!stockMinimo.isValid) errors.stock_minimo = stockMinimo.message

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ====== Manejo de submit ======
  const handleSubmit = async (e) => {
    e.preventDefault()
    const isValid = await validateForm()
    if (!isValid) {
      toast.error('Revisa los campos marcados en rojo')
      return
    }

    setSaveLoading(true)
    try {
      const payload = {
        nombre_producto: formData.nombre_producto.trim(),
        descripcion: formData.descripcion?.trim() || null,
        id_categoria: formData.id_categoria,
        precio_compra: Number(formData.precio_compra) || 0,
        precio_venta: Number(formData.precio_venta),
        stock_actual: Number(formData.stock_actual) || 0,
        stock_minimo: Number(formData.stock_minimo) || 5,
        unidad_medida: formData.unidad_medida,
        id_proveedor: formData.id_proveedor || null
      }

      if (editing) {
        await editarProducto(editing.id_producto, payload)
        toast.success('Producto actualizado correctamente')
      } else {
        const newProducto = await crearProducto({ ...payload, sku: formData.sku.trim() })
        toast.success(`Producto "${newProducto.nombre_producto}" creado`)
      }
      setShowModal(false)
      resetForm()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaveLoading(false)
    }
  }

  // ====== Editar ======
  const handleEdit = (producto) => {
    setEditing(producto)
    setFormData({
      nombre_producto: producto.nombre_producto || '',
      sku: producto.sku || '',
      descripcion: producto.descripcion || '',
      id_categoria: producto.id_categoria || '',
      precio_compra: producto.precio_compra ?? '',
      precio_venta: producto.precio_venta ?? '',
      stock_actual: producto.stock_actual ?? '',
      stock_minimo: producto.stock_minimo ?? '',
      unidad_medida: producto.unidad_medida || 'UNIDAD',
      id_proveedor: producto.id_proveedor || ''
    })
    setFormErrors({})
    setShowModal(true)
  }

  // ====== Eliminar (con modal de confirmación) ======
  const handleDelete = (producto) => {
    setProductoAEliminar(producto)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!productoAEliminar) return
    setDeleting(true)
    try {
      await eliminarProducto(productoAEliminar.id_producto)
      toast.success(`Producto "${productoAEliminar.nombre_producto}" desactivado`)
      setShowDeleteModal(false)
      setProductoAEliminar(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  // ====== Reset form ======
  const resetForm = () => {
    setEditing(null)
    setFormData({
      nombre_producto: '',
      sku: '',
      descripcion: '',
      id_categoria: '',
      precio_compra: '',
      precio_venta: '',
      stock_actual: '',
      stock_minimo: '5',
      unidad_medida: 'UNIDAD',
      id_proveedor: ''
    })
    setFormErrors({})
  }

  const openCreate = () => {
    resetForm()
    setShowModal(true)
  }

  // ====== Opciones de dropdowns ======
  const categoriaOptions = categorias.map(c => ({ value: c.id_categoria, label: c.nombre_categoria }))
  const proveedorOptions = proveedores.map(p => ({ value: p.id_proveedor, label: p.razon_social }))
  const unidadOptions = UNIDADES_MEDIDA.map(u => ({ value: u, label: u.charAt(0) + u.slice(1).toLowerCase() }))
  const stockFilterOptions = [
    { value: 'todos', label: 'Todos los stocks' },
    { value: 'bajo', label: 'Stock bajo' },
    { value: 'sin_stock', label: 'Sin stock' }
  ]
  const pageSizeOptions = [
    { value: '10', label: '10 por página' },
    { value: '25', label: '25 por página' },
    { value: '50', label: '50 por página' }
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary-600" />
            Inventario
          </h1>
          <p className="text-sm text-gray-500">{total} productos registrados</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>
          Nuevo Producto
        </Button>
      </div>

      {error && <Alert type="error" title="Error" message={error} dismissible />}

      {/* Filtros */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={(v) => { setSearch(v); setPage(1) }}
            placeholder="Buscar por nombre, SKU o código de barras..."
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            options={categoriaOptions}
            value={categoria}
            onChange={(e) => { setCategoria(e.target.value); setPage(1) }}
            placeholder="Todas las categorías"
            className="sm:w-44"
          />
          <Select
            options={stockFilterOptions}
            value={filtroStock}
            onChange={(e) => { setFiltroStock(e.target.value); setPage(1) }}
            className="sm:w-40"
          />
        </div>
      </div>

      {/* Tabla */}
      <Card>
        <Table
          columns={columns}
          data={productos}
          loading={loading}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          emptyMessage="No se encontraron productos"
        />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4">
          <Select
            options={pageSizeOptions}
            value={String(pageSize)}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="w-40"
          />
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / pageSize)}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </Card>

      {/* ====== Modal Crear/Editar Producto ====== */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Editar Producto' : 'Nuevo Producto'}
        subtitle={editing ? `SKU: ${editing.sku}` : 'Registra un nuevo repuesto en el inventario'}
        icon={Package}
        size="full"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} loading={saveLoading} icon={editing ? Edit3 : Plus}>
              {editing ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Sección 1: Información básica */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Información Básica</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre del Producto *"
                value={formData.nombre_producto}
                onChange={(e) => setFormData({ ...formData, nombre_producto: e.target.value })}
                error={formErrors.nombre_producto}
                placeholder="Ej: Filtro de aire Honda"
              />
              <Input
                label="Código SKU *"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                error={formErrors.sku}
                placeholder="Ej: FIL-AIR-001"
                disabled={!!editing}
                helperText={editing ? 'El SKU no se puede modificar' : 'Código único del producto'}
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows="3"
                placeholder="Descripción detallada del producto (opcional)"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Sección 2: Categoría y clasificación */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Clasificación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Categoría *"
                options={categoriaOptions}
                value={formData.id_categoria}
                onChange={(e) => setFormData({ ...formData, id_categoria: e.target.value })}
                error={formErrors.id_categoria}
                placeholder="Seleccionar categoría"
              />
              <Select
                label="Unidad de Medida"
                options={unidadOptions}
                value={formData.unidad_medida}
                onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
              />
              <Select
                label="Proveedor"
                options={proveedorOptions}
                value={formData.id_proveedor}
                onChange={(e) => setFormData({ ...formData, id_proveedor: e.target.value })}
                placeholder="Seleccionar proveedor"
              />
            </div>
          </div>

          {/* Sección 3: Precios */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Precios</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Precio de Compra *"
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_compra}
                onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
                error={formErrors.precio_compra}
                placeholder="0.00"
              />
              <Input
                label="Precio de Venta *"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.precio_venta}
                onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                error={formErrors.precio_venta}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Sección 4: Stock */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Stock</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Stock Actual *"
                type="number"
                min="0"
                value={formData.stock_actual}
                onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
                error={formErrors.stock_actual}
                placeholder="0"
              />
              <Input
                label="Stock Mínimo *"
                type="number"
                min="0"
                value={formData.stock_minimo}
                onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                error={formErrors.stock_minimo}
                placeholder="5"
                helperText="Alerta cuando el stock llegue a este nivel"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* ====== Modal de Confirmación de Eliminación ====== */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar Eliminación"
        icon={Trash2}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting} icon={Trash2}>
              Eliminar
            </Button>
          </div>
        }
      >
        {productoAEliminar && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-danger-50 rounded-xl border border-danger-200">
              <AlertTriangle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-danger-800">
                  ¿Estás seguro de que deseas eliminar este producto?
                </p>
                <p className="mt-1 text-sm text-danger-700">
                  Esta acción lo desactivará del inventario, pero no se eliminará físicamente.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <p className="text-sm"><span className="text-gray-500">Producto:</span> <span className="font-medium">{productoAEliminar.nombre_producto}</span></p>
              <p className="text-sm"><span className="text-gray-500">SKU:</span> <span className="font-medium font-mono">{productoAEliminar.sku}</span></p>
              <p className="text-sm"><span className="text-gray-500">Stock actual:</span> <span className="font-medium">{productoAEliminar.stock_actual}</span></p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
