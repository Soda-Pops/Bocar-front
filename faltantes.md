# Análisis de Gaps — BOCAR RFQ System
### Qué falta por construir, priorizado y en formato de historia de usuario

> **Fecha:** 2026-06-08 — **Revisado:** 2026-06-08 (verificado contra código real del backend)
> **Fuentes analizadas:** `FRONTEND_BACKLOG.md`, `ARCHITECTURE_PROPOSAL.md`, `flujo_completo.md`, `flujo_comercializacion.md`, `flujo_proveedor.md`, `rfq-lifecycle-missing-endpoints.md`, `routes.ts`, código fuente real de `Bocar-front/src/` y `backend-bocar-2026/` (urls.py + views.py de cada app).

---

corregir los detalles del detail page
corregir mensajes de error en el frontend
seccion de archivos proveedor
Quitar el mock 7 de la cotizacion
asegurar que todos los campos del form lleguen al back
quitar todos los mocks
en la pantalla de cotizaciones usar los ofuscados?
que en la pantalla de detalle se vea el status correcto
quitar campo extra que viene del correo
ver que onda con los campos si/no como se guardan?

panel de compras que los desbloqueos y eso ya quede conectado
grafica que se vea el ultimo mes 

QUE CAMPOS QUE SE AUTORELLENAN NUEVOS SEAN INT TODOS LOS QUE SE AOUTORELLENEN O LOS QUE SE USEN EN OPERACIONES

QUE EL ID SEA ID-DESC NO PART TECHNOLOGY

Verificar campos que sean los mismos en ind y en provedor

## Resumen ejecutivo

| Prioridad | Área | Cantidad de items | Impacto |
|-----------|------|-------------------|---------|
| **P0 — Crítico** | Backend + Frontend | 15 | Bloquean el flujo de negocio de punta a punta |
| **P1 — Importante** | Backend + Frontend | 13 | Cierran ciclos completos y experiencias de rol |
| **P2 — Complementario** | Frontend + Backend | 10 | Elevan calidad operativa y analítica |
| **P3 — Soporte** | Frontend + Backend | 8 | Robustez, seguridad y refinamiento |

El sistema hoy tiene el **ciclo de Industrialización parcialmente funcional** (creación y envío de RFQ), el área de Comercialización funcional para asignaciones y resolución de solicitudes, y el área de Proveedor con los endpoints de cotización implementados pero **sin ninguna pantalla frontend operativa**. El backend carece de los endpoints de cierre, cancelación y progreso estructurado del RFQ. Sin P0, ningún flujo puede ejecutarse de punta a punta con UI real.

> **Nota de revisión:** La versión anterior de este documento declaraba los endpoints de cotización del proveedor como inexistentes. Tras revisar el código real de `Asignaciones/views.py` y `Asignaciones/urls.py`, se confirmó que **todos están implementados y funcionales**. El item P0-B1 fue eliminado y el checklist final actualizado. También se corrigió P1-B1: el endpoint de rechazo de solicitud de edición existe, pero tiene gaps de implementación reales documentados abajo.

---

## P0 — Crítico (bloquean el flujo mínimo viable)

---

### ~~P0-B1~~ → P0-B1 · BACKEND · Endpoints de cotización del proveedor — ✅ YA IMPLEMENTADOS

> **Corrección post-revisión de código:** El documento original declaraba estos endpoints como inexistentes basándose en el documento `rfq-lifecycle-missing-endpoints.md`. Sin embargo, al revisar el código real, **todos están implementados y funcionales** en `Asignaciones/views.py` + `Asignaciones/urls.py`:
>
> | Endpoint | Vista | Estado |
> |----------|-------|--------|
> | `POST /api_proveedores/v1/asginaciones/responder/<id>/` | `AsignacionResponderView` | ✅ Implementado |
> | `GET /api_proveedores/v1/asginaciones/responder/<id>/detalle/` | `AsignacionBorradorDetalleView` | ✅ Implementado |
> | `PATCH /api_proveedores/v1/asginaciones/responder/<id>/actualizar/` | `AsignacionBorradorActualizarView` | ✅ Implementado |
> | `POST /api_proveedores/v1/asginaciones/responder/<id>/enviar/` | `AsignacionEnviarRespuestaView` | ✅ Implementado |
>
> Los modelos `Prov_RFQ_Mold/views.py` y `Prov_RFQ_Trimming/views.py` sí están vacíos, pero **la lógica real de cost breakdown vive en `Asignaciones/views.py`**, que importa directamente los modelos `Cost_Breakdown_Mold` y `Cost_Breakdown_Trimming`. El flujo crea borradores, los actualiza y los envía con registro en historial y notificaciones a Comercialización.
>
> **Lo que sí falta** en el flujo de cotización es la aceptación de archivo PDF adjunto: la implementación actual del envío no procesa `multipart/form-data` con PDF. Esto aplica como gap menor, no bloqueador del flujo básico.

---

### P0-B2 · BACKEND · Endpoint de progreso estructurado del RFQ para Compras

**Historia de usuario:**
Como usuario de Compras,
Quiero consultar el estado real de avance de un RFQ con proveedores asignados y cotizaciones recibidas,
Para saber si debo esperar, extender el plazo o cerrar.

**Descripción:**
Hoy `GET /api_comercializacion/v1/rfqs/` devuelve un string descriptivo de progreso (`"2/3 proveedores respondieron"`) pero no expone los datos estructurados necesarios para el benchmark ni para calcular `workflow_status` en el frontend. Se necesita un endpoint de detalle de progreso.

**Endpoint a crear:**
```http
GET /api_comercializacion/v1/rfq/<id>/progreso/?tipo=mold|trimming
```

**Respuesta esperada:**
```json
{
  "rfq_id": 123,
  "status": "En_Pro",
  "workflow_status": "PARTIALLY_QUOTED",
  "assigned_suppliers_count": 3,
  "submitted_quotes_count": 2,
  "pending_quotes_count": 1,
  "all_quotations_received": false,
  "is_expired": false,
  "can_assign_suppliers": true,
  "can_close": true,
  "has_pending_edit_request": false,
  "suppliers": [
    {
      "assignment_id": 41,
      "supplier_id": 5,
      "supplier_name": "Proveedor A",
      "assignment_status": "answered",
      "quotation_status": "submitted",
      "total_amount": "150000.00"
    }
  ]
}
```

**Criterios de aceptación:**
- `workflow_status` es un campo calculado que combina `status` + condiciones del RFQ (ver tabla en `rfq-lifecycle-missing-endpoints.md §Estados sugeridos`).
- Las banderas `can_assign_suppliers`, `can_close`, `is_expired` son calculadas en el servidor, no en el cliente.
- Solo roles `Com` y `Com Admin` pueden acceder.
- Retorna `404` si el RFQ no existe o `403` si el usuario no tiene acceso.

---

### P0-B3 · BACKEND · Endpoint para cerrar RFQ - Modificar el cierre automatico actual

**Historia de usuario:**
Como usuario de Compras,
Quiero cerrar formalmente un RFQ cuando el proceso de cotización concluye,
Para registrar el proveedor seleccionado y el motivo de cierre en el historial.

**Endpoint a crear:**
```http
POST /api_comercializacion/v1/rfq/<id>/cerrar/?tipo=mold|trimming
```

**Body:**
```json
{
  "selected_supplier_id": 5,
  "selected_quotation_id": 77,
  "closure_reason": "Mejor cumplimiento técnico y comercial."
}
```

**Criterios de aceptación:**
- El RFQ debe estar en `En_Pro` (se tienen que tener todas las asignaciones asociadas a esa rfq cerradas o expiradas para cerrar el rfq )
- Cambia el RFQ a `complete` (`CLOSED`).
- Guarda `closed_at`, `closed_by`, proveedor seleccionado y motivo.
- Registra evento en `historial/`.
- Solo `Com` o `Com Admin` pueden ejecutarlo.

---

