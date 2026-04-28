# Screens and Flows

## 1. Propósito

Este documento traduce `specs/ARCHITECTURE_PROPOSAL.md` a una definición operativa de frontend: qué pantallas existen, por qué son necesarias, qué usuario entra a cada una, qué información debe mostrar cada vista y cómo se conectan entre sí mediante flujos de negocio completos.

El objetivo es que diseño, frontend, backend y negocio puedan usar este archivo como mapa único de:

- Pantallas routeables.
- Superficies transversales no routeables pero críticas para operar el sistema.
- Estados y transiciones visibles desde UI.
- Flujos felices, loops de corrección, aprobaciones, expiraciones, bloqueos y errores.
- Diferencias reales entre Industrialización, Compras, Super Usuarios y Proveedores.

## 2. Supuestos y normalizaciones derivados de la propuesta

Durante el análisis del documento base aparecen algunos huecos o asimetrías menores. Para que el frontend quede completamente especificado, este documento normaliza lo siguiente:

- La ruta `/industrializacion/analytics` existe en la arquitectura y el rol tiene permiso `analytics:view`, aunque el árbol de `pages/` no lista explícitamente esa pantalla. Se considera necesaria y se incluye.
- La ruta `/industrializacion/rfq/:id/editar` existe, aunque el árbol de páginas no muestra `RfqEditPage.tsx`. Se asume una misma pantalla reutilizable para crear y editar RFQs con modo `create` y modo `edit`.
- La ruta `/compras/proveedores` y la ruta `/compras/admin/proveedores` no cumplen la misma función. La primera se interpreta como explorador operativo para seleccionar proveedores; la segunda como gestión administrativa del catálogo.
- El módulo de notificaciones no tiene ruta propia en la propuesta. Se modela como una superficie global accesible desde el shell autenticado.
- Los modales de rechazo, cancelación, desbloqueo, edición con auditoría, extensión y reenvío se consideran parte del mapa de pantallas porque contienen decisiones críticas del negocio.
- La pantalla de detalle de RFQ existe para varios roles, pero su contenido y sus CTAs cambian por estado y permisos. En este documento se describe como una misma pieza conceptual con variantes por rol.

## 3. Principios UX que deben gobernar todo el frontend

### 3.1 UI guiada por estado

El sistema no debe sentirse como un CRUD genérico. La UI debe estar gobernada por el estado de la RFQ y por el rol del usuario:

- El estado actual siempre debe verse en la cabecera con badge, texto y color.
- Las acciones disponibles deben depender del estado y no solo del rol.
- Las restricciones de negocio deben verse de forma explícita. Ejemplo: en `QUOTING` la UI debe comunicar que ya no se puede cancelar.
- Las transiciones automáticas del sistema deben dejar huella visual en timeline, notificaciones y mensajes de actividad.

### 3.2 Aislamiento fuerte por rol

Cada rol necesita su propio shell y su propia sensación de producto:

- Industrialización: enfoque técnico, creación de RFQs, seguimiento y predicción.
- Compras: enfoque táctico y analítico, asignación, benchmark, KPIs y control administrativo.
- Proveedor: experiencia mínima, clara y restringida, orientada a responder RFQs sin exponer información interna.

### 3.3 Auditoría visible

Toda acción administrativa sensible debe pedir contexto y dejar rastro:

- Rechazos con motivo obligatorio.
- Cancelaciones con motivo obligatorio.
- Edición y aprobación por Super Usuario con diff o resumen de cambios.
- Desbloqueos con registro de quién aprobó y cuándo.

### 3.4 Trabajo pesado con archivos y formularios

El frontend debe tratar archivos y validaciones como parte central de la experiencia:

- RFQ no sale de borrador sin PPT, STP y campos técnicos obligatorios.
- La cotización no se envía sin PDF oficial.
- Los límites de tamaño deben verse antes de subir archivos, no solo cuando fallan.
- Los errores deben agruparse en un resumen visible, además de marcar cada campo.

### 3.5 Claridad en puntos de no retorno

Los estados `QUOTING`, `PARTIALLY_QUOTED`, `BENCHMARK_READY` y `EXPIRED` son estados bloqueados para cancelación. La UI debe reforzar eso con:

- Banners persistentes.
- Tooltips o helper text en acciones deshabilitadas.
- Timeline que explique por qué la RFQ ya está institucionalmente comprometida.

## 4. Shells y superficies transversales

### 4.1 Public Auth Shell

Aplica a `/login` y `/auth/callback`.

- Debe ser muy simple y no parecer parte del workspace operativo.
- Debe distinguir autenticación interna SSO/AD de autenticación externa JWT para proveedores.
- Debe soportar loading, redirección automática, error de callback y sesión expirada.

### 4.2 Internal App Shell

Aplica a Industrialización y Compras.

- Sidebar persistente con navegación por dominio y accesos según permisos.
- Top bar con contexto de usuario, rol, notificaciones y logout.
- Área central con headers de página consistentes.
- Sistema de breadcrumbs para pantallas de detalle, benchmark y asignación.
- Los módulos analíticos deben sentirse integrados al shell, no como pantallas aisladas.

### 4.3 Supplier App Shell

Aplica a Proveedor.

- Navegación mínima: Dashboard, RFQs asignadas, Cotizaciones.
- Menos densidad de información.
- Mayor énfasis en plazos, archivos y CTA de cotizar.
- Nunca debe existir navegación a benchmark, analytics internos o catálogos globales.

### 4.4 Centro de notificaciones

Superficie global accesible desde campana o panel lateral.

- Lista de eventos accionables.
- Cada notificación debe llevar a la pantalla exacta donde se resuelve.
- Debe diferenciar notificaciones informativas de pendientes críticos.
- Debe mostrar estado leída/no leída y timestamp.
- Es clave para los flujos `F03`, `F06`, `F08`, `F09`, `F10`, `F11`, `F12` y `F14`.

### 4.5 Modales y overlays críticos

