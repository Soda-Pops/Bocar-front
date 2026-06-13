# Plan de Pruebas — Sistema Bocar Frontend

> **Propósito:** Verificar el ciclo de vida completo de RFQs, el control de acceso por rol
> y la correctitud de los formularios de captura desde la interfaz de usuario.
>
> **Ejecutar contra:** `http://localhost:5173`
>
> **Convenciones:**
> - Las pruebas son **manuales funcionales** (no automatizadas en v1.0).
> - `{USUARIO_X}` → credencial del usuario X configurada en el sistema mock.
> - Los casos están ordenados secuencialmente; los módulos posteriores reusan el estado creado en anteriores.
> - Cada caso indica **PASS** si la pantalla, navegación y comportamiento coinciden con lo esperado.
> - Para ejecutar las pruebas, correr `npm run dev` y abrir `http://localhost:5173`.

---

## Preparación — Usuarios de prueba

El sistema actualmente usa datos mock. Los usuarios de prueba están preconfigurados en el servicio de autenticación (`src/features/auth/`).

| Variable | Rol | is_admin | Área |
|----------|-----|:--------:|------|
| `USER_IND` | Ind | No | Industrialización base |
| `USER_IND_ADMIN` | Ind | Sí | Industrialización Super Usuario |
| `USER_COM` | Com | No | Compras base |
| `USER_COM_ADMIN` | Com | Sí | Compras Super Usuario |
| `USER_PRO` | Pro | No | Proveedor |

---

## Módulo 0 — Autenticación

### AUTH-01 — Login interno exitoso

**Actor:** `USER_IND`
**Pantalla:** `/login`
**Pasos:**
1. Abrir `http://localhost:5173`
2. Hacer clic en "Acceso interno"
3. Completar el flujo SSO con credenciales de `USER_IND`

**Resultado esperado:**
- Redirige a `/industrializacion/dashboard`
- El sidebar muestra: Dashboard, RFQs, Predicción, Analytics
- No muestra links de Admin ni Solicitudes

---

### AUTH-02 — Login proveedor exitoso

**Actor:** `USER_PRO`
**Pantalla:** `/login`
**Pasos:**
1. Ingresar email y contraseña de `USER_PRO` en el bloque "Acceso proveedor"
2. Hacer clic en "Ingresar"

**Resultado esperado:**
- Redirige a `/proveedor/dashboard`
- La navegación muestra solo: Dashboard, RFQs asignadas, Cotizaciones
- No muestra ninguna sección de Compras o Industrialización

---

### AUTH-03 — Login con credenciales incorrectas

**Actor:** (anónimo)
**Pantalla:** `/login`
**Pasos:**
1. Ingresar un email válido con contraseña incorrecta
2. Hacer clic en "Ingresar"

**Resultado esperado:**
- La página no redirige
- Aparece mensaje de error: "Correo o contraseña incorrectos."

---

### AUTH-04 — Acceso a ruta de otro rol redirige a 401

**Actor:** `USER_PRO`
**Pasos:**
1. Iniciar sesión como `USER_PRO`
2. Intentar navegar manualmente a `/industrializacion/dashboard` desde la barra del navegador

**Resultado esperado:**
- El sistema redirige a `/401`
- Se muestra un mensaje claro de "Sin permiso" y un botón para volver al dashboard propio

---

### AUTH-05 — Login como Ind Admin muestra sección de Admin

**Actor:** `USER_IND_ADMIN`
**Pasos:**
1. Iniciar sesión como `USER_IND_ADMIN`
2. Observar el sidebar

**Resultado esperado:**
- Redirige a `/industrializacion/dashboard`
- El sidebar muestra: Dashboard, RFQs, Predicción, Analytics, **Admin**, **Solicitudes**

---

## Módulo 1 — Ciclo completo Industrialización (usuario base)

### IND-01 — Crear RFQ tipo MOLDE

