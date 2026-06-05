# Plan de implementacion: Conexion frontend ↔ backend del ciclo de vida completo de la RFQ

## TL;DR
Conectar el frontend (hoy 100% mock en las pantallas del flujo) al backend Django real, cubriendo **todo el ciclo de vida que ya fue probado end-to-end contra `http://localhost:8000`**: Industrializacion crea la RFQ → la envia a Comercializacion → Comercializacion asigna proveedores → el proveedor responde el cost breakdown → la ultima respuesta auto-cierra la RFQ (`complete=True`).

La estrategia es **capa de servicios por feature** (Dtos Zod en wire-format snake_case → Mappers → tipos de dominio camelCase), reusando el `httpClient` ya existente (cookies `HttpOnly`, refresh automatico, parseo Zod). El nucleo del trabajo es un **mapper de estados** que traduce el modelo del backend (`En_Ind | En_Com | En_Pro` + `complete` + progreso de proveedores) a la maquina de 9 estados del frontend (`rfqStateMachine`), sin tocar los componentes visuales.

**Subida de adjuntos SI entra en alcance**: el create de RFQ se envia como `multipart/form-data` con el key `archivos`, lo que satisface la regla del backend que exige `>=1 archivo` para poder "Enviar a Comercializacion". Lo unico **pendiente (backend)** es **traer los archivos de vuelta al frontend** (descarga/visualizacion): el backend ya devuelve la metadata y una URL, pero la URL responde `404` porque el servido de media no esta configurado. Por eso los archivos se **suben** pero se muestran en solo-lectura sin descarga funcional.

---

## Analisis del contexto y requisitos

### Objetivo funcional
Dejar de usar datos mockeados en las pantallas del ciclo de vida de la RFQ y consumir el API real para:
1. **Industrializacion**: crear RFQ (`mold`/`trimming`), listar, editar (solo en `En_Ind`), enviar a Comercializacion, solicitar edicion.
2. **Comercializacion (Compras)**: listar RFQs con progreso de proveedores, listar catalogo de proveedores, asignar proveedores, aprobar/rechazar solicitudes de edicion, resolver extensiones.
3. **Proveedor**: ver asignaciones, ver detalle del RFQ asignado, crear/actualizar borrador de cost breakdown, enviar respuesta definitiva.
4. **Cierre**: el cierre es **automatico** — al enviar la ultima respuesta el backend pone `complete=True` y devuelve `{"assignment_closed":true,"rfq_completed":true}`. No hay endpoint de cierre manual.

### Contexto tecnico (verificado en el repo)
- **React 18 + TS strict + Vite + React Router 7 + React Hook Form 7 + Zod 4 + Tailwind 3**. Sin React Query (confirmado en `package.json`).
- **El `httpClient` ya esta listo y es robusto**: [src/shared/http/httpClient.ts](../src/shared/http/httpClient.ts) — usa `credentials: 'include'` (cookies), maneja `401` con refresh en vuelo, parseo `schema.safeParse`, errores tipados (`HttpError`, `NetworkError`, `UnauthorizedError`, `ResponseParseError`).
- **El auth ya esta 100% conectado al backend real** y es el patron de referencia a copiar: [authService.ts](../src/features/auth/services/authService.ts), [authDtos.ts](../src/features/auth/services/authDtos.ts), [userMapper.ts](../src/features/auth/services/userMapper.ts).
- **Roles**: el backend devuelve `Ind | Com | Pro`; `userMapper` ya los mapea a `industrializacion | compras | proveedor`. La variante admin (`*_admin` en `rfqStateMachine`) se deriva de `is_admin`.
- `env.apiBaseUrl` ya validado con Zod en [src/app/config/env.ts](../src/app/config/env.ts). `.env.local` ya apunta a `http://localhost:8000`.

### Contrato del backend (verificado en pruebas live + Swagger `specs/API SWAGGER FOR BOCAR (5).yaml`)
Todas las rutas usan cookie JWT (`CookieJWT`) — el `httpClient` ya envia las cookies. Todas las de RFQ requieren el query param `?tipo=mold|trimming` salvo los listados unificados.