No deben tratarse como detalles menores. Son parte del producto.

- `CancelRfqModal`: motivo obligatorio, impacto visible, confirmación fuerte.
- `RejectWithReasonModal`: para rechazos en aprobaciones.
- `EditAndApproveWorkspace`: vista de revisión con diff, campos editables y auditoría.
- `AssignSuppliersModal` o drawer contextual: cuando la asignación sea rápida desde detalle.
- `UnlockRequestModal`: lo usa proveedor o Compras operativo para pedir reapertura.
- `CloseRfqModal`: confirmación de cierre definitivo.
- `ExtendOrResendModal`: para `EXPIRED` y `BENCHMARK_READY`.
- `FilePreviewOverlay`: para consultar documentos sin perder contexto.

### 4.6 Estados transversales de feedback

Todas las pantallas deben contemplar:

- `LoadingOverlay` para transiciones pesadas.
- `EmptyState` con CTA claro.
- Error en carga inicial.
- Error parcial en widgets.
- Estado sin permisos.
- Validación inline y resumen de errores.
- Toasts para confirmar mutaciones.

### 4.7 Navegación principal por rol

La navegación del shell debe reforzar el modelo mental de cada usuario.

**Industrialización**

- Dashboard
- RFQs
- Predicción
- Analytics
- Admin y Solicitudes solo si es Super Usuario

**Compras**

- Dashboard
- RFQs
- Analytics
- Proveedores
- Admin, Proveedores Admin y Desbloqueos solo si es Super Usuario

**Proveedor**

- Dashboard
- RFQs asignadas
- Cotizaciones

**Regla UX**

- Los links no permitidos no deben mostrarse deshabilitados salvo que exista valor pedagógico explícito. En general deben ocultarse para no contaminar la navegación.

## 5. Flujos maestros que el frontend debe cubrir

Para que el inventario de pantallas sea trazable, se usarán estos identificadores:

| ID | Flujo |
|----|-------|
| `F01` | Autenticación y redirección por rol |
| `F02` | Creación de RFQ por Industrialización base |
| `F03` | Revisión y aprobación interna por Industrialización admin |
| `F04` | Creación y envío directo por Industrialización admin |
| `F05` | Asignación de proveedores por Compras base |
| `F06` | Aprobación o asignación directa por Compras admin |
| `F07` | Cotización de proveedor |
| `F08` | Seguimiento de RFQ en `QUOTING` y `PARTIALLY_QUOTED` |
| `F09` | Benchmark, exportación y cierre |
| `F10` | RFQ vencida, extensión y nuevo ciclo |
| `F11` | Cancelación temprana antes de `QUOTING` |
| `F12` | Solicitud y aprobación de desbloqueo de cotización |
| `F13` | Histórico, auditoría y consulta final |
| `F14` | Notificaciones y navegación contextual |
| `F15` | Flujos de excepción: errores, vacío, permisos y validación |

## 6. Inventario detallado de pantallas

### 6.1 Públicas y compartidas

#### 6.1.1 LoginPage (`/login`) YA EN FIGMA FALTA SEPARAR POR ROL

Participa en: `F01`, `F15`.

**Por qué existe**

- Es la puerta de entrada única para dos tipos de autenticación muy distintos.
- Debe reducir la confusión entre usuarios internos y proveedores externos.

**Qué debe mostrar**

- Bloque para acceso interno vía SSO/AD.
- Bloque para proveedores con JWT.
- Mensajes para sesión expirada, credenciales inválidas y mantenimiento.
- Ayuda mínima sobre a dónde será redirigido el usuario según su rol.

**Bosquejo UI/UX**

- Layout centrado con branding BOCAR sobrio.
- Dos caminos claramente separados: “Acceso interno” y “Acceso proveedor”.
- La opción SSO debe parecer principal para usuarios corporativos.
- La opción de proveedor debe transmitir seguridad y simplicidad.

#### 6.1.2 SSOCallbackPage (`/auth/callback`)

Participa en: `F01`, `F15`.

**Por qué existe**

- La arquitectura contempla callback SSO. Sin esta pantalla no hay cierre consistente del flujo interno.

**Qué debe mostrar**

- Estado de validación de sesión.
- Spinner y mensajes de progreso.
- Error recuperable si el callback falla.

**Bosquejo UI/UX**

- Pantalla casi vacía, centrada, con feedback claro.
- Nunca debe dejar al usuario preguntándose si el sistema se quedó colgado.

#### 6.1.3 UnauthorizedPage (`/401`), NotFoundPage (`/404`) y ErrorPage (`/500`)

Participan en: `F15`.

**Por qué existen**

- La arquitectura define rutas protegidas y manejo de error por código.

**Qué deben mostrar**

- Mensaje claro y específico.
- CTA para volver a dashboard o login.
- En `401`, explicación de que el rol o permiso no permite la acción.
- En `500`, opción de reintentar o reportar.

#### 6.1.4 Notification Center (overlay global)

Participa en: `F03`, `F06`, `F08`, `F09`, `F10`, `F11`, `F12`, `F14`.

**Por qué existe**

- El negocio depende de aprobaciones y eventos temporales. El correo no basta; el frontend necesita un inbox accionable.

**Qué debe mostrar**

- Lista agrupada por criticidad y fecha.
- Mensajes para aprobaciones pendientes, nuevas cotizaciones, benchmark listo, vencimiento, cancelaciones y desbloqueos.
- Deep links a detalle de RFQ, benchmark, solicitudes o cotizaciones.

**Bosquejo UI/UX**

- Drawer lateral derecho.
- Items compactos con icono, estado, mensaje y timestamp.
- Posibilidad de marcar como leída sin perder foco.

### 6.2 Industrialización

#### 6.2.1 Dashboard de Industrialización (`/industrializacion/dashboard`) YA EN FIGMA

Participa en: `F02`, `F03`, `F04`, `F08`, `F09`, `F13`, `F14`.

**Por qué existe**

