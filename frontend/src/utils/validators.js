/**
 * Validadores de formularios para FR MOTORS
 */

/**
 * Valida un email
 * @param {string} email
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return { isValid: false, message: 'El correo electrónico es requerido' }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: 'Formato de correo electrónico inválido' }
  }
  return { isValid: true, message: '' }
}

/**
 * Valida una contraseña
 * @param {string} password
 * @param {object} options
 * @returns {{ isValid: boolean, message: string }}
 */
export const validatePassword = (password, options = {}) => {
  const { minLength = 6, requireNumber = false, requireSpecial = false } = options

  if (!password) {
    return { isValid: false, message: 'La contraseña es requerida' }
  }
  if (password.length < minLength) {
    return { isValid: false, message: `La contraseña debe tener al menos ${minLength} caracteres` }
  }
  if (requireNumber && !/\d/.test(password)) {
    return { isValid: false, message: 'La contraseña debe contener al menos un número' }
  }
  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe contener al menos un carácter especial' }
  }
  return { isValid: true, message: '' }
}

/**
 * Valida un número de cédula ecuatoriana
 * @param {string} cedula
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateCedulaEcuatoriana = (cedula) => {
  if (!cedula || cedula.length !== 10) {
    return { isValid: false, message: 'La cédula debe tener 10 dígitos' }
  }
  
  const digitos = cedula.split('').map(Number)
  const provincia = digitos[0] * 10 + digitos[1]
  
  if (provincia < 1 || provincia > 24) {
    return { isValid: false, message: 'Código de provincia inválido' }
  }

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
  let suma = 0

  for (let i = 0; i < 9; i++) {
    let valor = digitos[i] * coeficientes[i]
    if (valor >= 10) valor -= 9
    suma += valor
  }

  const digitoVerificador = (10 - (suma % 10)) % 10
  if (digitoVerificador !== digitos[9]) {
    return { isValid: false, message: 'Cédula inválida (dígito verificador incorrecto)' }
  }

  return { isValid: true, message: '' }
}

/**
 * Valida un número de RUC ecuatoriano
 * @param {string} ruc
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateRucEcuatoriano = (ruc) => {
  if (!ruc || ruc.length !== 13) {
    return { isValid: false, message: 'El RUC debe tener 13 dígitos' }
  }

  // Validar cédula (primeros 10 dígitos)
  const cedulaValidation = validateCedulaEcuatoriana(ruc.substring(0, 10))
  if (!cedulaValidation.isValid) {
    return cedulaValidation
  }

  // Los últimos 3 dígitos deben ser 001
  if (ruc.substring(10) !== '001') {
    return { isValid: false, message: 'RUC inválido (debe terminar en 001)' }
  }

  return { isValid: true, message: '' }
}

/**
 * Valida un número de teléfono ecuatoriano
 * @param {string} telefono
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateTelefono = (telefono) => {
  if (!telefono) {
    return { isValid: false, message: 'El teléfono es requerido' }
  }
  const cleaned = telefono.replace(/[\s\-\(\)]/g, '')
  const phoneRegex = /^(\+593|0)?[0-9]{9,10}$/
  if (!phoneRegex.test(cleaned)) {
    return { isValid: false, message: 'Formato de teléfono inválido (ej: 0999999999)' }
  }
  return { isValid: true, message: '' }
}

/**
 * Valida un precio (positivo y con máximo 2 decimales)
 * @param {number|string} precio
 * @param {object} options
 * @returns {{ isValid: boolean, message: string }}
 */
export const validatePrecio = (precio, options = {}) => {
  const { min = 0, max = 999999.99, required = true } = options
  
  if (required && (precio === null || precio === undefined || precio === '')) {
    return { isValid: false, message: 'El precio es requerido' }
  }

  const num = Number(precio)
  if (isNaN(num)) {
    return { isValid: false, message: 'El precio debe ser un número' }
  }
  if (num < min) {
    return { isValid: false, message: `El precio mínimo es $${min.toFixed(2)}` }
  }
  if (num > max) {
    return { isValid: false, message: `El precio máximo es $${max.toFixed(2)}` }
  }

  return { isValid: true, message: '' }
}

/**
 * Valida stock (entero no negativo)
 * @param {number|string} stock
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateStock = (stock) => {
  if (stock === null || stock === undefined || stock === '') {
    return { isValid: false, message: 'El stock es requerido' }
  }

  const num = Number(stock)
  if (!Number.isInteger(num)) {
    return { isValid: false, message: 'El stock debe ser un número entero' }
  }
  if (num < 0) {
    return { isValid: false, message: 'El stock no puede ser negativo' }
  }

  return { isValid: true, message: '' }
}

/**
 * Valida un campo requerido genérico
 * @param {string} value
 * @param {string} fieldName
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateRequired = (value, fieldName = 'Este campo') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { isValid: false, message: `${fieldName} es requerido` }
  }
  return { isValid: true, message: '' }
}

/**
 * Valida que una cantidad no supere el stock disponible
 * @param {number} cantidad
 * @param {number} stockDisponible
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateCantidadStock = (cantidad, stockDisponible) => {
  if (!cantidad || cantidad <= 0) {
    return { isValid: false, message: 'La cantidad debe ser mayor a 0' }
  }
  if (cantidad > stockDisponible) {
    return { isValid: false, message: `Stock insuficiente. Disponible: ${stockDisponible} unidades` }
  }
  return { isValid: true, message: '' }
}

