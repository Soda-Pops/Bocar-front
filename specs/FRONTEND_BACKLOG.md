# Frontend Backlog — Historias de Usuario Pendientes

## 1. Propósito

Este documento traduce los huecos detectados al comparar `specs/ARCHITECTURE_PROPOSAL.md`, `specs/SCREENS_AND_FLOWS.md` y `specs/VISUAL_BRIEFS.md` contra el código actual del frontend en historias de usuario priorizadas.

Las historias están ordenadas de la más crítica para cerrar el flujo de negocio mínimo viable a la menos crítica. La prioridad se decide en función de:

- Bloqueos directos a los flujos `F01` a `F15`.
- Roles que hoy no tienen experiencia ejecutable (Compras y Proveedor).
- Decisiones de negocio sensibles que la UI debe forzar (motivos obligatorios, puntos de no retorno, auditoría).
- Soporte transversal (notificaciones, errores, navegación por rol).

## 2. Estado actual del frontend (contexto)

Ya existe en código:

- `LoginPage` con formulario único email/contraseña que redirige directo al dashboard de Industrialización.
- `DashboardPage` de Industrialización con KPIs, gráfica mensual, tabs, búsqueda, filtros y tabla de RFQs (mock data).
- `RfqFormPage` reutilizada para `crear` y `:id/editar` con un workspace multipágina (10 secciones técnicas + 6 de costos) usando React Hook Form + Zod.
- `RfqDetailWorkspace` compartida por `industrializacion`, `compras`, `proveedor` y `cotizaciones` con dos modos (`readonly`, `assign`) que renderizan resumen, archivos, proveedores y benchmark con datos hardcodeados.
- `Sidebar` y `MainLayout` con soporte de sidebar, pero ninguna pantalla lo está renderizando hoy.
- `routes.ts` ya enumera todas las rutas necesarias y marca explícitamente cuáles faltan por programar.

No existe en código (gap principal):

- Ninguna pantalla dedicada para Compras (dashboard, lista, detalle propio, benchmark, admin, catálogo, desbloqueos).
- Ninguna pantalla dedicada para Proveedor (dashboard, lista asignada, detalle restringido, formulario de cotización, historial, detalle de cotización).
- Sistema de estados de RFQ (`DRAFT`, `PENDING_INTERNAL_APPROVAL`, `PENDING`, `PENDING_PURCHASING_APPROVAL`, `QUOTING`, `PARTIALLY_QUOTED`, `BENCHMARK_READY`, `EXPIRED`, `CLOSED`, `CANCELLED`) y CTAs contextuales por estado/rol.
- Modales críticos (`CancelRfqModal`, `RejectWithReasonModal`, `EditAndApproveWorkspace`, `UnlockRequestModal`, `ExtendOrResendModal`, `CloseRfqModal`, `FilePreviewOverlay`).
- Centro de notificaciones global.
- Páginas de error (`/401`, `/404`, `/500`) y `SSOCallbackPage`.
- Provider real de auth con resolución de rol/permiso y guards por ruta.
- Predicción IA, Analytics, Requests Management, Supplier Catalog Explorer, Supplier Management.

---

# Backlog priorizado

## Prioridad P0 — Críticas (bloquean el flujo de negocio mínimo)

---

### 🏷️ Título
Login con separación de acceso interno SSO y acceso de proveedor JWT

### 👤 Historia de Usuario
Como usuario del sistema (interno o proveedor),
Quiero entrar al producto por la vía correcta según mi tipo de cuenta,
Para que el frontend me redirija a la experiencia y permisos adecuados sin confusión.

### 🎯 Descripción
Hoy `LoginForm` envía a todos al dashboard de Industrialización con un único formulario email/contraseña. La arquitectura exige dos vías de autenticación (`F01`, brief 4.1):

- Acceso interno BOCAR validado contra Active Directory mediante backend, con redirección a la home del rol.
- Acceso proveedor por JWT/sesión propia.

Incluye también el manejo de sesión expirada, error de credenciales y mensaje de mantenimiento.

No incluye SSO con Kerberos/Entra ni callback (ver historia separada).

### ✅ Criterios de Aceptación
**Escenario 1: Acceso interno exitoso**
Dado que el usuario elige "Acceso interno" e ingresa credenciales válidas
Cuando envía el formulario
Entonces se llama al endpoint del backend, se resuelve el rol y se redirige a la home correspondiente (`/industrializacion/dashboard`, `/compras/dashboard` o vista admin).

**Escenario 2: Acceso proveedor exitoso**
Dado que el usuario elige "Acceso proveedor" con email/contraseña válidos
Cuando envía el formulario
Entonces se obtiene un JWT, se persiste y se redirige a `/proveedor/dashboard`.

**Escenario 3: Credenciales inválidas**
Dado que el usuario envía credenciales incorrectas
Cuando el backend responde 401
Entonces se muestra un mensaje sobrio bajo el formulario sin perder el email tecleado.

**Escenario 4: Sesión expirada**
Dado que un usuario llega a `/login?reason=expired`
Cuando carga la pantalla
Entonces se muestra un banner que explica la expiración antes del formulario.

### ⚙️ Reglas de Negocio
- Los proveedores nunca deben poder iniciar sesión en la vía interna y viceversa.
- El estado de loading debe deshabilitar el botón principal y mostrar spinner.
- Después de tres fallos consecutivos se debe sugerir el flujo de recuperación.
- El selector debe quedar como split layout institucional (referencia brief 4.1).

### 🧪 Casos de Prueba
- Login interno válido → redirección por rol.
- Login proveedor válido → `/proveedor/dashboard`.
- Email mal formado → validación inline.
- Backend 500 → toast con CTA reintentar.
- Toggle entre "Acceso interno" y "Acceso proveedor" no pierde estado de loading o errores.

### 📦 Alcance Técnico / Notas para Dev
- Refactor de `src/features/auth/components/LoginForm.tsx` a un selector con dos formularios.
- Nuevo `useLogin` hook con dos servicios: `authService.loginInternal`, `authService.loginSupplier`.
- `AuthProvider` debe persistir token, rol y permisos en context y `localStorage`.
- Crear `resolveDefaultRouteForRole(role)` en `src/app/config/permissions.ts`.

### 🎨 Consideraciones UX/UI
- Layout split conforme `VISUAL_BRIEFS.md §4.1`.
- Microcopy diferenciado: "Acceso interno BOCAR" vs "Portal de proveedores".
- Mantener tokens BOCAR (Inter, `--bocar-blue-100`).

---

### 🏷️ Título
Sistema de estados visibles en RFQ Detail con CTAs contextuales por estado y rol

### 👤 Historia de Usuario
Como usuario interno o proveedor,
Quiero ver claramente en qué estado está la RFQ y qué acciones puedo ejecutar,
Para tomar decisiones correctas sin recorrer el flujo manualmente.

### 🎯 Descripción
La pantalla `RfqDetailWorkspace` actual muestra contenido fijo (Activo/Review) y no respeta el ciclo de vida descrito en `ARCHITECTURE_PROPOSAL.md §3`. Esta historia introduce un state machine visible: badge de estado, banner contextual, CTAs habilitadas/deshabilitadas según estado y rol, y mensajería sobre puntos de no retorno (`QUOTING`, `PARTIALLY_QUOTED`, `BENCHMARK_READY`, `EXPIRED`).