- Es la ruta por defecto del rol y el centro de operación diaria.
- Debe permitir entender el estado del pipeline sin entrar a tablas completas.

**Qué debe mostrar**

- KPIs de RFQs propias y visibles: borradores, pendientes de aprobación, en cotización, benchmark listo, cerradas.
- RFQs que requieren atención inmediata.
- Atajos a “Crear RFQ” y “Usar predicción”.

**Bosquejo UI/UX**

- Encabezado con saludo contextual y resumen del día.
- Fila superior de cards KPI.
- Sección central con tabla corta de RFQs recientes.
- Panel secundario con notificaciones y recomendaciones.

#### 6.2.2 RFQ List Page (`/industrializacion/rfq`) Incluida en home de industrializacion fucionada con 6.2.1 YA EN FIGMA

Participa en: `F02`, `F03`, `F04`, `F08`, `F09`, `F11`, `F13`.

**Por qué existe**

- Es la vista maestra para buscar y filtrar RFQs desde la óptica técnica.

**Qué debe mostrar**

- Tabla con ID, proyecto, número de parte, estado, fecha requerida, fecha límite, comprador asignado y acciones.
- Filtros por estado, fecha, creador, región, tipo de máquina y texto libre.
- Segmentación clara entre “Mis borradores” y “RFQs institucionales”.

**Bosquejo UI/UX**

- Filtros en barra superior persistente.
- Tabla principal con badges de estado muy visibles.
- Acciones contextuales por fila: editar, ver detalle, ver benchmark, exportar.
- Los borradores ajenos no deben existir visualmente para cumplir la regla de propiedad.

#### 6.2.3 RFQ Create/Edit Page (`/industrializacion/rfq/crear`, `/industrializacion/rfq/:id/editar`) YA EN FIGMA FALTARIA EDITAR

Participa en: `F02`, `F04`, `F11`, `F15`.

**Por qué existe**

- Es la pantalla nuclear de captura técnica.
- Sin una buena UX aquí, todo el flujo posterior se degrada.

**Qué debe mostrar**

- Formulario técnico por secciones: datos base, especificaciones, localización, fechas.
- Dropzones para STP y PPT con límites visibles.
- Resumen de validación.
- Botones de “Guardar borrador” y “Enviar”.

**Bosquejo UI/UX**

- Layout a dos columnas en desktop.
- Columna izquierda para campos.
- Columna derecha para checklist de completitud, archivos cargados y ayuda contextual.
- Barra inferior sticky con acciones primarias.

**Identidad visual y mental del usuario**

- Debe sentirse como un workspace de captura, no como una ficha de seguimiento.
- La jerarquía visual debe estar dominada por inputs, validaciones y progreso de completitud.
- La atención del usuario debe ir a “qué falta llenar” y “qué falta adjuntar”.
- En modo `edit` debe conservar la misma experiencia base, pero mostrando que se está corrigiendo un borrador o una RFQ aún editable, no gestionando el proceso completo.

**Qué no debe dominar esta pantalla**

- No debe tener timeline protagónico.
- No debe tener auditoría como bloque principal.
- No debe mezclar benchmark, progreso de proveedores o KPIs operativos como contenido central.
- No debe parecer una vista de detalle con campos desbloqueados.

**Reglas visibles desde la UI**

- No permitir envío sin campos obligatorios.
- No permitir envío sin PPT y STP.
- Mostrar tamaño máximo antes de la carga.
- `requiredDate` debe ser futura.

#### 6.2.4 RFQ Detail Page de Industrialización (`/industrializacion/rfq/:id`) 

Participa en: `F03`, `F04`, `F08`, `F09`, `F10`, `F11`, `F13`, `F14`.

**Por qué existe**

- Es la vista única para entender el ciclo de vida de una RFQ.
- Debe cambiar radicalmente según estado y permisos.

**Qué debe mostrar**

- Cabecera con ID, proyecto, estado, creador, fecha requerida y deadline.
- Timeline de estado con transiciones y timestamps.
- Resumen técnico.
- Documentos adjuntos.
- Panel de actividad y auditoría.
- En estados avanzados: progreso de proveedores, cotizaciones recibidas, acceso a benchmark y KPIs.

**Bosquejo UI/UX**

- Header con badge de estado y bloque de CTAs contextuales.
- Tabs o secciones: Resumen, Documentos, Timeline, Cotizaciones, Benchmark, Auditoría.
- Banners especiales por estado.

**Identidad visual y mental del usuario**

- Debe sentirse como un cockpit operativo de seguimiento y decisión.
- La jerarquía visual debe estar dominada por contexto, estado actual, próximos pasos y acciones disponibles.
- El usuario debe entender en segundos qué pasó, en qué etapa va la RFQ y qué acción puede ejecutar según su rol.
- Aunque en algunos estados exista edición, esta debe sentirse como una acción excepcional y controlada, no como el modo natural de la pantalla.

**Qué no debe dominar esta pantalla**

- No debe verse como un formulario largo.
- No debe priorizar inputs sobre contexto y trazabilidad.
- No debe obligar al usuario a recorrer todos los campos como si estuviera creando desde cero.
- No debe depender de una sola columna de captura para comunicar el estado del proceso.

**Comportamiento por estado**

- `DRAFT`: el creador edita o elimina.
- `PENDING_INTERNAL_APPROVAL`: creador ve solo lectura; admin aprueba, rechaza, edita o cancela.
- `PENDING`: muestra que Compras debe asignar proveedores.
- `QUOTING`: muestra “punto de no retorno”.
- `PARTIALLY_QUOTED`: agrega comparativo parcial y avance por proveedor.
- `BENCHMARK_READY`: habilita benchmark completo y exportación.
- `EXPIRED`: muestra decisión pendiente entre cerrar o extender.
- `CLOSED` y `CANCELLED`: solo lectura con razón final.

**Diferenciación explícita entre Create/Edit y Detail**

