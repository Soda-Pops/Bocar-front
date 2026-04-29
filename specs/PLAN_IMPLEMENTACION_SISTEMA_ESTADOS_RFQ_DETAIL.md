# Plan de Implementación — Sistema de estados visibles en RFQ Detail con CTAs contextuales por estado y rol

> **Historia de origen:** `specs/FRONTEND_BACKLOG.md` línea 109-174
> **Documento de negocio:** `specs/ARCHITECTURE_PROPOSAL.md` §3 (Ciclo de Vida de RFQs)
> **Guía visual:** `.claude/commands/frontend-design-pro.md`
> **Fecha:** 2026-04-28
> **Prioridad:** P0 (bloquea historias de Detalle de Compras, Detalle de Industrialización y Detalle de Proveedor)

---

## 1. Objetivo

Convertir el componente actual `RfqDetailWorkspace` (hoy estático, con etiquetas "Activo/Review" hardcoded y CTAs "Aprobar / Rechazar" que ya no existen en el negocio) en un **state machine visible y consciente del rol** que:

1. Lee el estado real de la RFQ y el rol del usuario.
2. Resuelve qué CTAs mostrar, cuáles deshabilitar y qué tooltip explicativo aplicar.
3. Renderiza un **header de estado dominante** + **banner contextual** + **bloque de CTAs** coherente con la matriz de la sección 3.4 del documento de arquitectura.
4. Diferencia visual y semánticamente la **cancelación temprana** de la **cancelación tardía** (protocolo especial).
5. Respeta la regla de visibilidad de RFQs `CANCELLED` (solo Super Usuarios).

No incluye:
- Modales completos de cancelación, solicitud de edición ni rechazo (tienen historias propias).
- Timeline de eventos (P1 separada).
- Variantes completas `IndustrializationRfqDetail`, `PurchasingRfqDetail`, `SupplierRfqDetail` (esta historia entrega solo la **shell base** consumida por las tres variantes).

---

## 2. Alcance funcional

### 2.1 Estados cubiertos

Los 9 estados activos del flujo:

| Código | Etiqueta | Tono semántico |
|--------|----------|----------------|
| `DRAFT` | Borrador | Neutral |
| `PENDING` | Pendiente asignación | Review (amarillo) |
| `PENDING_EDIT_REQUEST` | Solicitud de edición | Review + advertencia transitoria |
| `QUOTING` | En cotización | Blue 100 (institucional) |
| `PARTIALLY_QUOTED` | Cotizada parcial | Review (amarillo suave) |
| `BENCHMARK_READY` | Benchmark listo | Done (verde) |
| `EXPIRED` | Vencida | Error (rojo) |
| `CLOSED` | Cerrada | Neutral |
| `CANCELLED` | Cancelada | Error (solo visible a Super Usuarios) |

### 2.2 Roles considerados

`industrializacion`, `industrializacion_admin`, `compras`, `compras_admin`, `proveedor`.

Más una distinción especial: **creador original** (`isCreator`), que activa privilegios independientes del rol (ej. solicitar edición en `PENDING`, ver/editar `DRAFT`).

### 2.3 Acciones (CTAs) habilitadas por esta historia

> Todas las CTAs disparan callbacks; los modales y servicios viven en historias separadas.

| Acción | Estados donde aplica | Roles |
|--------|----------------------|-------|
| `Editar RFQ` | `DRAFT` | Solo creador |
| `Enviar RFQ` | `DRAFT` | Solo creador |
| `Eliminar borrador` | `DRAFT` | Solo creador |
| `Solicitar edición` | `PENDING` | Solo creador |
| `Asignar proveedores` | `PENDING` (habilitada) / `PENDING_EDIT_REQUEST` (deshabilitada con tooltip) | Compras (base + admin) |
| `Aprobar solicitud de edición` | `PENDING_EDIT_REQUEST` | Compras (base + admin) |
| `Rechazar solicitud de edición` | `PENDING_EDIT_REQUEST` | Compras (base + admin) |
| `Ver benchmark` | `BENCHMARK_READY` | Indust., Compras, Indust. Admin, Compras Admin |
| `Cerrar RFQ` | `BENCHMARK_READY`, `EXPIRED` | Solo Super Usuarios |
| `Extender plazo` | `EXPIRED` | Solo `compras_admin` |
| `Cancelar (temprana)` | `DRAFT`, `PENDING`, `PENDING_EDIT_REQUEST` | Solo Super Usuarios |
| `Cancelar (tardía / protocolo especial)` | `QUOTING`, `PARTIALLY_QUOTED`, `BENCHMARK_READY`, `EXPIRED` | Solo Super Usuarios |
| `Crear cotización` | `QUOTING`, `PARTIALLY_QUOTED` (si tiene plazo) | Solo proveedor asignado |

