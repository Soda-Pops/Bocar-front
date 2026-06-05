# Runbook E2E — Solicitud de edicion de RFQ enviada a Compras

Objetivo: validar el flujo de solicitar edicion cuando una RFQ ya fue enviada a Comercializacion (`En_Com`). El backend tiene endpoints para crear, listar, aprobar y rechazar solicitudes; el frontend puede exponer parte del flujo desde el detalle y servicios de Compras. El agente debe validar lo que este disponible en UI y reportar cualquier gap.

---

## 0. Prerrequisitos

- Tener una RFQ Mold o Trimming en estado `PENDING` / `En_Com`.
- La RFQ debe haber sido creada por `ind_base@bocar.com`.
- No debe estar asignada a proveedores todavia.
- Network abierto.

Si no existe RFQ en ese estado, crear una siguiendo los pasos de `01` o `02` hasta enviar a Comercializacion, pero detenerse antes de asignar proveedores.

---

## 1. Industrializacion solicita edicion

Login: `ind_base@bocar.com`.

1. Ir a `/industrializacion/dashboard`.
2. Abrir la RFQ `PENDING`.
3. Verificar que aparece accion `Request edit` o equivalente.
4. Ejecutar accion.
5. Capturar motivo, por ejemplo: `Correccion E2E antes de asignacion`.

Esperado:

- Network: `POST /api_industrializacion/v1/edit-requests/?tipo=mold|trimming` -> `201`.
- Body contiene `rfq_mold` o `rfq_trimming` y `reason`.
- UI vuelve al dashboard o muestra feedback.
- La RFQ no debe permitir edicion inmediata hasta aprobacion.

Anotar id de RFQ y, si aparece, id de solicitud.

Cerrar sesion.

---

## 2. Comercializacion visualiza solicitudes pendientes

Login: `com_base@bocar.com`.

1. Buscar en dashboard o ruta admin si existe UI para solicitudes.
2. Intentar ubicar la solicitud creada.
3. Si no hay pantalla visible, revisar si algun dashboard carga solicitudes.

Network esperado si existe UI conectada:

- `GET /api_comercializacion/v1/solicitudes/` -> `200`.
- Respuesta contiene `solicitudes_edicion`.

Resultado esperado:

- La solicitud aparece con tipo, RFQ id, solicitante y reason.
- Mientras esta pendiente, asignar proveedores debe estar bloqueado o deshabilitado para esa RFQ.

Si la UI no expone una pantalla para solicitudes, reportar como **Gap UI** y continuar solo si existe una accion visible en detalle para aprobar/rechazar.

---

## 3A. Camino aprobar solicitud

Este camino debe ejecutarse si la UI muestra la solicitud y accion de aprobar.

1. Clic en aprobar.

Esperado:

- Network: `PATCH /api_comercializacion/v1/edit-requests/<request_id>/aprobar/?tipo=mold|trimming` -> `200`.
- UI indica aprobacion.
- RFQ vuelve a `DRAFT` / `En_Ind`.

Luego:

1. Cerrar sesion.
2. Login `ind_base@bocar.com`.
3. Abrir RFQ.
4. Confirmar que se puede editar.
5. Editar un campo pequeno y guardar.
6. Enviar de nuevo a Comercializacion.

Esperado:

- `PATCH /api_industrializacion/v1/rfq/<rfq_id>/?tipo=...` -> `200`.
- `POST /api_industrializacion/v1/rfq/<rfq_id>/enviar/?tipo=...` -> `200`.
- Estado final `PENDING`.

---

## 3B. Camino rechazar solicitud

Este camino debe ejecutarse con otra RFQ o si se reinicia el flujo.

1. Crear otra RFQ `PENDING`.
2. Solicitar edicion desde Industrializacion.
3. Login Comercializacion.
4. Rechazar solicitud si la UI lo permite.

Esperado:

- Network: `PATCH /api_comercializacion/v1/edit-requests/<request_id>/rechazar/?tipo=mold|trimming` -> `200`.
- RFQ permanece `PENDING` / `En_Com`.
- Industrializacion no puede editar directamente.
- Comercializacion puede asignar proveedores despues de resolver rechazo.

---

## Bugs/fallas que el agente debe reportar

Generar reporte `.md` con plantilla de `00_INDICE_Y_PROTOCOLO_AGENTES.md`.

Vigilar:

- Accion `Request edit` no aparece en RFQ creada por el usuario.
- Request edit llama endpoint equivocado o envia key incorrecta.
- La RFQ queda bloqueada sin forma visible de resolver.
- Compras no muestra solicitudes pendientes aunque API las tenga.
- Aprobar no regresa a `En_Ind`.
- Rechazar no libera asignacion de proveedores.
- UI muestra botones de aprobar/rechazar pero no estan cableados.

