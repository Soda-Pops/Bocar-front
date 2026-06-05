# Reporte E2E — RFQ Trimming completa hasta cierre

## Resumen
- Agente: Codex Browser/Playwright
- Fecha: 2026-06-05
- Ambiente: Backend Django local + Frontend Vite local
- Frontend URL: http://localhost:5173
- Backend URL: http://localhost:8000
- Resultado: PASS CON OBSERVACIONES

## Datos usados
- Usuario Industrializacion: ind_base@bocar.com
- Usuario Comercializacion: com_base@bocar.com
- Usuario Proveedor: test_pro@bocar.com
- Tipo RFQ: Trimming
- RFQ id: 8
- Assignment id(s): 6
- Proveedor(es): Proveedor Test SA (backend id 1)
- Fechas usadas: RFQ due date 2026-07-15; assignment due date 2026-07-20
- Identificador de prueba: TRIM-E2E-20260605002009

## Pasos ejecutados
| Paso | Resultado UI | Network esperado | Network observado | Estado |
|------|--------------|------------------|-------------------|--------|
| 1. Login Industrializacion | Dashboard de Industrializacion visible | Login OK | Redireccion a `/industrializacion/dashboard` | PASS |
| 2. Crear RFQ Trimming | UI muestra `RFQ created successfully`; PDF adjunto visible | `POST /api_industrializacion/v1/rfq/?tipo=trimming` -> 201 multipart | 201 `RFQ Trimming creado correctamente.` | PASS |
| 3. Enviar a Comercializacion | Detalle RFQ-0008 muestra mensaje de envio correcto | `POST /api_industrializacion/v1/rfq/8/enviar/?tipo=trimming` -> 200 | 200 `RFQ Trimming enviado a Comercialización correctamente.` | PASS |
| 4. Compras asigna proveedor | Panel muestra `Suppliers selected successfully` | `GET /api_proveedores/v1/proveedores/` -> 200; `POST /api_comercializacion/v1/asignaciones/crear/?tipo=trimming` -> 200 | GET 200; POST 200 payload `{"id_rfq":8,"proveedores":[1],"due_date":"2026-07-20"}` | PASS |
| 5. Proveedor abre detalle | RFQ-0008 visible `IN QUOTATION`, specs Trimming y PDF cargan | `GET /api_proveedores/v1/asginaciones/detalle/6/?tipo=trimming` -> 200 | 200 con PNUM `TRIM-E2E-20260605002009` | PASS |
| 6. Proveedor guarda borrador | Formulario Trimming permite guardar | `POST /api_proveedores/v1/asginaciones/responder/6/?tipo=trimming` -> 201; sin 404 previo | 201; no se observo `GET responder/6/detalle` 404 antes del POST | PASS |
| 7. Proveedor envia cotizacion | UI muestra `Your quotation for 6 was submitted to Purchasing for review.` | `POST /api_proveedores/v1/asginaciones/responder/6/enviar/?tipo=trimming` -> 200 | PATCH borrador 200; POST enviar 200 `Respuesta enviada correctamente.` | PASS CON OBSERVACION |
| 8. Compras confirma cierre | Dashboard Historical no muestra RFQ-0008 en primera pagina, pero payload de Compras trae Trimming id 8 completo | Estado `CLOSED` o completo; progreso completo | `GET /api_comercializacion/v1/rfqs/` -> trimming id 8 `status:"En_Pro"`, `progreso_proveedores:"Completo"` | PASS CON OBSERVACION |

## Bugs y fallas encontradas
| Severidad | Titulo | Paso | Evidencia | Reproducibilidad |
|-----------|--------|------|-----------|------------------|
| Funcional | Respuesta final de proveedor no incluye `rfq_completed:true` | 7 | Esperado por runbook: `rfq_completed:true`; observado: `{"detail":"Respuesta enviada correctamente."}` | Siempre en esta corrida |
| Funcional | Despues de guardar borrador, el formulario puede requerir rehidratar campos obligatorios para enviar | 7 | En corrida previa del mismo flujo, tras `POST responder -> 201`, el submit final regreso a pagina 1 con error `Enter the supplier name`; al rellenar de nuevo `supplier` y `ts_max_weight_trim_die`, envio paso | Reproducible en una corrida |
| Ruido | RfqDetail de proveedor intenta cargar catalogo de proveedores y recibe 403 | 5 | `GET /api_proveedores/v1/proveedores/` -> 403 con usuario proveedor: `Acceso denegado: se requiere ser del área de Comercialización.` No bloqueo el flujo | Siempre en vistas proveedor que reutilizan detalle |
| Observacion | Cierre se expresa como `status:"En_Pro"` + `progreso_proveedores:"Completo"`, no como `CLOSED` literal | 8 | API Compras trimming id 8: `status:"En_Pro"`, `progreso_proveedores:"Completo"`; DB: `RFQ_Trimming.complete=1`, asignacion `is_answered=1`, `is_closed=1` | Siempre en esta corrida |

## Capturas o evidencia adicional
- Creacion: `TRIM-E2E-20260605002009-03-after-create.png`
- Envio Industrializacion: `TRIM-E2E-20260605002009-continue-03-after-submit-ind.png`
- Asignacion Compras: `TRIM-E2E-20260605002009-assign-03-after-submit.png`
- Proveedor envio: `TRIM-E2E-20260605002009-supplier-05-after-send.png`
- Compras cierre: `TRIM-E2E-20260605002009-compras-01-dashboard.png`
- Evidencia JSON:
  - `TRIM-E2E-20260605002009-evidence.json`
  - `TRIM-E2E-20260605002009-continue-evidence.json`
  - `TRIM-E2E-20260605002009-assign-evidence.json`
  - `TRIM-E2E-20260605002009-supplier-evidence.json`
  - `TRIM-E2E-20260605002009-compras-evidence.json`

## Decision final
- El flujo queda validado: Si, con observaciones.
- Riesgo residual: medio-bajo; el ciclo operativo cierra, pero hay inconsistencias de contrato/UI alrededor de `rfq_completed`, estado `CLOSED` literal y persistencia del formulario tras guardar borrador.
- Recomendacion siguiente: ajustar contrato de `enviar` proveedor para devolver `rfq_completed`, revisar rehidratacion del formulario de cotizacion despues de `Save Draft`, y normalizar display de cierre en Compras.