### P0-B4 · BACKEND · Endpoint para cancelar RFQ con motivo y protocolo diferenciado

**Historia de usuario:**
Como Super Usuario (Ind Admin o Com Admin),
Quiero cancelar un RFQ con motivo obligatorio y que el sistema aplique el protocolo correcto según el estado actual,
Para garantizar trazabilidad y que los proveedores sean notificados si ya cotizaban.

**Endpoints a crear:**
```http
POST /api_industrializacion/v1/rfq/<id>/cancelar/?tipo=mold|trimming
```

**Body:**
```json
{
  "reason": "El proyecto fue cancelado por el cliente."
}
```

**Criterios de aceptación:**
- Solo `is_admin=True` puede ejecutarlo.
- **Cancelación temprana** (`En_Ind`, `En_Com` sin proveedores): notifica solo a internos, no genera RFQ de reemplazo.
- **Cancelación tardía** (`En_Pro`): notifica a todos los proveedores asignados Y crea un nuevo RFQ en `En_Ind` con datos técnicos heredados del cancelado.
- Crea un estado `CANCELLED` separado de `logical_delete`; el `logical_delete` se usa solo para borrado administrativo.
- El motivo queda visible ÚNICAMENTE para Super Usuarios en el historial.
- RFQ cancelado desaparece de los listados de usuarios base y proveedores.
- `reason` mínimo 10 caracteres.

---

### P0-B5 · BACKEND · Endpoint para que Compras extienda el deadline del RFQ de forma proactiva

**Historia de usuario:**
Como Compras (base o admin),
Quiero extender la fecha límite de un RFQ de forma proactiva sin esperar a que un proveedor lo solicite,
Para reactivar RFQs vencidos o dar más tiempo a todos los proveedores pendientes de una sola acción.

> **Distinción crítica respecto a lo que ya existe:**
> El backend ya tiene dos endpoints relacionados con extensiones de tiempo, pero cubren un flujo diferente:
>
> | Endpoint existente | Quién lo inicia | Qué hace |
> |---|---|---|
> | `POST /api_proveedores/v1/asginaciones/extension/solicitar/<id>/` | El **proveedor** | Solicita más tiempo para su asignación específica |
> | `PATCH /api_comercializacion/v1/extension/<id>/resolver/` | **Compras** | Aprueba o rechaza la solicitud del proveedor → actualiza solo el `due_date` de **esa asignación** |
>
> **P0-B5 es distinto:** Compras actúa de forma proactiva, sin solicitud previa del proveedor, extendiendo el deadline para todos los proveedores pendientes o para el RFQ completo. Se necesita cuando el RFQ ha vencido y Compras decide reabrirlo operativamente.

**Endpoint a crear:**
```http
POST /api_comercializacion/v1/rfq/<id>/extender/?tipo=mold|trimming
```

**Body:**
```json
{
  "nueva_fecha": "2026-07-30",
  "reason": "Ampliación por actualización de información técnica.",
  "proveedores": [1, 2, 3]
}
```
> `proveedores` es opcional: si se omite, se extiende para todas las asignaciones pendientes del RFQ.

**Criterios de aceptación:**
- La nueva fecha debe ser posterior al `due_date` actual del RFQ.
- Solo `Com` o `Com Admin` pueden ejecutarlo.
- Actualiza el `due_date` de las asignaciones pendientes afectadas.
- Registra evento en `historial/` con actor, nueva fecha y razón.
- Notifica por email a los proveedores afectados.

---

### P0-B6 · BACKEND · Campo `workflow_status` calculado en todos los listados

**Historia de usuario:**
Como desarrollador frontend,
Quiero que todos los endpoints de listado devuelvan un campo `workflow_status` calculado,
Para no tener que derivar el estado complejo en el cliente con múltiples condiciones.

**Descripción:**
El campo `status` del backend (`En_Ind`, `En_Com`, `En_Pro`, `complete`) es insuficiente para que el frontend muestre los 9 estados del diagrama de la arquitectura. La tabla de conversión definida en `rfq-lifecycle-missing-endpoints.md` debe implementarse en el serializer o en una propiedad del modelo.

**Criterios de aceptación:**
- `GET /api_industrializacion/v1/rfqs/` incluye `workflow_status` en cada item.
- `GET /api_comercializacion/v1/rfqs/` incluye `workflow_status` + banderas auxiliares.
- Los valores posibles son: `DRAFT`, `PENDING`, `PENDING_EDIT_REQUEST`, `QUOTING`, `PARTIALLY_QUOTED`, `BENCHMARK_READY`, `EXPIRED`, `CLOSED`, `CANCELLED`.
- La lógica de derivación sigue la tabla de `rfq-lifecycle-missing-endpoints.md §Tabla de interpretación`.

---

### P0-F1 · FRONTEND · AuthProvider real con resolución de rol y guards por ruta

**Historia de usuario:**
Como sistema,
Quiero un AuthProvider que persista identidad, rol y permisos y proteja cada ruta,
Para que ningún usuario pueda acceder a áreas que no le corresponden.

**Descripción:**
Hoy `AuthProvider.tsx` es un placeholder y `ProtectedRoute.tsx` no verifica roles reales. El `Router.tsx` no aplica guards de rol. El backend expone `GET /auth/me/` que devuelve `role` e `is_admin`; esto debe usarse para reconstruir el estado de sesión al cargar la app.

**Criterios de aceptación:**
- Al cargar la app se llama `GET /auth/me/`. Si responde `401` se redirige a `/login`.
- `AuthProvider` expone `{ user, role, isAdmin, isAuthenticated, logout }` en contexto.
- `<RequireAuth role="Ind">` redirige a `/401` si el rol no coincide.
- La sesión expirada (refresh falla) redirige a `/login?reason=expired`.
- El proveedor no puede acceder a rutas `/compras/*` ni `/industrializacion/*`.
- El usuario de Industrialización no puede acceder a rutas `/proveedor/*` ni `/compras/admin/*`.

**Archivos a modificar:** `src/features/auth/state/AuthProvider.tsx`, `src/features/auth/components/ProtectedRoute.tsx`, `src/app/Router.tsx`, nuevo hook `useAuth()`.

---

### P0-F2 · FRONTEND · Login con separación de acceso interno y proveedor

**Historia de usuario:**
Como usuario del sistema (interno o proveedor),
Quiero entrar por la vía correcta según mi tipo de cuenta,
Para ser redirigido a la experiencia y permisos adecuados.

**Descripción:**
Hoy `LoginForm.tsx` envía a todos al dashboard de Industrialización con un único formulario. Se necesita un selector con dos vías: "Acceso interno BOCAR" y "Portal de proveedores". El backend tiene un único endpoint `POST /auth/login/` que devuelve `role`; el frontend determina la redirección según `role`.

**Criterios de aceptación:**
- Selector visual entre "Acceso interno" y "Portal de proveedores".
- Login exitoso redirige según `role`: `Ind` → `/industrializacion/dashboard`, `Com` → `/compras/dashboard`, `Pro` → `/proveedor/dashboard`.
- Error `401` muestra mensaje inline sin perder el email tecleado.
- Llegada a `/login?reason=expired` muestra banner informativo antes del formulario.
- Estado de loading deshabilita el botón y muestra spinner.

**Archivos a modificar:** `src/features/auth/components/LoginForm.tsx` → refactor completo. Nuevo hook `useLogin` con `authService.login`. Nueva función `resolveDefaultRouteForRole(role)` en `src/app/config/permissions.ts`. Crear `src/pages/auth/SSOCallbackPage.tsx`.

---

### P0-F3 · FRONTEND · Sistema de estados visibles en RFQ Detail con CTAs por rol

**Historia de usuario:**
Como usuario interno o proveedor,
Quiero ver claramente en qué estado está la RFQ y qué acciones puedo ejecutar,
Para tomar decisiones correctas sin navegar el flujo manualmente.

