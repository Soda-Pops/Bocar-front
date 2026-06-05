# Runbook E2E — Cotizacion de proveedor: borrador, actualizar y enviar

Objetivo: validar con detalle el flujo del proveedor para una asignacion ya creada: ver detalle, crear primer borrador sin 404 previo, actualizar borrador con PATCH y enviar respuesta definitiva.

Este flujo se enfoca en el bug reciente del `GET .../responder/<id>/detalle/` que generaba 404 antes del primer POST.

---

## 0. Prerrequisitos

- RFQ asignada al proveedor `test_pro`.
- Assignment id visible o deducible desde la URL de detalle.
- No debe existir borrador previo para esa asignacion. Si ya existe, crear una RFQ/asignacion nueva.
- Network abierto y filtrado por `asginaciones`.

---

## 1. Abrir dashboard proveedor

Login: `test_pro@bocar.com`.

1. Ir a `/proveedor/dashboard`.
2. Identificar RFQ pendiente.

Esperado:

- `GET /api_proveedores/v1/asginaciones/mis-asignaciones/` -> `200`.
- La asignacion aparece en pendientes.
- La ruta usa el typo historico `asginaciones`; no corregirlo durante la prueba.

---

## 2. Ver detalle de asignacion

1. Abrir asignacion.

Esperado:

- `GET /api_proveedores/v1/asginaciones/detalle/<assignment_id>/?tipo=mold|trimming` -> `200`.
- UI muestra datos reales de RFQ.
- Archivo adjunto se lista como read-only.

---

## 3. Primer guardado de borrador

1. Clic en `Create quotation`.
2. Completar algunos campos.
3. Clic en `Save draft` / `Guardar borrador`.

Esperado estricto:

- Debe aparecer `POST /api_proveedores/v1/asginaciones/responder/<assignment_id>/?tipo=mold|trimming` -> `201`.
- No debe aparecer antes un `GET /api_proveedores/v1/asginaciones/responder/<assignment_id>/detalle/?tipo=...` -> `404`.
- UI muestra feedback positivo.

Si aparece un GET 404 antes del POST, reportar como bug funcional aunque el POST termine en 201.

---

## 4. Segundo guardado del mismo borrador

Sin salir de la pantalla:

1. Cambiar algun campo.
2. Guardar borrador otra vez.

Esperado:

- `PATCH /api_proveedores/v1/asginaciones/responder/<assignment_id>/actualizar/?tipo=mold|trimming` -> `200`.
- No debe intentar otro `POST` que responda `409`.
- UI mantiene feedback de actualizado/guardado.

---

## 5. Recargar y validar persistencia

1. Recargar la pagina o volver al dashboard y abrir la cotizacion otra vez.
2. Si la UI soporta cargar borrador existente, confirmar valores guardados.
3. Si la UI aun no precarga borrador existente, reportar como Gap UI.

Network posible:

- `GET /api_proveedores/v1/asginaciones/responder/<assignment_id>/detalle/?tipo=...` -> `200` cuando ya existe borrador.

---

## 6. Enviar cotizacion

1. Clic en `Submit Quotation`.

Esperado:

- Si hay cambios pendientes, puede ejecutarse `PATCH .../actualizar/` -> `200`.
- `POST /api_proveedores/v1/asginaciones/responder/<assignment_id>/enviar/?tipo=...` -> `200`.
- Response incluye:
  - `assignment_closed`.
  - `rfq_completed`.
- UI muestra mensaje claro.
- Dashboard proveedor mueve la RFQ a contestadas.

---

## 7. Intentar editar despues de enviar

1. Volver a la cotizacion o detalle.
2. Buscar accion para editar/enviar de nuevo.

Esperado:

- No debe permitir editar cotizacion enviada.
- Si intenta PATCH, backend debe responder `403`.
- UI debe mostrar error claro, no romper pantalla.

---

## Bugs/fallas que el agente debe reportar

Generar reporte `.md` con plantilla de `00_INDICE_Y_PROTOCOLO_AGENTES.md`.

Vigilar:

- GET 404 antes del primer POST.
- Segundo guardado hace POST y recibe 409.
- Formulario pierde datos al recargar aunque API devuelve borrador.
- Submit no mueve asignacion a contestadas.
- `rfq_completed` no coincide con cantidad de proveedores pendientes.
- UI permite editar despues de `submitted`.