| # | Accion | Metodo + ruta | Body | Respuesta (verificada) |
|---|--------|---------------|------|------------------------|
| 1 | Crear RFQ | `POST /api_industrializacion/v1/rfq/?tipo=mold\|trimming` | multipart o JSON; minimo `due_date` | `201 {"detail":"RFQ Mold creado correctamente."}` |
| 2 | Editar RFQ (solo `En_Ind`) | `PATCH /api_industrializacion/v1/rfq/{id}/?tipo=` | partial | `200 {"detail":"..."}` / `403` si no esta en En_Ind |
| 3 | Enviar a Comercializacion | `POST /api_industrializacion/v1/rfq/{id}/enviar/?tipo=` | — | `200` / `400` si no tiene archivos |
| 4 | Listado Industrializacion | `GET /api_industrializacion/v1/rfqs/` | — | `{ "mold": RFQListItem[], "trimming": RFQListItem[] }` |
| 5 | Solicitar edicion | `POST /api_industrializacion/v1/edit-requests/?tipo=` | `{rfq_mold\|rfq_trimming, reason}` | `201` |
| 6 | Detalle RFQ (mold) | `GET /api_mold/v1/rfq-molds/{id}/` | — | objeto RFQ completo + `archivos[]` |
| 6b | Detalle RFQ (trimming) | `GET /api_trimming/v1/rfq-trimmings/{id}/` | — | idem trimming |
| 7 | Contadores dashboard | `GET /api_general/v1/rfq-count/?user_id=` | — | `{completados, en_comercializacion, borradores, histograma}` |
| 8 | Listado Comercializacion | `GET /api_comercializacion/v1/rfqs/` | — | `{ "mold": [...], "trimming": [...] }` con `progreso_proveedores`, `deadline`, `status` |
| 9 | Listar proveedores | `GET /api_proveedores/v1/proveedores/` | — | catalogo de proveedores (bug 500 ya corregido) |
| 10 | Asignar proveedores | `POST /api_comercializacion/v1/asignaciones/crear/?tipo=` | `{id_rfq, due_date, proveedores:[ids]}` | `200` → RFQ pasa a `En_Pro` |
| 11 | Aprobar edicion | `PATCH /api_comercializacion/v1/edit-requests/{id}/aprobar/?tipo=` | — | `200` |
| 12 | Rechazar edicion | `PATCH /api_comercializacion/v1/edit-requests/{id}/rechazar/?tipo=` | — | `200` |
| 13 | Solicitudes pendientes | `GET /api_comercializacion/v1/solicitudes/` | — | `{solicitudes_edicion, solicitudes_extension}` |
| 14 | Mis asignaciones (Pro) | `GET /api_proveedores/v1/asginaciones/mis-asignaciones/` | — | `{pendientes:{mold,trimming}, contestadas:{mold,trimming}}` |
| 15 | Detalle asignacion (Pro) | `GET /api_proveedores/v1/asginaciones/detalle/{id}/?tipo=` | — | RFQ completo + `archivos[]` |
| 16 | Crear borrador cotizacion | `POST /api_proveedores/v1/asginaciones/responder/{id}/?tipo=` | campos cost breakdown (floats default 0.0) | `201` |
| 17 | Ver borrador/respuesta | `GET /api_proveedores/v1/asginaciones/responder/{id}/detalle/?tipo=` | — | cost breakdown completo + `status` |
| 18 | Actualizar borrador | `PATCH /api_proveedores/v1/asginaciones/responder/{id}/actualizar/?tipo=` | partial | `200` |
| 19 | Enviar respuesta | `POST /api_proveedores/v1/asginaciones/responder/{id}/enviar/?tipo=` | — | `200 {"assignment_closed":true,"rfq_completed":true\|false}` |

> **OJO con el typo real del backend**: la ruta de asignaciones del proveedor es `asginaciones` (no `asignaciones`). Las rutas de Comercializacion si dicen `asignaciones`. Centralizar ambos literales en constantes para no equivocarse.

### NFRs
- **Sin estados imposibles**: cada query usa un `RemoteData<T>` (discriminated union), no tres booleanos sueltos.
- **Validacion en los bordes**: toda respuesta pasa por Zod antes de mapear a dominio.
- **Cancelacion de requests**: `AbortController` en cada hook de lista/detalle (unmount + cambio de params).
- **Accesibilidad y feedback**: estados loading/error/empty visibles en cada pantalla (hoy nunca existen porque todo es mock sincrono).

---

## Evaluacion critica (riesgos, supuestos, gaps)

### Gap 1 — Modelo de estados desalineado (el corazon del plan)
El backend tiene **3 estados** (`En_Ind`, `En_Com`, `En_Pro`) + flag `complete` + progreso de proveedores. El frontend tiene una **maquina de 9 estados** ([rfqStateMachine.ts](../src/features/rfq/state/rfqStateMachine.ts)): `DRAFT, PENDING, PENDING_EDIT_REQUEST, QUOTING, PARTIALLY_QUOTED, BENCHMARK_READY, EXPIRED, CLOSED, CANCELLED`.

**Decision**: NO se modifica `rfqStateMachine` (la UI y los permisos dependen de el). Se crea un **mapper unico backend → `RfqStatus`** que es la fuente de verdad. Tabla de mapeo:

| Backend | Condicion adicional | `RfqStatus` frontend |
|---------|--------------------|----------------------|
| `En_Ind` | — | `DRAFT` |
| `En_Com` | sin solicitud de edicion pendiente | `PENDING` |
| `En_Com` | con solicitud de edicion pendiente | `PENDING_EDIT_REQUEST` |
| `En_Pro` | `complete=False`, `0` contestados, deadline vigente | `QUOTING` |
| `En_Pro` | `complete=False`, `>=1` contestado parcial, deadline vigente | `PARTIALLY_QUOTED` |
| `En_Pro` | `complete=False`, deadline `Vencido` | `EXPIRED` |
| cualquiera | `complete=True` | `CLOSED` |