**Descripción:**
`RfqDetailWorkspace` muestra contenido fijo y no respeta el ciclo de vida de 9 estados. Se necesita una state machine visible: badge de estado, banner contextual, CTAs habilitadas/deshabilitadas según estado y rol.

**Criterios de aceptación:**
- Badge de estado visible con los 9 valores: `DRAFT`, `PENDING`, `PENDING_EDIT_REQUEST`, `QUOTING`, `PARTIALLY_QUOTED`, `BENCHMARK_READY`, `EXPIRED`, `CLOSED`, `CANCELLED`.
- CTAs disponibles por estado y rol según la matriz de `ARCHITECTURE_PROPOSAL.md §3`.
- Cancelación solo visible para `is_admin = True`; no se renderiza para usuarios base.
- En `PENDING_EDIT_REQUEST`, "Asignar proveedores" aparece deshabilitado con tooltip explicativo para Compras.
- "Solicitar edición" solo visible para el creador original cuando RFQ está en `PENDING`.
- `CANCELLED` solo visible para Super Usuarios; usuarios base ven error de acceso.
- Estados terminales (`CLOSED`, `CANCELLED`) son solo lectura para todos.

**Archivos a crear:** `src/features/rfq/state/rfqStateMachine.ts`, hook `useRfqDetail(id)` que retorna `{ rfq, allowedActions }`. Refactor de `RfqDetailWorkspace.tsx`.

---

### P0-F4 · FRONTEND · Dashboard operativo de Compras

**Historia de usuario:**
Como usuario de Compras,
Quiero entrar a una home con KPIs, RFQs por asignar, vencimientos y desbloqueos,
Para empezar mi día sabiendo qué intervenciones son urgentes.

**Descripción:**
`/compras/dashboard` no existe; los usuarios de Compras llegarían a un fallback. La ruta está declarada en `routes.ts` como "Falta por programar". El backend provee `GET /api_comercializacion/v1/rfqs/` y `GET /api_comercializacion/v1/solicitudes/`.

**Criterios de aceptación:**
- KPIs navegables: RFQs por asignar, en cotización, benchmark listo, vencidas.
- Tabla central de RFQs accionables ordenada por urgencia.
- Widget de solicitudes de desbloqueo (solo visible para `compras_admin`).
- Widget vacío institucional cuando no hay items urgentes.
- Click en KPI navega a la lista filtrada por estado.

**Archivos a crear:** `src/pages/purchasing/DashboardPage.tsx`, servicio `purchasingService.ts` conectado a los endpoints reales.

---

### P0-F5 · FRONTEND · Lista de RFQs de Compras con filtros y acciones por fila

**Historia de usuario:**
Como usuario de Compras,
Quiero una cola filtrable de todas las RFQs activas con progreso por proveedor y acciones contextuales,
Para tomar la siguiente RFQ a procesar de forma eficiente.

**Descripción:**
`/compras/rfq` está declarado como "Falta por programar" en `routes.ts`. El backend disponible es `GET /api_comercializacion/v1/rfqs/`.

**Criterios de aceptación:**
- Filtros: estado, tipo (`mold`/`trimming`), búsqueda libre.
- Columna de progreso por proveedor solo para estados `QUOTING`, `PARTIALLY_QUOTED`, `BENCHMARK_READY`.
- Badge de urgencia para RFQs con menos de 48h hábiles.
- Acciones por fila: `Asignar`, `Ver detalle`, `Ver benchmark`, `Extender` — contextuales según estado.
- Filtros persistentes en URL (query params).

**Archivos a crear:** `src/pages/purchasing/RfqListPage.tsx`, `src/features/rfq/components/RfqList/PurchasingRfqTable.tsx`.

---

### P0-F6 · FRONTEND · Detalle de RFQ específico para Compras

**Historia de usuario:**
Como usuario de Compras,
Quiero un detalle orientado a la decisión de asignación, cotización y cierre,
Para saber qué acción comercial sigue sin leer una ficha técnica.

**Descripción:**
`RfqDetailWorkspace` es genérica y no diferencia el shell ni los CTAs de Compras. Los endpoints disponibles: `GET /api_mold/v1/rfq-molds/<id>/`, `GET /api_comercializacion/v1/solicitudes/`.

**Criterios de aceptación:**
- Header con CTAs comerciales según estado: `Asignar`, `Aprobar edición`, `Rechazar edición`, `Cerrar`, `Extender`.
- En `PENDING_EDIT_REQUEST`: banner amarillo con el motivo del creador y CTAs de resolución.
- En `EXPIRED`: banner + CTAs `Cerrar` o `Extender`.
- En `BENCHMARK_READY`: link directo al benchmark y CTA `Cerrar`.
- Columna secundaria colapsable con resumen técnico de la RFQ.
- Estados terminales todo solo lectura.

**Archivos a crear:** `src/features/rfq/components/RfqDetail/PurchasingRfqDetail.tsx`, `EditRequestResolutionBanner.tsx`.

---

### P0-F7 · FRONTEND · Dashboard del proveedor como inbox de tareas

**Historia de usuario:**
Como proveedor,
Quiero ver mis RFQs asignadas ordenadas por urgencia, mis cotizaciones y mis solicitudes de desbloqueo,
Para saber qué cotizar primero sin navegar el sistema.

**Descripción:**
`/proveedor/dashboard` existe como placeholder pero no tiene contenido funcional. El backend disponible: `GET /api_proveedores/v1/asginaciones/mis-asignaciones/`.

**Criterios de aceptación:**
- Lista de RFQs asignadas pendientes, ordenadas por menor tiempo restante (campo `deadline` dinámico del backend).
- Cotizaciones recientes con estado (`draft`, `submitted`).
- Estado vacío cuando no hay RFQs asignadas, con mensaje explicativo.
- Click en CTA "Cotizar" navega al formulario correcto según tipo.
- No mostrar métricas internas de BOCAR.

**Archivos a modificar:** `src/pages/proveedor/DashboardPage.tsx` (actualmente placeholder), servicio `supplierService.ts`.

---

### P0-F8 · FRONTEND · Lista de RFQs asignadas al proveedor

**Historia de usuario:**
Como proveedor,
Quiero una cola clara con tiempo restante y estado de mi cotización,
Para procesar mis pendientes sin distracciones.

**Descripción:**
`/proveedor/rfq` está declarado como "Falta por programar" en `routes.ts`. El backend disponible: `GET /api_proveedores/v1/asginaciones/mis-asignaciones/`.

**Criterios de aceptación:**
- Tabla con: nombre RFQ, tipo, deadline (dinámico), estado de cotización, CTA contextual.
- Filtro por estado: pendiente / contestada.
- CTA "Cotizar" deshabilitado si la cotización ya está en `submitted`.
- Indicador visual de urgencia si el deadline está próximo.
- No mostrar RFQs ajenas.

**Archivos a crear:** `src/pages/proveedor/RfqListPage.tsx`.

---

### P0-F9 · FRONTEND · Detalle de RFQ del proveedor con countdown y descarga de documentos

**Historia de usuario:**
Como proveedor,
Quiero ver el resumen técnico de la RFQ, descargar archivos y ver el tiempo restante,
Para decidir si cotizo y empezar con contexto completo.

**Descripción:**
El backend disponible: `GET /api_proveedores/v1/asginaciones/detalle/<id>/?tipo=mold|trimming`. La ruta existe como declarada pero la pantalla no diferencia el rol del proveedor.

**Criterios de aceptación:**
- Countdown dominante con días/horas restantes (campo `deadline` del backend).
- Documentos descargables: PPT y STP del RFQ.
- CTA primario "Cotizar ahora" — deshabilitado si deadline vencido o cotización ya enviada.
- Si cotización ya enviada: estado "Bloqueada" + CTA "Solicitar desbloqueo".
- Nunca mostrar lista de otros proveedores asignados.
- Nunca mostrar benchmark ni comentarios internos.

**Archivos a crear:** `src/features/rfq/components/RfqDetail/SupplierRfqDetail.tsx`.

---

