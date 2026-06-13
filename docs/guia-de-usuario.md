# Guía de Usuario — Sistema BOCAR RFQ (Frontend)

> **Versión 1.0 · 2026-06-12 · Equipo Soda-Pops**
> Guía práctica para instalar, ejecutar y operar el frontend del sistema BOCAR RFQ.
> Para flujos detallados ver los documentos de área en `docs/`.

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Instalación y ejecución](#2-instalación-y-ejecución)
3. [Acceso al sistema](#3-acceso-al-sistema)
4. [Ciclo de vida de una RFQ](#4-ciclo-de-vida-de-una-rfq)
5. [Rol: Industrialización](#5-rol-industrialización)
6. [Rol: Compras](#6-rol-compras)
7. [Rol: Proveedor](#7-rol-proveedor)
8. [Notificaciones](#8-notificaciones)
9. [Comandos](#9-comandos)
10. [Problemas comunes](#10-problemas-comunes)
11. [Glosario](#11-glosario)

---

## 1. Requisitos previos

| Requisito | Versión mínima | Verificar con |
|-----------|---------------|---------------|
| Node.js | 18 | `node --version` |
| npm | 9 | `npm --version` |
| Git | cualquiera | `git --version` |

> Node.js LTS disponible en [nodejs.org](https://nodejs.org).

---

## 2. Instalación y ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/Soda-Pops/Bocar-front
cd Bocar-front

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```

El servidor queda disponible en **http://localhost:5173**.

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npm run build` | Verifica tipos y genera build de producción |
| `npm run preview` | Vista previa del build de producción |

### Notas de instalación

- Si `npm install` reporta vulnerabilidades, ejecutar `npm audit fix`.
- No usar `--force` en la instalación; puede instalar versiones incompatibles.
- Al clonar en un equipo nuevo, siempre correr `npm install` antes de `npm run dev`.

---

## 3. Acceso al sistema

La pantalla de login está en `http://localhost:5173/`.

| Tipo de usuario | Método de acceso |
|-----------------|-----------------|
| Industrialización y Compras | SSO corporativo — botón "Acceso interno" |
| Proveedores | Usuario y contraseña proporcionados por BOCAR |

Una vez autenticado, el sistema redirige automáticamente al dashboard del rol detectado:

| Rol | Dashboard de entrada |
|-----|---------------------|
| Industrialización (base o admin) | `/industrializacion/dashboard` |
| Compras (base o admin) | `/compras/dashboard` |
| Proveedor | `/proveedor/dashboard` |

Intentar acceder a rutas de otro rol redirige a `/401`. La sesión se mantiene mediante cookies HttpOnly gestionadas por el backend; el frontend nunca almacena tokens.

---

## 4. Ciclo de vida de una RFQ

```
BORRADOR
    │
    ▼
PENDIENTE APROBACIÓN INTERNA  ←  solo si la envía Ind base
    │
    ▼
PENDIENTE
    │
    ▼
PENDIENTE APROBACIÓN COMPRAS  ←  solo si la asigna Com base
    │
    ▼
EN COTIZACIÓN ──► PARCIALMENTE COTIZADA ──► BENCHMARK LISTO ──► CERRADA
    │
    └──► VENCIDA ──► CERRADA  (o regresa a EN COTIZACIÓN con extensión)

CANCELADA  ←  disponible antes de EN COTIZACIÓN
```

| Estado | Color badge | Actor que actúa |
|--------|-------------|----------------|
| BORRADOR | Gris | Industrialización |
| PEND. APROBACIÓN INTERNA | Amarillo | Ind Admin |
| PENDIENTE | Azul | Compras |
| PEND. APROBACIÓN COMPRAS | Amarillo | Com Admin |
| EN COTIZACIÓN | Verde | Proveedores / monitoreo interno |
| PARCIALMENTE COTIZADA | Verde claro | Proveedores / monitoreo interno |
| BENCHMARK LISTO | Púrpura | Com Admin |
| VENCIDA | Naranja | Com Admin |
| CERRADA | Gris oscuro | Solo lectura |
| CANCELADA | Rojo | Solo lectura |

> **Punto de no retorno:** desde EN COTIZACIÓN la RFQ ya no puede cancelarse. El sistema muestra un banner de advertencia en el detalle.

---

## 5. Rol: Industrialización

> Para el flujo completo ver [flujo_industrializacion.md](flujo_industrializacion.md).

### Usuario base (`Ind`)

**Crear una RFQ** — `/industrializacion/rfq/crear`

1. Elegir tipo: **MOLDE** o **RECORTE** (no se puede cambiar una vez iniciado).
2. Completar datos generales: nombre, número de parte, material, región, fechas.
3. Completar especificaciones técnicas según el tipo.
4. Subir archivos obligatorios: **STP** y **PPT**.
5. **Guardar borrador** (en cualquier momento) o **Enviar para aprobación** (requiere checklist 100%).

El panel derecho muestra en tiempo real qué campos faltan. El botón de envío permanece deshabilitado hasta completar todo.

**Otras acciones**

| Acción | Disponible cuando |
|--------|------------------|
| Editar borrador — `/industrializacion/rfq/:id/editar` | Estado BORRADOR |
| Ver detalle y seguimiento — `/industrializacion/rfq/:id` | Cualquier estado |
| Solicitar edición de RFQ enviada | Antes de EN COTIZACIÓN |
| Predicción de costo — `/industrializacion/prediccion` | Siempre |

---

### Super Usuario (`IndAdmin`)

Tiene acceso a todo lo del usuario base, más:

**Panel de admin** — `/industrializacion/admin`

Cola de RFQs en PENDIENTE APROBACIÓN INTERNA. Desde aquí puede:

| Acción | Resultado | Motivo obligatorio |
|--------|-----------|:-----------------:|
| Aprobar | RFQ pasa a PENDIENTE; Compras recibe notificación | — |
| Rechazar | RFQ vuelve a BORRADOR; creador recibe motivo | ✓ |
| Editar y aprobar | Aplica cambios con diff registrado y aprueba | — |
| Cancelar | RFQ pasa a CANCELADA; todos los involucrados notificados | ✓ |

También puede **enviar directo a Compras** (desde el formulario de creación) saltando la cola de aprobación interna, y gestionar solicitudes de cambio en `/industrializacion/admin/solicitudes`.

---

## 6. Rol: Compras

> Para el flujo completo ver [flujo_compras.md](flujo_compras.md).

### Usuario base (`Com`)

**Asignar proveedores** a una RFQ en estado PENDIENTE:

1. Abrir el detalle de la RFQ y hacer clic en **"Asignar proveedores"**.
2. Buscar en el catálogo y agregar proveedores a la bandeja de selección.
3. Hacer clic en **"Enviar para aprobación"** → RFQ pasa a PEND. APROBACIÓN COMPRAS.

> Com base no notifica directamente a proveedores; esa acción es exclusiva del Com Admin.

**Otras acciones**

| Acción | Ruta |
|--------|------|
| Lista de RFQs con filtros | `/compras/rfq` |
| Detalle y seguimiento de cotizaciones | `/compras/rfq/:id` |
| Benchmark comparativo (estado BENCHMARK LISTO) | Desde el detalle de la RFQ |
| Exportar benchmark a Excel | Desde la vista de benchmark |
| Explorador de proveedores | `/compras/proveedores` |

---

### Super Usuario (`ComAdmin`)

Tiene acceso a todo lo del usuario base, más:

**Panel de admin** — `/compras/admin`

Cola de asignaciones pendientes, desbloqueos y RFQs sin resolver. Desde aquí puede:

| Acción | Resultado | Motivo obligatorio |
|--------|-----------|:-----------------:|
| Aprobar asignación | Proveedores notificados; plazo de 10 días hábiles inicia | — |
| Rechazar asignación | RFQ vuelve a PENDIENTE; Com base reasigna | ✓ |
| Editar y aprobar | Modifica la selección y notifica directamente | — |
| Cerrar RFQ | RFQ pasa a CERRADA (solo lectura) | — |
| Extender plazo | Nueva fecha y proveedores; RFQ regresa a EN COTIZACIÓN | — |

> ⚠️ Al aprobar la asignación, los proveedores reciben la RFQ y el plazo comienza. Esta acción no puede deshacerse.

**Gestión de desbloqueos** — `/compras/admin/desbloqueos`

Revisar solicitudes de edición de cotizaciones enviadas por proveedores. Aprobar o rechazar con motivo obligatorio.

**Catálogo de proveedores** — `/compras/admin/proveedores`

Agregar, editar o desactivar proveedores del catálogo maestro.

---

## 7. Rol: Proveedor

> Para el flujo completo ver [flujo_proveedor.md](flujo_proveedor.md).

El proveedor solo ve las RFQs que BOCAR le asignó. No existe acceso a benchmark, cotizaciones de otros proveedores ni información interna.

### Dashboard — `/proveedor/dashboard`

Inbox de tareas con RFQs ordenadas por urgencia (días restantes al deadline).

| Color indicador | Tiempo restante |
|----------------|----------------|
| Verde | Más de 5 días |
| Amarillo | 3 a 5 días |
| Naranja | Menos de 3 días |
| Rojo | Vencida |

### Enviar una cotización — `/proveedor/rfq/:rfqId/cotizar`

| Sección | Campos |
|---------|--------|
| Precios | Precio unitario, precio de herramienta, precio de mano de obra (todos > 0) |
| Dimensiones | Largo, ancho y alto del molde en mm |
| Tiempos | Semanas de entrega (entre 1 y 52) |
| Documento | PDF oficial de cotización (solo PDF, máx. 15 MB) |

> Al confirmar el envío, la cotización queda **bloqueada**. El sistema muestra una advertencia antes de confirmar.

### Solicitar desbloqueo — `/proveedor/cotizaciones/:id`

Si necesita corregir una cotización ya enviada:

1. Abrir el detalle de la cotización.
2. Hacer clic en **"Solicitar desbloqueo"** e ingresar el motivo (obligatorio).
3. Esperar respuesta de Compras. Si es aprobada, el formulario se abre pre-relleno para editar y reenviar.

### Estados de una cotización

| Estado | Significado |
|--------|-------------|
| Enviada (bloqueada) | Recibida por BOCAR; no modificable |
| Solicitud de desbloqueo enviada | Pendiente de respuesta de Compras |
| Solicitud rechazada | Compras no aprobó; la cotización sigue bloqueada |
| Desbloqueada | Compras aprobó; puede editarse y reenviarse |

---

## 8. Notificaciones

El ícono de campana en la barra superior abre el panel de notificaciones con enlaces directos a la pantalla donde se debe actuar.

| Evento | Ind | Com | Pro |
|--------|:---:|:---:|:---:|
| RFQ pendiente de aprobación interna | ✓ admin | — | — |
| RFQ lista para asignación | — | ✓ | — |
| Asignación pendiente de aprobación | — | ✓ admin | — |
| RFQ enviada a proveedores | ✓ | ✓ | ✓ |
| Nueva cotización recibida | ✓ | ✓ | — |
| Benchmark listo | ✓ | ✓ | — |
| RFQ vencida | ✓ | ✓ admin | — |
| Solicitud de desbloqueo recibida | — | ✓ admin | — |
| Cotización desbloqueada | — | — | ✓ |
| RFQ cancelada | ✓ | ✓ | ✓ |

---

## 9. Comandos

| Quiero... | Comando |
|-----------|---------|
| Instalar dependencias | `npm install` |
| Iniciar servidor de desarrollo | `npm run dev` |
| Verificar tipos + build de producción | `npm run build` |
| Previsualizar build de producción | `npm run preview` |
| Exportar esta guía a PDF | `npx md-to-pdf docs/guia-de-usuario.md` |

---

## 10. Problemas comunes

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| `command not found: npm` | Node.js no instalado | Instalar desde nodejs.org |
| `npm install` falla con permisos | Permisos del sistema | Revisar permisos de la carpeta del proyecto |
| Puerto 5173 ocupado | Otro proceso activo | `npm run dev -- --port 3000` |
| Página en blanco | Error de JavaScript | Revisar consola del navegador (F12) |
| `npm run build` falla | Error de TypeScript | Leer el error en terminal y corregir el tipo indicado |
| 404 al recargar en producción | Servidor no sirve SPA | Configurar el servidor para redirigir todo a `index.html` |
| Estilos rotos o sin Tailwind | Tailwind no compiló | Detener y reiniciar `npm run dev` |
| `npx md-to-pdf` falla | Sin conexión la primera vez | Asegurar conexión para que npx descargue el paquete |

---

## 11. Glosario

| Término | Definición |
|---------|------------|
| **RFQ** | Request for Quote — Solicitud de Cotización para un molde o recorte |
| **MOLDE** | Tipo de RFQ para fabricación de moldes de inyección |
| **RECORTE / TRIMMING** | Tipo de RFQ para herramientas de recorte |
| **STP** | Standard Technical Package — especificaciones técnicas del componente |
| **PPT** | Presentación del proyecto con contexto adicional de la RFQ |
| **Benchmark** | Análisis comparativo de cotizaciones; disponible con 4 o más válidas |
| **Desbloqueo** | Proceso para que un proveedor edite una cotización ya enviada (requiere aprobación de Compras) |
| **SSO** | Single Sign-On — autenticación corporativa para usuarios internos |
| **Super Usuario** | Usuario con permisos de administración en su área (IndAdmin o ComAdmin) |
| **Punto de no retorno** | Estado EN COTIZACIÓN — la RFQ ya no puede cancelarse |
| **Diff** | Vista de cambios entre dos versiones de una RFQ; se registra en ediciones con auditoría |

---

> **Flujo de Industrialización** → [flujo_industrializacion.md](flujo_industrializacion.md)
> **Flujo de Compras** → [flujo_compras.md](flujo_compras.md)
> **Flujo de Proveedor** → [flujo_proveedor.md](flujo_proveedor.md)
> **Plan de pruebas** → [plan_de_pruebas.md](plan_de_pruebas.md)
> **Seguridad** → [security.md](security.md)
