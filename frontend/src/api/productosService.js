import { supabase } from './supabaseClient'

/**
 * Servicio de Productos/Inventario para FR MOTORS
 * CRUD completo con búsqueda, filtros y control de stock
 */

const TABLE = 'productos'
const SELECT_QUERY = `
  *,
  categorias!inner (
    id_categoria,
    nombre_categoria
  )
`

/**
 * Obtener todos los productos con filtros opcionales
 */
export const getProductos = async ({ search = '', categoria = '', page = 1, pageSize = 20, soloActivos = true } = {}) => {
  let query = supabase
    .from(TABLE)
    .select(SELECT_QUERY, { count: 'exact' })

  if (soloActivos) {
    query = query.eq('activo', true)
  }

  if (categoria) {
    query = query.eq('id_categoria', categoria)
  }

  if (search) {
    query = query.or(
      `nombre_producto.ilike.%${search}%,sku.ilike.%${search}%,codigo_barras.ilike.%${search}%`
    )
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('nombre_producto', { ascending: true })
    .range(from, to)

  if (error) throw new Error(`Error al obtener productos: ${error.message}`)

  return { data, total: count, page, pageSize }
}

/**
 * Obtener un producto por ID
 */
export const getProductoById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_QUERY)
    .eq('id_producto', id)
    .single()

  if (error) throw new Error(`Error al obtener producto: ${error.message}`)
  return data
}

/**
 * Crear un nuevo producto
 */
export const createProducto = async (producto) => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{
      ...producto,
      created_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) throw new Error(`Error al crear producto: ${error.message}`)
  return data
}

/**
 * Actualizar un producto existente
 */
export const updateProducto = async (id, updates) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id_producto', id)
    .select()
    .single()

  if (error) throw new Error(`Error al actualizar producto: ${error.message}`)
  return data
}

/**
 * Eliminar (desactivar) un producto
 */
export const deleteProducto = async (id) => {
  const { error } = await supabase
    .from(TABLE)
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('id_producto', id)

  if (error) throw new Error(`Error al eliminar producto: ${error.message}`)
  return true
}

/**
 * Obtener productos con stock bajo
 */
export const getProductosStockBajo = async () => {
  const { data, error } = await supabase
    .from('vista_productos_stock_bajo')
    .select('*')

  if (error) throw new Error(`Error al obtener stock bajo: ${error.message}`)
  return data
}

/**
 * Obtener categorías de productos
 */
export const getCategorias = async () => {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('activo', true)
    .order('nombre_categoria', { ascending: true })

  if (error) throw new Error(`Error al obtener categorías: ${error.message}`)
  return data
}

/**
 * Buscar productos rápidamente para POS/autocomplete
 */
export const searchProductosQuick = async (query) => {
  if (!query || query.length < 2) return []

  const { data, error } = await supabase
    .from(TABLE)
    .select('id_producto, sku, nombre_producto, precio_venta, stock_actual, precio_mayorista')
    .eq('activo', true)
    .or(`nombre_producto.ilike.%${query}%,sku.ilike.%${query}%,codigo_barras.ilike.%${query}%`)
    .limit(10)

  if (error) throw new Error(`Error en búsqueda rápida: ${error.message}`)
  return data
}