---

## 3. Dirección visual

> Aplicación estricta del brief `frontend-design-pro`: enterprise B2B, sobrio, institucional. **Sin** glassmorphism, sin sombras teatrales, sin emojis decorativos. **Inter** como única tipografía.

### 3.1 Tokens (existentes en `src/styles/themes/bocar.css`)

| Uso | Token | Color |
|-----|-------|-------|
| Fondo de superficie | `--bocar-bg` | `#F5F7FA` |
| Bordes y divisores | `--bocar-border` | `#D9DEE5` |
| Texto principal | `--bocar-text` | `#1A1A1A` |
| Header / CTA primario | `--bocar-blue-100` | `#002E5D` |
| Texto secundario / labels | `--bocar-blue-70`, `--bocar-blue-50` | — |
| Estado en revisión / banner amarillo | `--bocar-review` | `#FFF200` |
| Estado completado / éxito | `--bocar-done` | `#8DC63F` |
| Estado de error / cancelación | `--bocar-error` | `#AA000F` |
| Estado neutral / borrador | `--bocar-neutral` | `#AEB3B8` |

### 3.2 Mapeo de tono por estado

```
DRAFT                  → neutral  (badge gris, sin banner)
PENDING                → review   (badge amarillo, banner informativo si hay solicitud reciente)
PENDING_EDIT_REQUEST   → review + caution (banner amarillo dominante con CTAs inline)
QUOTING                → blue-100 (badge azul institucional, banner advierte protocolo de cancelación tardía)
PARTIALLY_QUOTED       → review suave (badge amarillo claro)
BENCHMARK_READY        → done     (badge verde)
EXPIRED                → error    (badge rojo, banner naranja con CTAs de cierre/extensión)
CLOSED                 → neutral  (badge gris, banner "Solo lectura")
CANCELLED              → error    (badge rojo + bloque de motivo de cancelación)
```

> **Importante:** los colores de estado están reservados para semántica real, no decoración. Un banner amarillo significa "hay algo pendiente"; un banner rojo significa "hay un riesgo o un cierre".

### 3.3 Jerarquía visual del nuevo header

