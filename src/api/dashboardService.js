import { supabase } from './supabaseClient'

/**
 * Servicio de Dashboard para FR MOTORS
 * Consultas de resumen y datos analíticos para el dashboard principal
 *
 * Columnas de la base de datos:
 * - productos: id_producto, nombre_producto, stock_actual, stock_minimo, activo
 * - proveedores: id_proveedor, razon_social, activo
 * - ventas: id_venta, total, fecha_venta
 * - detalle_ventas: id_detalle_venta, id_venta, id_producto, cantidad
 * - ordenes_taller: id_orden, estado
 */

const TABLE_PRODUCTOS = 'productos'
const TABLE_PROVEEDORES = 'proveedores'
const TABLE_VENTAS = 'ventas'
const TABLE_DETALLE_VENTAS = 'detalle_ventas'
const TABLE_ORDENES = 'ordenes_taller'

/**
 * Obtener el resumen general del dashboard
 * @returns {Promise<{productos: number, proveedores: number, ventasDia: number, ordenesActivas: number, cantidadVentasDia: number}>}
 */
export const getResumenGeneral = async () => {
  console.log('🔵 Cargando resumen general del dashboard...')

  // a) Productos en stock (activos)
  const { count: productos, error: errorProductos } = await supabase
    .from(TABLE_PRODUCTOS)
    .select('id_producto', { count: 'exact', head: true })
    .eq('activo', true)

  if (errorProductos) {
    console.error('❌ Error al contar productos:', errorProductos)
    throw new Error(`Error al contar productos: ${errorProductos.message}`)
  }

  // b) Proveedores activos
  const { count: proveedores, error: errorProveedores } = await supabase
    .from(TABLE_PROVEEDORES)
    .select('id_proveedor', { count: 'exact', head: true })
    .eq('activo', true)

  if (errorProveedores) {
    console.error('❌ Error al contar proveedores:', errorProveedores)
    throw new Error(`Error al contar proveedores: ${errorProveedores.message}`)
  }

  // c) Ventas del día (SUM total WHERE DATE(fecha_venta) = CURRENT_DATE)
  const hoyInicio = new Date()
  hoyInicio.setHours(0, 0, 0, 0)
  const hoyInicioISO = hoyInicio.toISOString()
  const hoyFin = new Date()
  hoyFin.setHours(23, 59, 59, 999)
  const hoyFinISO = hoyFin.toISOString()

  const { data: ventasDia, error: errorVentasDia } = await supabase
    .from(TABLE_VENTAS)
    .select('total')
    .eq('estado', 'COMPLETADA')
    .gte('fecha_venta', hoyInicioISO)
    .lte('fecha_venta', hoyFinISO)

  if (errorVentasDia) {
    console.error('❌ Error al obtener ventas del día:', errorVentasDia)
    throw new Error(`Error al obtener ventas del día: ${errorVentasDia.message}`)
  }

  const ventasDiaTotal = (ventasDia || []).reduce((sum, v) => sum + Number(v.total || 0), 0)
  const cantidadVentasDia = (ventasDia || []).length

  // d) Órdenes activas (estado = 'PENDIENTE')
  const { count: ordenesActivas, error: errorOrdenes } = await supabase
    .from(TABLE_ORDENES)
    .select('id_orden', { count: 'exact', head: true })
    .eq('estado', 'PENDIENTE')

  if (errorOrdenes) {
    console.error('❌ Error al contar órdenes activas:', errorOrdenes)
    throw new Error(`Error al contar órdenes activas: ${errorOrdenes.message}`)
  }

  const resumen = {
    productos: productos || 0,
    proveedores: proveedores || 0,
    ventasDia: ventasDiaTotal,
    cantidadVentasDia,
    ordenesActivas: ordenesActivas || 0
  }

  console.log('✅ Resumen general obtenido:', resumen)
  return resumen
}

/**
 * Obtener ventas de los últimos 7 días para gráfico de barras
 * @returns {Promise<Array<{fecha: string, total: number}>>}
 */
