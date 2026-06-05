# Reporte E2E — Mold completo, un proveedor

## Resumen
- Agente: Codex Browser MCP
- Fecha: 2026-06-04
- Ambiente: Local, backend Django y frontend Vite
- Frontend URL: http://localhost:5173
- Backend URL: http://localhost:8000
- Resultado: FAIL

## Datos usados
- Usuario Industrializacion: ind_base@bocar.com
- Usuario Comercializacion: No ejecutado por bloqueo en creacion
- Usuario Proveedor: No ejecutado por bloqueo en creacion
- Tipo RFQ: Mold
- RFQ id: No generado
- Assignment id(s): No generado
- Proveedor(es): No asignado
- Fechas usadas: 2026-06-24

## Pasos ejecutados
| Paso | Resultado UI | Network esperado | Network observado | Estado |
|------|--------------|------------------|-------------------|--------|
| 1. Abrir dashboard Industrializacion | Dashboard cargo con datos reales: 23 drafts, 5 active, 4 historical | `GET /api_industrializacion/v1/rfqs/` -> `200`; `GET /api_general/v1/rfq-count/` -> `200` | `GET /api_industrializacion/v1/rfqs/` -> `200`. No se observo `rfq-count` durante la recarga capturada | PASS CON OBSERVACION |
| 2. Abrir crear RFQ y seleccionar Mold | Se mostro workspace `CREATE RFQ · Mold`, 11 paginas | Sin request obligatorio | Sin request | PASS |
| 3. Llenar campos minimos | Se llenaron campos visibles con datos E2E; se avanzo hasta pagina 11 | Sin request hasta submit | Sin request | PASS |
| 4. Adjuntar archivo | UI mostro `1 FILE ATTACHED`, `PDF`, `e2e-mold-test-upload.pdf` | Archivo debe viajar en `multipart/form-data` al crear | No hubo submit, por lo tanto no se pudo verificar payload | PASS PARCIAL |
| 5. Submit RFQ | Click en `Submit RFQ` no cambio pantalla, no mostro error y no navego | `POST /api_industrializacion/v1/rfq/?tipo=mold` -> `201` | Ningun request `/api_` despues del click | FAIL |
| 6. Enviar a Comercializacion | No ejecutado | `POST /api_industrializacion/v1/rfq/<id>/enviar/?tipo=mold` -> `200` | No ejecutado | BLOCKED |
| 7. Compras asigna proveedor | No ejecutado | `POST /api_comercializacion/v1/asignaciones/crear/?tipo=mold` -> `200` | No ejecutado | BLOCKED |
| 8. Proveedor cotiza | No ejecutado | `POST /api_proveedores/v1/asginaciones/responder/<assignment_id>/?tipo=mold` -> `201` y envio -> `200` | No ejecutado | BLOCKED |
| 9. Compras confirma cierre | No ejecutado | `GET /api_comercializacion/v1/rfqs/` -> `200`, estado `CLOSED` | No ejecutado | BLOCKED |

## Bugs y fallas encontradas
| Severidad | Titulo | Paso | Evidencia | Reproducibilidad |
|-----------|--------|------|-----------|------------------|
| Bloqueante | `Submit RFQ` en creacion Mold no dispara request ni error visible | 5 | Ruta `http://localhost:5173/industrializacion/rfq/crear`, pagina 11. UI muestra PDF adjunto y boton habilitado; despues de click no se emite `POST /api_industrializacion/v1/rfq/?tipo=mold`, no hay navegacion ni mensaje de error | Siempre en esta sesion |
| Ruido | HMR reporto `ReferenceError: z is not defined` en `rfqLifecycleService.ts` antes de recargar | 2-5 | Console log `.playwright-mcp/console-2026-06-04T23-47-22-441Z.log`, lineas con `src/features/rfq/services/rfqLifecycleService.ts` | Una vez; despues de recarga no se repitio |
| Observacion | `Save Draft` muestra toast local sin request | 5 | Click en `Save Draft` mostro `Draft saved.` pero no emitio ningun request `/api_` | Siempre en esta sesion |

## Capturas o evidencia adicional
- Screenshot: `Bocar-front/specs/e2e-rfq-flujos/reportes/REPORTE_01_MOLD_COMPLETO_BROWSER_2026-06-04.png`
- Archivo adjunto usado: `Bocar-front/specs/e2e-rfq-flujos/reportes/e2e-mold-test-upload.pdf`
- Requests relevantes:
  - `GET http://localhost:8000/api_industrializacion/v1/rfqs/` -> `200`
  - Esperado pero no observado: `POST http://localhost:8000/api_industrializacion/v1/rfq/?tipo=mold`

## Decision final
- El flujo queda validado: No
- Riesgo residual: Alto. No se pudo crear la RFQ desde frontend, por lo que no se validaron transiciones `DRAFT -> PENDING -> QUOTING -> CLOSED`.
- Recomendacion siguiente: Revisar el handler de submit/validacion del workspace Mold y agregar feedback visible cuando el submit no pueda construir el payload.
