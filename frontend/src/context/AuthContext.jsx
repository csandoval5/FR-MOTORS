import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loginUser, logoutUser, getCurrentSession, onAuthStateChange } from '../api/authService'

const AuthContext = createContext(null)

/**
 * Proveedor del contexto de autenticación
 * Provee estado de sesión, usuario, rol y funciones de login/logout
 * 
 * v2: Obtiene el rol desde user_metadata.rol directamente
 * sin consultar la tabla `usuarios` (que puede no existir aún en Supabase)
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Extrae el rol desde user_metadata del usuario
   */
  const extractRoleFromMetadata = (authUser) => {
    if (!authUser) return null
    const metadata = authUser.user_metadata || {}
    return {
      nombre: metadata.rol || 'Vendedor',
      id: metadata.id_rol || null,
      nivel_acceso: metadata.nivel_acceso || null,
      descripcion: metadata.descripcion_rol || null
    }
  }

  /**
   * Construye el objeto user completo desde la sesión de Auth
   */
  const buildUserFromSession = (authUser) => {
    if (!authUser) return null
    const metadata = authUser.user_metadata || {}
    return {
      id: authUser.id,
      email: authUser.email,
      nombres: metadata.nombres || authUser.email?.split('@')[0] || '',
      apellidos: metadata.apellidos || '',
      telefono: metadata.telefono || null,
      role: extractRoleFromMetadata(authUser)
    }
  }

  /**
   * Verificar si hay una sesión activa al cargar la aplicación
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { session: currentSession } = await getCurrentSession()

        if (currentSession?.user) {
          setSession(currentSession)
          setUser(buildUserFromSession(currentSession.user))
          console.log('🔍 Sesión recuperada para:', currentSession.user.email)
        }
      } catch (err) {
        console.error('Error al inicializar autenticación:', err)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Escuchar cambios en la autenticación (login/logout en otras pestañas)
    const unsubscribe = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setSession(session)
        setUser(buildUserFromSession(session.user))
        console.log('🔍 Auth state change: SIGNED_IN', session.user.email)
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        console.log('🔍 Auth state change: SIGNED_OUT')
      }
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])

  /**
   * Función de inicio de sesión
   */
  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const sessionData = await loginUser(email, password)
      setSession(sessionData.session)
      setUser({
        id: sessionData.user.id,
        email: sessionData.user.email,
        ...sessionData.userData,
        role: sessionData.role
      })
      return sessionData
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Función de cierre de sesión
   */
  const logout = useCallback(async () => {
    setLoading(true)
    try {
      await logoutUser()
      setSession(null)
      setUser(null)
      setError(null)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Limpiar errores
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Valores expuestos por el contexto
   */
  const value = {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!session,
    role: user?.role || null,
    roleName: user?.role?.nombre || null,
    isAdmin: user?.role?.nombre === 'Administrador',
    isVendedor: user?.role?.nombre === 'Vendedor',
    isMecanico: user?.role?.nombre === 'Mecánico',
    login,
    logout,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook personalizado para acceder al contexto de autenticación
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}

export default AuthContext
