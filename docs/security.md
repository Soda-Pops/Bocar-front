# Seguridad — Sistema Bocar Frontend

> **Propósito:** Documentar las medidas de seguridad implementadas en el frontend,
> los riesgos identificados y las recomendaciones pendientes.
> Para la seguridad del backend ver la documentación técnica del backend.

---

## Índice

1. [Modelo de seguridad del frontend](#1-modelo-de-seguridad-del-frontend)
2. [Control de acceso por rol](#2-control-de-acceso-por-rol)
3. [Autenticación y sesión](#3-autenticación-y-sesión)
4. [Protección de datos sensibles en la UI](#4-protección-de-datos-sensibles-en-la-ui)
5. [Validación de entradas](#5-validación-de-entradas)
6. [Carga de archivos](#6-carga-de-archivos)
7. [Riesgos identificados y estado](#7-riesgos-identificados-y-estado)
8. [Recomendaciones pendientes](#8-recomendaciones-pendientes)

---

## 1. Modelo de seguridad del frontend

El frontend implementa seguridad en la **capa de presentación**. Esto significa que:

- Las restricciones de rol en la UI son una primera línea de defensa y **no reemplazan** la validación en el backend.
- El backend valida todos los permisos de forma independiente. El frontend solo renderiza lo que el backend autoriza.
- Ninguna acción crítica (aprobación, cancelación, asignación de proveedores) se completa sin una respuesta exitosa del backend.

### Principios aplicados

| Principio | Implementación |
|-----------|---------------|
| Mínimo privilegio | Cada rol accede únicamente a las rutas y datos de su dominio |
| Aislamiento de roles | Shells visuales separados; proveedores no ven información interna |
| Visibilidad de restricciones | Puntos de no retorno comunicados con banners; acciones no permitidas ocultas (no solo deshabilitadas) |
| Auditoría visible | Historial de transiciones, motivos y actores visible para roles con permiso |

---

## 2. Control de acceso por rol

### Implementación

El control de acceso se implementa mediante el componente `ProtectedRoute` que envuelve cada ruta en el Router:

```
Router
├── / (login) → público
├── /industrializacion/* → ProtectedRoute(roles: ['Ind', 'IndAdmin'])
├── /compras/* → ProtectedRoute(roles: ['Com', 'ComAdmin'])
└── /proveedor/* → ProtectedRoute(roles: ['Pro'])
```

`ProtectedRoute` verifica el rol del usuario en `AuthContext`. Si el rol no coincide, redirige a `/401` sin renderizar ningún contenido de la ruta destino.

### Reglas de visibilidad en navegación

| Regla | Implementación |
|-------|---------------|
| Links a rutas no autorizadas | Se **ocultan** del sidebar (no se deshabilitan) para no revelar la existencia de secciones restringidas |
| Sección Admin | Visible en sidebar solo para `IndAdmin` y `ComAdmin` |
| CTA de acciones privilegiadas | Invisible para roles sin permiso (ej. "Notificar proveedores" no aparece para Com base) |

### Separación Ind Admin vs. Ind base

| Acción | Ind base | Ind Admin |
|--------|:--------:|:---------:|
| Aprobar RFQs | — | ✓ |
| Rechazar con motivo | — | ✓ |
| Editar y aprobar | — | ✓ |
| Cancelar RFQs | — | ✓ |
| Enviar directo a Compras | — | ✓ |
| Ver borradores ajenos | — | ✓ |

### Separación Com Admin vs. Com base

| Acción | Com base | Com Admin |
|--------|:--------:|:---------:|
| Notificar proveedores directamente | — | ✓ |
| Aprobar asignaciones | — | ✓ |
| Cerrar RFQ | — | ✓ |
| Extender plazos | — | ✓ |
| Gestionar desbloqueos | — | ✓ |
| Administrar catálogo de proveedores | — | ✓ |

---

## 3. Autenticación y sesión

### Integración con el backend

El frontend consume la autenticación JWT del backend Django. El flujo es:

| Paso | Descripción |
|------|-------------|
| Login | `POST /auth/login/` con credenciales. El backend establece cookies HttpOnly con `access_token` y `refresh_token`. |
| Sesión activa | En cada petición, el navegador envía automáticamente las cookies. El frontend no accede al token directamente. |
| Validación de sesión | Al cargar la app, el frontend llama a `GET /auth/me/` para reconstruir el estado de sesión sin decodificar el token. |
| Refresh transparente | Cuando el backend devuelve `401`, el frontend llama a `POST /auth/refresh/`. Si también falla, redirige a `/login`. |
| Logout | `POST /auth/logout/` invalida el refresh token en la blacklist del backend y limpia las cookies. |

### Seguridad de las cookies

| Atributo | Valor | Propósito |
|----------|-------|-----------|
| `HttpOnly` | `true` | El token no es accesible desde JavaScript; mitiga XSS |
| `Secure` | `true` en producción | Solo se envía por HTTPS |
| `SameSite` | `Lax` | Protección básica contra CSRF en navegaciones de nivel superior |

> El frontend **nunca almacena tokens** en `localStorage`, `sessionStorage` ni variables globales de JavaScript.

---

## 4. Protección de datos sensibles en la UI

### Aislamiento del Proveedor

El área de Proveedor es la más crítica en términos de confidencialidad comercial. Las siguientes reglas se aplican en la UI:

| Dato sensible | Estado en la UI del Proveedor |
|---------------|-------------------------------|
| Nombres de otros proveedores asignados | No se muestra |
| Cotizaciones de otros proveedores | No se muestra |
| Benchmark / comparativa de precios | Ruta no existe para el rol `Pro` |
| Analytics internos de BOCAR | Ruta no existe para el rol `Pro` |
| Catálogo de proveedores | Ruta no existe para el rol `Pro` |

Además, el backend valida que cada proveedor solo pueda consultar sus propias asignaciones. El frontend refuerza esta restricción ocultando cualquier acceso a datos de otros proveedores.

### Información de auditoría

El panel de auditoría (motivos de rechazo, cancelación, ediciones con diff) solo está visible para `IndAdmin` y `ComAdmin`. Los usuarios base no tienen acceso a este nivel de detalle en la UI, y el backend lo valida por separado.

---

## 5. Validación de entradas

Toda entrada del usuario pasa por validación con **Zod + React Hook Form** en el cliente antes de ser enviada al backend. El backend realiza su propia validación independiente.

### Formulario de RFQ

| Campo | Validación en cliente |
|-------|----------------------|
| Nombre del proyecto | Texto no vacío |
| Número de parte | Alfanumérico, sin caracteres especiales |
| Fecha requerida | Fecha futura (> hoy) |
| Fecha límite cotización | Futura y anterior a la fecha requerida |
| Archivos STP/PPT | Presencia obligatoria antes de enviar |

### Formulario de cotización (Proveedor)

| Campo | Validación en cliente |
|-------|----------------------|
| Precios | Número positivo (> 0) |
| Semanas de entrega | Entero entre 1 y 52 |
| PDF adjunto | Obligatorio; solo formato PDF; máx. 15 MB |

### Sanitización de contenido

Los valores de texto ingresados por el usuario no se renderizan como HTML sin sanitización. El componente `react-markdown` se usa para renderizar contenido del chatbot con `remark-gfm`. Se recomienda auditar el contenido generado por el LLM antes de renderizarlo, ya que puede contener instrucciones de formato que modifiquen la presentación.

---

## 6. Carga de archivos

### Validaciones del lado cliente

| Validación | Descripción |
|------------|-------------|
| Tipo de archivo | Se verifica la extensión antes de aceptar el archivo (PDF, STP/STEP, PPT) |
| Tamaño máximo | PDF de cotización: 15 MB. El límite se muestra antes de iniciar la carga, no solo al fallar. |
| Feedback de error | Toast de error inmediato con indicación del problema (formato inválido / tamaño excedido) |

### Validación en el backend

El servidor valida el contenido MIME real del archivo al recibirlo, independientemente de lo que indique la extensión. El frontend solo muestra los errores de validación que devuelva el backend.

---

## 7. Riesgos identificados y estado

| ID | Severidad | Descripción | Estado |
|----|-----------|-------------|--------|
| A | Media | Validación de tipo de archivo por extensión en el cliente: un archivo malicioso renombrado como `.pdf` pasa la validación de la UI | Mitigado — el backend valida el MIME real. La UI muestra el error devuelto por el servidor. |
| B | Media | Contenido generado por el chatbot (LLM) renderizado con `react-markdown` sin auditoría de seguridad | Pendiente — auditar el contenido LLM en producción; aplicar sanitización si el LLM puede generar HTML |
| C | Baja | No se implementa Content Security Policy (CSP) en el build de producción | Pendiente — configurar al desplegar en producción (nginx, Vercel, etc.) |
| D | Baja | Sin rate limiting en el frontend para intentos de login | Aceptable — el rate limiting está implementado en el backend (5 intentos/minuto) |
| E | Informativa | Las rutas protegidas devuelven `/401` al acceder sin permiso, lo que revela la existencia de la ruta | Aceptable — patrón estándar; el contenido de la ruta nunca se renderiza |

---

## 8. Elementos Dev-Only

Código presente en el repositorio que **no debe llegar a producción** o que se elimina automáticamente en el build.

| Elemento | Archivo | Línea | Protección | Acción requerida |
|----------|---------|:-----:|-----------|-----------------|
| Query params `?status=`, `?role=`, `?creator=` — permiten forzar estado de RFQ y rol sin autenticación real | `src/features/rfq/hooks/useRfqDetail.ts` | 196 | `import.meta.env.DEV` — Vite los elimina automáticamente en producción | Ninguna |
| `console.log('[RfqDetail] action triggered:', key, rfqId)` — expone nombres de acciones e IDs de RFQs en la consola del navegador | `src/features/rfq/components/RfqDetail/RfqDetailWorkspace.tsx` | 372 | Comentado como `// DEV-ONLY` — requiere intervención manual antes de deploy | Eliminar o envolver con `import.meta.env.DEV` antes de subir a producción |

### Criterio de clasificación

Un elemento se considera **Dev-Only** si cumple alguna de estas condiciones:

- Expone información interna (IDs, estados, roles) en interfaces accesibles al usuario final.
- Permite saltarse o modificar comportamiento de autenticación o autorización.
- Solo tiene utilidad durante desarrollo o pruebas y no aporta valor en producción.

---

## 9. Recomendaciones pendientes

**Content Security Policy:**
Configurar el encabezado `Content-Security-Policy` en el servidor de producción para restringir fuentes de scripts, estilos y conexiones a orígenes conocidos.

**Auditoría del chatbot:**
Antes de habilitar el chatbot en producción, revisar qué contenido puede generar el LLM y si `react-markdown` lo renderiza de forma segura. Considerar una lista blanca de elementos HTML permitidos.

**Manejo de errores de red:**
Implementar un interceptor global que distinga errores de red (sin conexión), errores de autenticación (401), errores de permisos (403) y errores del servidor (500), mostrando mensajes claros al usuario en cada caso.

**Auditoría de dependencias:**
Ejecutar `npm audit` regularmente y resolver vulnerabilidades críticas antes de cada despliegue. Las vulnerabilidades medias deben documentarse y evaluarse caso por caso.

**Logs del lado cliente:**
Evitar enviar a la consola del navegador información sensible (tokens, datos de usuario, respuestas completas de la API) en el build de producción. Usar variables de entorno para condicionar el nivel de logging.
