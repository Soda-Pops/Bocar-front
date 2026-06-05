# Runbook E2E — Flujo de solicitud de edicion con modal

Objetivo: validar desde el navegador el flujo completo de solicitud de edicion de una RFQ usando el modal implementado en el frontend. Cubre dos caminos: Comercializacion **aprueba** la solicitud (RFQ regresa a Industrializacion) y Comercializacion **rechaza** la solicitud (RFQ permanece en Comercializacion).

La UI ya no usa `window.prompt`. Las acciones se realizan a traves de modales centrados en pantalla con validacion y feedback inline.

---

## 0. Prerrequisitos

- Backend Django corriendo en `http://localhost:8000`.
- Frontend Vite corriendo en `http://localhost:5173`.
- Tener una RFQ Mold en estado `PENDING` (`En_Com`), creada por `ind_base@bocar.com` y **sin proveedores asignados**.
  - Si no existe: seguir los pasos 1 y 2 del runbook `01_FLUJO_MOLD_COMPLETO_CIERRE.md` y detenerse antes del paso 3 (no asignar).
- Abrir DevTools > Network antes de iniciar.
- Anotar el `<rfq_id>` numerico antes de empezar.

Usuarios:

| Rol | Email | Password |
|-----|-------|----------|
| Industrializacion | `ind_base@bocar.com` | `IndBase2026!` |
| Comercializacion | `com_base@bocar.com` | `ComBase2026!` |

---

## CAMINO A — Solicitar edicion y Comercializacion aprueba

### A1. Industrializacion abre el detalle de la RFQ

Login: `ind_base@bocar.com`.

1. Ir a `/industrializacion/dashboard`.
2. Abrir la RFQ `PENDING` desde la tabla Active.
   - Ruta directa: `/industrializacion/rfq/<rfq_id>?tipo=Mold`.
3. Verificar que el detalle carga datos reales.
   - Network esperado: `GET /api_mold/v1/rfq-molds/<rfq_id>/` -> `200`.
4. Verificar que aparece el boton `Request edit` en la barra de acciones.
   - El boton debe estar visible directamente en la pagina, sin menu desplegable.

---

### A2. Industrializacion solicita edicion via modal

1. Clic en `Request edit`.
2. Confirmar que se abre un modal centrado en pantalla con:
   - Titulo: "Solicitar edicion".
   - Subtitulo con el ID de la RFQ.
   - Texto explicativo sobre el flujo.
   - Campo de texto (textarea) para el motivo.
   - Boton `Cancelar` y boton `Solicitar edicion`.
3. Ingresar motivo: `Correccion de especificaciones tecnicas E2E`.
4. Clic en `Solicitar edicion`.

Esperado:

- Network: `POST /api_industrializacion/v1/edit-requests/?tipo=mold` -> `201`.
- Body JSON contiene `{ "rfq_mold": <rfq_id>, "reason": "Correccion de especificaciones tecnicas E2E" }`.
- El modal se cierra automaticamente.
- En la pagina aparece un banner verde con mensaje de exito ("Solicitud de edicion enviada...").

Verificar que el boton `Solicitar edicion` permanece deshabilitado mientras la peticion esta en vuelo.

Verificar caso de error: si el campo de motivo esta vacio y se intenta enviar, debe aparecer un mensaje de validacion inline dentro del modal, sin llamar al backend.

Cerrar sesion.

---

### A3. Comercializacion ve la RFQ con solicitud pendiente

Login: `com_base@bocar.com`.

1. Ir a `/compras/dashboard`.
2. Buscar la RFQ por `<rfq_id>`.
3. Abrir el detalle de la RFQ.
   - Ruta: `/compras/rfq/<rfq_id>?tipo=Mold` o desde la fila del dashboard.
4. Verificar que la RFQ muestra estado `PENDING_EDIT_REQUEST` o equivalente.
5. Verificar que aparecen dos botones en la barra de acciones:
   - `Approve request` (azul solido).
   - `Reject request` (contorno, sin relleno).
   - El boton `Assign suppliers` debe estar **deshabilitado** en este estado.

---

### A4. Comercializacion aprueba la solicitud

1. Clic en `Approve request`.
2. Confirmar que se abre un modal de confirmacion con:
   - Titulo: "Aprobar solicitud de edicion".
   - Subtitulo con el ID de la RFQ.
   - Texto explicativo: el RFQ volvera a Industrializacion.
   - Pregunta de confirmacion: "Confirmas esta accion?".
   - Botones: `Cancelar` y `Aprobar`.
3. Clic en `Aprobar`.

Esperado bajo el capot (secuencia de llamadas):

- Primera llamada: `GET /api_comercializacion/v1/solicitudes/` -> `200`.
  - La respuesta contiene `solicitudes_edicion.mold` con un objeto `{ id: <edit_request_id>, rfq_mold: <rfq_id> }`.
  - El frontend extrae el `<edit_request_id>` correspondiente al RFQ.
- Segunda llamada: `PATCH /api_comercializacion/v1/edit-requests/<edit_request_id>/aprobar/?tipo=mold` -> `200`.
  - Response contiene `{ "detail": "..." }`.

Esperado en UI:

- El modal se cierra.
- Aparece banner verde con mensaje de aprobacion.
- Despues de ~2.5 segundos, la pagina navega automaticamente al dashboard de Compras.

Cerrar sesion.

---