### P0-F10 · FRONTEND · Formulario de cotización del proveedor con upload de PDF

**Historia de usuario:**
Como proveedor,
Quiero capturar precios, dimensiones, tiempos y adjuntar PDF oficial,
Para enviar mi cotización dentro del plazo de 10 días hábiles.

**Descripción:**
No existe pantalla de cotización para el proveedor. `/proveedor/rfq/:rfqId/cotizar` está declarado en `routes.ts` como "Falta por programar". Los endpoints backend de cotización (ver P0-B1) deben estar implementados primero.

**Criterios de aceptación:**
- Formulario con secciones: precios, dimensiones del molde/trimming, tiempos de entrega, PDF oficial.
- PDF obligatorio — bloquea el envío si no está adjunto; máximo 15 MB.
- Precio negativo → error inline inmediato.
- `deliveryWeeks` entero entre 1 y 52.
- Botón "Guardar borrador" (llama a `POST` responder) y botón "Enviar cotización".
- Al enviar: modal de confirmación con advertencia de irreversibilidad. Al confirmar, redirige al detalle.
- Estado de loading y manejo de errores de red.

**Archivos a crear:** `src/pages/proveedor/QuotationFormPage.tsx`, `src/features/quotation/` con `schemas.ts`, `types.ts`, `services/quotationService.ts`.

---

### P0-F11 · FRONTEND · Modal de cancelación con protocolo diferenciado y motivo obligatorio

**Historia de usuario:**
Como Super Usuario (Ind Admin o Com Admin),
Quiero cancelar una RFQ con motivo obligatorio y una confirmación proporcional al impacto,
Para garantizar trazabilidad y que el equipo comprenda las consecuencias.

**Descripción:**
No existe modal de cancelación. El endpoint de cancelación backend (P0-B4) debe implementarse primero.

**Criterios de aceptación:**
- Solo visible y accionable para `is_admin = True`. Usuarios base no ven la opción.
- **Cancelación temprana** (`DRAFT`, `PENDING`, `PENDING_EDIT_REQUEST`): confirmación simple, fondo rojo suave.
- **Cancelación tardía** (`QUOTING`, `PARTIALLY_QUOTED`, `BENCHMARK_READY`, `EXPIRED`): confirmación reforzada con checklist de consecuencias ("Se notificará a todos los proveedores", "Se creará una RFQ de reemplazo en borrador"), fondo rojo intenso.
- `reason` obligatorio con mínimo 10 caracteres. Botón bloqueado si vacío.
- Toast de éxito al confirmar.
- RFQ desaparece de la lista del usuario base tras cancelación.

**Archivos a crear:** `src/features/rfq/components/RfqModals/CancelRfqModal.tsx`, hook `useCancelRfq(id)`.

---

### P0-F12 · FRONTEND · Flujo de solicitud de edición (PENDING → PENDING_EDIT_REQUEST)

**Historia de usuario:**
Como creador de una RFQ en estado PENDING,
Quiero solicitar que Compras me permita editar la RFQ antes de que asignen proveedores,
Para corregir errores sin cancelar y crear una desde cero.

**Descripción:**
CTA e inline form accesible únicamente para el creador original desde el detalle cuando la RFQ está en `PENDING`. El endpoint disponible: `POST /api_industrializacion/v1/edit-requests/?tipo=mold|trimming`.

**Criterios de aceptación:**
- CTA "Solicitar edición" solo visible para el creador original (`created_by === currentUser.id`) con RFQ en `PENDING`.
- Captura motivo (≥ 10 caracteres). Botón bloqueado si vacío.
- Al enviar: RFQ pasa a `PENDING_EDIT_REQUEST`, banner "Solicitud enviada — pendiente de respuesta de Compras".
- Si ya existe solicitud activa: no se puede enviar otra; muestra estado "Solicitud en proceso".
- Otro usuario de Industrialización (no creador) no ve el CTA.
- Si Compras aprueba: RFQ vuelve a `DRAFT` y el creador ve banner informativo.

**Archivos a crear:** Hook `useRequestEditRfq(rfqId)`, inline form en `IndustrializationRfqDetail.tsx`.

---

## P1 — Importante (cierran ciclos completos)

---

### P1-B1 · BACKEND · Gaps en el endpoint de rechazo de solicitud de edición

**Historia de usuario:**
Como usuario de Compras,
Quiero rechazar una solicitud de edición capturando el motivo del rechazo,
Para que el creador de Industrialización entienda por qué su solicitud fue denegada.

**Descripción:**
> **Corrección post-revisión de código:** El endpoint `PATCH /api_comercializacion/v1/edit-requests/<id>/rechazar/` **SÍ EXISTE** en `Comercializacion/views.py` (`EditRequestRechazarView`). El documento original estaba equivocado al decir que no existía. Sin embargo, la implementación actual tiene **tres gaps reales** que deben corregirse:

**Gap 1 — No acepta ni guarda motivo de rechazo en el body.**
El modelo `RFQ_Mold_EditRequest` tiene el campo `reason` (TextField) pero la vista no lo lee del request ni lo persiste. El rechazo queda sin justificación registrada.

**Gap 2 — No notifica al creador de Industrialización.**
La vista de aprobación (`EditRequestAprobarView`) sí llama a `notif_tasks.notificar_modificacion_rfq`, pero la de rechazo (`EditRequestRechazarView`) no tiene ninguna llamada de notificación. El creador nunca se entera de que su solicitud fue rechazada salvo que revise manualmente.

**Gap 3 — Permiso más restrictivo que lo documentado.**
`EditRequestRechazarView` y `EditRequestAprobarView` usan `IsComercializacionAdmin`, pero `flujo_completo.md §8` documenta que cualquier `Com` (base o admin) puede gestionar solicitudes de edición. El código es más restrictivo que la documentación: un usuario `Com` base no puede ni aprobar ni rechazar.

**Lo que hay que hacer en `Comercializacion/views.py`:**
1. En `EditRequestRechazarView.patch()`: leer `reason` del body, validar mínimo 10 caracteres, y asignarlo a `edit_request.reason` antes de `save()`.
2. Añadir la llamada a notificación hacia Industrialización tras el rechazo (igual que hace la vista de aprobación).
3. Decidir si el permiso debe ser `IsComercializacionUser` (cualquier Com) o mantener `IsComercializacionAdmin`. Alinearlo con lo que dicte el negocio y actualizar `flujo_completo.md` para que refleje la decisión real.

**Endpoint existente (sin cambiar la URL):**
```http
PATCH /api_comercializacion/v1/edit-requests/<id>/rechazar/?tipo=mold|trimming
```

**Body que falta implementar:**
```json
{ "reason": "La información actual es suficiente para continuar." }
```

**Criterios de aceptación una vez corregido:**
- `reason` obligatorio (≥ 10 caracteres). Retorna `400` si falta o es demasiado corto.
- `reviewed_by` y `reviewed_at` se llenan automáticamente (ya lo hace la vista actual).
- El campo `reason` del modelo queda persistido con el motivo del rechazo.
- Notificación enviada al creador de Industrialización con el motivo.
- El RFQ permanece en `En_Com` sin cambios (ya funciona así).

---

### P1-B2 · BACKEND · Endpoint para reabrir cotización bloqueada (desbloqueo)

**Historia de usuario:**
Como Compras Admin,
Quiero reabrir una cotización ya enviada por un proveedor,
Para que el proveedor pueda corregir errores antes del cierre de la RFQ.

**Endpoint a crear:**
```http
POST /api_comercializacion/v1/cotizaciones/<id>/reabrir/?tipo=mold|trimming
```

**Body:**
```json
{ "reason": "Se solicita corregir el tiempo de entrega." }
```

**Criterios de aceptación:**
- Solo `Com Admin` puede ejecutarlo.
- Cambia cotización de `submitted` a `draft`.
- Cambia asignación a `pending_revision`.
- Notifica al proveedor que su cotización fue reabierta y puede editarla.
- Motivo queda registrado en `historial/`.

