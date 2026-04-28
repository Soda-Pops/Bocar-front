# Visual Briefs

## 1. Propósito

Este documento convierte las pantallas definidas en `specs/SCREENS_AND_FLOWS.md` en briefs visuales listos para wireframes, mockups hi-fi e imágenes de referencia del frontend.

Cada brief busca responder cinco cosas:

- qué debe sentir el usuario al entrar a la pantalla
- qué pregunta principal debe contestar la UI
- qué bloques deben dominar el layout
- qué acciones deben verse primero
- cómo describir la pantalla para generar un mockup consistente

## 2. Cómo usar este archivo

Este documento está pensado para cuatro usos:

- diseñar wireframes low-fi
- producir mockups hi-fi en Figma
- generar imágenes de referencia con IA
- validar que el futuro frontend en React respete jerarquía y propósito

## 3. Estructura estándar del brief

Cada pantalla incluye:

- `Objetivo visual`: qué trabajo debe hacer la interfaz
- `Usuario y contexto`: quién entra y en qué momento del flujo
- `Pregunta principal`: qué debe entender el usuario en menos de 5 segundos
- `Layout base`: organización espacial de la pantalla
- `Módulos dominantes`: bloques que deben llevar la jerarquía visual
- `CTA principal`: acción más importante
- `Dirección visual`: tono visual y densidad esperada
- `Variantes clave`: estados que deben tener mockups separados
- `Prompt base de mockup`: texto base para generar una imagen de referencia

## 4. Briefs visuales

### 4.1 `6.1.1` LoginPage (`/login`)

- `Objetivo visual`: separar con claridad el acceso interno del acceso de proveedor y transmitir seguridad corporativa.
- `Usuario y contexto`: usuario sin sesión; primera entrada al sistema o regreso por expiración.
- `Pregunta principal`: "¿cómo entro según mi tipo de usuario?".
- `Layout base`: split-screen o composición de dos zonas; lado institucional con branding y valor del producto, lado funcional con el formulario.
- `Módulos dominantes`: logo BOCAR, selector de tipo de acceso, formulario, mensajes de error/expiración.
- `CTA principal`: iniciar sesión.
- `Dirección visual`: sobria, corporativa, muy limpia; más cercana a acceso enterprise que a landing comercial.
- `Variantes clave`: acceso interno, acceso proveedor, error de credenciales, sesión expirada.
- `Prompt base de mockup`: "Enterprise login page for BOCAR RFQ platform, split layout, left side corporate blue branded panel, right side clean white login card, separate access for internal SSO users and suppliers, Spanish labels, calm industrial automotive procurement style, polished React dashboard aesthetic."

### 4.2 `6.1.2` SSOCallbackPage (`/auth/callback`)

- `Objetivo visual`: comunicar procesamiento de autenticación sin generar ansiedad ni parecer error.
- `Usuario y contexto`: usuario interno que viene del SSO.
- `Pregunta principal`: "¿el sistema está validando mi acceso o falló?".
- `Layout base`: pantalla mínima centrada con feedback de progreso.
- `Módulos dominantes`: spinner o indicador de progreso, mensaje de estado, fallback de error.
- `CTA principal`: no aplica en éxito; en error, reintentar o volver al login.
- `Dirección visual`: ultra minimalista, técnica, transitoria.
- `Variantes clave`: validando, redirigiendo, error de callback.
- `Prompt base de mockup`: "Minimal authentication callback screen for enterprise web app, centered status card, subtle spinner, BOCAR branding, Spanish text, modern clean status UI, no distractions, light background, professional system authentication feedback."

### 4.3 `6.1.3` UnauthorizedPage (`/401`), NotFoundPage (`/404`) y ErrorPage (`/500`)

- `Objetivo visual`: explicar con precisión qué pasó y devolver al usuario al flujo correcto.
- `Usuario y contexto`: cualquier usuario que entra a una ruta inválida, sin permiso o con error de servidor.
- `Pregunta principal`: "¿qué pasó y cómo regreso a una ruta útil?".
- `Layout base`: pantalla centrada con código de error, mensaje corto y CTA de salida.
- `Módulos dominantes`: código visual, explicación, CTA a dashboard o login.
- `CTA principal`: volver al dashboard; en `500`, reintentar.
- `Dirección visual`: consistente con el producto, sin dramatismo; debe sentirse parte del sistema.
- `Variantes clave`: 401, 404 y 500 con microcopy distinto.
- `Prompt base de mockup`: "Enterprise error state screens for BOCAR dashboard, three variants 401 unauthorized, 404 not found, 500 server error, centered cards, calm professional UI, Spanish copy, strong hierarchy with code number, return to dashboard button."

