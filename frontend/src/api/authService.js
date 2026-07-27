import { supabase } from './supabaseClient'

/**
 * Servicio de Autenticación para FR MOTORS (v2 - sin tabla usuarios)
 * 
 * Flujo simplificado:
 * 1. Usuario ingresa email + password
 * 2. Supabase Auth valida las credenciales
 * 3. Se obtiene el rol desde user_metadata.rol del usuario autenticado
 * 4. Se retorna la sesión completa
 */

/**
 * Inicia sesión con email y contraseña
 * Usa directamente Supabase Auth sin consultar la tabla `usuarios`
 * @param {string} email - Correo electrónico del usuario
 * @param {string} password - Contraseña
 * @returns {Promise<{user: object, session: object, role: object}>}
 */
export const loginUser = async (email, password) => {
  console.log('🔍 DEBUG loginUser: Intentando login con:', email)

  // 1. Autenticar contra Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (authError) {
    console.error('❌ Error de autenticación:', authError.message)
    throw new Error(handleAuthError(authError))
  }

  if (!authData?.user) {
    throw new Error('No se pudo obtener la información del usuario')
  }

  console.log('✅ Usuario autenticado:', authData.user.id, authData.user.email)

  // 2. Obtener rol desde user_metadata
  // Los roles esperados: 'Administrador', 'Vendedor', 'Mecánico'
  const userMetadata = authData.user.user_metadata || {}
  const roleName = userMetadata.rol || 'Vendedor' // default fallback

  console.log('🔍 user_metadata completo:', userMetadata)
  console.log('🔍 Rol desde metadata:', roleName)

  // 3. Estructurar la respuesta (sin consultar tabla usuarios)
  const sessionData = {
    session: authData.session,
    user: {
      id: authData.user.id,
      email: authData.user.email
    },
    userData: {
      id_usuario: null, // No disponible hasta que exista la tabla
      nombres: userMetadata.nombres || authData.user.email?.split('@')[0] || '',
      apellidos: userMetadata.apellidos || '',
      email: authData.user.email,
      telefono: userMetadata.telefono || null
    },
    role: {
      nombre: roleName
    }
  }

  console.log('🎉 Login exitoso para:', authData.user.email, '- Rol:', roleName)
  return sessionData
}

/**
 * Cierra la sesión del usuario
 */
export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error al cerrar sesión:', error.message)
    throw new Error('Error al cerrar sesión')
  }
}

/**
 * Obtiene la sesión actual desde Supabase
 * @returns {Promise<{session: object|null, user: object|null}>}
 */
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error al obtener sesión:', error.message)
    return { session: null, user: null }
  }
  return { session, user: session?.user ?? null }
}

/**
 * Escucha cambios en el estado de autenticación
 * @param {function} callback - Función que recibe el evento y la sesión
 * @returns {function} - Función para cancelar la suscripción
 */
export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  return subscription.unsubscribe.bind(subscription)
}

/**
 * Restablece la contraseña del usuario
 * @param {string} email - Correo electrónico del usuario
 */
export const resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  if (error) {
    throw new Error(handleAuthError(error))
  }
  return { message: 'Se ha enviado un enlace de restablecimiento a tu correo electrónico' }
}

/**
 * Manejo de errores de autenticación con mensajes en español
 */
const handleAuthError = (error) => {
  const errorMessages = {
    'Invalid login credentials': 'Credenciales inválidas. Verifica tu email y contraseña.',
    'Email not confirmed': 'Por favor, confirma tu correo electrónico antes de iniciar sesión.',
    'Invalid email': 'El formato del correo electrónico no es válido.',
    'User not found': 'No se encontró un usuario con ese correo electrónico.',
    'Too many requests': 'Demasiados intentos. Intenta de nuevo más tarde.',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
    'Email rate limit exceeded': 'Se ha excedido el límite de intentos. Intenta de nuevo en unos minutos.'
  }

  return errorMessages[error.message] || error.message || 'Error desconocido al iniciar sesión'
}