---

### P1-F1 · FRONTEND · Panel de resolución de solicitudes de edición para Compras

**Historia de usuario:**
Como usuario de Compras (base o admin),
Quiero revisar y resolver las solicitudes de edición de los creadores de Industrialización,
Para desbloquear la asignación de proveedores o devolver la RFQ a borrador.

**Descripción:**
Complementa P0-F12. La perspectiva de Compras al recibir una solicitud de edición. Los endpoints disponibles: `PATCH /api_comercializacion/v1/edit-requests/<id>/aprobar/` y `PATCH /api_comercializacion/v1/edit-requests/<id>/rechazar/` (este último requiere P1-B1).

**Criterios de aceptación:**
- Banner prominente en el detalle de la RFQ cuando `workflow_status === 'PENDING_EDIT_REQUEST'`.
- Muestra el motivo del creador y la fecha de solicitud.
- CTAs inline: "Aprobar solicitud" (verde) y "Rechazar solicitud" (rojo suave).
- Rechazar: modal con campo de motivo obligatorio (≥ 10 caracteres).
- Aprobar: RFQ pasa a `DRAFT`, mensaje "RFQ devuelta a borrador".
- Rechazar: RFQ regresa a `PENDING`, creador notificado con motivo.
- "Asignar proveedores" deshabilitado mientras la solicitud está activa.

**Archivos a crear:** `src/features/rfq/components/RfqDetail/EditRequestResolutionBanner.tsx`, hook `useResolveEditRequest(rfqId)`.

---

### P1-F2 · FRONTEND · Pantalla de Benchmark con tabla comparativa y exportación

**Historia de usuario:**
Como usuario interno (Compras o Industrialización),
Quiero comparar todas las cotizaciones recibidas con KPIs claros,
Para decidir si cierro la RFQ o reenvío a más proveedores.

**Descripción:**
Existe una entrada en `BenchmarkPage.tsx` pero sin contenido funcional. El backend necesita el endpoint de progreso (P0-B2) para alimentar esta pantalla.

**Criterios de aceptación:**
- Tabla ancha con columnas congeladas (proveedor, precio, plazos, condiciones).
- Scorecards superiores por proveedor con ranking.
- Indicadores de outliers (valores extremos resaltados).
- CTA "Exportar Excel" descarga las columnas mostradas.
- Modo parcial para `PARTIALLY_QUOTED` con aviso de benchmark incompleto.
- Reenviar requiere `compras_admin`.
- Proveedores nunca pueden acceder a esta ruta.

**Archivos a crear:** `src/features/rfq/components/Benchmark/BenchmarkTable.tsx`, `SupplierScorecard.tsx`. Completar `src/pages/purchasing/BenchmarkPage.tsx`.

---

### P1-F3 · FRONTEND · Timeline y panel de auditoría en RFQ Detail

**Historia de usuario:**
Como usuario interno,
Quiero ver la línea de tiempo de la RFQ con motivos, autores y timestamps,
Para entender qué pasó y quién decidió cada paso.

**Descripción:**
El backend ya tiene `GET /api_historial/v1/<tipo>/<rfq_id>/` con todos los eventos. Solo falta la UI.

**Criterios de aceptación:**
- Timeline vertical con eventos en orden cronológico.
- Cada evento muestra: tipo, actor, timestamp, detalle (motivo si aplica, diff de campos si es edición).
- Admin ve panel de auditoría completo con diff de campos.
- Proveedor ve solo eventos relacionados con su cotización (versión simplificada).
- Colapsable para no dominar el viewport.

**Archivos a crear:** `src/features/rfq/components/RfqDetail/RfqTimeline.tsx`, `AuditPanel.tsx`, hook `useRfqHistory(rfqId, tipo)`.

---

### P1-F4 · FRONTEND · Centro de notificaciones global con drawer y deep links

**Historia de usuario:**
Como usuario autenticado de cualquier rol,
Quiero un inbox accionable con eventos críticos del sistema,
Para resolver pendientes sin depender del correo electrónico.

**Descripción:**
El sistema de emails de Celery funciona pero el frontend no tiene un centro de notificaciones in-app. Es crítico para que los usuarios de Compras sepan cuándo llegan solicitudes de edición y los proveedores sepan de nuevas asignaciones.

> **Nota backend:** Se necesita un endpoint de notificaciones in-app si se desea persistir el estado de "leída/no leída". Alternativa: usar solo los eventos del historial como feed de notificaciones.

**Criterios de aceptación:**
- Campana en el header con badge de count de no leídas.
- Drawer lateral derecho al hacer click.
- Notificaciones agrupadas por criticidad y fecha.
- Deep link a la pantalla resolutoria exacta (RFQ detail, benchmark, unlock request).
- Marcar leída/no leída sin cerrar el drawer.
- Proveedor solo ve notificaciones de sus propias RFQs/cotizaciones.

**Archivos a crear:** `src/features/notifications/NotificationDrawer.tsx`, `NotificationItem.tsx`, hook `useNotifications()`. Actualizar `Header.tsx`.

---

### P1-F5 · FRONTEND · Flujo completo de solicitud y aprobación de desbloqueo de cotización

**Historia de usuario:**
Como proveedor o Compras operativo,
Quiero solicitar el desbloqueo de una cotización ya enviada y que Compras Admin lo resuelva,
Para corregir errores antes del cierre de la RFQ.

**Descripción:**
La ruta `/compras/admin/desbloqueos` existe como declarada. Falta el flujo completo: modal de solicitud desde el proveedor, pantalla de gestión para admin y los endpoints backend (P1-B2).

**Criterios de aceptación:**
- Proveedor ve CTA "Solicitar desbloqueo" en detalle de cotización cuando `is_answered === true`.
- Modal `UnlockRequestModal` captura motivo obligatorio y envía solicitud.
- `UnlockRequestsPage` para admin: lista master-detail con solicitudes, resumen de cotización y CTAs aprobar/rechazar.
- Al aprobar: cotización vuelve a editable, proveedor notificado.
- Solo `compras_admin` puede resolver.

**Archivos a crear:** `src/features/rfq/components/RfqModals/UnlockRequestModal.tsx`, completar `src/pages/purchasing/UnlockRequestsPage.tsx`, hook `useUnlockRequests()`.

---

### P1-F6 · FRONTEND · Historial y detalle de cotizaciones del proveedor

**Historia de usuario:**
Como proveedor,
Quiero consultar todas mis cotizaciones enviadas con su estado de bloqueo,
Para hacer seguimiento sin perder contexto.

**Descripción:**
`/proveedor/cotizaciones` está declarado como "Falta por programar" en `routes.ts`. El backend necesita P0-B1 primero.

**Criterios de aceptación:**
- Lista: RFQ asociada, fecha envío, estado (`draft`, `submitted`, `unlocked`), deadline.
- Filtro por estado.
- Detalle: resumen de cotización, PDF adjunto, timeline de su cotización, CTA solicitar desbloqueo si aplica.
- Sin acceso a benchmark ni a cotizaciones de otros proveedores.

**Archivos a crear:** `src/pages/proveedor/QuotationListPage.tsx`, `src/pages/proveedor/QuotationDetailPage.tsx`.

---

### P1-F7 · FRONTEND · Admin Dashboard de Compras (command center)

**Historia de usuario:**
Como Compras Admin,
Quiero un command center con solicitudes de edición pendientes, desbloqueos, vencimientos y RFQs listas para cerrar,
Para no perder ninguna decisión crítica del día.

**Descripción:**
`/compras/admin` está declarado como "Falta por programar" en `routes.ts`. Solo accesible para `compras_admin`.

**Criterios de aceptación:**
- Panel "Solicitudes de edición pendientes" (`PENDING_EDIT_REQUEST`) con: RFQ, creador, motivo resumido, CTA "Resolver".
- Panel "Desbloqueos pendientes" con CTA directo a `/compras/admin/desbloqueos`.
- Panel "Benchmark listo" con RFQs en `BENCHMARK_READY` esperando cierre.
- Panel "Vencidas" con RFQs en `EXPIRED`.
- Cada panel muestra estado vacío institucional cuando no hay items.
- Badge de urgencia en solicitudes de edición con más de 24h sin resolverse.
- Redirige a `/401` si el usuario no es `compras_admin`.