**Actor:** `USER_IND`
**Pantalla:** `/industrializacion/rfq/crear`
**Pasos:**
1. Desde el dashboard, hacer clic en "Crear RFQ"
2. Seleccionar tipo **MOLDE**
3. Completar todos los campos obligatorios de datos generales
4. Completar especificaciones técnicas de molde
5. Cargar un archivo STP y un archivo PPT de prueba
6. Observar el checklist de completitud en el panel derecho

**Resultado esperado:**
- El checklist muestra todos los ítems en verde (100% completo)
- El botón "Enviar para aprobación" está habilitado
- El botón "Guardar borrador" está disponible en todo momento

---

### IND-02 — Guardar borrador

**Actor:** `USER_IND` (continuando IND-01)
**Pasos:**
1. Con el formulario completo, hacer clic en "Guardar borrador"

**Resultado esperado:**
- Aparece toast de confirmación: "RFQ guardada como borrador"
- Redirige al detalle de la RFQ (`/industrializacion/rfq/:id`)
- El badge de estado muestra "BORRADOR" en color gris
- Los botones "Editar" y "Enviar para aprobación" son visibles

---

### IND-03 — El borrador es privado (otro usuario no lo ve)

**Actor:** `USER_IND_ADMIN`
**Pasos:**
1. Iniciar sesión como `USER_IND_ADMIN`
2. Ir al dashboard y observar la tabla de RFQs recientes

**Resultado esperado:**
- El RFQ creado por `USER_IND` en IND-01 **no aparece** en la lista del admin
- Los borradores ajenos no son visibles para otros usuarios

---

### IND-04 — Intentar enviar sin archivos muestra error

**Actor:** `USER_IND`
**Pasos:**
1. Crear una nueva RFQ llenando solo los campos de texto (sin cargar STP ni PPT)
2. Observar el checklist y el botón "Enviar para aprobación"

**Resultado esperado:**
- El checklist muestra los ítems de STP y PPT en rojo
- El botón "Enviar para aprobación" está **deshabilitado**
- No es posible enviar la RFQ sin los documentos

---

### IND-05 — Enviar RFQ para aprobación interna

**Actor:** `USER_IND` (con el borrador de IND-01)
**Pasos:**
1. Desde el detalle del borrador, hacer clic en "Enviar para aprobación"

**Resultado esperado:**
- El badge cambia a "PENDIENTE APROBACIÓN INTERNA" en color amarillo
- Los botones de edición desaparecen (solo lectura)
- Aparece banner: "Tu RFQ está en revisión. El Super Usuario de Industrialización la evaluará."
- Se genera notificación para `USER_IND_ADMIN`

---

### IND-06 — Editar borrador existente

**Actor:** `USER_IND`
**Pasos:**
1. Desde el dashboard, hacer clic en un RFQ en estado BORRADOR
2. Hacer clic en "Editar"
3. Modificar el nombre del proyecto
4. Hacer clic en "Guardar borrador"

**Resultado esperado:**
- El formulario carga con los datos existentes
- Al guardar, los cambios se reflejan en el detalle
- El estado sigue siendo BORRADOR

---

### IND-07 — Fecha requerida pasada bloquea el envío

**Actor:** `USER_IND`
**Pasos:**
1. Crear una nueva RFQ
2. Ingresar una fecha requerida en el pasado (ej. 2020-01-01)
3. Intentar completar el formulario

**Resultado esperado:**
- Aparece error inline bajo el campo: mensaje indicando que la fecha debe ser futura
- El checklist marca ese ítem en rojo
- No es posible enviar la RFQ con fecha inválida

---

## Módulo 2 — Flujo de aprobación interna (Ind Admin)

> Requiere una RFQ en estado PENDIENTE APROBACIÓN INTERNA (completar IND-05 primero).

### APROV-01 — Admin ve la RFQ en su panel de administración

**Actor:** `USER_IND_ADMIN`
**Pantalla:** `/industrializacion/admin`
**Pasos:**
1. Iniciar sesión como `USER_IND_ADMIN`
2. Ir a la sección Admin del sidebar

