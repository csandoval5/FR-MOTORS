import { supabase } from './supabaseClient'

/**
 * Servicio de Proveedores para FR MOTORS
 * CRUD de proveedores, cuentas por pagar y abonos
 */

const TABLE_PROVEEDORES = 'proveedores'

/**
 * Obtener todos los proveedores
 */
export const getProveedores = async ({ search = '', page = 1, pageSize = 20, soloActivos = true } = {}) => {
  let query = supabase
    .from(TABLE_PROVEEDORES)
    .select(`
      *,
      tipos_identificacion!inner (
        codigo,
        nombre
      )
    `, { count: 'exact' })

  if (soloActivos) {
    query = query.eq('activo', true)
  }

  if (search) {
    query = query.or(
      `razon_social.ilike.%${search}%,numero_identificacion.ilike.%${search}%,nombre_comercial.ilike.%${search}%`
    )
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('razon_social', { ascending: true })
    .range(from, to)

  if (error) throw new Error(`Error al obtener proveedores: ${error.message}`)
  return { data, total: count, page, pageSize }
}

/**
 * Obtener un proveedor por ID
 */
export const getProveedorById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_PROVEEDORES)
    .select(`
      *,
      tipos_identificacion!inner (
        codigo,
        nombre
      )
    `)
    .eq('id_proveedor', id)
    .single()

  if (error) throw new Error(`Error al obtener proveedor: ${error.message}`)
  return data
}

/**
 * Crear un nuevo proveedor
 */
export const createProveedor = async (proveedor) => {
  const { data, error } = await supabase
    .from(TABLE_PROVEEDORES)
    .insert([proveedor])
    .select()
    .single()

  if (error) throw new Error(`Error al crear proveedor: ${error.message}`)
  return data
}

/**
 * Actualizar un proveedor
 */
export const updateProveedor = async (id, updates) => {
  const { data, error } = await supabase
    .from(TABLE_PROVEEDORES)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id_proveedor', id)
    .select()
    .single()

  if (error) throw new Error(`Error al actualizar proveedor: ${error.message}`)
  return data
}

/**
 * Eliminar (desactivar) un proveedor
 */
export const deleteProveedor = async (id) => {
  const { error } = await supabase
    .from(TABLE_PROVEEDORES)
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('id_proveedor', id)

  if (error) throw new Error(`Error al eliminar proveedor: ${error.message}`)
  return true
}

/**
 * Cuentas por Pagar
 */

/**
 * Obtener cuentas por pagar
 */
export const getCuentasPagar = async ({ estado = '', proveedorId = '', page = 1, pageSize = 20 } = {}) => {
  let query = supabase
    .from('cuentas_pagar')
    .select(`
      *,
      proveedores!inner (
        id_proveedor,
        razon_social,
        telefono_principal
      )
    `, { count: 'exact' })

  if (estado) {
    query = query.eq('estado', estado)
  }
  if (proveedorId) {
    query = query.eq('id_proveedor', proveedorId)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('fecha_vencimiento', { ascending: true })
    .range(from, to)

  if (error) throw new Error(`Error al obtener cuentas por pagar: ${error.message}`)
  return { data, total: count, page, pageSize }
}

/**
 * Registrar un abono a cuenta por pagar
 */
export const createAbono = async (abono) => {
  const { data, error } = await supabase
    .from('abonos_cuentas_pagar')
    .insert([abono])
    .select()
    .single()

  if (error) throw new Error(`Error al registrar abono: ${error.message}`)
  return data
}

/**
 * Obtener tipos de identificación
 */
export const getTiposIdentificacion = async () => {
  const { data, error } = await supabase
    .from('tipos_identificacion')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) throw new Error(`Error al obtener tipos de identificación: ${error.message}`)
  return data
}

