/**
 * Constantes globales del sistema FR MOTORS
 */

// === ROLES DE USUARIO ===
export const ROLES = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  MECANICO: 'Mecánico'
}

export const ROLES_LIST = Object.values(ROLES)

// === ESTADOS DE ÓRDENES DE TALLER ===
export const ESTADOS_ORDEN_TALLER = {
  PENDIENTE: 'PENDIENTE',
  EN_REVISION: 'EN_REVISION',
  EN_REPARACION: 'EN_REPARACION',
  ESPERANDO_REPUESTOS: 'ESPERANDO_REPUESTOS',
  FINALIZADA: 'FINALIZADA',
  ENTREGADA: 'ENTREGADA',
  CANCELADA: 'CANCELADA'
}

export const ESTADOS_ORDEN_TALLER_LISTA = [
  { value: 'PENDIENTE', label: 'Pendiente', color: 'bg-gray-100 text-gray-700' },
  { value: 'EN_REVISION', label: 'En Revisión', color: 'bg-blue-100 text-blue-700' },
  { value: 'EN_REPARACION', label: 'En Reparación', color: 'bg-warning-100 text-warning-700' },
  { value: 'ESPERANDO_REPUESTOS', label: 'Esperando Repuestos', color: 'bg-purple-100 text-purple-700' },
  { value: 'FINALIZADA', label: 'Finalizada', color: 'bg-secondary-100 text-secondary-700' },
  { value: 'ENTREGADA', label: 'Entregada', color: 'bg-primary-100 text-primary-700' },
  { value: 'CANCELADA', label: 'Cancelada', color: 'bg-danger-100 text-danger-700' }
]

// === ESTADOS DE CUENTAS POR PAGAR ===
export const ESTADOS_CUENTA_PAGAR = {
  PENDIENTE: 'PENDIENTE',
  PARCIAL: 'PARCIAL',
  PAGADA: 'PAGADA',
  VENCIDA: 'VENCIDA'
}

// === TIPOS DE COMPROBANTE ===
export const TIPOS_COMPROBANTE = {
  FACTURA: 'FACTURA',
  NOTA_VENTA: 'NOTA_VENTA',
  TICKET: 'TICKET'
}

// === MÉTODOS DE PAGO ===
export const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo', icon: '💰' },
  { value: 'TARJETA_CREDITO', label: 'Tarjeta de Crédito', icon: '💳' },
  { value: 'TARJETA_DEBITO', label: 'Tarjeta de Débito', icon: '💳' },
  { value: 'TRANSFERENCIA', label: 'Transferencia Bancaria', icon: '🏦' },
  { value: 'DEPOSITO', label: 'Depósito', icon: '🏦' }
]

// === IVA ECUADOR ===
export const IVA_PORCENTAJE = 15 // 15% en Ecuador

// === LÍMITES Y UMBRALES ===
export const LIMITES = {
  STOCK_MINIMO_POR_DEFECTO: 5,
  STOCK_MAXIMO_POR_DEFECTO: 100,
  UMBRAL_FALTANTE_CAJA_PORCENTAJE: 5, // 5% de diferencia permitida
  UMBRAL_FALTANTE_CAJA_MONTO: 10.00,  // $10 de diferencia permitida
  MAX_INTENTOS_LOGIN: 5,
  ITEMS_POR_PAGINA: 20
}

// === RUTAS DEL SISTEMA ===
export const RUTAS = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  POS: '/pos',
  PRODUCTOS: '/productos',
  PROVEEDORES: '/proveedores',
  COMPRAS: '/compras',
  CUENTAS_PAGAR: '/cuentas-pagar',
  ORDENES_TALLER: '/ordenes-taller',
  CAJA: '/caja',
  ANALYTICS: '/analytics',
  USUARIOS: '/usuarios',
  CONFIGURACION: '/configuracion'
}

// === MENSAJES DEL SISTEMA ===
export const MENSAJES = {
  SESION_EXITOSA: 'Inicio de sesión exitoso',
  SESION_CERRADA: 'Sesión cerrada correctamente',
  ERROR_CONEXION: 'Error de conexión con el servidor',
  OPERACION_EXITOSA: 'Operación realizada exitosamente',
  OPERACION_FALLIDA: 'Error al realizar la operación',
  STOCK_INSUFICIENTE: 'Stock insuficiente para completar la operación',
  CAMBIOS_GUARDADOS: 'Cambios guardados correctamente',
  REGISTRO_ELIMINADO: 'Registro eliminado correctamente',
  CONFIRMAR_ELIMINACION: '¿Estás seguro de eliminar este registro?'
}

// === TEMAS Y CONFIGURACIÓN VISUAL ===
export const TEMAS = {
  LIGHT: 'light',
  DARK: 'dark'
}

export const APP_INFO = {
  NOMBRE: 'FR MOTORS',
  DESCRIPCION: 'Sistema de Gestión para Taller y Almacén de Repuestos',
  UBICACION: 'El Coca, Ecuador',
  VERSION: '1.0.0',
  ANIO_FUNDACION: 2025
}