### 4.4 `6.1.4` Notification Center (overlay global)

- `Objetivo visual`: funcionar como inbox accionable de eventos críticos del sistema.
- `Usuario y contexto`: usuarios autenticados de roles internos y proveedor, desde cualquier pantalla.
- `Pregunta principal`: "¿qué requiere mi atención ahora y a dónde debo ir?".
- `Layout base`: drawer lateral derecho o panel flotante de altura completa.
- `Módulos dominantes`: lista de notificaciones, filtro por estado, item con timestamp y deep link.
- `CTA principal`: abrir la entidad relacionada.
- `Dirección visual`: compacta, densa, escaneable; más productiva que decorativa.
- `Variantes clave`: sin leer, leída, crítica, informativa, vacía.
- `Prompt base de mockup`: "Right side notification center overlay for enterprise RFQ platform, list of actionable alerts, unread markers, timestamps, compact cards, procurement workflow notifications, Spanish interface, clean blue gray design system."

### 4.5 `6.2.4` RFQ Detail Page de Industrialización (`/industrializacion/rfq/:id`)

- `Objetivo visual`: dar contexto completo del ciclo de vida de la RFQ desde la óptica técnica.
- `Usuario y contexto`: industrialización base o admin consultando una RFQ en cualquier estado.
- `Pregunta principal`: "¿qué está pasando con esta RFQ y qué debo hacer o revisar ahora?".
- `Layout base`: header de estado arriba, cuerpo en tabs o secciones amplias, columna principal para contexto y columna secundaria para acciones/metadata.
- `Módulos dominantes`: cabecera con estado, timeline, resumen técnico, documentos, actividad, auditoría y bloques post-quoting cuando apliquen.
- `CTA principal`: depende del estado; editar, aprobar, rechazar, cancelar, ver benchmark o solo consultar.
- `Dirección visual`: cockpit operativo; fuerte jerarquía por estado y mucha trazabilidad visible.
- `Variantes clave`: `DRAFT`, `PENDING_INTERNAL_APPROVAL`, `QUOTING`, `BENCHMARK_READY`, `EXPIRED`, `CLOSED`.
- `Prompt base de mockup`: "Detailed industrial RFQ tracking page for BOCAR, enterprise dashboard UI, top header with RFQ status badge and metadata, timeline, technical summary, documents panel, audit trail, tabs for benchmark and quotations, Spanish interface, industrial blue and gray visual system."

### 4.6 `6.2.7` Admin Dashboard de Industrialización (`/industrializacion/admin`)

- `Objetivo visual`: concentrar aprobaciones internas y métricas del área en un command center claro.
- `Usuario y contexto`: super usuario de industrialización entrando a su home operativa.
- `Pregunta principal`: "¿qué RFQs requieren decisión inmediata y cómo está el departamento?".
- `Layout base`: dashboard con cards KPI arriba, tabla de pendientes al centro y módulos de actividad lateral o inferior.
- `Módulos dominantes`: pendientes de aprobación, cancelables, métricas departamentales, actividad reciente.
- `CTA principal`: revisar RFQ pendiente.
- `Dirección visual`: administrativa, táctica, muy orientada a cola de trabajo.
- `Variantes clave`: con alta carga de pendientes, con pocas pendientes, vacío.
- `Prompt base de mockup`: "Admin dashboard for industrialization super user in procurement RFQ platform, KPI cards, pending approvals table, department metrics, activity feed, enterprise control center, Spanish labels, polished B2B dashboard."

### 4.7 `6.2.8` Requests Management Page (`/industrializacion/admin/solicitudes`)

