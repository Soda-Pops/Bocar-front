# Reporte de verificacion RFQ en navegador — 2026-06-04

Flujo probado con backend `http://localhost:8000` y frontend `http://localhost:5173`.
RFQ creada durante la prueba: `RFQ-0024` (`Mold`), asignacion proveedor: `3`.

## Resultado general

El flujo completo llego a cierre:

- Industrializacion creo RFQ `24`: `POST /api_industrializacion/v1/rfq/?tipo=mold` -> `201`.
- Industrializacion envio RFQ `24`: `POST /api_industrializacion/v1/rfq/24/enviar/?tipo=mold` -> `200`.
- Comercializacion asigno `Proveedor Test SA`: `POST /api_comercializacion/v1/asignaciones/crear/?tipo=mold` -> `200`.
- Proveedor guardo borrador: `POST /api_proveedores/v1/asginaciones/responder/3/?tipo=mold` -> `201`.
- Proveedor envio cotizacion: `POST /api_proveedores/v1/asginaciones/responder/3/enviar/?tipo=mold` -> `200`.
- Comercializacion mostro `RFQ-0024` en `Historical` con estado `Done`.

## Bugs / complicaciones encontradas

1. El runbook indica que se puede adjuntar `.txt` o imagen en la RFQ, pero la UI final de Mold rechaza `.txt`.
   - Evidencia UI: `"qa-rfq-browser-upload.txt" — format not allowed. Accepted: PPT, PPTX, STP, PDF.`
   - La pantalla muestra formatos aceptados: `PPT, STP, PDF`.

2. Despues de crear la RFQ, la UI vuelve al selector de tipo en `/industrializacion/rfq/crear`.
   - El `POST` responde `201`, pero no se muestra claramente el ID creado ni un banner persistente de exito.
   - Se tuvo que ir al dashboard para localizar `RFQ-0024`.

3. La accion `Submit RFQ` no esta visible como accion principal en el detalle de Industrializacion.
   - En `RFQ-0024`, la pantalla aparece como `READ ONLY`.
   - La accion existe, pero queda escondida dentro del menu de icono `More actions`.
   - Esto no coincide con el runbook, que sugiere una accion directa `Enviar RFQ / Submit`.

4. En Compras, las acciones de fila son iconos sin texto visible.
   - Para `RFQ-0024`, la columna `ACTIONS` se ve vacia y la accion se descubre via menu con `aria-label="Abrir acciones"`.
   - La asignacion esta en `Assign suppliers`, no como boton visible.

5. El menu de acciones de Compras puede quedar fuera del viewport.
   - Playwright no pudo hacer click normal ni forzado en `Assign suppliers` porque el elemento resolvia como visible pero fuera del viewport.
   - Se continuo navegando directamente a `/compras/rfq/24/asignar`.

6. Despues de asignar proveedores, la UI no redirige al detalle.
   - `POST /api_comercializacion/v1/asignaciones/crear/?tipo=mold` responde `200`.
   - La pantalla queda en `/compras/rfq/24/asignar` con mensaje `Suppliers selected successfully.`
   - El runbook esperaba redireccion al detalle.

7. En el dashboard de Proveedor, la RFQ asignada aparece con ID `RFQ-0003`, no `RFQ-0024`.
   - Al abrir `RFQ-0003`, el detalle si muestra `RFQ-0024 — POWERTRAIN`.
   - Parece estar usando el ID de asignacion como si fuera ID de RFQ en la tabla de proveedor.

8. Al guardar borrador de cotizacion por primera vez, la UI/API hace primero un `GET` que responde `404`.
   - `GET /api_proveedores/v1/asginaciones/responder/3/detalle/?tipo=mold` -> `404`.
   - Luego se recupera con `POST /api_proveedores/v1/asginaciones/responder/3/?tipo=mold` -> `201`.
   - No bloquea, pero deja ruido de error en consola/red.

9. El runbook dice que basta llenar pocos campos del cost breakdown, pero el envio final exige `MAXIMUM WEIGHT FOR THE MOLD*`.
   - Al intentar enviar, la UI salto a `Page 11 of 26 · TOOL SPECIFICATION`.
   - Mensaje: `Enter the maximum mold weight.`
   - Se pudo continuar llenando `ts_max_weight_mold`.

10. La respuesta del envio definitivo no trae los flags esperados por el runbook.
    - Esperado: `assignment_closed` y `rfq_completed`.
    - Recibido en `POST /api_proveedores/v1/asginaciones/responder/3/enviar/?tipo=mold`:
      `{"detail":"Respuesta enviada correctamente."}`

11. Despues de enviar cotizacion, la UI del proveedor no muestra explicitamente `RFQ cerrada`.
    - Muestra: `Your quotation for 3 was submitted to Purchasing for review.`
    - La confirmacion de cierre se tuvo que validar en Compras `Historical`, donde `RFQ-0024` aparece `Done`.
