# Runbook E2E — Dashboards, permisos y estados por rol

Objetivo: validar que cada rol ve las RFQs correctas, con CTAs correctas y datos reales, durante las etapas principales del ciclo de vida.

Este flujo no necesariamente crea todo desde cero; puede usar RFQs creadas por los flujos `01` a `06`.

---

## 0. Prerrequisitos

- Tener al menos:
  - Una RFQ `DRAFT` creada por Industrializacion.
  - Una RFQ `PENDING` enviada a Compras.
  - Una RFQ `QUOTING` con proveedor asignado.
  - Una RFQ `CLOSED` o completada, si existe.
- Usuarios base de los tres roles.
- Network abierto.

---

## 1. Login y redireccion por rol

Probar cada usuario:

| Usuario | Esperado |
|---------|----------|
| `ind_base@bocar.com` | Redirige a `/industrializacion/dashboard` |
| `com_base@bocar.com` | Redirige a `/compras/dashboard` |
| `test_pro@bocar.com` | Redirige a `/proveedor/dashboard` |

Network esperado:

- Login responde exitosamente.
- Cookies viajan en llamadas posteriores.

Reportar:

- Redireccion incorrecta.
- Dashboard admin aparece con usuario base.
- 401 despues de login exitoso.

---

## 2. Dashboard Industrializacion

Login Industrializacion.

Validar:

1. `GET /api_industrializacion/v1/rfqs/` -> `200`.
2. `GET /api_general/v1/rfq-count/` -> `200`.
3. Drafts:
   - Solo drafts propios deben ser visibles para usuario base.
   - Draft propio muestra acciones de editar/enviar.
4. RFQs enviadas:
   - Se ven como activas.
   - Si `PENDING`, creador puede ver accion de solicitar edicion.
5. RFQs cerradas:
   - Deben aparecer en historicas si el dashboard lo implementa.

Reportar si aparecen datos mock como RFQ fija, proveedores ficticios o progreso no real.

Cerrar sesion.

---

## 3. Dashboard Comercializacion

Login Comercializacion.

Validar:

1. `GET /api_comercializacion/v1/rfqs/` -> `200`.
2. RFQ `PENDING`:
   - Muestra accion de asignar proveedores.
   - Progreso `Sin proveedores asignados`.
3. RFQ `QUOTING`:
   - Muestra proveedores seleccionados.
   - Progreso `0/N` o parcial.
4. RFQ cerrada:
   - Estado `CLOSED`.
   - No debe tener accion de asignacion normal.
5. Si hay solicitudes pendientes y UI las carga:
   - `GET /api_comercializacion/v1/solicitudes/` -> `200`.

Cerrar sesion.

---

## 4. Dashboard Proveedor

Login Proveedor.

Validar:

1. `GET /api_proveedores/v1/asginaciones/mis-asignaciones/` -> `200`.
2. Pendientes:
   - Solo asignaciones del proveedor autenticado.
   - RFQs no asignadas a este proveedor no deben aparecer.
3. Contestadas/historicas:
   - Cotizaciones enviadas se mueven a esta seccion.
4. Abrir detalle de asignacion:
   - `GET /api_proveedores/v1/asginaciones/detalle/<assignment_id>/?tipo=...` -> `200`.
   - No expone datos de otros proveedores.

Cerrar sesion.

---

## 5. Intentos de acceso cruzado

Probar manualmente rutas copiadas entre roles:

1. Con proveedor, intentar abrir `/compras/dashboard`.
2. Con proveedor, intentar abrir detalle de una asignacion de otro proveedor si se conoce el id.
3. Con Comercializacion, intentar crear RFQ desde ruta de Industrializacion si no corresponde.
4. Con Industrializacion, intentar abrir ruta de asignacion de proveedores de Compras.

Esperado:

- Redireccion, bloqueo visual o error claro.
- No debe mostrar informacion sensible de otro rol.
- Network debe responder 401/403/404 segun backend, no 500.

---

## 6. Matriz de estados y CTAs esperadas

| Estado UI | Estado backend esperado | Industrializacion | Compras | Proveedor asignado |
|-----------|-------------------------|-------------------|---------|--------------------|
| DRAFT | `En_Ind` | Ver, editar, enviar, borrar si propio | Sin CTA operativo base | No visible |
| PENDING | `En_Com` | Solicitar edicion si creador | Asignar proveedores | No visible |
| QUOTING | `En_Pro` | Ver | Ver progreso | Crear cotizacion |
| PARTIALLY_QUOTED | `En_Pro` con respuestas parciales | Ver | Ver progreso parcial | Crear cotizacion si sigue pendiente |
| CLOSED | `complete=True` | Historico/ver | Historico/ver | Historico/ver si participo |

Reportar cualquier CTA ausente, sobrante o que llame endpoint incorrecto.

---

## Bugs/fallas que el agente debe reportar

Generar reporte `.md` con plantilla de `00_INDICE_Y_PROTOCOLO_AGENTES.md`.

Vigilar:

- Usuario ve RFQs que no deberia.
- Acciones visibles no coinciden con estado.
- Dashboard mezcla datos mock con datos reales.
- Conteos/KPIs no coinciden con listas.
- Acceso cruzado devuelve 500.
- Cookies no persisten entre refreshes.
- Loading infinito o error sin mensaje claro.

