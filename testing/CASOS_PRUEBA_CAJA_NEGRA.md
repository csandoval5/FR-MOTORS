# FR MOTORS - Pruebas de Caja Negra
## Módulo: Facturación / Punto de Venta y Arqueo de Caja

### Metodología
Las pruebas de caja negra se centran en validar las funcionalidades del sistema desde la perspectiva del usuario, sin necesidad de conocer la estructura interna del código. Se verifican entradas, salidas y comportamientos esperados.

---

## Caso de Prueba 1: Facturación POS - Venta exitosa con múltiples productos

| Campo | Detalle |
|-------|---------|
| **ID** | CP-FAC-001 |
| **Módulo** | Facturación / Punto de Venta (POS) |
| **Rol de Usuario** | Vendedor |
| **Historia de Usuario** | Como vendedor, quiero realizar una venta en mostrador seleccionando productos del inventario, especificando cantidades y procesando el cobro, para que el cliente reciba su factura y el inventario se descuente automáticamente. |
| **Precondiciones** | 1. El vendedor ha iniciado sesión en el sistema con rol "Vendedor".<br>2. Hay al menos 3 productos con stock suficiente en el inventario.<br>3. La caja del día está abierta con saldo inicial registrado.<br>4. Los métodos de pago "EFECTIVO" y "TARJETA_CREDITO" están configurados. |
| **Pasos** | 1. El vendedor navega a la sección "Punto de Venta" (POS).<br>2. En el campo de búsqueda, escribe el nombre parcial de un repuesto (ej: "freno").<br>3. Selecciona un producto de la lista de resultados.<br>4. Ingresa la cantidad deseada (ej: 2 unidades).<br>5. Repite los pasos 2-4 para agregar 2 productos adicionales.<br>6. Hace clic en "Ver Resumen de Venta".<br>7. Verifica que el subtotal, IVA (15%) y total se calculen correctamente.<br>8. Selecciona el método de pago "EFECTIVO".<br>9. Ingresa el monto con el que paga el cliente (ej: $50.00).<br>10. Verifica que el sistema calcule el cambio correctamente.<br>11. Hace clic en "Confirmar Venta". |
| **Resultado Esperado** | 1. El sistema muestra un mensaje "Venta registrada exitosamente".<br>2. Se genera un número de factura único correlativo.<br>3. El inventario se descuenta correctamente (stock_actual = stock_actual - cantidad_vendida para cada producto).<br>4. Si algún producto alcanza stock mínimo, se dispara una alerta (notificación en UI).<br>5. El movimiento se registra en la caja del día como INGRESO.<br>6. El vendedor puede descargar/imprimir la factura o nota de venta. |
| **Resultado Obtenido** | *(A llenar durante la ejecución de la prueba)* |
| **Estado** | ⬜ Pendiente / ✅ Aprobado / ❌ Fallido |
| **Evidencia** | *(Captura de pantalla o video)* |

### Datos de Ejemplo para la Prueba

| Producto | Cantidad | Precio Unit. | Subtotal | IVA (15%) | Total Línea |
|----------|----------|--------------|----------|-----------|-------------|
| Pastillas de Freno Traseras | 2 | $12.50 | $25.00 | $3.75 | $28.75 |
| Aceite Motor 20W50 (1L) | 1 | $8.00 | $8.00 | $1.20 | $9.20 |
| Filtro de Aire | 3 | $4.50 | $13.50 | $2.03 | $15.53 |
| **Totales** | | | **$46.50** | **$6.98** | **$53.48** |

**Pago del cliente**: $60.00 → **Cambio**: $6.52

---

## Caso de Prueba 2: Facturación POS - Intento de venta con stock insuficiente

| Campo | Detalle |
|-------|---------|
| **ID** | CP-FAC-002 |
| **Módulo** | Facturación / Punto de Venta (POS) |
| **Rol de Usuario** | Vendedor |
| **Historia de Usuario** | Como vendedor, quiero que el sistema me impida vender una cantidad mayor al stock disponible, para evitar sobrevendidos y mantener la veracidad del inventario. |
| **Precondiciones** | 1. El vendedor ha iniciado sesión en el sistema.<br>2. Existe un producto con stock_actual = 3 unidades (ej: "Batería YTX7L-BS").<br>3. La caja del día está abierta. |
| **Pasos** | 1. El vendedor navega a "Punto de Venta".<br>2. Busca y selecciona el producto "Batería YTX7L-BS" (stock=3).<br>3. Intenta ingresar cantidad = 5 unidades.<br>4. Observa la respuesta del sistema. |
| **Resultado Esperado** | 1. El sistema muestra un mensaje de error claro: "Stock insuficiente. Stock disponible: 3 unidades".<br>2. El campo de cantidad se resalta en rojo indicando el error.<br>3. No se permite agregar el producto al carrito hasta que la cantidad sea ≤ stock disponible.<br>4. Si se intenta forzar la operación (ej: mediante solicitud directa a API), el backend debe rechazar la transacción con código de error 400 y mensaje descriptivo. |
| **Resultado Obtenido** | *(A llenar durante la ejecución de la prueba)* |
| **Estado** | ⬜ Pendiente / ✅ Aprobado / ❌ Fallido |
| **Evidencia** | *(Captura de pantalla)* |

