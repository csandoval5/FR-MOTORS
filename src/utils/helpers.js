/**
 * Funciones helper generales para FR MOTORS
 */

/**
 * Genera un número de factura/secuencial
 * @param {string} prefijo - Prefijo del documento (FAC, NV, OT)
 * @param {number} secuencial - Número secuencial
 * @returns {string} - Ej: FAC-000001
 */
export const generarSecuencial = (prefijo = 'FAC', secuencial = 1) => {
  const padded = String(secuencial).padStart(6, '0')
  return `${prefijo}-${padded}`
}

/**
 * Genera un código SKU para producto basado en categoría y nombre
 * @param {string} categoria - Nombre de la categoría
 * @param {string} nombre - Nombre del producto
 * @param {number} id - ID del producto
 * @returns {string} - Código SKU generado
 */
export const generarSKU = (categoria = '', nombre = '', id = 0) => {
  const catPrefix = categoria
    .split(' ')
    .map(word => word.substring(0, 2).toUpperCase())
    .join('')
    .substring(0, 4)

  const namePrefix = nombre
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 3)

  const idPadded = String(id).padStart(4, '0')

  return `${catPrefix}${namePrefix}${idPadded}`
}

/**
 * Calcula el IVA (15% Ecuador)
 * @param {number} subtotal - Subtotal sin IVA
 * @param {number} porcentaje - Porcentaje de IVA (default: 15)
 * @returns {{ iva: number, total: number }}
 */
export const calcularIVA = (subtotal, porcentaje = 15) => {
  const iva = subtotal * (porcentaje / 100)
  return {
    iva: Math.round(iva * 100) / 100,
    total: subtotal + Math.round(iva * 100) / 100
  }
}

/**
 * Calcula el cambio en una transacción
 * @param {number} total - Total a pagar
 * @param {number} montoPagado - Monto con el que paga el cliente
 * @returns {{ cambio: number, suficiente: boolean }}
 */
export const calcularCambio = (total, montoPagado) => {
  const cambio = montoPagado - total
  return {
    cambio: Math.round(cambio * 100) / 100,
    suficiente: cambio >= 0,
    faltante: cambio < 0 ? Math.abs(cambio) : 0
  }
}

/**
 * Trunca un texto a una longitud máxima
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - Texto truncado con ...
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text || ''
  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Capitaliza la primera letra de cada palabra
 * @param {string} text - Texto a capitalizar
 * @returns {string} - Texto capitalizado
 */
export const capitalizeWords = (text) => {
  if (!text) return ''
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Obtiene las iniciales de un nombre (para avatares)
 * @param {string} nombres
 * @param {string} apellidos
 * @returns {string} - Iniciales (ej: "JD")
 */
export const getInitials = (nombres = '', apellidos = '') => {
  const first = nombres.charAt(0) || ''
  const last = apellidos.charAt(0) || ''
  return (first + last).toUpperCase()
}

/**
 * Genera colores para badges/avatares basado en un string
 * @param {string} str - String para generar el color
 * @returns {string} - Clase de color Tailwind
 */
export const getColorFromString = (str) => {
  const colors = [
    'bg-primary-100 text-primary-700',
    'bg-secondary-100 text-secondary-700',
    'bg-warning-100 text-warning-700',
    'bg-danger-100 text-danger-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-indigo-100 text-indigo-700',
    'bg-teal-100 text-teal-700'
  ]

  if (!str) return colors[0]
  
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

/**
 * Clona un objeto eliminando referencias
 * @param {object} obj - Objeto a clonar
 * @returns {object} - Clon del objeto
 */
export const deepClone = (obj) => {
  try {
    return JSON.parse(JSON.stringify(obj))
  } catch {
    return { ...obj }
  }
}

/**
 * Agrupa un array de objetos por una clave
 * @param {Array} array - Array a agrupar
 * @param {string} key - Clave para agrupar
 * @returns {object} - Objeto agrupado
 */
export const groupBy = (array, key) => {
  if (!array || !key) return {}
  return array.reduce((result, currentValue) => {
    const groupKey = currentValue[key]
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(currentValue)
    return result
  }, {})
}

/**
 * Retraso (delay) para simular operaciones asíncronas
 * @param {number} ms - Milisegundos de retraso
 * @returns {Promise}
 */
export const delay = (ms = 1000) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Convierte un string a slug URL-friendly
 * @param {string} text
 * @returns {string}
 */
export const slugify = (text) => {
  if (!text) return ''
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Verifica si el dispositivo es móvil
 * @returns {boolean}
 */
export const isMobile = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