- `Objetivo visual`: resolver solicitudes de cambio técnico desde una vista de revisión comparativa.
- `Usuario y contexto`: industrialización admin gestionando solicitudes laterales del proceso.
- `Pregunta principal`: "¿qué se está pidiendo cambiar, por qué y cómo impacta a la RFQ?".
- `Layout base`: master-detail; lista de solicitudes a la izquierda y detalle comparativo a la derecha.
- `Módulos dominantes`: tabla/lista de solicitudes, diff de datos, comentarios, decisión.
- `CTA principal`: aprobar, rechazar o devolver con comentario.
- `Dirección visual`: analítica y comparativa; debe priorizar diferencias y contexto.
- `Variantes clave`: solicitud abierta, en revisión, resuelta.
- `Prompt base de mockup`: "Technical change request management screen for enterprise RFQ app, split layout with request list and detail diff panel, comments and decision actions, Spanish interface, professional industrial workflow design."

### 4.8 `6.3.1` Dashboard de Compras (`/compras/dashboard`)

- `Objetivo visual`: actuar como centro de mando táctico para asignaciones, seguimiento y riesgo operativo.
- `Usuario y contexto`: compras base o admin entrando a su home diaria.
- `Pregunta principal`: "¿qué RFQs requieren intervención hoy y dónde están los riesgos?".
- `Layout base`: KPI cards superiores, tabla central de RFQs activas, widgets laterales o inferiores para desbloqueos y vencimientos.
- `Módulos dominantes`: RFQs por asignar, en cotización, benchmark listo, vencidas, desbloqueos, response rate.
- `CTA principal`: entrar a la RFQ o cola prioritaria.
- `Dirección visual`: más densa que industrialización; fuerte enfoque operacional.
- `Variantes clave`: base user, admin user, alta carga, foco en vencimientos.
- `Prompt base de mockup`: "Purchasing dashboard for BOCAR RFQ system, enterprise operations dashboard, KPI cards, urgent RFQ table, deadline alerts, unlock request widget, supplier response metrics, Spanish interface, clean blue gray design."

### 4.9 `6.3.2` RFQ List Page de Compras (`/compras/rfq`)

- `Objetivo visual`: servir como cola operativa maestra para localizar y accionar RFQs.
- `Usuario y contexto`: compras revisando volumen de RFQs y aplicando filtros.
- `Pregunta principal`: "¿qué RFQ debo abrir o procesar primero?".
- `Layout base`: header con filtros, tabla principal full-width, acciones por fila.
- `Módulos dominantes`: filtros, tabla, badges de estado, columnas de deadline y progreso.
- `CTA principal`: ver detalle o asignar proveedores.
- `Dirección visual`: utilitaria, table-first, altamente escaneable.
- `Variantes clave`: vista estándar, filtrada por vencimiento, filtrada por estado, vacía.
- `Prompt base de mockup`: "Enterprise RFQ list page for purchasing team, advanced filter bar, large data table with status badges, deadlines, supplier progress, row actions, Spanish labels, modern procurement dashboard UI."

### 4.10 `6.3.3` RFQ Detail Page de Compras (`/compras/rfq/:id`)

- `Objetivo visual`: integrar contexto técnico suficiente con decisiones de asignación, cotización y cierre.
- `Usuario y contexto`: compras base o admin inspeccionando una RFQ concreta.
- `Pregunta principal`: "¿cómo va esta RFQ comercialmente y cuál es mi siguiente acción?".
- `Layout base`: header potente con CTAs, cuerpo modular con resumen RFQ, proveedores, progreso, documentos y secciones de soporte.
- `Módulos dominantes`: estado, proveedor asignado/propuesto, avance de cotizaciones, documentos, historial y benchmark cuando aplique.
- `CTA principal`: asignar, aprobar, editar proveedores, cerrar, extender o ver benchmark, según estado.
- `Dirección visual`: decisión comercial con trazabilidad; no debe verse como simple ficha técnica.
- `Variantes clave`: `PENDING`, `PENDING_PURCHASING_APPROVAL`, `QUOTING`, `PARTIALLY_QUOTED`, `BENCHMARK_READY`, `EXPIRED`.
- `Prompt base de mockup`: "Purchasing RFQ detail page in enterprise procurement platform, top status header with contextual actions, supplier panels, quotation progress, technical document sidebar, benchmark access, Spanish interface, serious control room feel."

### 4.11 `6.3.4` Supplier Selection Page (`/compras/rfq/:id/asignar`)