export const getVentasUltimos7Dias = async () => {
  const hace7Dias = new Date()
  hace7Dias.setDate(hace7Dias.getDate() - 6)
  hace7Dias.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from(TABLE_VENTAS)
    .select('fecha_venta, total')
    .eq('estado', 'COMPLETADA')
    .gte('fecha_venta', hace7Dias.toISOString())

  if (error) {
    console.error('❌ Error al obtener ventas últimos 7 días:', error)
    throw new Error(`Error al obtener ventas últimos 7 días: ${error.message}`)
  }

  // Agrupar por día
  const dias = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric' })
    dias[key] = { fecha: label, total: 0 }
  }

  ;(data || []).forEach((v) => {
    const key = new Date(v.fecha_venta).toISOString().split('T')[0]
    if (dias[key]) {
      dias[key].total += Number(v.total || 0)
    }
  })

  const resultado = Object.values(dias)
  console.log('✅ Ventas últimos 7 días:', resultado)
  return resultado
}

/**
 * Obtener top 5 productos más vendidos para gráfico circular
 * @returns {Promise<Array<{name: string, value: number}>>}
 */
export const getProductosMasVendidos = async () => {
  const { data, error } = await supabase
    .from(TABLE_DETALLE_VENTAS)
    .select(`
      id_producto,
      cantidad,
      productos (
        nombre_producto
      )
    `)
    .order('cantidad', { ascending: false })
    .limit(50)

  if (error) {
    console.error('❌ Error al obtener productos más vendidos:', error)
    throw new Error(`Error al obtener productos más vendidos: ${error.message}`)
  }

  // Agrupar por producto
  const totals = {}
  ;(data || []).forEach((dv) => {
    const nombre = dv.productos?.nombre_producto || 'Producto'
    if (!totals[nombre]) {
      totals[nombre] = 0
    }
    totals[nombre] += Number(dv.cantidad || 0)
  })

  const resultado = Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  console.log('✅ Top 5 productos más vendidos:', resultado)
  return resultado
}

/**
 * Obtener ingresos mensuales del año actual para gráfico de línea
 * @returns {Promise<Array<{mes: string, total: number}>>}
 */
export const getIngresosMensuales = async () => {
  const anioActual = new Date().getFullYear()
  const inicioAnio = new Date(anioActual, 0, 1)
  const finAnio = new Date(anioActual, 11, 31, 23, 59, 59, 999)

  const { data, error } = await supabase
    .from(TABLE_VENTAS)
    .select('fecha_venta, total')
    .eq('estado', 'COMPLETADA')
    .gte('fecha_venta', inicioAnio.toISOString())
    .lte('fecha_venta', finAnio.toISOString())

  if (error) {
    console.error('❌ Error al obtener ingresos mensuales:', error)
    throw new Error(`Error al obtener ingresos mensuales: ${error.message}`)
  }

  // Nombres de meses en español
  const nombresMeses = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ]

  // Inicializar los 12 meses
  const meses = nombresMeses.map((mes, i) => ({
    mes,
    total: 0,
    index: i
  }))

  ;(data || []).forEach((v) => {
    const fecha = new Date(v.fecha_venta)
    const mesIndex = fecha.getMonth()
    if (meses[mesIndex]) {
      meses[mesIndex].total += Number(v.total || 0)
    }
  })

  const resultado = meses.map(({ mes, total }) => ({ mes, total }))
  console.log('✅ Ingresos mensuales:', resultado)
  return resultado
}

/**
 * Obtener productos con stock bajo/crítico
 * @returns {Promise<Array<{id_producto, sku, nombre_producto, stock_actual, stock_minimo}>>}
 */
export const getProductosStockBajo = async () => {
  const { data, error } = await supabase
    .from(TABLE_PRODUCTOS)
    .select('id_producto, sku, nombre_producto, stock_actual, stock_minimo')
    .eq('activo', true)
    .order('stock_actual', { ascending: true })
    .limit(20)

  if (error) {
    console.error('❌ Error al obtener productos con stock bajo:', error)
    throw new Error(`Error al obtener productos con stock bajo: ${error.message}`)
  }

  // Filtrar en cliente: stock_actual <= stock_minimo (requiere comparación de columnas)
  const resultado = (data || []).filter(
    p => Number(p.stock_actual) <= Number(p.stock_minimo)
  )

  console.log('✅ Productos con stock bajo:', resultado)
  return resultado
}