**Resultado esperado:**
- La RFQ enviada en IND-05 aparece en la cola de aprobaciones
- Muestra nombre del proyecto, creador y fecha de envío

---

### APROV-02 — Admin aprueba la RFQ

**Actor:** `USER_IND_ADMIN`
**Pasos:**
1. Desde el panel de administración, hacer clic en la RFQ pendiente
2. En el detalle, hacer clic en "Aprobar"
3. Confirmar en el modal

**Resultado esperado:**
- El badge cambia a "PENDIENTE" en color azul
- La RFQ desaparece de la cola de aprobaciones del admin
- Se genera notificación para el área de Compras

---

### APROV-03 — Admin rechaza una RFQ sin motivo (bloqueado)

**Actor:** `USER_IND_ADMIN`
**Pasos:**
1. Tener una RFQ en PENDIENTE APROBACIÓN INTERNA
2. Hacer clic en "Rechazar"
3. Dejar el campo de motivo vacío
4. Intentar confirmar

**Resultado esperado:**
- El botón de confirmación está deshabilitado hasta que se ingrese el motivo
- Aparece mensaje de validación: "El motivo es obligatorio"

---

### APROV-04 — Admin rechaza con motivo

**Actor:** `USER_IND_ADMIN`
**Pasos:**
1. Con una RFQ en PENDIENTE APROBACIÓN INTERNA, hacer clic en "Rechazar"
2. Ingresar un motivo de rechazo
3. Confirmar

**Resultado esperado:**
- La RFQ vuelve a estado BORRADOR
- En el detalle de la RFQ, el timeline muestra el evento de rechazo con el motivo
- Se genera notificación para el creador con el motivo

---

### APROV-05 — Admin cancela una RFQ en estado temprano

**Actor:** `USER_IND_ADMIN`
**Pasos:**
1. Tener una RFQ en BORRADOR o PENDIENTE APROBACIÓN INTERNA
2. Hacer clic en "Cancelar RFQ"
3. Ingresar motivo obligatorio
4. Confirmar

**Resultado esperado:**
- El badge cambia a "CANCELADA" en color rojo
- El banner muestra el motivo de cancelación
- La RFQ queda en solo lectura para todos los usuarios
- No aparecen botones de acción

---

## Módulo 3 — Ciclo de Compras (usuario base)

> Requiere una RFQ en estado PENDIENTE (completar APROV-02 primero).

### COM-01 — Compras ve la RFQ en su dashboard

**Actor:** `USER_COM`
**Pasos:**
1. Iniciar sesión como `USER_COM`
2. Observar el dashboard y la lista de RFQs

**Resultado esperado:**
- La RFQ en estado PENDIENTE aparece en el dashboard
- El KPI "Por asignar" refleja el conteo correcto

---

### COM-02 — Compras base asigna proveedores y envía para aprobación

**Actor:** `USER_COM`
**Pasos:**
1. Desde el detalle de la RFQ, hacer clic en "Asignar proveedores"
2. Buscar proveedores en el catálogo y agregar 2 a la bandeja lateral
3. Hacer clic en "Enviar para aprobación"

**Resultado esperado:**
- La RFQ pasa a "PENDIENTE APROBACIÓN COMPRAS" en color amarillo
- El CTA de asignación desaparece (en revisión)
- Se genera notificación para `USER_COM_ADMIN`

---

### COM-03 — Compras base no puede notificar directamente a proveedores

**Actor:** `USER_COM`
**Pasos:**
1. Con una RFQ en PENDIENTE, ir a la pantalla de asignación de proveedores
2. Observar los botones disponibles

**Resultado esperado:**
- El CTA disponible es **"Enviar para aprobación"**, no "Notificar proveedores"
- No existe ningún botón que inicie directamente el plazo de cotización

---

## Módulo 4 — Flujo de aprobación de Compras (Com Admin)