- `Objetivo visual`: permitir selección comparativa de proveedores con bajo esfuerzo cognitivo.
- `Usuario y contexto`: compras base o admin preparando la invitación a proveedores.
- `Pregunta principal`: "¿a quién debo invitar y con qué justificación?".
- `Layout base`: contexto de RFQ arriba, catálogo/sugerencias al centro, bandeja de seleccionados fija a un lado.
- `Módulos dominantes`: resumen RFQ, filtros de proveedores, tarjetas o filas de proveedor, sugerencias IA, lista seleccionada.
- `CTA principal`: enviar para aprobación o notificar directamente.
- `Dirección visual`: workspace de selección; equilibrio entre data-heavy y claridad de decisión.
- `Variantes clave`: comprador base, comprador admin, sin sugerencias, selección avanzada.
- `Prompt base de mockup`: "Supplier selection workspace for enterprise RFQ app, top RFQ summary, searchable supplier catalog, AI recommendation cards, sticky selected suppliers panel, Spanish labels, professional procurement UI."

### 4.12 `6.3.5` Benchmark Page (`/compras/benchmark/:rfqId`)

- `Objetivo visual`: ofrecer la mejor superficie comparativa del producto para evaluar cotizaciones.
- `Usuario y contexto`: compras e industrialización revisando RFQ con benchmark listo.
- `Pregunta principal`: "¿qué proveedor o combinación ofrece la mejor decisión?".
- `Layout base`: header con resumen y acciones, tabla comparativa central, scorecards y filtros complementarios.
- `Módulos dominantes`: tabla benchmark, indicadores por proveedor, exportación, outliers, comparaciones de precio y entrega.
- `CTA principal`: exportar, cerrar RFQ o reenviar a más proveedores.
- `Dirección visual`: analítica, ancha, altamente estructurada; debe soportar mucha comparación horizontal.
- `Variantes clave`: benchmark listo, comparativo parcial, enfoque por proveedor.
- `Prompt base de mockup`: "Quotation benchmark page for BOCAR procurement platform, wide comparison table, supplier score cards, export action, pricing and delivery analytics, Spanish labels, high-end B2B analysis dashboard."

### 4.13 `6.3.7` Supplier Catalog Explorer (`/compras/proveedores`)

- `Objetivo visual`: explorar capacidades de proveedores desde una óptica operativa, no administrativa.
- `Usuario y contexto`: compras buscando candidatos para una RFQ.
- `Pregunta principal`: "¿qué proveedores encajan mejor para esta necesidad?".
- `Layout base`: filtro superior fuerte, grid o tabla híbrida de proveedores, panel de detalle ligero.
- `Módulos dominantes`: capacidades, región, especialidad, desempeño, tags de compatibilidad.
- `CTA principal`: seleccionar o abrir ficha.
- `Dirección visual`: catálogo inteligente; debe sentirse útil para matching.
- `Variantes clave`: vista catálogo, resultados filtrados, vacío.
- `Prompt base de mockup`: "Supplier catalog explorer for enterprise procurement app, filter-rich list of suppliers with capabilities, region, performance tags, clean B2B interface, Spanish labels, selection-oriented design."

### 4.14 `6.3.8` Admin Dashboard de Compras (`/compras/admin`)

- `Objetivo visual`: centralizar aprobaciones, desbloqueos, riesgos de vencimiento y decisiones de cierre.
- `Usuario y contexto`: compras admin entrando a su command center.
- `Pregunta principal`: "¿qué decisiones administrativas no puedo dejar pasar hoy?".
- `Layout base`: dashboard tipo control tower con múltiples paneles jerarquizados por urgencia.
- `Módulos dominantes`: aprobaciones pendientes, desbloqueos, RFQs vencidas, benchmark listo, cancelaciones tempranas, métricas globales.
- `CTA principal`: resolver cola prioritaria.
- `Dirección visual`: muy táctica, densa, panelizada, con jerarquía fuerte por urgencia.
- `Variantes clave`: foco en aprobaciones, foco en vencimientos, foco en desbloqueos.
- `Prompt base de mockup`: "Admin control tower dashboard for purchasing super user, multiple priority panels, pending approvals, unlock requests, expired RFQs, global metrics, Spanish interface, enterprise operations center aesthetic."

### 4.15 `6.3.9` Supplier Management Page (`/compras/admin/proveedores`)

