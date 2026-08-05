import { supabase } from './supabaseClient'

/**
 * Servicio de Compras para FR MOTORS
 * Registro de compras a proveedores para reponer stock
 *
 * Tablas:
 * - compras:        id_compra, numero_compra, id_proveedor, id_usuario, subtotal, iva, total, estado, metodo_pago, creado_en
 * - detalle_compras: id_detalle_compra, id_compra, id_producto, cantidad, precio_unitario, subtotal, creado_en
 * - proveedores:    id_proveedor, razon_social, ruc_cedula
 * - productos:      id_producto, nombre_producto, sku, stock_actual, precio_compra
 *
 * DIFERENCIA CLAVE CON VENTAS:
 * - En VENTAS el stock DISMINUYE (stock_actual - cantidad)
 * - En COMPRAS el stock AUMENTA (stock_actual + cantidad)
 */

const TABLE_COMPRAS = 'compras'
const TABLE_DETALLE = 'detalle_compras'
const TABLE_PRODUCTOS = 'productos'

/**
 * Obtener el id_usuario numérico (SERIAL) desde la tabla usuarios
 * usando el email o auth_id del usuario autenticado
 *
 * @param {string} authId - El UUID de Supabase Auth (session.user.id)
 * @returns {Promise<number>} El id_usuario numérico
 */
export const obtenerIdUsuarioParaCompra = async (authId) => {
  console.log('🔵 Obteniendo id_usuario numérico para auth_id:', authId)

  const { data, error } = await supabase
    .from('usuarios')
    .select('id_usuario')
    .eq('auth_id', authId)
    .maybeSingle()

  if (error) {
    console.error('🔴 Error al obtener id_usuario:', error)
    throw new Error(`No se pudo obtener el id_usuario del usuario autenticado: ${error.message}`)
  }

  if (!data) {
    throw new Error('No se encontró un usuario en la tabla usuarios con ese auth_id. Verifica que el usuario esté registrado en la tabla usuarios.')
  }

  console.log('✅ id_usuario numérico obtenido:', data.id_usuario)
  return data.id_usuario
}

/**
 * Generar el siguiente número de compra
 * Formato: COMP-YYYYMMDD-000001
 */
export const generarNumeroCompra = async () => {
  const hoy = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const prefijo = `COMP-${hoy.replace(/-/g, '')}` // COMP-20250315

  console.log('🔵 Generando número de compra para:', hoy)

  const { data, error } = await supabase
    .from(TABLE_COMPRAS)
    .select('numero_compra')
    .like('numero_compra', `${prefijo}-%`)
    .order('numero_compra', { ascending: false })
    .limit(1)

  if (error) {
    console.error('🔴 Error al generar número de compra:', error.message)
    throw new Error(`Error al generar número de compra: ${error.message}`)
  }

  let secuencial = 1
  if (data && data.length > 0) {
    const ultimo = data[0].numero_compra
    const numero = parseInt(ultimo.slice(-6), 10)
    if (!isNaN(numero)) {
      secuencial = numero + 1
    }
  }

  const numeroCompra = `${prefijo}-${String(secuencial).padStart(6, '0')}`
  console.log('✅ Número de compra generado:', numeroCompra)
  return numeroCompra
}

/**
 * Obtener compras con filtros (historial)
 * Ordena por fecha descending (más recientes primero)
 */
