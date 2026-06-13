# Documentación Técnica — Sistema Bocar (Frontend)

## Datos de identificación

| Campo | Valor |
|---|---|
| **Título del documento** | Documentación Técnica — Sistema Bocar Frontend |
| **Versión del documento** | 1.0 |
| **Fecha de publicación** | 2026-06-12 |
| **Producto de software** | Bocar Frontend (SPA React), versión 1.0.0 |
| **Organización emisora** | Equipo Soda-Pops — Tecnológico de Monterrey (TEC), 6° semestre |

### Historial de cambios

| Versión | Fecha | Descripción |
|---|---|---|
| 1.0 | 2026-06-12 | Versión inicial |

---

## Índice

1. [Resumen general](#1-resumen-general)
2. [Introducción](#2-introducción)
3. [Objetivo del sistema](#3-objetivo-del-sistema)
4. [Requisitos del sistema](#4-requisitos-del-sistema)
5. [Arquitectura del sistema](#5-arquitectura-del-sistema)
6. [Diseño de módulos](#6-diseño-de-módulos)
7. [Diseño de interfaces y pantallas](#7-diseño-de-interfaces-y-pantallas)
8. [Problemas encontrados](#8-problemas-encontrados)
9. [Pruebas del software](#9-pruebas-del-software)
10. [Recomendaciones](#10-recomendaciones)
11. [Siglas, acrónimos y glosario](#11-siglas-acrónimos-y-glosario)

---

## 1. Resumen general

Bocar Frontend es una **Single Page Application (SPA)** construida con React y TypeScript. Su propósito es proveer la interfaz de usuario del sistema de gestión de RFQs (Request for Quotation — Solicitud de Cotización) de BOCAR, integrando tres áreas de negocio: Industrialización, Compras y Proveedores.

El frontend es el único punto de interacción para los usuarios finales. Implementa control de acceso por rol en la capa de presentación, flujos guiados por el estado de cada RFQ y aislamiento estricto de información entre roles. Actualmente opera con datos hardcodeados en servicios mock; la integración con el backend API REST es el siguiente paso de desarrollo.

---

## 2. Introducción

En entornos de manufactura, la gestión de solicitudes de cotización involucra múltiples áreas con responsabilidades distintas y flujos de aprobación complejos. Sin una interfaz centralizada, este proceso depende de correos electrónicos y hojas de cálculo, lo que dificulta el seguimiento, genera pérdida de información y no mantiene registro de auditoría visible para el usuario.

Bocar Frontend resuelve este problema proveyendo:

- Un **espacio de trabajo diferenciado por rol**: Industrialización, Compras y Proveedor acceden a interfaces distintas, con la información y acciones que corresponden a su función.
- **UI guiada por estado**: cada pantalla cambia sus acciones disponibles según el estado actual del RFQ, haciendo explícitas las restricciones del negocio.
- **Auditoría visible**: el historial de transiciones, ediciones y decisiones es accesible para los roles que tienen permiso.
- **Formularios con validación robusta**: la captura de RFQs y cotizaciones incluye validación en tiempo real con Zod y React Hook Form.

---

## 3. Objetivo del sistema

**Objetivo general:**
Proveer una interfaz de usuario accesible, segura y guiada por estado para el ciclo de vida completo de las solicitudes de cotización de herramental (Mold y Trimming), garantizando aislamiento por rol, trazabilidad visual y flujos de aprobación claros.

**Objetivos específicos:**

- Implementar control de acceso en la capa de presentación: rutas protegidas por rol, navegación condicional y ocultamiento de secciones no permitidas.
- Visualizar el estado de cada RFQ de forma consistente mediante badges, banners y líneas de tiempo.
- Proveer formularios de captura técnica (RFQ) y comercial (cotización) con validación completa antes de permitir el envío.
- Comunicar claramente los puntos de no retorno del proceso (estado EN COTIZACIÓN, cotización bloqueada tras envío).
- Mantener aislamiento estricto del área de Proveedor: sin acceso a benchmark, cotizaciones de competidores ni información interna.
- Soportar flujos de administración para Super Usuarios (aprobaciones, cancelaciones, desbloqueos) con registro de motivo obligatorio.

---

## 4. Requisitos del sistema

### 4.1 Sección Node.js y gestión de paquetes

| Componente | Versión | Rol |
|---|---|---|
| Node.js | ≥ 18.x | Entorno de ejecución para el servidor de desarrollo y build |
| npm | ≥ 9.x | Gestor de paquetes; ejecuta scripts de `package.json` |

### 4.2 Sección React — framework y routing

| Componente | Versión | Rol |
|---|---|---|
| React | 18.3.1 | Biblioteca de interfaz de usuario; gestión del árbol de componentes |
| React DOM | 18.3.1 | Renderizado del árbol React en el DOM del navegador |
| React Router DOM | 7.14.0 | Routing del lado del cliente; rutas anidadas y protegidas por rol |
| react-markdown + remark-gfm | 10.1.0 / 4.0.1 | Renderizado de contenido Markdown en componentes React |

### 4.3 Sección TypeScript — tipado estático

| Componente | Versión | Rol |
|---|---|---|
| TypeScript | 5.6.3 | Tipado estático estricto (`strict: true`); detecta errores en compilación |
| @types/react | 18.3.12 | Tipos de React para TypeScript |
| @types/react-dom | 18.3.1 | Tipos de React DOM para TypeScript |

### 4.4 Sección Vite — build y servidor de desarrollo

| Componente | Versión | Rol |
|---|---|---|
| Vite | 5.4.10 | Servidor de desarrollo con HMR (Hot Module Replacement) y build de producción |
| @vitejs/plugin-react | 4.3.4 | Plugin de Vite para soporte de JSX/TSX y React Fast Refresh |

### 4.5 Sección formularios y validación

| Componente | Versión | Rol |
|---|---|---|
| React Hook Form | 7.72.1 | Gestión de estado de formularios con mínimo re-render |
| Zod | 4.3.6 | Definición de esquemas de validación tipados |
| @hookform/resolvers | 5.2.2 | Adaptador que conecta Zod con React Hook Form |

### 4.6 Sección estilos

| Componente | Versión | Rol |
|---|---|---|
| Tailwind CSS | 3.4.15 | Clases utilitarias de CSS; todos los estilos se definen con clases |
| PostCSS | 8.4.49 | Procesador de CSS requerido por Tailwind |
| Autoprefixer | 10.4.20 | Agrega prefijos de vendor a las propiedades CSS automáticamente |

### 4.7 Sección testing

| Componente | Versión | Rol |
|---|---|---|
| Playwright | 1.59.1 | Framework de pruebas end-to-end (instalado como dependencia de desarrollo; sin configuración activa en v1.0) |

### 4.8 Requisitos de hardware (mínimos para desarrollo)

| Recurso | Mínimo |
|---|---|
| RAM | 4 GB |
| Almacenamiento | 1 GB libres |
| CPU | 2 núcleos |
| Sistema operativo | Windows 10/11, macOS 12+, Ubuntu 20.04+ |

### 4.9 Requisitos de navegador (usuarios finales)

| Navegador | Versión mínima |
|---|---|
| Google Chrome | 90+ |
| Mozilla Firefox | 88+ |
| Microsoft Edge | 90+ |
| Safari | 14+ |

> El frontend no es compatible con Internet Explorer.

---

## 5. Arquitectura del sistema

### 5.1 Visión general

```
┌─────────────────────────────────────────────────────────┐
│                  Navegador del usuario                   │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │              React SPA (Bocar Frontend)            │  │
│  │                                                    │  │
│  │  ┌──────────────┐  ┌────────────┐  ┌───────────┐  │  │
│  │  │  AuthLayout  │  │ MainLayout │  │SupplierSh.│  │  │
│  │  │  (Login)     │  │(Sidebar+   │  │(Proveedor)│  │  │
│  │  └──────────────┘  │ Header)    │  └───────────┘  │  │
│  │                    └────────────┘                  │  │
│  │  ┌───────────┐  ┌──────────┐  ┌────────────────┐  │  │
│  │  │  pages/   │  │features/ │  │   shared/      │  │  │
│  │  │ind/ com/  │  │auth rfq  │  │ components/ui/ │  │  │
│  │  │rfq/ prov/ │  │analytics │  │ utils/ types/  │  │  │
│  │  └───────────┘  │purchasing│  └────────────────┘  │  │
│  │                 │supplier  │                       │  │
│  │                 │chatbot   │                       │  │
│  │                 └──────────┘                       │  │
│  └───────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP / fetch (futuro)
                        ▼
              ┌─────────────────┐
              │  Bocar Backend  │
              │  (Django API)   │
              └─────────────────┘
```

### 5.2 Patrón de autenticación y protección de rutas

La autenticación se gestiona mediante un contexto React (`AuthContext`) que almacena el usuario autenticado y su rol. El flujo es:

1. El usuario accede a `/` (LoginPage).
2. Ingresa credenciales (SSO para internos, usuario/contraseña para proveedores).
3. `AuthContext` valida y almacena el rol detectado.
4. El Router redirige automáticamente al dashboard del rol correspondiente.
5. Las rutas están envueltas en componentes `ProtectedRoute` que verifican el rol antes de renderizar. Si el rol no coincide, redirigen a `/401`.

La sesión persiste en el estado del contexto. Al refrescar la página, el contexto intenta reconstruir la sesión desde el almacenamiento local o cookies (según configuración con el backend).

### 5.3 Estructura de rutas

Todas las rutas están definidas en `src/app/config/routes.ts` mediante el objeto constante `ROUTES`. Hay tres dominios de rutas:

| Dominio | Prefijo | Roles con acceso |
|---------|---------|-----------------|
| Autenticación | `/`, `/login`, `/auth/callback` | Todos (sin autenticar) |
| Industrialización | `/industrializacion/*` | `Ind`, `Ind Admin` |
| Compras | `/compras/*` | `Com`, `Com Admin` |
| Proveedor | `/proveedor/*` | `Pro` |

### 5.4 Layouts

| Layout | Aplica a | Componentes |
|--------|---------|-------------|
| `AuthLayout` | `/login`, `/auth/callback` | Pantalla dividida: branding BOCAR izquierda, formulario derecha |
| `MainLayout` | Todas las rutas internas (Ind y Com) | Sidebar persistente + top bar con notificaciones + área de contenido central |
| Supplier Shell | Todas las rutas `/proveedor/*` | Navegación mínima: Dashboard, RFQs, Cotizaciones |

### 5.5 Aliases de rutas de importación

Configurados en `vite.config.ts`:

| Alias | Carpeta | Uso |
|-------|---------|-----|
| `@` | `src/` | Importaciones absolutas desde la raíz de src |
| `@app` | `src/app/` | Proveedores, Router, config de rutas |
| `@features` | `src/features/` | Lógica de dominio por área |
| `@pages` | `src/pages/` | Páginas routabless |
| `@layouts` | `src/layouts/` | Layouts de la aplicación |
| `@shared` | `src/shared/` | Componentes y utilidades compartidos |

---

## 6. Diseño de módulos

### 6.1 Feature: `auth`

Gestiona el estado de autenticación global. Contiene:

- `AuthContext` y `AuthProvider`: contexto React con el usuario actual, rol, `is_admin` y funciones de login/logout.
- `ProtectedRoute`: componente de orden superior que verifica el rol antes de renderizar una ruta.
- `useAuth`: hook para acceder al contexto desde cualquier componente.

### 6.2 Feature: `rfq`

Núcleo del dominio. Contiene toda la lógica relacionada con RFQs:

| Subcarpeta | Contenido |
|-----------|-----------|
| `components/RfqForm/` | Formulario de creación/edición de RFQ. Dividido por secciones: datos generales, especificaciones Mold (`moldDefinition.tsx`), especificaciones Trimming (`trimmingDefinition.tsx`), carga de documentos. |
| `components/RfqDetail/` | Vista de detalle de RFQ con tabs: Resumen, Documentos, Timeline, Cotizaciones, Benchmark, Auditoría. |
| `components/RfqList/` | Tabla de RFQs con filtros y badges de estado. |
| `components/modals/` | Modales críticos: `EditRequestModal`, `CloseRfqModal`, `ExtendDeadlineModal`, `ConfirmEditModal`, `RequestExtensionModal`. |
| `services/rfqService.ts` | Datos mock de RFQs hardcodeados. Será reemplazado por llamadas al backend. |
| `types.ts` | Tipos TypeScript del dominio RFQ: `RfqStatus`, `RfqType`, `RfqFormData`, etc. |

### 6.3 Feature: `analytics`

Provee KPIs y métricas visuales para Industrialización y Compras:

- `analyticsService.ts`: datos mock de métricas (conteos por estado, histogramas mensuales, tasa de respuesta de proveedores).
- Componentes de gráficas y tarjetas KPI.

### 6.4 Feature: `purchasing`

Lógica específica del área de Compras:

- Selección de proveedores con filtros y sugerencias.
- Vista de benchmark comparativo entre cotizaciones.
- Gestión de solicitudes de desbloqueo.
- Panel de administración de Compras.

### 6.5 Feature: `supplier`

Lógica del área de Proveedor:

- Formulario de cotización (`QuotationFormPage`) con secciones de precios, dimensiones, tiempos y PDF.
- Vista de historial y detalle de cotizaciones.
- Solicitud de desbloqueo desde el detalle de cotización.

### 6.6 Feature: `chatbot`

Asistente conversacional integrado en el shell interno. Permite a los usuarios de Industrialización y Compras consultar información del sistema usando lenguaje natural.

> El chatbot respeta el aislamiento por rol: solo muestra información a la que el usuario tiene acceso.

### 6.7 Módulo `shared`

Código reutilizable en dos o más features:

| Subcarpeta | Contenido |
|-----------|-----------|
| `components/ui/` | Botones, badges, inputs, tablas, modales base, toasts |
| `utils/` | Funciones utilitarias: formateo de fechas, manejo de errores de API, cálculo de días restantes |
| `types/` | Tipos compartidos entre features (estado de RFQ, roles de usuario) |

---

## 7. Diseño de interfaces y pantallas

### 7.1 Inventario de pantallas

| Pantalla | Ruta | Rol | Estado en v1.0 |
|----------|------|-----|---------------|
| LoginPage | `/` | Todos | ✅ Implementada |
| Dashboard Industrialización | `/industrializacion/dashboard` | Ind | ✅ Implementada |
| RFQ Create/Edit | `/industrializacion/rfq/crear` y `/:id/editar` | Ind | ✅ Implementada |
| RFQ Detail (Ind) | `/industrializacion/rfq/:id` | Ind | ✅ Implementada |
| Admin Dashboard Ind | `/industrializacion/admin` | Ind Admin | ✅ Implementada |
| Dashboard Compras | `/compras/dashboard` | Com | ✅ Implementada |
| Admin Dashboard Compras | `/compras/admin` | Com Admin | ✅ Implementada |
| Unlock Requests | `/compras/admin/desbloqueos` | Com Admin | ✅ Implementada |
| RFQ Detail (Com) | `/compras/rfq/:id` | Com | ✅ Implementada |
| Dashboard Proveedor | `/proveedor/dashboard` | Pro | ✅ Implementada |
| Quotation Form | `/proveedor/rfq/:rfqId/cotizar` | Pro | ✅ Implementada |
| RFQ Detail (Pro) | `/proveedor/rfq/:id` | Pro | ✅ Implementada |
| Prediction Page | `/industrializacion/prediccion` | Ind | ⏳ Componente existe, página pendiente |
| Analytics Ind | `/industrializacion/analytics` | Ind | ⏳ Pendiente |
| Admin Requests | `/industrializacion/admin/solicitudes` | Ind Admin | ⏳ Modal existe, página completa pendiente |
| Supplier Catalog | `/compras/proveedores` | Com | ⏳ Pendiente |
| Admin Suppliers | `/compras/admin/proveedores` | Com Admin | ⏳ Pendiente |
| RFQ List (Com) | `/compras/rfq` | Com | ⏳ Pendiente |
| RFQ List (Pro) | `/proveedor/rfq` | Pro | ⏳ Pendiente |
| Quotation List | `/proveedor/cotizaciones` | Pro | ⏳ Pendiente |
| Quotation Detail | `/proveedor/cotizaciones/:id` | Pro | ✅ Implementada |

### 7.2 Formulario de RFQ (`RfqForm`)

El formulario principal de captura técnica usa React Hook Form con resolvers de Zod. Se divide en dos modos:

| Modo | Ruta | Comportamiento |
|------|------|----------------|
| `create` | `/industrializacion/rfq/crear` | Formulario en blanco; CTA: Guardar borrador / Enviar |
| `edit` | `/industrializacion/rfq/:id/editar` | Pre-rellena con datos existentes; mismo CTA |

**Estructura del formulario según tipo de RFQ:**

- **Tipo MOLD** → carga `moldDefinition.tsx`: campos de dimensiones de cavidad, tipo de material, sistema de inyección, número de cavidades.
- **Tipo TRIMMING** → carga `trimmingDefinition.tsx`: campos de dimensiones de recorte, tipo de herramental, fuerza de corte.

Ambos tipos comparten: datos generales, localización, fechas y carga de documentos (STP + PPT).

### 7.3 Validaciones críticas del formulario de RFQ

| Campo | Validación |
|-------|-----------|
| Fecha requerida | Debe ser futura (> hoy) |
| Fecha límite de cotización | Debe ser futura y anterior a la fecha requerida |
| Archivo STP | Obligatorio antes de enviar |
| Archivo PPT | Obligatorio antes de enviar |
| Número de parte | Formato alfanumérico, sin caracteres especiales |

### 7.4 Validaciones críticas del formulario de cotización

| Campo | Validación |
|-------|-----------|
| Todos los precios | Números positivos (> 0) |
| Semanas de entrega | Entero entre 1 y 52 |
| PDF oficial | Obligatorio, formato PDF, máx. 15 MB |

### 7.5 Máquina de estados visual del RFQ

La UI adapta su contenido según el estado del RFQ. Las reglas de presentación son:

| Estado | Banner visible | CTAs disponibles (Ind base) | CTAs disponibles (Ind admin) |
|--------|---------------|---------------------------|------------------------------|
| BORRADOR | — | Editar, Enviar para aprobación | Editar, Enviar a Compras |
| PEND. APROBACIÓN INTERNA | "En revisión" | Ver (solo lectura) | Aprobar, Rechazar, Editar y aprobar, Cancelar |
| PENDIENTE | "En espera de Compras" | Ver (solo lectura) | Ver (solo lectura) |
| EN COTIZACIÓN | "Punto de no retorno — no se puede cancelar" | Ver, Progreso de proveedores | Ver, Progreso de proveedores |
| PARCIALMENTE COTIZADA | "Cotizaciones en progreso" | Ver comparativo parcial | Ver comparativo parcial |
| BENCHMARK LISTO | "Benchmark disponible" | Ver benchmark | Ver benchmark |
| VENCIDA | "Plazo vencido" | Ver (solo lectura) | Ver (solo lectura) |
| CERRADA | "Proceso cerrado" | Ver (solo lectura) | Ver (solo lectura) |
| CANCELADA | "Cancelada — [motivo]" | Ver (solo lectura) | Ver (solo lectura) |

---

## 8. Problemas encontrados

| # | Descripción del problema | Cómo se resolvió |
|---|---|---|
| 1 | Textos de la interfaz mixtos entre español e inglés tras integración de ramas | Se aplicó traducción uniforme a inglés en todos los strings visibles al usuario (`feat: translate all user-facing Spanish text to English`, commit `0451db3`) |
| 2 | Conflicto de merge en strings de error de API al fusionar ramas | Se resolvió el conflicto manteniendo los strings en inglés y consolidando `getApiErrorMessage` (commit `4eee22c`) |
| 3 | La definición del formulario de trimming no reflejaba todos los campos del spec técnico | Se completó `trimmingDefinition.tsx` con los campos faltantes según la especificación |

---

## 9. Pruebas del software

No existe un test runner configurado en v1.0. La validación de correctitud se realiza mediante:

### 9.1 Build de TypeScript

```bash
npm run build
```

Ejecuta `tsc -b` antes del build de Vite. Cualquier error de tipos detiene el proceso. Este es el mecanismo principal de verificación antes de PRs.

### 9.2 Playwright (instalado, sin configuración activa)

`playwright` está declarado como dependencia de desarrollo pero no tiene tests escritos ni configuración de proyecto activa en v1.0. Se recomienda configurarlo para tests end-to-end en trabajos futuros.

### 9.3 Pruebas manuales

El documento [plan_de_pruebas.md](plan_de_pruebas.md) describe los casos de prueba funcionales manuales organizados por módulo y rol. Cubren los flujos principales, flujos alternativos y casos negativos de control de acceso.

### 9.4 Cómo ejecutar el build de verificación

```bash
# Verificar tipos y construir
npm run build

# Previsualizar el build resultante
npm run preview
```

---

## 10. Recomendaciones

**Backend integration:**
Los servicios mock (`*Service.ts`) deben reemplazarse por llamadas reales a la API de Bocar Backend. Se recomienda centralizar el cliente HTTP en `src/shared/utils/apiClient.ts` y manejar el refresh de tokens de forma transparente (interceptor de respuesta para 401).

**Testing:**
Configurar Playwright para pruebas end-to-end automatizadas. Priorizar los flujos críticos: creación de RFQ, envío para aprobación y envío de cotización. Establecer un pipeline de CI que ejecute `npm run build` y los tests de Playwright en cada PR.

**Pantallas pendientes:**
Las rutas marcadas como ⏳ en la sección 7.1 deben completarse antes del lanzamiento. Priorizar: RFQ List de Compras, Supplier Catalog y Analytics de Industrialización, ya que son parte del flujo principal de usuarios internos.

**Gestión de estado global:**
Evaluar la incorporación de una solución de estado global (Zustand o React Query) para reemplazar el estado local de listas y detalles de RFQ cuando se integre el backend. React Query es especialmente recomendable para gestionar el cache de datos del servidor.

**Accesibilidad:**
Agregar atributos ARIA en modales, botones de acción y badges de estado. El sistema actualmente no ha sido auditado para accesibilidad (WCAG 2.1).

**Variables de entorno:**
Agregar un archivo `.env.example` con la URL base del backend (`VITE_API_BASE_URL`) para estandarizar la configuración al integrarlo. Vite expone variables prefijadas con `VITE_` al cliente.

**Seguridad:**
Ver detalles en [security.md](security.md). Los issues prioritarios son: sanitización de inputs en el chatbot y validación de tipos MIME en la carga de archivos.

---

## 11. Siglas, acrónimos y glosario

### Siglas y acrónimos

| Término | Significado |
|---|---|
| **RFQ** | Request for Quotation — Solicitud de Cotización |
| **SPA** | Single Page Application — Aplicación de página única |
| **HMR** | Hot Module Replacement — Recarga de módulos en caliente (Vite) |
| **JSX / TSX** | JavaScript/TypeScript XML — Sintaxis de React para describir UI |
| **DOM** | Document Object Model — Árbol de elementos HTML del navegador |
| **API** | Application Programming Interface — Interfaz de Programación de Aplicaciones |
| **REST** | Representational State Transfer — estilo arquitectónico para APIs sobre HTTP |
| **JWT** | JSON Web Token — formato estándar para tokens de autenticación |
| **SSO** | Single Sign-On — Autenticación corporativa única |
| **KPI** | Key Performance Indicator — Indicador clave de desempeño |
| **MIME** | Multipurpose Internet Mail Extensions — estándar para tipos de archivos |
| **ARIA** | Accessible Rich Internet Applications — atributos de accesibilidad HTML |
| **WCAG** | Web Content Accessibility Guidelines — estándar de accesibilidad web |
| **CI** | Continuous Integration — Integración continua (pipeline de pruebas automáticas) |
| **PR** | Pull Request — Solicitud de revisión de código |
| **HMR** | Hot Module Replacement — actualización de módulos sin recargar la página |
| **CSS** | Cascading Style Sheets — hojas de estilo en cascada |
| **TEC** | Tecnológico de Monterrey |
| **Ind** | Industrialización — rol de usuario del área técnica |
| **Com** | Compras / Comercialización — rol de usuario del área comercial |
| **Pro** | Proveedor — rol de usuario externo proveedor de herramental |

### Glosario

| Término | Definición |
|---|---|
| **Feature** | Módulo de código que agrupa lógica, componentes, servicios y tipos de un dominio específico (ej. `rfq/`, `auth/`). |
| **Layout** | Componente de estructura que define el shell visual de una sección (sidebar, header, área de contenido). |
| **ProtectedRoute** | Componente de React que verifica el rol del usuario antes de renderizar una ruta y redirige si no tiene acceso. |
| **AuthContext** | Contexto global de React que almacena el estado de autenticación (usuario, rol, funciones de login/logout). |
| **Mock / Service mock** | Archivo `*Service.ts` con datos hardcodeados que simula la respuesta de la API mientras no hay backend integrado. |
| **Hook** | Función de React que permite reutilizar lógica con estado en componentes funcionales (ej. `useAuth`, `useRfqForm`). |
| **Resolver (Zod)** | Adaptador que conecta un esquema de validación Zod con React Hook Form. |
| **Badge** | Elemento visual pequeño (etiqueta de color) que indica el estado actual de un RFQ. |
| **Banner** | Franja informativa persistente en la pantalla que comunica el estado del proceso o restricciones importantes. |
| **Deep link** | URL que lleva directamente a una pantalla específica, incluyendo el contexto necesario (ej. ID del RFQ). |
| **Punto de no retorno** | Estado EN COTIZACIÓN a partir del cual la RFQ no puede cancelarse porque los proveedores ya fueron notificados. |
| **Diff** | Vista de cambios entre versiones de una RFQ; generada en ediciones con auditoría por Super Usuario. |
| **Tailwind CSS** | Framework de CSS utilitario; todos los estilos del proyecto se aplican mediante clases predefinidas. |
| **Zod** | Biblioteca de TypeScript para definir esquemas de validación con tipos inferidos automáticamente. |
| **React Hook Form** | Biblioteca de gestión de formularios que minimiza los re-renders y simplifica la validación. |
| **Vite** | Herramienta de build moderna que usa ES Modules nativos para el servidor de desarrollo y Rollup para producción. |
| **Alias de importación** | Atajo configurado en `vite.config.ts` que permite importar módulos con rutas absolutas (ej. `@features/rfq`). |
