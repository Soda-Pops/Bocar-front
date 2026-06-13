# Flujo de Proveedor — Bocar Frontend

> **Rol:** `Pro` (sin distinción de admin dentro del área)
> **Dashboard de entrada:** `/proveedor/dashboard`
> **Para el flujo completo del sistema ver:** [flujo_completo.md](flujo_completo.md)

---

## Índice

1. [Autenticación y acceso](#1-autenticación-y-acceso)
2. [Dashboard](#2-dashboard)
3. [Lista de RFQs asignadas](#3-lista-de-rfqs-asignadas)
4. [Detalle de RFQ](#4-detalle-de-rfq)
5. [Descargar documentos técnicos](#5-descargar-documentos-técnicos)
6. [Enviar una cotización](#6-enviar-una-cotización)
7. [Historial de cotizaciones](#7-historial-de-cotizaciones)
8. [Detalle de cotización](#8-detalle-de-cotización)
9. [Solicitar desbloqueo](#9-solicitar-desbloqueo)
10. [Restricciones de acceso](#10-restricciones-de-acceso)
11. [Pantallas y rutas del área](#11-pantallas-y-rutas-del-área)

---

## 1. Autenticación y acceso

El proveedor accede con **usuario y contraseña** proporcionados por BOCAR, en la pantalla de login (bloque "Acceso proveedor"). Al autenticarse correctamente, el sistema redirige a `/proveedor/dashboard`.

Intentar acceder a rutas de Industrialización o Compras redirige a `/401`.

---

## 2. Dashboard

**Ruta:** `/proveedor/dashboard`

El dashboard del proveedor funciona como un **inbox de tareas**, no como un panel analítico.

### Lo que el usuario ve

| Sección | Contenido |
|---------|-----------|
| RFQs urgentes | RFQs asignadas ordenadas por días restantes (las más urgentes arriba) |
| Cotizaciones enviadas | Resumen de cotizaciones con su estado actual |
| Solicitudes de desbloqueo | Estado de desbloqueos solicitados (si aplica) |
| Accesos rápidos | "Cotizar ahora" y "Ver historial" |

### Indicadores de urgencia

| Tiempo restante | Color del indicador |
|----------------|---------------------|
| Más de 5 días | Verde |
| 3 a 5 días | Amarillo |
| Menos de 3 días | Naranja |
| Vencida | Rojo |

---

## 3. Lista de RFQs asignadas

**Ruta:** `/proveedor/rfq`

### Columnas de la tabla

| Columna | Descripción |
|---------|-------------|
| ID / Proyecto | Identificador y nombre de la RFQ |
| Tipo | MOLDE o RECORTE |
| Fecha límite | Deadline con indicador de urgencia por colores |
| Estado cotización | Pendiente · Enviada (bloqueada) · Solicitud enviada · Desbloqueada |
| Acciones | Ver RFQ · Cotizar |

### Filtros disponibles

| Filtro | Opciones |
|--------|----------|
| Estado cotización | Pendiente / Enviada / Desbloqueada |
| Búsqueda | Por nombre de proyecto o ID |

> El proveedor **solo ve sus propias asignaciones**. No existe ningún mecanismo para ver RFQs asignadas a otros proveedores.

---

## 4. Detalle de RFQ

**Ruta:** `/proveedor/rfq/:id`

### Lo que el usuario ve

| Elemento | Descripción |
|----------|-------------|
| Countdown | Días y horas restantes para cotizar (elemento visual dominante) |
| Datos generales | Nombre del proyecto, número de parte, tipo, fecha requerida |
| Resumen técnico | Especificaciones necesarias para preparar la cotización |
| Documentos | STP y PPT disponibles para descarga |
| Estado de cotización | Estado actual de la cotización propia |

### CTAs según estado de la cotización

| Estado de la cotización | CTA visible |
|------------------------|------------|
| No enviada (pendiente) | "Cotizar ahora" |
| Enviada (bloqueada) | "Ver mi cotización" |
| Solicitud de desbloqueo enviada | "Ver estado de la solicitud" |
| Desbloqueada | "Editar y reenviar cotización" |

### Restricciones visuales

El detalle de RFQ del proveedor **nunca muestra:**
- Nombres o información de otros proveedores asignados al mismo RFQ.
- Cotizaciones de otros proveedores.
- Benchmark o comparativos de precios.
- Métricas internas de BOCAR.

---

## 5. Descargar documentos técnicos

Desde el detalle de la RFQ, la sección de documentos muestra los archivos técnicos necesarios para preparar la cotización.

| Documento | Formato | Contenido |
|-----------|---------|-----------|
| **STP** | .stp / .step | Especificaciones técnicas completas del molde o recorte |
| **PPT** | .pptx / .pdf | Presentación del proyecto con contexto adicional |

**Cómo descargar:**
1. Hacer clic en el nombre del archivo.
2. El archivo se descarga directamente al equipo.

> Si el archivo no está disponible, aparece un mensaje: *"Documento no disponible. Contacta a BOCAR."*

---

## 6. Enviar una cotización

**Ruta:** `/proveedor/rfq/:rfqId/cotizar`

### Estructura del formulario

El formulario tiene cuatro secciones navegables. Todas son obligatorias para poder enviar.

---

#### Sección 1 — Precios

| Campo | Validación |
|-------|-----------|
| Precio unitario | Número positivo (> 0) |
| Precio de herramienta / herramental | Número positivo (> 0) |
| Precio de mano de obra | Número positivo (> 0) |

---

#### Sección 2 — Dimensiones del molde

| Campo | Descripción |
|-------|-------------|
| Largo (mm) | Dimensión del molde propuesto |
| Ancho (mm) | Dimensión del molde propuesto |
| Alto (mm) | Dimensión del molde propuesto |

---

#### Sección 3 — Tiempos de entrega

| Campo | Validación |
|-------|-----------|
| Semanas de entrega | Entero entre 1 y 52 |

---

#### Sección 4 — Documento oficial

| Requisito | Detalle |
|-----------|---------|
| Tipo de archivo | PDF únicamente |
| Tamaño máximo | 15 MB |
| Contenido | Cotización formal con membrete y firma de la empresa |

---

### Flujo completo de cotización

| Paso | Acción | Resultado |
|------|--------|-----------|
| 1 | Abrir formulario desde `/proveedor/rfq/:rfqId/cotizar` | Formulario en blanco |
| 2 | Completar Sección 1 (precios) | Validación inline en tiempo real |
| 3 | Completar Sección 2 (dimensiones) | — |
| 4 | Completar Sección 3 (tiempos) | — |
| 5 | Cargar PDF en Sección 4 | Validación de formato y tamaño |
| 6 | Clic en "Guardar borrador" | Progreso guardado. Se puede continuar después. |
| 7 | Clic en "Enviar cotización" | Aparece modal de advertencia |
| 8 | Leer: *"Al enviar, tu cotización quedará bloqueada y no podrás modificarla. ¿Deseas continuar?"* | — |
| 9 | Confirmar | Cotización enviada. Estado cambia a "Enviada (bloqueada)". Toast de confirmación. |

### Errores durante el llenado

| Condición | Comportamiento |
|-----------|---------------|
| Precio negativo o cero | Error inline: "El precio debe ser mayor a 0" |
| Semanas fuera de rango (< 1 o > 52) | Error inline: "Debe ser un número entre 1 y 52" |
| PDF faltante al intentar enviar | Toast: "El PDF de cotización es obligatorio" |
| PDF con formato incorrecto | Toast: "Solo se aceptan archivos PDF" |
| PDF mayor a 15 MB | Toast: "El archivo supera el límite de 15 MB" |
| Plazo vencido mientras navega | Banner de aviso y botón "Enviar" deshabilitado |

---

## 7. Historial de cotizaciones

**Ruta:** `/proveedor/cotizaciones`

### Columnas de la tabla

| Columna | Descripción |
|---------|-------------|
| RFQ | Nombre del proyecto y ID |
| Fecha de envío | Cuándo se envió la cotización |
| Estado | Estado actual (ver tabla abajo) |
| Deadline original | Fecha límite original de la asignación |
| Acciones | Ver detalle |

### Estados de cotización

| Estado | Color | Descripción |
|--------|-------|-------------|
| **Enviada (bloqueada)** | Gris | Recibida por BOCAR; no puede modificarse |
| **Solicitud de desbloqueo enviada** | Amarillo | Pendiente de respuesta de Compras |
| **Solicitud de desbloqueo rechazada** | Rojo | Compras no aprobó; la cotización sigue bloqueada |
| **Desbloqueada** | Verde | Compras aprobó; puede editarse y reenviarse |

---

## 8. Detalle de cotización

**Ruta:** `/proveedor/cotizaciones/:id`

### Lo que el usuario ve

| Sección | Contenido |
|---------|-----------|
| Resumen de valores | Precios enviados (unitario, herramienta, mano de obra), semanas de entrega |
| Documento PDF | Link de descarga del PDF adjunto |
| Timeline | Historial: cuándo se envió, si hubo solicitudes de desbloqueo y su resolución |
| Estado de la solicitud | Si hay solicitud de desbloqueo activa, muestra su estado actual |

### CTA "Solicitar desbloqueo"

Visible solo cuando la cotización está en estado **"Enviada (bloqueada)"** y no existe solicitud pendiente.

---

## 9. Solicitar desbloqueo

El desbloqueo permite corregir una cotización ya enviada. Requiere aprobación de Compras.

### Flujo de solicitud

| Paso | Acción | Resultado |
|------|--------|-----------|
| 1 | Clic en "Solicitar desbloqueo" desde el detalle de la cotización | Aparece `UnlockRequestModal` |
| 2 | Ingresar el **motivo de la solicitud** (campo obligatorio) | — |
| 3 | Confirmar | Solicitud enviada a Compras. Estado cambia a "Solicitud de desbloqueo enviada". Toast de confirmación. |

### Posibles resultados

| Resultado | Estado de la cotización | Notificación |
|-----------|------------------------|-------------|
| Compras aprueba | "Desbloqueada" | Notificación: "Tu cotización fue desbloqueada. Puedes editarla." |
| Compras rechaza | "Solicitud rechazada" (vuelve a "Enviada (bloqueada)") | Notificación con el motivo del rechazo |

### Flujo después del desbloqueo aprobado

| Paso | Acción |
|------|--------|
| 1 | El proveedor recibe notificación de desbloqueo |
| 2 | Hace clic en el deep link de la notificación → llega al detalle de la cotización |
| 3 | CTA "Editar y reenviar cotización" disponible |
| 4 | El formulario se abre pre-relleno con los valores anteriores |
| 5 | El proveedor corrige los campos necesarios y vuelve a enviar |
| 6 | La cotización vuelve a estado "Enviada (bloqueada)" con los nuevos valores |

---

## 10. Restricciones de acceso

El espacio del proveedor está diseñado con aislamiento estricto. Las siguientes secciones **no existen** en su interfaz:

| Sección | Razón |
|---------|-------|
| Benchmark o comparativa de cotizaciones | Confidencialidad comercial entre proveedores |
| Cotizaciones de otros proveedores | Confidencialidad comercial |
| Analytics o KPIs de BOCAR | Información interna |
| Catálogo de proveedores | Solo visible para Compras |
| RFQs no asignadas | El proveedor solo trabaja con sus asignaciones |
| Panel de administración | No existe nivel admin en el rol Pro |

Cualquier intento de acceder a estas rutas redirige a `/401`.

---

## 11. Pantallas y rutas del área

| Pantalla | Ruta | Rol Pro |
|----------|------|:-------:|
| Dashboard | `/proveedor/dashboard` | ✓ |
| Lista de RFQs asignadas | `/proveedor/rfq` | ✓ |
| Detalle de RFQ | `/proveedor/rfq/:id` | ✓ |
| Formulario de cotización | `/proveedor/rfq/:rfqId/cotizar` | ✓ |
| Historial de cotizaciones | `/proveedor/cotizaciones` | ✓ |
| Detalle de cotización | `/proveedor/cotizaciones/:id` | ✓ |
