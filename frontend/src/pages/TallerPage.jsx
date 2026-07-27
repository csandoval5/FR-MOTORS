import { useState } from 'react'
import { Wrench, Plus, Search, Eye } from 'lucide-react'
import { useTaller } from '../hooks/useTaller'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import Button from '../components/ui/Button'
import SearchBar from '../components/ui/SearchBar'
import Select from '../components/ui/Select'
import Pagination from '../components/ui/Pagination'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import { EstadoTallerBadge } from '../components/ui/Badge'
import Alert from '../components/ui/Alert'
import { formatDate, formatDateTime } from '../utils/formatDate'
import { formatCurrency } from '../utils/formatCurrency'
import toast from 'react-hot-toast'

/**
 * Página de gestión de órdenes de taller
 */
export default function TallerPage() {
  const {
    ordenes, total, loading, error, estados, ordenesActivas,
    page, search, filtroEstado, setPage, setSearch, setFiltroEstado,
    totalPages, crearOrden, editarOrden, getOrden
  } = useTaller()

  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedOrden, setSelectedOrden] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_vehiculo_marca: '',
    cliente_vehiculo_modelo: '',
    cliente_vehiculo_placa: '',
    kilometraje: '',
    descripcion_falla: ''
  })
  const [formErrors, setFormErrors] = useState({})

  const estadoOptions = estados.map(e => ({ value: e.id_estado, label: e.nombre_estado }))

  const columns = [
    { key: 'numero_orden', label: 'Orden' },
    { key: 'cliente_nombre', label: 'Cliente' },
    { key: 'cliente_vehiculo_marca', label: 'Vehículo', render: (_, row) => `${row.cliente_vehiculo_marca || ''} ${row.cliente_vehiculo_modelo || ''}`.trim() || '-' },
    { key: 'cliente_vehiculo_placa', label: 'Placa' },
    { key: 'fecha_ingreso', label: 'Ingreso', render: (val) => formatDateTime(val) },
    { key: 'estado', label: 'Estado', render: (_, row) => <EstadoTallerBadge estado={row.estados_orden_taller?.nombre_estado || row.id_estado} /> },
    { key: 'total_general', label: 'Total', render: (val) => formatCurrency(val), align: 'right' },
    { key: 'acciones', label: 'Acciones', render: (_, row) => (
      <button onClick={() => handleViewDetail(row)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors">
        <Eye className="w-4 h-4" />
      </button>
    )}
  ]

  const validateForm = () => {
    const errors = {}
    if (!formData.cliente_nombre.trim()) errors.cliente_nombre = 'El nombre del cliente es requerido'
    if (!formData.descripcion_falla.trim()) errors.descripcion_falla = 'Describe la falla del vehículo'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      await crearOrden({
        ...formData,
        numero_orden: `OT-${Date.now()}`,
        id_usuario_solicita: 1,
        id_estado: 1
      })
      toast.success('Orden de taller creada exitosamente')
      setShowModal(false)
      setFormData({
        cliente_nombre: '', cliente_telefono: '', cliente_vehiculo_marca: '',
        cliente_vehiculo_modelo: '', cliente_vehiculo_placa: '', kilometraje: '', descripcion_falla: ''
      })
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleViewDetail = async (orden) => {
    setDetailLoading(true)
    try {
      const detalle = await getOrden(orden.id_orden)
      setSelectedOrden(detalle)
      setShowDetail(true)
    } catch (err) {
      toast.error('Error al cargar detalle')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleEstadoChange = async (orden, nuevoEstado) => {
    try {
      await editarOrden(orden.id_orden, { id_estado: nuevoEstado })
      toast.success('Estado actualizado')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Órdenes de Taller</h2>
          <p className="text-sm text-gray-500">{total} órdenes | {ordenesActivas.length} activas</p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>Nueva Orden</Button>
      </div>

      {error && <Alert type="error" title="Error" message={error} dismissible />}

      {/* Órdenes activas */}
      {ordenesActivas.length > 0 && (
        <Card title="Órdenes Activas" icon={Wrench} subtitle={`${ordenesActivas.length} en proceso`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ordenesActivas.slice(0, 6).map((orden) => (
              <div key={orden.id_orden} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-900">{orden.numero_orden}</span>
                  <EstadoTallerBadge estado={orden.nombre_estado} />
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{orden.cliente_nombre}</p>
                <p className="text-xs text-gray-500 truncate">{orden.vehiculo} - {orden.placa}</p>
                <p className="text-xs text-gray-400 mt-1">Desde: {formatDate(orden.fecha_ingreso)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Buscar por orden, cliente o placa..." />
        </div>
        <Select
          options={[{ value: '', label: 'Todos los estados' }, ...estadoOptions]}
          value={filtroEstado}
          onChange={(e) => { setFiltroEstado(e.target.value); setPage(1) }}
          className="sm:w-48"
        />
      </div>

      {/* Table */}
      <Card>
        <Table columns={columns} data={ordenes} loading={loading} emptyMessage="No se encontraron órdenes de taller" />
        <Pagination currentPage={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} />
      </Card>

      {/* Modal Nueva Orden */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Orden de Taller" icon={Wrench} size="lg"
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button><Button onClick={handleSubmit} loading={loading}>Crear Orden</Button></div>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre del Cliente" value={formData.cliente_nombre} onChange={(e) => setFormData({ ...formData, cliente_nombre: e.target.value })} error={formErrors.cliente_nombre} />
            <Input label="Teléfono" value={formData.cliente_telefono} onChange={(e) => setFormData({ ...formData, cliente_telefono: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Marca" value={formData.cliente_vehiculo_marca} onChange={(e) => setFormData({ ...formData, cliente_vehiculo_marca: e.target.value })} />
            <Input label="Modelo" value={formData.cliente_vehiculo_modelo} onChange={(e) => setFormData({ ...formData, cliente_vehiculo_modelo: e.target.value })} />
            <Input label="Placa" value={formData.cliente_vehiculo_placa} onChange={(e) => setFormData({ ...formData, cliente_vehiculo_placa: e.target.value })} />
          </div>
          <Input label="Kilometraje" type="number" value={formData.kilometraje} onChange={(e) => setFormData({ ...formData, kilometraje: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción de la Falla</label>
            <textarea
              value={formData.descripcion_falla}
              onChange={(e) => setFormData({ ...formData, descripcion_falla: e.target.value })}
              className="input-field min-h-[100px]"
              placeholder="Describe el problema reportado por el cliente..."
            />
            {formErrors.descripcion_falla && <p className="mt-1 text-sm text-danger-600">{formErrors.descripcion_falla}</p>}
          </div>
        </form>
      </Modal>

      {/* Modal Detalle */}
      <Modal isOpen={showDetail} onClose={() => { setShowDetail(false); setSelectedOrden(null) }} title={`Orden ${selectedOrden?.numero_orden || ''}`} icon={Wrench} size="lg"
        footer={
          selectedOrden && (
            <div className="flex justify-end gap-3">
              <Select
                options={estadoOptions}
                value={selectedOrden.id_estado}
                onChange={(e) => handleEstadoChange(selectedOrden, e.target.value)}
                className="w-48"
              />
            </div>
          )
        }
      >
        {detailLoading ? (
          <p className="text-center text-gray-500 py-8">Cargando detalle...</p>
        ) : selectedOrden ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Cliente</p>
                <p className="text-sm font-medium text-gray-900">{selectedOrden.cliente_nombre}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Teléfono</p>
                <p className="text-sm font-medium text-gray-900">{selectedOrden.cliente_telefono || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Vehículo</p>
                <p className="text-sm font-medium text-gray-900">{selectedOrden.cliente_vehiculo_marca} {selectedOrden.cliente_vehiculo_modelo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Placa</p>
                <p className="text-sm font-medium text-gray-900">{selectedOrden.cliente_vehiculo_placa || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Kilometraje</p>
                <p className="text-sm font-medium text-gray-900">{selectedOrden.kilometraje ? `${selectedOrden.kilometraje} km` : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Estado</p>
                <EstadoTallerBadge estado={selectedOrden.estados_orden_taller?.nombre_estado} />
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Falla Reportada</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedOrden.descripcion_falla}</p>
            </div>

            {selectedOrden.repuestos?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Repuestos Utilizados</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-500 font-medium">Producto</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Cant.</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Precio</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrden.repuestos.map((r, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2">{r.productos?.nombre_producto}</td>
                        <td className="py-2 text-right">{r.cantidad}</td>
                        <td className="py-2 text-right">{formatCurrency(r.precio_unitario)}</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(r.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end border-t border-gray-200 pt-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Mano de Obra: {formatCurrency(selectedOrden.total_mano_obra)}</p>
                <p className="text-sm text-gray-500">Repuestos: {formatCurrency(selectedOrden.total_repuestos)}</p>
                <p className="text-lg font-bold text-gray-900">Total: {formatCurrency(selectedOrden.total_general)}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No se pudo cargar el detalle</p>
        )}
      </Modal>
    </div>
  )
}

