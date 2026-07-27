import dayjs from 'dayjs'
import 'dayjs/locale/es'

// Configurar locale a español
dayjs.locale('es')

/**
 * Formatea una fecha al formato local de Ecuador
 * @param {string|Date} date - Fecha a formatear
 * @param {string} format - Formato deseado (default: 'DD/MM/YYYY')
 * @returns {string} - Fecha formateada
 */
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return ''
  return dayjs(date).format(format)
}

/**
 * Formatea fecha y hora
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha y hora formateada (ej: 15/03/2025 14:30)
 */
export const formatDateTime = (date) => {
  if (!date) return ''
  return dayjs(date).format('DD/MM/YYYY HH:mm')
}

/**
 * Formatea fecha en formato largo legible
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Ej: "15 de marzo de 2025"
 */
export const formatDateLong = (date) => {
  if (!date) return ''
  return dayjs(date).format('D [de] MMMM [de] YYYY')
}

/**
 * Retorna tiempo relativo (hace X días, en X días, etc.)
 * @param {string|Date} date - Fecha a comparar
 * @returns {string} - Tiempo relativo
 */
export const formatRelativeTime = (date) => {
  if (!date) return ''
  const now = dayjs()
  const target = dayjs(date)
  const diffDays = now.diff(target, 'day')

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 0) return `En ${Math.abs(diffDays)} días`
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`
  return `Hace ${Math.floor(diffDays / 365)} años`
}

/**
 * Verifica si una fecha está vencida respecto a hoy
 * @param {string|Date} date - Fecha a verificar
 * @returns {boolean} - true si está vencida
 */
export const isOverdue = (date) => {
  if (!date) return false
  return dayjs(date).isBefore(dayjs(), 'day')
}

/**
 * Calcula días restantes hasta una fecha
 * @param {string|Date} date - Fecha objetivo
 * @returns {number} - Días restantes (negativo si ya pasó)
 */
export const daysUntil = (date) => {
  if (!date) return 0
  return dayjs(date).diff(dayjs(), 'day')
}

/**
 * Obtener primer y último día del mes actual
 * @returns {{ start: string, end: string }}
 */
export const getCurrentMonthRange = () => {
  const now = dayjs()
  return {
    start: now.startOf('month').format('YYYY-MM-DD'),
    end: now.endOf('month').format('YYYY-MM-DD'),
  }
}

/**
 * Obtener primer y último día de la semana actual
 * @returns {{ start: string, end: string }}
 */
export const getCurrentWeekRange = () => {
  const now = dayjs()
  return {
    start: now.startOf('week').format('YYYY-MM-DD'),
    end: now.endOf('week').format('YYYY-MM-DD'),
  }
}

export default dayjs

