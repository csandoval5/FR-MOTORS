-- ============================================================
-- FR MOTORS - Esquema de Base de Datos PostgreSQL (Supabase)
-- Versión: 1.0
-- Descripción: Sistema ERP para taller y almacén de repuestos
-- de motocicletas. El Coca, Ecuador.
-- Normalización: 3FN (Tercera Forma Normal)
-- ============================================================

-- ============================================================
-- 1. TABLAS DE CATÁLOGOS BASE (Dominios)
-- ============================================================

-- 1.1 Roles de Usuario
CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    nivel_acceso INT NOT NULL DEFAULT 1 CHECK (nivel_acceso BETWEEN 1 AND 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.2 Categorías de Productos
CREATE TABLE categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.3 Tipos de Identificación (Cédula, RUC, Pasaporte, etc.)
CREATE TABLE tipos_identificacion (
    id_tipo_identificacion SERIAL PRIMARY KEY,
    codigo VARCHAR(5) NOT NULL UNIQUE,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255)
);

-- 1.4 Estados de Órdenes de Taller
CREATE TABLE estados_orden_taller (
    id_estado SERIAL PRIMARY KEY,
    nombre_estado VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

-- 1.5 Métodos de Pago
CREATE TABLE metodos_pago (
    id_metodo_pago SERIAL PRIMARY KEY,
    nombre_metodo VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    requiere_referencia BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- 2. TABLAS PRINCIPALES (Transaccionales)
-- ============================================================

-- 2.1 Usuarios del Sistema
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    id_rol INT NOT NULL REFERENCES roles(id_rol) ON DELETE RESTRICT,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 Proveedores
CREATE TABLE proveedores (
    id_proveedor SERIAL PRIMARY KEY,
    id_tipo_identificacion INT NOT NULL REFERENCES tipos_identificacion(id_tipo_identificacion),
    numero_identificacion VARCHAR(20) NOT NULL UNIQUE,
    razon_social VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(200),
    direccion TEXT,
    ciudad VARCHAR(100),
    telefono_principal VARCHAR(20),
    telefono_secundario VARCHAR(20),
    email VARCHAR(150),
    contacto_nombre VARCHAR(100),
    contacto_telefono VARCHAR(20),
    plazo_credito_dias INT DEFAULT 0 CHECK (plazo_credito_dias >= 0),
    cupo_credito DECIMAL(12, 2) DEFAULT 0 CHECK (cupo_credito >= 0),
    activo BOOLEAN DEFAULT TRUE,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.3 Productos (Repuestos)
CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    id_categoria INT NOT NULL REFERENCES categorias(id_categoria) ON DELETE RESTRICT,
    codigo_sku VARCHAR(50) NOT NULL UNIQUE,
    codigo_barras VARCHAR(100),
    nombre_producto VARCHAR(200) NOT NULL,
    descripcion TEXT,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    ano_fabricacion INT,
    precio_compra DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (precio_compra >= 0),
    precio_venta DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (precio_venta >= 0),
    precio_mayorista DECIMAL(10, 2) DEFAULT 0 CHECK (precio_mayorista >= 0),
    iva_porcentaje DECIMAL(5, 2) DEFAULT 15.00 CHECK (iva_porcentaje >= 0),
    stock_actual INT NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo INT NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
    stock_maximo INT DEFAULT 100 CHECK (stock_maximo >= 0),
    ubicacion_almacen VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    imagen_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.4 Compras a Proveedores (Cabecera)
CREATE TABLE compras (
    id_compra SERIAL PRIMARY KEY,
    id_proveedor INT NOT NULL REFERENCES proveedores(id_proveedor) ON DELETE RESTRICT,
    id_usuario_registra INT NOT NULL REFERENCES usuarios(id_usuario),
    numero_factura VARCHAR(50) NOT NULL,
    numero_autorizacion VARCHAR(100),
    fecha_compra DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_recepcion DATE,
    tipo_compra VARCHAR(20) DEFAULT 'CONTADO' CHECK (tipo_compra IN ('CONTADO', 'CREDITO')),
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    iva_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'RECIBIDA', 'ANULADA')),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.5 Detalle de Compras
CREATE TABLE detalle_compras (
    id_detalle_compra SERIAL PRIMARY KEY,
    id_compra INT NOT NULL REFERENCES compras(id_compra) ON DELETE CASCADE,
    id_producto INT NOT NULL REFERENCES productos(id_producto),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(12, 2) NOT NULL,
    iva DECIMAL(10, 2) DEFAULT 0,
    total_linea DECIMAL(12, 2) NOT NULL
);

-- 2.6 Ventas / Facturación (Cabecera)
CREATE TABLE ventas (
    id_venta SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuarios(id_usuario),
    id_cliente_nombre VARCHAR(200),
    id_cliente_identificacion VARCHAR(20),
    numero_factura VARCHAR(50) NOT NULL UNIQUE,
    fecha_venta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tipo_comprobante VARCHAR(20) DEFAULT 'FACTURA' CHECK (tipo_comprobante IN ('FACTURA', 'NOTA_VENTA', 'TICKET')),
    id_metodo_pago INT NOT NULL REFERENCES metodos_pago(id_metodo_pago),
    referencia_pago VARCHAR(100),
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    descuento DECIMAL(12, 2) DEFAULT 0 CHECK (descuento >= 0),
    iva_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'COMPLETADA' CHECK (estado IN ('COMPLETADA', 'ANULADA', 'PENDIENTE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.7 Detalle de Ventas
CREATE TABLE detalle_ventas (
    id_detalle_venta SERIAL PRIMARY KEY,
    id_venta INT NOT NULL REFERENCES ventas(id_venta) ON DELETE CASCADE,
    id_producto INT NOT NULL REFERENCES productos(id_producto),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(12, 2) NOT NULL,
    iva DECIMAL(10, 2) DEFAULT 0,
    total_linea DECIMAL(12, 2) NOT NULL
);

-- 2.8 Cuentas por Pagar (Proveedores)
CREATE TABLE cuentas_pagar (
    id_cuenta_pagar SERIAL PRIMARY KEY,
    id_compra INT NOT NULL REFERENCES compras(id_compra) ON DELETE RESTRICT,
    id_proveedor INT NOT NULL REFERENCES proveedores(id_proveedor),
    numero_documento VARCHAR(50) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    valor_original DECIMAL(12, 2) NOT NULL CHECK (valor_original > 0),
    saldo_pendiente DECIMAL(12, 2) NOT NULL CHECK (saldo_pendiente >= 0),
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA')),
    dias_plazo INT GENERATED ALWAYS AS (fecha_vencimiento - fecha_emision) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.9 Abonos a Cuentas por Pagar
CREATE TABLE abonos_cuentas_pagar (
    id_abono SERIAL PRIMARY KEY,
    id_cuenta_pagar INT NOT NULL REFERENCES cuentas_pagar(id_cuenta_pagar) ON DELETE CASCADE,
    id_usuario INT NOT NULL REFERENCES usuarios(id_usuario),
    fecha_abono TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    monto_abono DECIMAL(12, 2) NOT NULL CHECK (monto_abono > 0),
    id_metodo_pago INT NOT NULL REFERENCES metodos_pago(id_metodo_pago),
    referencia_pago VARCHAR(100),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.10 Órdenes de Taller
CREATE TABLE ordenes_taller (
    id_orden SERIAL PRIMARY KEY,
    id_usuario_solicita INT NOT NULL REFERENCES usuarios(id_usuario),
    id_mecánico_asignado INT REFERENCES usuarios(id_usuario),
    id_estado INT NOT NULL DEFAULT 1 REFERENCES estados_orden_taller(id_estado),
    numero_orden VARCHAR(50) NOT NULL UNIQUE,
    cliente_nombre VARCHAR(200) NOT NULL,
    cliente_telefono VARCHAR(20),
    cliente_vehiculo_marca VARCHAR(100),
    cliente_vehiculo_modelo VARCHAR(100),
    cliente_vehiculo_placa VARCHAR(20),
    kilometraje INT,
    descripcion_falla TEXT NOT NULL,
    diagnostico_tecnico TEXT,
    fecha_ingreso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_prometida_entrega DATE,
    fecha_finalizacion TIMESTAMP WITH TIME ZONE,
    total_mano_obra DECIMAL(10, 2) DEFAULT 0,
    total_repuestos DECIMAL(10, 2) DEFAULT 0,
    total_general DECIMAL(12, 2) DEFAULT 0,
    notas_internas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.11 Detalle de Repuestos usados en Órdenes de Taller
CREATE TABLE detalle_orden_repuestos (
    id_detalle_orden_repuesto SERIAL PRIMARY KEY,
    id_orden INT NOT NULL REFERENCES ordenes_taller(id_orden) ON DELETE CASCADE,
    id_producto INT NOT NULL REFERENCES productos(id_producto),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL
);

-- 2.12 Arqueo de Caja (Cierre Diario)
CREATE TABLE arqueo_caja (
    id_arqueo SERIAL PRIMARY KEY,
    id_usuario_apertura INT NOT NULL REFERENCES usuarios(id_usuario),
    id_usuario_cierre INT REFERENCES usuarios(id_usuario),
    fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    saldo_inicial DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (saldo_inicial >= 0),
    saldo_final_esperado DECIMAL(12, 2) DEFAULT 0,
    saldo_final_real DECIMAL(12, 2) DEFAULT 0,
    diferencia DECIMAL(12, 2) GENERATED ALWAYS AS (saldo_final_real - saldo_final_esperado) STORED,
    estado VARCHAR(20) DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'CERRADO', 'CONCILIADO')),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.13 Movimientos de Caja (Ingresos/Egresos durante el día)
CREATE TABLE movimientos_caja (
    id_movimiento SERIAL PRIMARY KEY,
    id_arqueo INT NOT NULL REFERENCES arqueo_caja(id_arqueo) ON DELETE CASCADE,
    id_venta INT REFERENCES ventas(id_venta),
    id_abono INT REFERENCES abonos_cuentas_pagar(id_abono),
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('INGRESO', 'EGRESO', 'APERTURA', 'CIERRE')),
    concepto VARCHAR(255) NOT NULL,
    monto DECIMAL(12, 2) NOT NULL CHECK (monto > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. ÍNDICES PARA OPTIMIZACIÓN DE BÚSQUEDAS
-- ============================================================

-- Índices para búsqueda rápida de productos
CREATE INDEX idx_productos_codigo_sku ON productos(codigo_sku);
CREATE INDEX idx_productos_codigo_barras ON productos(codigo_barras) WHERE codigo_barras IS NOT NULL;
CREATE INDEX idx_productos_nombre ON productos USING gin(to_tsvector('spanish', nombre_producto));
CREATE INDEX idx_productos_id_categoria ON productos(id_categoria);
CREATE INDEX idx_productos_stock_actual ON productos(stock_actual);
CREATE INDEX idx_productos_activo ON productos(activo) WHERE activo = TRUE;

-- Índices para búsqueda de proveedores
CREATE INDEX idx_proveedores_identificacion ON proveedores(numero_identificacion);
CREATE INDEX idx_proveedores_razon_social ON proveedores USING gin(to_tsvector('spanish', razon_social));
CREATE INDEX idx_proveedores_activo ON proveedores(activo) WHERE activo = TRUE;

-- Índices para ventas y facturación
CREATE INDEX idx_ventas_numero_factura ON ventas(numero_factura);
CREATE INDEX idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX idx_ventas_id_usuario ON ventas(id_usuario);
CREATE INDEX idx_ventas_estado ON ventas(estado);
CREATE INDEX idx_detalle_ventas_id_venta ON detalle_ventas(id_venta);
CREATE INDEX idx_detalle_ventas_id_producto ON detalle_ventas(id_producto);

-- Índices para compras
CREATE INDEX idx_compras_id_proveedor ON compras(id_proveedor);
CREATE INDEX idx_compras_fecha ON compras(fecha_compra);
CREATE INDEX idx_detalle_compras_id_compra ON detalle_compras(id_compra);

-- Índices para cuentas por pagar
CREATE INDEX idx_cuentas_pagar_id_proveedor ON cuentas_pagar(id_proveedor);
CREATE INDEX idx_cuentas_pagar_estado ON cuentas_pagar(estado);
CREATE INDEX idx_cuentas_pagar_fecha_vencimiento ON cuentas_pagar(fecha_vencimiento);
CREATE INDEX idx_abonos_cuentas_pagar_id_cuenta ON abonos_cuentas_pagar(id_cuenta_pagar);

-- Índices para órdenes de taller
CREATE INDEX idx_ordenes_taller_estado ON ordenes_taller(id_estado);
CREATE INDEX idx_ordenes_taller_fecha ON ordenes_taller(fecha_ingreso);
CREATE INDEX idx_detalle_orden_repuestos_id_orden ON detalle_orden_repuestos(id_orden);

-- Índices para arqueo de caja
CREATE INDEX idx_arqueo_caja_fecha ON arqueo_caja(fecha_apertura);
CREATE INDEX idx_arqueo_caja_estado ON arqueo_caja(estado);
CREATE INDEX idx_movimientos_caja_id_arqueo ON movimientos_caja(id_arqueo);

-- ============================================================
-- 4. FUNCIONES Y TRIGGERS
-- ============================================================

-- 4.1 Función: Actualizar stock al registrar compra
CREATE OR REPLACE FUNCTION actualizar_stock_compra()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE productos
    SET stock_actual = stock_actual + NEW.cantidad,
        precio_compra = CASE WHEN NEW.precio_unitario > 0 THEN NEW.precio_unitario ELSE precio_compra END,
        updated_at = NOW()
    WHERE id_producto = NEW.id_producto;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_stock_compra
    AFTER INSERT ON detalle_compras
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_compra();

-- 4.2 Función: Actualizar stock al registrar venta
CREATE OR REPLACE FUNCTION actualizar_stock_venta()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE productos
    SET stock_actual = stock_actual - NEW.cantidad,
        updated_at = NOW()
    WHERE id_producto = NEW.id_producto;

    -- Verificar si el stock está por debajo del mínimo
    IF (SELECT stock_actual FROM productos WHERE id_producto = NEW.id_producto) < 
       (SELECT stock_minimo FROM productos WHERE id_producto = NEW.id_producto) THEN
        RAISE NOTICE 'ALERTA: El producto ID % ha alcanzado stock mínimo.', NEW.id_producto;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_stock_venta
    AFTER INSERT ON detalle_ventas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_venta();

-- 4.3 Función: Actualizar saldo de cuentas por pagar al registrar abono
CREATE OR REPLACE FUNCTION actualizar_saldo_cuenta_pagar()
RETURNS TRIGGER AS $$
DECLARE
    v_saldo_actual DECIMAL(12,2);
BEGIN
    UPDATE cuentas_pagar
    SET saldo_pendiente = saldo_pendiente - NEW.monto_abono,
        updated_at = NOW()
    WHERE id_cuenta_pagar = NEW.id_cuenta_pagar;

    SELECT saldo_pendiente INTO v_saldo_actual
    FROM cuentas_pagar
    WHERE id_cuenta_pagar = NEW.id_cuenta_pagar;

    IF v_saldo_actual <= 0 THEN
        UPDATE cuentas_pagar
        SET estado = 'PAGADA',
            updated_at = NOW()
        WHERE id_cuenta_pagar = NEW.id_cuenta_pagar;
    ELSIF v_saldo_actual < (SELECT valor_original FROM cuentas_pagar WHERE id_cuenta_pagar = NEW.id_cuenta_pagar) THEN
        UPDATE cuentas_pagar
        SET estado = 'PARCIAL',
            updated_at = NOW()
        WHERE id_cuenta_pagar = NEW.id_cuenta_pagar;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_saldo_cuenta_pagar
    AFTER INSERT ON abonos_cuentas_pagar
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_saldo_cuenta_pagar();

-- 4.4 Función: Actualizar totales de venta
CREATE OR REPLACE FUNCTION calcular_totales_venta()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ventas
    SET subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM detalle_ventas WHERE id_venta = NEW.id_venta),
        iva_total = (SELECT COALESCE(SUM(iva), 0) FROM detalle_ventas WHERE id_venta = NEW.id_venta),
        total = (SELECT COALESCE(SUM(total_linea), 0) FROM detalle_ventas WHERE id_venta = NEW.id_venta) - COALESCE(descuento, 0),
        updated_at = NOW()
    WHERE id_venta = NEW.id_venta;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calcular_totales_venta
    AFTER INSERT OR UPDATE OR DELETE ON detalle_ventas
    FOR EACH ROW
    EXECUTE FUNCTION calcular_totales_venta();

-- 4.5 Función: Crear cuenta por pagar automáticamente al registrar compra a crédito
CREATE OR REPLACE FUNCTION crear_cuenta_pagar_compra()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tipo_compra = 'CREDITO' AND NEW.estado = 'RECIBIDA' THEN
        INSERT INTO cuentas_pagar (
            id_compra, id_proveedor, numero_documento,
            fecha_emision, fecha_vencimiento,
            valor_original, saldo_pendiente, estado
        ) VALUES (
            NEW.id_compra,
            NEW.id_proveedor,
            NEW.numero_factura,
            NEW.fecha_compra,
            NEW.fecha_compra + (SELECT COALESCE(plazo_credito_dias, 0) FROM proveedores WHERE id_proveedor = NEW.id_proveedor),
            NEW.total,
            NEW.total,
            'PENDIENTE'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_crear_cuenta_pagar_compra
    AFTER UPDATE OF estado ON compras
    FOR EACH ROW
    WHEN (NEW.estado = 'RECIBIDA')
    EXECUTE FUNCTION crear_cuenta_pagar_compra();

-- ============================================================
-- 5. VISTAS PARA CONSULTAS FRECUENTES
-- ============================================================

-- 5.1 Vista: Productos con stock bajo (alerta)
CREATE VIEW vista_productos_stock_bajo AS
SELECT
    p.id_producto,
    p.codigo_sku,
    p.nombre_producto,
    c.nombre_categoria,
    p.stock_actual,
    p.stock_minimo,
    (p.stock_minimo - p.stock_actual) AS cantidad_necesaria,
    p.precio_venta,
    p.ubicacion_almacen
FROM productos p
JOIN categorias c ON p.id_categoria = c.id_categoria
WHERE p.activo = TRUE
  AND p.stock_actual <= p.stock_minimo
ORDER BY (p.stock_minimo - p.stock_actual) DESC;

-- 5.2 Vista: Dashboard de ventas del día
CREATE VIEW vista_ventas_diarias AS
SELECT
    DATE(fecha_venta) AS fecha,
    COUNT(DISTINCT id_venta) AS total_ventas,
    COUNT(DISTINCT id_usuario) AS vendedores_activos,
    COALESCE(SUM(total), 0) AS ingresos_totales,
    COALESCE(AVG(total), 0) AS ticket_promedio
FROM ventas
WHERE estado = 'COMPLETADA'
  AND DATE(fecha_venta) = CURRENT_DATE
GROUP BY DATE(fecha_venta);

-- 5.3 Vista: Top 10 productos más vendidos
CREATE VIEW vista_top_productos AS
SELECT
    p.id_producto,
    p.codigo_sku,
    p.nombre_producto,
    c.nombre_categoria,
    SUM(dv.cantidad) AS total_unidades_vendidas,
    SUM(dv.total_linea) AS total_ingresos_generados,
    COUNT(DISTINCT dv.id_venta) AS veces_vendido
FROM detalle_ventas dv
JOIN productos p ON dv.id_producto = p.id_producto
JOIN categorias c ON p.id_categoria = c.id_categoria
JOIN ventas v ON dv.id_venta = v.id_venta
WHERE v.estado = 'COMPLETADA'
  AND v.fecha_venta >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')
GROUP BY p.id_producto, p.codigo_sku, p.nombre_producto, c.nombre_categoria
ORDER BY total_unidades_vendidas DESC
LIMIT 10;

-- 5.4 Vista: Cuentas por pagar vencidas o próximas a vencer
CREATE VIEW vista_cuentas_vencidas AS
SELECT
    cp.id_cuenta_pagar,
    prov.razon_social AS proveedor,
    prov.telefono_principal,
    cp.numero_documento,
    cp.fecha_emision,
    cp.fecha_vencimiento,
    cp.valor_original,
    cp.saldo_pendiente,
    CASE
        WHEN cp.fecha_vencimiento < CURRENT_DATE THEN 'VENCIDA'
        WHEN cp.fecha_vencimiento <= CURRENT_DATE + 7 THEN 'PRÓXIMA_A_VENCER'
        ELSE 'AL_DÍA'
    END AS estado_alerta,
    CURRENT_DATE - cp.fecha_vencimiento AS dias_vencida
FROM cuentas_pagar cp
JOIN proveedores prov ON cp.id_proveedor = prov.id_proveedor
WHERE cp.estado IN ('PENDIENTE', 'PARCIAL')
ORDER BY cp.fecha_vencimiento ASC;

-- 5.5 Vista: Resumen de órdenes de taller activas
CREATE VIEW vista_ordenes_taller_activas AS
SELECT
    ot.id_orden,
    ot.numero_orden,
    ot.cliente_nombre,
    ot.cliente_vehiculo_marca || ' ' || ot.cliente_vehiculo_modelo AS vehiculo,
    ot.cliente_vehiculo_placa AS placa,
    eot.nombre_estado,
    ot.descripcion_falla,
    ot.fecha_ingreso,
    ot.fecha_prometida_entrega,
    u.nombres || ' ' || u.apellidos AS mecanico_asignado
FROM ordenes_taller ot
JOIN estados_orden_taller eot ON ot.id_estado = eot.id_estado
LEFT JOIN usuarios u ON ot.id_mecánico_asignado = u.id_usuario
WHERE eot.nombre_estado NOT IN ('FINALIZADA', 'ENTREGADA', 'CANCELADA');

-- ============================================================
-- 6. DATOS INICIALES (Seed Data)
-- ============================================================

-- Roles
INSERT INTO roles (nombre_rol, descripcion, nivel_acceso) VALUES
('Administrador', 'Acceso total al sistema', 100),
('Vendedor', 'Facturación y consulta de inventario', 50),
('Mecánico', 'Órdenes de taller y consulta de repuestos', 30);

-- Tipos de Identificación
INSERT INTO tipos_identificacion (codigo, nombre, descripcion) VALUES
('CED', 'Cédula', 'Cédula de identidad ecuatoriana'),
('RUC', 'RUC', 'Registro Único de Contribuyentes'),
('PAS', 'Pasaporte', 'Pasaporte'),
('IDC', 'Identificación del Consumidor', 'Consumidor final');

-- Estados de Órdenes de Taller
INSERT INTO estados_orden_taller (nombre_estado, descripcion) VALUES
('PENDIENTE', 'Orden registrada, pendiente de asignación'),
('EN_REVISION', 'En revisión/diagnóstico por el mecánico'),
('EN_REPARACION', 'En proceso de reparación'),
('ESPERANDO_REPUESTOS', 'Esperando llegada de repuestos'),
('FINALIZADA', 'Reparación completada'),
('ENTREGADA', 'Entregada al cliente'),
('CANCELADA', 'Orden cancelada');

-- Métodos de Pago
INSERT INTO metodos_pago (nombre_metodo, descripcion, requiere_referencia) VALUES
('EFECTIVO', 'Pago en efectivo', FALSE),
('TARJETA_CREDITO', 'Tarjeta de crédito', TRUE),
('TARJETA_DEBITO', 'Tarjeta de débito', TRUE),
('TRANSFERENCIA', 'Transferencia bancaria', TRUE),
('DEPOSITO', 'Depósito en cuenta', TRUE);

-- Usuario administrador por defecto
-- Password: admin123 (debe cambiarse en producción)
INSERT INTO usuarios (id_rol, nombres, apellidos, email, telefono, password_hash) VALUES
(1, 'Administrador', 'FR Motors', 'admin@frmotors.com', '0999999999',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');

-- ============================================================
-- NOTA: Este esquema está optimizado para Supabase (PostgreSQL).
-- Las políticas de seguridad RLS (Row Level Security) se
-- configurarán en la Fase 2.
-- ============================================================