- `Create/Edit` responde a la pregunta: “¿cómo capturo o corrijo esta RFQ?”.
- `Detail` responde a la pregunta: “¿qué está pasando con esta RFQ y qué debo decidir ahora?”.
- `Create/Edit` prioriza inputs, validaciones, checklist y CTA de guardado/envío.
- `Detail` prioriza estado, timeline, documentos, actividad, auditoría y CTAs contextuales.
- `Create/Edit` es principalmente un espacio de producción de información.
- `Detail` es principalmente un espacio de lectura operativa, seguimiento y toma de decisiones.

#### 6.2.5 Prediction Page (`/industrializacion/prediccion`)  Falta JSON octavo

Participa en: `F02`, `F04`, `F09`.

**Por qué existe**

- La propuesta incluye el requisito RF-22 y el permiso `prediction:use`.

**Qué debe mostrar**

- Formulario para evaluar costo estimado usando parámetros técnicos.
- Posibilidad de cargar una RFQ existente como contexto.
- Resultado de predicción con rango, desglose y nivel de confianza.
- Relación visual entre predicción y cotizaciones reales cuando existan.

**Bosquejo UI/UX**

- Formulario a la izquierda, resultado a la derecha.
- `ConfidenceIndicator` visible y comprensible.
- Llamado claro a usar la predicción como apoyo, no como decisión final.

#### 6.2.7 Admin Dashboard de Industrialización (`/industrializacion/admin`)

Participa en: `F03`, `F11`, `F13`, `F14`.

**Por qué existe**

- Es la home del Super Usuario de Industrialización y su bandeja de aprobación.

**Qué debe mostrar**

- Cola de RFQs en `PENDING_INTERNAL_APPROVAL`.
- RFQs cancelables en estados tempranos.

**Bosquejo UI/UX**

- Panel superior con conteos de pendientes críticos.
- Tabla de aprobaciones con acceso directo al detalle.
- Panel lateral de eventos recientes.

#### 6.2.8 Requests Management Page (`/industrializacion/admin/solicitudes`)

Participa en: `F03`, `F13`, `F14`.

**Por qué existe**

- La propuesta exige gestión de solicitudes de cambio técnico.
- Sin esta pantalla, el rol admin no tiene workspace dedicado para solicitudes laterales del proceso.

**Qué debe mostrar**

- Tabla de solicitudes con tipo, RFQ, solicitante, fecha, estado y prioridad.
- Vista de comparación entre datos originales y cambio solicitado.
- Comentarios, motivo y resolución.

**Bosquejo UI/UX**

- Lista a la izquierda y detalle a la derecha.
- Fuerte énfasis en diff visual.
- Acciones de aprobar, rechazar o devolver con comentario.

### 6.3 Compras

#### 6.3.1 Dashboard de Compras (`/compras/dashboard`) 

Participa en: `F05`, `F06`, `F08`, `F09`, `F10`, `F12`, `F14`.

**Por qué existe**

- Es la ruta por defecto del área que concentra más decisiones tácticas.

**Qué debe mostrar**

- KPIs de RFQs por asignar, en cotización, benchmark listo, vencidas.
- Resumen de respuesta de proveedores.
- Atajos a asignación, benchmark y desbloqueos.

**Bosquejo UI/UX**

- Dashboard más denso y operacional que el de Industrialización.
- Cards KPI arriba, tabla central, widgets laterales

#### 6.3.2 RFQ List Page de Compras (`/compras/rfq`)

Participa en: `F05`, `F06`, `F08`, `F09`, `F10`, `F11`, `F13`.

**Por qué existe**

- Es la cola operativa principal para tomar RFQs pendientes y seguir las que ya están corriendo.

**Qué debe mostrar**

- Tabla con información técnica resumida, estado, creador, proveedores asignados, progreso de cotizaciones y vencimiento.
- Filtros por estado, prioridad, región, tipo de máquina y deadline.
- Acciones contextuales: asignar, ver detalle, ver benchmark, cerrar, extender.

**Bosquejo UI/UX**

- Filtros robustos.
- Columna de progreso por proveedor.
- Marcadores visuales para RFQs cercanas a vencimiento.

#### 6.3.3 RFQ Detail Page de Compras (`/compras/rfq/:id`)

Participa en: `F05`, `F06`, `F08`, `F09`, `F10`, `F11`, `F12`, `F13`, `F14`.

**Por qué existe**

- Es la vista comercial-operativa equivalente al detalle técnico de Industrialización.

**Qué debe mostrar**

- Resumen técnico suficiente para seleccionar proveedores.
- Lista de proveedores propuestos o asignados.
- Estado de cotizaciones.
- Acceso a benchmark cuando aplique.

**Bosquejo UI/UX**

- Header con acciones de alto impacto.
- Columna principal para progreso comercial.
- Columna secundaria para contexto técnico y documentos.
- Banners de negocio en estados bloqueados o vencidos.

#### 6.3.4 Supplier Selection Page (`/compras/rfq/:id/asignar`)

Participa en: `F05`, `F06`, `F10`.

**Por qué existe**

- La selección de proveedores no debe vivir en un modal pobre; es una tarea de decisión compleja.

**Qué debe mostrar**

- Resumen técnico de la RFQ.
- Selector de proveedores con búsqueda, filtros y comparación.
- Lista de proveedores seleccionados.
- Diferencia clara entre “enviar para aprobación” y “notificar directamente” según rol.

**Bosquejo UI/UX**

- Tres zonas claras.
- Contexto RFQ arriba.
- Catálogo y sugerencias al centro.
- Bandeja de seleccionados en lateral sticky.

**Comportamiento por rol**

- Compras base: CTA “Enviar para aprobación”.
- Compras admin: CTA “Notificar proveedores e iniciar plazo”.

#### 6.3.5 Benchmark Page (`/compras/benchmark/:rfqId`)

Participa en: `F08`, `F09`, `F13`.

**Por qué existe**

- Cuando hay 4+ cotizaciones válidas el proceso cambia de captura a análisis comparativo.

**Qué debe mostrar**