Incluye los 10 estados, las matrices del documento y deshabilitar acciones bloqueadas con tooltip explicativo.

No incluye los modales (se cubren en historias separadas) ni timeline (historia P1).

### ✅ Criterios de Aceptación
**Escenario 1: Badge y banner por estado**
Dado un detalle de RFQ en estado `QUOTING`
Cuando el usuario abre la pantalla
Entonces se muestra el badge "En Cotización" y un banner persistente "Punto de no retorno: la cancelación ya no está disponible".

**Escenario 2: CTAs según rol y estado**
Dado un Industrialización Admin viendo una RFQ en `PENDING_INTERNAL_APPROVAL`
Cuando carga el detalle
Entonces se muestran CTAs `Aprobar`, `Rechazar`, `Editar y aprobar`, `Cancelar` habilitados; cualquier otro rol ve solo lectura.

**Escenario 3: CTA bloqueada**
Dado una RFQ en `BENCHMARK_READY`
Cuando un Compras admin intenta cancelar
Entonces el botón "Cancelar" se ve deshabilitado con tooltip que explica la regla de negocio.

### ⚙️ Reglas de Negocio
- Los estados `QUOTING`, `PARTIALLY_QUOTED`, `BENCHMARK_READY`, `EXPIRED` son no-cancelables.
- `DRAFT` solo lo edita el creador original (regla 👤).
- `CLOSED` y `CANCELLED` siempre son solo lectura.
- El badge debe usar `--bocar-done`, `--bocar-review`, `--bocar-error` o `--bocar-neutral` según semántica.

### 🧪 Casos de Prueba
- Renderizar las 10 variantes de estado y validar CTAs.
- Cambio de rol cambia las acciones visibles.
- Tooltip de acción bloqueada visible al hover/focus.

### 📦 Alcance Técnico / Notas para Dev
- Crear `src/features/rfq/state/rfqStateMachine.ts` con `RfqStatus` enum y matriz `actionsByStateAndRole`.
- Refactor de `RfqDetailWorkspace` para consumir esa máquina.
- Hook `useRfqDetail(id)` que devuelve `{ rfq, allowedActions }`.

### 🎨 Consideraciones UX/UI
- Header del detalle con bloque de estado dominante (brief 4.5).
- Banners diferenciados: rojo suave para bloqueos, azul para informativos.

---

### 🏷️ Título
Dashboard operativo de Compras con KPIs, cola y atajos de asignación

### 👤 Historia de Usuario
Como usuario de Compras,
Quiero entrar a una home con KPIs, RFQs por asignar, vencimientos y desbloqueos,
Para empezar mi día sabiendo qué intervenciones son urgentes.

### 🎯 Descripción
Hoy no existe `/compras/dashboard`; los Compras llegarían a un fallback. Esta historia crea la pantalla con cards KPI superiores, tabla central de RFQs accionables y widgets laterales para vencimientos próximos y desbloqueos pendientes. Reutiliza componentes de `features/analytics` cuando aplique.

### ✅ Criterios de Aceptación
**Escenario 1: Visualizar pipeline**
Dado un comprador autenticado
Cuando carga `/compras/dashboard`
Entonces ve KPIs de RFQs por asignar, en cotización, benchmark listo y vencidas; cada KPI navega a la lista filtrada.

**Escenario 2: Widget de desbloqueos**
Dado que existen solicitudes de desbloqueo pendientes
Cuando carga el dashboard
Entonces el widget las muestra con CTA "Atender" que lleva a `/compras/admin/desbloqueos`.

**Escenario 3: Widget vacío**
Dado que no hay RFQs urgentes
Cuando carga el dashboard
Entonces los widgets muestran estado vacío institucional con mensaje específico.

### ⚙️ Reglas de Negocio
- El usuario base no ve métricas administrativas (desbloqueos solo se muestran a `compras_admin`).
- Los KPIs deben respetar permisos del usuario.

### 🧪 Casos de Prueba
- Render con datos completos y con datos vacíos.
- Click en KPI navega a lista filtrada por estado.
- Diferencia visible entre vista base y vista admin.

### 📦 Alcance Técnico / Notas para Dev
- Crear `src/pages/purchasing/DashboardPage.tsx`.
- Servicio mock `purchasingDashboardService` siguiendo patrón de `analyticsService`.
- Reutilizar `DashboardMetricCard` y `MonthlyRfqChart`.

### 🎨 Consideraciones UX/UI
- Densidad mayor que el dashboard de Industrialización (brief 4.8).
- Marcador visual de tiempo restante en RFQs cercanas a vencimiento.

---

### 🏷️ Título
Lista de RFQ de Compras con filtros, progreso por proveedor y acciones por fila

### 👤 Historia de Usuario
Como usuario de Compras,
Quiero una cola filtrable de todas las RFQs activas que me tocan,
Para tomar la siguiente RFQ a procesar de forma eficiente.

### 🎯 Descripción
Pantalla `/compras/rfq` (`F05`, `F06`, `F08`, `F09`, `F10`). Tabla full-width con filtros persistentes (estado, prioridad, región, tipo de máquina, deadline, búsqueda libre), columnas de progreso por proveedor y badges de estado. Incluye acciones contextuales por fila: `Asignar`, `Ver detalle`, `Ver benchmark`, `Cerrar`, `Extender`.

### ✅ Criterios de Aceptación
**Escenario 1: Filtrar por estado**
Dado un comprador en la lista
Cuando aplica el filtro `PENDING`
Entonces solo ve las RFQs sin proveedores asignados con CTA "Asignar".

**Escenario 2: Marcador de vencimiento**
Dado una RFQ con menos de 48h hábiles para deadline
Cuando aparece en la fila
Entonces se resalta con tono `--bocar-error` o badge de urgencia.

**Escenario 3: Acción contextual**
Dado una RFQ en `BENCHMARK_READY`
Cuando se hace click en "Ver benchmark"
Entonces se navega a `/compras/benchmark/:rfqId`.

### ⚙️ Reglas de Negocio
- La columna de progreso por proveedor solo aplica a `QUOTING`, `PARTIALLY_QUOTED`, `BENCHMARK_READY`.
- Las acciones disponibles dependen del estado y rol.

### 🧪 Casos de Prueba
- Combinaciones de filtros con resultados y sin resultados.
- Acción contextual deshabilitada cuando el estado no la permite.
- Paginación con datasets grandes.

### 📦 Alcance Técnico / Notas para Dev
- `src/pages/purchasing/RfqListPage.tsx` + `src/features/rfq/components/RfqList/PurchasingRfqTable.tsx`.
- Reutilizar `RfqStatusBadge` y `RfqDataCell`.

### 🎨 Consideraciones UX/UI
- Filtros fijos en barra superior (brief 4.9).
- Acciones por fila como menú compacto para no romper el escaneo.

---

### 🏷️ Título
Detalle de RFQ específico para Compras con foco en decisión comercial

### 👤 Historia de Usuario
Como usuario de Compras,
Quiero un detalle orientado a la decisión de asignación, cotización y cierre,
Para no leer una ficha técnica sino saber qué acción comercial sigue.

### 🎯 Descripción
Hoy `RfqDetailWorkspace` es genérica y no diferencia el shell ni los CTAs de Compras vs Industrialización. Esta historia divide el detalle por rol cuando el contenido cambia: header con CTAs comerciales (`Asignar`, `Aprobar`, `Editar proveedores`, `Cerrar`, `Extender`), columna principal con progreso comercial y proveedores, columna secundaria con resumen técnico/documentos.