### Escenarios Adicionales (Variaciones)

| Variación | Descripción | Resultado Esperado |
|-----------|-------------|-------------------|
| 2a | Producto con stock = 0 | El sistema debe mostrar "Producto agotado" y deshabilitar el botón de agregar al carrito. |
| 2b | Producto inactivo (activo = false) | El producto no debe aparecer en los resultados de búsqueda del POS. |
| 2c | Dos vendedores intentan vender el mismo producto simultáneamente | El sistema debe manejar la concurrencia: el segundo vendedor debe ver el stock actualizado después de la primera venta. |

---

## Caso de Prueba 3: Arqueo de Caja - Cierre diario con validación de diferencias

| Campo | Detalle |
|-------|---------|
| **ID** | CP-CAJ-001 |
| **Módulo** | Arqueo / Cierre de Caja |
| **Rol de Usuario** | Administrador |
| **Historia de Usuario** | Como administrador, quiero cerrar la caja al final del día, ingresando el saldo final real (conteo físico), para que el sistema calcule automáticamente la diferencia contra el saldo esperado y pueda detectar y conciliar discrepancias. |
| **Precondiciones** | 1. El administrador ha iniciado sesión en el sistema.<br>2. La caja fue abierta hoy con saldo_inicial = $50.00.<br>3. Durante el día se registraron al menos 3 ventas exitosas (del Caso CP-FAC-001).<br>4. Total de ingresos del día (suma de ventas) = $153.48.<br>5. Saldo final esperado = $50.00 + $153.48 = **$203.48**. |
| **Pasos** | 1. El administrador navega a la sección "Caja / Arqueo".<br>2. Visualiza el resumen del día: saldo inicial, cantidad de ventas, total de ingresos, total de egresos (si aplica).<br>3. El sistema muestra el "Saldo Final Esperado" calculado automáticamente: $203.48.<br>4. El administrador ingresa el "Saldo Final Real" (conteo físico en caja).<br><br>**Escenario 3a - Caja Exacta:**<br>5a. Ingresa saldo_real = $203.48.<br>6a. El sistema calcula diferencia = $0.00.<br>7a. El administrador hace clic en "Cerrar Caja".<br><br>**Escenario 3b - Diferencia Positiva (Sobrante):**<br>5b. Ingresa saldo_real = $208.48.<br>6b. El sistema calcula diferencia = +$5.00 (sobrante).<br>7b. El sistema muestra alerta amarilla: "Diferencia detectada: +$5.00 (Sobrante)".<br>8b. Solicita al administrador ingresar una observación.<br>9b. El administrador ingresa observación y confirma cierre.<br><br>**Escenario 3c - Diferencia Negativa (Faltante):**<br>5c. Ingresa saldo_real = $195.00.<br>6c. El sistema calcula diferencia = -$8.48 (faltante).<br>7c. El sistema muestra alerta roja: "Diferencia detectada: -$8.48 (Faltante)".<br>8c. El sistema **BLOQUEA** el cierre si la diferencia es > $10.00 o > 5% del esperado.<br>9c. Si la diferencia es menor, solicita observación obligatoria y confirmación del administrador. |
| **Resultado Esperado** | **Escenario 3a:** Cierre exitoso. Caja pasa a estado "CERRADO". Se genera resumen de cierre.<br>**Escenario 3b:** Cierre exitoso con advertencia. Queda registrado el sobrante y la observación. Caja pasa a estado "CONCILIADO".<br>**Escenario 3c:** Si faltante ≤ umbral (10% o $10): Cierre exitoso con alerta y observación. Estado: "CONCILIADO". Si faltante > umbral: Cierre BLOQUEADO. El sistema sugiere revisar movimientos y volver a contar. |
| **Resultado Obtenido** | *(A llenar durante la ejecución de la prueba)* |
| **Estado** | ⬜ Pendiente / ✅ Aprobado / ❌ Fallido |
| **Evidencia** | *(Captura de pantalla de cada escenario)* |

### Validaciones Adicionales Post-Cierre

| Validación | Descripción |
|------------|-------------|
| Bloqueo de POS | Una vez cerrada la caja, el módulo POS debe impedir nuevas ventas hasta que se realice una nueva apertura de caja. |
| Reporte generado | El sistema debe generar un reporte PDF o vista imprimible del arqueo. |
| Historial inmodificable | Una vez cerrada o conciliada, la caja no puede ser editada ni reabierta; solo consultada. |
| Roles de acceso | Solo usuarios con rol "Administrador" pueden cerrar/conciliciar caja. Un "Vendedor" no debe tener acceso a la función de cierre. |

---

## Resumen de Casos de Prueba

| ID | Nombre | Prioridad | Tipo | Módulo |
|----|--------|-----------|------|--------|
| CP-FAC-001 | Venta exitosa con múltiples productos | Alta | Funcionalidad crítica | Facturación POS |
| CP-FAC-002 | Intento de venta con stock insuficiente | Alta | Validación de reglas de negocio | Facturación POS |
| CP-CAJ-001 | Arqueo de caja con validación de diferencias | Alta | Integridad financiera | Caja |

---

*Documento generado para la Fase 1 del proyecto FR MOTORS.*
*Última actualización: 2025*

