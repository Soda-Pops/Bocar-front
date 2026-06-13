# Historial de Cambios — BOCAR Frontend

> **Versión 1.0 · 2026-06-12 · Equipo Soda-Pops**
> Registro de versiones y cambios significativos del frontend del sistema BOCAR RFQ.
> Los cambios del backend se documentan en el historial del repositorio de backend.

---

## Índice

1. [v1.0.0 — Entrega final](#v100--2026-06-12--entrega-final)
2. [v0.9 — Sprint final: proveedor y chatbot](#v09--2026-06-11--sprint-final-proveedor-y-chatbot)
3. [v0.8 — Integración chatbot y compras](#v08--2026-06-10--integración-chatbot-y-compras)
4. [v0.7 — Estabilización y correcciones](#v07--2026-06-09--estabilización-y-correcciones)
5. [v0.6 — Flujo proveedor y benchmarks](#v06--2026-06-07--flujo-proveedor-y-benchmarks)
6. [v0.5 — Super usuario de Industrialización](#v05--2026-05-22--super-usuario-de-industrialización)
7. [v0.4 — Formulario RFQ completo](#v04--2026-05-15--formulario-rfq-completo)
8. [v0.3 — Área Compras inicial](#v03--2026-04-29--área-compras-inicial)
9. [v0.2 — Estructura y routing base](#v02--2026-04-15--estructura-y-routing-base)
10. [v0.1 — Scaffolding inicial](#v01--2026-04-13--scaffolding-inicial)

---

## v1.0.0 · 2026-06-12 · Entrega final

### Cambios

| Tipo | Descripción |
|------|-------------|
| feat | Traducción completa de todos los textos de la UI al inglés |
| feat | Función `getApiErrorMessage` para manejo centralizado de errores de API |
| fix | Resolución de conflictos en merge de la rama `feature/frontend-superindustrializacion` |
| docs | Creación del conjunto completo de documentación técnica (`docs/`) |
| chore | Limpieza de código y ajustes finales antes de entrega |

### Notas

- Esta versión corresponde a la entrega académica del proyecto.
- La integración con el backend (Django + DRF) se asume completa del lado del contrato de API.
- Las rutas marcadas como "Falta por programar" en `routes.ts` quedan pendientes para iteraciones futuras.

---

## v0.9 · 2026-06-11 · Sprint final: proveedor y chatbot

### Cambios

| Tipo | Descripción |
|------|-------------|
| feat | CTBD auto-fill y sincronización con benchmark para RFQs de tipo Molde y Recorte |
| feat | Auto-fill de campos CTBD desde secciones de desglose de costos (Molde) |
| feat | Pantallas del área Proveedor: detalle de RFQ, detalle de cotización |
| feat | Ocultamiento de fuentes en respuestas del chatbot |
| feat | Actualización del mensaje de bienvenida del chatbot |
| feat | Validación de fechas en formulario de RFQ |
| feat | Auto-fill de N/A en campos de consideraciones al desactivar toggles |
| fix | Manejo de errores de red en peticiones al backend |

### Archivos principales modificados

- `features/rfq/` — lógica de auto-fill CTBD
- `features/chatbot/` — mensaje de bienvenida y fuentes
- `pages/supplier/` — pantallas de proveedor
- `features/rfq/hooks/` — validación de fechas

---

## v0.8 · 2026-06-10 · Integración chatbot y compras

### Cambios

| Tipo | Descripción |
|------|-------------|
| feat | Integración del chatbot con archivos de sección de las RFQs de proveedores |
| feat | Conexión de pantallas del área Compras con datos del backend |
| fix | Corrección de especificación de herramienta en sección de RFQ tipo Recorte |
| feat | Dashboard de Industrialización con KPIs y tabla de RFQs recientes |
| feat | Campo de descripción requerido en formulario de RFQ |
| feat | Botón de eliminación de borrador desde vista de Industrialización |
| feat | Instalación de `react-markdown` con `remark-gfm` para renderizado en chatbot |

### Dependencias agregadas

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `react-markdown` | ^9.x | Renderizado de respuestas del chatbot |
| `remark-gfm` | ^4.x | Soporte de GitHub Flavored Markdown |

---

## v0.7 · 2026-06-09 · Estabilización y correcciones

### Cambios

| Tipo | Descripción |
|------|-------------|
| fix | Correcciones generales de flujo y validaciones en formularios |
| fix | Ajustes en rutas de proveedor y resolución de conflictos de merge |
| feat | Mejoras en el layout del sidebar para los tres roles |

---

## v0.6 · 2026-06-07 · Flujo proveedor y benchmarks

### Cambios

| Tipo | Descripción |
|------|-------------|
| feat | Pantallas del flujo de cotización del proveedor |
| feat | Tabla de benchmark comparativo de cotizaciones para Compras |
| feat | Indicadores de urgencia por color en listas de RFQs |
| feat | Filtros de búsqueda en tabla de RFQs de Compras |
| feat | Modal de desbloqueo de cotización (`UnlockRequestModal`) |

---

## v0.5 · 2026-05-22 · Super usuario de Industrialización

### Cambios

| Tipo | Descripción |
|------|-------------|
| feat | Pantalla del Super Usuario de Industrialización (`/industrializacion/admin`) |
| feat | Flujo de aprobación/rechazo de RFQs con motivo obligatorio (`RejectWithReasonModal`) |
| feat | Banner de estado en detalle de RFQ según el estado actual del ciclo de vida |
| feat | Flujo de "Editar y aprobar" con diff visible entre versiones |
| feat | Gestión de solicitudes de cambio técnico |

---

## v0.4 · 2026-05-15 · Formulario RFQ completo

### Cambios

| Tipo | Descripción |
|------|-------------|
| feat | Implementación de campos técnicos de Industrialización en formulario RFQ |
| feat | Formulario RFQ tipo Molde (`moldDefinition.tsx`) con validación Zod |
| feat | Formulario RFQ tipo Recorte (`trimmingDefinition.tsx`) con validación Zod |
| feat | Checklist de completitud en tiempo real en panel lateral del formulario |
| feat | Carga de archivos STP/PPT con validación de formato y tamaño |
| feat | Guardado de borrador con persistencia entre sesiones |

---

## v0.3 · 2026-04-29 · Área Compras inicial

### Cambios

| Tipo | Descripción |
|------|-------------|
| feat | Pantalla de selección de proveedores para asignación de RFQs |
| feat | Historia de usuario de Compras base: asignación y envío para aprobación |
| feat | Super usuario de Industrialización — primera implementación |

---

## v0.2 · 2026-04-15 · Estructura y routing base

### Cambios

| Tipo | Descripción |
|------|-------------|
| feat | Reestructuración completa del proyecto a arquitectura feature-based |
| feat | `ProtectedRoute` para control de acceso por rol |
| feat | `AuthContext` con validación de sesión contra `GET /auth/me/` |
| feat | `MainLayout` (sidebar + header) y `AuthLayout` (dos paneles de login) |
| feat | Pantalla de detalle de RFQ compartida entre roles |
| feat | Alias de rutas: `@`, `@app`, `@features`, `@pages`, `@layouts`, `@shared` |
| feat | Resolución de conflictos de merge entre ramas de área |
| fix | Alineación de archivos de selección de proveedor a la estructura raíz de `src/` |

---

## v0.1 · 2026-04-13 · Scaffolding inicial

### Cambios

| Tipo | Descripción |
|------|-------------|
| feat | Creación del proyecto con Vite + React + TypeScript |
| feat | Configuración de Tailwind CSS 3.4.x con variables CSS de marca (`bocar.css`) |
| feat | Configuración inicial de `react-router-dom` v7 |
| feat | `package.json` con scripts `dev`, `build`, `preview` |
| feat | Migración desde estructura inicial a estructura de carpetas feature-based |
| docs | `CLAUDE.md` con convenciones del proyecto |
| docs | `specs/SCREENS_AND_FLOWS.md`, `ARCHITECTURE_PROPOSAL.md`, `VISUAL_BRIEFS.md` |

---

## Colaboradores del proyecto

| Nombre | Área principal |
|--------|---------------|
| Equipo Soda-Pops | Desarrollo frontend completo |

> El historial de commits completo está disponible en el repositorio de GitHub:
> `https://github.com/Soda-Pops/Bocar-front`
