# Runbook de verificacion — Ciclo de vida completo de la RFQ (navegador)

Guia paso a paso para que un agente de IA (o un QA) verifique, **desde el navegador**, que el flujo completo de la RFQ esta conectado al backend real. Cubre: Industrializacion crea → envia a Comercializacion → Comercializacion asigna proveedores → Proveedor responde la cotizacion → la ultima respuesta auto-cierra la RFQ.

---

## 0. Prerrequisitos (levantar el entorno)

1. **Backend Django corriendo** en `http://localhost:8000`:
   ```bash
   cd backend-bocar-2026
   .venv/Scripts/activate        # Windows
   python manage.py runserver
   ```
   Verificacion rapida: abrir `http://localhost:8000/schema/swagger/` → debe cargar el Swagger.
2. **Frontend (Vite) corriendo** en `http://localhost:5173`:
   ```bash
   cd Bocar-front
   npm run dev
   ```
3. **`.env.local` del frontend** debe tener `VITE_API_BASE_URL=http://localhost:8000` (ya configurado).
4. Usar una **ventana de incognito** o limpiar cookies entre cambios de usuario (el auth usa cookies `HttpOnly`; ver paso de logout).

> Si el login falla con error de red/CORS: confirmar que el backend permite credenciales desde `http://localhost:5173`. Como el login ya funcionaba antes, normalmente no hay que tocar nada.

---

## 1. Usuarios de prueba

| Rol | Email | Password | Landing tras login |
|-----|-------|----------|--------------------|
| Industrializacion (estandar) | `ind_base@bocar.com` | `IndBase2026!` | `/industrializacion/dashboard` |
| Comercializacion / Compras (estandar) | `com_base@bocar.com` | `ComBase2026!` | `/compras/dashboard` |
| Proveedor | `test_pro@bocar.com` | `TestPro2026!` | `/proveedor/dashboard` |

> **Importante**: usar los usuarios **estandar (base)** de Ind y Com. Los usuarios `test_ind` / `test_com` tienen `is_admin=true` y aterrizan en los **dashboards de admin** (`/industrializacion/admin`, `/compras/admin`), que son otras pantallas. El flujo conectado a verificar vive en los **dashboards estandar de cada rol**. El proveedor (`test_pro`) no tiene variante admin.

### Como iniciar y cerrar sesion
- **Login**: ir a `http://localhost:5173/` → formulario de dos paneles → capturar email + password → boton de iniciar sesion. Redirige automaticamente al dashboard segun el rol.
- **Logout** (para cambiar de usuario): clic en el **avatar/nombre arriba a la derecha** → menu → **"Sign out"**. Vuelve al login. (Alternativa: limpiar cookies y recargar.)

---

## 2. Senales de exito generales (que observar en cada paso)
- **UI**: aparece el dato real (no los nombres mock tipo "PLASTIMEX", "GM Mexico", "RFQ-021"). Los IDs reales son numericos (ej. `RFQ-22` / `#22`).
- **Estados de carga**: cada pantalla debe mostrar loading → datos, o un estado de error claro si el backend esta caido.
- **Network** (DevTools → Network, o el panel de red del agente): cada accion dispara una llamada a `http://localhost:8000/...` que responde `2xx`. Revisar que las cookies viajan (`credentials: include`).

---

## ACTO 1 — Industrializacion: crear y enviar la RFQ

**Login como `ind_base@bocar.com`.**

### 1.1 Ver el dashboard con datos reales
- URL: `/industrializacion/dashboard`.
- **Esperado**: las tablas (Drafts / Active / Historical) y los KPIs se llenan desde el API (`GET /api_industrializacion/v1/rfqs/` y `GET /api_general/v1/rfq-count/`). Si no hay RFQs aun, los borradores estaran vacios — es valido.

### 1.2 Crear una RFQ tipo Mold
1. Clic en **Crear RFQ** (boton principal del dashboard) → o ir a `/industrializacion/rfq/crear`.
2. En la pantalla de seleccion de tipo, elegir **Mold**.
3. Llenar al menos los campos requeridos:
   - **Description** (ej. `Molde verificacion navegador`)
   - **Part N°** (ej. `PN-QA-001`)
   - **Deliver this quote by / due date** → una fecha futura (ej. dentro de 1 mes). *(El backend exige `due_date`.)*
