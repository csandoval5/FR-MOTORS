import { useState } from 'react'
import { Users, Plus, Shield, Edit3, Trash2 } from 'lucide-react'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

/**
 * Página de gestión de usuarios (solo Admin)
 */
export default function UsuariosPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    password: '',
    id_rol: ''
  })
  const [formErrors, setFormErrors] = useState({})

  const roles = [
    { value: 1, label: 'Administrador' },
    { value: 2, label: 'Vendedor' },
    { value: 3, label: 'Mecánico' }
  ]

  // Datos mock
  const [usuarios, setUsuarios] = useState([
    { id_usuario: 1, nombres: 'Admin', apellidos: 'FR Motors', email: 'admin@frmotors.com', telefono: '0999999999', id_rol: 1, activo: true, roles: { nombre_rol: 'Administrador', nivel_acceso: 100 } },
    { id_usuario: 2, nombres: 'Juan', apellidos: 'Pérez', email: 'empleado@frmotors.com', telefono: '0988888888', id_rol: 2, activo: true, roles: { nombre_rol: 'Vendedor', nivel_acceso: 50 } },
    { id_usuario: 3, nombres: 'Carlos', apellidos: 'López', email: 'mecanico@frmotors.com', telefono: '0977777777', id_rol: 3, activo: true, roles: { nombre_rol: 'Mecánico', nivel_acceso: 30 } }
  ])

  const columns = [
    { key: 'nombres', label: 'Usuario', render: (_, row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-primary-700">{row.nombres.charAt(0)}{row.apellidos.charAt(0)}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{row.nombres} {row.apellidos}</p>
          <p className="text-xs text-gray-500">{row.email}</p>
        </div>
      </div>
    )},
    { key: 'roles', label: 'Rol', render: (val) => (
      <Badge variant={val?.nombre_rol === 'Administrador' ? 'info' : val?.nombre_rol === 'Vendedor' ? 'success' : 'warning'}>
        {val?.nombre_rol}
      </Badge>
    )},
    { key: 'telefono', label: 'Teléfono' },
    { key: 'activo', label: 'Estado', render: (val) => (
      <Badge variant={val ? 'success' : 'danger'} dot>{val ? 'Activo' : 'Inactivo'}</Badge>
    )},
    { key: 'acciones', label: 'Acciones', render: (_, row) => (
      <div className="flex items-center gap-2">
        <button onClick={() => handleEdit(row)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
        <button onClick={() => handleDelete(row)} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    )}
  ]

  const validateForm = () => {
    const errors = {}
    if (!formData.nombres.trim()) errors.nombres = 'Requerido'
    if (!formData.apellidos.trim()) errors.apellidos = 'Requerido'
    if (!formData.email.trim()) errors.email = 'Requerido'
    if (!formData.id_rol) errors.id_rol = 'Selecciona un rol'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const nuevoUsuario = {
        id_usuario: editing ? editing.id_usuario : Date.now(),
        ...formData,
        activo: true,
        roles: roles.find(r => r.value === Number(formData.id_rol))
      }

      if (editing) {
        setUsuarios(prev => prev.map(u => u.id_usuario === editing.id_usuario ? { ...u, ...formData, roles: roles.find(r => r.value === Number(formData.id_rol)) } : u))
        toast.success('Usuario actualizado')
      } else {
        setUsuarios(prev => [...prev, { ...nuevoUsuario, roles: { nombre_rol: roles.find(r => r.value === Number(formData.id_rol)).label } }])
        toast.success('Usuario creado')
      }
      setShowModal(false)
      resetForm()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleEdit = (usuario) => {
    setEditing(usuario)
    setFormData({
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      telefono: usuario.telefono || '',
      password: '',
      id_rol: usuario.id_rol
    })
    setShowModal(true)
  }

  const handleDelete = (usuario) => {
    if (!window.confirm(`¿Desactivar usuario "${usuario.nombres} ${usuario.apellidos}"?`)) return
    setUsuarios(prev => prev.map(u => u.id_usuario === usuario.id_usuario ? { ...u, activo: false } : u))
    toast.success('Usuario desactivado')
  }

  const resetForm = () => {
    setEditing(null)
    setFormData({ nombres: '', apellidos: '', email: '', telefono: '', password: '', id_rol: '' })
    setFormErrors({})
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Usuarios del Sistema</h2>
          <p className="text-sm text-gray-500">{usuarios.filter(u => u.activo).length} usuarios activos</p>
        </div>
        <Button icon={Plus} onClick={() => { resetForm(); setShowModal(true) }}>Nuevo Usuario</Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={usuarios.filter(u => u.activo)}
          emptyMessage="No hay usuarios registrados"
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Editar Usuario' : 'Nuevo Usuario'}
        icon={Users}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} loading={loading}>{editing ? 'Guardar Cambios' : 'Crear Usuario'}</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombres" value={formData.nombres} onChange={(e) => setFormData({ ...formData, nombres: e.target.value })} error={formErrors.nombres} />
            <Input label="Apellidos" value={formData.apellidos} onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })} error={formErrors.apellidos} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} error={formErrors.email} />
            <Input label="Teléfono" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
          </div>
          {!editing && (
            <Input label="Contraseña" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
          )}
          <Select label="Rol" options={roles} value={formData.id_rol} onChange={(e) => setFormData({ ...formData, id_rol: e.target.value })} error={formErrors.id_rol} />
        </form>
      </Modal>
    </div>
  )
}

