import { supabase } from './supabaseClient'

/**
 * Servicio de Arqueo de Caja para FR MOTORS
 * Apertura, cierre, movimientos del día
 */

const TABLE_ARQUEO = 'arqueo_caja'
const TABLE_MOVIMIENTOS = 'movimientos_caja'

/**
 * Obtener arqueos de caja (historial)
 */
export const getArqueos = async ({ page = 1, pageSize = 20 } = {}) => {
  let query = supabase
    .from(TABLE_ARQUEO)
    .select(`
      *,
      usuarios!arqueo_caja_id_usuario_apertura_fkey (
        nombre_completo,
        email
      )
    `, { count: 'exact' })

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('fecha_apertura', { ascending: false })
    .range(from, to)

  if (error) throw new Error(`Error al obtener arqueos: ${error.message}`)
  return { data, total: count, page, pageSize }
}

/**
 * Obtener arqueo activo (abierto) del usuario
 */
export const getArqueoActivo = async (userId) => {
  const { data, error } = await supabase
    .from(TABLE_ARQUEO)
    .select('*')
    .eq('id_usuario_apertura', userId)
    .eq('estado', 'ABIERTO')
    .maybeSingle()

  if (error) throw new Error(`Error al obtener arqueo activo: ${error.message}`)
  return data
}

/**
 * Abrir caja (nuevo arqueo)
 */
export const abrirCaja = async (apertura) => {
  const { data, error } = await supabase
    .from(TABLE_ARQUEO)
    .insert([{
      ...apertura,
      estado: 'ABIERTO'
    }])
    .select()
    .single()

  if (error) throw new Error(`Error al abrir caja: ${error.message}`)
  return data
}

/**
 * Cerrar caja
 */
export const cerrarCaja = async (id, cierre) => {
  const { data, error } = await supabase
    .from(TABLE_ARQUEO)
    .update({
      ...cierre,
      estado: 'CERRADO',
      fecha_cierre: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id_arqueo', id)
    .select()
    .single()

  if (error) throw new Error(`Error al cerrar caja: ${error.message}`)
  return data
}

/**
 * Obtener movimientos de un arqueo
 */
export const getMovimientos = async (arqueoId) => {
  const { data, error } = await supabase
    .from(TABLE_MOVIMIENTOS)
    .select('*')
    .eq('id_arqueo', arqueoId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Error al obtener movimientos: ${error.message}`)
  return data
}

/**
 * Registrar un movimiento de caja
 */
export const createMovimiento = async (movimiento) => {
  const { data, error } = await supabase
    .from(TABLE_MOVIMIENTOS)
    .insert([movimiento])
    .select()
    .single()

  if (error) throw new Error(`Error al registrar movimiento: ${error.message}`)
  return data
}

/**
 * Obtener resumen de caja del día (para dashboard)
 */
export const getResumenCajaDelDia = async () => {
  const hoy = new Date().toISOString().split('T')[0]

  const { data: arqueoDelDia, error: arqueoError } = await supabase
    .from(TABLE_ARQUEO)
    .select('*')
    .gte('fecha_apertura', hoy)
    .lte('fecha_apertura', `${hoy}T23:59:59`)
    .order('fecha_apertura', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (arqueoError) throw new Error(`Error al obtener caja del día: ${arqueoError.message}`)

  if (!arqueoDelDia) {
    return { abierto: false, saldo_inicial: 0 }
  }

  const movimientos = await getMovimientos(arqueoDelDia.id_arqueo)

  const ingresos = movimientos
    .filter(m => m.tipo_movimiento === 'INGRESO')
    .reduce((sum, m) => sum + Number(m.monto), 0)

  const egresos = movimientos
    .filter(m => m.tipo_movimiento === 'EGRESO')
    .reduce((sum, m) => sum + Number(m.monto), 0)

  return {
    abierto: arqueoDelDia.estado === 'ABIERTO',
    arqueo: arqueoDelDia,
    movimientos,
    saldo_inicial: Number(arqueoDelDia.saldo_inicial),
    ingresos,
    egresos,
    saldo_actual: Number(arqueoDelDia.saldo_inicial) + ingresos - egresos
  }
}