### A5. Industrializacion confirma que puede editar de nuevo

Login: `ind_base@bocar.com`.

1. Ir a `/industrializacion/dashboard`.
2. Abrir la RFQ: debe aparecer como `DRAFT` / `En_Ind`.
3. Abrir el detalle `/industrializacion/rfq/<rfq_id>?tipo=Mold`.
4. Verificar que aparecen los botones `Edit RFQ`, `Submit RFQ` y `Delete draft`.
5. Clic en `Edit RFQ`.
6. Modificar un campo, por ejemplo Description: `Correccion E2E aprobada`.
7. Guardar.

Esperado de edicion:

- Network: `PATCH /api_industrializacion/v1/rfq/<rfq_id>/?tipo=mold` -> `200`.

8. Volver al detalle y ejecutar `Submit RFQ`.

Esperado de reenvio:

- Network: `POST /api_industrializacion/v1/rfq/<rfq_id>/enviar/?tipo=mold` -> `200`.
- Banner verde confirma el envio.
- Estado vuelve a `PENDING`.

Cerrar sesion.

---

## CAMINO B — Solicitar edicion y Comercializacion rechaza

Requiere una segunda RFQ `PENDING` distinta a la usada en el Camino A. Si solo existe una, crearla de nuevo siguiendo `01_FLUJO_MOLD_COMPLETO_CIERRE.md` pasos 1 y 2.

Anotar el nuevo `<rfq_id_b>`.

---

### B1. Industrializacion solicita edicion (segunda RFQ)

Login: `ind_base@bocar.com`.

1. Abrir detalle de la segunda RFQ: `/industrializacion/rfq/<rfq_id_b>?tipo=Mold`.
2. Clic en `Request edit`.
3. En el modal, ingresar motivo: `Solicitud que sera rechazada E2E`.
4. Clic en `Solicitar edicion`.

Esperado:

- Network: `POST /api_industrializacion/v1/edit-requests/?tipo=mold` -> `201`.
- Body: `{ "rfq_mold": <rfq_id_b>, "reason": "Solicitud que sera rechazada E2E" }`.
- Banner verde de exito en pantalla.

Cerrar sesion.

---

### B2. Comercializacion rechaza la solicitud

Login: `com_base@bocar.com`.

1. Abrir detalle de la segunda RFQ.
2. Verificar botones `Approve request` y `Reject request`.
3. Clic en `Reject request`.
4. Confirmar que se abre un modal con:
   - Titulo: "Rechazar solicitud de edicion".
   - Texto: el RFQ permanecera en Comercializacion.
   - Boton `Rechazar` en rojo outline.
5. Clic en `Rechazar`.

Esperado bajo el capot:

- Primera llamada: `GET /api_comercializacion/v1/solicitudes/` -> `200`.
- Segunda llamada: `PATCH /api_comercializacion/v1/edit-requests/<edit_request_id>/rechazar/?tipo=mold` -> `200`.

Esperado en UI:

- Modal se cierra.
- Banner verde con mensaje de rechazo ("Solicitud rechazada. El RFQ permanece en Comercializacion.").
- Navega automaticamente al dashboard.

---

### B3. Industrializacion no puede editar tras rechazo

Login: `ind_base@bocar.com`.

1. Abrir detalle de la segunda RFQ.
2. Verificar estado: debe ser `PENDING` / `En_Com`, no `DRAFT`.
3. Verificar que NO aparece el boton `Edit RFQ` en la barra de acciones para un usuario estandar de Ind.
4. El boton `Request edit` puede aparecer de nuevo si el backend lo permite (sin solicitud pendiente activa). Reportar si esta presente o ausente.

Cerrar sesion.

---

## Validaciones de UI que el agente debe confirmar en ambos caminos

- [ ] El modal de solicitar edicion abre y cierra correctamente (Escape, clic en fondo y boton Cancelar).
- [ ] El boton `Solicitar edicion` esta deshabilitado si el textarea esta vacio.
- [ ] El modal muestra error inline si la API responde `400` o `4xx`, sin cerrar el modal.
- [ ] El modal de confirmar aprobar/rechazar muestra error inline si la API falla.
- [ ] El banner de feedback aparece en la pagina tras cerrar el modal con exito.
- [ ] La navegacion automatica ocurre ~2.5 segundos despues del exito.
- [ ] El boton `Assign suppliers` aparece deshabilitado mientras hay solicitud de edicion pendiente.

---

## Bugs y fallas que el agente debe reportar

Generar reporte `.md` con la plantilla de `00_INDICE_Y_PROTOCOLO_AGENTES.md`.

Vigilar especialmente:

- El modal no abre al hacer clic en `Request edit`.
- El modal cierra sin llamar al backend al hacer clic en `Solicitar edicion`.
- La primera llamada `GET /solicitudes/` falla con `403` o `404` al intentar aprobar/rechazar.
- El `edit_request_id` no se encuentra en la respuesta de solicitudes (motivo: RFQ id no coincide o solicitud ya resuelta).
- El estado de la RFQ no cambia a `DRAFT` tras aprobacion.
- El estado de la RFQ no permanece `PENDING` tras rechazo.
- La barra de acciones no actualiza sus botones tras ejecutar la accion (requiere recarga manual).
- El modal de confirmacion muestra boton `Rechazar` en azul en lugar de rojo.
- La navegacion automatica no ocurre (el banner aparece pero la pagina no se mueve).
