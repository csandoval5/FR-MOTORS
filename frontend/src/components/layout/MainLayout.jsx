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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar onMenuToggle={toggleSidebar} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
