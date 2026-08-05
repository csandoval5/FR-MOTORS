import { supabase } from './supabaseClient'

/**
 * Servicio de Clientes para FR MOTORS
 * CRUD completo de clientes para facturación
 *
 * Columnas de la tabla 'clientes':
 * - id_cliente (SERIAL PRIMARY KEY)
 * - nombre_completo (VARCHAR 255, NOT NULL)
 * - tipo_identificacion (VARCHAR 20, DEFAULT 'CEDULA')
 * - numero_identificacion (VARCHAR 20, UNIQUE, NOT NULL)
 * - telefono (VARCHAR 20)
 * - email (VARCHAR 255)
 * - direccion (TEXT)
 * - ciudad (VARCHAR 100, DEFAULT 'El Coca')
 * - activo (BOOLEAN, DEFAULT true)
 * - creado_en (TIMESTAMP)
 */

const TABLE_CLIENTES = 'clientes'

/**
 * Obtener todos los clientes con búsqueda y paginación
 * @param {object} params
 * @param {string} params.search - Búsqueda por nombre, identificación o email
 * @param {number} params.page - Página (1-based)
 * @param {number} params.pageSize - Registros por página
 * @param {boolean} params.soloActivos - Solo clientes activos
 */
export const getClientes = async ({ search = '', page = 1, pageSize = 20, soloActivos = true } = {}) => {
  let query = supabase
    .from(TABLE_CLIENTES)
    .select('*', { count: 'exact' })

  if (soloActivos) {
    query = query.eq('activo', true)
  }

  if (search) {
    query = query.or(
      `nombre_completo.ilike.%${search}%,numero_identificacion.ilike.%${search}%,email.ilike.%${search}%,telefono.ilike.%${search}%`
    )
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('nombre_completo', { ascending: true })
    .range(from, to)

  if (error) throw new Error(`Error al obtener clientes: ${error.message}`)
  return { data: data || [], total: count || 0, page, pageSize }
}

/**
 * Obtener todos los clientes activos (para dropdown del POS)
 * @returns {Promise<Array>}
 */
export const getClientesActivos = async () => {
  const { data, error } = await supabase
    .from(TABLE_CLIENTES)
    .select('id_cliente, nombre_completo, numero_identificacion, telefono, email, ciudad')
    .eq('activo', true)
    .order('nombre_completo', { ascending: true })

  if (error) throw new Error(`Error al obtener clientes activos: ${error.message}`)
  return data || []
}

/**
 * Obtener un cliente por ID
 */
export const getClienteById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_CLIENTES)
    .select('*')
    .eq('id_cliente', id)
    .single()

  if (error) throw new Error(`Error al obtener cliente: ${error.message}`)
  return data
}

/**
 * Crear un nuevo cliente
 */
export const createCliente = async (cliente) => {
  const { data, error } = await supabase
    .from(TABLE_CLIENTES)
    .insert([{
      ...cliente,
      creado_en: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) throw new Error(`Error al crear cliente: ${error.message}`)
  return data
}

/**
 * Actualizar un cliente
 */
export const updateCliente = async (id, updates) => {
  const { data, error } = await supabase
    .from(TABLE_CLIENTES)
    .update(updates)
    .eq('id_cliente', id)
    .select()
    .single()

  if (error) throw new Error(`Error al actualizar cliente: ${error.message}`)
  return data
}

/**
 * Eliminar (desactivar) un cliente - soft delete
 */
export const deleteCliente = async (id) => {
  const { error } = await supabase
    .from(TABLE_CLIENTES)
    .update({ activo: false })
    .eq('id_cliente', id)

  if (error) throw new Error(`Error al eliminar cliente: ${error.message}`)
  return true
}

/**
 * Verificar si un número de identificación ya existe
 * @param {string} numeroIdentificacion - Número a verificar
 * @param {number} [excludeId] - ID a excluir (para edición)
 */
export const verificarIdentificacionExistente = async (numeroIdentificacion, excludeId = null) => {
  if (!numeroIdentificacion) return false
  let query = supabase
    .from(TABLE_CLIENTES)
    .select('id_cliente')
    .eq('numero_identificacion', numeroIdentificacion)
    .eq('activo', true)

  if (excludeId) {
    query = query.neq('id_cliente', excludeId)
  }

  const { data, error } = await query
  if (error) throw new Error(`Error al verificar identificación: ${error.message}`)
  return (data || []).length > 0
}