Depende de la historia "Sistema de estados visibles".

### ✅ Criterios de Aceptación
**Escenario 1: RFQ en `PENDING`**
Dado un comprador con RFQ en `PENDING`
Cuando abre el detalle
Entonces ve CTA primario "Asignar proveedores" y resumen técnico colapsable.

**Escenario 2: RFQ en `EXPIRED`**
Dado un Compras admin con RFQ vencida
Cuando abre el detalle
Entonces ve banner "Vencida" + CTAs `Cerrar` o `Extender`.

**Escenario 3: RFQ en `BENCHMARK_READY`**
Dado un Compras admin
Cuando abre el detalle
Entonces ve link directo a la pantalla de benchmark y CTA `Cerrar`.

### ⚙️ Reglas de Negocio
- El detalle de Compras nunca debe verse como un formulario.
- En estados terminales todo es solo lectura.

### 🧪 Casos de Prueba
- Render por estado y por rol.
- Navegación correcta a benchmark, asignación y desbloqueos.

### 📦 Alcance Técnico / Notas para Dev
- Extraer secciones de `RfqDetailWorkspace` en componentes (`RfqStatusHeader`, `SuppliersProgressPanel`, `TechnicalSummaryCard`).
- Crear variantes `IndustrializationRfqDetail`, `PurchasingRfqDetail`, `SupplierRfqDetail`.

### 🎨 Consideraciones UX/UI
- Cabecera con badge dominante y bloque de CTAs (brief 4.10).
- Banners de bloqueo persistentes en estados sensibles.

---

### 🏷️ Título
Formulario de cotización del proveedor con upload de PDF obligatorio

### 👤 Historia de Usuario
Como proveedor,
Quiero capturar precios, dimensiones, tiempos y adjuntar PDF oficial,
Para enviar mi cotización dentro del plazo de 10 días hábiles.

### 🎯 Descripción
Hoy no hay pantalla del proveedor. Esta historia construye `/proveedor/rfq/:rfqId/cotizar` con secciones: precios, dimensiones del molde, tiempos de entrega, PDF oficial. Validación inline + resumen, confirmación fuerte ("al enviar la cotización quedará bloqueada") y bloqueo del envío si falta cualquier requisito.

### ✅ Criterios de Aceptación
**Escenario 1: Envío exitoso**
Dado el proveedor con todos los campos válidos y PDF cargado
Cuando hace click en "Enviar cotización"
Entonces aparece modal de confirmación con advertencia de bloqueo y, al confirmar, se redirige al detalle de la cotización.

**Escenario 2: PDF faltante**
Dado el proveedor sin PDF cargado
Cuando intenta enviar
Entonces se bloquea el envío y se resalta el dropzone con mensaje "PDF oficial obligatorio".

**Escenario 3: Precio negativo**
Dado un precio negativo
Cuando se sale del input
Entonces aparece error inline "Todos los precios deben ser positivos".

### ⚙️ Reglas de Negocio
- `deliveryWeeks` entero entre 1 y 52.
- PDF máximo 15 MB.
- Una vez enviada la cotización queda bloqueada hasta aprobación de desbloqueo (`F12`).
- El proveedor nunca debe ver otras cotizaciones ni benchmark.

### 🧪 Casos de Prueba
- PDF sobre 15 MB rechazado antes de subir.
- `deliveryWeeks` con valores fuera de rango.
- Resumen de validación visible al primer intento de envío inválido.
- Confirmación final al enviar.

### 📦 Alcance Técnico / Notas para Dev
- `src/pages/supplier/QuotationFormPage.tsx`.
- `src/features/quotation/` nueva feature con `schemas.ts`, `types.ts`, `services/quotationService.ts`.
- Reutilizar primitives de `RfqWorkspace`.

### 🎨 Consideraciones UX/UI
- Resumen sticky de la RFQ a la derecha (brief 4.18 conceptual).
- CTA principal con advertencia previa al envío.

---

### 🏷️ Título
Detalle de RFQ del proveedor con descarga de documentos y countdown

### 👤 Historia de Usuario
Como proveedor,
Quiero ver el resumen técnico, descargar PPT/STP y ver el countdown,
Para decidir si cotizo y empezar el formulario con contexto.

### 🎯 Descripción
Pantalla `/proveedor/rfq/:id` con header dominado por deadline, sección de documentos descargables, resumen técnico mínimo y CTA principal "Cotizar ahora". Si la cotización ya fue enviada se muestra estado y CTA "Solicitar desbloqueo".

Restricciones críticas: no exponer otros proveedores, no mostrar benchmark, no mostrar comentarios internos.

### ✅ Criterios de Aceptación
**Escenario 1: RFQ vigente sin cotizar**
Dado el proveedor con RFQ asignada
Cuando entra al detalle
Entonces ve countdown, documentos y CTA "Cotizar ahora".

**Escenario 2: Cotización ya enviada**
Dado el proveedor que ya cotizó
Cuando entra al detalle
Entonces ve estado "Bloqueada" y CTA "Solicitar desbloqueo".

**Escenario 3: Deadline vencido**
Dado un deadline ya cumplido
Cuando entra al detalle
Entonces el CTA "Cotizar" se deshabilita con explicación.

### ⚙️ Reglas de Negocio
- Nunca mostrar lista de otros proveedores asignados.
- Documentos visibles: solo PPT y STP de la RFQ + el PDF propio.

### 🧪 Casos de Prueba
- Cotización vigente, enviada, bloqueada, vencida.
- Descargas funcionales.

### 📦 Alcance Técnico / Notas para Dev
- Reusar `RfqDetailWorkspace` con un nuevo modo `mode="supplier"` que oculta secciones internas.
- Mejor: crear `SupplierRfqDetail` independiente para evitar lógica condicional.

### 🎨 Consideraciones UX/UI
- Countdown dominante (brief 4.20).
- Densidad baja y CTA único muy prominente.

---

### 🏷️ Título
Dashboard del proveedor como inbox de tareas

### 👤 Historia de Usuario
Como proveedor,
Quiero ver mis RFQs asignadas, mis cotizaciones y mis solicitudes de desbloqueo,
Para saber qué cotizar primero sin navegar el sistema.

### 🎯 Descripción
Pantalla `/proveedor/dashboard` con lista de RFQs por prioridad/días restantes, cotizaciones recientes y estado de solicitudes de desbloqueo. Layout simple, baja densidad, muy enfocado en CTAs.

### ✅ Criterios de Aceptación
**Escenario 1: RFQs urgentes**
Dado proveedor con RFQs cercanas a vencer
Cuando carga el dashboard
Entonces aparecen primero ordenadas por menor tiempo restante.

**Escenario 2: Sin RFQs**
Dado proveedor sin RFQs asignadas
Cuando carga el dashboard
Entonces ve estado vacío con explicación y CTA a soporte.

### ⚙️ Reglas de Negocio
- No mostrar métricas internas de BOCAR.
- No exponer benchmark, sugerencias IA ni catálogo.

### 🧪 Casos de Prueba
- Renderizado con 0, 1, 5 y 20 RFQs.
- Click en CTA "Cotizar" lleva al formulario correcto.