```
┌──────────────────────────────────────────────────────────────────────────┐
│  RFQ-001 · Acero · GM Mexico                  ← link Regresar            │
│  ─────────────────────────────────────────                                │
│  [BADGE GRANDE: PENDIENTE ASIGNACIÓN]                                    │
│  Creada por Ricardo Soto · 20/06/2024 · Plazo: —                         │
│                                                                          │
│  ───────── Banner contextual (solo si hay algo que decir) ─────────      │
│  ⚠️ Hay una solicitud de edición pendiente. La asignación está bloqueada │
│     hasta que sea resuelta.                                              │
│                                                                          │
│  [CTA PRIMARIO]  [CTA SECUNDARIO]   ⋮ acciones secundarias               │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Badge dominante:** altura 28-32px, padding generoso, tipografía 12-13px **bold uppercase tracking 0.06em**.
- **Banner contextual:** ancho completo del workspace, padding `16px 20px`, borde izquierdo de 3px en color del estado, ícono semántico a la izquierda, texto en `--bocar-text`.
- **CTAs:** primarios `--bocar-blue-100`, secundarios outline en `--bocar-blue-100`, destructivos outline en `--bocar-error`. Botones deshabilitados con `opacity 0.5` + `cursor-not-allowed` + tooltip explicativo (no esconder).
- **Densidad:** sin cards anidadas innecesarias. El header vive como bloque abierto sobre `--bocar-bg`.

### 3.4 Banners por estado

| Estado | Banner | Tono |
|--------|--------|------|
| `DRAFT` | "Borrador privado. Solo tú puedes ver y editar esta RFQ." | Neutral, sin ícono de alerta |
| `PENDING` (sin solicitud) | (Sin banner, solo badge) | — |
| `PENDING` (con solicitud reciente del creador) | "Solicitaste edición el [fecha]. Esperando respuesta de Compras." | Amarillo, ícono reloj |
| `PENDING_EDIT_REQUEST` | "Hay una solicitud de edición pendiente con motivo: «[motivo]». La asignación de proveedores está bloqueada." | Amarillo dominante |
| `QUOTING` | "RFQ enviada a proveedores. La cancelación a partir de este punto aplica protocolo especial." | Azul/blue-90, ícono info |
| `PARTIALLY_QUOTED` | "[N] de [M] cotizaciones recibidas. Aún hay proveedores con plazo abierto." | Amarillo claro |
| `BENCHMARK_READY` | "Benchmark listo para análisis y cierre." | Verde claro |
| `EXPIRED` | "Plazo vencido. Cierra la RFQ o extiende el plazo para abrir un nuevo ciclo." | Rojo claro / rosa |
| `CLOSED` | "RFQ cerrada el [fecha] por [usuario]. Solo lectura." | Neutral |
| `CANCELLED` | "RFQ cancelada el [fecha] por [Super Usuario]. Motivo: «[motivo]». Esta RFQ ya no es visible para usuarios base ni proveedores." | Rojo |

### 3.5 Tooltip explicativos (acciones bloqueadas)

| Caso | Texto |
|------|-------|
| `Asignar` deshabilitado en `PENDING_EDIT_REQUEST` | "Hay una solicitud de edición pendiente de resolución." |
| `Cancelar` (tardía) en QUOTING+ | "Esta cancelación notificará a todos los proveedores y generará una RFQ de reemplazo." (No es un bloqueo, es advertencia previa al click.) |
| `Solicitar edición` no visible | (Se omite del DOM si el usuario no es el creador.) |

---

## 4. Arquitectura técnica

### 4.1 Nuevos archivos

```
src/features/rfq/
├── state/
│   ├── rfqStateMachine.ts          ← enum RfqStatus + matriz actionsByStateAndRole
│   ├── rfqStatusMeta.ts            ← labels, tonos, descripción visual por estado
│   └── rfqActions.ts               ← catálogo de acciones (key, label, tone, icon, requiresConfirmation)
├── hooks/
│   └── useRfqDetail.ts             ← hook que devuelve { rfq, allowedActions, banner, statusMeta }
├── components/
│   └── RfqDetail/
│       ├── RfqStatusHeader.tsx     ← bloque dominante con badge + meta
│       ├── RfqStatusBanner.tsx     ← banner contextual por estado
│       ├── RfqActionBar.tsx        ← CTAs primarios/secundarios + menú overflow
│       ├── RfqStatusBadge.tsx      ← badge grande (variante del existente PurchasingStatusBadge)
│       └── RfqDetailWorkspace.tsx  ← REFACTOR: consume hook + nuevos sub-componentes
└── services/
    └── rfqDetailService.ts         ← mock que devuelve RfqDetailDto por id
```

### 4.2 Tipos clave

```typescript
// src/features/rfq/state/rfqStateMachine.ts

export const RfqStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PENDING_EDIT_REQUEST: 'PENDING_EDIT_REQUEST',
  QUOTING: 'QUOTING',
  PARTIALLY_QUOTED: 'PARTIALLY_QUOTED',
  BENCHMARK_READY: 'BENCHMARK_READY',
  EXPIRED: 'EXPIRED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;

export type RfqStatus = (typeof RfqStatus)[keyof typeof RfqStatus];

export type UserRole =
  | 'industrializacion'
  | 'industrializacion_admin'
  | 'compras'
  | 'compras_admin'
  | 'proveedor';

export type RfqActionKey =
  | 'edit_draft'
  | 'submit_draft'
  | 'delete_draft'
  | 'request_edit'
  | 'assign_suppliers'
  | 'approve_edit_request'
  | 'reject_edit_request'
  | 'view_benchmark'
  | 'close_rfq'
  | 'extend_deadline'
  | 'cancel_early'
  | 'cancel_late'
  | 'create_quotation';