- Tabla comparativa completa de cotizaciones.
- KPIs de proveedores.
- Indicadores de precio, tiempo de entrega y outliers.
- Exportación a Excel.
- CTAs de cierre o reenvío a más proveedores.

**Bosquejo UI/UX**

- Header con resumen de RFQ y acciones.
- Tabla ancha con columnas congeladas.
- Panel superior o lateral con scorecards por proveedor.
- Tooltips para métricas complejas.

**Nota funcional**

- En `PARTIALLY_QUOTED` debe existir comparativo parcial, pero puede vivir dentro del detalle. El benchmark completo se reserva para `BENCHMARK_READY`.

#### 6.3.7 Supplier Catalog Explorer (`/compras/proveedores`)

Participa en: `F05`, `F06`, `F10`.

**Por qué existe**

- Compras necesita un catálogo operativo reutilizable para decidir a quién invitar.

**Qué debe mostrar**

- Tabla o cards con capacidades, región, desempeño, especialidad y estado.
- Filtros avanzados.
- Entrada directa desde la pantalla de asignación.

**Bosquejo UI/UX**

- Debe sentirse como una librería de proveedores, no como un CRUD admin.
- Resaltar atributos útiles para matching.

#### 6.3.8 Admin Dashboard de Compras (`/compras/admin`)

Participa en: `F06`, `F08`, `F09`, `F10`, `F11`, `F12`, `F14`.

**Por qué existe**

- Es el command center del Super Usuario de Compras.

**Qué debe mostrar**

- Aprobaciones pendientes de asignación.
- Solicitudes de desbloqueo.
- RFQs con benchmark listo esperando cierre o reenvío.
- Acceso a reglas de alertas y notificaciones operativas.

**Bosquejo UI/UX**

- Vista tipo control tower.
- Panels muy accionables.
- Prioridad visual a colas pendientes y temporizadores.
- La configuración de alertas puede vivir como panel lateral o subsección interna del workspace admin, sin exigir una ruta nueva si el producto quiere mantenerlo compacto.

#### 6.3.9 Supplier Management Page (`/compras/admin/proveedores`)

Participa en: `F06`, `F13`.

**Por qué existe**

- El admin de Compras gestiona el catálogo y necesita una superficie distinta al explorador operativo.

**Qué debe mostrar**

- Tabla maestra con alta, baja, edición, estatus y datos de contacto.
- Señales de disponibilidad, autenticación y vigencia.
- Configuración relacionada con alertas y notificaciones si el producto la concentra aquí.

**Bosquejo UI/UX**

- Pantalla densa, orientada a administración.
- Filtros, acciones bulk y side panel de edición.

#### 6.3.10 Unlock Requests Page (`/compras/admin/desbloqueos`)

Participa en: `F12`, `F13`, `F14`.

**Por qué existe**

- El desbloqueo de cotización es un subflujo crítico con permiso explícito y audit trail obligatorio.

**Qué debe mostrar**

- Cola de solicitudes con RFQ, proveedor, fecha, motivo y urgencia.
- Resumen de la cotización bloqueada.
- Historial de cambios previos.
- Acciones de aprobar o rechazar.

**Bosquejo UI/UX**

- Lista de solicitudes y panel de inspección detallada.
- Acción principal muy clara y con confirmación.
- Siempre mostrar qué implica desbloquear la cotización para que el proveedor pueda editar

### 6.4 Proveedor

#### 6.4.1 Dashboard de Proveedor (`/proveedor/dashboard`)

Participa en: `F01`, `F07`, `F08`, `F12`, `F13`, `F14`.

**Por qué existe**

- Debe funcionar como inbox personal y centro de tareas, no como dashboard analítico.

**Qué debe mostrar**

- RFQs asignadas por prioridad y días restantes.
- Cotizaciones enviadas y bloqueadas.
- Estado de solicitudes de desbloqueo.
- Accesos a “Cotizar ahora” y “Ver historial”.

**Bosquejo UI/UX**

- Layout simple.
- Lista de tareas urgentes arriba.
- Menos densidad visual que en roles internos.

#### 6.4.2 Assigned RFQ List Page (`/proveedor/rfq`)

Participa en: `F07`, `F08`, `F13`.

**Por qué existe**

- El proveedor necesita una cola clara de RFQs asignadas, sin ruido adicional.

**Qué debe mostrar**

- Tabla con ID RFQ, proyecto, fecha límite, estado de cotización propia y acciones.
- Indicadores de tiempo restante.
- Filtros básicos por estado y búsqueda.

**Bosquejo UI/UX**

- Tabla ligera.
- Colores de prioridad por tiempo.
- CTA por fila: ver RFQ o cotizar.

#### 6.4.3 RFQ Detail Page de Proveedor (`/proveedor/rfq/:id`)

Participa en: `F07`, `F08`, `F12`, `F13`, `F15`.

**Por qué existe**

- El proveedor necesita entender la RFQ antes de cotizar, descargar documentos y consultar su propio estado.

**Qué debe mostrar**

- Resumen técnico suficiente.
- Descarga de PPT y STP.
- Deadline y countdown.
- Estado de su cotización.
- CTA a cotizar o solicitar desbloqueo si ya envió.

**Bosquejo UI/UX**

- Header simple con deadline dominante.
- Sección de documentos muy visible.
- Nunca mostrar otros proveedores, comparativos o métricas internas.

#### 6.4.4 Quotation Form Page (`/proveedor/rfq/:rfqId/cotizar`)

Participa en: `F07`, `F12`, `F15`.

**Por qué existe**

- Es la pantalla principal del proveedor y debe minimizar errores de captura.

**Qué debe mostrar**

- Secciones de precios, dimensiones del molde, tiempos de entrega y PDF oficial.
- Resumen de validación.
- Confirmación fuerte antes de enviar.

**Bosquejo UI/UX**

- Formulario seccionado con navegación interna.
- Resumen sticky del RFQ en lateral.
- PDF upload claro y obligatorio.
- CTA final con advertencia: al enviar, la cotización queda bloqueada.