### 📦 Alcance Técnico / Notas para Dev
- `src/pages/supplier/DashboardPage.tsx`.
- Servicio mock `supplierDashboardService`.

### 🎨 Consideraciones UX/UI
- Tono más cálido y simple que las shells internas (brief 4.17 conceptual).

---

### 🏷️ Título
Lista de RFQs asignadas al proveedor

### 👤 Historia de Usuario
Como proveedor,
Quiero una cola clara con tiempo restante y estado de mi cotización,
Para procesar mi pendiente sin distracciones.

### 🎯 Descripción
Pantalla `/proveedor/rfq` con tabla ligera, filtros básicos por estado y búsqueda, indicadores de tiempo restante y CTAs por fila (`Ver RFQ`, `Cotizar`).

### ✅ Criterios de Aceptación
**Escenario 1: Cola normal**
Dado proveedor con varias RFQs activas
Cuando carga la lista
Entonces ve cada fila con estado de su cotización y CTA contextual.

### ⚙️ Reglas de Negocio
- No mostrar RFQs ajenas, ni filtros de Compras.

### 🧪 Casos de Prueba
- Filtrado por estado.
- CTA "Cotizar" deshabilitado si la cotización ya está bloqueada.

### 📦 Alcance Técnico / Notas para Dev
- `src/pages/supplier/RfqListPage.tsx`.
- Reutilizar `RfqTable` con preset del proveedor.

### 🎨 Consideraciones UX/UI
- Colores de prioridad por tiempo (brief 4.18).

---

### 🏷️ Título
Modal de cancelación de RFQ con motivo obligatorio y auditoría

### 👤 Historia de Usuario
Como administrador (Industrialización o Compras),
Quiero capturar el motivo al cancelar una RFQ,
Para garantizar trazabilidad y comunicar la razón a los involucrados.

### 🎯 Descripción
Modal global `CancelRfqModal` invocable desde dashboards y detalle. Solo disponible en estados `DRAFT`, `PENDING_INTERNAL_APPROVAL`, `PENDING`, `PENDING_PURCHASING_APPROVAL`. Motivo obligatorio (>= 10 caracteres), confirmación fuerte, deja huella en timeline y notifica a involucrados.

### ✅ Criterios de Aceptación
**Escenario 1: Cancelación con motivo válido**
Dado admin con RFQ en `PENDING`
Cuando captura motivo y confirma
Entonces la RFQ pasa a `CANCELLED`, se cierra el modal y se muestra toast de éxito.

**Escenario 2: Motivo vacío**
Dado el modal abierto
Cuando se intenta confirmar sin motivo
Entonces el botón está deshabilitado y se resalta el textarea.

**Escenario 3: Estado bloqueado**
Dado RFQ en `QUOTING`
Cuando se intenta abrir el modal
Entonces el sistema niega la apertura y muestra explicación contextual.

### ⚙️ Reglas de Negocio
- Cancelación es soft delete; el detalle queda visible con la razón.
- La acción debe estar protegida por permiso `rfq:cancel`.

### 🧪 Casos de Prueba
- Validar mínimo de caracteres.
- Validar permisos por rol.
- Confirmación doble step.

### 📦 Alcance Técnico / Notas para Dev
- `src/features/rfq/components/RfqModals/CancelRfqModal.tsx`.
- Hook `useCancelRfq(id)`.

### 🎨 Consideraciones UX/UI
- Diseño sobrio, foco en `--bocar-error`.
- Texto de impacto explícito antes del input.

---

### 🏷️ Título
Modal de rechazo con motivo obligatorio para flujos de aprobación

### 👤 Historia de Usuario
Como Super Usuario (Industrialización o Compras),
Quiero rechazar una RFQ o asignación con motivo obligatorio,
Para que el solicitante reciba contexto y pueda corregir.

### 🎯 Descripción
Modal `RejectWithReasonModal` reutilizable en `PENDING_INTERNAL_APPROVAL` (regresa a `DRAFT`) y en `PENDING_PURCHASING_APPROVAL` (regresa a `PENDING`). Captura motivo obligatorio, registra autor y timestamp, dispara notificación.

### ✅ Criterios de Aceptación
**Escenario 1: Rechazo de RFQ interna**
Dado admin de Industrialización
Cuando rechaza con motivo
Entonces la RFQ regresa a `DRAFT` y el creador recibe notificación.

**Escenario 2: Rechazo de asignación**
Dado admin de Compras
Cuando rechaza la propuesta de proveedores
Entonces la RFQ regresa a `PENDING` y el comprador recibe notificación.

### ⚙️ Reglas de Negocio
- Motivo obligatorio (>= 10 caracteres).
- Solo invocable por Super Usuarios.

### 🧪 Casos de Prueba
- Rechazo con motivo válido y rechazo con motivo vacío.
- Notificación visible para el solicitante.

### 📦 Alcance Técnico / Notas para Dev
- `RejectWithReasonModal` parametrizado por origen (`internal`, `purchasing`).

### 🎨 Consideraciones UX/UI
- Mismos tokens que el modal de cancelación pero copy distinto.

---

### 🏷️ Título
Modo edit del formulario de RFQ con experiencia diferenciada de creación

### 👤 Historia de Usuario
Como creador de una RFQ en `DRAFT`,
Quiero corregir mi borrador con la misma sensación de captura,
Para entender que estoy editando, no creando desde cero.

### 🎯 Descripción
Hoy `RfqFormPage` se renderiza igual para `crear` y `:id/editar`. Esta historia ajusta el workspace para mostrar contexto de "editando RFQ-XXXX", precargar datos, mostrar progreso de campos llenados, mantener el botón "Guardar borrador" y el de "Enviar a aprobación". Bloquea edición cuando la RFQ ya no está en `DRAFT`.

### ✅ Criterios de Aceptación
**Escenario 1: Edit válido**
Dado creador con RFQ en `DRAFT`
Cuando abre `:id/editar`
Entonces los campos están precargados y el header indica "Editando RFQ-001".

**Escenario 2: Estado no editable**
Dado creador con RFQ en `PENDING`
Cuando intenta abrir `:id/editar`
Entonces el sistema redirige al detalle con mensaje "Esta RFQ ya no es editable".

### ⚙️ Reglas de Negocio
- Solo editable en `DRAFT`.
- Solo editable por el creador o por un admin desde el flujo "Editar y aprobar".

### 🧪 Casos de Prueba
- Edición de un campo y guardar borrador.
- Edición + envío.
- Acceso denegado en estados no editables.

### 📦 Alcance Técnico / Notas para Dev
- `RfqWorkspace` ya recibe `mode`. Cablear precarga vía `useRfq(id)` y usar el modo para microcopy.
- Guardar diff para auditoría futura.

### 🎨 Consideraciones UX/UI
- Subtítulo que comunique edición.
- Indicador de campos modificados respecto al borrador inicial.

---

## Prioridad P1 — Importantes (cierran ciclos completos)

---

### 🏷️ Título
Pantalla de Benchmark con tabla comparativa, scorecards y exportación

### 👤 Historia de Usuario
Como usuario interno (Compras o Industrialización),
Quiero comparar todas las cotizaciones recibidas con KPIs claros,
Para decidir si cierro la RFQ o reenvío a más proveedores.

### 🎯 Descripción
Pantalla `/compras/benchmark/:rfqId` (`F09`). Tabla ancha con columnas congeladas, scorecards superiores por proveedor, indicadores de outliers y CTAs `Exportar Excel`, `Cerrar RFQ`, `Reenviar`.

