import { createClient } from '@supabase/supabase-js'

// ============================================================
// DEBUG: Verificar que las variables de entorno se carguen bien
// ============================================================
console.log('🔍 DEBUG supabaseClient.js:')
console.log('  - VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('  - VITE_SUPABASE_ANON_KEY existe:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
console.log('  - VITE_SUPABASE_ANON_KEY (primeros 20 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...')

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Error: Variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no configuradas. Verifica el archivo .env'
  )
}

if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
  console.error('❌ Error: VITE_SUPABASE_URL no tiene un formato válido de URL:', supabaseUrl)
}

if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
  console.error('❌ Error: VITE_SUPABASE_ANON_KEY parece inválida (muy corta):', supabaseAnonKey)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

console.log('🔍 DEBUG: Supabase client creado:', supabase ? '✅ OK' : '❌ FALLÓ')
console.log('🔍 DEBUG: supabase.auth disponible:', !!supabase?.auth)

/**
 * Helper para verificar el estado de la conexión a Supabase
 */
export const checkSupabaseConnection = async () => {
  try {
    console.log('🔍 DEBUG: Verificando conexión a Supabase...')
    const { data, error } = await supabase.from('roles').select('count', { count: 'exact', head: true })
    if (error) {
      console.error('❌ Error de conexión a Supabase:', error.message)
      return false
    }
    console.log('✅ Conexión a Supabase establecida correctamente')
    return true
  } catch (err) {
    console.error('❌ Error de conexión a Supabase (exception):', err.message)
    return false
  }
}