**Archivos a crear:** Completar `src/pages/purchasing/AdminDashboardPage.tsx`.

---

### P1-F8 · FRONTEND · Admin Dashboard de Industrialización con visibilidad total

**Historia de usuario:**
Como Super Usuario de Industrialización,
Quiero ver todas las RFQs del departamento (no solo las mías) y poder cancelar cualquiera,
Para monitorear el pipeline y actuar cuando una RFQ deba detenerse.

**Descripción:**
`/industrializacion/admin` está declarado como "Falta por programar". La diferencia clave vs el dashboard base: el admin ve RFQs de todos los usuarios.

**Criterios de aceptación:**
- Tabla con todas las RFQs del departamento, columna "Creador" visible.
- Filtros: por estado, por creador, por prioridad.
- Panel lateral de alertas: RFQs en `EXPIRED` o estados tardíos sin actividad.
- CTA "Ver detalle" → navega al detalle donde está la acción "Cancelar".
- No existe bandeja de aprobaciones (el admin de Ind no aprueba nada, solo cancela).
- Admin puede consultar RFQs en estado `CANCELLED`; usuarios base no.

**Archivos a crear:** Completar `src/pages/industrializacion/SuperUserDashboardPage.tsx`.

---

### P1-F9 · FRONTEND · Sidebar persistente con navegación contextual por rol

**Historia de usuario:**
Como usuario autenticado,
Quiero una navegación lateral que solo muestre lo que mi rol puede usar,
Para moverme rápido sin ruido.

**Descripción:**
`Sidebar.tsx` existe pero no se renderiza en ninguna página. `MainLayout.tsx` no lo incluye. Los items del sidebar deben variar por rol.

**Criterios de aceptación:**
- **Industrialización base:** Dashboard, RFQs, Predicción, Analytics.
- **Industrialización Admin:** lo anterior + Admin, Solicitudes.
- **Compras base:** Dashboard, RFQs, Benchmark, Catálogo de proveedores.
- **Compras Admin:** lo anterior + Admin, Gestión de proveedores, Desbloqueos.
- **Proveedor:** Dashboard, RFQs asignadas, Cotizaciones.
- Links sin permiso no se renderizan (no deshabilitados, eliminados).
- Active state coincide con la ruta actual.

**Archivos a modificar:** `src/layouts/MainLayout.tsx`, `src/app/Sidebar.tsx` (o equivalente).

---

### P1-F10 · FRONTEND · Modales de extensión y cierre de RFQ

**Historia de usuario:**
Como Compras Admin,
Quiero decidir entre cerrar o extender una RFQ vencida,
Para no perder cotizaciones ya recibidas y reaccionar al plazo.

**Descripción:**
Requiere P0-B3 (cerrar) y P0-B5 (extender) en el backend.

**Criterios de aceptación:**
- `CloseRfqModal`: confirmación con motivo opcional, selección de proveedor ganador si aplica. Solo en `BENCHMARK_READY` o `EXPIRED`.
- `ExtendOrResendModal`: nueva fecha de deadline, selección de proveedores a notificar. Solo en `EXPIRED`.
- Extensión preserva cotizaciones previas y reinicia el plazo.
- Cierre es estado final `CLOSED`.

**Archivos a crear:** `src/features/rfq/components/RfqModals/CloseRfqModal.tsx`, `ExtendOrResendModal.tsx`.

---

### P1-F11 · FRONTEND · Lista dedicada de RFQs de Industrialización separada del dashboard

**Historia de usuario:**
Como usuario de Industrialización,
Quiero una pantalla dedicada de lista con todos los filtros,
Para usar el dashboard como resumen y la lista como cola operativa.

**Descripción:**
`/industrializacion/rfq` está declarado como "Falta por programar". Hoy la lista está fusionada con el dashboard.

**Criterios de aceptación:**
- Segmentación "Mis borradores" vs "RFQs institucionales" (enviadas a Compras y más allá).
- Filtros completos: estado, tipo, fecha, búsqueda.
- Acciones contextuales por fila.
- Borradores ajenos no son visibles para usuarios base.

**Archivos a crear:** `src/pages/industrializacion/RfqListPage.tsx`.

---

### P1-F12 · FRONTEND · Modo edición del formulario RFQ con precarga y contexto diferenciado

**Historia de usuario:**
Como creador de una RFQ en DRAFT,
Quiero corregir mi borrador con la misma sensación de captura pero con contexto de "editando",
Para entender que estoy modificando una RFQ existente, no creando desde cero.

**Descripción:**
Hoy `RfqFormPage` se renderiza igual para `crear` y `:id/editar`. Falta precargar datos y mostrar contexto diferenciado.

**Criterios de aceptación:**
- Header: "Editando RFQ-XXXX" en lugar de "Crear RFQ".
- Campos precargados desde `GET /api_mold/v1/rfq-molds/<id>/`.
- Si la RFQ proviene de una solicitud de edición aprobada: banner azul "Compras aprobó tu solicitud. Edita y vuelve a enviar".
- Si la RFQ no está en `DRAFT`: redirige al detalle con mensaje explicativo.
- Solo editable por el creador original.

**Archivos a modificar:** `src/pages/industrializacion/RfqFormPage.tsx`, hook `useRfq(id)` con precarga.

---

### P1-F13 · FRONTEND · Modo edición del formulario RFQ con precarga y contexto diferenciado

**Historia de usuario:**
Como usuario de Industrialización en el formulario de creación/edición de RFQ,
Quiero ver un resumen agrupado de todos los errores de validación con navegación directa al campo problemático,
Para corregir el formulario rápido sin recorrerlo manualmente.

**Descripción:**
El formulario RFQ tiene 10+ secciones técnicas y 6 de costos. Sin un resumen de errores, el usuario no sabe dónde falló después de intentar enviar.

**Criterios de aceptación:**
- `ValidationSummary` aparece al primer intento de envío inválido.
- Lista errores agrupados por sección.
- Click en cada error hace scroll + focus en el campo correspondiente.
- Se oculta cuando todos los errores están resueltos.

**Archivos a crear:** `src/shared/components/ui/ValidationSummary.tsx`.

---

## P2 — Complementarias (analítica, gestión y admin)

---

### P2-F1 · FRONTEND · Catálogo de proveedores para Compras

**Historia de usuario:**
Como Compras,
Quiero explorar el catálogo de proveedores con capacidades y región,
Para decidir a quién invitar a una RFQ.

**Descripción:**
`/compras/proveedores` declarado como "Falta por programar". Backend disponible: `GET /api_proveedores/v1/proveedores/`.

**Criterios de aceptación:**
- Grid o tabla híbrida con filtros: región, especialidad.
- Panel ligero de detalle al seleccionar un proveedor.
- CTA "Seleccionar" disponible cuando se usa desde el flujo de asignación.

**Archivos a crear:** `src/pages/purchasing/SupplierCatalogPage.tsx`.

---

### P2-F2 · FRONTEND · Gestión de proveedores para Compras Admin

**Historia de usuario:**
Como Compras Admin,
Quiero gestionar el catálogo maestro (alta/baja/edición) de proveedores,
Para mantener actualizado el ecosistema.

**Descripción:**
`/compras/admin/proveedores` declarado como "Falta por programar". Requiere endpoints CRUD de proveedores en el backend (no existen actualmente).

**Criterios de aceptación:**
- CRUD completo con formulario en side panel.
- Acciones bulk (desactivar múltiples).
- Auditoría obligatoria en baja o edición.
- Solo accesible para `compras_admin`.

**Archivos a crear:** `src/pages/purchasing/AdminSupplierManagementPage.tsx`.

