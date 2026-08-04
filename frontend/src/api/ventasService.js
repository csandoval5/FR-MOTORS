import { supabase } from './supabaseClient'

/**
 * Servicio de Ventas/Facturación para FR MOTORS
 * Punto de Venta (POS), historial de ventas, facturación
 *
 * Columnas de la base de datos:
 * - ventas: id_venta, numero_factura, id_usuario, subtotal, iva, total, forma_pago, estado, creado_en
 * - detalle_ventas: id_detalle_venta, id_venta, id_producto, cantidad, precio_unitario, subtotal
 * - caja: id_movimiento, tipo_movimiento, concepto, monto, id_usuario, creado_en
 * - productos: id_producto, stock_actual
 */

const TABLE_VENTAS = 'ventas'
const TABLE_DETALLE = 'detalle_ventas'
const TABLE_CAJA = 'caja'
const TABLE_PRODUCTOS = 'productos'

/**
 * Obtener el id_usuario numérico (SERIAL) desde la tabla usuarios.
 * Busca por email (más confiable que auth_id, que puede estar NULL).
 * Si no existe, crea el registro automáticamente con rol vendedor.
 *
 * @param {string} userEmail - El email del usuario autenticado (session.user.email)
 * @returns {Promise<number>} El id_usuario numérico
 */
export const obtenerIdUsuario = async (userEmail) => {
  try {
    console.log('🔵 Buscando usuario con email:', userEmail)

    if (!userEmail) {
      throw new Error('No se pudo identificar el email del usuario autenticado.')
    }

    // Buscar usuario por email (más confiable que auth_id)
    const { data, error } = await supabase
      .from('usuarios')
      .select('id_usuario, email, auth_id')
      .eq('email', userEmail)
      .maybeSingle()

    console.log('🔵 Resultado de búsqueda:', data)

    if (error || !data) {
      console.error('🔴 Usuario no encontrado en tabla usuarios. Error:', error)

      // Si no existe, crear un registro temporal con rol vendedor (id_rol = 2)
      console.log('🟡 Creando registro de usuario automáticamente...')
      const { data: nuevoUsuario, error: errorCreate } = await supabase
        .from('usuarios')
        .insert({
          email: userEmail,
          nombre_completo: userEmail.split('@')[0], // Extraer nombre del email
          id_rol: 2, // Rol por defecto: vendedor (2)
          activo: true,
          creado_en: new Date().toISOString()
        })
        .select()
        .single()

      if (errorCreate) {
        console.error('🔴 Error al crear usuario:', errorCreate)
        throw new Error(`No se pudo crear el usuario automáticamente: ${errorCreate.message}`)
      }

      console.log('✅ Usuario creado:', nuevoUsuario)
      return nuevoUsuario.id_usuario
    }

    console.log('✅ Usuario encontrado, ID:', data.id_usuario)
    return data.id_usuario
  } catch (error) {
    console.error('🔴 Error en obtenerIdUsuario:', error)
    throw error
  }
}

/**
 * Generar el siguiente número de factura
 * Formato: FAC-YYYYMMDD-000001
 */
export const generarNumeroFactura = async () => {
  const hoy = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const prefijo = `FAC-${hoy.replace(/-/g, '')}` // FAC-20250315

  console.log('🔵 Generando número de factura para:', hoy)

  const { data, error } = await supabase
    .from(TABLE_VENTAS)
    .select('numero_factura')
    .like('numero_factura', `${prefijo}-%`)
    .order('numero_factura', { ascending: false })
    .limit(1)

  if (error) {
    console.error('🔴 Error al generar número de factura:', error.message)
    throw new Error(`Error al generar número de factura: ${error.message}`)
  }

  let secuencial = 1
  if (data && data.length > 0) {
    const ultimo = data[0].numero_factura
    const numero = parseInt(ultimo.slice(-6), 10)
    if (!isNaN(numero)) {
      secuencial = numero + 1
    }
  }

  const numeroFactura = `${prefijo}-${String(secuencial).padStart(6, '0')}`
  console.log('✅ Número de factura generado:', numeroFactura)
  return numeroFactura
}

/**
 * Obtener ventas con filtros (historial)
 * Ordena por fecha descending (más recientes primero)
 */
