import { supabase } from './supabaseClient'

/**
 * Servicio de Ventas/Facturación para FR MOTORS
 * POS, historial de ventas, facturación
 */

const TABLE_VENTAS = 'ventas'
const TABLE_DETALLE = 'detalle_ventas'

/**
 * Obtener ventas con filtros (historial)
 */
export const getVentas = async ({ search = '', fechaDesde = '', fechaHasta = '', page = 1, pageSize = 20 } = {}) => {
  let query = supabase
    .from(TABLE_VENTAS)
    .select(`
      *,
      metodos_pago!inner (
        nombre_metodo
      )
    `, { count: 'exact' })

  if (fechaDesde) {
    query = query.gte('fecha_venta', fechaDesde)
  }
  if (fechaHasta) {
    query = query.lte('fecha_venta', `${fechaHasta}T23:59:59`)
  }
  if (search) {
    query = query.or(
      `numero_factura.ilike.%${search}%,id_cliente_nombre.ilike.%${search}%,id_cliente_identificacion.ilike.%${search}%`
    )
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('fecha_venta', { ascending: false })
    .range(from, to)

  if (error) throw new Error(`Error al obtener ventas: ${error.message}`)
  return { data, total: count, page, pageSize }
}

/**
 * Obtener una venta por ID con su detalle
 */
export const getVentaById = async (id) => {
  const { data: venta, error: ventaError } = await supabase
    .from(TABLE_VENTAS)
    .select(`
      *,
      metodos_pago!inner (
        nombre_metodo
      )
    `)
    .eq('id_venta', id)
    .single()

  if (ventaError) throw new Error(`Error al obtener venta: ${ventaError.message}`)

  const { data: detalle, error: detalleError } = await supabase
    .from(TABLE_DETALLE)
    .select(`
      *,
      productos!inner (
        sku,
        nombre_producto
      )
    `)
    .eq('id_venta', id)

  if (detalleError) throw new Error(`Error al obtener detalle de venta: ${detalleError.message}`)

  return { ...venta, detalle }
}

/**
 * Registrar una nueva venta (con detalle)
 */
export const createVenta = async ({ venta, detalle }) => {
  // 1. Insertar cabecera de venta
  const { data: newVenta, error: ventaError } = await supabase
    .from(TABLE_VENTAS)
    .insert([venta])
    .select()
    .single()

  if (ventaError) throw new Error(`Error al registrar venta: ${ventaError.message}`)

  // 2. Insertar detalle de venta
  const detalleConVenta = detalle.map(item => ({
    ...item,
    id_venta: newVenta.id_venta
  }))

  const { data: newDetalle, error: detalleError } = await supabase
    .from(TABLE_DETALLE)
    .insert(detalleConVenta)
    .select()

  if (detalleError) {
    // Rollback: eliminar la venta si falla el detalle
    await supabase.from(TABLE_VENTAS).delete().eq('id_venta', newVenta.id_venta)
    throw new Error(`Error al registrar detalle de venta: ${detalleError.message}`)
  }

  return { ...newVenta, detalle: newDetalle }
}

/**
 * Anular una venta
 */
export const anularVenta = async (id) => {
  const { error } = await supabase
    .from(TABLE_VENTAS)
    .update({
      estado: 'ANULADA',
      updated_at: new Date().toISOString()
    })
    .eq('id_venta', id)

  if (error) throw new Error(`Error al anular venta: ${error.message}`)
  return true
}

/**
 * Obtener ventas del día (para dashboard)
 */
export const getVentasDelDia = async () => {
  const hoy = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from(TABLE_VENTAS)
    .select('id_venta, total, fecha_venta')
    .eq('estado', 'COMPLETADA')
    .gte('fecha_venta', hoy)
    .lte('fecha_venta', `${hoy}T23:59:59`)

  if (error) throw new Error(`Error al obtener ventas del día: ${error.message}`)

  const totalVentas = data.reduce((sum, v) => sum + Number(v.total), 0)

  return {
    total: totalVentas,
    cantidad: data.length,
    data
  }
}

/**
 * Obtener métodos de pago
 */
export const getMetodosPago = async () => {
  const { data, error } = await supabase
    .from('metodos_pago')
    .select('*')
    .order('nombre_metodo', { ascending: true })

  if (error) throw new Error(`Error al obtener métodos de pago: ${error.message}`)
  return data
}