> **Dependencia backend:** Se necesitan endpoints `POST`, `PATCH`, `DELETE (lógico)` para `/api_proveedores/v1/proveedores/`.

---

### P2-F3 · FRONTEND · Página de predicción de costos por IA

**Historia de usuario:**
Como Industrialización,
Quiero ingresar parámetros técnicos y obtener una estimación de costo con nivel de confianza,
Para apoyarme antes de generar la RFQ.

**Descripción:**
`/industrializacion/prediccion` declarado como "Falta por programar". Requiere un endpoint de predicción en el backend (no existe actualmente).

**Criterios de aceptación:**
- Formulario de parámetros a la izquierda, resultado a la derecha.
- Indicador de confianza visible.
- Opción de cargar una RFQ existente como contexto.
- La predicción es apoyo, no decisión final — microcopy debe dejarlo claro.

**Archivos a crear:** `src/pages/industrializacion/PredictionPage.tsx`, `src/features/prediction/`.

---

### P2-F4 · FRONTEND · Analytics dedicado para Industrialización y Compras

**Historia de usuario:**
Como usuario interno,
Quiero pantallas analíticas con tendencias y KPIs históricos,
Para tomar decisiones estratégicas.

**Descripción:**
`/industrializacion/analytics` y `/compras/analytics` declarados como "Falta por programar". Reutiliza componentes de `features/analytics`.

**Criterios de aceptación:**
- Filtros temporales: semana, mes, trimestre, año.
- KPIs e histograma recalculados al filtrar.
- Exportación de datos.
- Cada rol ve solo sus métricas autorizadas.

**Archivos a crear:** `src/pages/industrializacion/AnalyticsPage.tsx`, `src/pages/purchasing/AnalyticsPage.tsx`.

---

### P2-F5 · FRONTEND · Páginas de error 401, 404 y 500

**Historia de usuario:**
Como usuario,
Quiero mensajes claros cuando una ruta no existe, no tengo permiso o hay un error de servidor,
Para volver al flujo correcto sin frustración.

**Descripción:**
Hoy existe `UnauthorizedPage.tsx` pero sin diseño institucional. Faltan `NotFoundPage.tsx` y `ServerErrorPage.tsx`. Las rutas `/401`, `/404`, `/500` están declaradas en `routes.ts` como "Falta por programar".

**Criterios de aceptación:**
- Cada página con código HTTP, mensaje específico y CTA "Volver al dashboard".
- `/500` adicional: CTA "Reintentar" y enlace a soporte.
- ErrorBoundary global que captura errores no manejados y muestra `/500`.
- Tokens BOCAR en todos los estados.

**Archivos a crear:** `src/pages/errors/NotFoundPage.tsx`, `src/pages/errors/ServerErrorPage.tsx`. Mejorar `UnauthorizedPage.tsx`. Crear `ErrorBoundary.tsx`.

---

### P2-F6 · FRONTEND · Requests Management para Industrialización Admin

**Historia de usuario:**
Como Industrialización Admin,
Quiero gestionar solicitudes de cambio técnico con contexto comparativo,
Para resolverlas con información completa.

**Descripción:**
`/industrializacion/admin/solicitudes` declarado como "Falta por programar".

**Criterios de aceptación:**
- Lista master-detail con solicitudes abiertas.
- Panel de diff entre datos originales y cambio solicitado.
- CTAs: aprobar, rechazar, devolver con comentario.
- Auditoría completa.

**Archivos a crear:** `src/pages/industrializacion/AdminRequestsPage.tsx`.

---

### P2-B1 · BACKEND · Endpoints CRUD de proveedores para administración

**Historia de usuario:**
Como Compras Admin,
Quiero crear, editar y dar de baja proveedores en el catálogo del sistema,
Para mantener actualizado el ecosistema de proveedores disponibles.

**Descripción:**
Actualmente solo existe `GET /api_proveedores/v1/proveedores/` para listar. No hay endpoints de creación, edición ni baja lógica de proveedores.

**Endpoints a crear:**
```http
POST  /api_proveedores/v1/proveedores/          # Crear proveedor
PATCH /api_proveedores/v1/proveedores/<id>/     # Editar proveedor
PATCH /api_proveedores/v1/proveedores/<id>/delete/ # Baja lógica
```

**Criterios de aceptación:**
- Solo `Com Admin` puede crear, editar y dar de baja.
- La baja es lógica (flag `is_active = False`), no eliminación física.
- Toda modificación queda registrada en `historial/`.

---

### P2-B2 · BACKEND · SECRET_KEY y configuración sensible en variables de entorno

**Historia de usuario:**
Como administrador del sistema,
Quiero que la SECRET_KEY y configuraciones sensibles estén en variables de entorno,
Para no exponer credenciales en el repositorio.

**Descripción:**
El CLAUDE.md del backend dice explícitamente: `SECRET_KEY: Currently hardcoded — must be moved to env var before production`. El reporte de seguridad también lo lista como hallazgo crítico.

**Criterios de aceptación:**
- `SECRET_KEY` leído de variable de entorno con `os.environ.get('DJANGO_SECRET_KEY')`.
- `DEBUG` leído de variable de entorno con default `False`.
- `ALLOWED_HOSTS` configurable por entorno.
- Documentado en `README.md` qué variables son requeridas.

**Archivos a modificar:** `backend-bocar-2026/Bocar/settings.py`.

---

## P3 — Soporte y refinamientos

---

### P3-B1 · BACKEND · Permisos de rol en endpoints de Industrialización

**Historia de usuario:**
Como sistema,
Quiero que todos los endpoints de Industrialización validen el rol del usuario además de la autenticación,
Para prevenir que usuarios de otros roles accedan a operaciones que no les corresponden.

**Descripción:**
El reporte de seguridad `CRIT-01` documenta que los endpoints de Industrialización solo tienen `IsAuthenticated`, sin validación de rol `Ind`. Un usuario de Compras o un proveedor podría crear o editar RFQs.

**Criterios de aceptación:**
- Todos los endpoints bajo `/api_industrializacion/` requieren `role = 'Ind'` o `is_admin = True`.
- Todos los endpoints bajo `/api_comercializacion/` requieren `role = 'Com'` o `is_admin = True`.
- Todos los endpoints bajo `/api_proveedores/v1/asginaciones/` requieren `role = 'Pro'`.
- Retornar `403` con mensaje descriptivo si el rol no coincide.

**Archivos a modificar:** `General/permissions.py` (agregar `IsIndustrializacionUser`, `IsIndustrializacionAdmin`), todas las vistas de `Industrializacion/views.py`.

---

### P3-F1 · FRONTEND · SSO Callback Page para cierre del flujo de autenticación interna

**Historia de usuario:**
Como usuario interno,
Quiero ver un estado de validación claro durante el callback SSO,
Para entender que el sistema está procesando mi acceso y no quedarse colgado.

**Descripción:**
`/auth/callback` declarado como "Falta por programar" en `routes.ts`.

**Criterios de aceptación:**
- Pantalla minimal con spinner y mensaje de progreso.
- Fallback de error con CTA "Reintentar" y "Volver al login".
- No debe permanecer colgado más de 30 segundos sin feedback.
- Redirige al dashboard del rol si el token es válido.

**Archivos a crear:** `src/pages/auth/SSOCallbackPage.tsx`.

---

### P3-F2 · FRONTEND · File Preview Overlay para inspeccionar documentos sin perder contexto

**Historia de usuario:**
Como usuario interno,
Quiero previsualizar PDFs y archivos técnicos sin abandonar el detalle de la RFQ,
Para revisar especificaciones rápidamente.

**Criterios de aceptación:**
- Overlay invocable desde panel de documentos.
- Soporta PDF con `react-pdf`.
- CTA "Descargar" disponible dentro del overlay.
- Proveedor solo puede previsualizar documentos permitidos.
- Cierre con tecla Escape.

**Archivos a crear:** `src/shared/components/ui/FilePreviewOverlay.tsx`.

