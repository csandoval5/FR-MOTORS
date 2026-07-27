import { useState, useEffect, useCallback } from 'react'
import { Wallet, Plus, Minus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Table from '../components/ui/Table'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDateTime } from '../utils/formatDate'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

/**
 * Página de arqueo de caja
 * Nota: En entorno de desarrollo usa datos mock
 */
export default function CajaPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showApertura, setShowApertura] = useState(false)
  const [showMovimiento, setShowMovimiento] = useState(false)
  const [tipoMovimiento, setTipoMovimiento] = useState('INGRESO')
  const [montoMovimiento, setMontoMovimiento] = useState('')
  const [conceptoMovimiento, setConceptoMovimiento] = useState('')
  const [saldoInicial, setSaldoInicial] = useState('')

  // Estado mock para desarrollo
  const [cajaState, setCajaState] = useState({
    abierto: false,
    saldo_inicial: 0,
    ingresos: 0,
    egresos: 0,
    saldo_actual: 0,
    movimientos: []
  })

  const handleAbrirCaja = async (e) => {
    e.preventDefault()
    if (!saldoInicial || Number(saldoInicial) < 0) {
      toast.error('Ingresa un saldo inicial válido')
      return
    }
    setCajaState({
      abierto: true,
      saldo_inicial: Number(saldoInicial),
      ingresos: 0,
      egresos: 0,
      saldo_actual: Number(saldoInicial),
      movimientos: [{
        id: 1,
        tipo_movimiento: 'APERTURA',
        concepto: 'Apertura de caja',
        monto: Number(saldoInicial),
        created_at: new Date().toISOString()
      }]
    })
    setShowApertura(false)
    toast.success('Caja abierta exitosamente')
  }

  const handleRegistrarMovimiento = (e) => {
    e.preventDefault()
    if (!montoMovimiento || Number(montoMovimiento) <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }
    if (!conceptoMovimiento.trim()) {
      toast.error('Ingresa un concepto')
      return
    }

    const monto = Number(montoMovimiento)
    const newMov = {
      id: Date.now(),
      tipo_movimiento: tipoMovimiento,
      concepto: conceptoMovimiento,
      monto,
      created_at: new Date().toISOString()
    }

    setCajaState(prev => ({
      ...prev,
      ingresos: prev.ingresos + (tipoMovimiento === 'INGRESO' ? monto : 0),
      egresos: prev.egresos + (tipoMovimiento === 'EGRESO' ? monto : 0),
      saldo_actual: prev.saldo_actual + (tipoMovimiento === 'INGRESO' ? monto : -monto),
      movimientos: [newMov, ...prev.movimientos]
    }))

    setShowMovimiento(false)
    setMontoMovimiento('')
    setConceptoMovimiento('')
    toast.success('Movimiento registrado')
  }

  const handleCerrarCaja = () => {
    if (!window.confirm('¿Estás seguro de cerrar la caja?')) return
    setCajaState(prev => ({
      ...prev,
      abierto: false
    }))
    toast.success('Caja cerrada exitosamente')
  }

  const columns = [
    { key: 'created_at', label: 'Hora', render: (val) => formatDateTime(val) },
    { key: 'tipo_movimiento', label: 'Tipo', render: (val) => (
      <Badge variant={val === 'INGRESO' || val === 'APERTURA' ? 'success' : 'danger'}>
        {val === 'INGRESO' ? 'Ingreso' : val === 'EGRESO' ? 'Egreso' : 'Apertura'}
      </Badge>
    )},
    { key: 'concepto', label: 'Concepto' },
    { key: 'monto', label: 'Monto', render: (val, row) => (
      <span className={`font-medium ${row.tipo_movimiento === 'INGRESO' || row.tipo_movimiento === 'APERTURA' ? 'text-secondary-600' : 'text-danger-600'}`}>
        {(row.tipo_movimiento === 'INGRESO' || row.tipo_movimiento === 'APERTURA' ? '+' : '-')}{formatCurrency(val)}
      </span>
    ), align: 'right'}
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Arqueo de Caja</h2>
          <p className="text-sm text-gray-500">
            Estado: {cajaState.abierto ? (
              <Badge variant="success" dot>Caja Abierta</Badge>
            ) : (
              <Badge variant="default" dot>Caja Cerrada</Badge>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {!cajaState.abierto ? (
            <Button icon={Wallet} onClick={() => setShowApertura(true)}>Abrir Caja</Button>
          ) : (
            <>
              <Button icon={Plus} variant="secondary" onClick={() => { setTipoMovimiento('INGRESO'); setShowMovimiento(true) }}>
                Registrar Ingreso
              </Button>
              <Button icon={Minus} variant="secondary" onClick={() => { setTipoMovimiento('EGRESO'); setShowMovimiento(true) }}>
                Registrar Egreso
              </Button>
              <Button variant="danger" onClick={handleCerrarCaja}>Cerrar Caja</Button>
            </>
          )}
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Saldo Inicial</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(cajaState.saldo_inicial)}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ingresos</p>
              <p className="text-2xl font-bold text-secondary-600">{formatCurrency(cajaState.ingresos)}</p>
            </div>
            <div className="p-3 bg-secondary-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-secondary-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Egresos</p>
              <p className="text-2xl font-bold text-danger-600">{formatCurrency(cajaState.egresos)}</p>
            </div>
            <div className="p-3 bg-danger-50 rounded-xl">
              <TrendingDown className="w-6 h-6 text-danger-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Saldo Actual</p>
              <p className="text-2xl font-bold text-primary-600">{formatCurrency(cajaState.saldo_actual)}</p>
            </div>
            <div className="p-3 bg-primary-50 rounded-xl">
              <Wallet className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Movimientos */}
      <Card title="Movimientos del Día" icon={Wallet}>
        <Table
          columns={columns}
          data={cajaState.movimientos}
          emptyMessage="No hay movimientos registrados hoy"
        />
      </Card>

      {/* Modal Apertura */}
      <Modal isOpen={showApertura} onClose={() => setShowApertura(false)} title="Abrir Caja" icon={Wallet}
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowApertura(false)}>Cancelar</Button><Button onClick={handleAbrirCaja}>Abrir Caja</Button></div>}
      >
        <form onSubmit={handleAbrirCaja} className="space-y-4">
          <Input
            label="Saldo Inicial"
            type="number"
            step="0.01"
            value={saldoInicial}
            onChange={(e) => setSaldoInicial(e.target.value)}
            placeholder="0.00"
            icon={DollarSign}
          />
          <p className="text-sm text-gray-500">Registra el monto en efectivo con el que se apertura la caja.</p>
        </form>
      </Modal>

      {/* Modal Movimiento */}
      <Modal isOpen={showMovimiento} onClose={() => setShowMovimiento(false)} title={tipoMovimiento === 'INGRESO' ? 'Registrar Ingreso' : 'Registrar Egreso'} icon={tipoMovimiento === 'INGRESO' ? TrendingUp : TrendingDown}
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowMovimiento(false)}>Cancelar</Button><Button onClick={handleRegistrarMovimiento} variant={tipoMovimiento === 'INGRESO' ? 'primary' : 'danger'}>Registrar</Button></div>}
      >
        <form onSubmit={handleRegistrarMovimiento} className="space-y-4">
          <Input
            label="Monto"
            type="number"
            step="0.01"
            value={montoMovimiento}
            onChange={(e) => setMontoMovimiento(e.target.value)}
            placeholder="0.00"
            icon={DollarSign}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Concepto</label>
            <textarea
              value={conceptoMovimiento}
              onChange={(e) => setConceptoMovimiento(e.target.value)}
              className="input-field min-h-[80px]"
              placeholder="Describe el motivo del movimiento..."
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}