> Requiere una RFQ en PENDIENTE APROBACIÓN COMPRAS (completar COM-02 primero).

### COMADMIN-01 — Admin de Compras aprueba la asignación

**Actor:** `USER_COM_ADMIN`
**Pasos:**
1. Ir al Admin Dashboard de Compras
2. Ver la asignación pendiente
3. Hacer clic en "Aprobar"
4. Leer el modal de confirmación (punto de compromiso)
5. Confirmar

**Resultado esperado:**
- La RFQ pasa a "EN COTIZACIÓN" en color verde
- El banner muestra: "Punto de no retorno — esta RFQ ya no puede cancelarse."
- Se generan notificaciones para los proveedores asignados
- El countdown del plazo comienza

---

### COMADMIN-02 — No es posible cancelar una RFQ en EN COTIZACIÓN

**Actor:** `USER_IND_ADMIN`
**Pasos:**
1. Ir al detalle de una RFQ en estado EN COTIZACIÓN
2. Observar los botones disponibles

**Resultado esperado:**
- El botón "Cancelar" **no aparece** en la barra de acciones
- El banner informa claramente que la cancelación no es posible en este estado

---

### COMADMIN-03 — Admin de Compras cierra una RFQ con benchmark listo

**Actor:** `USER_COM_ADMIN`
**Pasos:**
1. Ir al detalle de una RFQ en estado BENCHMARK LISTO
2. Hacer clic en "Cerrar RFQ"
3. Confirmar en el modal

**Resultado esperado:**
- El badge cambia a "CERRADA" en color gris oscuro
- La RFQ queda en solo lectura para todos los usuarios
- El benchmark y el historial siguen siendo accesibles

---

## Módulo 5 — Flujo de Proveedor

### PRO-01 — Proveedor ve sus RFQs asignadas

**Actor:** `USER_PRO`
**Pasos:**
1. Iniciar sesión como `USER_PRO`
2. Observar el dashboard y la lista de RFQs asignadas

**Resultado esperado:**
- Solo aparecen las RFQs asignadas a `USER_PRO`
- El countdown es el elemento visual más prominente
- No hay acceso a benchmark, catálogo de proveedores ni analytics

---

### PRO-02 — Proveedor descarga documentos técnicos

**Actor:** `USER_PRO`
**Pasos:**
1. Desde la lista, hacer clic en una RFQ asignada
2. En el detalle, hacer clic en el nombre del archivo STP

**Resultado esperado:**
- El archivo STP se descarga al equipo
- Lo mismo ocurre con el archivo PPT

---

### PRO-03 — Proveedor envía cotización exitosamente

**Actor:** `USER_PRO`
**Pasos:**
1. Hacer clic en "Cotizar ahora" desde el dashboard o la lista
2. Completar Sección 1: ingresar precios positivos en todos los campos
3. Completar Sección 2: ingresar dimensiones del molde
4. Completar Sección 3: ingresar semanas de entrega (ej. 12)
5. Cargar un PDF de cotización válido (< 15 MB)
6. Hacer clic en "Enviar cotización"
7. Leer el modal de advertencia
8. Confirmar

**Resultado esperado:**
- Toast de confirmación: "Tu cotización fue enviada exitosamente"
- La RFQ aparece en el historial con estado "Enviada (bloqueada)"
- El botón "Cotizar" se reemplaza por "Ver mi cotización"

---

### PRO-04 — Precio negativo o cero muestra error

**Actor:** `USER_PRO`
**Pasos:**
1. En el formulario de cotización, ingresar 0 en el campo "Precio unitario"
2. Intentar avanzar a la siguiente sección

**Resultado esperado:**
- Error inline bajo el campo: "El precio debe ser mayor a 0"
- No es posible avanzar ni enviar con ese valor

---

### PRO-05 — Semanas de entrega inválidas muestran error

**Actor:** `USER_PRO`
**Pasos:**
1. En Sección 3, ingresar 0 en el campo de semanas
2. Intentar enviar

