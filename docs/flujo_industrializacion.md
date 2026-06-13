# Flujo de Industrialización — Bocar Frontend

> **Roles cubiertos:** `Ind` (usuario base) · `Ind Admin` (Super Usuario)
> **Dashboard de entrada:** `/industrializacion/dashboard`
> **Para el flujo completo del sistema ver:** [flujo_completo.md](flujo_completo.md)

---

## Índice

1. [Autenticación y acceso](#1-autenticación-y-acceso)
2. [Dashboard](#2-dashboard)
3. [Crear una RFQ](#3-crear-una-rfq)
4. [Editar un borrador](#4-editar-un-borrador)
5. [Seguimiento de una RFQ](#5-seguimiento-de-una-rfq)
6. [Solicitar edición de una RFQ enviada](#6-solicitar-edición-de-una-rfq-enviada)
7. [Predicción de costo](#7-predicción-de-costo)
8. [Flujos exclusivos del Super Usuario (Ind Admin)](#8-flujos-exclusivos-del-super-usuario-ind-admin)
9. [Pantallas y rutas del área](#9-pantallas-y-rutas-del-área)

---

## 1. Autenticación y acceso

El usuario de Industrialización accede mediante **SSO corporativo** en la pantalla de login. Una vez autenticado, el sistema detecta el rol (`Ind` o `Ind Admin`) y redirige automáticamente a `/industrializacion/dashboard`.

Si el usuario intenta acceder a rutas de otra área (Compras o Proveedor), el `ProtectedRoute` lo redirige a `/401`.

---

## 2. Dashboard

**Ruta:** `/industrializacion/dashboard`

### Lo que el usuario ve

| Elemento | Descripción |
|----------|-------------|
| Tarjetas KPI | Contadores por estado: Borradores, Pendientes de aprobación, En cotización, Benchmark listo, Cerradas |
| Tabla de RFQs recientes | Últimas RFQs del usuario con estado, fecha y acciones rápidas |
| Botón "Crear RFQ" | Acceso principal a la creación de nuevas solicitudes |
| Acceso a Predicción | Link a la herramienta de estimación de costos |

### Diferencia por rol

| Elemento | Ind base | Ind Admin |
|----------|:--------:|:---------:|
| Mis borradores | ✓ | ✓ |
| RFQs de otros usuarios | — | ✓ |
| Acceso al panel de administración | — | ✓ (link en sidebar) |

---

## 3. Crear una RFQ

**Ruta:** `/industrializacion/rfq/crear`

### Paso 1 — Seleccionar tipo

Al entrar al formulario, el usuario elige el tipo de RFQ. Esta selección determina los campos técnicos que aparecen.

| Tipo | Descripción |
|------|-------------|
| **MOLDE** | Solicitud de fabricación de molde de inyección (`moldDefinition.tsx`) |
| **RECORTE (TRIMMING)** | Solicitud de herramental de recorte (`trimmingDefinition.tsx`) |

> Una vez seleccionado el tipo, no puede cambiarse sin reiniciar el formulario.

### Paso 2 — Datos generales

| Campo | Tipo | Obligatorio | Validación |
|-------|------|:-----------:|-----------|
| Nombre del proyecto | Texto | ✓ | — |
| Número de parte | Texto alfanumérico | ✓ | Sin caracteres especiales |
| Material | Selección | ✓ | — |
| Región / Planta | Selección | ✓ | — |
| Fecha requerida | Fecha | ✓ | Debe ser futura (> hoy) |
| Fecha límite de cotización | Fecha | ✓ | Futura y anterior a la fecha requerida |

### Paso 3 — Especificaciones técnicas

Los campos varían según el tipo:

**Tipo MOLDE:**
| Campo | Obligatorio |
|-------|:-----------:|
| Número de cavidades | ✓ |
| Tipo de material del molde | ✓ |
| Sistema de inyección | ✓ |
| Dimensiones de la cavidad (largo, ancho, alto) | ✓ |
| Tonelaje de la máquina | ✓ |

**Tipo RECORTE:**
| Campo | Obligatorio |
|-------|:-----------:|
| Dimensiones de la pieza a recortar | ✓ |
| Tipo de herramental | ✓ |
| Fuerza de corte requerida | ✓ |
| Número de operaciones de corte | ✓ |

### Paso 4 — Documentos

| Documento | Formato | Obligatorio para enviar |
|-----------|---------|:-----------------------:|
| STP (Paquete Técnico Estándar) | .stp / .step | ✓ |
| PPT (Presentación del proyecto) | .pptx / .pdf | ✓ |

El panel derecho del formulario muestra un **checklist de completitud** en tiempo real. El botón "Enviar para aprobación" permanece deshabilitado hasta que todos los ítems estén completos.

### Paso 5 — Guardar o enviar

| Acción | Condición | Resultado |
|--------|-----------|-----------|
| **Guardar borrador** | En cualquier momento | RFQ en BORRADOR. Toast de confirmación. Redirige al detalle. |
| **Enviar para aprobación** | Checklist 100% completo | RFQ en PENDIENTE APROBACIÓN INTERNA. Redirige al detalle en modo solo lectura. |
| **Enviar a Compras** *(solo Ind Admin)* | Checklist 100% completo | RFQ en PENDIENTE (salta la aprobación interna). Redirige al detalle. |

---

## 4. Editar un borrador

**Ruta:** `/industrializacion/rfq/:id/editar`

- Solo disponible si el RFQ está en estado **BORRADOR**.
- Si se intenta acceder con otro estado, redirige al detalle.
- El formulario carga con los datos guardados previamente.
- Las mismas validaciones del formulario de creación aplican.
- Al guardar, el borrador se actualiza. Al enviar, sigue el mismo flujo del Paso 5.

---

## 5. Seguimiento de una RFQ

**Ruta:** `/industrializacion/rfq/:id`

### Contenido por pestaña/sección

| Sección | Disponible en | Contenido |
|---------|--------------|-----------|
| Resumen | Siempre | Datos generales y técnicos de la RFQ |
| Documentos | Siempre | STP y PPT con botón de descarga |
| Timeline | Siempre | Historial de transiciones de estado con fecha y actor |
| Cotizaciones | QUOTING en adelante | Progreso de proveedores: asignados vs. que cotizaron |
| Benchmark | BENCHMARK_READY | Tabla comparativa (visible para Ind, pero acciones de cierre solo para Compras) |
| Auditoría | Ind Admin | Motivos de rechazo, cancelación y ediciones con diff |

### Banner por estado

| Estado | Banner |
|--------|--------|
| PEND. APROBACIÓN INTERNA | "Tu RFQ está en revisión. El Super Usuario de Industrialización la evaluará." |
| PENDIENTE | "Tu RFQ fue aprobada. Compras asignará los proveedores." |
| EN COTIZACIÓN | "Punto de no retorno — esta RFQ ya no puede cancelarse. Plazo activo: XX días." |
| VENCIDA | "El plazo venció. Compras decidirá si extender o cerrar." |
| CERRADA | "Proceso finalizado." |
| CANCELADA | "RFQ cancelada. Motivo: [motivo ingresado]." |

---

## 6. Solicitar edición de una RFQ enviada

Disponible cuando el RFQ está en **PENDIENTE** (ya en manos de Compras) y el usuario base necesita corregir datos.

**Flujo:**
1. En el detalle de la RFQ, el usuario hace clic en **"Solicitar edición"**.
2. Aparece `EditRequestModal` con un campo de motivo obligatorio.
3. Al confirmar, la solicitud queda registrada con estado "Pendiente".
4. El Super Usuario de Industrialización revisa la solicitud en `/industrializacion/admin/solicitudes`.

> Si el RFQ ya está en EN COTIZACIÓN o posterior, no es posible solicitar edición. El botón no aparece.

---

## 7. Predicción de costo

**Ruta:** `/industrializacion/prediccion`

### Flujo de uso

1. El usuario ingresa parámetros técnicos del molde o recorte.
2. Opcionalmente carga una RFQ existente como contexto.
3. El sistema calcula y muestra:
   - Costo estimado con rango de variación (mín. - máx.)
   - Nivel de confianza del modelo
   - Comparativo con cotizaciones reales de RFQs similares (si existen)
4. El usuario puede usar el estimado como referencia antes de crear la RFQ formal.

> El sistema muestra siempre el aviso: *"Este es un valor estimado. No reemplaza las cotizaciones formales de proveedores."*

---

## 8. Flujos exclusivos del Super Usuario (Ind Admin)

### 8.1 Panel de administración — `/industrializacion/admin`

**Lo que el admin ve:**
- Cola de RFQs en PENDIENTE APROBACIÓN INTERNA ordenadas por fecha de envío.
- Contadores de pendientes críticos.
- Acceso directo al detalle de cada RFQ pendiente.

### 8.2 Resolver una RFQ pendiente

El admin accede desde el panel de administración o desde una notificación al detalle de la RFQ.

#### Aprobar

| Paso | Acción |
|------|--------|
| 1 | Clic en "Aprobar" en la barra de acciones del detalle |
| 2 | Modal de confirmación simple |
| 3 | Confirmar |

**Resultado:** RFQ pasa a PENDIENTE. Compras recibe notificación.

#### Rechazar

| Paso | Acción |
|------|--------|
| 1 | Clic en "Rechazar" |
| 2 | `RejectWithReasonModal` — campo de motivo **obligatorio** |
| 3 | Confirmar |

**Resultado:** RFQ vuelve a BORRADOR. El creador recibe notificación con el motivo.

#### Editar y aprobar

| Paso | Acción |
|------|--------|
| 1 | Clic en "Editar y aprobar" |
| 2 | Se abre workspace de edición con diff visible entre versión actual y cambios |
| 3 | Admin modifica los campos necesarios |
| 4 | `ConfirmEditModal` muestra resumen de cambios |
| 5 | Confirmar |

**Resultado:** RFQ pasa a PENDIENTE con historial de edición registrado (diff + actor + timestamp).

#### Cancelar

| Paso | Acción |
|------|--------|
| 1 | Clic en "Cancelar RFQ" |
| 2 | `CancelRfqModal` — campo de motivo **obligatorio** |
| 3 | Confirmar |

**Resultado:** RFQ pasa a CANCELADA. Todos los involucrados reciben notificación con el motivo.

> Solo disponible en estados anteriores a EN COTIZACIÓN (BORRADOR, PEND. APROBACIÓN INTERNA, PENDIENTE).

### 8.3 Crear y enviar directamente a Compras

El admin usa el mismo formulario de creación (`/industrializacion/rfq/crear`) pero en la barra inferior aparece el botón adicional **"Enviar a Compras"** junto a "Guardar borrador" y "Enviar para aprobación".

Al hacer clic en "Enviar a Compras", la RFQ pasa directamente a PENDIENTE sin pasar por la cola de aprobación interna.

### 8.4 Gestión de solicitudes de cambio — `/industrializacion/admin/solicitudes`

**Cuándo llega una solicitud:** cuando un usuario base solicita edición de una RFQ en estado PENDIENTE.

| Acción del admin | Resultado |
|-----------------|-----------|
| **Aprobar** | Cambios aplicados; RFQ actualizada |
| **Rechazar** | Motivo obligatorio; solicitud rechazada; solicitante notificado |
| **Devolver con comentario** | Solicitud devuelta para que el usuario la corrija y reenvíe |

---

## 9. Pantallas y rutas del área

| Pantalla | Ruta | Ind base | Ind Admin |
|----------|------|:--------:|:---------:|
| Dashboard | `/industrializacion/dashboard` | ✓ | ✓ |
| Crear RFQ | `/industrializacion/rfq/crear` | ✓ | ✓ |
| Editar RFQ | `/industrializacion/rfq/:id/editar` | ✓ | ✓ |
| Detalle de RFQ | `/industrializacion/rfq/:id` | ✓ | ✓ |
| Predicción de costo | `/industrializacion/prediccion` | ✓ | ✓ |
| Analytics | `/industrializacion/analytics` | ✓ | ✓ |
| Admin Dashboard | `/industrializacion/admin` | — | ✓ |
| Gestión de solicitudes | `/industrializacion/admin/solicitudes` | — | ✓ |