export const getVentas = async ({ search = '', fechaDesde = '', fechaHasta = '', page = 1, pageSize = 20 } = {}) => {
  let query = supabase
    .from(TABLE_VENTAS)
    .select(`
      *,
      usuarios (
        id_usuario,
        nombres,
        apellidos
      )
    `, { count: 'exact' })

  if (fechaDesde) {
    query = query.gte('creado_en', fechaDesde)
  }
  if (fechaHasta) {
    query = query.lte('creado_en', `${fechaHasta}T23:59:59`)
  }
  if (search) {
    query = query.or(
      `numero_factura.ilike.%${search}%`
    )
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('creado_en', { ascending: false })
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
      usuarios!inner (
        nombres,
        apellidos
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
 * Registrar una nueva venta completa (transacción manual)
 *
 * 1. Insertar cabecera en `ventas`
 * 2. Insertar items en `detalle_ventas`
 * 3. Actualizar stock en `productos` (restar cantidad)
 * 4. Insertar movimiento en `caja` (tipo: INGRESO)
 *
 * @param {object} params
 * @param {object} params.venta - Datos de la cabecera
 * @param {Array} params.detalle - Items del carrito
 */
export const createVenta = async ({ venta, detalle, session }) => {
  console.log('🔵 INICIANDO PROCESO DE VENTA...')
  console.log('🔵 Datos de venta:', venta)
  console.log('🔵 Carrito (detalle):', detalle)

  if (!detalle || detalle.length === 0) {
    throw new Error('El carrito está vacío. Agrega productos antes de finalizar la venta.')
  }

// ====== 0. Obtener el id_usuario numérico (FK válida) ======
  // Si se pasó la session, resolvemos el id_usuario numérico desde la tabla 'usuarios'
  // usando el email (más confiable que auth_id, que puede estar NULL).
  // Esto evita el error de FK "ventas_id_usuario_fkey".
  let idUsuarioNumerico = venta.id_usuario
  if (session?.user?.email) {
    idUsuarioNumerico = await obtenerIdUsuario(session.user.email)
    console.log('🔵 id_usuario numérico resuelto desde email:', idUsuarioNumerico)
  }

  if (!idUsuarioNumerico) {
    throw new Error('No se pudo determinar el id_usuario para la venta. Verifica que el usuario esté registrado en la tabla usuarios.')
  }

  // ====== 1. Insertar cabecera de venta ======
  const ventaData = {
    ...venta,
    id_usuario: idUsuarioNumerico, // Usar el numérico, NO el UUID
    creado_en: new Date().toISOString()
  }

  console.log('🔵 Insertando en tabla ventas:', ventaData)

  const { data: dataVenta, error: ventaError } = await supabase
    .from(TABLE_VENTAS)
    .insert([ventaData])
    .select()
    .single()

  if (ventaError) {
    console.error('🔴 ERROR al insertar venta:', ventaError)
    throw new Error(`Error al registrar venta: ${ventaError.message}`)
  }

  console.log('🟢 Venta insertada:', dataVenta)

  try {
    // ====== 2. Insertar detalle de venta ======
    const detalleConVenta = detalle.map(item => ({
      id_venta: dataVenta.id_venta,
      id_producto: item.id_producto,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal: item.subtotal
    }))

    console.log('🔵 Insertando en tabla detalle_ventas:', detalleConVenta)

    const { data: dataDetalles, error: detalleError } = await supabase
      .from(TABLE_DETALLE)
      .insert(detalleConVenta)
      .select()

    if (detalleError) {
      console.error('🔴 ERROR al insertar detalle:', detalleError)
      throw new Error(`Error al registrar detalle de venta: ${detalleError.message}`)
    }

    console.log('🟢 Detalles insertados:', dataDetalles)

    // ====== 3. Actualizar stock en productos ======
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

      const nuevoStock = Math.max(0, Number(prod.stock_actual) - Number(item.cantidad))

      const { error: stockError } = await supabase
        .from(TABLE_PRODUCTOS)
        .update({ stock_actual: nuevoStock })
        .eq('id_producto', item.id_producto)

      if (stockError) {
        console.error(`🔴 ERROR al actualizar stock del producto ${item.id_producto}:`, stockError.message)
        throw new Error(`Error al actualizar stock del producto ${item.id_producto}: ${stockError.message}`)
      }
    }

    console.log('🟢 Stock actualizado correctamente')

    // ====== 4. Insertar movimiento en caja ======
    const movimientoCaja = {
      tipo_movimiento: 'INGRESO',
      concepto: `Venta ${dataVenta.numero_factura}`,
      monto: dataVenta.total,
      id_usuario: dataVenta.id_usuario,
      creado_en: new Date().toISOString()
    }

    console.log('🔵 Insertando en tabla caja:', movimientoCaja)

    const { error: cajaError } = await supabase
      .from(TABLE_CAJA)
      .insert([movimientoCaja])

    if (cajaError) {
      // No bloquear la venta si falla el registro en caja, pero loguear
      console.error('⚠️ Error al registrar movimiento en caja:', cajaError.message)
    } else {
      console.log('🟢 Movimiento de caja registrado')
    }

    console.log('🎉 VENTA COMPLETADA EXITOSAMENTE:', dataVenta.numero_factura)
    return { ...dataVenta, detalle: dataDetalles }

  } catch (err) {
    // ====== Rollback: eliminar la venta y su detalle si algo falla ======
    console.error('🔴 ERROR en proceso de venta, haciendo ROLLBACK:', err.message)
    await supabase.from(TABLE_DETALLE).delete().eq('id_venta', dataVenta.id_venta)
    await supabase.from(TABLE_VENTAS).delete().eq('id_venta', dataVenta.id_venta)
    throw err
  }
}

/**
 * Anular una venta (soft delete / estado ANULADA)
 */
export const anularVenta = async (id) => {
  const { error } = await supabase
    .from(TABLE_VENTAS)
    .update({
      estado: 'ANULADA'
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
    .select('id_venta, total, creado_en')
    .eq('estado', 'COMPLETADA')
    .gte('creado_en', hoy)
    .lte('creado_en', `${hoy}T23:59:59`)

  if (error) throw new Error(`Error al obtener ventas del día: ${error.message}`)

  const totalVentas = data.reduce((sum, v) => sum + Number(v.total), 0)

  return {
    total: totalVentas,
    cantidad: data.length,
    data
  }
}

/**
 * Obtener métodos de pago (formas de pago simples)
 */
export const getMetodosPago = async () => {
  // Formas de pago estándar para el POS
  return [
    { value: 'EFECTIVO', label: 'Efectivo' },
    { value: 'TRANSFERENCIA', label: 'Transferencia' },
    { value: 'TARJETA', label: 'Tarjeta' }
  ]
}