### ✅ Criterios de Aceptación
**Escenario 1: Benchmark listo**
Dado RFQ en `BENCHMARK_READY`
Cuando se abre la pantalla
Entonces se ve la tabla con 4+ proveedores, scorecards y CTAs administrativos.

**Escenario 2: Exportar**
Dado tabla cargada
Cuando se hace click en "Exportar Excel"
Entonces se descarga un archivo con las columnas mostradas.

**Escenario 3: Comparativo parcial**
Dado RFQ en `PARTIALLY_QUOTED`
Cuando se intenta entrar
Entonces se muestra modo parcial con aviso de que el benchmark completo se habilita en `BENCHMARK_READY`.

### ⚙️ Reglas de Negocio
- Reenviar requiere aprobación de Compras admin.
- El proveedor nunca debe acceder a esta ruta.

### 🧪 Casos de Prueba
- Render con 4, 6 y 10 cotizaciones.
- Outlier resaltado.
- Export con datos reales.

### 📦 Alcance Técnico / Notas para Dev
- `src/pages/purchasing/BenchmarkPage.tsx`.
- `BenchmarkTable`, `SupplierScorecard` en `features/rfq/components/Benchmark/`.

### 🎨 Consideraciones UX/UI
- Tabla con columnas congeladas (brief 4.12).
- Scorecards arriba como resumen.

---

### 🏷️ Título
Timeline y panel de auditoría en RFQ Detail

### 👤 Historia de Usuario
Como usuario interno,
Quiero ver la línea de tiempo de la RFQ con motivos, autores y timestamps,
Para entender qué pasó y quién decidió cada paso.

### 🎯 Descripción
Subsuperficie dentro del detalle (`SCREENS_AND_FLOWS.md §7.1`). Renderiza eventos: creación, envío, aprobación, rechazo con motivo, cancelación, asignación, transiciones automáticas a `QUOTING`, `PARTIALLY_QUOTED`, `BENCHMARK_READY`, `EXPIRED`. Panel de auditoría adicional para admins con diff y comentarios.

### ✅ Criterios de Aceptación
**Escenario 1: Visualizar timeline**
Dado un detalle de RFQ con histórico
Cuando se abre la sección Timeline
Entonces se listan todos los eventos en orden cronológico.

**Escenario 2: Auditoría de admins**
Dado admin de Industrialización
Cuando entra a una RFQ aprobada con edición
Entonces ve diff de campos modificados.

### ⚙️ Reglas de Negocio
- Proveedor ve solo eventos sobre su propia cotización (versión simplificada).
- Auditoría completa solo para admins.

### 🧪 Casos de Prueba
- RFQ con timeline corto y largo.
- Auditoría con diff.

### 📦 Alcance Técnico / Notas para Dev
- `RfqTimeline.tsx`, `AuditPanel.tsx`.
- Servicio mock `rfqEventsService`.

### 🎨 Consideraciones UX/UI
- Timeline vertical compacto con badges.
- Auditoría como card colapsable.

---

### 🏷️ Título
Centro de notificaciones global con drawer y deep links

### 👤 Historia de Usuario
Como usuario autenticado de cualquier rol,
Quiero un inbox accionable con eventos críticos del sistema,
Para resolver pendientes sin depender del correo.

### 🎯 Descripción
Drawer global lanzable desde header (campana). Lista de notificaciones agrupadas por criticidad y fecha, deep links a la pantalla resolutoria, marcar leída/no leída, filtros por estado. Crítico para `F03`, `F06`, `F08`, `F09`, `F10`, `F11`, `F12` y `F14`.

### ✅ Criterios de Aceptación
**Escenario 1: Notificación accionable**
Dado un evento de aprobación pendiente
Cuando se hace click en la notificación
Entonces se navega al detalle exacto de la RFQ.

**Escenario 2: Marcar leída**
Dado una notificación no leída
Cuando se hace click en el indicador
Entonces el indicador desaparece sin cerrar el drawer.

### ⚙️ Reglas de Negocio
- El proveedor solo ve notificaciones de sus propias RFQs/cotizaciones.
- Notificaciones críticas no se autosilencian.

### 🧪 Casos de Prueba
- Drawer abre/cierra desde header.
- Deep link correcto por tipo de notificación.
- Filtros por leídas/no leídas.

### 📦 Alcance Técnico / Notas para Dev
- `src/features/notifications/` con `NotificationDrawer.tsx`, `NotificationItem.tsx`, `useNotifications`.
- Botón campana en `Header.tsx`.

### 🎨 Consideraciones UX/UI
- Drawer lateral derecho compacto (brief 4.4).

---

### 🏷️ Título
Workspace de "Editar y aprobar" con diff y auditoría obligatoria

### 👤 Historia de Usuario
Como Super Usuario,
Quiero ajustar campos y aprobar la RFQ con razón documentada,
Para no devolver al creador cuando el ajuste es menor.

### 🎯 Descripción
Vista invocada desde detalle en `PENDING_INTERNAL_APPROVAL` o `PENDING_PURCHASING_APPROVAL`. Permite editar campos clave, mostrar diff antes de confirmar, exigir razón por cada cambio o por el set completo, registrar todo en auditoría.

### ✅ Criterios de Aceptación
**Escenario 1: Edición y aprobación**
Dado admin con RFQ en aprobación
Cuando edita 3 campos y captura razón
Entonces antes de confirmar se muestra el diff y la razón; al confirmar pasa a `PENDING` (o `QUOTING`).

**Escenario 2: Aprobación sin razón**
Dado un cambio sin razón
Cuando intenta confirmar
Entonces el envío se bloquea.

### ⚙️ Reglas de Negocio
- La razón se registra junto con autor y timestamp.
- El diff debe mostrar valores anteriores y nuevos.

### 🧪 Casos de Prueba
- Edición con y sin diff real.
- Razón vacía.

### 📦 Alcance Técnico / Notas para Dev
- `EditAndApproveWorkspace.tsx` reutilizando primitives del form.

### 🎨 Consideraciones UX/UI
- Vista lateral o overlay grande.
- Diff con badges de "antes/después".

---

### 🏷️ Título
Solicitud y aprobación de desbloqueo de cotización

### 👤 Historia de Usuario
Como proveedor o Compras operativo,
Quiero solicitar el desbloqueo de una cotización ya enviada,
Para corregir errores antes del cierre de la RFQ.

### 🎯 Descripción
Incluye `UnlockRequestModal` desde `Quotation Detail` o `RFQ Detail Compras`, captura motivo obligatorio. Pantalla `/compras/admin/desbloqueos` para que el admin apruebe/rechace, con timeline y resumen de cotización bloqueada.

### ✅ Criterios de Aceptación
**Escenario 1: Solicitud creada**
Dado un proveedor con cotización bloqueada
Cuando solicita desbloqueo con motivo
Entonces se crea la solicitud y aparece estado "Solicitud enviada".

**Escenario 2: Aprobación**
Dado admin con solicitud pendiente
Cuando aprueba
Entonces la cotización vuelve a editable y se notifica al proveedor.

### ⚙️ Reglas de Negocio
- Solo Compras admin aprueba.
- Toda decisión queda auditada.

### 🧪 Casos de Prueba
- Crear, aprobar, rechazar.
- Re-edición de cotización tras desbloqueo.