**Resultado esperado:**
- Error inline: "Debe ser un número entre 1 y 52"

---

### PRO-06 — PDF faltante bloquea el envío

**Actor:** `USER_PRO`
**Pasos:**
1. Completar las Secciones 1, 2 y 3 correctamente
2. **No cargar el PDF** en Sección 4
3. Hacer clic en "Enviar cotización"

**Resultado esperado:**
- Toast de error: "El PDF de cotización es obligatorio"
- La cotización no se envía

---

### PRO-07 — Proveedor no puede ver información de otros proveedores

**Actor:** `USER_PRO`
**Pasos:**
1. Revisar el detalle de cualquier RFQ asignada
2. Revisar el historial de cotizaciones
3. Intentar navegar a `/compras/dashboard` o `/compras/rfq`

**Resultado esperado:**
- El detalle de RFQ no muestra nombres de otros proveedores asignados
- El historial solo muestra las cotizaciones propias
- Las rutas de Compras redirigen a `/401`

---

## Módulo 6 — Desbloqueo de cotización

### UNLOCK-01 — Proveedor solicita desbloqueo

**Actor:** `USER_PRO`
**Precondición:** Tener una cotización en estado "Enviada (bloqueada)"
**Pasos:**
1. Desde el historial, hacer clic en la cotización bloqueada
2. En el detalle, hacer clic en "Solicitar desbloqueo"
3. Dejar el motivo vacío e intentar confirmar

**Resultado esperado:**
- El botón de confirmación está deshabilitado
- Aparece mensaje: "El motivo es obligatorio"

---

### UNLOCK-02 — Solicitud de desbloqueo enviada con motivo

**Actor:** `USER_PRO`
**Pasos:**
1. En el modal de desbloqueo, ingresar un motivo
2. Confirmar

**Resultado esperado:**
- Toast de confirmación: "Solicitud enviada a BOCAR"
- Estado de la cotización cambia a "Solicitud de desbloqueo enviada" (amarillo)
- Se genera notificación para `USER_COM_ADMIN`

---

### UNLOCK-03 — Com Admin aprueba el desbloqueo

**Actor:** `USER_COM_ADMIN`
**Pasos:**
1. Ir a `/compras/admin/desbloqueos`
2. Localizar la solicitud de `USER_PRO`
3. Hacer clic en "Aprobar"

**Resultado esperado:**
- La solicitud desaparece de la cola
- Estado de la cotización del proveedor cambia a "Desbloqueada" (verde)
- Se genera notificación para `USER_PRO`

---

### UNLOCK-04 — Proveedor edita y reenvía después del desbloqueo

**Actor:** `USER_PRO`
**Pasos:**
1. Hacer clic en la notificación de desbloqueo (deep link)
2. El sistema navega al detalle de la cotización
3. Hacer clic en "Editar y reenviar cotización"
4. Modificar el precio unitario
5. Hacer clic en "Enviar cotización" y confirmar

**Resultado esperado:**
- La cotización se reenvía con los nuevos valores
- Estado vuelve a "Enviada (bloqueada)"
- El timeline registra el evento de reenvío

---

## Módulo 7 — Control de acceso (pruebas negativas)

### SEC-01 — Com no puede acceder a rutas de Industrialización

**Actor:** `USER_COM`
**Pasos:**
1. Iniciar sesión como `USER_COM`
2. Intentar navegar a `/industrializacion/dashboard` desde la barra del navegador

**Resultado esperado:** Redirige a `/401`

---

### SEC-02 — Pro no puede acceder a rutas de Compras

**Actor:** `USER_PRO`
**Pasos:**
1. Iniciar sesión como `USER_PRO`
2. Intentar navegar a `/compras/rfq` desde la barra del navegador

**Resultado esperado:** Redirige a `/401`

---

### SEC-03 — Ind base no puede acceder al Admin Dashboard

**Actor:** `USER_IND`
**Pasos:**
1. Iniciar sesión como `USER_IND`
2. Intentar navegar a `/industrializacion/admin`