**Reglas visibles desde la UI**

- Todos los precios positivos.
- `deliveryWeeks` entero entre 1 y 52.
- PDF obligatorio y máximo 15 MB.

#### 6.4.5 Quotation History Page (`/proveedor/cotizaciones`)

Participa en: `F12`, `F13`.

**Por qué existe**

- El proveedor necesita consultar lo ya enviado y detectar rápido qué cotizaciones están bloqueadas o pendientes de desbloqueo.

**Qué debe mostrar**

- Tabla con RFQ, fecha de envío, estado, deadline original y última actualización.
- Filtros por estado.
- Acceso al detalle de cotización.

**Bosquejo UI/UX**

- Vista simple y confiable.
- Estados de bloqueo y desbloqueo muy claros.

#### 6.4.6 Quotation Detail Page (`/proveedor/cotizaciones/:id`)

Participa en: `F12`, `F13`.

**Por qué existe**

- Es la superficie correcta para revisar una cotización enviada y pedir desbloqueo.

**Qué debe mostrar**

- Resumen de valores enviados.
- PDF adjunto.
- Timeline de envío y bloqueos/desbloqueos.
- Estado de la solicitud de desbloqueo si existe.
- CTA a solicitar desbloqueo cuando aplique.

**Bosquejo UI/UX**

- Vista read-only clara.
- Bloque de auditoría compacta.
- Reutilizable como destino de notificaciones de desbloqueo.

## 7. Subsuperficies clave dentro de pantallas de detalle

Estas superficies no son rutas distintas, pero son imprescindibles para que los flujos queden completos.

### 7.1 Timeline de RFQ

- Debe existir en el detalle interno y, de forma simplificada, en el detalle del proveedor.
- Debe mostrar estado, fecha, actor y motivo cuando exista.
- Rechazos, cancelaciones y desbloqueos deben quedar registrados.

### 7.2 Panel de documentos

- Debe distinguir archivos técnicos de archivos de cotización.
- Debe mostrar tamaño, fecha de carga y acción de descarga.
- En proveedor solo se muestran los documentos técnicos permitidos y su propio PDF.

### 7.3 Panel de progreso de proveedores

- Solo visible para roles internos.
- Debe mostrar asignados, cotizaciones recibidas, excluidos por vencimiento y proveedores adicionales re-enviados.
- Es central en `QUOTING`, `PARTIALLY_QUOTED`, `BENCHMARK_READY` y `EXPIRED`.

### 7.4 Panel de auditoría

- Obligatorio para admins y útil en histórico.
- Debe exponer motivos, comentarios, quién aprobó, rechazó, canceló o desbloqueó.

## 8. Flujos detallados

### 8.1 `F01` Autenticación y redirección por rol

**Secuencia**

1. El usuario llega a `LoginPage`.
2. Elige acceso interno SSO o acceso proveedor.
3. El sistema autentica.
4. Si es SSO, pasa por `SSOCallbackPage`.
5. Se resuelve el rol y se redirige a la ruta por defecto.

**Pantallas involucradas**

- `LoginPage`
- `SSOCallbackPage`
- Dashboard del rol correspondiente
- `UnauthorizedPage` si el rol no cumple

**Notas UX**

- El usuario no debe escoger manualmente a qué dashboard ir.
- Cualquier error de sesión debe volver a `/login` con mensaje claro.

### 8.2 `F02` Creación de RFQ por Industrialización base

**Secuencia**

1. Entra a dashboard o lista de RFQs.
2. Abre `RFQ Create/Edit Page`.
3. Captura datos técnicos.
4. Sube STP y PPT.
5. Guarda en `DRAFT`.
6. Reabre y corrige si hace falta.
7. Envía para aprobación.
8. La RFQ cambia a `PENDING_INTERNAL_APPROVAL`.
9. El usuario queda en vista read-only del detalle.

**Pantallas involucradas**

- Dashboard de Industrialización
- RFQ List Page
- RFQ Create/Edit Page
- RFQ Detail Page
- Notification Center

**Puntos críticos**

- El borrador es privado del creador.
- El estado debe cambiar de inmediato en UI.
- Si faltan campos o archivos, el envío se bloquea.

### 8.3 `F03` Aprobación interna por Industrialización admin

**Secuencia**

1. El admin recibe notificación de RFQ pendiente.
2. Entra desde Admin Dashboard o Notification Center.
3. Abre `RFQ Detail Page`.
4. Decide entre aprobar, rechazar, editar y aprobar, o cancelar.
5. Si rechaza, vuelve a `DRAFT` con motivo y el creador corrige.
6. Si aprueba, la RFQ pasa a `PENDING`.
7. Si edita y aprueba, la UI debe registrar diff y auditoría.
8. Si cancela, la RFQ pasa a `CANCELLED`.

**Pantallas involucradas**

- Admin Dashboard de Industrialización
- Requests Management Page
- RFQ Detail Page
- Modales de rechazo, cancelación y edición con auditoría

**Puntos críticos**

- Rechazo y cancelación exigen motivo.
- La auditoría debe verse antes de confirmar “Editar y aprobar”.

### 8.4 `F04` Creación y envío directo por Industrialización admin

**Secuencia**

1. El admin crea la RFQ en la misma pantalla de captura.
2. Guarda como `DRAFT` o la envía directo.
3. Al enviar, la RFQ pasa a `PENDING` sin aprobación interna.
4. Compras recibe notificación.

**Pantallas involucradas**

- RFQ Create/Edit Page
- RFQ Detail Page
- Admin Dashboard de Industrialización
- Notification Center

**Puntos críticos**

- La UI debe explicar que el envío directo ocurre por privilegio de admin.

### 8.5 `F05` Asignación de proveedores por Compras base

**Secuencia**