### 📦 Alcance Técnico / Notas para Dev
- `UnlockRequestModal`, `UnlockRequestsPage`, `useUnlockRequests`.

### 🎨 Consideraciones UX/UI
- Master-detail (lista a la izquierda, inspección a la derecha).

---

### 🏷️ Título
Historial y detalle de cotizaciones del proveedor

### 👤 Historia de Usuario
Como proveedor,
Quiero consultar todas mis cotizaciones enviadas con su estado de bloqueo,
Para hacer seguimiento sin perder contexto.

### 🎯 Descripción
Dos pantallas: `/proveedor/cotizaciones` (tabla con RFQ, fecha, estado, deadline, última actualización) y `/proveedor/cotizaciones/:id` (resumen, PDF, timeline, CTA solicitar desbloqueo).

### ✅ Criterios de Aceptación
**Escenario 1: Consultar histórico**
Dado proveedor con cotizaciones
Cuando entra a la lista
Entonces ve cada una con estado claro (enviada, bloqueada, desbloqueada, cerrada).

**Escenario 2: Detalle**
Dado proveedor con cotización bloqueada
Cuando abre el detalle
Entonces ve timeline y CTA "Solicitar desbloqueo" si aplica.

### ⚙️ Reglas de Negocio
- Solo cotizaciones propias.
- Sin acceso a benchmark.

### 🧪 Casos de Prueba
- Filtrar por estado.
- CTA desbloqueo deshabilitada cuando no aplica.

### 📦 Alcance Técnico / Notas para Dev
- `src/pages/supplier/QuotationListPage.tsx`, `QuotationDetailPage.tsx`.

### 🎨 Consideraciones UX/UI
- Vista limpia y confiable; estado dominante.

---

### 🏷️ Título
Admin Dashboard de Compras con aprobaciones y desbloqueos

### 👤 Historia de Usuario
Como Compras admin,
Quiero un command center con aprobaciones, desbloqueos y vencimientos,
Para no perder ninguna decisión administrativa del día.

### 🎯 Descripción
Pantalla `/compras/admin` con paneles tipo control tower: aprobaciones de asignación pendientes, desbloqueos pendientes, RFQs en `BENCHMARK_READY` esperando cierre, RFQs `EXPIRED`. Configuración de alertas como subpanel.

### ✅ Criterios de Aceptación
**Escenario 1: Render con cargas**
Dado admin con varias colas activas
Cuando entra al dashboard
Entonces ve cards de cada cola con CTA directo.

### ⚙️ Reglas de Negocio
- Solo `compras_admin` puede acceder.

### 🧪 Casos de Prueba
- Renderizado con 0 y N pendientes.

### 📦 Alcance Técnico / Notas para Dev
- `src/pages/purchasing/AdminDashboardPage.tsx`.

### 🎨 Consideraciones UX/UI
- Tipo command center (brief 4.14).

---

### 🏷️ Título
Admin Dashboard de Industrialización con cola de aprobaciones internas

### 👤 Historia de Usuario
Como Super Usuario de Industrialización,
Quiero una bandeja con RFQs en `PENDING_INTERNAL_APPROVAL` y RFQs cancelables,
Para resolver mi cola sin perder contexto.

### 🎯 Descripción
Pantalla `/industrializacion/admin` con cola de aprobaciones, panel de eventos recientes y conteos de pendientes críticos.

### ✅ Criterios de Aceptación
**Escenario 1: Aprobar desde la cola**
Dado admin con 5 pendientes
Cuando hace click en una fila
Entonces se navega al detalle con CTAs `Aprobar`, `Rechazar`, `Editar+Aprobar`.

### ⚙️ Reglas de Negocio
- Solo `industrializacion_admin` accede.

### 🧪 Casos de Prueba
- Cola con 0 y N pendientes.

### 📦 Alcance Técnico / Notas para Dev
- `src/pages/industrializacion/AdminDashboardPage.tsx`.

### 🎨 Consideraciones UX/UI
- Tabla central + panel lateral de actividad (brief 4.6).

---

### 🏷️ Título
Sidebar persistente con navegación contextual por rol

### 👤 Historia de Usuario
Como usuario autenticado,
Quiero una navegación lateral que solo muestre lo que mi rol puede usar,
Para moverme rápido sin ruido.

### 🎯 Descripción
Hoy el `Sidebar` existe pero no se renderiza en ninguna página. Esta historia conecta el sidebar a `MainLayout` por defecto, define elementos por rol según `SCREENS_AND_FLOWS.md §4.7` y oculta links sin permiso (no deshabilitarlos).

### ✅ Criterios de Aceptación
**Escenario 1: Industrialización base**
Dado un usuario base
Cuando carga cualquier pantalla interna
Entonces ve Dashboard, RFQs, Predicción, Analytics.

**Escenario 2: Compras admin**
Dado un admin
Cuando carga cualquier pantalla
Entonces ve también Admin, Proveedores Admin, Desbloqueos.

**Escenario 3: Proveedor**
Dado un proveedor
Cuando carga su shell
Entonces ve solo Dashboard, RFQs asignadas, Cotizaciones.

### ⚙️ Reglas de Negocio
- Links sin permiso no se renderizan.

### 🧪 Casos de Prueba
- Cambio de rol cambia los items renderizados.
- Active state coincide con la ruta actual.

### 📦 Alcance Técnico / Notas para Dev
- Refactor de `Sidebar.tsx` a items por rol.
- Conectar `MainLayout` para renderizarlo siempre en shells autenticados.

### 🎨 Consideraciones UX/UI
- Tres shells distintos (interno, admin, proveedor).

---

### 🏷️ Título
Modales de extensión y cierre de RFQ vencida

### 👤 Historia de Usuario
Como Compras admin,
Quiero decidir entre cerrar o extender una RFQ vencida,
Para no perder cotizaciones ya recibidas y reaccionar al plazo.

### 🎯 Descripción
`ExtendOrResendModal` (selecciona nuevos proveedores y reinicia plazo) y `CloseRfqModal` (cierre definitivo con confirmación). Solo en `EXPIRED` y `BENCHMARK_READY`.

### ✅ Criterios de Aceptación
**Escenario 1: Extender**
Dado RFQ `EXPIRED`
Cuando se eligen nuevos proveedores
Entonces la RFQ regresa a `QUOTING` con plazo nuevo y conserva cotizaciones previas.

**Escenario 2: Cerrar**
Dado RFQ `BENCHMARK_READY`
Cuando se confirma cierre
Entonces pasa a `CLOSED` y queda solo lectura.

### ⚙️ Reglas de Negocio
- Cierre es estado final.
- Extensión preserva histórico.

### 🧪 Casos de Prueba
- Extender con proveedores nuevos y antiguos.
- Cierre con benchmark exportado.

### 📦 Alcance Técnico / Notas para Dev
- `ExtendOrResendModal`, `CloseRfqModal`.

### 🎨 Consideraciones UX/UI
- Mensajería que diferencie cancelación de extensión.

---

### 🏷️ Título
Lista dedicada de RFQs de Industrialización separada del dashboard

### 👤 Historia de Usuario
Como usuario de Industrialización,
Quiero una pantalla dedicada de lista con todos los filtros,
Para usar el dashboard como resumen y la lista como cola operativa.