**Resultado esperado:**
- Redirige a `/401`
- El link de "Admin" no aparece en el sidebar

---

### SEC-04 — Com base no puede notificar proveedores directamente

**Actor:** `USER_COM`
**Pasos:**
1. Ir a la pantalla de asignación de proveedores con una RFQ en PENDIENTE
2. Observar los botones disponibles

**Resultado esperado:**
- El único CTA disponible es "Enviar para aprobación"
- No existe el botón "Notificar proveedores e iniciar plazo"

---

### SEC-05 — El benchmark no es accesible para el Proveedor

**Actor:** `USER_PRO`
**Pasos:**
1. Intentar navegar a cualquier ruta de benchmark

**Resultado esperado:**
- Redirige a `/401`
- No existe ningún link de benchmark en la navegación del proveedor

---

## Módulo 8 — Formulario de RFQ (validaciones adicionales)

### FORM-01 — Fecha límite de cotización posterior a fecha requerida

**Actor:** `USER_IND`
**Pasos:**
1. En el formulario de creación, ingresar una fecha requerida de 2026-08-01
2. Ingresar una fecha límite de cotización de 2026-09-01 (posterior a la requerida)
3. Intentar enviar

**Resultado esperado:**
- Error inline: "La fecha límite de cotización debe ser anterior a la fecha requerida"
- El formulario bloquea el envío

---

### FORM-02 — Checklist se actualiza en tiempo real

**Actor:** `USER_IND`
**Pasos:**
1. Abrir el formulario de creación de RFQ
2. Observar el checklist inicial (todo en rojo/pendiente)
3. Ir completando campos uno por uno

**Resultado esperado:**
- Cada ítem del checklist cambia a verde en el momento en que su campo es completado
- El porcentaje de completitud se actualiza en tiempo real

---

### FORM-03 — Tipo de RFQ determina los campos técnicos

**Actor:** `USER_IND`
**Pasos:**
1. Seleccionar tipo MOLDE → observar sección de especificaciones técnicas
2. Volver y seleccionar tipo RECORTE → observar la misma sección

**Resultado esperado:**
- Los campos técnicos son distintos según el tipo seleccionado
- Los campos de MOLDE no aparecen al seleccionar RECORTE y viceversa

---

## Tabla de cobertura de flujos

| Flujo | Casos que lo verifican |
|-------|----------------------|
| Autenticación por rol | AUTH-01 a AUTH-05 |
| Creación de RFQ y guardado de borrador | IND-01, IND-02, IND-06 |
| Privacidad del borrador | IND-03 |
| Validación de archivos obligatorios | IND-04 |
| Envío para aprobación interna | IND-05 |
| Validación de fechas | IND-07, FORM-01 |
| Aprobación interna (admin) | APROV-01, APROV-02 |
| Rechazo con motivo | APROV-03, APROV-04 |
| Cancelación temprana | APROV-05 |
| Asignación de proveedores (base) | COM-01, COM-02, COM-03 |
| Aprobación de asignación (admin) | COMADMIN-01 |
| Punto de no retorno | COMADMIN-02 |
| Cierre de RFQ | COMADMIN-03 |
| Flujo completo de proveedor | PRO-01 a PRO-05 |
| Privacidad del proveedor | PRO-07 |
| Validaciones del formulario de cotización | PRO-04, PRO-05, PRO-06 |
| Desbloqueo de cotización (extremo a extremo) | UNLOCK-01 a UNLOCK-04 |
| Control de acceso entre roles | SEC-01 a SEC-05 |
| Validaciones del formulario de RFQ | FORM-01 a FORM-03 |

**Total de casos:** 38
**Total de módulos:** 9 (0–8)
**Flujos del ciclo de vida cubiertos:** Autenticación, creación, aprobación interna, asignación, aprobación de compras, cotización, benchmark, desbloqueo, cancelación, control de acceso.
