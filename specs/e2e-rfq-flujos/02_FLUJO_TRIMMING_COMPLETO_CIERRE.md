# Runbook E2E — RFQ Trimming completa hasta cierre

Objetivo: validar el mismo ciclo completo del flujo Mold, pero con RFQ tipo Trimming. Este flujo verifica mapeos, formularios y endpoints especificos de Trimming.

---

## 0. Prerrequisitos

- Entorno base de `00_INDICE_Y_PROTOCOLO_AGENTES.md`.
- Archivo local para adjuntar.
- Fecha futura.
- Network abierto.

---

## 1. Industrializacion crea RFQ Trimming

Login: `ind_base@bocar.com`.

1. Ir a `/industrializacion/rfq/crear`.
2. Elegir tipo `Trimming`.
3. Llenar campos minimos:
   - Description: `Trimming E2E cierre <timestamp>`.
   - Part number: `TRIM-E2E-<timestamp>`.
   - Due date futura.
   - Campos numericos requeridos con valores simples.
4. Adjuntar al menos un archivo en `UPLOAD FILES`.
5. Enviar.

Esperado:

- Network: `POST /api_industrializacion/v1/rfq/?tipo=trimming` -> `201`.
- Request: `multipart/form-data`.
- UI: exito.
- Dashboard: RFQ aparece como draft.

Anotar RFQ id.

---

## 2. Enviar Trimming a Comercializacion

1. Abrir detalle de la RFQ.
2. Confirmar que specs Trimming y archivo cargan.
3. Accion `Submit RFQ`.

Esperado:

- Network: `POST /api_industrializacion/v1/rfq/<rfq_id>/enviar/?tipo=trimming` -> `200`.
- Estado visual: `PENDING`.

Cerrar sesion.

---

## 3. Comercializacion asigna proveedor

Login: `com_base@bocar.com`.

1. Ir a `/compras/dashboard`.
2. Buscar la RFQ Trimming.
3. Abrir asignacion de proveedores.
4. Seleccionar proveedor disponible.
5. Definir due date futura.
6. Confirmar.

Esperado:

- Network: `GET /api_proveedores/v1/proveedores/` -> `200`.
- Network: `POST /api_comercializacion/v1/asignaciones/crear/?tipo=trimming` -> `200`.
- RFQ pasa a `QUOTING`.
- Progreso `0/1` o equivalente.

Cerrar sesion.

---

## 4. Proveedor responde Trimming

Login: `test_pro@bocar.com`.

1. Ir a `/proveedor/dashboard`.
2. Abrir asignacion Trimming.
3. Confirmar detalle:
   - Network: `GET /api_proveedores/v1/asginaciones/detalle/<assignment_id>/?tipo=trimming` -> `200`.
   - Specs Trimming reales.
4. Entrar a `Create quotation`.
5. Llenar algunos campos del formulario de cotizacion Trimming.
6. Guardar borrador.

Esperado:

- Primer guardado: `POST /api_proveedores/v1/asginaciones/responder/<assignment_id>/?tipo=trimming` -> `201`.
- No debe haber `GET .../responder/<assignment_id>/detalle/?tipo=trimming` -> `404` antes del primer POST.

7. Enviar cotizacion.

Esperado:

- `POST /api_proveedores/v1/asginaciones/responder/<assignment_id>/enviar/?tipo=trimming` -> `200`.
- `rfq_completed:true` si solo hay un proveedor.

Cerrar sesion.

---

## 5. Comercializacion confirma cierre

Login: `com_base@bocar.com`.

1. Ir a `/compras/dashboard`.
2. Verificar RFQ Trimming.

Esperado:

- Estado `CLOSED` o completo.
- Progreso completo.
- No aparecen datos mock mezclados con la RFQ real.

---

## Bugs/fallas que el agente debe reportar

Generar reporte `.md` con plantilla de `00_INDICE_Y_PROTOCOLO_AGENTES.md`.

Vigilar:

- Campos Trimming no enviados o mapeados como Mold.
- Endpoint usa `tipo=mold` por error.
- Formulario Trimming no hereda datos de la RFQ al crear cotizacion.
- Primer borrador genera 404 de detalle.
- Cierre no se refleja en Compras.

