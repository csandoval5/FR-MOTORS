import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

/**
 * Layout principal del sistema FR MOTORS
 *
 * Estructura:
 * - Sidebar (menú lateral izquierdo)
 * - Navbar (barra superior)
 * - Contenido principal dinámico (Outlet)
 *
 * Comportamiento responsive:
 * - Desktop: Sidebar fijo + contenido a la derecha
 * - Mobile: Sidebar oculto, toggle con botón hamburguesa
 */
export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main content area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Navbar */}
        <Navbar onMenuToggle={toggleSidebar} />

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-4 lg:p-5 overflow-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="px-4 sm:px-6 lg:px-8 py-4 border-t border-gray-200 bg-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
            <p>
              © {new Date().getFullYear()} FR MOTORS — El Coca, Ecuador
            </p>
            <p>
              Sistema de Gestión Integral v1.0.0
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