4. Ir a la seccion **UPLOAD FILES** y **adjuntar al menos 1 archivo** (cualquier `.pdf`/`.txt`/imagen). **Esto es obligatorio**: sin archivo, el backend rechaza el envio posterior.
5. Clic en **Enviar / Submit** (ultimo paso del workspace).
- **Network esperado**: `POST /api_industrializacion/v1/rfq/?tipo=mold` con `Content-Type: multipart/form-data` (boundary), respuesta **201**.
- **UI esperado**: banner de exito ("RFQ creado / capturado…").

> Si el `POST` sale como `application/json` o falla con error de archivos: revisar que el uploader esta mandando el `File` real y que el `httpClient` deja pasar `FormData` (ver el plan, Gap 2).

### 1.3 Confirmar que aparece como borrador
- Volver al dashboard `/industrializacion/dashboard` (tab **Drafts**).
- **Esperado**: la nueva RFQ aparece con estado **DRAFT** (`En_Ind`) y su ID numerico. Anotar el **ID** (ej. `22`).

### 1.4 Enviar a Comercializacion
1. Abrir el detalle de la RFQ creada (clic en la fila → `/industrializacion/rfq/{id}`).
2. **Esperado**: el detalle carga datos reales; en la seccion de archivos se **lista el nombre** del archivo subido (sin link de descarga — la descarga es pendiente backend, es correcto que no descargue).
3. Usar la accion **Enviar RFQ / Submit** (o repetir desde el workspace si el envio ya se hizo en 1.2).
- **Network esperado**: `POST /api_industrializacion/v1/rfq/{id}/enviar/?tipo=mold` → **200**.
- **UI esperado**: el estado cambia a **PENDING** (`En_Com`).

> Si responde **400 "debe tener al menos un archivo adjunto"**: la RFQ se creo sin archivo. Crear otra adjuntando archivo en el paso 1.2.

**Cerrar sesion.**

---

## ACTO 2 — Comercializacion: ver progreso y asignar proveedor

**Login como `com_base@bocar.com`.**

### 2.1 Ver la lista con progreso real
- URL: `/compras/dashboard`.
- **Network esperado**: `GET /api_comercializacion/v1/rfqs/` → **200**.
- **Esperado**: la RFQ creada en el Acto 1 aparece con estado **PENDING** y progreso **"Sin proveedores asignados"**. El `deadline` se muestra como dias restantes.

### 2.2 Asignar proveedores
1. En la fila de la RFQ, usar la accion **Assign / Asignar** → `/compras/rfq/{id}/asignar`.
2. **Esperado**: el catalogo de proveedores carga (`GET /api_proveedores/v1/proveedores/` → **200**; el bug 500 ya esta corregido). Debe verse al menos un proveedor.
3. Seleccionar **uno o mas proveedores**, fijar una **due date** y confirmar/asignar.
- **Network esperado**: `POST /api_comercializacion/v1/asignaciones/crear/?tipo=mold` con body `{"id_rfq":<id>,"due_date":"YYYY-MM-DD","proveedores":[<ids>]}` → **200**.
- **UI esperado**: redirige al detalle; la RFQ pasa a estado **QUOTING** (`En_Pro`).

### 2.3 Confirmar el cambio de progreso
- Volver a `/compras/dashboard`.
- **Esperado**: la RFQ ahora muestra **QUOTING** y progreso **"0/N contestados"** (N = proveedores asignados).

**Cerrar sesion.**

---

## ACTO 3 — Proveedor: responder y enviar la cotizacion

**Login como `test_pro@bocar.com`** (debe ser un proveedor que haya sido asignado en el Acto 2).

### 3.1 Ver asignaciones
- URL: `/proveedor/dashboard`.
- **Network esperado**: `GET /api_proveedores/v1/asginaciones/mis-asignaciones/` → **200** (ojo: la ruta lleva el typo `asginaciones`).
- **Esperado**: la RFQ asignada aparece en **pendientes** con su tipo (Mold) y deadline.

