# Plan de implementacion: Dashboard de Compras + Lista de RFQ de Compras

## TL;DR
Implementar dos pantallas nuevas de Compras usando los patrones existentes (MainLayout, Header, filtros de analytics) y data mock en servicios dedicados, con foco en densidad operativa, claridad de estado y acciones contextuales por fila.

## Analisis del contexto y requisitos
- Objetivo funcional: entregar el dashboard operativo de Compras y la lista de RFQs con filtros, progreso por proveedor y acciones por fila segun los criterios P0 del backlog.
- Contexto tecnico: React 18 + Vite + TS estricto, Tailwind, arquitectura por features, rutas definidas en [src/app/config/routes.ts](src/app/config/routes.ts).
- Reglas visuales (Frontend Design Pro): UI corporativa B2B, alta densidad legible, Inter, colores BOCAR, evitar estilo demo.
- NFRs sugeridos:
  - Performance: listas con filtrado local y paginacion simple (mock) sin bloquear el render.
  - Accesibilidad basica: focus visible, labels claros, contraste minimo para estados urgentes.
  - Responsivo: 1440, 1024, 768, 390 sin overflow horizontal.

## Evaluacion critica (riesgos, supuestos, gaps)
- Riesgo: no existe sistema de estados RFQ completo en codigo; se necesitara modelar estados y colores para Compras.
- Riesgo: no hay feature purchasing; hay que decidir ubicacion de servicios y tipos sin romper convenciones.
- Supuesto: el Header y MainLayout se mantienen sin sidebar (igual que Industrializacion) hasta que se active navegacion global.
- Gap: no hay componente de menu de acciones compacto; se requiere crear uno liviano o adoptar un patron simple.
- Gap: falta definicion final de filtros (prioridad, region, maquina, deadline); se resolvera con mocks consistentes.

## Opciones arquitectonicas (>=2) con trade-offs
1) Opcion A: Reusar patrones de analytics y construir servicios y tipos en features/analytics + features/rfq
   - Pros: menor tiempo; reutiliza SearchField, FilterSelect, DashboardMetricCard, MonthlyRfqChart.
   - Contras: mezcla semantica de analytics con purchasing; deuda tecnica si crece el dominio Compras.

2) Opcion B: Crear feature purchasing con servicios, tipos y componentes propios, reusando solo UI shared
   - Pros: separacion de dominio clara; escalable para futuras pantallas de Compras.
   - Contras: mas archivos nuevos; mayor costo inicial.

## Recomendacion principal
Elegir Opcion B: feature purchasing (servicios + tipos) y reuso de UI shared/analytics solo donde haga sentido. Gana por claridad de dominio y escalabilidad, manteniendo consistencia visual con piezas existentes.

## Plan de implementacion (pasos, dependencias, timeline)
1) Definir modelos y mocks de Compras (0.5 dia)
   - Crear `src/features/purchasing/types.ts` con:
     - `PurchasingDashboardMetric`, `PurchasingDashboardRow`, `PurchasingWidgetItem`.
     - `PurchasingRfqRow`, `PurchasingRfqStatus`, `PurchasingRfqAction`.
   - Mapear estados alineados con `ARCHITECTURE_PROPOSAL.md`:
     - DRAFT, PENDING, PENDING_EDIT_REQUEST, QUOTING, PARTIALLY_QUOTED, BENCHMARK_READY, EXPIRED, CLOSED, CANCELLED.
   - Definir colores con tokens BOCAR (`--bocar-*`) y reglas de urgencia (<=48h).

2) Servicio de dashboard Compras (0.5 dia)
   - Crear `src/features/purchasing/services/purchasingDashboardService.ts`:
     - `purchasingUser`, `purchasingMetrics`, `purchasingQueueRows`, `purchasingMonthlySeries`.
     - `urgentDeadlines`, `unlockRequests` (solo admin).
     - Helpers de filtrado (busqueda, estado, proveedor, orden).

3) Pantalla: Dashboard operativo de Compras (1 dia)
   - Archivo: `src/pages/purchasing/DashboardPage.tsx`.
   - Layout: `MainLayout` + `Header areaLabel="Compras"` + contenedor max 1440.
   - Secciones (detalle UI abajo):
     - Cabecera con titulo "Dashboard" y subtitulo operativo.
     - Grid de KPIs (4 cards) + chart mensual (reuso `MonthlyRfqChart`).
     - Cola central de RFQs por asignar (tabla compacta).
     - Columna lateral con widgets: "Vencimientos proximos" y "Desbloqueos" (solo admin).
   - Interacciones:
     - Click en KPI navega a `/compras/rfq?status=<estado>`.
     - CTA "Asignar" en cola navega a `ROUTES.PURCHASING.RFQ_ASSIGN_SUPPLIERS`.
     - Widget de desbloqueos navega a `ROUTES.PURCHASING.ADMIN_UNLOCK_REQUESTS`.

