# FR MOTORS - Frontend (React + Vite + TailwindCSS)

## Estructura de Carpetas del Proyecto

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env
├── .env.example
├── public/
│   ├── favicon.ico
│   └── logo-frmotors.png
│
└── src/
    ├── main.jsx                    # Punto de entrada de la aplicación
    ├── App.jsx                     # Componente raíz con routing
    ├── index.css                   # Estilos globales (Tailwind directives)
    │
    ├── api/                        # Capa de servicios / API
    │   ├── supabaseClient.js       # Configuración de cliente Supabase
    │   ├── authService.js          # Servicios de autenticación
    │   ├── productosService.js     # CRUD de productos
    │   ├── proveedoresService.js   # CRUD de proveedores
    │   ├── ventasService.js        # Gestión de ventas / facturación
    │   ├── comprasService.js       # Gestión de compras
    │   ├── cuentasPagarService.js  # Cuentas por pagar
    │   ├── ordenesTallerService.js # Órdenes de taller
    │   ├── cajaService.js          # Arqueo de caja
    │   └── dashboardService.js     # Datos para dashboards
    │
    ├── components/                 # Componentes reutilizables
    │   ├── ui/                     # Componentes de interfaz genérica
    │   │   ├── Button.jsx
    │   │   ├── Input.jsx
    │   │   ├── Select.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Table.jsx
    │   │   ├── Card.jsx
    │   │   ├── Badge.jsx
    │   │   ├── Spinner.jsx
    │   │   ├── Alert.jsx
    │   │   ├── Pagination.jsx
    │   │   └── SearchBar.jsx
    │   │
    │   ├── layout/                 # Componentes de layout
    │   │   ├── Sidebar.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── MainLayout.jsx
    │   │   ├── AuthLayout.jsx
    │   │   └── Footer.jsx
    │   │
    │   ├── productos/              # Componentes específicos de productos
    │   │   ├── ProductoForm.jsx
    │   │   ├── ProductoCard.jsx
    │   │   ├── ProductoTable.jsx
    │   │   ├── StockAlertBadge.jsx
    │   │   └── ProductoSearch.jsx
    │   │
    │   ├── ventas/                 # Componentes de facturación/POS
    │   │   ├── POSPanel.jsx
    │   │   ├── CarritoCompras.jsx
    │   │   ├── ItemCarrito.jsx
    │   │   ├── ResumenVenta.jsx
    │   │   ├── MetodoPagoSelector.jsx
    │   │   └── FacturaPreview.jsx
    │   │
    │   ├── proveedores/
    │   │   ├── ProveedorForm.jsx
    │   │   └── ProveedorTable.jsx
    │   │
    │   ├── compras/
    │   │   ├── CompraForm.jsx
    │   │   └── CompraTable.jsx
    │   │
    │   ├── cuentas-pagar/
    │   │   ├── CuentaPagarTable.jsx
    │   │   ├── AbonoForm.jsx
    │   │   └── EstadoCuentaBadge.jsx
    │   │
    │   ├── ordenes-taller/
    │   │   ├── OrdenTallerForm.jsx
    │   │   ├── OrdenTallerCard.jsx
    │   │   ├── DetalleRepuestosForm.jsx
    │   │   └── EstadoTimeline.jsx
    │   │
    │   ├── caja/
    │   │   ├── AperturaCajaForm.jsx
    │   │   ├── CierreCajaForm.jsx
    │   │   ├── MovimientosCajaTable.jsx
    │   │   └── ResumenCajaCard.jsx
    │   │
    │   ├── dashboard/
    │   │   ├── StatCard.jsx
    │   │   ├── IngresosChart.jsx      # Gráfico de ingresos (Recharts)
    │   │   ├── TopProductosChart.jsx  # Top productos más vendidos
    │   │   ├── VentasSemanalesChart.jsx
    │   │   ├── CuentasPagarChart.jsx
    │   │   └── StockBajoTable.jsx
    │   │
    │   └── auth/
    │       ├── LoginForm.jsx
    │       ├── RegisterForm.jsx
    │       └── ProtectedRoute.jsx
    │
    ├── pages/                      # Páginas completas (vistas)
    │   ├── LoginPage.jsx
    │   ├── DashboardPage.jsx
    │   ├── productos/
    │   │   ├── ProductosListPage.jsx
    │   │   ├── ProductoNuevoPage.jsx
    │   │   └── ProductoEditarPage.jsx
    │   ├── ventas/
    │   │   ├── POSPage.jsx              # Punto de venta (mostrador)
    │   │   ├── VentasHistorialPage.jsx
    │   │   └── FacturaDetallePage.jsx
    │   ├── proveedores/
    │   │   ├── ProveedoresListPage.jsx
    │   │   └── ProveedorNuevoPage.jsx
    │   ├── compras/
    │   │   ├── ComprasListPage.jsx
    │   │   └── CompraNuevaPage.jsx
    │   ├── cuentas-pagar/
    │   │   └── CuentasPagarPage.jsx
    │   ├── ordenes-taller/
    │   │   ├── OrdenesTallerListPage.jsx
    │   │   ├── OrdenTallerNuevaPage.jsx
    │   │   └── OrdenTallerDetallePage.jsx
    │   ├── caja/
    │   │   ├── CajaPage.jsx
    │   │   └── HistorialCajaPage.jsx
    │   ├── usuarios/
    │   │   ├── UsuariosListPage.jsx
    │   │   └── UsuarioNuevoPage.jsx
    │   └── configuracion/
    │       └── ConfiguracionPage.jsx
    │
    ├── hooks/                      # Custom hooks
    │   ├── useAuth.js
    │   ├── useProductos.js
    │   ├── useVentas.js
    │   ├── useProveedores.js
    │   ├── useCuentasPagar.js
    │   ├── useOrdenesTaller.js
    │   ├── useCaja.js
    │   ├── useDashboard.js
    │   └── useDebounce.js
    │
    ├── context/                    # Contextos de React
    │   ├── AuthContext.jsx
    │   └── CajaContext.jsx
    │
    ├── utils/                      # Utilidades y helpers
    │   ├── formatCurrency.js
    │   ├── formatDate.js
    │   ├── validators.js
    │   ├── constants.js
    │   └── helpers.js
    │
    └── styles/                     # Estilos adicionales
        └── custom.css
