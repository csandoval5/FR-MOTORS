import { supabase } from './supabaseClient'

/**
 * Servicio de Órdenes de Taller para FR MOTORS
 * CRUD de órdenes, repuestos utilizados, estados
 */

const TABLE_ORDENES = 'ordenes_taller'
const TABLE_DETALLE_REPUESTOS = 'detalle_orden_repuestos'

/**
 * Obtener órdenes de taller
 */
export const getOrdenesTaller = async ({ search = '', estado = '', page = 1, pageSize = 20 } = {}) => {
  let query = supabase
    .from(TABLE_ORDENES)
    .select(`
      *,
      estados_orden_taller!inner (
        nombre_estado
      ),
      usuarios!ordenes_taller_id_usuario_solicita_fkey (
        nombres,
        apellidos
      )
    `, { count: 'exact' })

  if (estado) {
    query = query.eq('id_estado', estado)
  }

  if (search) {
    query = query.or(
      `numero_orden.ilike.%${search}%,cliente_nombre.ilike.%${search}%,cliente_vehiculo_placa.ilike.%${search}%`
    )
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('fecha_ingreso', { ascending: false })
    .range(from, to)

  if (error) throw new Error(`Error al obtener órdenes de taller: ${error.message}`)
  return { data, total: count, page, pageSize }
}

/**
 * Obtener una orden de taller por ID con detalle
 */
export const getOrdenTallerById = async (id) => {
  const { data: orden, error: ordenError } = await supabase
    .from(TABLE_ORDENES)
    .select(`
      *,
      estados_orden_taller!inner (
        id_estado,
        nombre_estado
      ),
      usuarios!ordenes_taller_id_usuario_solicita_fkey (
        id_usuario,
        nombres,
        apellidos
      ),
      usuarios!ordenes_taller_id_mecánico_asignado_fkey (
        id_usuario,
        nombres,
        apellidos
      )
    `)
    .eq('id_orden', id)
    .single()

  if (ordenError) throw new Error(`Error al obtener orden: ${ordenError.message}`)

  const { data: repuestos, error: repuestosError } = await supabase
    .from(TABLE_DETALLE_REPUESTOS)
    .select(`
      *,
      productos!inner (
        codigo_sku,
        nombre_producto
      )
    `)
    .eq('id_orden', id)

  if (repuestosError) throw new Error(`Error al obtener repuestos: ${repuestosError.message}`)

  return { ...orden, repuestos }
}

/**
 * Crear una nueva orden de taller
 */
export const createOrdenTaller = async (orden) => {
  const { data, error } = await supabase
    .from(TABLE_ORDENES)
    .insert([orden])
    .select()
    .single()

  if (error) throw new Error(`Error al crear orden de taller: ${error.message}`)
  return data
}

/**
 * Actualizar una orden de taller
 */
export const updateOrdenTaller = async (id, updates) => {
  const { data, error } = await supabase
    .from(TABLE_ORDENES)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id_orden', id)
    .select()
    .single()

  if (error) throw new Error(`Error al actualizar orden: ${error.message}`)
  return data
}

/**
 * Agregar repuestos a una orden de taller
 */
export const addRepuestosToOrden = async (id_orden, repuestos) => {
  const repuestosConOrden = repuestos.map(r => ({
    ...r,
    id_orden
  }))

  const { data, error } = await supabase
    .from(TABLE_DETALLE_REPUESTOS)
    .insert(repuestosConOrden)
    .select()

  if (error) throw new Error(`Error al agregar repuestos: ${error.message}`)
  return data
}

/**
 * Obtener estados de órdenes de taller
 */
export const getEstadosOrdenTaller = async () => {
  const { data, error } = await supabase
    .from('estados_orden_taller')
    .select('*')
    .order('id_estado', { ascending: true })

  if (error) throw new Error(`Error al obtener estados: ${error.message}`)
  return data
}

/**
 * Obtener órdenes activas (para dashboard)
 */
export const getOrdenesActivas = async () => {
  const { data, error } = await supabase
    .from('vista_ordenes_taller_activas')
    .select('*')

  if (error) throw new Error(`Error al obtener órdenes activas: ${error.message}`)
  return data
}

