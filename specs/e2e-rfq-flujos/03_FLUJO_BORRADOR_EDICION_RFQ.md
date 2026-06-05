# Runbook E2E — Borrador y edicion de RFQ antes de enviar

Objetivo: validar que Industrializacion puede crear una RFQ en draft, verla en dashboard, editar campos y archivos con PATCH, y luego enviarla a Comercializacion.

Este flujo debe correrse para Mold y, si hay tiempo, repetir para Trimming.

---

## 0. Prerrequisitos

- Login Industrializacion base.
- Archivo local A para crear.
- Archivo local B para editar.
- Network abierto.

---

## 1. Crear RFQ draft

1. Login `ind_base@bocar.com`.
2. Ir a `/industrializacion/rfq/crear`.
3. Elegir `Mold`.
4. Llenar datos:
   - Description: `Draft edicion original <timestamp>`.
   - Part number: `EDIT-ORIG-<timestamp>`.
   - Due date futura.
5. Adjuntar archivo A.
6. Submit.

Esperado:

- `POST /api_industrializacion/v1/rfq/?tipo=mold` -> `201`.
- Dashboard muestra draft.

Anotar RFQ id.

---

## 2. Abrir detalle y entrar a editar

1. Abrir `/industrializacion/rfq/<rfq_id>?tipo=Mold`.
2. Confirmar action bar para draft:
   - Open/View full detail.
   - Edit draft.
   - Submit RFQ.
   - Delete draft, si el rol lo permite.
3. Clic en `Edit draft` o navegar a `/industrializacion/rfq/<rfq_id>/editar?tipo=Mold`.

Esperado:

- Network: `GET /api_mold/v1/rfq-molds/<rfq_id>/` -> `200`.
- Formulario precargado con datos reales, no defaults mock.

---

## 3. Editar campos y adjuntar archivo nuevo

1. Cambiar Description a `Draft edicion actualizada <timestamp>`.
2. Cambiar Part number a `EDIT-UPD-<timestamp>`.
3. Adjuntar archivo B.
4. Guardar actualizacion.

Esperado:

- Network: `PATCH /api_industrializacion/v1/rfq/<rfq_id>/?tipo=mold` -> `200`.
- Request: `multipart/form-data`.
- No debe fallar con `RFQ_Mold_File instance expected`.
- Dashboard/detalle muestran los campos actualizados.
- Detalle lista el archivo original y/o el nuevo segun comportamiento actual del backend. Si solo muestra uno o no muestra el nuevo, reportar.

---

## 4. Enviar despues de editar

1. Desde detalle o dashboard, ejecutar `Submit RFQ`.

Esperado:

- `POST /api_industrializacion/v1/rfq/<rfq_id>/enviar/?tipo=mold` -> `200`.
- Estado cambia a `PENDING`.
- Ya no debe permitir edicion directa normal.

---

## 5. Repeticion opcional para Trimming

Repetir pasos con:

- `tipo=trimming`.
- Endpoints:
  - `POST /api_industrializacion/v1/rfq/?tipo=trimming`.
  - `GET /api_trimming/v1/rfq-trimmings/<rfq_id>/`.
  - `PATCH /api_industrializacion/v1/rfq/<rfq_id>/?tipo=trimming`.
  - `POST /api_industrializacion/v1/rfq/<rfq_id>/enviar/?tipo=trimming`.

---

## Bugs/fallas que el agente debe reportar

Generar reporte `.md` con plantilla de `00_INDICE_Y_PROTOCOLO_AGENTES.md`.

Vigilar:

- Formulario de edicion no precarga valores reales.
- PATCH manda JSON cuando hay archivos.
- PATCH con archivo falla.
- Cambios guardados no se reflejan al volver al detalle.
- RFQ enviada sigue mostrando `Edit draft`.
- Delete draft aparece pero no funciona o llama un endpoint inexistente.

