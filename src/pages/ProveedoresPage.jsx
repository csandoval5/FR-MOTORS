import { useState } from 'react'
import { Truck, Plus, Edit3, Trash2, Mail, Phone, MapPin, UserRound } from 'lucide-react'
import { useProveedores } from '../hooks/useProveedores'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import Button from '../components/ui/Button'
import SearchBar from '../components/ui/SearchBar'
import Pagination from '../components/ui/Pagination'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import Alert from '../components/ui/Alert'
import toast from 'react-hot-toast'

/**
 * Página de gestión de proveedores
 * CRUD completo de proveedores para el inventario
 *
 * Tabla: proveedores (razon_social, ruc_cedula, nombre_contacto, telefono,
 * email, direccion, ciudad, productos_suministra, activo, creado_en)
 */
export default function ProveedoresPage() {
  const {
    proveedores, total, loading, error, search, page, totalPages,
    setPage, setSearch,
    crearProveedor, editarProveedor, eliminarProveedor, verificarRuc
  } = useProveedores()

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    razon_social: '',
    ruc_cedula: '',
    nombre_contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: 'El Coca',
    productos_suministra: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [saveLoading, setSaveLoading] = useState(false)

  const proveedorColumns = [
    { key: 'id_proveedor', label: 'ID', render: (val) => <span className="font-mono text-xs text-gray-500">#{val}</span> },
    { key: 'razon_social', label: 'Razón Social', render: (val, row) => (
      <div>
        <p className="font-medium text-gray-900">{val}</p>
        {row.email && <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{row.email}</p>}
      </div>
    ) },
    { key: 'ruc_cedula', label: 'RUC/Cédula', render: (val) => <span className="font-mono text-xs text-gray-700">{val}</span> },
    { key: 'nombre_contacto', label: 'Contacto', render: (val) => val ? (
      <span className="flex items-center gap-1 text-gray-700"><UserRound className="w-3.5 h-3.5 text-gray-400" />{val}</span>
    ) : '—' },
    { key: 'telefono', label: 'Teléfono', render: (val) => val ? (
      <span className="flex items-center gap-1 text-gray-700"><Phone className="w-3.5 h-3.5 text-gray-400" />{val}</span>
    ) : '—' },
    { key: 'ciudad', label: 'Ciudad', render: (val) => val ? (
      <span className="flex items-center gap-1 text-gray-700"><MapPin className="w-3.5 h-3.5 text-gray-400" />{val}</span>
    ) : '—' },
    { key: 'activo', label: 'Estado', render: (val) => (
      <Badge variant={val ? 'success' : 'danger'} dot>{val ? 'Activo' : 'Inactivo'}</Badge>
    ) },
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

  // ====== Validaciones ======
  const validarCedulaEcuatoriana = (val) => {
    if (!val || val.length !== 10 || !/^\d{10}$/.test(val)) return false
    // Verificación simple del dígito verificador
    const prov = parseInt(val.substring(0, 2), 10)
    if (prov < 1 || prov > 24) return false
    const digitoVerificador = parseInt(val[9], 10)
    const pesos = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    let suma = 0
    for (let i = 0; i < 9; i++) {
      let num = parseInt(val[i], 10) * pesos[i]
      if (num > 9) num -= 9
      suma += num
    }
    const residuo = suma % 10
    const digitoEsperado = residuo === 0 ? 0 : 10 - residuo
    return digitoVerificador === digitoEsperado
  }

  const validarRuc = (val) => {
    if (!val) return false
    // RUC: 13 dígitos
    if (val.length === 10) return validarCedulaEcuatoriana(val)
    if (val.length === 13) {
      // Últimos 3 dígitos del RUC son de establecimiento
      const cedula = val.substring(0, 10)
      return validarCedulaEcuatoriana(cedula)
    }
    return false
  }

  const validateForm = async () => {
    const errors = {}
    if (!formData.razon_social.trim()) {
      errors.razon_social = 'La razón social es requerida'
    } else if (formData.razon_social.trim().length < 3) {
      errors.razon_social = 'La razón social debe tener al menos 3 caracteres'
    }

    if (!formData.ruc_cedula.trim()) {
      errors.ruc_cedula = 'El RUC/Cédula es requerido'
    } else if (!validarRuc(formData.ruc_cedula.trim())) {
      errors.ruc_cedula = 'RUC/Cédula ecuatoriano no válido (10 o 13 dígitos)'
    } else {
      try {
        const existe = await verificarRuc(formData.ruc_cedula.trim(), editing?.id_proveedor)
        if (existe) errors.ruc_cedula = 'Este RUC/Cédula ya está registrado'
      } catch (err) {
        console.error('Error al verificar RUC:', err)
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido'
    }

    if (formData.telefono && formData.telefono.length < 7) {
      errors.telefono = 'Teléfono inválido'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

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
        razon_social: formData.razon_social.trim(),
        ruc_cedula: formData.ruc_cedula.trim(),
        nombre_contacto: formData.nombre_contacto.trim() || null,
        telefono: formData.telefono.trim() || null,
        email: formData.email.trim() || null,
        direccion: formData.direccion.trim() || null,
        ciudad: formData.ciudad.trim() || 'El Coca',
        productos_suministra: formData.productos_suministra.trim() || null
      }
      if (editing) {
        await editarProveedor(editing.id_proveedor, payload)
        toast.success('Proveedor actualizado correctamente')
      } else {
        await crearProveedor(payload)
        toast.success('Proveedor creado correctamente')
      }
      setShowModal(false)
      resetForm()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaveLoading(false)
    }
  }

  const handleEdit = (proveedor) => {
    setEditing(proveedor)
    setFormData({
      razon_social: proveedor.razon_social || '',
      ruc_cedula: proveedor.ruc_cedula || '',
      nombre_contacto: proveedor.nombre_contacto || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      direccion: proveedor.direccion || '',
      ciudad: proveedor.ciudad || 'El Coca',
      productos_suministra: proveedor.productos_suministra || ''
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleDelete = async (proveedor) => {
    if (!window.confirm(`¿Desactivar al proveedor "${proveedor.razon_social}"?\n\nSe ocultará del listado y no podrá asignarse a nuevos productos.`)) return
    try {
      await eliminarProveedor(proveedor.id_proveedor)
      toast.success('Proveedor desactivado')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const resetForm = () => {
    setEditing(null)
    setFormData({
      razon_social: '',
      ruc_cedula: '',
      nombre_contacto: '',
      telefono: '',
      email: '',
      direccion: '',
      ciudad: 'El Coca',
      productos_suministra: ''
    })
    setFormErrors({})
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary-600" />
            Proveedores
          </h1>
          <p className="text-sm text-gray-500">{total} proveedores registrados</p>
        </div>
        <Button icon={Plus} onClick={() => { resetForm(); setShowModal(true) }}>
          Nuevo Proveedor
        </Button>
      </div>

      {error && <Alert type="error" title="Error" message={error} dismissible />}

      <SearchBar
        value={search}
        onChange={(v) => { setSearch(v); setPage(1) }}
        placeholder="Buscar por razón social, RUC/Cédula o contacto..."
      />

      <Card>
        <Table
          columns={proveedorColumns}
          data={proveedores}
          loading={loading}
          emptyMessage="No se encontraron proveedores"
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          onPageChange={setPage}
        />
      </Card>

      {/* Modal Crear/Editar Proveedor */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        subtitle={editing ? `RUC/Cédula: ${editing.ruc_cedula}` : 'Registra un nuevo proveedor'}
        icon={Truck}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} loading={saveLoading} icon={editing ? Edit3 : Plus}>
              {editing ? 'Guardar Cambios' : 'Crear Proveedor'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Razón Social *"
            value={formData.razon_social}
            onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
            error={formErrors.razon_social}
            placeholder="Nombre de la empresa o persona"
          />
          <Input
            label="RUC / Cédula *"
            value={formData.ruc_cedula}
            onChange={(e) => setFormData({ ...formData, ruc_cedula: e.target.value.replace(/\D/g, '') })}
            error={formErrors.ruc_cedula}
            placeholder="10 o 13 dígitos"
            helperText="Debe ser un RUC (13 dígitos) o cédula (10 dígitos) ecuatoriano válido"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre del Contacto"
              value={formData.nombre_contacto}
              onChange={(e) => setFormData({ ...formData, nombre_contacto: e.target.value })}
              placeholder="Persona de contacto"
            />
            <Input
              label="Teléfono"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              error={formErrors.telefono}
              placeholder="Ej: 0987654321"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
              placeholder="proveedor@email.com"
            />
            <Input
              label="Ciudad"
              value={formData.ciudad}
              onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
              placeholder="El Coca"
            />
          </div>

          <Input
            label="Dirección"
            value={formData.direccion}
            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            placeholder="Dirección del proveedor"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Productos que Suministra</label>
            <textarea
              value={formData.productos_suministra}
              onChange={(e) => setFormData({ ...formData, productos_suministra: e.target.value })}
              rows="3"
              placeholder="Ej: Repuestos, aceites, filtros, baterías..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