---

### P3-F3 · FRONTEND · Estados transversales de feedback (Loading, Empty, Error, NoPermission)

**Historia de usuario:**
Como usuario,
Quiero estados consistentes de carga, vacío, error y sin permiso en cada pantalla,
Para entender qué está pasando sin ambigüedad.

**Criterios de aceptación:**
- `LoadingOverlay`, `EmptyState`, `ErrorState`, `NoPermissionState` en `shared/components/ui/`.
- Aplicados en todas las pantallas.
- `EmptyState` con CTA contextual por pantalla (no genérico).
- Todos usan tokens BOCAR.

**Archivos a crear:** Componentes en `src/shared/components/ui/`.

---

### P3-F4 · FRONTEND · FileDropzone reutilizable con validación antes de subir

**Historia de usuario:**
Como usuario que adjunta archivos,
Quiero ver el tamaño máximo y tipo permitido antes de elegir el archivo,
Para evitar errores al final del flujo.

**Criterios de aceptación:**
- Valida tipo y tamaño antes de iniciar el upload.
- Mensaje específico por tipo de error (tamaño excedido, tipo inválido).
- Barra de progreso durante el upload.
- Reutilizable en `RfqForm` (PPT, STP) y `QuotationForm` (PDF).
- PPT/STP: límites según backend. PDF: máximo 15 MB.

**Archivos a crear:** `src/shared/components/ui/FileDropzone.tsx`.

---

### P3-B2 · BACKEND · CSRF explícito para mutaciones con cookies

**Historia de usuario:**
Como sistema,
Quiero que todas las mutaciones con cookies incluyan validación CSRF explícita,
Para prevenir ataques cross-site request forgery.

**Descripción:**
El reporte de seguridad `MED-08` documenta que las mutaciones usan JWT en cookies pero no tienen CSRF token explícito configurado correctamente para el frontend SPA.

**Criterios de aceptación:**
- `CsrfExemptSessionAuthentication` reemplazado por protección CSRF correcta.
- Frontend incluye header `X-CSRFToken` en todas las mutaciones.
- Endpoint `GET /auth/csrf/` disponible para que el SPA obtenga el token al cargar.

---

## Mapa de dependencias entre items

```
[YA EXISTE] Cotización backend (Asignaciones/views.py)
                           ──► P0-F10 (formulario cotización frontend — consume los endpoints existentes)
                           ──► P1-F6  (historial cotizaciones proveedor)
                           ──► P1-B2  (reabrir cotización — aún falta)
                           ──► P1-F5  (desbloqueo cotización)

P0-B2 (progreso RFQ)      ──► P0-F6  (detalle Compras)
                           ──► P1-F2  (benchmark)

P0-B3 (cerrar RFQ)        ──► P1-F10 (modal cierre)
P0-B4 (cancelar RFQ)      ──► P0-F11 (modal cancelación)
P0-B5 (extender deadline) ──► P1-F10 (modal extensión)
P0-B6 (workflow_status)   ──► P0-F3  (estados visibles en detail)

P0-F1 (AuthProvider real) ──► TODAS las rutas protegidas
P0-F12 (solicitud edición Ind) ──► P1-F1 (resolución Compras)
                               ──► P1-B1 (gaps del endpoint de rechazo)

P1-F9 (sidebar por rol)   ──► Todas las shells autenticadas
P2-B1 (CRUD proveedores)  ──► P2-F2  (gestión proveedores admin)
```

---

## Checklist rápido — Estado actual

> **Revisado contra código real** de `urls.py` y `views.py` de cada app del backend.

### Backend
| Item | Estado |
|------|--------|
| Auth (login/logout/refresh/me) | ✅ Funcional |
| Crear RFQ (mold/trimming) | ✅ Funcional |
| Listar y ver detalle RFQ | ✅ Funcional |
| Enviar RFQ a Compras | ✅ Funcional |
| Solicitar edición (Ind → Com) | ✅ Funcional |
| Aprobar solicitud de edición | ✅ Funcional (solo `Com Admin`, ver gap P1-B1) |
| Rechazar solicitud de edición | ⚠️ Existe pero incompleto — falta `reason` en body y notificación al creador (ver P1-B1) |
| Asignar proveedores | ✅ Funcional |
| Listar asignaciones del proveedor | ✅ Funcional |
| Crear borrador de cotización | ✅ Funcional (`Asignaciones/views.py` · `AsignacionResponderView`) |
| Ver borrador de cotización | ✅ Funcional (`AsignacionBorradorDetalleView`) |
| Actualizar borrador de cotización | ✅ Funcional (`AsignacionBorradorActualizarView`) |
| Enviar cotización (draft → submitted) | ✅ Funcional (`AsignacionEnviarRespuestaView`) — sin soporte de PDF adjunto aún |
| **Progreso estructurado del RFQ** | ❌ Falta endpoint dedicado (ver P0-B2) |
| **Cerrar RFQ** | ❌ Falta endpoint (ver P0-B3) |
| **Cancelar RFQ con protocolo diferenciado** | ❌ Falta endpoint (ver P0-B4) |
| **Extender fecha límite del RFQ** | ❌ Falta endpoint (ver P0-B5) |
| **`workflow_status` calculado** | ❌ Falta en serializers (ver P0-B6) |
| Resolver extensión de tiempo (Compras) | ✅ Funcional en `Comercializacion/urls.py` · hay ruta legacy duplicada en `Asignaciones/urls.py` |
| Historial de auditoría | ✅ Funcional |
| Notificaciones (email/Celery) | ✅ Parcial — rechazar edición no notifica (ver P1-B1) |
| **Reabrir cotización (desbloqueo)** | ❌ Falta endpoint (ver P1-B2) |
| Listar proveedores | ✅ Funcional |
| **CRUD proveedores (admin)** | ❌ Falta implementar (ver P2-B1) |
| **SECRET_KEY en env vars** | ❌ Hardcodeada en `settings.py` (ver P2-B2) |
| **Permisos de rol en endpoints Ind** | ❌ Solo `IsAuthenticated`, sin validación de `role='Ind'` (ver P3-B1) |

### Frontend
| Item | Estado |
|------|--------|
| Login básico | ✅ Funcional (con limitaciones) |
| **Login con separación interno/proveedor** | ❌ Falta |
| Dashboard Industrialización | ✅ Con mock data |
| Formulario RFQ (crear) | ✅ Con mock data |
| **Modo edición RFQ con precarga** | ❌ Incompleto |
| **AuthProvider real + guards** | ❌ Solo placeholder |
| **Sistema de estados RFQ** | ❌ Falta state machine |
| **Dashboard Compras** | ❌ Falta |
| **Lista RFQs Compras** | ❌ Falta |
| **Detalle RFQ Compras** | ❌ Falta |
| **Dashboard Proveedor** | ❌ Solo placeholder |
| **Lista RFQs Proveedor** | ❌ Falta |
| **Detalle RFQ Proveedor con countdown** | ❌ Falta |
| **Formulario cotización proveedor** | ❌ Falta |
| **Modal cancelación** | ❌ Falta |
| **Solicitud de edición (Ind → Com)** | ❌ Falta |
| **Panel resolución edición (Compras)** | ❌ Falta |
| **Benchmark completo** | ❌ Solo entry point |
| **Timeline y auditoría** | ❌ Falta |
| **Centro de notificaciones** | ❌ Falta |
| **Desbloqueo cotización (flujo completo)** | ❌ Incompleto |
| **Historial cotizaciones proveedor** | ❌ Falta |
| **Admin Dashboard Compras** | ❌ Falta |
| **Admin Dashboard Industrialización** | ❌ Incompleto |
| **Sidebar por rol** | ❌ No renderizado |
| **Modales extensión y cierre** | ❌ Falta |
| **Lista RFQs Industrialización (dedicada)** | ❌ Falta |
| **Páginas de error 401/404/500** | ❌ Parcial |
| Integración real con backend | ❌ Todo es mock data |