1. Compras ve RFQ en `PENDING`.
2. Entra al detalle o a la lista.
3. Abre `Supplier Selection Page`.
4. Revisa sugerencias IA y catálogo.
5. Selecciona proveedores.
6. Envía la selección para aprobación.
7. La RFQ pasa a `PENDING_PURCHASING_APPROVAL`.
8. Si el admin rechaza, vuelve a `PENDING` y el comprador reasigna.

**Pantallas involucradas**

- Dashboard de Compras
- RFQ List Page de Compras
- RFQ Detail Page de Compras
- Supplier Selection Page
- Notification Center

**Puntos críticos**

- Debe quedar claro que el usuario base no notifica directamente a proveedores.
- El loop de rechazo debe ser muy visible para evitar pérdida de contexto.

### 8.6 `F06` Aprobación o asignación directa por Compras admin

**Secuencia**

1. El admin recibe una RFQ en `PENDING_PURCHASING_APPROVAL` o actúa sobre una RFQ en `PENDING`.
2. Abre detalle o pantalla de asignación.
3. Puede aprobar, rechazar, editar proveedores y aprobar, cancelar o asignar directo.
4. Si se aprueba o asigna directo, la RFQ pasa a `QUOTING`.
5. Se notifican proveedores y empieza el plazo de 10 días hábiles.

**Pantallas involucradas**

- Admin Dashboard de Compras
- RFQ Detail Page de Compras
- Supplier Selection Page
- Modales de rechazo, cancelación y edición con auditoría

**Puntos críticos**

- La UI debe presentar este paso como punto de compromiso institucional.
- Antes de confirmar, debe verse el mensaje de “ya no se podrá cancelar”.

### 8.7 `F07` Cotización de proveedor

**Secuencia**

1. El proveedor ve la RFQ asignada en dashboard o lista.
2. Abre detalle.
3. Descarga documentos técnicos.
4. Entra a `Quotation Form Page`.
5. Captura precios, dimensiones, tiempos y PDF.
6. Envía la cotización.
7. La cotización queda bloqueada.
8. La RFQ puede pasar a `PARTIALLY_QUOTED` por transición automática.

**Pantallas involucradas**

- Dashboard de Proveedor
- Assigned RFQ List Page
- RFQ Detail Page de Proveedor
- Quotation Form Page
- Quotation Detail Page

**Puntos críticos**

- No debe existir benchmark ni información de otros proveedores.
- El bloqueo tras enviar debe comunicarse claramente.

### 8.8 `F08` Seguimiento en `QUOTING` y `PARTIALLY_QUOTED`

**Secuencia**

1. Roles internos monitorean la RFQ desde detalle y dashboard.
2. El sistema recibe la primera cotización y cambia a `PARTIALLY_QUOTED`.
3. Compras e Industrialización reciben notificación.
4. Si siguen entrando cotizaciones, la vista de progreso se actualiza.
5. Si se alcanzan 4 cotizaciones válidas, pasa a `BENCHMARK_READY`.
6. Si vence el plazo antes de eso, pasa a `EXPIRED`.

**Pantallas involucradas**

- Dashboard de Industrialización
- Dashboard de Compras
- RFQ Detail Page de Industrialización
- RFQ Detail Page de Compras
- Notification Center

**Puntos críticos**

- El cambio de estado automático debe reflejarse sin ambigüedad.
- El detalle debe mostrar progreso por proveedor y countdown.

### 8.9 `F09` Benchmark, exportación y cierre

**Secuencia**

1. La RFQ entra a `BENCHMARK_READY`.
2. Compras e Industrialización reciben notificación.
3. Los usuarios internos abren `Benchmark Page` o el detalle.
4. Analizan cotizaciones, KPIs y diferencias.
5. Exportan a Excel si lo requieren.
6. Un admin decide cerrar RFQ o reenviar a más proveedores.

**Pantallas involucradas**

- Benchmark Page
- RFQ Detail Page de Compras
- RFQ Detail Page de Industrialización
- Analytics pages

**Puntos críticos**

- El benchmark debe ser la mejor pantalla de análisis del producto.
- El export debe ser visible pero no competir con las decisiones principales.

### 8.10 `F10` RFQ vencida, extensión y nuevo ciclo

**Secuencia**

1. La RFQ expira por plazo.
2. Los roles internos ven `EXPIRED` en dashboard y detalle.
3. Compras admin evalúa si cerrar o extender.
4. Si extiende, selecciona nuevos proveedores.
5. La RFQ regresa a `QUOTING`.

**Pantallas involucradas**

- Dashboard de Compras
- RFQ Detail Page de Compras
- RFQ Detail Page de Industrialización
- Supplier Selection Page
- ExtendOrResendModal

**Puntos críticos**

- Debe verse que no es una cancelación sino una extensión de ciclo.
- La UI debe preservar el histórico de cotizaciones ya recibidas.

### 8.11 `F11` Cancelación temprana antes de `QUOTING`

**Secuencia**

1. Un admin detecta una RFQ inválida, duplicada o errónea.
2. Desde detalle, dashboard o flujo de aprobación inicia cancelación.
3. El modal exige motivo.
4. La RFQ pasa a `CANCELLED`.
5. Todos los involucrados reciben notificación.
6. El detalle queda en solo lectura con motivo visible.

**Pantallas involucradas**

- RFQ Detail Page
- Admin dashboards
- CancelRfqModal
- Notification Center

**Puntos críticos**

- Solo disponible en `DRAFT`, `PENDING_INTERNAL_APPROVAL`, `PENDING` y `PENDING_PURCHASING_APPROVAL`.
- En estados bloqueados la acción debe verse deshabilitada con explicación.

### 8.12 `F12` Solicitud y aprobación de desbloqueo

**Secuencia**

1. La cotización ya enviada queda bloqueada.
2. Proveedor o Compras operativo detecta necesidad de corrección.
3. Desde `Quotation Detail Page` o `RFQ Detail Page de Compras` se abre `UnlockRequestModal`.
4. Se captura motivo.
5. Compras admin recibe la solicitud.
6. En `Unlock Requests Page` aprueba o rechaza.
7. Si aprueba, la cotización vuelve a ser editable.
8. Todo queda auditado.