### 🎯 Descripción
Hoy `/industrializacion/dashboard` ya muestra una lista incrustada. Esta historia construye `/industrializacion/rfq` como vista independiente con filtros completos, segmentación entre "Mis borradores" y "RFQs institucionales", y acciones contextuales.

### ✅ Criterios de Aceptación
**Escenario 1: Borradores propios**
Dado un usuario base
Cuando aplica el filtro "Mis borradores"
Entonces solo ve sus propios drafts.

### ⚙️ Reglas de Negocio
- Borradores ajenos no son visibles ni siquiera para admins, salvo flujo de aprobación.

### 🧪 Casos de Prueba
- Segmentación de borradores.
- Acciones contextuales por estado.

### 📦 Alcance Técnico / Notas para Dev
- `src/pages/industrializacion/RfqListPage.tsx` reutilizando primitives del dashboard.

### 🎨 Consideraciones UX/UI
- Brief 4 conceptual.

---

## Prioridad P2 — Complementarias (analítica, admin, predicción, errores)

---

### 🏷️ Título
Supplier Catalog Explorer para Compras

### 👤 Historia de Usuario
Como Compras,
Quiero explorar el catálogo de proveedores con capacidades, región y desempeño,
Para decidir a quién invitar a una RFQ.

### 🎯 Descripción
Pantalla `/compras/proveedores` con filtros avanzados (capacidad, región, especialidad, tags), grid o tabla híbrida, panel ligero de detalle.

### ✅ Criterios de Aceptación
**Escenario 1: Filtrar y seleccionar**
Dado un comprador en una asignación
Cuando filtra por especialidad
Entonces ve proveedores compatibles con CTA "Seleccionar".

### ⚙️ Reglas de Negocio
- Esta vista es operativa, no administrativa.

### 🧪 Casos de Prueba
- Filtros combinados.
- Panel de detalle ligero.

### 📦 Alcance Técnico / Notas para Dev
- `src/pages/purchasing/SupplierCatalogPage.tsx`.

### 🎨 Consideraciones UX/UI
- Tipo librería de proveedores (brief 4.13).

---

### 🏷️ Título
Supplier Management para administradores

### 👤 Historia de Usuario
Como Compras admin,
Quiero gestionar el catálogo maestro (alta/baja/edición) de proveedores,
Para mantener actualizado el ecosistema.

### 🎯 Descripción
Pantalla `/compras/admin/proveedores` densa orientada a CRUD con filtros, acciones bulk y side panel de edición.

### ✅ Criterios de Aceptación
**Escenario 1: Alta de proveedor**
Dado admin
Cuando crea un proveedor con datos válidos
Entonces aparece en la lista y queda disponible para asignación.

### ⚙️ Reglas de Negocio
- Auditoría obligatoria en cualquier baja o edición.

### 🧪 Casos de Prueba
- CRUD completo.
- Acciones bulk.

### 📦 Alcance Técnico / Notas para Dev
- `src/pages/purchasing/AdminSupplierManagementPage.tsx`.

### 🎨 Consideraciones UX/UI
- Pantalla densa con side panel (brief 4.15).

---

### 🏷️ Título
Requests Management Page para admin de Industrialización

### 👤 Historia de Usuario
Como Industrialización admin,
Quiero gestionar solicitudes de cambio técnico,
Para resolverlas con contexto comparativo.

### 🎯 Descripción
Pantalla `/industrializacion/admin/solicitudes` con master-detail: lista de solicitudes y panel de diff entre datos originales y cambio solicitado, comentarios y resolución.

### ✅ Criterios de Aceptación
**Escenario 1: Resolver solicitud**
Dado admin con solicitud abierta
Cuando aprueba con comentario
Entonces la solicitud cambia a estado resuelto y se actualiza la RFQ.

### ⚙️ Reglas de Negocio
- Auditoría completa.

### 🧪 Casos de Prueba
- Aprobar, rechazar, devolver con comentario.

### 📦 Alcance Técnico / Notas para Dev
- `src/pages/industrializacion/AdminRequestsPage.tsx`.

### 🎨 Consideraciones UX/UI
- Diff visual fuerte (brief 4.7).

---

### 🏷️ Título
Prediction Page para estimación de costos por IA

### 👤 Historia de Usuario
Como Industrialización,
Quiero capturar parámetros técnicos y obtener una predicción de costo con confianza,
Para apoyarme antes de generar la RFQ.

### 🎯 Descripción
Pantalla `/industrializacion/prediccion` (RF-22). Formulario a la izquierda, resultado y `ConfidenceIndicator` a la derecha, capacidad de cargar una RFQ existente como contexto.

### ✅ Criterios de Aceptación
**Escenario 1: Predicción exitosa**
Dado parámetros válidos
Cuando se lanza la predicción
Entonces se muestra rango, desglose y nivel de confianza.

### ⚙️ Reglas de Negocio
- La predicción es apoyo, no decisión final.

### 🧪 Casos de Prueba
- Predicción con y sin RFQ asociada.
- Estado de error del modelo.

### 📦 Alcance Técnico / Notas para Dev
- `src/pages/industrializacion/PredictionPage.tsx`.
- `features/prediction/`.

### 🎨 Consideraciones UX/UI
- Indicador de confianza visible.

---

### 🏷️ Título
Analytics dedicado para Industrialización y Compras

### 👤 Historia de Usuario
Como usuario interno,
Quiero pantallas analíticas con tendencias y KPIs históricos,
Para tomar decisiones estratégicas.

### 🎯 Descripción
Páginas `/industrializacion/analytics` y `/compras/analytics` reutilizando `features/analytics`. Filtros temporales, comparativos y exportación.

### ✅ Criterios de Aceptación
**Escenario 1: Filtros temporales**
Dado usuario en analytics
Cuando filtra por trimestre
Entonces los KPIs y la gráfica se recalculan.

### ⚙️ Reglas de Negocio
- Cada rol ve solo sus métricas autorizadas.

### 🧪 Casos de Prueba
- Carga inicial, filtros, export.

### 📦 Alcance Técnico / Notas para Dev
- `IndustrializationAnalyticsPage.tsx`, `PurchasingAnalyticsPage.tsx`.

### 🎨 Consideraciones UX/UI
- Densidad alta pero legible.

---

### 🏷️ Título
Páginas de error 401, 404 y 500

### 👤 Historia de Usuario
Como usuario,
Quiero ver mensajes claros cuando una ruta no existe, no tengo permiso o hay error de servidor,
Para volver al flujo correcto sin frustración.

### 🎯 Descripción
Tres pantallas con código, mensaje específico y CTA `Volver al dashboard`. En `500`, además, CTA reintentar/reportar.

### ✅ Criterios de Aceptación
**Escenario 1: Sin permiso**
Dado un usuario sin permiso para una ruta
Cuando entra
Entonces se muestra `/401` con mensaje específico.

**Escenario 2: Ruta inexistente**
Dado URL desconocida
Cuando se carga
Entonces se muestra `/404`.

### ⚙️ Reglas de Negocio
- El producto no debe romper visualmente en estos estados.

### 🧪 Casos de Prueba
- Cada variante con copy distinto.

### 📦 Alcance Técnico / Notas para Dev
- `src/pages/errors/UnauthorizedPage.tsx`, `NotFoundPage.tsx`, `ServerErrorPage.tsx`.
- ErrorBoundary global.

### 🎨 Consideraciones UX/UI
- Brief 4.3.

