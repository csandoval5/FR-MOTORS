import { useState } from 'react'
import { Users, Plus, Edit3, Trash2, Mail, Phone, MapPin } from 'lucide-react'
import { useClientes } from '../hooks/useClientes'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import Button from '../components/ui/Button'
import SearchBar from '../components/ui/SearchBar'
import Pagination from '../components/ui/Pagination'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Alert from '../components/ui/Alert'
import toast from 'react-hot-toast'

/**
 * Página de gestión de clientes
 * CRUD completo de clientes para la facturación del POS
 */
export default function ClientesPage() {
const {
    clientes, total, loading, error, search, page,
    setPage, setSearch, totalPages,
    crearCliente, editarCliente, eliminarCliente, verificarIdentificacion
  } = useClientes()

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    nombre_completo: '',
    tipo_identificacion: 'CEDULA',
    numero_identificacion: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: 'El Coca'
  })
  const [formErrors, setFormErrors] = useState({})

  const tipoIdentOptions = [
    { value: 'CEDULA', label: 'Cédula' },
    { value: 'RUC', label: 'RUC' },
    { value: 'PASAPORTE', label: 'Pasaporte' }
  ]

  const clienteColumns = [
    { key: 'nombre_completo', label: 'Cliente' },
    { key: 'tipo_identificacion', label: 'Tipo', render: (val) => (
      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{val}</span>
    ) },
    { key: 'numero_identificacion', label: 'Identificación' },
    { key: 'telefono', label: 'Teléfono', render: (val) => val || '—' },
    { key: 'email', label: 'Email', render: (val) => val ? (
      <span className="flex items-center gap-1 text-gray-600"><Mail className="w-3.5 h-3.5" />{val}</span>
    ) : '—' },
    { key: 'ciudad', label: 'Ciudad', render: (val) => val || '—' },
    { key: 'acciones', label: 'Acciones', render: (_, row) => (
      <div className="flex items-center gap-2">
        <button onClick={() => handleEdit(row)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors" title="Editar">
          <Edit3 className="w-4 h-4" />
        </button>
        <button onClick={() => handleDelete(row)} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-600 transition-colors" title="Eliminar">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )}
  ]

  const validateForm = async () => {
    const errors = {}
    if (!formData.nombre_completo.trim()) errors.nombre_completo = 'El nombre es requerido'
    if (!formData.numero_identificacion.trim()) errors.numero_identificacion = 'La identificación es requerida'
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Email inválido'

    // Verificar unicidad de identificación (omitiendo el cliente "Consumidor Final" 0000000000)
    if (formData.numero_identificacion.trim() && formData.numero_identificacion.trim() !== '0000000000') {
      try {
        const existe = await verificarIdentificacion(formData.numero_identificacion.trim(), editing?.id_cliente)
        if (existe) errors.numero_identificacion = 'Este número de identificación ya existe'
      } catch (err) {
        console.error('Error al verificar identificación:', err)
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!(await validateForm())) return
    try {
      if (editing) {
        await editarCliente(editing.id_cliente, formData)
        toast.success('Cliente actualizado correctamente')
      } else {
        await crearCliente(formData)
        toast.success('Cliente creado correctamente')
      }
      setShowModal(false)
      resetForm()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleEdit = (cliente) => {
    setEditing(cliente)
    setFormData({
      nombre_completo: cliente.nombre_completo,
      tipo_identificacion: cliente.tipo_identificacion || 'CEDULA',
      numero_identificacion: cliente.numero_identificacion,
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || 'El Coca'
    })
    setShowModal(true)
  }

  const handleDelete = async (cliente) => {
    if (!window.confirm(`¿Desactivar al cliente "${cliente.nombre_completo}"?`)) return
    try {
      await eliminarCliente(cliente.id_cliente)
      toast.success('Cliente desactivado')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const resetForm = () => {
    setEditing(null)
    setFormData({
      nombre_completo: '',
      tipo_identificacion: 'CEDULA',
      numero_identificacion: '',
      telefono: '',
      email: '',
      direccion: '',
      ciudad: 'El Coca'
    })
    setFormErrors({})
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Clientes</h2>
          <p className="text-sm text-gray-500">{total} clientes registrados</p>
        </div>
        <Button icon={Plus} onClick={() => { resetForm(); setShowModal(true) }}>
          Nuevo Cliente
        </Button>
      </div>

      {error && <Alert type="error" title="Error" message={error} dismissible />}

      <SearchBar
        value={search}
        onChange={(v) => { setSearch(v); setPage(1) }}
        placeholder="Buscar por nombre, identificación, email o teléfono..."
      />

      <Card>
        <Table
          columns={clienteColumns}
          data={clientes}
          loading={loading}
          emptyMessage="No se encontraron clientes"
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          onPageChange={setPage}
        />
      </Card>

      {/* Modal Cliente */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Editar Cliente' : 'Nuevo Cliente'}
        icon={Users}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} loading={loading}>
              {editing ? 'Guardar Cambios' : 'Crear Cliente'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre Completo"
            value={formData.nombre_completo}
            onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
            error={formErrors.nombre_completo}
            placeholder="Nombre y apellidos del cliente"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Tipo de Identificación"
              options={tipoIdentOptions}
              value={formData.tipo_identificacion}
              onChange={(e) => setFormData({ ...formData, tipo_identificacion: e.target.value })}
            />
            <Input
              label="Número de Identificación"
              value={formData.numero_identificacion}
              onChange={(e) => setFormData({ ...formData, numero_identificacion: e.target.value })}
              error={formErrors.numero_identificacion}
              placeholder="Cédula, RUC o pasaporte"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="Ej: 0987654321"
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
              placeholder="cliente@email.com"
            />
          </div>

          <Input
            label="Dirección"
            value={formData.direccion}
            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            placeholder="Dirección del cliente"
          />

          <Input
            label="Ciudad"
            value={formData.ciudad}
            onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
            placeholder="El Coca"
          />
        </form>
      </Modal>
    </div>
  )
}
