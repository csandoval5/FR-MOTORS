-- ============================================================
-- FR MOTORS - Configuración RLS (Row Level Security)
-- Para que el Punto de Venta pueda INSERTAR ventas, detalles,
-- actualizar stock y registrar movimientos de caja.
--
-- EJECUTAR EN: Supabase SQL Editor
-- ============================================================

-- 1. Habilitar RLS en las tablas (si aún no está habilitado)
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para que usuarios autenticados puedan INSERTAR ventas
CREATE POLICY "usuarios_autenticados_insertar_ventas"
  ON ventas FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3. Políticas para SELECT en ventas
CREATE POLICY "usuarios_autenticados_leer_ventas"
  ON ventas FOR SELECT
  TO authenticated
  USING (true);

-- 4. Políticas para INSERT en detalle_ventas
CREATE POLICY "usuarios_autenticados_insertar_detalle"
  ON detalle_ventas FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. Políticas para SELECT en detalle_ventas
CREATE POLICY "usuarios_autenticados_leer_detalle"
  ON detalle_ventas FOR SELECT
  TO authenticated
  USING (true);

-- 6. Políticas para INSERT en caja
CREATE POLICY "usuarios_autenticados_insertar_caja"
  ON caja FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 7. Políticas para SELECT en caja
CREATE POLICY "usuarios_autenticados_leer_caja"
  ON caja FOR SELECT
  TO authenticated
  USING (true);

-- 8. Políticas para UPDATE en productos (actualizar stock)
CREATE POLICY "usuarios_autenticados_actualizar_productos"
  ON productos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 9. Políticas para SELECT en productos (ya debe existir)
CREATE POLICY "usuarios_autenticados_leer_productos"
  ON productos FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 10. Políticas para SELECT en usuarios (IMPORTANTE)
-- Sin estas políticas, el JOIN embebido en el historial de ventas
-- (`usuarios(...)`) falla con 404/403 y el query completo falla,
-- mostrando "No hay ventas registradas" aunque existan registros.
-- ============================================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios_leer_autenticados" ON usuarios;
CREATE POLICY "usuarios_leer_autenticados"
  ON usuarios FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 11. Políticas para SELECT en proveedores (para dropdowns)
-- ============================================================
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "proveedores_leer_autenticados" ON proveedores;
CREATE POLICY "proveedores_leer_autenticados"
  ON proveedores FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "proveedores_leer_autenticados_insert" ON proveedores;
CREATE POLICY "proveedores_leer_autenticados_insert"
  ON proveedores FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- NOTA: Si las políticas ya existen, este script fallará con
-- "policy already exists". En ese caso, borra las políticas
-- existentes o usa: DROP POLICY IF EXISTS ...
-- ============================================================