---

### 🏷️ Título
SSOCallbackPage para cerrar el flujo de autenticación interna

### 👤 Historia de Usuario
Como usuario interno,
Quiero ver un estado de validación claro durante el callback SSO,
Para entender que el sistema está procesando mi acceso.

### 🎯 Descripción
Pantalla mínima centrada con spinner, mensaje de progreso, fallback de error con retry/volver al login.

### ✅ Criterios de Aceptación
**Escenario 1: Callback exitoso**
Dado callback con token válido
Cuando se procesa
Entonces se redirige al dashboard del rol.

**Escenario 2: Callback fallido**
Dado callback inválido
Entonces se muestra error con CTA reintentar.

### ⚙️ Reglas de Negocio
- No debe permanecer colgado más de 30 segundos sin feedback.

### 🧪 Casos de Prueba
- Éxito, error, timeout.

### 📦 Alcance Técnico / Notas para Dev
- `src/pages/auth/SSOCallbackPage.tsx`.

### 🎨 Consideraciones UX/UI
- Layout ultra minimal (brief 4.2).

---

## Prioridad P3 — Soporte y refinamientos

---

### 🏷️ Título
AuthProvider real con resolución de rol, permisos y guards por ruta

### 👤 Historia de Usuario
Como sistema,
Quiero un AuthProvider que persista identidad, rol y permisos,
Para gobernar acceso a rutas y CTAs en todo el frontend.

### 🎯 Descripción
Hoy `AuthProvider`, `permissions.ts` y `Router.tsx` son placeholders. Esta historia conecta auth con rutas protegidas, permisos por componente y refresh/expire de sesión.

### ✅ Criterios de Aceptación
**Escenario 1: Acceso protegido**
Dado un proveedor
Cuando intenta entrar a `/compras/dashboard`
Entonces se redirige a `/401`.

### ⚙️ Reglas de Negocio
- Sesión expira por inactividad y se redirige a `/login?reason=expired`.

### 🧪 Casos de Prueba
- Cada rol con acceso permitido y denegado.

### 📦 Alcance Técnico / Notas para Dev
- `<RequireAuth role="...">` HOC/wrapper en `Router.tsx`.
- `usePermission(perm)`.

### 🎨 Consideraciones UX/UI
- No flicker durante la resolución del rol.

---

### 🏷️ Título
File Preview Overlay para inspeccionar documentos sin perder contexto

### 👤 Historia de Usuario
Como usuario interno,
Quiero previsualizar PDFs y archivos técnicos sin abandonar el detalle,
Para revisar especificaciones rápido.

### 🎯 Descripción
Overlay invocable desde panel de documentos. Soporta PDF y previsualización liviana de PPT/STP cuando el backend la provea.

### ✅ Criterios de Aceptación
**Escenario 1: Previsualizar PDF**
Dado un PDF en el panel
Cuando se hace click en "Vista previa"
Entonces se abre el overlay con el archivo y CTA descargar.

### ⚙️ Reglas de Negocio
- Proveedor puede previsualizar solo documentos permitidos.

### 🧪 Casos de Prueba
- PDF, archivo no soportado.

### 📦 Alcance Técnico / Notas para Dev
- `FilePreviewOverlay.tsx` con `react-pdf`.

### 🎨 Consideraciones UX/UI
- Modal full-screen elegante.

---

### 🏷️ Título
Estados transversales de feedback (Loading, Empty, Error, NoPermission)

### 👤 Historia de Usuario
Como usuario,
Quiero estados consistentes de carga, vacío, error y sin permiso,
Para entender qué está pasando en cada pantalla.

### 🎯 Descripción
Componentes compartidos en `shared/components/ui`: `LoadingOverlay`, `EmptyState`, `ErrorState`, `NoPermissionState`. Aplicados en todas las pantallas.

### ✅ Criterios de Aceptación
**Escenario 1: Empty state**
Dado lista vacía
Cuando se carga
Entonces se muestra `EmptyState` con CTA contextual.

### ⚙️ Reglas de Negocio
- Cada estado debe usar tokens BOCAR.

### 🧪 Casos de Prueba
- Render por cada estado en todas las pantallas.

### 📦 Alcance Técnico / Notas para Dev
- Crear componentes en `shared/components/ui/`.

### 🎨 Consideraciones UX/UI
- Sobrios, sin ilustraciones cargadas.

---

### 🏷️ Título
Validation Summary unificado para formularios largos

### 👤 Historia de Usuario
Como usuario que llena formularios largos,
Quiero un resumen agrupado de errores con scroll-to-error,
Para corregir sin recorrer manualmente.

### 🎯 Descripción
Componente `ValidationSummary` que escucha errores de React Hook Form y agrupa por sección. Aplica a `RfqWorkspace` y al futuro `QuotationForm`.

### ✅ Criterios de Aceptación
**Escenario 1: Errores múltiples**
Dado el formulario con varios errores
Cuando se intenta enviar
Entonces aparece el resumen y al hacer click en cada error se hace focus en el campo correspondiente.

### ⚙️ Reglas de Negocio
- Resumen visible al primer intento de envío inválido.

### 🧪 Casos de Prueba
- Errores en varias secciones.

### 📦 Alcance Técnico / Notas para Dev
- `ValidationSummary.tsx` en `shared/components/ui/`.

### 🎨 Consideraciones UX/UI
- Listado compacto con jerarquía clara.

---

### 🏷️ Título
Upload de archivos con límites y validación visible antes de subir

### 👤 Historia de Usuario
Como usuario que adjunta archivos,
Quiero ver tamaño máximo y tipo permitido antes de elegir el archivo,
Para evitar errores al final del flujo.

### 🎯 Descripción
Componente `FileDropzone` reutilizable con validación de tamaño/tipo, preview, manejo de error de upload y barra de progreso. Usado en `RfqForm` (PPT, STP) y `QuotationForm` (PDF).

### ✅ Criterios de Aceptación
**Escenario 1: Tipo no permitido**
Dado un archivo `.docx` en un dropzone de PDF
Cuando se intenta subir
Entonces se rechaza antes de iniciar el upload con mensaje específico.

### ⚙️ Reglas de Negocio
- PPT/STP máximo definidos por backend.
- PDF máximo 15 MB.

### 🧪 Casos de Prueba
- Tamaño excedido, tipo inválido, upload exitoso.

### 📦 Alcance Técnico / Notas para Dev
- `shared/components/ui/FileDropzone.tsx`.

### 🎨 Consideraciones UX/UI
- Tokens BOCAR, leyenda de límites siempre visible.

---

## 3. Resumen ejecutivo de prioridades

| Prioridad | Cantidad | Foco |
|-----------|----------|------|
| P0 | 12 historias | Multi-rol funcional, estados RFQ, formulario de cotización, modales críticos. |
| P1 | 12 historias | Cierre de flujos: benchmark, timeline, notificaciones, desbloqueos, admin dashboards, sidebar por rol, vencimiento. |
| P2 | 7 historias | Predicción, analytics, catálogo, gestión admin, errores, callback. |
| P3 | 5 historias | Soporte: AuthProvider real, file preview, estados de feedback, validación, upload. |

Cumpliendo P0 y P1 el frontend cubre el flujo de negocio completo descrito en `SCREENS_AND_FLOWS.md`. P2 y P3 elevan calidad, completitud analítica y robustez del producto.