export type RfqActionDescriptor = {
  key: RfqActionKey;
  label: string;
  tone: 'primary' | 'secondary' | 'destructive' | 'warning';
  icon?: 'edit' | 'send' | 'trash' | 'check' | 'x' | 'block' | 'clock' | 'arrow-right';
  requiresConfirmation: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onlyCreator?: boolean;
};

export type ActionMatrixEntry = {
  status: RfqStatus;
  role: UserRole;
  isCreator?: boolean;
  actions: RfqActionKey[];
};
```

### 4.3 Resolución de acciones

```typescript
// Función pura, sin estado
export function resolveAllowedActions(input: {
  status: RfqStatus;
  role: UserRole;
  isCreator: boolean;
  isAssignedSupplier?: boolean;
  hasOpenEditRequest?: boolean;
}): RfqActionDescriptor[]
```

Características:
- Devuelve **todas** las acciones aplicables (visibles), incluyendo las **deshabilitadas** con `disabled: true` y `disabledReason`. La UI decide si renderiza el botón en estado disabled o lo oculta del DOM.
- Convención: acciones **exclusivas del creador** (`request_edit`, `edit_draft`, `submit_draft`, `delete_draft`) se omiten del DOM si el usuario no es creador (regla del backlog: "cualquier otro usuario de Industrialización no la ve").
- Convención: acciones **deshabilitadas por bloqueo de negocio** (ej. `assign_suppliers` en `PENDING_EDIT_REQUEST`) **se renderizan deshabilitadas con tooltip** (regla del backlog escenario 5).

### 4.4 Hook `useRfqDetail`

```typescript
export function useRfqDetail(id: string): {
  rfq: RfqDetail | null;
  loading: boolean;
  error: Error | null;
  allowedActions: RfqActionDescriptor[];
  statusMeta: RfqStatusMeta;
  banner: RfqBannerConfig | null;
  isAccessible: boolean; // false si el rol no tiene visibilidad sobre este estado (ej. base viendo CANCELLED)
};
```

- Combina el rol actual del usuario (en esta etapa hardcoded mediante el mismo patrón actual de `dashboardUser` / `purchasingUser`, hasta que exista auth real) con el dto de la RFQ.
- Si `isAccessible === false`, el page component renderiza un componente de "RFQ no encontrada" en lugar de exponer datos sensibles.

### 4.5 Refactor de `RfqDetailWorkspace`

El componente actual mezcla shell, lógica de asignación y datos hardcoded. La refactorización lo divide:

1. `RfqDetailWorkspace` queda como **shell de detalle** que recibe `rfqId` y compone:
   - `RfqStatusHeader` (badge + título + meta)
   - `RfqStatusBanner` (si aplica)
   - `RfqActionBar` (CTAs)
   - `<children />` para que las variantes futuras (Compras, Industrialización, Proveedor) inyecten su contenido específico.

2. La lógica de selección de proveedores (state `selectedSupplierNames`, `supplierDeadlines`) se **extrae** a `SupplierAssignmentPanel.tsx` (no parte de esta historia, pero el extract es necesario para no dejar lógica muerta).

3. Las constantes hardcoded (`rfqSpecFields`, `selectedSuppliers`, `benchmarkRows`) se mueven a `rfqDetailService.ts` como mock.

> **Nota de scope:** este refactor no rompe la pantalla actual. La intención es que después del cambio se vea casi igual visualmente para `QUOTING`/`Activo`, pero el resto de los estados queden disponibles para QA con `?status=PENDING_EDIT_REQUEST` en la URL.

### 4.6 Hook helper para preview (?status=&role=)

Para permitir QA y validación con Playwright en los 9 estados x 5 roles, el hook acepta overrides desde query params (mismo patrón que el actual `?screen=`):

```
/industrializacion/rfq/RFQ-001?status=PENDING_EDIT_REQUEST&role=compras_admin&creator=false
```

Esta lógica solo aplica en dev/preview (el flag se lee de `import.meta.env.DEV`).

---

## 5. Detalle de pantallas

### 5.1 Pantalla base (cualquier rol, cualquier estado)

**Layout (desktop ≥ 1024px):**

- Container `mx-auto max-w-[1304px] px-8 pt-7 pb-10`.
- Bloque 1: **header con back link** (regresa a la lista del rol activo).
- Bloque 2: **`RfqStatusHeader`** con grid 2 columnas:
  - Columna izquierda: ID + título + descripción corta + meta (creador, fecha de creación, plazo si aplica).
  - Columna derecha: badge grande de estado + segundo badge informativo si aplica (ej. "Cotización tardía").
- Bloque 3 (condicional): **`RfqStatusBanner`** ancho completo.
- Bloque 4: **`RfqActionBar`** con CTAs primarios, secundarios y menú "más acciones" (si > 3 CTAs).
- Bloque 5: contenido específico de la variante (resumen técnico, proveedores, benchmark) — se mantiene la composición actual mientras no se entreguen las variantes.

**Mobile (< 768px):**

- Header colapsa a una sola columna; badge se muestra **debajo** del título, no al lado.
- CTAs se apilan verticalmente, primario arriba, ancho completo.
- Banner mantiene el mismo padding pero el texto baja a 13px.
- Menú "más acciones" siempre como bottom sheet (no dropdown).

### 5.2 Variante por estado — checklist de aceptación visual

Para cada uno de los 9 estados se debe validar (ver §7 Validación con Playwright):

#### 5.2.1 `DRAFT` (vista del creador)

- Badge gris "Borrador".
- Banner neutro: "Borrador privado. Solo tú puedes ver y editar esta RFQ."
- CTAs: `[Editar RFQ]` (primario) · `[Enviar RFQ]` (secundario destacado) · menú overflow con `Eliminar borrador`.
- Si el visor no es el creador → **acceso denegado** (renderizar `RfqAccessDenied` y log).

#### 5.2.2 `PENDING` (Industrialización base, no creador)

- Badge amarillo "Pendiente asignación".
- Sin banner.
- CTAs: ninguna acción (solo lectura). `[Solicitar edición]` **no se renderiza**.

#### 5.2.3 `PENDING` (Industrialización, creador)

- Mismo header, pero CTA `[Solicitar edición]` (secundario) visible.

#### 5.2.4 `PENDING` (Compras base o admin)

- CTA primario: `[Asignar proveedores]`.
- Compras Admin agrega adicionalmente CTA `[Cancelar]` (rojo outline) en menú overflow.

#### 5.2.5 `PENDING_EDIT_REQUEST` (Compras)

- Badge amarillo "Solicitud de edición".
- Banner amarillo dominante con motivo expandible.
- CTAs primarios: `[Aprobar solicitud]` · `[Rechazar solicitud]`.
- CTA `[Asignar proveedores]` **renderizado deshabilitado** con tooltip "Hay una solicitud de edición pendiente de resolución".
- Compras Admin: CTA `[Cancelar]` en menú overflow.

#### 5.2.6 `PENDING_EDIT_REQUEST` (Industrialización, creador)

- Badge amarillo + banner "Tu solicitud de edición está siendo revisada por Compras."
- Sin CTAs accionables.

#### 5.2.7 `QUOTING` (Compras o Indust.)

- Badge azul institucional "En cotización".
- Banner azul claro con ícono info: "RFQ enviada a proveedores. La cancelación a partir de este punto aplica protocolo especial."
- Compras Admin: `[Cancelar con protocolo especial]` (rojo outline) en menú overflow, **etiqueta diferenciada** y modal con confirmación reforzada (modal en otra historia).

#### 5.2.8 `QUOTING` (Proveedor asignado)

- Badge azul "En cotización" + banner con días restantes.
- CTA primario: `[Crear cotización]`.

#### 5.2.9 `PARTIALLY_QUOTED`

- Badge amarillo claro "Cotizada parcial".
- Banner: "[N] de [M] cotizaciones recibidas. Aún hay proveedores con plazo abierto."
- Para Compras Admin: `[Aprobar desbloqueo]` (si aplica) y `[Cancelar con protocolo especial]`.

#### 5.2.10 `BENCHMARK_READY`

- Badge verde "Benchmark listo".
- Banner verde claro: "Benchmark listo para análisis y cierre."
- CTAs: `[Ver benchmark]` (primario) · Super Usuario: `[Cerrar RFQ]` y `[Reenviar a otros proveedores]` · `[Cancelar con protocolo especial]` en overflow.

#### 5.2.11 `EXPIRED`

- Badge rojo "Vencida".
- Banner rojo claro: "Plazo vencido. Cierra la RFQ o extiende el plazo para abrir un nuevo ciclo."
- Compras Admin: `[Cerrar]` (primario) · `[Extender plazo]` (secundario) · `[Cancelar con protocolo especial]` en overflow.

#### 5.2.12 `CLOSED`

- Badge neutro "Cerrada".
- Banner neutro: "RFQ cerrada el [fecha] por [usuario]. Solo lectura."
- Sin CTAs operativos. Indust. Admin / Compras Admin pueden ver `[Exportar datos]` (no implementado en esta historia).
- Proveedor solo ve sus propias cotizaciones (lectura).

#### 5.2.13 `CANCELLED` (solo Super Usuarios)

- **Bloqueo de visibilidad:** si el rol no es `industrializacion_admin` ni `compras_admin`, el page component **redirige a la lista correspondiente con un toast** "RFQ no disponible" (NO renderizar el detalle).
- Para Super Usuario:
  - Badge rojo "Cancelada".
  - Bloque rojo claro con motivo, fecha, autor y referencia a RFQ de reemplazo (si aplica).
  - Banner: "Esta RFQ ya no es visible para usuarios base ni proveedores."
  - Sin CTAs operativos.

---

## 6. Plan de implementación paso a paso

### Paso 1 — Tipos y constantes (sin UI)
1. Crear `src/features/rfq/state/rfqStateMachine.ts` con `RfqStatus` enum, `UserRole`, `RfqActionKey`, `RfqActionDescriptor`.
2. Crear `src/features/rfq/state/rfqStatusMeta.ts` con `RfqStatusMeta` (label, tonos Tailwind, descripción visual).
3. Crear `src/features/rfq/state/rfqActions.ts` con catálogo de acciones (label, tone, icon, requiresConfirmation).
4. Implementar `resolveAllowedActions` (función pura) y cubrir manualmente las 9 entradas de la matriz §3.4.

### Paso 2 — Servicio mock
1. Crear `src/features/rfq/services/rfqDetailService.ts` con `getRfqDetailById(id)` que devuelve un `RfqDetail` mock.
2. Mover los datos hardcoded (`rfqSpecFields`, `uploadedFiles`, `selectedSuppliers`, `benchmarkRows`) a este servicio.
3. Devolver un set de RFQs de prueba con cada uno de los 9 estados (RFQ-001 → DRAFT, RFQ-002 → PENDING, etc.) para QA.

### Paso 3 — Hook `useRfqDetail`
1. Crear `src/features/rfq/hooks/useRfqDetail.ts`.
2. Leer query params (`status`, `role`, `creator`) en dev/preview para overrides.
3. Resolver `allowedActions`, `statusMeta`, `banner`, `isAccessible`.

### Paso 4 — Componentes de UI (átomos)
1. `RfqStatusBadge.tsx` — badge grande (no confundir con el existente `RfqStatusBadge` de Lista, que es más pequeño; este vive en `RfqDetail/`).
2. `RfqStatusBanner.tsx` — banner contextual con variantes neutral/info/warning/danger/success.
3. `RfqActionBar.tsx` — bloque de CTAs con primarios, secundarios y menú overflow (reutiliza `ActionMenu` existente en `shared/components/ui/`).

### Paso 5 — Refactor de `RfqDetailWorkspace`
1. Extraer la lógica de asignación de proveedores a `SupplierAssignmentPanel.tsx` (mantener funcional para el modo `assign` actual).
2. Reescribir `RfqDetailWorkspace` para consumir `useRfqDetail` y componer el shell.
3. Reemplazar el bloque "Solo lectura" hardcoded por `RfqStatusHeader` + `RfqStatusBanner` + `RfqActionBar`.
4. Conservar las secciones existentes (Especificaciones, Archivos, Proveedores, Benchmark) como contenido renderizado debajo del shell.

### Paso 6 — Acceso restringido para CANCELLED
1. En `RfqDetailPage.tsx`, después de la llamada al hook, si `isAccessible === false` → `Navigate` al backHref con `state: { toast: 'RFQ no disponible' }`.
2. Validar también en `RfqListPage` y dashboards (filtrar CANCELLED para no-Super Usuarios; fuera de esta historia, pero documentar dependencia).

### Paso 7 — Validación con Playwright (ver §7).

### Paso 8 — Cierre
1. `npm run build` debe pasar.
2. Marcar la historia como completada en `FRONTEND_BACKLOG.md` con bloque `Estado de implementación` y `Nota de avance`.

---

## 7. Validación con Playwright

> Aplicar el flujo del comando `frontend-design-pro` (sección "Validación con Playwright"): build → preview → screenshots en 4 anchos.

### 7.1 Comandos preliminares

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

### 7.2 Matriz de validación

Para **cada** estado debe revisarse al menos una variante de rol relevante. Total mínimo: **18 capturas** (9 estados × 2 anchos críticos: 1440 y 390), idealmente **36** (4 anchos).

| URL de prueba | Estado | Rol esperado |
|---------------|--------|--------------|
| `/industrializacion/rfq/RFQ-001?status=DRAFT&role=industrializacion&creator=true` | DRAFT | Indust. (creador) |
| `/industrializacion/rfq/RFQ-002?status=PENDING&role=industrializacion&creator=false` | PENDING | Indust. (no creador) |
| `/industrializacion/rfq/RFQ-002?status=PENDING&role=industrializacion&creator=true` | PENDING | Indust. (creador) |
| `/compras/rfq/RFQ-002?status=PENDING&role=compras_admin` | PENDING | Compras Admin |
| `/compras/rfq/RFQ-003?status=PENDING_EDIT_REQUEST&role=compras` | PENDING_EDIT_REQUEST | Compras base |
| `/industrializacion/rfq/RFQ-003?status=PENDING_EDIT_REQUEST&role=industrializacion&creator=true` | PENDING_EDIT_REQUEST | Indust. (creador) |
| `/compras/rfq/RFQ-004?status=QUOTING&role=compras_admin` | QUOTING | Compras Admin |
| `/compras/rfq/RFQ-005?status=PARTIALLY_QUOTED&role=compras_admin` | PARTIALLY_QUOTED | Compras Admin |
| `/compras/rfq/RFQ-006?status=BENCHMARK_READY&role=compras_admin` | BENCHMARK_READY | Compras Admin |
| `/compras/rfq/RFQ-007?status=EXPIRED&role=compras_admin` | EXPIRED | Compras Admin |
| `/compras/rfq/RFQ-008?status=CLOSED&role=compras_admin` | CLOSED | Compras Admin |
| `/compras/rfq/RFQ-009?status=CANCELLED&role=compras_admin` | CANCELLED | Compras Admin (única vista) |
| `/compras/rfq/RFQ-009?status=CANCELLED&role=compras` | CANCELLED | Compras base → debe **redirigir** |

### 7.3 Anchos obligatorios

```bash
# 1440
npx --yes --package @playwright/cli playwright-cli --session ui-check resize 1440 900
# 1024
npx --yes --package @playwright/cli playwright-cli --session ui-check resize 1024 768
# 768
npx --yes --package @playwright/cli playwright-cli --session ui-check resize 768 1024
# 390
npx --yes --package @playwright/cli playwright-cli --session ui-check resize 390 844
```

### 7.4 Checklist por captura

- [ ] Sin overflow horizontal.
- [ ] Badge dominante visible y legible.
- [ ] Banner del estado correcto (color, ícono, texto).
- [ ] CTAs visibles y diferenciados (primario vs secundario vs destructivo).
- [ ] Acciones bloqueadas muestran tooltip al hover (validar en 1440 con `playwright-cli hover`).
- [ ] CANCELLED para no-Super Usuario redirige a la lista con toast.
- [ ] Mobile: CTAs apilados, primario ancho completo, sin truncado de texto.

### 7.5 Criterio de cierre

No dar por terminada la historia hasta que:
- [ ] `npm run build` pasa sin errores.
- [ ] Las 13 URLs de la tabla 7.2 han sido visitadas en 1440 y 390.
- [ ] Compras base no puede ver RFQ CANCELLED (verificado con redirect).
- [ ] Indust. base no creador no ve `[Solicitar edición]` en PENDING.
- [ ] Compras ve `[Asignar]` deshabilitado con tooltip en `PENDING_EDIT_REQUEST`.
- [ ] No quedan referencias a CTAs eliminadas (`Aprobar RFQ`, `Rechazar RFQ`, `Editar y aprobar`).
- [ ] La pantalla mantiene la dirección visual enterprise B2B definida en `frontend-design-pro` (sin AI slop, sin sombras teatrales, sin emojis decorativos en CTAs).

---

## 8. Casos de prueba (para QA y futuros tests automatizados)

| # | Escenario | Resultado esperado |
|---|-----------|--------------------|
| 1 | Compras admin abre RFQ en QUOTING | Banner azul de protocolo especial, CTA `Cancelar` con tooltip diferenciado |
| 2 | Indust. base (no creador) abre RFQ en PENDING | Sin CTAs, solo lectura, sin opción `Solicitar edición` |
| 3 | Indust. base (creador) abre RFQ en PENDING | CTA `Solicitar edición` visible |
| 4 | Compras base abre RFQ en PENDING_EDIT_REQUEST | `Asignar` deshabilitado con tooltip + `Aprobar` y `Rechazar` activos |
| 5 | Compras base intenta abrir RFQ CANCELLED | Redirección a `/compras/rfq` con toast "RFQ no disponible" |
| 6 | Compras admin abre RFQ CANCELLED | Acceso completo, badge rojo, motivo visible, sin CTAs operativos |
| 7 | Proveedor abre RFQ CANCELLED | Redirección a su lista con toast |
| 8 | Proveedor abre RFQ QUOTING | CTA `Crear cotización` (primario), sin acceso a otros proveedores |
| 9 | Compras admin abre RFQ EXPIRED | CTAs `Cerrar` y `Extender`, opción `Cancelar` con protocolo |
| 10 | Cualquier usuario abre RFQ CLOSED | Solo lectura, sin CTAs operativos |
| 11 | Indust. admin (no creador) abre RFQ DRAFT ajena | Acceso denegado (regla creator-only) |

---

## 9. Dependencias y bloqueos

### 9.1 Bloquea
- Historia "Detalle de RFQ específico para Compras con foco en decisión comercial" (línea 293)
- Historia "Detalle de RFQ de Industrialización" (próxima)
- Historia "Vista de detalle del proveedor" (próxima)

### 9.2 Depende de
- **Nada bloqueante.** El hook puede operar con mocks hasta que exista auth real.
- Ideal: existencia del hook `useCurrentUser()` (no existe; se simula con `dashboardUser` / `purchasingUser` actuales).

### 9.3 No incluye (referencias a otras historias)
- Modal de cancelación (historia "Modal de cancelación").
- Modal de solicitud de edición (historia "Solicitud de edición desde estado PENDING").
- Panel de resolución de Compras (historia "Panel de resolución de solicitudes de edición").
- Timeline de eventos (historia P1).

---

## 10. Notas finales para el implementador

- **Nada de cards anidadas.** El header debe vivir como bloque abierto sobre el fondo `--bocar-bg`. Nada de "card grande dentro de card grande" como hace hoy `RfqDetailWorkspace`.
- **Tipografía Inter, sin variantes condensed/extended.** Pesos: 400 cuerpo, 500 labels, 600 títulos y CTAs.
- **Las acciones bloqueadas se renderizan, no se ocultan**, salvo las exclusivas del creador (que sí se omiten del DOM si no es creador).
- **Nunca usar emojis dentro de CTAs.** Sí pueden usarse íconos SVG inline (mismo patrón que `BackArrowIcon` actual).
- **El `?status=` y `?role=` solo se aceptan en `import.meta.env.DEV`.** En producción la fuente de verdad es el dto del servicio + el rol del usuario autenticado.
- **Después de cada cambio significativo, correr `npm run build` y volver a tomar screenshots** en los 4 anchos. Documentar el resultado en la nota de avance del backlog.
