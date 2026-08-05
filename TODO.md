# TODO — FR MOTORS: Correcciones y Mejoras

## Paso 1: Error 1 — `page is not defined` en VentasPage.jsx
- [x] `src/pages/VentasPage.jsx`: Destructurar `page` desde `useVentas()`

## Paso 2: Error 3 — `numero_identificacion` → `ruc_cedula`
- [x] `src/api/productosService.js`: Cambiar `numero_identificacion` → `ruc_cedula` en `getProveedoresActivos`
- [x] `src/api/proveedoresService.js`: Cambiar `numero_identificacion` → `ruc_cedula` en el OR de búsqueda

## Paso 3: Error 4 — JOIN con `usuarios (nombres, apellidos)` → `(nombre_completo, email)`
- [x] `src/api/ventasService.js`: Corregir JOINs en `getVentas` y `getVentaById`
- [x] `src/api/cajaService.js`: Corregir JOIN en `getArqueos`
- [x] `src/api/tallerService.js`: Corregir JOINs en `getOrdenesTaller` y `getOrdenTallerById`

## Paso 4: Error 2 — Puerto fijo 5174 en Vite
- [x] `vite.config.js`: Agregar `server: { port: 5174, strictPort: true }`

## Paso 5: Historial de Ventas (JOIN de usuarios)
- [x] `src/api/ventasService.js`: Agregar fallback si el JOIN embebido falla
- [x] `src/pages/VentasPage.jsx`: Agregar logging de diagnóstico y manejo de errores
- [ ] **PENDIENTE**: Ejecutar `database/03_rls_punto_venta.sql` en Supabase SQL Editor

## Paso 6: Dashboard con Datos Reales
- [x] `src/api/dashboardService.js`: NUEVO servicio de resumen, gráficos y stock bajo
- [x] `src/pages/DashboardPage.jsx`: Actualizar con datos reales, gráficos Recharts, loading y errores

## Paso 7: MÓDULO DE CLIENTES (completo)
### Servicio y Hook
- [x] `src/api/clientesService.js`: NUEVO — CRUD completo de clientes (getClientes, getClientesActivos, getClienteById, createCliente, updateCliente, deleteCliente, verificarIdentificacionExistente)
- [x] `src/hooks/useClientes.js`: NUEVO — Hook con clientes, clientesActivos, paginación, búsqueda y operaciones CRUD

### Página de gestión
- [x] `src/pages/ClientesPage.jsx`: NUEVO — CRUD completo con tabla, búsqueda, paginación, modal crear/editar, soft delete, validación de identificación única

### Integración con Ventas (POS)
- [x] `src/api/ventasService.js`: Agregar JOIN con `clientes` en `getVentas` y comentario de columnas
- [x] `src/pages/VentasPage.jsx`: Reemplazar "Cliente Genérico" por dropdown de clientes reales
- [x] `src/pages/VentasPage.jsx`: Agregar modal "Nuevo Cliente" rápido (alta desde el POS)
- [x] `src/pages/VentasPage.jsx`: Guardar `id_cliente` (Number) en la venta al cobrar
- [x] `src/pages/VentasPage.jsx`: Mostrar nombre del cliente en el historial de ventas

### Navegación y rutas
- [x] `src/App.jsx`: Agregar ruta `/clientes` (Admin y Vendedor)
- [x] `src/components/layout/Sidebar.jsx`: Agregar enlace "Clientes" (icono UserRound) en sección Gestión

## Paso 8: MÓDULO DE PROVEEDORES (completo)
### Servicio y Hook
- [x] `src/api/proveedoresService.js`: REESCRITO — ajustado al esquema real (`ruc_cedula`, `nombre_contacto`, `telefono`, `ciudad`, `productos_suministra`, `activo`, `creado_en`). Funciones: getProveedores, getProveedoresActivos, getProveedorById, verificarRucExistente, createProveedor, updateProveedor, deleteProveedor
- [x] `src/hooks/useProveedores.js`: REESCRITO — simplificado con búsqueda, paginación, CRUD y verificación de RUC único

### Página de gestión
- [x] `src/pages/ProveedoresPage.jsx`: REESCRITO — tabla con columnas (ID, Razón Social, RUC/Cédula, Contacto, Teléfono, Email, Ciudad, Estado, Acciones), búsqueda, paginación, modal crear/editar, badge Activo/Inactivo, soft delete con confirmación, `page` declarado correctamente
- [x] Validaciones: razón social (mín. 3), RUC/Cédula ecuatoriano (10/13 dígitos) + único, email, teléfono

### Sin cambios (ya correctos)
- [x] `src/api/productosService.js`: `getProveedoresActivos()` ya usa `ruc_cedula`
- [x] `src/App.jsx`: Ruta `/proveedores` (Admin) ya existe
- [x] `src/components/layout/Sidebar.jsx`: Ítem "Proveedores" (icono Truck) ya existe

## Verificación
- [x] Servidor Vite compila sin errores (HTTP 200)
- [x] Probar CRUD de clientes en `/clientes` (crear, editar, eliminar, buscar)
- [x] Probar POS: seleccionar cliente, crear cliente rápido, cobrar y verificar `id_cliente` en BD
- [ ] Probar CRUD de proveedores en `/proveedores` (crear, editar, eliminar, buscar, validar RUC único)
- [ ] Verificar que el dropdown de proveedores en `/productos` carga los proveedores reales
