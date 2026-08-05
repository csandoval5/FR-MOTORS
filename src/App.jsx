import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProductosPage from './pages/ProductosPage'
import VentasPage from './pages/VentasPage'
import ProveedoresPage from './pages/ProveedoresPage'
import ComprasPage from './pages/ComprasPage'
import ClientesPage from './pages/ClientesPage'
import TallerPage from './pages/TallerPage'
import CajaPage from './pages/CajaPage'
import UsuariosPage from './pages/UsuariosPage'

/**
 * Aplicación FR MOTORS
 * 
 * Sistema de Gestión para Taller y Almacén de Repuestos de Motocicletas
 * 
 * Rutas disponibles según rol:
 * - /login           → Página de inicio de sesión (público)
 * - /dashboard       → Dashboard principal (Admin, Vendedor, Mecánico)
 * - /pos             → Punto de Venta (Admin, Vendedor)
 * - /productos       → Gestión de Inventario (Admin, Vendedor)
 * - /proveedores     → Gestión de Proveedores (Admin)
 * - /compras         → Compras (Admin)
 * - /cuentas-pagar   → Cuentas por Pagar (Admin)
 * - /ordenes-taller  → Órdenes de Taller (Admin, Mecánico)
 * - /caja            → Arqueo de Caja (Admin)
 * - /analytics       → Dashboard Analítico (Admin)
 * - /usuarios        → Gestión de Usuarios (Admin)
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Ruta pública: Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas protegidas con layout principal */}
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pos" element={
          <ProtectedRoute allowedRoles={['Administrador', 'Vendedor']}>
            <VentasPage />
          </ProtectedRoute>
        } />
        <Route path="/productos" element={
          <ProtectedRoute allowedRoles={['Administrador', 'Vendedor']}>
            <ProductosPage />
          </ProtectedRoute>
        } />
<Route path="/proveedores" element={
          <ProtectedRoute allowedRoles={['Administrador']}>
            <ProveedoresPage />
          </ProtectedRoute>
        } />
        <Route path="/clientes" element={
          <ProtectedRoute allowedRoles={['Administrador', 'Vendedor']}>
            <ClientesPage />
          </ProtectedRoute>
        } />
<Route path="/compras" element={
          <ProtectedRoute allowedRoles={['Administrador']}>
            <ComprasPage />
          </ProtectedRoute>
        } />
        <Route path="/cuentas-pagar" element={
          <ProtectedRoute allowedRoles={['Administrador']}>
            <ProveedoresPage />
          </ProtectedRoute>
        } />
        <Route path="/ordenes-taller" element={
          <ProtectedRoute allowedRoles={['Administrador', 'Mecánico']}>
            <TallerPage />
          </ProtectedRoute>
        } />
        <Route path="/caja" element={
          <ProtectedRoute allowedRoles={['Administrador']}>
            <CajaPage />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute allowedRoles={['Administrador']}>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/usuarios" element={
          <ProtectedRoute allowedRoles={['Administrador']}>
            <UsuariosPage />
          </ProtectedRoute>
        } />
      </Route>

      {/* Redirección por defecto */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

/**
 * Componente principal de la aplicación
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

