-- ============================================================
-- FR MOTORS - Migración Módulo 1: Gestión de Inventarios
-- Versión: 1.1
-- Descripción: Agrega campos unidad_medida e id_proveedor a la
-- tabla productos para el CRUD completo de inventario.
--
-- EJECUTAR EN: Supabase SQL Editor
-- ============================================================

-- 1. Agregar unidad de medida (UNIDAD, PAR, JUEGO, KIT)
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS unidad_medida VARCHAR(20) DEFAULT 'UNIDAD' NOT NULL;

-- 2. Agregar relación con proveedores (opcional)
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS id_proveedor INT REFERENCES proveedores(id_proveedor) ON DELETE SET NULL;

-- 3. Índices para optimización
CREATE INDEX IF NOT EXISTS idx_productos_id_proveedor ON productos(id_proveedor);
CREATE INDEX IF NOT EXISTS idx_productos_unidad_medida ON productos(unidad_medida);

-- ============================================================
-- Verificar las nuevas columnas:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'productos';
-- ============================================================

