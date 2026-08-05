import { supabase } from './supabaseClient'

/**
 * Servicio de Proveedores para FR MOTORS
 * CRUD completo de proveedores
 *
 * Tabla `proveedores`:
 * - id_proveedor (SERIAL PRIMARY KEY)
 * - razon_social (VARCHAR 255, NOT NULL)
 * - ruc_cedula (VARCHAR 20, UNIQUE, NOT NULL)
 * - nombre_contacto (VARCHAR 255)
 * - telefono (VARCHAR 20)
 * - email (VARCHAR 255)
 * - direccion (TEXT)
 * - ciudad (VARCHAR 100, DEFAULT 'El Coca')
 * - productos_suministra (TEXT)
 * - activo (BOOLEAN, DEFAULT true)
 * - creado_en (TIMESTAMP)
 */

const TABLE_PROVEEDORES = 'proveedores'

/**
 * Obtener todos los proveedores con búsqueda y paginación
 *
 * @param {object} params
 * @param {string} params.search - Búsqueda por razón social, RUC o contacto
 * @param {number} params.page - Página (1-based)
 * @param {number} params.pageSize - Registros por página
 * @param {boolean} params.soloActivos - Solo proveedores activos
 */
export const getProveedores = async ({ search = '', page = 1, pageSize = 20, soloActivos = true } = {}) => {
  let query = supabase
    .from(TABLE_PROVEEDORES)
    .select('*', { count: 'exact' })

  if (soloActivos) {
    query = query.eq('activo', true)
  }

  if (search) {
    const term = `%${search}%`
    query = query.or(
      `razon_social.ilike.${term},ruc_cedula.ilike.${term},nombre_contacto.ilike.${term}`
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
 * Obtener proveedores activos (para dropdown en productos)
 */
export const getProveedoresActivos = async () => {
  const { data, error } = await supabase
    .from(TABLE_PROVEEDORES)
    .select('id_proveedor, razon_social, ruc_cedula')
    .eq('activo', true)
    .order('razon_social', { ascending: true })

  if (error) throw new Error(`Error al obtener proveedores activos: ${error.message}`)
  return data || []
}

/**
 * Obtener un proveedor por ID
 */
export const getProveedorById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_PROVEEDORES)
    .select('*')
    .eq('id_proveedor', id)
    .single()

  if (error) throw new Error(`Error al obtener proveedor: ${error.message}`)
  return data
}

/**
 * Verificar si un RUC/Cédula ya existe (para validar unicidad)
 * @param {string} rucCedula - Número a verificar
 * @param {number} [excludeId] - ID de proveedor a excluir (para edición)
 * @returns {Promise<boolean>} - true si ya existe
 */
export const verificarRucExistente = async (rucCedula, excludeId = null) => {
  if (!rucCedula) return false
  let query = supabase
    .from(TABLE_PROVEEDORES)
    .select('id_proveedor')
    .eq('ruc_cedula', rucCedula)
    .eq('activo', true)

  if (excludeId) {
    query = query.neq('id_proveedor', excludeId)
  }

  const { data, error } = await query
  if (error) throw new Error(`Error al verificar RUC/Cédula: ${error.message}`)
  return (data || []).length > 0
}

/**
 * Crear un nuevo proveedor
 */
export const createProveedor = async (proveedor) => {
  const { data, error } = await supabase
    .from(TABLE_PROVEEDORES)
    .insert([{
      ...proveedor,
      creado_en: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) throw new Error(`Error al crear proveedor: ${error.message}`)
  return data
}

/**
 * Actualizar un proveedor existente
 */
export const updateProveedor = async (id, updates) => {
  const { data, error } = await supabase
    .from(TABLE_PROVEEDORES)
    .update(updates)
    .eq('id_proveedor', id)
    .select()
    .single()

  if (error) throw new Error(`Error al actualizar proveedor: ${error.message}`)
  return data
}

/**
 * Eliminar (desactivar) un proveedor - soft delete
 */
export const deleteProveedor = async (id) => {
  const { error } = await supabase
    .from(TABLE_PROVEEDORES)
    .update({ activo: false })
    .eq('id_proveedor', id)

  if (error) throw new Error(`Error al eliminar proveedor: ${error.message}`)
  return true
}