```

## Stack Tecnológico del Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | ^18.x | Librería UI |
| Vite | ^5.x | Bundler / Dev Server |
| TailwindCSS | ^3.x | Framework CSS utilitario |
| React Router DOM | ^6.x | Routing SPA |
| Recharts | ^2.x | Gráficos y dashboards |
| Supabase JS Client | ^2.x | Conexión a Supabase |
| React Hot Toast | ^2.x | Notificaciones toast |
| Lucide React | ^latest | Íconos SVG |
| Dayjs | ^1.x | Manejo de fechas |
| React Hook Form | ^7.x | Manejo de formularios |
| Zod | ^3.x | Validación de schemas |

## Convenciones de Nomenclatura

- **Archivos de componentes**: PascalCase (ej: `ProductoForm.jsx`)
- **Archivos de servicios**: camelCase (ej: `productosService.js`)
- **Archivos de hooks**: camelCase con prefijo `use` (ej: `useProductos.js`)
- **Archivos de páginas**: PascalCase con sufijo `Page` (ej: `ProductosListPage.jsx`)
- **Variables y funciones**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Estados booleanos**: prefijo `is`, `has`, `show` (ej: `isLoading`, `hasError`)

## Principios de Arquitectura

1. **Separación de concerns**: Cada capa (api, components, pages, hooks) tiene responsabilidades bien definidas.
2. **Componentes atómicos**: Los componentes UI son pequeños, reutilizables y testeados.
3. **Custom Hooks**: Toda la lógica de estado y efectos se encapsula en hooks.
4. **Servicios desacoplados**: La capa API abstrae completamente la comunicación con Supabase.
5. **Manejo de errores**: Centralizado mediante interceptores en la capa de servicios.

