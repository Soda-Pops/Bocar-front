# Runbook E2E — Asignacion multiproveedor y progreso de cotizaciones

Objetivo: validar que una RFQ asignada a varios proveedores muestra progreso correcto: sin respuestas, parcial y completo/cerrado. Este flujo requiere tener mas de un proveedor asignable en el catalogo. Si solo existe `test_pro`, reportar el bloqueo de datos de prueba.

---

## 0. Prerrequisitos

- Al menos dos proveedores activos en catalogo.
- Idealmente dos usuarios proveedor con credenciales conocidas para poder responder desde ambos.
- RFQ Mold o Trimming en `PENDING`.
- Network abierto.

Si no hay dos proveedores con usuarios, ejecutar hasta donde sea posible y reportar como **bloqueo por datos de prueba**.

---

## 1. Crear RFQ y enviarla a Compras

1. Login Industrializacion.
2. Crear RFQ con archivo y fecha futura.
3. Enviarla a Comercializacion.

Esperado:

- `POST /api_industrializacion/v1/rfq/?tipo=mold|trimming` -> `201`.
- `POST /api_industrializacion/v1/rfq/<id>/enviar/?tipo=...` -> `200`.
- Estado `PENDING`.

Cerrar sesion.

---

## 2. Asignar multiples proveedores

Login Comercializacion.

1. Ir a `/compras/dashboard`.
2. Abrir asignacion de proveedores.
3. Seleccionar 2 o mas proveedores.
4. Definir due date futura.
5. Confirmar.

Esperado:

- `GET /api_proveedores/v1/proveedores/` -> `200`.
- `POST /api_comercializacion/v1/asignaciones/crear/?tipo=mold|trimming` -> `200`.
- RFQ pasa a `QUOTING`.
- Progreso inicial `0/N contestados`.

Anotar N y los proveedores seleccionados.

---

## 3. Primer proveedor responde

Login como proveedor 1.

1. Abrir dashboard proveedor.
2. Ver asignacion pendiente.
3. Crear borrador.
4. Enviar cotizacion.

Esperado:

- `POST /api_proveedores/v1/asginaciones/responder/<assignment_id>/?tipo=...` -> `201`.
- `POST /api_proveedores/v1/asginaciones/responder/<assignment_id>/enviar/?tipo=...` -> `200`.
- Response: `rfq_completed:false` si quedan proveedores pendientes.

Cerrar sesion.

---

## 4. Compras revisa progreso parcial

Login Comercializacion.

1. Ir a dashboard.
2. Buscar RFQ.

Esperado:

- Estado visual `PARTIALLY_QUOTED` o `QUOTING` con progreso parcial, segun mapper actual.
- Progreso `1/N contestados`.
- RFQ no debe estar `CLOSED`.

Reportar si el backend refleja parcial pero UI no lo diferencia.

Cerrar sesion.

---

## 5. Proveedores restantes responden

Para cada proveedor restante:

1. Login con su usuario.
2. Abrir asignacion.
3. Crear/enviar cotizacion.
4. Confirmar respuesta `200`.

Esperado para el ultimo proveedor:

- Response `rfq_completed:true`.
- Asignacion pasa a contestadas.

---

## 6. Compras confirma cierre

Login Comercializacion.

1. Ir a dashboard.
2. Ver RFQ.

Esperado:

- Estado `CLOSED`.
- Progreso completo.
- No aparece como pendiente de cotizaciones.

---

## Bugs/fallas que el agente debe reportar

Generar reporte `.md` con plantilla de `00_INDICE_Y_PROTOCOLO_AGENTES.md`.

Vigilar:

- Catalogo no permite seleccionar multiples proveedores.
- POST omite proveedores seleccionados.
- Progreso no cambia tras primera respuesta.
- `rfq_completed` es `true` antes de que todos respondan.
- RFQ no cierra despues de la ultima respuesta.
- Proveedor ve asignaciones de otros proveedores.
- No existen suficientes usuarios proveedor para completar el flujo.

