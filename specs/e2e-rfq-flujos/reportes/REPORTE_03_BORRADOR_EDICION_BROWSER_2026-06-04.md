# Reporte E2E — Flujo 03 Borrador y edicion de RFQ antes de enviar

## Resumen
- Agente: Codex Browser MCP
- Fecha: 2026-06-04 America/Mexico_City
- Ambiente: Backend Django `http://localhost:8000`, Frontend Vite `http://localhost:5173`
- Frontend URL: `http://localhost:5173`
- Backend URL: `http://localhost:8000`
- Resultado: PASS CON OBSERVACIONES

## Datos usados
- Usuario Industrializacion: `ind_base@bocar.com`
- Usuario Comercializacion: No usado
- Usuario Proveedor: No usado
- Tipo RFQ: Mold
- RFQ id: `32`
- Assignment id(s): N/A
- Proveedor(es): N/A
- Fechas usadas: due date backend `2026-06-19`; UI muestra `18/06/2026`
- Valores originales: `Draft edicion original 20260605014802`, `EDIT-ORIG-20260605014802`
- Valores actualizados: `Draft edicion actualizada 20260605015116`, `EDIT-UPD-20260605015116`
- Archivos: `fixture_archivo_A_flujo_03.pdf`, `fixture_archivo_B_flujo_03.pdf`

## Pasos ejecutados
| Paso | Resultado UI | Network esperado | Network observado | Estado |
|------|--------------|------------------|-------------------|--------|
| 1. Login Industrializacion | Sesion existente como `ind_base`; dashboard Industrialization visible | N/A | `GET /api_industrializacion/v1/rfqs/` -> `200` | PASS |
| 2. Crear RFQ Mold draft | UI mostro exito: "RFQ created successfully..." | `POST /api_industrializacion/v1/rfq/?tipo=mold` -> `201` | Se observaron dos POST: uno `401` sin credenciales y otro `201` con `{"detail":"RFQ Mold creado correctamente."}` | PASS CON OBSERVACION |
| 3. Ver dashboard/detalle | RFQ `RFQ-0032` visible; detalle muestra `DRAFT`, acciones `Open RFQ`, `Edit RFQ`, `Submit RFQ`, `Delete draft` | `GET /api_mold/v1/rfq-molds/32/` -> `200` | `GET /api_mold/v1/rfq-molds/32/` -> `200` | PASS |
| 4. Abrir edicion | Formulario precargado con datos reales (`rfq_name`, `cust`, `ppy`, `part_tech`) | `GET /api_mold/v1/rfq-molds/32/` -> `200` | `GET /api_mold/v1/rfq-molds/32/` -> `200` | PASS |
| 5. Actualizar campos y adjuntar archivo B | Vuelve al detalle; descripcion y PT actualizados; ambos archivos visibles | `PATCH /api_industrializacion/v1/rfq/32/?tipo=mold` -> `200`, `multipart/form-data` | `PATCH /api_industrializacion/v1/rfq/32/?tipo=mold` -> `200`, `multipart/form-data`, `{"detail":"RFQ Mold actualizado correctamente."}` | PASS CON OBSERVACION |
| 6. Enviar a Comercializacion | Mensaje de envio correcto y redireccion; tras reload UI muestra `PENDING ASSIGNMENT` y solo `Request edit` | `POST /api_industrializacion/v1/rfq/32/enviar/?tipo=mold` -> `200` | `POST /api_industrializacion/v1/rfq/32/enviar/?tipo=mold` -> `200`, `{"detail":"RFQ Mold enviado a Comercialización correctamente."}` | PASS |

## Bugs y fallas encontradas
| Severidad | Titulo | Paso | Evidencia | Reproducibilidad |
|-----------|--------|------|-----------|------------------|
| Funcional | `Save Draft` no persiste en backend durante creacion | 2 | Al hacer click en `Save Draft`, la UI muestra `Draft saved.`, pero no hay POST y el dashboard no recibe una RFQ nueva. El guardado real ocurre con el boton final `Submit RFQ`. | Siempre en esta prueba |
| Funcional | `PNUM` no refleja el cambio de `part_number` tras PATCH | 5 | Se edito `part_number` a `EDIT-UPD-20260605015116`; `PATCH` respondio `200`, pero detalle y API mantienen `PNUM:"EDIT-ORIG-20260605014802"`. Header y `PT` si muestran `EDIT-UPD-20260605015116`. | Siempre en esta prueba |
| Ruido | Doble POST durante creacion, uno `401` y otro `201` | 2 | Network observo dos `POST /api_industrializacion/v1/rfq/?tipo=mold`: primero `401 {"detail":"Authentication credentials were not provided."}`, despues `201`. La UI termina en exito. | Una vez en esta prueba |
| Ruido | `GET /api_proveedores/v1/proveedores/` devuelve `403` en detalle de Industrializacion | 3 y 6 | Console muestra `Failed to load resource: the server responded with a status of 403 (Forbidden)` para proveedores. No bloqueo el flujo. | Siempre en detalle |

## Capturas o evidencia adicional
- Screenshot: `Bocar-front/specs/e2e-rfq-flujos/reportes/REPORTE_03_BORRADOR_EDICION_BROWSER_2026-06-04.png`
- Requests relevantes:
  - `POST http://localhost:8000/api_industrializacion/v1/rfq/?tipo=mold` -> `201`
  - `GET http://localhost:8000/api_mold/v1/rfq-molds/32/` -> `200`
  - `PATCH http://localhost:8000/api_industrializacion/v1/rfq/32/?tipo=mold` -> `200`
  - `POST http://localhost:8000/api_industrializacion/v1/rfq/32/enviar/?tipo=mold` -> `200`
- Estado final backend: list row `id:32`, `status:"En_Com"`, `created_by_name:"ind_base"`, `complete:false`
- Estado final UI: `PENDING ASSIGNMENT`, sin `Edit RFQ`, con `Request edit`
- Archivos finales en detalle/API:
  - `fixture_archivo_A_flujo_03.pdf`
  - `fixture_archivo_B_flujo_03.pdf`

## Decision final
- El flujo queda validado: Si, con observaciones funcionales.
- Riesgo residual: Medio. El ciclo principal funciona, pero `Save Draft` comunica persistencia falsa y `PNUM` no se actualiza aunque el PATCH sea exitoso.
- Recomendacion siguiente: corregir persistencia/label de `Save Draft` y revisar el mapeo frontend/backend de `part_number` -> `PNUM` en update de Mold.