### 3.2 Abrir el detalle del RFQ asignado
- Clic en la asignacion → detalle.
- **Network esperado**: `GET /api_proveedores/v1/asginaciones/detalle/{id_asignacion}/?tipo=mold` → **200**.
- **Esperado**: se ven las specs reales de la RFQ creada en el Acto 1 y el nombre del archivo adjunto.

### 3.3 Crear borrador de cotizacion (cost breakdown)
1. Entrar a cotizar → `/proveedor/rfq/{rfqId}/cotizar?tipo=Mold` (o boton **Crear cotizacion**).
2. Llenar algunos campos del cost breakdown (basta con unos pocos; el resto tiene default 0.0).
3. Clic en **Guardar borrador**.
- **Network esperado**: primera vez `POST /api_proveedores/v1/asginaciones/responder/{id_asignacion}/?tipo=mold` → **201**; si ya existia, `PATCH .../actualizar/` → **200**.
- **UI esperado**: feedback "Borrador guardado".

### 3.4 Enviar la respuesta definitiva
- Clic en **Enviar / Submit** la cotizacion.
- **Network esperado**: `POST /api_proveedores/v1/asginaciones/responder/{id_asignacion}/enviar/?tipo=mold` → **200** con cuerpo `{"assignment_closed":true,"rfq_completed":true|false}`.
- **UI esperado**:
  - Si **era el ultimo/unico proveedor** → `rfq_completed:true` → banner "Cotizacion enviada. RFQ cerrada."
  - Si faltan proveedores → `rfq_completed:false` → "Cotizacion enviada".
- Volver a `/proveedor/dashboard`: la asignacion se mueve de **pendientes** a **contestadas**.

**Cerrar sesion.**

---

## ACTO 4 — Verificar el cierre (vista Comercializacion)

**Login como `com_base@bocar.com`.**

1. URL: `/compras/dashboard`.
2. **Esperado** para la RFQ del flujo:
   - Si todos los proveedores contestaron → progreso **"Completo"** y estado **CLOSED** (`complete=True`).
   - Si fue parcial → progreso **"X/N contestados"** y estado **PARTIALLY_QUOTED**.
- **Network**: `GET /api_comercializacion/v1/rfqs/` refleja el `progreso_proveedores` actualizado.

✅ **Flujo verificado** cuando la RFQ recorre: `DRAFT → PENDING → QUOTING → CLOSED` (o `PARTIALLY_QUOTED` si quedan proveedores), con todas las llamadas respondiendo `2xx` y la UI mostrando datos reales en cada rol.

---

## 5. Checklist resumido

- [ ] Backend en `:8000` y frontend en `:5173` arriba.
- [ ] Login Ind (`ind_base`) → dashboard con datos reales.
- [ ] Crear RFQ Mold **con archivo adjunto** → `201`.
- [ ] Enviar a Comercializacion → `200`, estado PENDING.
- [ ] Login Com (`com_base`) → RFQ visible con "Sin proveedores asignados".
- [ ] Catalogo de proveedores carga (sin error 500).
- [ ] Asignar proveedor → `200`, estado QUOTING, "0/N contestados".
- [ ] Login Pro (`test_pro`) → asignacion en pendientes.
- [ ] Ver detalle + crear borrador (`201`) + enviar (`200`).
- [ ] Respuesta de envio trae `assignment_closed`/`rfq_completed`.
- [ ] Login Com → progreso "Completo"/CLOSED (o parcial).

## 6. Troubleshooting rapido
- **401 en cualquier llamada**: la sesion expiro o las cookies no viajan → re-login; confirmar `credentials: include`.
- **400 al enviar la RFQ**: falta archivo adjunto → recrear adjuntando archivo.
- **Catalogo de proveedores vacio**: confirmar que existe al menos un `Proveedor` ligado a una cuenta Pro en el backend (el `test_pro` debe estar dado de alta como proveedor).
- **El detalle no descarga el archivo**: es esperado — traer archivos de vuelta es pendiente backend (la URL de media da 404). Solo debe **listar el nombre**.
- **Aterrizas en un dashboard distinto**: probablemente iniciaste con `test_ind`/`test_com` (admin). Usar los usuarios **base** para los dashboards estandar.
