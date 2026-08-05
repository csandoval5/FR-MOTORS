import { supabase } from './supabaseClient'

/**
 * Servicio de Productos/Inventario para FR MOTORS
 * CRUD completo con búsqueda, filtros, paginación, ordenamiento
 * y control de stock
 */
const TABLE = 'productos'

const SELECT_QUERY = `
  *,
  categorias!inner (
    id_categoria,
    nombre_categoria
  ),
  proveedores (
    id_proveedor,
    razon_social
  )
`

/**
 * Obtener todos los productos con filtros, paginación y ordenamiento
 *
 * @param {object} params
 * @param {string} params.search - Búsqueda por nombre, SKU o código de barras
 * @param {string} params.categoria - ID de categoría
 * @param {string} params.filtroStock - 'todos' | 'bajo' | 'sin_stock'
 * @param {number} params.page - Página (1-based)
 * @param {number} params.pageSize - Registros por página
 * @param {string} params.sortColumn - Columna de ordenamiento
 * @param {string} params.sortDirection - 'asc' | 'desc'
 * @param {boolean} params.soloActivos - Solo productos activos
 */
export const getProductos = async ({
  search = '',
  categoria = '',
  filtroStock = 'todos',
  page = 1,
  pageSize = 20,
  sortColumn = 'nombre_producto',
  sortDirection = 'asc',
  soloActivos = true
} = {}) => {
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
    const term = `%${search}%`
    query = query.or(
      `nombre_producto.ilike.${term},sku.ilike.${term},codigo_barras.ilike.${term}`
    )
  }

  // Filtro de stock
  if (filtroStock === 'sin_stock') {
    query = query.eq('stock_actual', 0)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Ordenamiento seguro (evita inyección de columnas no válidas)
  const columnasPermitidas = ['nombre_producto', 'sku', 'precio_venta', 'stock_actual', 'precio_compra']
  const sortCol = columnasPermitidas.includes(sortColumn) ? sortColumn : 'nombre_producto'
  const sortDir = sortDirection === 'desc' ? 'desc' : 'asc'

  const { data, error, count } = await query
    .order(sortCol, { ascending: sortDir === 'asc' })
    .range(from, to)

  if (error) throw new Error(`Error al obtener productos: ${error.message}`)

  let results = data || []

  // Filtro de stock bajo (requiere comparación de columnas, se hace en cliente)
  if (filtroStock === 'bajo') {
    results = results.filter(p => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo)
  }

  return { data: results, total: count || 0, page, pageSize }
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
 * Verificar si un SKU ya existe (para validar unicidad)
 * @param {string} sku - Código SKU a verificar
 * @param {number} [excludeId] - ID de producto a excluir (para edición)
 * @returns {Promise<boolean>} - true si ya existe
 */
export const verificarSkuExistente = async (sku, excludeId = null) => {
  if (!sku) return false
  let query = supabase
    .from(TABLE)
    .select('id_producto')
    .eq('sku', sku)
    .eq('activo', true)

  if (excludeId) {
    query = query.neq('id_producto', excludeId)
  }

  const { data, error } = await query
  if (error) throw new Error(`Error al verificar SKU: ${error.message}`)
  return (data || []).length > 0
}

/**
 * Crear un nuevo producto
 */
export const createProducto = async (producto) => {
  // Validar unicidad de SKU
  const existe = await verificarSkuExistente(producto.sku)
  if (existe) {
    throw new Error('El código SKU ya existe. Por favor usa uno diferente.')
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert([{
      ...producto,
      creado_en: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) throw new Error(`Error al crear producto: ${error.message}`)
  return data
}

/**
 * Actualizar un producto existente (no modifica el SKU)
 */
export const updateProducto = async (id, updates) => {
  // Eliminar el SKU de los updates para que no se pueda modificar
  const { sku, ...camposActualizables } = updates

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      ...camposActualizables,
      actualizado_en: new Date().toISOString()
    })
    .eq('id_producto', id)
    .select()
    .single()

  if (error) throw new Error(`Error al actualizar producto: ${error.message}`)
  return data
}

/**
 * Eliminar (desactivar) un producto - soft delete
 */
export const deleteProducto = async (id) => {
  const { error } = await supabase
    .from(TABLE)
    .update({ activo: false, actualizado_en: new Date().toISOString() })
    .eq('id_producto', id)

  if (error) throw new Error(`Error al eliminar producto: ${error.message}`)
  return true
}

/**
 * Obtener productos con stock bajo (usando vista)
 */
export const getProductosStockBajo = async () => {
  const { data, error } = await supabase
    .from('vista_productos_stock_bajo')
    .select('*')

  if (error) throw new Error(`Error al obtener stock bajo: ${error.message}`)
  return data || []
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
  return data || []
}

/**
 * Obtener proveedores activos para el dropdown del formulario
 */
export const getProveedoresActivos = async () => {
  const { data, error } = await supabase
    .from('proveedores')
    .select('id_proveedor, razon_social, ruc_cedula')
    .eq('activo', true)
    .order('razon_social', { ascending: true })

  if (error) throw new Error(`Error al obtener proveedores: ${error.message}`)
  return data || []
}

/**
 * Buscar productos rápidamente para POS/autocomplete
 *
 * Busca en las columnas: sku, nombre_producto, codigo_barras
 * Usa ilike para búsqueda parcial (case-insensitive)
 * Filtra solo productos activos
 * Retorna solo los campos necesarios para el POS
 */
export const searchProductosQuick = async (query) => {
  if (!query || query.length < 2) return []

  console.log('🔍 Búsqueda rápida - Término:', query)

  const term = `%${query}%`
  const { data, error } = await supabase
    .from(TABLE)
    .select('id_producto, sku, nombre_producto, precio_venta, stock_actual, codigo_barras')
    .eq('activo', true)
    .or(`sku.ilike.${term},nombre_producto.ilike.${term},codigo_barras.ilike.${term}`)
    .limit(10)

  if (error) {
    console.error('❌ Error en búsqueda rápida:', error.message)
    throw new Error(`Error en búsqueda rápida: ${error.message}`)
  }

  console.log('✅ Resultados de búsqueda:', data)
  return data || []
}