- `Objetivo visual`: administrar el catálogo maestro con claridad, sin confundirlo con la vista operativa de selección.
- `Usuario y contexto`: compras admin manteniendo información maestra de proveedores.
- `Pregunta principal`: "¿qué datos de proveedor debo actualizar o controlar?".
- `Layout base`: tabla administrativa full-width con filtros, acciones bulk y side panel de edición.
- `Módulos dominantes`: tabla maestra, estados, datos de contacto, capacidad, acciones bulk, panel de edición.
- `CTA principal`: crear, editar o cambiar estatus.
- `Dirección visual`: administrativa, robusta y menos narrativa que otras pantallas.
- `Variantes clave`: listado normal, edición abierta, bulk actions.
- `Prompt base de mockup`: "Supplier management admin page for enterprise procurement system, large master table, filters, status chips, bulk actions, edit side panel, Spanish labels, corporate B2B admin UI."

### 4.16 `6.3.10` Unlock Requests Page (`/compras/admin/desbloqueos`)

- `Objetivo visual`: permitir reapertura controlada de cotizaciones enviadas, con máximo contexto y mínimo riesgo de decisión errónea.
- `Usuario y contexto`: compras admin resolviendo solicitudes de desbloqueo de cotización.
- `Pregunta principal`: "¿debo reabrir esta cotización ya enviada y qué impacto tiene hacerlo?".
- `Layout base`: master-detail con lista de solicitudes a la izquierda y panel profundo de inspección a la derecha.
- `Módulos dominantes`: cola de solicitudes, resumen de cotización bloqueada, motivo, historial, bloque de auditoría y CTA de aprobar/rechazar.
- `CTA principal`: aprobar desbloqueo o rechazar solicitud.
- `Dirección visual`: de riesgo controlado; debe transmitir que es una excepción, no una acción rutinaria.
- `Variantes clave`: solicitud pendiente, aprobada, rechazada.
- `Prompt base de mockup`: "Unlock request review page for enterprise quotation system, split layout with request queue and detailed inspection panel, blocked quotation summary, audit trail, approve or reject actions, Spanish interface, controlled risk admin UI."

### 4.17 `6.4.1` Dashboard de Proveedor (`/proveedor/dashboard`)

- `Objetivo visual`: funcionar como inbox de trabajo personal con foco en deadlines y tareas pendientes.
- `Usuario y contexto`: proveedor autenticado entrando a su home.
- `Pregunta principal`: "¿qué RFQs debo atender primero?".
- `Layout base`: lista priorizada de RFQs y cotizaciones, con tarjetas o tabla ligera.
- `Módulos dominantes`: RFQs asignadas, deadlines, cotizaciones bloqueadas, estado de solicitudes de desbloqueo.
- `CTA principal`: cotizar ahora.
- `Dirección visual`: simple, clara, con menos densidad que los roles internos.
- `Variantes clave`: con tareas urgentes, sin RFQs nuevas, con cotizaciones bloqueadas.
- `Prompt base de mockup`: "Supplier dashboard for RFQ platform, simple task-focused layout, assigned RFQs, countdown deadlines, blocked quotations status, Spanish labels, clean vendor portal UI."

### 4.18 `6.4.2` Assigned RFQ List Page (`/proveedor/rfq`)

- `Objetivo visual`: mostrar la cola de RFQs asignadas con prioridad y claridad temporal.
- `Usuario y contexto`: proveedor revisando todo su trabajo abierto.
- `Pregunta principal`: "¿qué RFQs tengo abiertas y cuál vence antes?".
- `Layout base`: tabla ligera o lista de cards compactas con foco en deadline.
- `Módulos dominantes`: ID de RFQ, proyecto, deadline, estado de cotización propia, CTA por fila.
- `CTA principal`: ver RFQ o cotizar.
- `Dirección visual`: muy directa, sin ruido interno.
- `Variantes clave`: lista normal, filtrada por estado, vacía.
- `Prompt base de mockup`: "Assigned RFQ list for supplier portal, lightweight table with deadlines and status, action buttons to open or quote, Spanish interface, practical clean B2B vendor UI."

### 4.19 `6.4.3` RFQ Detail Page de Proveedor (`/proveedor/rfq/:id`)

