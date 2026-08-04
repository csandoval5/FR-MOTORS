import { useState } from 'react'
import { Truck, Plus, Edit3, Trash2, DollarSign } from 'lucide-react'
import { useProveedores } from '../hooks/useProveedores'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import Button from '../components/ui/Button'
import SearchBar from '../components/ui/SearchBar'
import Pagination from '../components/ui/Pagination'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import { EstadoCuentaBadge } from '../components/ui/Badge'
import Alert from '../components/ui/Alert'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'
import toast from 'react-hot-toast'

/**
 * Página de gestión de proveedores y cuentas por pagar
 */
export default function ProveedoresPage() {
  const {
    proveedores, total, loading, error, search, tiposIdentificacion,
    cuentasPagar, cuentasTotal, filtroEstado,
    setPage, setSearch, setFiltroEstado, totalPages,
    crearProveedor, editarProveedor, eliminarProveedor, fetchCuentasPagar, registrarAbono
  } = useProveedores()

  const [activeTab, setActiveTab] = useState('proveedores')
  const [showModal, setShowModal] = useState(false)
  const [showAbonoModal, setShowAbonoModal] = useState(false)
  const [selectedCuenta, setSelectedCuenta] = useState(null)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    razon_social: '',
    numero_identificacion: '',
    id_tipo_identificacion: '',
    telefono_principal: '',
    email: '',
    direccion: ''
  })
  const [abonoData, setAbonoData] = useState({ monto: '', id_metodo_pago: 'EFECTIVO' })
  const [formErrors, setFormErrors] = useState({})

  const tipoIdentOptions = tiposIdentificacion.map(t => ({ value: t.id_tipo_identificacion, label: `${t.codigo} - ${t.nombre}` }))

  const proveedorColumns = [
    { key: 'razon_social', label: 'Proveedor' },
    { key: 'numero_identificacion', label: 'Identificación' },
    { key: 'telefono_principal', label: 'Teléfono' },
    { key: 'email', label: 'Email' },
    { key: 'acciones', label: 'Acciones', render: (_, row) => (
      <div className="flex items-center gap-2">
        <button onClick={() => handleEdit(row)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
        <button onClick={() => handleDelete(row)} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    )}
  ]

  const cuentasColumns = [
    { key: 'proveedores', label: 'Proveedor', render: (_, row) => row.proveedores?.razon_social },
    { key: 'numero_documento', label: 'Documento' },
    { key: 'fecha_vencimiento', label: 'Vencimiento', render: (val) => formatDate(val) },
    { key: 'valor_original', label: 'Valor', render: (val) => formatCurrency(val), align: 'right' },
    { key: 'saldo_pendiente', label: 'Saldo', render: (val) => formatCurrency(val), align: 'right' },
    { key: 'estado', label: 'Estado', render: (val) => <EstadoCuentaBadge estado={val} /> },
    { key: 'acciones', label: 'Acciones', render: (_, row) => (
      row.estado !== 'PAGADA' && (
        <Button size="sm" variant="ghost" icon={DollarSign} onClick={() => openAbono(row)}>
          Abonar
        </Button>
      )
    )}
  ]

  const validateForm = () => {
    const errors = {}
    if (!formData.razon_social.trim()) errors.razon_social = 'La razón social es requerida'
    if (!formData.numero_identificacion.trim()) errors.numero_identificacion = 'La identificación es requerida'
    if (!formData.id_tipo_identificacion) errors.id_tipo_identificacion = 'Selecciona un tipo'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    try {
      if (editing) {
        await editarProveedor(editing.id_proveedor, formData)
        toast.success('Proveedor actualizado')
      } else {
        await crearProveedor(formData)
        toast.success('Proveedor creado')
      }
      setShowModal(false)
      resetForm()
    } catch (err) { toast.error(err.message) }
  }

  const handleEdit = (proveedor) => {
    setEditing(proveedor)
    setFormData({
      razon_social: proveedor.razon_social,
      numero_identificacion: proveedor.numero_identificacion,
      id_tipo_identificacion: proveedor.id_tipo_identificacion,
      telefono_principal: proveedor.telefono_principal || '',
      email: proveedor.email || '',
      direccion: proveedor.direccion || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (proveedor) => {
    if (!window.confirm(`¿Desactivar "${proveedor.razon_social}"?`)) return
    try {
      await eliminarProveedor(proveedor.id_proveedor)
      toast.success('Proveedor desactivado')
    } catch (err) { toast.error(err.message) }
  }

  const resetForm = () => {
    setEditing(null)
    setFormData({ razon_social: '', numero_identificacion: '', id_tipo_identificacion: '', telefono_principal: '', email: '', direccion: '' })
    setFormErrors({})
  }

  const openAbono = (cuenta) => {
    setSelectedCuenta(cuenta)
    setAbonoData({ monto: '', id_metodo_pago: 'EFECTIVO' })
    setShowAbonoModal(true)
  }

  const handleAbono = async (e) => {
    e.preventDefault()
    if (!abonoData.monto || Number(abonoData.monto) <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }
    try {
      await registrarAbono({
        id_cuenta_pagar: selectedCuenta.id_cuenta_pagar,
        monto_abono: Number(abonoData.monto),
        id_metodo_pago: 1,
        id_usuario: 1
      })
      toast.success('Abono registrado exitosamente')
      setShowAbonoModal(false)
      setSelectedCuenta(null)
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Proveedores</h2>
          <p className="text-sm text-gray-500">{total} proveedores registrados</p>
        </div>
        <Button icon={Plus} onClick={() => { resetForm(); setShowModal(true) }}>Nuevo Proveedor</Button>
      </div>

      {error && <Alert type="error" title="Error" message={error} dismissible />}

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('proveedores')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'proveedores' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Truck className="w-4 h-4 inline mr-2" />Proveedores
        </button>
        <button onClick={() => { setActiveTab('cuentas'); fetchCuentasPagar() }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'cuentas' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <DollarSign className="w-4 h-4 inline mr-2" />Cuentas por Pagar
        </button>
      </div>

      {activeTab === 'proveedores' ? (
        <>
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Buscar proveedores..." />
          <Card>
            <Table columns={proveedorColumns} data={proveedores} loading={loading} emptyMessage="No se encontraron proveedores" />
            <Pagination currentPage={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} />
          </Card>
        </>
      ) : (
        <Card>
          <Table columns={cuentasColumns} data={cuentasPagar} loading={loading} emptyMessage="No hay cuentas por pagar" />
          <Pagination currentPage={page} totalPages={totalPages} totalItems={cuentasTotal} onPageChange={setPage} />
        </Card>
      )}

      {/* Modal Proveedor */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Proveedor' : 'Nuevo Proveedor'} icon={Truck}
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button><Button onClick={handleSubmit} loading={loading}>{editing ? 'Guardar' : 'Crear'}</Button></div>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Razón Social" value={formData.razon_social} onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })} error={formErrors.razon_social} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tipo Identificación" options={tipoIdentOptions} value={formData.id_tipo_identificacion} onChange={(e) => setFormData({ ...formData, id_tipo_identificacion: e.target.value })} error={formErrors.id_tipo_identificacion} />
            <Input label="Número" value={formData.numero_identificacion} onChange={(e) => setFormData({ ...formData, numero_identificacion: e.target.value })} error={formErrors.numero_identificacion} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Teléfono" value={formData.telefono_principal} onChange={(e) => setFormData({ ...formData, telefono_principal: e.target.value })} />
            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <Input label="Dirección" value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} />
        </form>
      </Modal>

      {/* Modal Abono */}
      <Modal isOpen={showAbonoModal} onClose={() => setShowAbonoModal(false)} title="Registrar Abono" icon={DollarSign}
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowAbonoModal(false)}>Cancelar</Button><Button onClick={handleAbono} loading={loading}>Registrar Abono</Button></div>}
      >
        <form onSubmit={handleAbono} className="space-y-4">
          {selectedCuenta && (
            <div className="p-4 bg-gray-50 rounded-xl space-y-2">
              <p className="text-sm"><span className="text-gray-500">Proveedor:</span> <span className="font-medium">{selectedCuenta.proveedores?.razon_social}</span></p>
              <p className="text-sm"><span className="text-gray-500">Documento:</span> <span className="font-medium">{selectedCuenta.numero_documento}</span></p>
              <p className="text-sm"><span className="text-gray-500">Saldo Pendiente:</span> <span className="font-bold text-primary-600">{formatCurrency(selectedCuenta.saldo_pendiente)}</span></p>
            </div>
          )}
          <Input label="Monto del Abono" type="number" step="0.01" value={abonoData.monto} onChange={(e) => setAbonoData({ ...abonoData, monto: e.target.value })} placeholder="0.00" />
        </form>
      </Modal>
    </div>
  )
}