4) Servicio y helpers de lista de RFQs (0.5 dia)
   - Crear `src/features/purchasing/services/purchasingRfqService.ts` con:
     - `purchasingRfqRows`, `filters` y `getFilteredPurchasingRfqRows`.
     - Campos por fila: id, material/proyecto, region, tipoMaquina, deadline, status, progresoProveedores, prioridad, owner.
     - `actionsByStatus` para mostrar acciones habilitadas.

5) Pantalla: Lista de RFQ de Compras (1 dia)
   - Archivo: `src/pages/purchasing/RfqListPage.tsx`.
   - UI de filtros con `SearchField` + `FilterSelect`:
     - Estado, prioridad, region, tipo de maquina, deadline (categoria de rango).
   - Tabla principal con columnas:
     - RFQ, Material/Proyecto, Region, Deadline, Progreso proveedores, Estado, Responsable, Acciones.
   - Acciones por fila como menu compacto (kebab) sin dependencias externas.
   - Resaltado de urgencia (<=48h) con borde o badge `--bocar-error`.
   - Paginacion simple (mock) y estados vacios.

6) Reutilizacion y UI shared (0.5 dia)
   - Reusar `DashboardMetricCard`, `MonthlyRfqChart`, `SearchField`, `FilterSelect`.
   - Crear `PurchasingStatusBadge` o extender `RfqStatusBadge` para estados reales.
   - Crear `ActionMenu` en `src/shared/components/ui/ActionMenu.tsx`.

7) Validacion visual y tecnica (0.5 dia)
   - `npm run build`.
   - Preview y Playwright a 1440/1024/768/390 con screenshots.

## Detalle de pantallas (UI y comportamiento)
### 1) Dashboard operativo de Compras
- Header:
  - Titulo: "Dashboard".
  - Subtitulo: "Cola operativa y prioridades de asignacion".
- KPIs (grid 2x2 en desktop):
  - RFQs por asignar (PENDING), En cotizacion (QUOTING), Benchmark listo (BENCHMARK_READY), Vencidas (EXPIRED).
  - `DashboardMetricCard` con color segun estado.
- Chart mensual:
  - Reusar `MonthlyRfqChart` con serie de RFQs por mes.
- Cola central:
  - Tabla compacta con 6-8 filas, columnas minimas: ID, material, proveedor sugerido, deadline, accion.
  - CTA primaria: "Asignar" en fila PENDING.
  - Empty state institucional: "Sin RFQs por asignar".
- Widgets laterales:
  - "Vencimientos proximos": lista de 3-5 RFQs con contador de dias.
  - "Desbloqueos pendientes" (solo compras_admin): lista con CTA "Atender".
- Responsive:
  - Desktop: 2 columnas (main + sidebar).
  - Tablet: widgets pasan debajo.
  - Mobile: cards apilan, tabla se convierte a tarjetas.

### 2) Lista de RFQ de Compras
- Barra de filtros fija:
  - SearchField + 4-5 FilterSelect (estado, prioridad, region, tipo de maquina, deadline).
- Tabla full-width:
  - Columna progreso proveedores: "2/5 cotizados" solo para QUOTING/PARTIALLY_QUOTED/BENCHMARK_READY.
  - Badge de urgencia en deadline <=48h.
  - Estado con badge corporativo (sin colores decorativos).
- Acciones por fila (menu compacto):
  - PENDING: Asignar, Ver detalle.
  - QUOTING/PARTIALLY_QUOTED: Ver detalle, Extender (admin).
  - BENCHMARK_READY: Ver benchmark, Cerrar (admin).
  - EXPIRED: Cerrar o Extender (admin).
- Estados:
  - Empty: mensaje sobrio + CTA a dashboard.
  - Loading mock: skeleton liviano (opcional).

## Riesgos y mitigaciones
- Riesgo: inconsistencias entre estados mock y reglas reales.
  - Mitigacion: alinear `PurchasingRfqStatus` con `ARCHITECTURE_PROPOSAL.md` y usar labels oficiales.
- Riesgo: acciones visibles para roles incorrectos.
  - Mitigacion: incluir `role` en mock y filtrar acciones por rol en helper.
- Riesgo: layout rompe en mobile por tabla ancha.
  - Mitigacion: vista en tarjetas para <768 y overflow controlado.

## Supuestos y huecos de informacion
- No hay API; los datos son mock y locales.
- El rol del usuario se simula en el servicio para mostrar variantes base/admin.
- La definicion final de filtros (region, tipo de maquina, prioridad) es ficticia hasta confirmar catalogos.

## Verificacion y fuentes (metodo)
- Fuentes: `specs/FRONTEND_BACKLOG.md`, `specs/ARCHITECTURE_PROPOSAL.md`, `Frontend Design Pro`.
- Metodo: lectura de patrones existentes en `features/analytics` y layout actual en `pages/industrializacion`.

## Nivel de confianza
72/100. Limitado por la falta de API real, definicion final de filtros y sistema de permisos.