export const getCompras = async ({ search = '', page = 1, pageSize = 20 } = {}) => {
  let query = supabase
    .from(TABLE_COMPRAS)
    .select(`
      *,
      proveedores (
        id_proveedor,
        razon_social,
        ruc_cedula
      )
    `, { count: 'exact' })

  if (search) {
    const term = `%${search}%`
    query = query.or(
      `numero_compra.ilike.${term},proveedores.razon_social.ilike.${term}`
    )
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('creado_en', { ascending: false })
    .range(from, to)

  if (error) throw new Error(`Error al obtener compras: ${error.message}`)
  return { data: data || [], total: count || 0, page, pageSize }
}

/**
 * Obtener una compra por ID con su detalle
 */
export const getCompraById = async (id) => {
  const { data: compra, error: compraError } = await supabase
    .from(TABLE_COMPRAS)
    .select(`
      *,
      proveedores (
        id_proveedor,
        razon_social,
        ruc_cedula
      )
    `)
    .eq('id_compra', id)
    .single()

  if (compraError) throw new Error(`Error al obtener compra: ${compraError.message}`)

  const { data: detalle, error: detalleError } = await supabase
    .from(TABLE_DETALLE)
    .select(`
      *,
      productos!inner (
        sku,
        nombre_producto
      )
    `)
    .eq('id_compra', id)

  if (detalleError) throw new Error(`Error al obtener detalle de compra: ${detalleError.message}`)

  return { ...compra, detalle }
}

/**
 * Buscar productos rápidamente por nombre o SKU (para el modal de compra)
 */
export const searchProductosCompra = async (query) => {
  if (!query || query.length < 2) return []

  console.log('🔍 Búsqueda de productos para compra - Término:', query)

  const term = `%${query}%`
  const { data, error } = await supabase
    .from(TABLE_PRODUCTOS)
    .select('id_producto, sku, nombre_producto, precio_compra, stock_actual')
    .eq('activo', true)
    .or(`sku.ilike.${term},nombre_producto.ilike.${term}`)
    .limit(10)

  if (error) {
    console.error('❌ Error en búsqueda de productos:', error.message)
    throw new Error(`Error en búsqueda de productos: ${error.message}`)
  }

  console.log('✅ Resultados de búsqueda:', data)
  return data || []
}

/**
 * Registrar una nueva compra completa (transacción manual)
 *
 * 1. Insertar cabecera en `compras`
 * 2. Insertar items en `detalle_compras`
 * 3. Actualizar stock en `productos` (SUMAR cantidad)
 *
 * @param {object} params
 * @param {object} params.compra - Datos de la cabecera (id_proveedor, subtotal, iva, total, metodo_pago)
 * @param {Array} params.detalle - Items de la compra (id_producto, cantidad, precio_unitario, subtotal)
 * @param {object} params.session - Sesión del usuario autenticado
 */
export const crearCompra = async ({ compra, detalle, session }) => {
  console.log('🔵 INICIANDO PROCESO DE COMPRA...')
  console.log('🔵 Datos de compra:', compra)
  console.log('🔵 Carrito (detalle):', detalle)

  if (!detalle || detalle.length === 0) {
    throw new Error('El detalle de compra está vacío. Agrega productos antes de guardar la compra.')
  }

  if (!compra.id_proveedor) {
    throw new Error('Debes seleccionar un proveedor.')
  }

  // ====== 0. Obtener el id_usuario numérico (FK válida) ======
  let idUsuarioNumerico = compra.id_usuario
  if (session?.user?.id) {
    idUsuarioNumerico = await obtenerIdUsuarioParaCompra(session.user.id)
    console.log('🔵 id_usuario numérico resuelto desde auth_id:', idUsuarioNumerico)
  }

  if (!idUsuarioNumerico) {
    throw new Error('No se pudo determinar el id_usuario para la compra.')
  }

  // ====== 1. Generar número de compra automático ======
  const numeroCompra = await generarNumeroCompra()

  const compraData = {
    numero_compra: numeroCompra,
    id_proveedor: Number(compra.id_proveedor),
    id_usuario: idUsuarioNumerico,
    subtotal: Math.round(Number(compra.subtotal) * 100) / 100,
    iva: Math.round(Number(compra.iva) * 100) / 100,
    total: Math.round(Number(compra.total) * 100) / 100,
    estado: compra.estado || 'COMPLETADA',
    metodo_pago: compra.metodo_pago || 'EFECTIVO',
    creado_en: new Date().toISOString()
  }

  console.log('🔵 Insertando en tabla compras:', compraData)

  const { data: dataCompra, error: compraError } = await supabase
    .from(TABLE_COMPRAS)
    .insert([compraData])
    .select()
    .single()

  if (compraError) {
    console.error('🔴 ERROR al insertar compra:', compraError)
    throw new Error(`Error al registrar compra: ${compraError.message}`)
  }

  console.log('🟢 Compra insertada:', dataCompra)

  try {
    // ====== 2. Insertar detalle de compra ======
    const detalleConCompra = detalle.map(item => ({
      id_compra: dataCompra.id_compra,
      id_producto: item.id_producto,
      cantidad: item.cantidad,
      precio_unitario: Math.round(Number(item.precio_unitario) * 100) / 100,
      subtotal: Math.round(Number(item.subtotal) * 100) / 100
    }))

    console.log('🔵 Insertando en tabla detalle_compras:', detalleConCompra)

    const { data: dataDetalles, error: detalleError } = await supabase
      .from(TABLE_DETALLE)
      .insert(detalleConCompra)
      .select()

    if (detalleError) {
      console.error('🔴 ERROR al insertar detalle de compra:', detalleError)
      throw new Error(`Error al registrar detalle de compra: ${detalleError.message}`)
    }

    console.log('🟢 Detalles de compra insertados:', dataDetalles)

    // ====== 3. Actualizar stock en productos (SUMAR, al revés que ventas) ======
    for (const item of detalle) {
      const { data: prod, error: prodError } = await supabase
        .from(TABLE_PRODUCTOS)
        .select('stock_actual')
        .eq('id_producto', item.id_producto)
        .single()

      if (prodError) {
        console.error(`🔴 ERROR al leer stock del producto ${item.id_producto}:`, prodError.message)
        throw new Error(`Error al leer stock del producto ${item.id_producto}: ${prodError.message}`)
      }

      // COMPRA: el stock AUMENTA
      const nuevoStock = Number(prod.stock_actual) + Number(item.cantidad)

      const { error: stockError } = await supabase
        .from(TABLE_PRODUCTOS)
        .update({ stock_actual: nuevoStock })
        .eq('id_producto', item.id_producto)

      if (stockError) {
        console.error(`🔴 ERROR al actualizar stock del producto ${item.id_producto}:`, stockError.message)
        throw new Error(`Error al actualizar stock del producto ${item.id_producto}: ${stockError.message}`)
      }
    }

    console.log('🟢 Stock actualizado correctamente (AUMENTADO)')

    console.log('🎉 COMPRA COMPLETADA EXITOSAMENTE:', dataCompra.numero_compra)
    return { ...dataCompra, detalle: dataDetalles }

  } catch (err) {
    // ====== Rollback: eliminar la compra y su detalle si algo falla ======
    console.error('🔴 ERROR en proceso de compra, haciendo ROLLBACK:', err.message)
    await supabase.from(TABLE_DETALLE).delete().eq('id_compra', dataCompra.id_compra)
    await supabase.from(TABLE_COMPRAS).delete().eq('id_compra', dataCompra.id_compra)
    throw err
  }
}
