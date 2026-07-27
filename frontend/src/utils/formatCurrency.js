/**
 * Formatea un número como moneda en USD (Ecuador)
 * @param {number} amount - Monto a formatear
 * @param {object} options - Opciones de formato
 * @returns {string} - Monto formateado (ej: $1,234.56)
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    decimals = 2,
    showSymbol = true,
    showCents = true,
  } = options

  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '$0.00' : '0.00'
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'USD',
    minimumFractionDigits: showCents ? decimals : 0,
    maximumFractionDigits: decimals,
  }).format(amount)

  return formatted
}

/**
 * Formatea un número como porcentaje
 * @param {number} value - Valor a formatear (ej: 0.15 para 15%)
 * @param {number} decimals - Decimales a mostrar
 * @returns {string} - Porcentaje formateado (ej: 15.00%)
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%'
  }
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Convierte un número a formato de texto para facturas (opcional)
 * @param {number} amount - Monto en números
 * @returns {string} - Monto en letras (simplificado)
 */
export const numberToWords = (amount) => {
  // Implementación básica - en producción usar una librería
  const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
  const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE']
  const tens = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

  const integerPart = Math.floor(amount)
  const decimalPart = Math.round((amount - integerPart) * 100)

  // Simplificación: solo retorna el valor numérico
  return `${formatCurrency(amount)} (${decimalPart}/100 USD)`
}

