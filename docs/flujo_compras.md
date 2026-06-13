# Flujo de Compras — Bocar Frontend

> **Roles cubiertos:** `Com` (usuario base) · `Com Admin` (Super Usuario)
> **Dashboard de entrada:** `/compras/dashboard`
> **Para el flujo completo del sistema ver:** [flujo_completo.md](flujo_completo.md)

---

## Índice

1. [Autenticación y acceso](#1-autenticación-y-acceso)
2. [Dashboard](#2-dashboard)
3. [Lista de RFQs](#3-lista-de-rfqs)
4. [Detalle de RFQ](#4-detalle-de-rfq)
5. [Asignación de proveedores](#5-asignación-de-proveedores)
6. [Seguimiento de cotizaciones](#6-seguimiento-de-cotizaciones)
7. [Benchmark y análisis comparativo](#7-benchmark-y-análisis-comparativo)
8. [Explorador de proveedores](#8-explorador-de-proveedores)
9. [Flujos exclusivos del Super Usuario (Com Admin)](#9-flujos-exclusivos-del-super-usuario-com-admin)
10. [Pantallas y rutas del área](#10-pantallas-y-rutas-del-área)

---

## 1. Autenticación y acceso

El usuario de Compras accede mediante **SSO corporativo** en la pantalla de login. El sistema detecta el rol (`Com` o `Com Admin`) y redirige a `/compras/dashboard`.

Si intenta acceder a rutas de Industrialización o Proveedor, el `ProtectedRoute` redirige a `/401`.

---

## 2. Dashboard

**Ruta:** `/compras/dashboard`

### Lo que el usuario ve

| Elemento | Descripción |
|----------|-------------|
| Tarjetas KPI | RFQs por asignar, en cotización, con benchmark listo, vencidas |
| Resumen de respuesta | Ratio proveedores asignados / que cotizaron por RFQ activa |
| Tabla de RFQs activos | Con urgencia visual (colores según tiempo restante) |
| Accesos rápidos | Asignación, benchmark, solicitudes de desbloqueo |

### Diferencia por rol

| Elemento | Com base | Com Admin |
|----------|:--------:|:---------:|
| Ver tabla de RFQs | ✓ | ✓ |
| Acceso a Admin Dashboard | — | ✓ |
| Aprobar/rechazar asignaciones | — | ✓ |
| Gestionar desbloqueos | — | ✓ |

---

## 3. Lista de RFQs

**Ruta:** `/compras/rfq`

### Columnas de la tabla

| Columna | Descripción |
|---------|-------------|
| ID | Identificador único del RFQ |
| Proyecto | Nombre del proyecto |
| Tipo | MOLDE o RECORTE |
| Estado | Badge de color |
| Creador | Usuario de Industrialización que creó la RFQ |
| Proveedores | Número de asignados y cuántos cotizaron |
| Deadline | Fecha límite con indicador de urgencia |
| Acciones | Ver detalle, Asignar, Ver benchmark |

### Filtros disponibles

| Filtro | Opciones |
|--------|----------|
| Estado | Todos los estados del ciclo de vida |
| Tipo | MOLDE / RECORTE |
| Fecha límite | Esta semana, próximos 15 días, vencidas |
| Región | Planta o región destino |
| Tipo de máquina | Según catálogo |

> Las RFQs con menos de 3 días para vencer se resaltan con fondo naranja. Las vencidas con fondo rojo.

---

## 4. Detalle de RFQ

**Ruta:** `/compras/rfq/:id`

### Contenido por sección

| Sección | Disponible en | Contenido |
|---------|--------------|-----------|
| Header | Siempre | Estado, ID, proyecto, tipo, creador, fechas y CTAs |
| Resumen técnico | Siempre | Especificaciones relevantes para la asignación de proveedores |
| Documentos | Siempre | STP y PPT con botón de descarga |
| Proveedores asignados | PENDING en adelante | Lista de proveedores con estado de cotización |
| Progreso | QUOTING, PARTIALLY_QUOTED | Countdown y avance por proveedor |
| Benchmark | BENCHMARK_READY | Tabla comparativa y scorecards |
| Auditoría | Com Admin | Historial de decisiones, motivos y actores |

### CTAs por estado

| Estado | Com base | Com Admin |
|--------|:--------:|:---------:|
| PENDIENTE | Ir a asignación | Ir a asignación, Asignar directo |
| PEND. APROBACIÓN COMPRAS | — (en revisión) | Aprobar, Rechazar, Editar y aprobar |
| EN COTIZACIÓN | Ver progreso | Ver progreso |
| PARCIALMENTE COTIZADA | Ver cotizaciones parciales | Ver cotizaciones parciales |
| BENCHMARK LISTO | Ver benchmark | Ver benchmark, Cerrar RFQ, Extender plazo |
| VENCIDA | — | Extender plazo, Cerrar RFQ |
| CERRADA / CANCELADA | Solo lectura | Solo lectura |

---

## 5. Asignación de proveedores

Disponible para RFQs en estado **PENDIENTE**.

### Flujo — Com base

| Paso | Acción | Resultado |
|------|--------|-----------|
| 1 | Clic en "Asignar proveedores" en el detalle o la lista | Navega a la pantalla de selección |
| 2 | Revisar resumen técnico de la RFQ (zona superior) | Contexto para la selección |
| 3 | Buscar proveedores en el catálogo (zona central) | El sistema puede mostrar sugerencias automáticas |
| 4 | Clic en "Agregar" junto a cada proveedor | Proveedor aparece en la bandeja lateral (sticky) |
| 5 | Revisar la selección final en la bandeja | Lista de proveedores seleccionados |
| 6 | Clic en **"Enviar para aprobación"** | RFQ pasa a PEND. APROBACIÓN COMPRAS. Com Admin recibe notificación. |

> Com base **no notifica directamente** a proveedores. La notificación es exclusiva del Com Admin.

### Flujo — Com Admin (asignación directa)

Igual que el flujo base hasta el paso 5, pero el CTA es **"Notificar proveedores e iniciar plazo"**.

| Paso | Acción | Resultado |
|------|--------|-----------|
| 6 | Clic en "Notificar proveedores e iniciar plazo" | Aparece modal de confirmación |
| 7 | Leer advertencia: *"Los proveedores serán notificados y el plazo de cotización comenzará. Esta acción no puede deshacerse."* | — |
| 8 | Confirmar | RFQ pasa directamente a EN COTIZACIÓN. Proveedores notificados. Plazo de 10 días hábiles inicia. |

> ⚠️ Este es el **punto de compromiso institucional**. Una vez confirmado, el proceso no puede revertirse.

### Filtros del catálogo de proveedores

| Filtro | Descripción |
|--------|-------------|
| Capacidad | Tipo de herramental que fabrica el proveedor |
| Región | Ubicación geográfica |
| Desempeño histórico | Rating calculado por el módulo de Evaluaciones |
| Especialidad | Mold / Trimming / Ambos |

---

## 6. Seguimiento de cotizaciones

Disponible en estados EN COTIZACIÓN y PARCIALMENTE COTIZADA.

### Panel de progreso (dentro del detalle de RFQ)

| Columna | Descripción |
|---------|-------------|
| Proveedor | Nombre de la empresa |
| Estado | Pendiente / Cotización enviada / Vencido |
| Días restantes | Countdown individual por proveedor |
| Acciones | Ver cotización (si ya la envió) |

### Transiciones automáticas visibles

| Evento | Cambio en UI |
|--------|-------------|
| Primera cotización recibida | Estado cambia a PARCIALMENTE COTIZADA. Notificación. |
| 4ª cotización válida recibida | Estado cambia a BENCHMARK LISTO. Notificación. Banner en dashboard. |
| Plazo vence sin 4 cotizaciones | Estado cambia a VENCIDA. Notificación a Com Admin. |

---

## 7. Benchmark y análisis comparativo

**Disponible en:** estado BENCHMARK LISTO

### Contenido del benchmark

| Sección | Contenido |
|---------|-----------|
| Tabla comparativa | Una columna por proveedor: precio unitario, herramienta, mano de obra, total, tiempo de entrega |
| Indicadores de precio | Mínimo, máximo, promedio entre cotizaciones |
| Scorecard por proveedor | Rating histórico, puntualidad, calidad de cotización |
| Outliers | Cotizaciones que se desvían significativamente del promedio |

### Acciones en el benchmark

| Acción | Disponible para | Resultado |
|--------|----------------|-----------|
| Exportar a Excel | Com, Com Admin | Descarga el comparativo como archivo `.xlsx` |
| Cerrar RFQ | Com Admin | `CloseRfqModal` → RFQ pasa a CERRADA |
| Extender plazo / reenviar | Com Admin | `ExtendDeadlineModal` → nueva selección de proveedores → RFQ vuelve a EN COTIZACIÓN |

### Flujo de extensión de plazo

1. Com Admin hace clic en "Extender plazo" desde el benchmark o el detalle.
2. `ExtendDeadlineModal` muestra:
   - Campo de nueva fecha límite.
   - Opción de reenviar a los mismos proveedores o seleccionar nuevos.
3. Al confirmar, la RFQ regresa a EN COTIZACIÓN. Las cotizaciones ya recibidas se conservan.

---

## 8. Explorador de proveedores

**Ruta:** `/compras/proveedores`

Vista de catálogo operativo para encontrar proveedores antes de una asignación.

| Elemento | Descripción |
|----------|-------------|
| Tabla / cards de proveedores | Nombre, país, capacidad, rating, especialidad |
| Filtros avanzados | Capacidad, región, rating mínimo, especialidad |
| Acceso desde asignación | Se puede abrir directamente desde la pantalla de selección de proveedores |

---

## 9. Flujos exclusivos del Super Usuario (Com Admin)

### 9.1 Admin Dashboard — `/compras/admin`

**Lo que el admin ve:**
- Cola de asignaciones enviadas por Com base en PEND. APROBACIÓN COMPRAS.
- Solicitudes de desbloqueo de cotizaciones pendientes.
- RFQs con benchmark listo sin decisión de cierre.
- RFQs vencidas sin acción.

### 9.2 Aprobar o rechazar una selección de proveedores

El admin accede desde el Admin Dashboard o desde una notificación al detalle de la RFQ.

#### Aprobar

| Paso | Acción |
|------|--------|
| 1 | Clic en "Aprobar" en la barra de acciones |
| 2 | Modal de confirmación con lista de proveedores que serán notificados |
| 3 | Confirmar |

**Resultado:** Proveedores notificados. RFQ pasa a EN COTIZACIÓN. Plazo de 10 días hábiles inicia.

#### Rechazar

| Paso | Acción |
|------|--------|
| 1 | Clic en "Rechazar" |
| 2 | `RejectWithReasonModal` — motivo **obligatorio** |
| 3 | Confirmar |

**Resultado:** RFQ vuelve a PENDIENTE. Com base recibe notificación para proponer nueva selección.

#### Editar y aprobar

| Paso | Acción |
|------|--------|
| 1 | Clic en "Editar y aprobar" |
| 2 | Se abre la pantalla de selección con los proveedores ya elegidos |
| 3 | Admin modifica la selección |
| 4 | Confirma → modal de advertencia (punto de compromiso) |
| 5 | Confirmar |

**Resultado:** Proveedores notificados con la selección modificada. RFQ pasa a EN COTIZACIÓN.

### 9.3 Gestionar solicitudes de desbloqueo — `/compras/admin/desbloqueos`

**Cuándo llega una solicitud:** cuando un proveedor solicita editar una cotización ya enviada.

| Elemento visible | Descripción |
|-----------------|-------------|
| RFQ | A qué solicitud pertenece la cotización |
| Proveedor | Quién solicita el desbloqueo |
| Motivo | Razón ingresada por el proveedor |
| Historial | Cambios previos en esa cotización |

**Acciones:**

| Acción | Motivo obligatorio | Resultado |
|--------|:-----------------:|-----------|
| Aprobar | — | Cotización editable. Registro de quién autorizó y cuándo. |
| Rechazar | ✓ | Solicitud rechazada. Proveedor notificado con el motivo. |

### 9.4 Cerrar una RFQ

Disponible desde el benchmark o el detalle de RFQ en BENCHMARK LISTO.

| Paso | Acción |
|------|--------|
| 1 | Clic en "Cerrar RFQ" |
| 2 | `CloseRfqModal` con mensaje de confirmación |
| 3 | Confirmar |

**Resultado:** RFQ pasa a CERRADA. Queda en solo lectura con toda la auditoría preservada.

### 9.5 Gestión del catálogo de proveedores — `/compras/admin/proveedores`

| Acción | Descripción |
|--------|-------------|
| Agregar proveedor | Formulario con datos de contacto, capacidades y especialidad |
| Editar proveedor | Actualizar información o estado |
| Desactivar proveedor | El proveedor deja de aparecer en la selección para nuevas RFQs; historial conservado |

---

## 10. Pantallas y rutas del área

| Pantalla | Ruta | Com base | Com Admin |
|----------|------|:--------:|:---------:|
| Dashboard | `/compras/dashboard` | ✓ | ✓ |
| Lista de RFQs | `/compras/rfq` | ✓ | ✓ |
| Detalle de RFQ | `/compras/rfq/:id` | ✓ | ✓ |
| Analytics | `/compras/analytics` | ✓ | ✓ |
| Explorador de proveedores | `/compras/proveedores` | ✓ | ✓ |
| Admin Dashboard | `/compras/admin` | — | ✓ |
| Gestión de proveedores | `/compras/admin/proveedores` | — | ✓ |
| Solicitudes de desbloqueo | `/compras/admin/desbloqueos` | — | ✓ |