**Notas sobre estados del frontend:**
- `BENCHMARK_READY`: **fuera de alcance** — el benchmark ya no se implementara. Un RFQ con todos contestados pasa directo a `CLOSED` (`complete=True`). El mapper nunca produce `BENCHMARK_READY` y la pantalla de benchmark se descarta del flujo.
- `CANCELLED` ↔ `logical_delete=True`. Estos RFQs **solo son visibles para superusuarios** (`industrializacion_admin` / `compras_admin`); para usuarios estandar y proveedores no aparecen. Los listados unificados actuales filtran `logical_delete=False`, asi que mostrar los cancelados en la pestaña "Deleted RFQs" del [SuperUserDashboardPage.tsx](../src/pages/industrializacion/SuperUserDashboardPage.tsx) requiere un endpoint/param que exponga los eliminados a superusuarios. **Verificar en backend**; si aun no existe, marcar esa pestaña como pendiente backend (el resto del ciclo no depende de esto).
- El indicador de progreso del backend llega como string (`"Sin proveedores asignados" | "X/Y contestados" | "Completo"`); hay que parsearlo para `quotedCount`/`totalSuppliers`.

### Gap 2 — Subida de archivos SI; descarga (traerlos de vuelta) pendiente
El endpoint `POST .../rfq/{id}/enviar/` valida `rfq.archivos.exists()` y devuelve `400` si no hay archivos. **Por eso la subida si se implementa**: el create de RFQ va como `multipart/form-data` con el key `archivos` (verificado en la prueba live: `201` y el envio posterior paso la validacion `archivos.exists()`). Esto desbloquea todo el ciclo end-to-end.

**Lo pendiente (backend)** es **traer los archivos de vuelta**: la metadata llega (`archivos[]` con `id`, `archivo`, `uploaded_at`) pero la URL (`/Files/RFQ_Mold/...`) responde `404` porque el servido de media no esta configurado (`MEDIA_ROOT=''`, sin `static(MEDIA_URL, ...)` en `Bocar/urls.py`). Por lo tanto: se sube, se lista el nombre, pero **no hay descarga**.

