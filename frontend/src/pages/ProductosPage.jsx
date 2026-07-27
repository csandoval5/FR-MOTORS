import { useState } from 'react'
import { Package, Plus, Search, Edit3, Trash2, AlertTriangle } from 'lucide-react'
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
import toast from 'react-hot-toast'

/**
 * Página de gestión de inventario/productos
 */
export default function ProductosPage() {
  const {
    productos, total, loading, error, page, search, categoria, categorias,
    setPage, setSearch, setCategoria, totalPages,
    crearProducto, editarProducto, eliminarProducto
  } = useProductos()

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    nombre_producto: '',
    sku: '',
    precio_compra: '',
    precio_venta: '',
    stock_actual: '',
    stock_minimo: '',
    id_categoria: ''
  })
  const [formErrors, setFormErrors] = useState({})

  const columns = [
    { key: 'sku', label: 'SKU' },
    { key: 'nombre_producto', label: 'Producto', render: (val, row) => (
      <div>
        <p className="font-medium text-gray-900">{val}</p>
        <p className="text-xs text-gray-500">{row.categorias?.nombre_categoria}</p>
      </div>
    )},
    { key: 'stock_actual', label: 'Stock', render: (val, row) => (
      <div className="flex items-center gap-2">
        <span className={`font-medium ${val <= row.stock_minimo ? 'text-danger-600' : 'text-gray-900'}`}>
          {val}
        </span>
        {val <= row.stock_minimo && (
          <AlertTriangle className="w-4 h-4 text-danger-500" />
        )}
      </div>
    )},
    { key: 'precio_compra', label: 'Costo', render: (val) => formatCurrency(val), align: 'right' },
    { key: 'precio_venta', label: 'Precio Venta', render: (val) => formatCurrency(val), align: 'right' },
    { key: 'acciones', label: 'Acciones', render: (_, row) => (
      <div className="flex items-center gap-2">
        <button onClick={() => handleEdit(row)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors">
          <Edit3 className="w-4 h-4" />
        </button>
        <button onClick={() => handleDelete(row)} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-600 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )}
  ]

  const validateForm = () => {
    const errors = {}
    if (!formData.nombre_producto.trim()) errors.nombre_producto = 'El nombre es requerido'
    if (!formData.sku.trim()) errors.sku = 'El SKU es requerido'
    if (!formData.precio_venta || Number(formData.precio_venta) <= 0) errors.precio_venta = 'Precio de venta inválido'
    if (!formData.id_categoria) errors.id_categoria = 'Selecciona una categoría'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (editing) {
        await editarProducto(editing.id_producto, formData)
        toast.success('Producto actualizado correctamente')
      } else {
        await crearProducto(formData)
        toast.success('Producto creado correctamente')
      }
      setShowModal(false)
      resetForm()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleEdit = (producto) => {
    setEditing(producto)
    setFormData({
      nombre_producto: producto.nombre_producto,
      sku: producto.sku,
      precio_compra: producto.precio_compra,
      precio_venta: producto.precio_venta,
      stock_actual: producto.stock_actual,
      stock_minimo: producto.stock_minimo,
      id_categoria: producto.id_categoria
    })
    setShowModal(true)
  }

  const handleDelete = async (producto) => {
    if (!window.confirm(`¿Eliminar "${producto.nombre_producto}"?`)) return
    try {
      await eliminarProducto(producto.id_producto)
      toast.success('Producto desactivado correctamente')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const resetForm = () => {
    setEditing(null)
    setFormData({ nombre_producto: '', sku: '', precio_compra: '', precio_venta: '', stock_actual: '', stock_minimo: '', id_categoria: '' })
    setFormErrors({})
  }

  const openCreate = () => {
    resetForm()
    setShowModal(true)
  }

  const categoriaOptions = categorias.map(c => ({ value: c.id_categoria, label: c.nombre_categoria }))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventario</h2>
          <p className="text-sm text-gray-500">{total} productos registrados</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>
          Nuevo Producto
        </Button>
      </div>

      {error && <Alert type="error" title="Error" message={error} dismissible />}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={(v) => { setSearch(v); setPage(1) }}
            placeholder="Buscar por nombre, SKU o código de barras..."
          />
        </div>
        <Select
          options={categoriaOptions}
          value={categoria}
          onChange={(e) => { setCategoria(e.target.value); setPage(1) }}
          placeholder="Todas las categorías"
          className="sm:w-48"
        />
      </div>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          data={productos}
          loading={loading}
          emptyMessage="No se encontraron productos"
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={20}
          onPageChange={setPage}
        />
      </Card>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Editar Producto' : 'Nuevo Producto'}
        icon={Package}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} loading={loading}>
              {editing ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre del Producto"
              value={formData.nombre_producto}
              onChange={(e) => setFormData({ ...formData, nombre_producto: e.target.value })}
              error={formErrors.nombre_producto}
              placeholder="Nombre del repuesto"
            />
            <Input
              label="Código SKU"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              error={formErrors.sku}
              placeholder="SKU-001"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Precio de Compra"
              type="number"
              step="0.01"
              value={formData.precio_compra}
              onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
              placeholder="0.00"
            />
            <Input
              label="Precio de Venta"
              type="number"
              step="0.01"
              value={formData.precio_venta}
              onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
              error={formErrors.precio_venta}
              placeholder="0.00"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Stock Actual"
              type="number"
              value={formData.stock_actual}
              onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Stock Mínimo"
              type="number"
              value={formData.stock_minimo}
              onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
              placeholder="5"
            />
          </div>
          <Select
            label="Categoría"
            options={categoriaOptions}
            value={formData.id_categoria}
            onChange={(e) => setFormData({ ...formData, id_categoria: e.target.value })}
            error={formErrors.id_categoria}
          />
        </form>
      </Modal>
    </div>
  )
}