- `Objetivo visual`: dar al proveedor suficiente información para decidir y cotizar, sin exponer datos internos.
- `Usuario y contexto`: proveedor revisando una RFQ concreta antes o después de cotizar.
- `Pregunta principal`: "¿qué tengo que descargar, entregar y antes de cuándo?".
- `Layout base`: header con deadline dominante, cuerpo con resumen técnico, documentos y bloque de estado propio.
- `Módulos dominantes`: información básica RFQ, descargas, countdown, estado de cotización, CTA.
- `CTA principal`: cotizar o solicitar desbloqueo.
- `Dirección visual`: simple y orientada a ejecución; nada de analytics internos.
- `Variantes clave`: sin cotización enviada, cotización enviada y bloqueada, deadline próximo.
- `Prompt base de mockup`: "Supplier RFQ detail page, clear deadline header, technical summary, downloadable documents, quote status panel, Spanish labels, minimal but polished procurement portal UI."

### 4.20 `6.4.4` Quotation Form Page (`/proveedor/rfq/:rfqId/cotizar`)

- `Objetivo visual`: capturar cotización con mínimo error y máxima claridad sobre el compromiso del envío.
- `Usuario y contexto`: proveedor llenando o reeditando una cotización autorizada.
- `Pregunta principal`: "¿qué datos debo entregar para cotizar correctamente?".
- `Layout base`: formulario por secciones con resumen sticky del RFQ en una columna lateral.
- `Módulos dominantes`: precios, dimensiones, tiempos de entrega, PDF oficial, resumen de validación.
- `CTA principal`: enviar cotización.
- `Dirección visual`: formulario productivo; debe sentirse más guiado que técnico.
- `Variantes clave`: primera captura, validación con errores, cotización reabierta por desbloqueo.
- `Prompt base de mockup`: "Supplier quotation form for enterprise RFQ portal, multi-section form with pricing, dimensions, delivery and PDF upload, sticky RFQ summary sidebar, Spanish interface, clean guided B2B form design."

### 4.21 `6.4.5` Quotation History Page (`/proveedor/cotizaciones`)

- `Objetivo visual`: ofrecer trazabilidad simple de cotizaciones ya enviadas.
- `Usuario y contexto`: proveedor consultando histórico y estado de bloqueo.
- `Pregunta principal`: "¿qué cotizaciones envié y cuál es su estado actual?".
- `Layout base`: tabla simple con filtros superiores.
- `Módulos dominantes`: RFQ, fecha de envío, estado, última actualización, acceso a detalle.
- `CTA principal`: ver detalle.
- `Dirección visual`: ligera, confiable y sin sobrecarga.
- `Variantes clave`: historial con múltiples estados, vacío.
- `Prompt base de mockup`: "Supplier quotation history page, simple enterprise table with sent quotations, statuses, timestamps, detail links, Spanish labels, clean dependable portal interface."

### 4.22 `6.4.6` Quotation Detail Page (`/proveedor/cotizaciones/:id`)

- `Objetivo visual`: permitir revisión fina de la cotización enviada y eventual solicitud de desbloqueo.
- `Usuario y contexto`: proveedor consultando una cotización ya enviada.
- `Pregunta principal`: "¿qué envié exactamente y puedo solicitar corrección?".
- `Layout base`: vista read-only con resumen principal arriba y auditoría/timeline debajo o al costado.
- `Módulos dominantes`: valores enviados, PDF oficial, estado, historial de bloqueo/desbloqueo, CTA de solicitud.
- `CTA principal`: solicitar desbloqueo, cuando aplique.
- `Dirección visual`: clara, formal y más documental que transaccional.
- `Variantes clave`: bloqueada sin solicitud, solicitud pendiente, desbloqueada, rechazada.
- `Prompt base de mockup`: "Supplier quotation detail page, read-only summary of submitted prices and PDF, unlock request status, audit timeline, Spanish interface, polished vendor portal detail view."

## 5. Recomendación de producción de mockups

El orden más eficiente para convertir estos briefs en imágenes es:

1. Login y Notification Center para fijar lenguaje visual base.
2. Dashboard de Compras y Dashboard de Proveedor para fijar densidad por rol.
3. RFQ Detail Industrialización y RFQ Detail Compras para fijar la lógica de detalle.
4. Supplier Selection y Benchmark para fijar las pantallas más complejas.
5. Quotation Form y Unlock Requests para fijar los subflujos críticos.

## 6. Nota de consistencia

Si se generan mockups con IA o en Figma, las pantallas deben compartir:

- misma paleta BOCAR
- misma familia de badges de estado
- mismo lenguaje de tablas, cards y side panels
- mismo sistema de spacing y jerarquía tipográfica
- diferencias reales de densidad según rol, sin romper el sistema visual general
