# Runbook E2E — RFQ Mold completa hasta cierre

Objetivo: validar desde navegador que una RFQ tipo Mold puede recorrer el ciclo conectado al backend: Industrializacion crea y envia, Comercializacion asigna proveedor, Proveedor cotiza, y Compras ve el cierre.

---

## 0. Prerrequisitos

- Entorno y usuarios segun `00_INDICE_Y_PROTOCOLO_AGENTES.md`.
- Usar un archivo local pequeno para adjuntar, por ejemplo `.pdf`, `.txt` o imagen.
- Usar fecha futura para `due_date`, idealmente 15 a 30 dias despues del dia de prueba.
- Abrir DevTools/Network antes de iniciar.

---

## 1. Industrializacion crea RFQ Mold

Login: `ind_base@bocar.com`.

1. Ir a `/industrializacion/dashboard`.
2. Confirmar que el dashboard carga datos reales.
   - Network esperado: `GET /api_industrializacion/v1/rfqs/` -> `200`.
   - Network esperado: `GET /api_general/v1/rfq-count/` -> `200`.
3. Clic en crear RFQ o ir a `/industrializacion/rfq/crear`.
4. Elegir tipo `Mold`.
5. Llenar campos minimos:
   - Description: `Mold E2E cierre <timestamp>`.
   - Part N / PNUM: `MOLD-E2E-<timestamp>`.
   - Due date futura.
   - Valores numericos requeridos con `0` o `1` cuando aplique.
6. En `UPLOAD FILES`, adjuntar al menos un archivo.
7. Enviar el formulario.

Esperado:

- Network: `POST /api_industrializacion/v1/rfq/?tipo=mold` -> `201`.
- Request: `multipart/form-data`.
- UI: mensaje de exito.
- La RFQ aparece en dashboard como `DRAFT` / `En_Ind`.

Anotar el RFQ id real.

---

## 2. Industrializacion envia a Comercializacion

1. Abrir el detalle de la RFQ creada: `/industrializacion/rfq/<rfq_id>?tipo=Mold` o desde la fila.
2. Confirmar que el detalle muestra:
   - Description creada.
   - Tipo Mold.
   - Archivo adjunto listado.
3. Ejecutar accion `Submit RFQ` / enviar a Compras.

Esperado:

- Network: `POST /api_industrializacion/v1/rfq/<rfq_id>/enviar/?tipo=mold` -> `200`.
- UI: estado cambia a `PENDING`.
- Dashboard Industrializacion ya no debe mostrarla como draft editable normal; debe aparecer como activa.

Cerrar sesion.

---

## 3. Comercializacion asigna proveedor

Login: `com_base@bocar.com`.

1. Ir a `/compras/dashboard`.
2. Buscar la RFQ Mold por id.
3. Confirmar estado `PENDING` y progreso tipo `Sin proveedores asignados`.
4. Abrir accion `Assign suppliers` o ruta `/compras/rfq/<rfq_id>/asignar?tipo=Mold`.
5. Confirmar catalogo real de proveedores.
   - Network: `GET /api_proveedores/v1/proveedores/` -> `200`.
6. Seleccionar `test_pro` si aparece o un proveedor disponible ligado a usuario Pro.
7. Definir due date futura de asignacion.
8. Confirmar asignacion.

Esperado:

- Network: `POST /api_comercializacion/v1/asignaciones/crear/?tipo=mold` -> `200`.
- Body contiene `id_rfq`, `due_date`, `proveedores`.
- UI vuelve al detalle o dashboard sin error.
- RFQ pasa a `QUOTING` / `En_Pro`.
- Progreso: `0/1 contestados` o equivalente.

Anotar proveedor y, si la UI lo expone, assignment id.

Cerrar sesion.

---

## 4. Proveedor crea y envia cotizacion

Login: `test_pro@bocar.com`.

1. Ir a `/proveedor/dashboard`.
2. Buscar la RFQ asignada en pendientes.
   - Network: `GET /api_proveedores/v1/asginaciones/mis-asignaciones/` -> `200`.
3. Abrir detalle.
   - Network: `GET /api_proveedores/v1/asginaciones/detalle/<assignment_id>/?tipo=mold` -> `200`.
4. Confirmar que se ven specs y archivo de la RFQ Mold.
5. Clic en `Create quotation`.
6. Llenar algunos campos del cost breakdown. Si el formulario permite defaults, dejar campos opcionales con default.
7. Guardar borrador.

Esperado de primer borrador:

- Network: `POST /api_proveedores/v1/asginaciones/responder/<assignment_id>/?tipo=mold` -> `201`.
- No debe existir un `GET /responder/<assignment_id>/detalle/?tipo=mold` previo que responda `404` en el primer guardado.
- UI: feedback de borrador guardado.

8. Enviar cotizacion.

Esperado de envio:

- Si hubo guardado previo, puede aparecer `PATCH /responder/<assignment_id>/actualizar/?tipo=mold` -> `200` antes del envio.
- Network: `POST /api_proveedores/v1/asginaciones/responder/<assignment_id>/enviar/?tipo=mold` -> `200`.
- Response incluye `assignment_closed` y `rfq_completed`.
- Para un solo proveedor, `rfq_completed` debe ser `true`.
- Dashboard Proveedor mueve la asignacion a contestadas/historicas.

Cerrar sesion.

---

## 5. Comercializacion confirma cierre

Login: `com_base@bocar.com`.

1. Ir a `/compras/dashboard`.
2. Buscar RFQ.
3. Confirmar estado final.

Esperado:

- Network: `GET /api_comercializacion/v1/rfqs/` -> `200`.
- RFQ muestra `CLOSED` o equivalente.
- Progreso indica completo.
- No debe seguir ofreciendo accion de asignar si esta cerrada.

---

## Bugs/fallas que el agente debe reportar

Reportar cualquier hallazgo en un `.md` usando la plantilla de `00_INDICE_Y_PROTOCOLO_AGENTES.md`.

Casos a vigilar especialmente:

- RFQ creada sin archivo pero enviada exitosamente.
- POST de creacion no usa `multipart/form-data`.
- Archivo adjunto no aparece en detalle.
- RFQ no cambia `DRAFT -> PENDING -> QUOTING -> CLOSED`.
- Proveedor no ve asignacion creada.
- Primer guardado de borrador genera `GET .../detalle/` con `404`.
- Envio de cotizacion responde `200` pero dashboard de Compras no actualiza progreso.

