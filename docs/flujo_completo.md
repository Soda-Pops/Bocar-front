# Flujo completo del sistema — Bocar Frontend

> **Nota general:** Todas las rutas (excepto `/login` y `/`) requieren autenticación.
> El sistema detecta el rol del usuario al iniciar sesión y redirige automáticamente
> al dashboard correspondiente. Si un usuario intenta acceder a una ruta de otro rol,
> es redirigido a `/401`.

---

## Índice

1. [Autenticación](#1-autenticación)
2. [Ciclo de vida de un RFQ](#2-ciclo-de-vida-de-un-rfq)
3. [Área — Industrialización](#3-área--industrialización)
4. [Área — Compras](#4-área--compras)
5. [Área — Proveedor](#5-área--proveedor)
6. [Superficies transversales](#6-superficies-transversales)
7. [Roles y permisos de navegación](#7-roles-y-permisos-de-navegación)

---

## 1. Autenticación

### Ruta: `/login` (o `/`)

La pantalla de login es la puerta de entrada única. Soporta dos flujos de autenticación diferenciados visualmente.

---

#### Acceso interno (SSO)

**Actor:** Usuario de Industrialización o Compras

**Pasos:**
1. El usuario hace clic en **"Acceso interno"**.
2. El sistema inicia el flujo SSO/AD corporativo.
3. Si la autenticación es exitosa, el sistema resuelve el rol (`Ind`, `Ind Admin`, `Com`, `Com Admin`).
4. Redirige automáticamente al dashboard del rol.

**Redirección por rol:**
| Rol detectado | Ruta de destino |
|--------------|----------------|
| `Ind` / `Ind Admin` | `/industrializacion/dashboard` |
| `Com` / `Com Admin` | `/compras/dashboard` |

**Errores:**
| Condición | Mensaje mostrado |
|-----------|-----------------|
| Fallo de SSO | "Error al conectar con el directorio corporativo. Intente de nuevo." |
| Rol no reconocido | Redirige a `/401` |
| Sesión expirada al navegar | Redirige a `/login` con mensaje "Tu sesión expiró. Vuelve a iniciar sesión." |

---

#### Acceso proveedor (credenciales)

**Actor:** Usuario externo (Proveedor)

**Pasos:**
1. El usuario ingresa su correo y contraseña proporcionados por BOCAR.
2. Hace clic en **"Ingresar"**.
3. El sistema valida las credenciales.
4. Redirige a `/proveedor/dashboard`.

**Errores:**
| Condición | Mensaje mostrado |
|-----------|-----------------|
| Credenciales incorrectas | "Correo o contraseña incorrectos." |
| Cuenta inactiva | "Tu cuenta está desactivada. Contacta a BOCAR." |

---

## 2. Ciclo de vida de un RFQ

Un RFQ transita por los siguientes estados durante su ciclo de vida. La UI refleja el estado en todo momento mediante badges de color y banners contextuales.

```
BORRADOR
    │
    ▼
PENDIENTE APROBACIÓN INTERNA ←── rechazado (vuelve a BORRADOR)
    │  aprobado
    ▼
PENDIENTE
    │
    ▼
PENDIENTE APROBACIÓN COMPRAS ←── rechazado (vuelve a PENDIENTE)
    │  aprobado / asignación directa
    ▼
EN COTIZACIÓN ─────────────────────────────────────────────────┐
    │                                                           │
    │ primera cotización                              plazo vence
    ▼                                                           │
PARCIALMENTE COTIZADA                                      VENCIDA
    │                                                      │
    │ 4+ cotizaciones                         extender ──►  │
    ▼                                                      │
BENCHMARK LISTO ─────────────────────────────────────────►─┤
    │ cerrar                                                │
    ▼                                                  CERRADA
CERRADA

CANCELADA ←── disponible desde BORRADOR hasta PEND. APROBACIÓN COMPRAS
```

### Colores de badge por estado

| Estado | Color |
|--------|-------|
| BORRADOR | Gris |
| PENDIENTE APROBACIÓN INTERNA | Amarillo |
| PENDIENTE | Azul |
| PENDIENTE APROBACIÓN COMPRAS | Amarillo |
| EN COTIZACIÓN | Verde |
| PARCIALMENTE COTIZADA | Verde claro |
| BENCHMARK LISTO | Púrpura |
| VENCIDA | Naranja |
| CERRADA | Gris oscuro |
| CANCELADA | Rojo |

---

## 3. Área — Industrialización

**Roles:** `Ind` · `Ind Admin`
**Layout:** `MainLayout` (sidebar + top bar)
**Navegación del sidebar:**
- Dashboard
- RFQs
- Predicción
- Analytics
- Admin *(solo Ind Admin)*
- Solicitudes *(solo Ind Admin)*

---

### 3.1 Dashboard — `/industrializacion/dashboard`

**Qué muestra:**
- Tarjetas KPI: borradores, pendientes de aprobación, en cotización, benchmark listo, cerradas.
- Tabla de RFQs recientes con estado y acciones rápidas.
- Botón principal **"Crear RFQ"**.
- Acceso a "Predicción de costo".

**Acciones disponibles:**
| Acción | Resultado |
|--------|-----------|
| Clic en "Crear RFQ" | Navega a `/industrializacion/rfq/crear` |
| Clic en una RFQ de la tabla | Navega a `/industrializacion/rfq/:id` |
| Clic en KPI "Borradores" | Filtra la tabla para mostrar solo borradores |

---

### 3.2 RFQ Create — `/industrializacion/rfq/crear`

**Qué muestra:**
- Selector de tipo: **MOLDE** o **RECORTE**.
- Formulario en dos columnas: campos a la izquierda, checklist de completitud a la derecha.
- Zona de carga de archivos STP y PPT.
- Barra inferior sticky con: **"Guardar borrador"** y **"Enviar para aprobación"**.

**Flujo de creación:**
1. El usuario selecciona el tipo de RFQ.
2. Completa los campos del formulario (React Hook Form + Zod).
3. Sube el STP y el PPT.
4. El checklist de la derecha se actualiza en tiempo real mostrando qué falta.
5. **"Guardar borrador"** → RFQ pasa a estado BORRADOR. Muestra toast de confirmación. Redirige a `/industrializacion/rfq/:id`.
6. **"Enviar para aprobación"** (solo habilitado cuando checklist completo) → RFQ pasa a PENDIENTE APROBACIÓN INTERNA. Redirige al detalle en modo solo lectura.

**Validaciones bloqueantes:**
- `requiredDate` debe ser futura.
- `quotationDeadline` debe ser futura y anterior a `requiredDate`.
- Ambos archivos (STP y PPT) obligatorios para enviar.
- Campos técnicos obligatorios según el tipo seleccionado.

**Errores:**
| Condición | Comportamiento |
|-----------|---------------|
| Campo inválido | Mensaje de error inline bajo el campo |
| Intento de enviar con campos faltantes | ValidationSummary visible y botón "Enviar" bloqueado |
| Archivo demasiado grande | Toast de error con límite de tamaño |

---

### 3.3 RFQ Edit — `/industrializacion/rfq/:id/editar`

Idéntico al formulario de creación pero pre-rellena los datos del RFQ existente. Solo disponible si el RFQ está en estado BORRADOR. Si se intenta acceder a esta ruta con otro estado, redirige al detalle.

---

### 3.4 RFQ Detail — `/industrializacion/rfq/:id`

**Qué muestra (varía por estado):**

| Sección | Siempre visible | Solo en estados avanzados |
|---------|----------------|--------------------------|
| Header con badge de estado y CTAs | ✓ | — |
| Resumen técnico | ✓ | — |
| Documentos (STP, PPT) | ✓ | — |
| Timeline de transiciones | ✓ | — |
| Progreso de proveedores | — | QUOTING, PARTIALLY_QUOTED, BENCHMARK_READY |
| Benchmark | — | BENCHMARK_READY |
| Panel de auditoría | — | Ind Admin |

**CTAs por estado y rol:**

| Estado | Ind base | Ind Admin |
|--------|----------|-----------|
| BORRADOR | Editar | Editar, Enviar a Compras |
| PEND. APROBACIÓN INTERNA | — (solo lectura) | Aprobar, Rechazar, Editar y aprobar, Cancelar |
| PENDIENTE | Solicitar edición | — |
| EN COTIZACIÓN en adelante | — (solo lectura) | — (solo lectura) |

**Banner "Punto de no retorno":**
Visible cuando el RFQ está en EN COTIZACIÓN o posterior. Texto: *"Esta RFQ ya no puede cancelarse. Los proveedores han sido notificados."*

---

### 3.5 Prediction Page — `/industrializacion/prediccion`

**Qué muestra:**
- Formulario de parámetros técnicos (izquierda).
- Panel de resultado: costo estimado, rango de variación, nivel de confianza (derecha).
- Comparativo con cotizaciones reales de RFQs similares (si existen).

> La predicción es una herramienta de apoyo. El sistema muestra un aviso visible: *"Este valor es una estimación. No reemplaza las cotizaciones formales."*

---

### 3.6 Admin Dashboard — `/industrializacion/admin` *(solo Ind Admin)*

**Qué muestra:**
- Cola de RFQs en PENDIENTE APROBACIÓN INTERNA.
- Contadores de pendientes críticos.
- Acceso directo al detalle de cada RFQ pendiente.

**Flujo de aprobación:**
1. Admin hace clic en una RFQ pendiente → navega a `/industrializacion/rfq/:id`.
2. En el detalle, elige una acción:
   - **Aprobar** → RFQ pasa a PENDIENTE. Toast de confirmación.
   - **Rechazar** → Modal con campo de motivo obligatorio. Al confirmar, RFQ vuelve a BORRADOR. Notificación enviada al creador.
   - **Editar y aprobar** → Abre workspace de edición con diff visible. Al confirmar, RFQ pasa a PENDIENTE con auditoría registrada.
   - **Cancelar** → Modal con motivo obligatorio. RFQ pasa a CANCELADA. Notificación enviada a involucrados.

---

### 3.7 Requests Management — `/industrializacion/admin/solicitudes` *(solo Ind Admin)*

**Qué muestra:**
- Lista de solicitudes de cambio enviadas por usuarios base.
- Para cada solicitud: tipo de cambio, RFQ, solicitante, fecha, estado y prioridad.
- Panel de detalle con diff entre versión original y cambio solicitado.

**Acciones:**
| Acción | Resultado |
|--------|-----------|
| Aprobar | Solicitud aprobada; cambios aplicados |
| Rechazar | Solicitud rechazada con motivo; notificación al solicitante |
| Devolver con comentario | Solicitud devuelta para corrección |

---

## 4. Área — Compras

**Roles:** `Com` · `Com Admin`
**Layout:** `MainLayout` (sidebar + top bar)
**Navegación del sidebar:**
- Dashboard
- RFQs
- Analytics
- Proveedores
- Admin *(solo Com Admin)*
- Proveedores Admin *(solo Com Admin)*
- Desbloqueos *(solo Com Admin)*

---

### 4.1 Dashboard — `/compras/dashboard`

**Qué muestra:**
- KPIs: por asignar, en cotización, benchmark listo, vencidas.
- Resumen de respuesta de proveedores (asignados vs. que cotizaron).
- Accesos rápidos a asignación, benchmark y desbloqueos.
- Tabla de RFQs activos con urgencia visual.

---

### 4.2 RFQ List — `/compras/rfq`

**Qué muestra:**
- Tabla de todas las RFQs con: ID, proyecto, estado, creador, proveedores asignados, progreso de cotizaciones, deadline.
- Filtros por estado, fecha límite, región, tipo de máquina.
- RFQs próximas a vencer resaltadas visualmente.

**Acciones por fila:**
| Acción | Resultado |
|--------|-----------|
| Ver detalle | Navega a `/compras/rfq/:id` |
| Asignar proveedores | Navega a pantalla de asignación |
| Ver benchmark | Disponible solo en BENCHMARK_READY |

---

### 4.3 RFQ Detail — `/compras/rfq/:id`

**Qué muestra:**
- Header con estado y CTAs comerciales.
- Resumen técnico suficiente para asignación de proveedores.
- Lista de proveedores asignados con su estado de cotización.
- Countdown del plazo activo.
- Acceso a benchmark cuando aplique.

**CTAs por estado:**

| Estado | Com base | Com Admin |
|--------|----------|-----------|
| PENDIENTE | Ir a asignación de proveedores | Ir a asignación / Asignar directo |
| PEND. APROBACIÓN COMPRAS | — (en revisión) | Aprobar, Rechazar, Editar y aprobar |
| EN COTIZACIÓN | Ver progreso | Ver progreso |
| BENCHMARK LISTO | Ver benchmark | Ver benchmark, Cerrar RFQ, Extender |
| VENCIDA | — | Extender plazo, Cerrar RFQ |
| CERRADA / CANCELADA | Solo lectura | Solo lectura |

---

### 4.4 Supplier Selection — accesible desde el detalle de RFQ en PENDIENTE

**Qué muestra:**
- Resumen técnico de la RFQ (zona superior).
- Catálogo de proveedores con buscador y filtros por capacidad, región y desempeño.
- Sugerencias automáticas del sistema según parámetros de la RFQ.
- Bandeja de proveedores seleccionados (sticky, lateral derecho).

**Flujo:**
1. Compras busca y agrega proveedores a la bandeja.
2. **Com base** → CTA "Enviar para aprobación": RFQ pasa a PENDIENTE APROBACIÓN COMPRAS.
3. **Com Admin** → CTA "Notificar proveedores e iniciar plazo": RFQ pasa directamente a EN COTIZACIÓN. Proveedores notificados.

> ⚠️ La notificación directa a proveedores es el **punto de compromiso institucional**. El sistema muestra un modal de confirmación con el mensaje: *"Al confirmar, los proveedores serán notificados y el plazo de cotización comenzará. Esta acción no puede deshacerse."*

---

### 4.5 Benchmark — accesible desde detalle de RFQ en BENCHMARK_READY

**Qué muestra:**
- Tabla comparativa con todas las cotizaciones: precio unitario, herramienta, mano de obra, tiempo de entrega.
- Indicadores: precio mínimo, máximo y promedio.
- Scorecard de desempeño histórico por proveedor.
- Botón de exportación a Excel.

**CTAs (solo Com Admin):**
| Acción | Resultado |
|--------|-----------|
| Cerrar RFQ | Modal de confirmación → RFQ pasa a CERRADA |
| Extender plazo | Modal: nuevo plazo + selección de proveedores → RFQ vuelve a EN COTIZACIÓN |

---

### 4.6 Admin Dashboard — `/compras/admin` *(solo Com Admin)*

**Qué muestra:**
- Aprobaciones pendientes de selección de proveedores.
- Cola de solicitudes de desbloqueo.
- RFQs con benchmark listo esperando decisión.
- RFQs vencidas pendientes de acción.

---

### 4.7 Unlock Requests — `/compras/admin/desbloqueos` *(solo Com Admin)*

**Qué muestra:**
- Cola de solicitudes de desbloqueo de cotizaciones.
- Por cada solicitud: RFQ, proveedor, motivo, historial de cambios previos.

**Acciones:**
| Acción | Resultado |
|--------|-----------|
| Aprobar | Cotización queda editable para el proveedor. Registro de quién autorizó y cuándo. |
| Rechazar | Motivo obligatorio. Proveedor notificado con el resultado. |

---

### 4.8 Supplier Catalog Explorer — `/compras/proveedores`

**Qué muestra:**
- Catálogo de proveedores con capacidades, región, desempeño y especialidad.
- Filtros avanzados para matching con RFQs.

> Esta vista es para consulta y exploración, no para administración del catálogo.

---

### 4.9 Supplier Management — `/compras/admin/proveedores` *(solo Com Admin)*

**Qué muestra:**
- Tabla maestra de proveedores con datos de contacto, estado y atributos.
- Acciones: agregar, editar, desactivar proveedor.

---

## 5. Área — Proveedor

**Rol:** `Pro`
**Layout:** Supplier Shell (navegación mínima)
**Navegación:**
- Dashboard
- RFQs asignadas
- Cotizaciones

> El proveedor **nunca** ve benchmark, cotizaciones de otros proveedores, analytics internos ni el catálogo de proveedores.

---

### 5.1 Dashboard — `/proveedor/dashboard`

**Qué muestra:**
- RFQs asignadas ordenadas por urgencia (días restantes para cotizar).
- Cotizaciones enviadas con su estado actual.
- Solicitudes de desbloqueo pendientes.
- Accesos rápidos: "Cotizar ahora" y "Ver historial".

---

### 5.2 RFQ List — `/proveedor/rfq`

**Qué muestra:**
- Tabla de RFQs asignadas: ID, proyecto, deadline con colores de urgencia, estado de cotización propia.

**Acciones por fila:**
| Acción | Resultado |
|--------|-----------|
| Ver RFQ | Navega a `/proveedor/rfq/:id` |
| Cotizar | Navega a `/proveedor/rfq/:rfqId/cotizar` |

---

### 5.3 RFQ Detail — `/proveedor/rfq/:id`

**Qué muestra:**
- Countdown dominante con días y horas restantes.
- Resumen técnico de la solicitud.
- Sección de documentos con botones de descarga (STP y PPT).
- Estado de la propia cotización.
- CTA: "Cotizar" (si no ha enviado) o "Ver cotización" (si ya envió).

**Restricciones visuales:**
- No muestra otros proveedores asignados.
- No muestra información de cotizaciones de otros.
- No muestra benchmark ni comparativos.

---

### 5.4 Quotation Form — `/proveedor/rfq/:rfqId/cotizar`

**Qué muestra:**
- Formulario en cuatro secciones navegables.
- Resumen sticky de la RFQ (lateral).
- Barra inferior con "Guardar borrador" y "Enviar cotización".

**Secciones del formulario:**

| Sección | Campos | Validaciones |
|---------|--------|-------------|
| 1 — Precios | Precio unitario, precio de herramienta, precio de mano de obra | Todos positivos (> 0) |
| 2 — Dimensiones | Dimensiones del molde propuesto | Según especificación de la RFQ |
| 3 — Tiempos | Semanas de entrega | Entero entre 1 y 52 |
| 4 — Documento | PDF oficial de cotización | Obligatorio, PDF, máx. 15 MB |

**Flujo:**
1. El proveedor puede guardar borradores parciales.
2. Al hacer clic en "Enviar cotización", el sistema muestra un modal de advertencia: *"Al enviar, tu cotización quedará bloqueada y no podrás modificarla. ¿Deseas continuar?"*
3. Si confirma, la cotización se envía y queda en estado "Enviada (bloqueada)".

**Errores:**
| Condición | Comportamiento |
|-----------|---------------|
| Campo de precio negativo o cero | Error inline: "El precio debe ser mayor a 0" |
| Semanas fuera de rango | Error inline: "Debe ser un número entre 1 y 52" |
| PDF faltante al enviar | Toast de error: "El PDF de cotización es obligatorio" |
| PDF mayor a 15 MB | Toast de error con indicación del tamaño máximo |
| Plazo vencido mientras navega | Banner de aviso y deshabilitación del botón de envío |

---

### 5.5 Quotation List — `/proveedor/cotizaciones`

**Qué muestra:**
- Historial de cotizaciones enviadas: RFQ, fecha de envío, estado, deadline original.
- Filtros por estado.

**Estados de cotización:**
| Estado | Color | Significado |
|--------|-------|-------------|
| Enviada (bloqueada) | Gris | Recibida; no modificable |
| Solicitud enviada | Amarillo | Pendiente de respuesta de Compras |
| Solicitud rechazada | Rojo | Compras no aprobó el desbloqueo |
| Desbloqueada | Verde | Editable nuevamente |

---

### 5.6 Quotation Detail — `/proveedor/cotizaciones/:id`

**Qué muestra:**
- Resumen de valores enviados (precios, dimensiones, entrega).
- PDF adjunto con botón de descarga.
- Timeline de bloqueos y desbloqueos.
- Estado de la solicitud de desbloqueo (si existe).

**CTA "Solicitar desbloqueo"** (visible solo si cotización está en "Enviada (bloqueada)"):
1. El proveedor hace clic.
2. Modal con campo de motivo obligatorio.
3. Al confirmar, solicitud enviada a Compras. Estado cambia a "Solicitud enviada".

---

## 6. Superficies transversales

### 6.1 Centro de notificaciones

Accesible desde el ícono de campana en el top bar del `MainLayout` y del Supplier Shell.

**Comportamiento:**
- Se abre como drawer lateral derecho.
- Muestra eventos agrupados por criticidad y fecha.
- Cada notificación tiene un deep link a la pantalla donde se debe actuar.
- Permite marcar como leída sin perder el foco.

**Eventos que generan notificación:**

| Evento | Rol que recibe |
|--------|---------------|
| RFQ pendiente de aprobación interna | Ind Admin |
| RFQ aprobada — lista para asignación | Com |
| Asignación pendiente de aprobación | Com Admin |
| RFQ enviada a proveedores | Ind, Com, Pro |
| Nueva cotización recibida | Ind, Com |
| Benchmark listo | Ind, Com |
| RFQ vencida | Ind, Com Admin |
| Solicitud de desbloqueo recibida | Com Admin |
| Cotización desbloqueada | Pro |
| RFQ cancelada | Ind, Com, Pro (si aplica) |

### 6.2 Modales críticos

| Modal | Cuándo aparece | Motivo obligatorio |
|-------|---------------|:-----------------:|
| `ConfirmEditModal` | Antes de "Editar y aprobar" | — (muestra diff) |
| `RejectWithReasonModal` | Al rechazar una RFQ o asignación | ✓ |
| `CancelRfqModal` | Al cancelar una RFQ | ✓ |
| `CloseRfqModal` | Al cerrar definitivamente | — |
| `ExtendDeadlineModal` | Al extender el plazo de una RFQ vencida | — |
| `UnlockRequestModal` | Al solicitar desbloqueo de cotización | ✓ |
| `EditRequestModal` | Al solicitar edición de RFQ enviada | ✓ |

### 6.3 Estados transversales de feedback

Todas las pantallas implementan:

| Estado | Componente | Cuándo |
|--------|-----------|--------|
| Cargando | `LoadingOverlay` o skeleton | Mientras se obtienen datos |
| Sin datos | `EmptyState` con CTA | Lista vacía de RFQs o cotizaciones |
| Error de carga | Banner de error con botón "Reintentar" | Fallo en la petición |
| Acción confirmada | Toast de éxito | Después de guardar, aprobar, enviar |
| Acción fallida | Toast de error | Fallo en mutación |

---

## 7. Roles y permisos de navegación

| Ruta | Ind | Ind Admin | Com | Com Admin | Pro |
|------|:---:|:---------:|:---:|:---------:|:---:|
| `/industrializacion/dashboard` | ✓ | ✓ | — | — | — |
| `/industrializacion/rfq/crear` | ✓ | ✓ | — | — | — |
| `/industrializacion/rfq/:id` | ✓ | ✓ | — | — | — |
| `/industrializacion/prediccion` | ✓ | ✓ | — | — | — |
| `/industrializacion/analytics` | ✓ | ✓ | — | — | — |
| `/industrializacion/admin` | — | ✓ | — | — | — |
| `/industrializacion/admin/solicitudes` | — | ✓ | — | — | — |
| `/compras/dashboard` | — | — | ✓ | ✓ | — |
| `/compras/rfq` | — | — | ✓ | ✓ | — |
| `/compras/rfq/:id` | — | — | ✓ | ✓ | — |
| `/compras/proveedores` | — | — | ✓ | ✓ | — |
| `/compras/analytics` | — | — | ✓ | ✓ | — |
| `/compras/admin` | — | — | — | ✓ | — |
| `/compras/admin/proveedores` | — | — | — | ✓ | — |
| `/compras/admin/desbloqueos` | — | — | — | ✓ | — |
| `/proveedor/dashboard` | — | — | — | — | ✓ |
| `/proveedor/rfq` | — | — | — | — | ✓ |
| `/proveedor/rfq/:id` | — | — | — | — | ✓ |
| `/proveedor/rfq/:id/cotizar` | — | — | — | — | ✓ |
| `/proveedor/cotizaciones` | — | — | — | — | ✓ |
| `/proveedor/cotizaciones/:id` | — | — | — | — | ✓ |

> Los links a rutas no permitidas **no se muestran** en la navegación (no se deshabilitan, se ocultan). Si un usuario intenta acceder directamente a la URL, el `ProtectedRoute` redirige a `/401`.