**Pantallas involucradas**

- Quotation Detail Page
- RFQ Detail Page de Compras
- UnlockRequestModal
- Unlock Requests Page
- Quotation Form Page si el desbloqueo fue aprobado

**Puntos críticos**

- La UI debe diferenciar “solicitud enviada” de “cotización desbloqueada”.
- Debe quedar visible quién autorizó el desbloqueo.

### 8.13 `F13` Histórico, auditoría y consulta final

**Secuencia**

1. Una RFQ llega a `CLOSED` o `CANCELLED`.
2. Los usuarios con permiso acceden desde listas, histórico o notificaciones.
3. El detalle se muestra en solo lectura.
4. Se consultan benchmark, exportaciones, motivos y auditoría según rol.

**Pantallas involucradas**

- RFQ List Page
- RFQ Detail Page
- Benchmark Page
- Quotation History Page
- Quotation Detail Page

**Puntos críticos**

- El histórico no debe permitir acciones mutables.
- Debe conservar el contexto completo del proceso.

### 8.14 `F14` Notificaciones y navegación contextual

**Secuencia**

1. Una transición relevante genera email e in-app notification.
2. El usuario abre Notification Center.
3. Selecciona la alerta.
4. El frontend lo lleva a la pantalla exacta con el CTA listo para resolver.

**Pantallas involucradas**

- Notification Center
- Todos los dashboards
- Todas las pantallas de detalle y solicitudes

**Puntos críticos**

- Las notificaciones deben tener copy accionable y no genérico.
- El deep link debe evitar que el usuario tenga que buscar manualmente la RFQ.

### 8.15 `F15` Flujos de excepción

**Casos que deben existir**

- Formulario RFQ incompleto.
- Archivo demasiado grande o tipo inválido.
- PDF faltante en cotización.
- Deadline vencido mientras el proveedor navega.
- Ruta sin permiso.
- Error del servidor.
- Lista vacía de RFQs o cotizaciones.
- Benchmark aún no disponible.

**Superficies involucradas**

- Error pages
- ValidationSummary
- Toasts
- EmptyState
- Banners de deadline y bloqueo

## 9. Cobertura por estado de RFQ

| Estado | Pantalla dueña principal | Pantallas secundarias | Usuario que actúa |
|--------|---------------------------|------------------------|-------------------|
| `DRAFT` | RFQ Create/Edit Page | RFQ List, RFQ Detail | Creador |
| `PENDING_INTERNAL_APPROVAL` | RFQ Detail Page | Admin Dashboard Ind., Requests Management | Industrialización admin |
| `PENDING` | RFQ Detail de Compras | RFQ List Compras, Supplier Selection | Compras base o admin |
| `PENDING_PURCHASING_APPROVAL` | RFQ Detail de Compras | Admin Dashboard Compras | Compras admin |
| `QUOTING` | RFQ Detail de Compras / Industrialización | Dashboard internos, RFQ Detail proveedor, Quotation Form | Sistema + proveedores |
| `PARTIALLY_QUOTED` | RFQ Detail de Compras | RFQ Detail Ind., dashboards, comparativo parcial | Sistema + proveedores |
| `BENCHMARK_READY` | Benchmark Page | RFQ Detail, dashboards, analytics | Admins para cierre o reenvío |
| `EXPIRED` | RFQ Detail de Compras | Dashboard Compras, Supplier Selection | Compras admin |
| `CLOSED` | RFQ Detail read-only | Benchmark, listas, histórico | Nadie |
| `CANCELLED` | RFQ Detail read-only | listas, dashboards, notificaciones | Nadie |

## 10. Cobertura por rol

### 10.1 Industrialización base

- Dashboard
- RFQ List
- RFQ Create/Edit
- RFQ Detail
- Prediction
- Analytics/KPIs
- Notification Center

### 10.2 Industrialización admin

- Todo lo anterior
- Admin Dashboard
- Requests Management
- Modales de aprobación, rechazo, cancelación y edición con auditoría

### 10.3 Compras base

- Dashboard
- RFQ List
- RFQ Detail
- Supplier Selection
- Benchmark
- Analytics
- Supplier Catalog Explorer
- Notification Center
- UnlockRequestModal

### 10.4 Compras admin

- Todo lo anterior
- Admin Dashboard
- Supplier Management
- Unlock Requests Page
- Modales de cancelación, edición con auditoría, extensión y reenvío

### 10.5 Proveedor

- Dashboard
- Assigned RFQ List
- RFQ Detail
- Quotation Form
- Quotation History
- Quotation Detail
- UnlockRequestModal

## 11. Checklist de completitud para diseño y construcción

- Existe una pantalla o superficie clara para cada ruta definida en la arquitectura.
- Cada estado de RFQ tiene al menos una pantalla dueña y CTAs congruentes.
- Cada rol ve únicamente la información permitida.
- Los puntos de no retorno son visibles.
- Los motivos obligatorios se piden en el momento correcto.
- Las transiciones automáticas del sistema tienen reflejo en UI.
- Los modales críticos no esconden información relevante.
- El proveedor nunca ve benchmark ni cotizaciones ajenas.
- El histórico preserva auditoría, motivos y timeline.
- Los dashboards sirven como centros de acción, no solo como vitrinas de métricas.

## 12. Conclusión operativa

El frontend necesario para esta arquitectura no se reduce a “listas, formularios y detalles”. En realidad exige un sistema de pantallas orientado a estados, con shells distintos por rol, módulos analíticos, workspaces de aprobación, superficies de auditoría, subflujos laterales como desbloqueos y un centro de notificaciones accionable.

Si se construyen todas las pantallas y superficies descritas aquí, el frontend cubre el flujo completo desde autenticación hasta histórico final, incluyendo aprobaciones, asignación, cotización, benchmark, vencimiento, cancelación, desbloqueo y consulta posterior, sin dejar zonas grises entre negocio y UI.