**Dos cambios concretos que la subida exige en el frontend** (hoy no estan listos):
1. **`MultiFileUploadField` y `FileUploadField` descartan el `File` real** — solo guardan `{name, size, type}` (ver `processFiles` en [MultiFileUploadField.tsx](../src/shared/components/ui/MultiFileUploadField.tsx#L166)). Hay que extender el valor del campo para **retener el `File`** (p.ej. `{ name, size, type, file: File }`) sin romper la validacion ni el preview.
2. **El `httpClient` fuerza JSON**: `request()` hace `JSON.stringify(body)` y setea `Content-Type: application/json` (ver [httpClient.ts](../src/shared/http/httpClient.ts#L72-L101)). Hay que permitir pasar `FormData` tal cual (sin `stringify` y **sin** forzar `Content-Type`, para que el browser ponga el `boundary`).

**Mitigacion para descarga**: mostrar los nombres de archivo del detalle en solo-lectura, sin link de descarga, con `// TODO(backend-media): servir media para habilitar descarga`. Reportar al backend el fix (configurar `MEDIA_ROOT` + `static()` o un endpoint de descarga autenticado).

### Gap 3 — `GET /proveedores/` (resuelto)
El bug que devolvia `500` (`Object of type Country is not JSON serializable`) **ya fue corregido en el backend**. El endpoint ahora responde el catalogo correctamente, por lo que la pantalla de asignacion puede poblar el selector de proveedores sin manejo especial. `proveedoresService` se implementa de forma directa (igual que el resto), con los estados loading/error/empty estandar.

### Gap 4 — No hay React Query
Se implementa un hook generico minimo `useResource` (sin nueva dependencia) con `AbortController` y `RemoteData<T>`. Si en el futuro se adopta `@tanstack/react-query`, los services no cambian (solo los hooks). Justificacion de no traer la lib ahora: el alcance es acotado y el equipo ya mantiene su propio `httpClient`; agregar react-query es una decision transversal que excede este plan.

### Supuestos
- El backend corre en `http://localhost:8000` y CORS/cookies estan configurados para `localhost:5173` (el auth ya funciona, asi que esto ya esta resuelto).
- Los IDs del backend son numericos (`number`); el frontend hoy usa strings tipo `"RFQ-021"`. El mapper formatea el id para display (`RFQ-${id}`) pero **conserva el id numerico** para las llamadas API (nuevo campo `backendId`/`numericId`).
- `tipo` (mold/trimming) no viene en el listado de Comercializacion como campo separado pero si en la estructura (`{mold:[], trimming:[]}`); el mapper inyecta el `tipo` segun la rama.

---

## Arquitectura confirmada: Capa de servicios por feature + mapper de estados central

### Estructura objetivo de archivos

```
src/
  shared/
    http/
      httpClient.ts                 (ya existe — no cambia)
      errors.ts                     (ya existe)
    hooks/
      useResource.ts                NUEVO — query generico (RemoteData + AbortController)
      useMutation.ts                NUEVO — wrapper de mutacion (estado submitting/error)
    types/
      remoteData.ts                 NUEVO — RemoteData<T> discriminated union
    utils/
      rfqId.ts                      NUEVO — formatId(n) -> "RFQ-0001", parseId("RFQ-21") -> 21
      deadline.ts                   NUEVO — parsea "X dias"/"Vencido" -> {days, expired}

  features/rfq/
    services/
      rfqDtos.ts                    NUEVO — Zod wire schemas (snake/UPPER del backend)
      rfqStatusMapper.ts            NUEVO — backend status+complete+progreso -> RfqStatus
      rfqMappers.ts                 NUEVO — DTO -> RfqListItem / RfqDetail (dominio)
      rfqLifecycleService.ts        NUEVO — create/edit/send/list/detail/requestEdit
      rfqFormToDto.ts               NUEVO — MoldFormValues/TrimmingFormValues -> payload backend
      rfqDetailService.ts           (existe, mock) -> se conserva la firma getRfqDetailById pero ahora delega/real
    hooks/
      useRfqList.ts                 NUEVO
      useRfqDetail.ts               (existe, mock) -> reescribir para consumir el service real
      useCreateRfq.ts / useSendRfq.ts / useUpdateRfq.ts  NUEVO

  features/purchasing/
    services/
      comercializacionDtos.ts       NUEVO
      comercializacionMappers.ts    NUEVO
      comercializacionService.ts    NUEVO — listRfqs, createAsignaciones, approve/rejectEdit, listSolicitudes
      proveedoresService.ts         NUEVO — listProveedores
      purchasingRfqService.ts       (existe, mock) -> reescribir lista para usar el service real
    hooks/
      usePurchasingRfqList.ts / useAssignSuppliers.ts / useProveedores.ts   NUEVO

  features/supplier/
    services/
      asignacionesDtos.ts           NUEVO
      asignacionesMappers.ts        NUEVO
      asignacionesService.ts        NUEVO — misAsignaciones, detalle, responder, actualizar, enviar, verRespuesta
      supplierDashboardService.ts   (existe, mock) -> reescribir para usar misAsignaciones
      quotationFormToDto.ts         NUEVO — QuotationFormValues -> cost breakdown payload
    hooks/
      useMisAsignaciones.ts / useAsignacionDetalle.ts / useResponderCotizacion.ts   NUEVO
```

### Patron de servicio (copiar el estilo de `authService`)
```ts
// rfqLifecycleService.ts
const BASE = '/api_industrializacion/v1';
const tipoQ = (t: RfqTipo) => `?tipo=${t === 'Mold' ? 'mold' : 'trimming'}`;

export async function listRfqsIndustrializacion(signal?: AbortSignal): Promise<RfqListItem[]> {
  const dto = await request(`${BASE}/rfqs/`, { method: 'GET', schema: rfqListResponseDto, signal });
  return [...dto.mold.map((m) => mapRfqListItem(m, 'Mold')),
          ...dto.trimming.map((t) => mapRfqListItem(t, 'Trimming'))];
}

export async function createRfq(tipo: RfqTipo, values: MoldFormValues | TrimmingFormValues): Promise<void> {
  const body = rfqFormToDto(tipo, values);          // mapea a DESC, PPY, due_date, ...
  await request(`${BASE}/rfq/${tipoQ(tipo)}`, { method: 'POST', body, schema: detailMsgDto });
}

export async function sendRfqToCom(tipo: RfqTipo, id: number): Promise<void> {
  await request(`${BASE}/rfq/${id}/enviar/${tipoQ(tipo)}`, { method: 'POST', schema: detailMsgDto });
}
```

### `RemoteData` + `useResource` (estado sin booleans sueltos)
```ts
// shared/types/remoteData.ts
export type RemoteData<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// shared/hooks/useResource.ts
export function useResource<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
): { state: RemoteData<T>; reload: () => void } { /* useEffect + AbortController + cleanup */ }
```

### Mapper de estados (fuente unica de verdad)
```ts
// rfqStatusMapper.ts
export function mapBackendStatus(input: {
  status: 'En_Ind' | 'En_Com' | 'En_Pro';
  complete: boolean;
  hasPendingEditRequest?: boolean;
  progreso?: string;        // "Sin proveedores asignados" | "X/Y contestados" | "Completo"
  deadlineExpired?: boolean;
}): RfqStatus {
  if (input.complete) return 'CLOSED';
  switch (input.status) {
    case 'En_Ind': return 'DRAFT';
    case 'En_Com': return input.hasPendingEditRequest ? 'PENDING_EDIT_REQUEST' : 'PENDING';
    case 'En_Pro': {
      if (input.deadlineExpired) return 'EXPIRED';
      const { quoted } = parseProgreso(input.progreso);   // 0 -> QUOTING, >0 -> PARTIALLY_QUOTED
      return quoted > 0 ? 'PARTIALLY_QUOTED' : 'QUOTING';
    }
  }
}
```

---

## Mapeo campo a campo: formulario → payload backend (create/edit RFQ)

El `RfqWorkspaceShell` produce `MoldFormValues`/`TrimmingFormValues` (camelCase del frontend). El backend espera los nombres del modelo (`RFQ_Mold` / `RFQ_Trimming`). `rfqFormToDto` hace la traduccion. Campos minimos verificados para Mold (el resto tiene default en el modelo):

| Form (frontend) | Backend (`RFQ_Mold`) | Notas |
|-----------------|----------------------|-------|
| `description` | `DESC` | string |
| `customer` | `CUST` | string |
| `partNumber` | `PNUM` | string |
| `partsPerYear` | `PPY` | float |
| `deadline` (yyyy-mm-dd) | `due_date` | **requerido** (DateField, sin default) |
| `partTechnology` | `PT` | string |
| `comments` | `comments` | text |
| toggles `considerations.<id>.checked` | `<Campo>` boolean | mapear `'yes'`→`true` |
| toggles `considerations.<id>.notes` | `<Campo>_note` | string |
| `files[]` (con `File` real) | `archivos` (multipart, repetido) | un `archivos` por cada `File`; key plural |

> Accion para el implementador: extraer del modelo `RFQ_Mold`/`RFQ_Trimming` (en `backend-bocar-2026/RFQ_Mold/models.py`) la lista completa de campos y completar esta tabla. Los floats/strings tienen default, asi que el payload puede ser parcial; **solo `due_date` es obligatorio**.
>
> **Enviar como `multipart/form-data`**: construir `FormData`, agregar los campos escalares (`fd.append('DESC', ...)`, etc.) y un `fd.append('archivos', file)` por cada `File` del campo `files`. NO setear `Content-Type` manualmente (el browser pone el `boundary`). Para que el RFQ pueda enviarse luego a Comercializacion debe incluirse **al menos un archivo** en el create (regla del backend).
>
> Ejemplo de `rfqFormToDto` (rama multipart):
> ```ts
> export function rfqFormToFormData(tipo: RfqTipo, v: MoldFormValues): FormData {
>   const fd = new FormData();
>   fd.append('due_date', toIsoDate(v.deadline));     // requerido
>   if (v.description) fd.append('DESC', v.description);
>   if (v.customer)    fd.append('CUST', v.customer);
>   if (v.partNumber)  fd.append('PNUM', v.partNumber);
>   if (v.partsPerYear) fd.append('PPY', String(v.partsPerYear));
>   // ... resto de campos escalares y toggles ...
>   for (const f of v.files) if (f.file) fd.append('archivos', f.file);
>   return fd;
> }
> ```

---

## Plan de implementacion (pasos, dependencias, timeline)

### Fase 0 — Infra compartida (0.5 dia)
1. Crear `shared/types/remoteData.ts`, `shared/hooks/useResource.ts`, `shared/hooks/useMutation.ts`.
2. Crear `shared/utils/rfqId.ts` (`formatId`/`parseId`) y `shared/utils/deadline.ts` (parsea `"X dias"`/`"Vencido"`).
3. Centralizar literales de rutas en cada `*Service.ts` (incluido el typo `asginaciones`).
4. **Soporte multipart en `httpClient`**: ajustar `request()` para que, si `body instanceof FormData`, NO haga `JSON.stringify` y NO setee `Content-Type` (dejar que el browser ponga el `boundary`). Es un cambio de 2 lineas en [httpClient.ts](../src/shared/http/httpClient.ts) que no afecta a las llamadas JSON existentes.
5. Validar build (`npm run build`).

### Fase 1 — Industrializacion: crear / listar / detalle / enviar (1.5 dia)
6. `rfqDtos.ts`: schemas Zod de `RFQListItem`, `RfqDetail` (mold y trimming), `detailMsgDto` (`{detail: string}`).
7. `rfqStatusMapper.ts` + `rfqMappers.ts` (DTO → dominio, conservando `numericId` y `tipo`).
8. **Habilitar subida real de archivos** (prerequisito del create): extender `MultiFileUploadField` y `FileUploadField` para **retener el `File` real** en el valor del campo (`{name, size, type, file}`), ajustando el schema Zod del campo `files`/`shot_sketch_file` en `moldDefinition`/`trimmingDefinition` sin romper validacion ni preview. Ver Gap 2.
9. `rfqFormToDto.ts` / `rfqFormToFormData.ts` (tabla de mapeo de arriba; rama multipart con `archivos`).
10. `rfqLifecycleService.ts`: `listRfqsIndustrializacion`, `getRfqDetail(tipo,id)`, `createRfq` (multipart con archivos), `updateRfq` (multipart si agrega archivos, JSON si no), `sendRfqToCom`, `requestEdit`.
11. Hooks `useRfqList`, `useCreateRfq`, `useSendRfq`, `useUpdateRfq`.
12. **Cablear el submit del workspace**: hoy `handleValidSubmit` en [RfqWorkspaceShell.tsx](../src/features/rfq/components/RfqForm/shell/RfqWorkspaceShell.tsx#L269) es mock (solo setea feedback). Inyectar via prop `onSubmit(values): Promise<Result>` desde `RfqWorkspace` (que ya resuelve la definicion por tipo) → llama `createRfq`/`updateRfq` con el `FormData`. Mantener `isSubmitting` de RHF para el boton.
13. **Boton "Enviar RFQ"**: cablear a `sendRfqToCom`. Como el create ya sube `archivos`, el envio pasa la validacion `archivos.exists()`. Aun asi, manejar el `400` defensivamente (RFQ sin archivos por data legada) con banner claro.
14. Reescribir [DashboardPage.tsx](../src/pages/industrializacion/DashboardPage.tsx) y [SuperUserDashboardPage.tsx](../src/pages/industrializacion/SuperUserDashboardPage.tsx) para consumir `useRfqList` + `GET /api_general/v1/rfq-count/` en vez de `analyticsService` mock. Mapear tabs Drafts/Active/Historical a `DRAFT` / `PENDING+QUOTING+PARTIALLY_QUOTED` / `CLOSED`.

### Fase 2 — Detalle de RFQ real (0.75 dia)
15. Reescribir [useRfqDetail.ts](../src/features/rfq/hooks/useRfqDetail.ts) para consumir `getRfqDetail(tipo,id)` real (hoy lee `getRfqDetailById` mock). Conservar la firma de salida (`{rfq, allowedActions, statusMeta, banner, isAccessible, role, isCreator}`) para no tocar [RfqDetailWorkspace.tsx](../src/features/rfq/components/RfqDetail/RfqDetailWorkspace.tsx).
16. Adaptar `rfqDetailService.ts`: `getRfqDetailById` pasa de mock sincrono a una funcion async real; el hook envuelve con `useResource` y expone loading/error.
17. `isCreator` se calcula comparando `rfq.createdById` (numerico del backend `created_by`) con `user.id` del `useAuth`.
18. La seccion de archivos del detalle muestra `archivos[]` (el backend ya devuelve nombre + url) en modo **solo-lectura SIN descarga** (la URL da `404` por media no servido; mostrar nombre sin link, `// TODO(backend-media)`). Ver Gap 2.

### Fase 3 — Comercializacion: lista con progreso + asignacion (1.25 dia)
19. `comercializacionDtos.ts` + `comercializacionMappers.ts`: parsear `progreso_proveedores` y `deadline` a los campos que la UI de Compras espera (`supplierProgress`, `hoursToDeadline`, `status`).
20. `comercializacionService.ts`: `listRfqs`, `createAsignaciones(tipo, {id_rfq, due_date, proveedores})`, `approveEdit`, `rejectEdit`, `listSolicitudes`.
21. `proveedoresService.ts`: `listProveedores()` directo (bug 500 ya corregido en backend), con estados loading/error/empty estandar.
22. Reescribir [purchasingRfqService.ts](../src/features/purchasing/services/purchasingRfqService.ts): la **data** (`purchasingRfqRows`) sale del API; las funciones puras de filtro/orden (`getFilteredPurchasingRfqRows`, `getActionsByStatus`) se conservan tal cual operando sobre los datos reales.
23. Hook `usePurchasingRfqList` para [DashboardPage.tsx](../src/pages/purchasing/DashboardPage.tsx).
24. [SupplierSelectionPage.tsx](../src/pages/purchasing/SupplierSelectionPage.tsx): poblar con `useProveedores`, submit con `useAssignSuppliers` → `createAsignaciones`. Tras exito, navegar al detalle (la RFQ ya esta en `En_Pro`).

### Fase 4 — Proveedor: asignaciones + cotizacion + envio (1.5 dia)
25. `asignacionesDtos.ts` + `asignacionesMappers.ts`: mapear `mis-asignaciones` (`pendientes`/`contestadas` × `mold`/`trimming`) a `SupplierRfqRow[]` (`assignedRows`/`historicalRows`), incluyendo `id_asignacion` numerico.
26. `asignacionesService.ts`: `misAsignaciones`, `detalle(tipo,id)`, `responder(tipo,id,payload)`, `verRespuesta(tipo,id)`, `actualizar(tipo,id,payload)`, `enviar(tipo,id)`.
27. `quotationFormToDto.ts`: mapear `QuotationFormValues` (cost breakdown del frontend) a los campos float del backend (`Cost_Breakdown_Mold` / `_Trimming`). Solo enviar campos con valor; el resto default 0.0.
28. Reescribir [supplierDashboardService.ts](../src/features/supplier/services/supplierDashboardService.ts) para que `assignedRows`/`historicalRows` salgan de `misAsignaciones`. Conservar `getFilteredRows`.
29. Reescribir [DashboardPage.tsx](../src/pages/proveedor/DashboardPage.tsx) con `useMisAsignaciones` + estados loading/error/empty. Las metricas (`supplierMetrics`) se derivan de los conteos reales.
30. **Cablear el QuotationWorkspace**: hoy `handleValidSubmit` en [QuotationWorkspaceShell.tsx](../src/features/rfq/components/QuotationForm/shell/QuotationWorkspaceShell.tsx#L275) es mock. Inyectar `onSaveDraft` (→ `responder` o `actualizar` segun exista borrador) y `onSubmit` (→ `enviar`). En `create` con borrador inexistente usar `responder`; si ya existe (`verRespuesta` devuelve `draft`) usar `actualizar`.
31. Al `enviar`, leer la respuesta `{assignment_closed, rfq_completed}` y mostrar feedback de cierre ("Cotizacion enviada. RFQ cerrada." si `rfq_completed`). Navegar de vuelta al dashboard del proveedor; la asignacion pasa a "contestadas".

### Fase 5 — Edicion / solicitudes (0.75 dia) — opcional dentro del ciclo
32. Cablear acciones del `RfqActionBar` para Industrializacion (`request_edit` → `requestEdit`) y Comercializacion (`approve_edit_request`/`reject_edit_request` → endpoints 11/12), usando `useMutation` y recargando el detalle al exito.

### Fase 6 — Verificacion (0.5 dia)
33. `npm run build` (type-check estricto, sin `any`).
34. E2E manual con Playwright contra el backend real reproduciendo el flujo probado: login `test_ind` → crear **adjuntando un archivo** → enviar (debe pasar la validacion `archivos.exists()`) → login `test_com` → asignar → login `test_pro` → responder → enviar → verificar cierre. Validar tambien que el detalle lista el nombre del archivo subido (aunque la descarga de `404`).
35. Validar estados loading/error/empty en cada pantalla (apagar el backend para ver el path de error).

**Timeline total estimado**: ~7 dias-persona (incluye subida de archivos; NO incluye el fix del servido de media para descarga, que es backend).

---

## Detalle de pantallas (comportamiento esperado con datos reales)

### Industrializacion · Dashboard ([DashboardPage.tsx](../src/pages/industrializacion/DashboardPage.tsx))
- Tabs Drafts/Active/Historical alimentados por `useRfqList` (mapper de estados) + KPIs desde `rfq-count`.
- Estados: `loading` (skeleton de tabla), `error` (banner con retry), `empty` ("No tienes RFQs en este estado").
- Cada fila linkea al detalle real (`/industrializacion/rfq/:id?tipo=...`); el `id` de la URL es el numerico del backend.

### Industrializacion · Crear/Editar RFQ ([RfqWorkspace](../src/features/rfq/components/RfqForm/RfqWorkspace.tsx) + shell)
- `create`: submit → `createRfq` (multipart con `archivos`); al exito, feedback success + navegar al dashboard o al detalle. El usuario debe poder adjuntar archivos en la pagina "UPLOAD FILES" (mold) / shot sketch (trimming) y esos `File` viajan al backend.
- `edit`: solo habilitado si el detalle real esta en `DRAFT` (`En_Ind`); si el backend responde `403`, banner "Ya fue enviado; solicita una edicion".
- Boton "Enviar RFQ": `sendRfqToCom`. Funciona porque el create ya subio al menos un archivo. Si `400` por archivo faltante (data legada) → banner defensivo. El boton usa `isSubmitting`.

### Industrializacion · Detalle ([RfqDetailWorkspace](../src/features/rfq/components/RfqDetail/RfqDetailWorkspace.tsx))
- Specs y archivos vienen del detalle real; los archivos se **listan por nombre** pero **sin descarga** (la URL da 404 — traer archivos de vuelta es pendiente backend, ver Gap 2).
- `allowedActions` se recalcula con el estado mapeado real + `isCreator` real.

### Comercializacion · Dashboard ([DashboardPage.tsx](../src/pages/purchasing/DashboardPage.tsx))
- Filas desde `GET /api_comercializacion/v1/rfqs/`; `progreso_proveedores` → badge "X/Y contestados"/"Completo"; `deadline` → urgencia.
- Accion "Assign" navega a SupplierSelection.

### Comercializacion · Asignar proveedores ([SupplierSelectionPage.tsx](../src/pages/purchasing/SupplierSelectionPage.tsx))
- Catalogo desde `useProveedores` (endpoint operativo). Estados loading/error/empty estandar.
- Submit → `createAsignaciones({id_rfq, due_date, proveedores})`; al exito navegar al detalle (RFQ ahora `En_Pro` → `QUOTING`).

### Proveedor · Dashboard ([DashboardPage.tsx](../src/pages/proveedor/DashboardPage.tsx))
- `assignedRows` = `pendientes`, `historicalRows` = `contestadas`, desde `mis-asignaciones`. Metricas derivadas de los conteos.
- Cada fila pendiente linkea a cotizar (`/proveedor/rfq/:rfqId/cotizar?tipo=...`) usando `id_asignacion`.

### Proveedor · Cotizacion ([QuotationWorkspace](../src/features/rfq/components/QuotationForm/QuotationWorkspace.tsx) + shell)
- Al abrir: `verRespuesta` para precargar borrador si existe (`status=draft`).
- "Guardar borrador" → `responder` (primera vez) / `actualizar` (si existe).
- "Enviar" → `enviar`; mostrar resultado de cierre. Bloquear reenvio si ya esta `submitted`.

---

## Riesgos y mitigaciones
- **Subida de archivos requiere tocar componentes y `httpClient`** (Gap 2): los uploaders hoy descartan el `File` real y el `httpClient` fuerza JSON. Cambios acotados pero obligatorios para que el create suba y el "Enviar" pase. La **descarga** (traer archivos de vuelta) queda pendiente backend (404 de media); listar nombre sin link y marcar `TODO(backend-media)`.
- **Desalineacion de estados** (Gap 1): aislar TODO en `rfqStatusMapper.ts` con tests unitarios de la tabla de mapeo; ningun componente decide estado por su cuenta.
- **IDs string vs numeric**: conservar siempre `numericId` para API y `displayId` para UI; nunca usar el string formateado en una llamada.
- **`EXPIRED`/`CLOSED` sin endpoint de cierre manual**: el cierre es automatico; no exponer boton "Close RFQ" cableado a un endpoint inexistente (dejar disabled con nota).
- **Visibilidad de cancelados**: `CANCELLED` (`logical_delete=True`) solo para superusuarios; verificar que exista endpoint que los exponga, si no marcar la pestaña "Deleted RFQs" como pendiente backend.
- **Typo `asginaciones`**: literal centralizado en constante para evitar 404s silenciosos.
- **Regresion de pantallas mock no incluidas** (unlock requests): quedan en mock; documentar que NO son parte de este alcance.

## Supuestos y huecos de informacion
- Adjuntos: la **subida SI se implementa** (multipart con `archivos`); la **descarga (traerlos de vuelta) queda pendiente backend** por el 404 de media.
- Benchmark = **descartado** (ya no se implementa).
- RFQs cancelados (`logical_delete=True`) = visibles **solo para superusuarios**; depende de que el backend exponga un endpoint para ello.
- Catalogo maestro de proveedores (alta/edicion) = fuera de alcance; solo se consume el listado existente.
- No hay endpoint de cierre manual: el cierre lo dispara el backend al recibir la ultima cotizacion.
- Se asume `is_admin` del `/auth/me/` para derivar `*_admin` en la UI.

## Verificacion y fuentes (metodo)
- **Fuentes**:
  - Prueba end-to-end real ya ejecutada contra `http://localhost:8000` (login Ind/Com/Pro, create, send, assign, respond, enviar con auto-cierre verificado en BD).
  - [specs/API SWAGGER FOR BOCAR (5).yaml](API%20SWAGGER%20FOR%20BOCAR%20(5).yaml) (contrato de endpoints).
  - Repo frontend: `httpClient.ts`, `authService.ts`, `rfqStateMachine.ts`, `useRfqDetail.ts`, los `*Service.ts` mock, las pages de cada rol.
  - Backend: `Industrializacion/views.py`, `Comercializacion/urls.py`, `Asignaciones/urls.py`, `RFQ_Mold/models.py` (campos del modelo y reglas de envio).
  - Plan de referencia: [PLAN_IMPLEMENTACION_TRIMMING_RFQ_CREATE.md](PLAN_IMPLEMENTACION_TRIMMING_RFQ_CREATE.md) (formato).
- **Metodo**: mapeo endpoint-por-endpoint del flujo probado; definicion del mapper de estados como pieza central; reuso del `httpClient` y del patron de `authService`; conservacion de las firmas de los services mock para no tocar componentes visuales.

## Nivel de confianza
86/100. Limitado por:
- La subida de archivos exige retener el `File` real en los uploaders y soportar `FormData` en el `httpClient` (cambios acotados pero a verificar); la descarga queda pendiente backend (404 de media).
- La visibilidad de RFQs cancelados para superusuarios depende de que exista un endpoint backend que exponga `logical_delete=True`.
- La tabla de mapeo campo-a-campo del cost breakdown y de los toggles del RFQ debe completarse leyendo los modelos del backend al implementar.
