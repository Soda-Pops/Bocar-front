# Plan de implementacion: Pantalla de creacion de RFQ tipo Trimming

## TL;DR
Implementar la **Opcion C (decision confirmada)**: extraer el shell visual del workspace de Mold ([RfqWorkspace.tsx](src/features/rfq/components/RfqForm/RfqWorkspace.tsx)) a un componente reutilizable (`RfqWorkspaceShell`) y modelar cada tipo de RFQ como una definicion modular (schema, defaults, paginas, renderers). Trimming se construye como una definicion nueva (`trimmingDefinition`) y Mold se migra a `moldDefinition`, agregando una primitiva nueva (`FileUploadField`) sin romper el flujo existente de Mold.

## Analisis del contexto y requisitos
- Objetivo funcional: permitir capturar una RFQ tipo Trimming con 5 secciones (RFQ, Trim Die, Data Information, Other Information, Complete Shot Sketch) manteniendo paridad visual con el workspace de Mold.
- Contexto tecnico:
  - React 18 + Vite + TS estricto, Tailwind, arquitectura por features.
  - El workspace actual vive en [src/features/rfq/components/RfqForm/RfqWorkspace.tsx](src/features/rfq/components/RfqForm/RfqWorkspace.tsx) y ya recibe `tipo: RfqTipo`, pero todas las paginas, schema y defaults estan hardcodeados para Mold.
  - El selector de tipo ya esta operativo en [RfqTypeSelectionScreen.tsx](src/features/rfq/components/RfqForm/RfqTypeSelectionScreen.tsx) con `Trimming` y `Mold`.
  - React Hook Form + Zod ya estan integrados; los toggles YES/NO se resuelven via `YesNoToggle` y `considerations.<id>.{checked,notes}`.
- Reglas visuales (Frontend Design Pro):
  - Inter, colores BOCAR, sin placeholders en inputs (regla explicita del usuario).
  - Sidebar de secciones, barra de progreso superior, feedback banner, botones inferiores Guardar Borrador / Siguiente.
  - Mantener densidad informativa y look corporativo, sin gradientes ni cards decorativas.
- NFRs sugeridos:
  - Performance: render por pagina sin remount del FormProvider, `useWatch` por seccion donde sea necesario.
  - Accesibilidad: labels visibles, focus visible en toggles, anuncios `role="alert"` para errores criticos.
  - Responsivo: 1440 / 1024 / 768 / 390 sin overflow horizontal; sidebar mobile sigue siendo el `select` actual.

## Evaluacion critica (riesgos, supuestos, gaps)
- Riesgo: el workspace actual fue diseniado solo para Mold; resuelto por la Opcion C (shell + definiciones), no se ramifica logica dentro del mismo archivo.
- Riesgo: la regla "sin placeholders" aplica solo a Trimming (decision confirmada). Mold conserva sus placeholders actuales.
- Riesgo: el campo `File` (Section 5) no tiene primitiva en el sistema; introducir `FileUploadField` es trabajo de UI no trivial.
- Decision confirmada: Mold y Trimming tienen cada uno su propio schema Zod (`moldSchema` / `trimmingSchema`) con sus propios `FormValues`. No existe schema compartido entre tipos; el shell recibe el schema ya resuelto desde la definicion correspondiente.
- Decision confirmada: el sidebar de Trimming usa un unico grupo `TRIMMING` con las 5 entradas.
- Decision confirmada: la regla "sin placeholders" aplica solo a Trimming; Mold conserva sus placeholders actuales.
- Decision confirmada: `Project Life` se modela como input texto libre (no select).
- Desicion: la fila "Delivery date" de la seccion 4 sigue el patron YES/NO + Notes pero el Notes muestra `input type="date"` solo si esta YES. Se puede modelar como una variante del item de consideracion.
- Desicion: la carga de archivo en Seccion 5 es mock por ahora (no hay backend); guarda nombre y tamano en memoria.
- Gap: no hay tipos compartidos en `features/rfq` para defaults / metadatos por tipo de RFQ. Se requiere crearlos.

## Arquitectura confirmada: Opcion C — Shell reutilizable + definicion por tipo

Decision tomada: se implementa Opcion C. Las opciones A y B se mantienen abajo solo como referencia historica del proceso de decision.

### Estructura objetivo
- `src/features/rfq/components/RfqForm/shell/RfqWorkspaceShell.tsx`: layout completo (header, sidebar desktop, select mobile, progress bar, feedback banner, footer con acciones, navegacion entre paginas, `FormProvider` y submit handlers genericos). Es generico sobre `TValues extends FieldValues`.
- `src/features/rfq/components/RfqForm/shell/primitives.tsx`: primitivas compartidas (`FieldShell`, `TextField`, `TextAreaField`, `SectionCard`, `FormGrid`, `YesNoToggle`, `ChevronDownIcon`, `BackArrowIcon`, `inputBaseClasses`, `getFeedbackClasses`).
- `src/features/rfq/components/RfqForm/shell/types.ts`: contrato `RfqWorkspaceDefinition<TValues>` y tipos auxiliares (`PageMeta`, `NavGroup`, `NavItem`).
- `src/features/rfq/components/RfqForm/definitions/moldDefinition.ts`: definicion del tipo Mold migrada desde el archivo actual.
- `src/features/rfq/components/RfqForm/definitions/trimmingDefinition.ts`: definicion nueva para el tipo Trimming.
- `src/features/rfq/components/RfqForm/RfqWorkspace.tsx`: queda como wrapper minimo que resuelve la definicion por `tipo` y delega en `RfqWorkspaceShell`.

### Contrato `RfqWorkspaceDefinition<TValues>`
Cada definicion exporta un objeto con esta API. El campo `schema` es el schema Zod propio del tipo — nunca compartido entre Mold y Trimming:
```ts
type RfqWorkspaceDefinition<TValues extends FieldValues> = {
  schema: ZodType<TValues>;              // moldSchema o trimmingSchema segun el tipo
  getCreateDefaultValues: () => TValues;
  getEditDefaultValues: (rfqId?: string) => TValues;
  pages: readonly string[];
  navGroups: readonly NavGroup[];
  pageMeta: Record<string, PageMeta>;
  requiredFieldsByPage: Partial<Record<string, readonly FieldPath<TValues>[]>>;
  renderPage: (page: string) => ReactNode;
  getCompletedMap: (values: TValues) => Partial<Record<string, boolean>>;
  getPageErrorMap: (errors: FieldErrors<TValues>) => Partial<Record<string, boolean>>;
  onInvalidSubmit?: (errors: FieldErrors<TValues>, ctx: { setCurrentPage: (p: string) => void; setFocus: UseFormSetFocus<TValues> }) => void;
};
```
Regla: el campo `tipo` (`z.enum(['Trimming','Mold'])`) desaparece de ambos schemas; el tipo ya esta determinado por cual definicion se resuelve en `RfqWorkspace`.

### Justificacion de la decision
- Ya hay dos tipos definidos (Trimming, Mold) y se anticipa que aparecera al menos un tercero. Mantener un shell unico evita drift visual.
- El refactor para extraer el shell es mecanico: el archivo actual ya separa claramente el shell (header, sidebar, layout) del contenido por pagina (`renderPage`, `PAGES`, schema). Llevarlo a Opcion C es mover bloques, no rediseniar.
- El trabajo de UI (`FileUploadField`) queda como componente shared que cualquier tipo puede reusar.
- Aplicar la regla "sin placeholders" se hace una sola vez por definicion (la de Trimming), sin afectar a Mold.

### Opciones descartadas (referencia historica)
1) Opcion A — Ramificar dentro de `RfqWorkspace.tsx` (`if (tipo === 'Trimming') {...}`): descartada porque el archivo pasaria de ~1240 a ~2000 lineas con dos schemas, dos sets de pages y dos sets de renderers entrelazados.
2) Opcion B — Componente nuevo `RfqWorkspaceTrimming.tsx` que duplica el shell: descartada por la duplicacion del header, sidebar, footer, banner de feedback, progress bar y logica de navegacion.

## Plan de implementacion (pasos, dependencias, timeline)
Todos los pasos siguen la arquitectura **Opcion C** confirmada arriba.

1) Refactor: extraer shell del workspace actual (0.5 dia)
   - Crear `src/features/rfq/components/RfqForm/shell/RfqWorkspaceShell.tsx`:
     - Recibe props `mode`, `onBack`, `rfqId`, `tipo`, `definition` y `headerTitle`.
     - Mueve aqui header, sidebar desktop, sidebar mobile, progress bar, feedback banner, footer y handlers de navegacion / submit.
     - Expone el FormProvider y consume `definition.schema`, `definition.defaultValues`, `definition.pages`, `definition.navGroups`, `definition.pageMeta`, `definition.requiredFieldsByPage`, `definition.renderPage`, `definition.getCompletedMap`, `definition.getPageErrorMap`.
   - Mover primitivas compartidas (`FieldShell`, `TextField`, `TextAreaField`, `SectionCard`, `FormGrid`, `YesNoToggle`, `ChevronDownIcon`, `BackArrowIcon`, `inputBaseClasses`, `getFeedbackClasses`) a `src/features/rfq/components/RfqForm/shell/primitives.tsx`.
   - Validar Mold sigue funcionando con `npm run build` y screenshots Playwright en las 4 anchuras.

2) Crear definicion de Mold a partir del codigo actual (0.25 dia)
   - Archivo: `src/features/rfq/components/RfqForm/definitions/moldDefinition.ts`.
   - Mover aqui:
     - `workspaceSchema` → renombrar a `moldSchema` (`z.object({...}).superRefine(...)`). Eliminar el campo `tipo` del schema.
     - `type MoldFormValues = z.infer<typeof moldSchema>` (antes `WorkspaceFormValues`).
     - `PAGES`, `NAV_GROUPS`, `PAGE_META`, `REQUIRED_FIELDS_BY_PAGE`, `TOGGLE_REQUIRED_CONSIDERATIONS`, `CONSIDERATION_GROUPS`.
     - `getCreateDefaultValues`, `getEditDefaultValues`, `renderPage`, `getCompletedMap`, `getPageErrorMap`.
   - Exportar `moldDefinition` como objeto que implementa `RfqWorkspaceDefinition<MoldFormValues>`.

3) Definir tipos compartidos del shell (0.25 dia)
   - Archivo: `src/features/rfq/components/RfqForm/shell/types.ts`.
   - Exporta:
     - `RfqWorkspaceDefinition<TValues extends FieldValues>` (contrato completo, ver seccion de Arquitectura).
     - `PageMeta`, `NavGroup`, `NavItem` (mover desde el archivo actual).
   - Reglas clave:
     - Ningun schema Zod vive en este archivo; solo el contrato de tipos.
     - `MoldFormValues` vive en `moldDefinition.ts`; `TrimmingFormValues` vive en `trimmingDefinition.ts`.
     - Cada definicion declara su `PageKey` propio como string union local.
     - El shell es generico sobre `TValues` y nunca conoce la forma concreta de los valores.

4) Modelar Trimming: schema propio, tipos y defaults (0.5 dia)
   - Archivo: `src/features/rfq/components/RfqForm/definitions/trimmingDefinition.ts`.
   - `TrimmingPageKey = 'basic' | 'trim_die' | 'data_info' | 'other_info' | 'shot_sketch'`.
   - Definir `trimmingSchema` como schema Zod exclusivo para Trimming (independiente de `moldSchema`):
     ```ts
     const trimmingSchema = z.object({
       // Seccion 1
       description:    z.string().trim().min(1, 'Ingresa la descripcion.'),
       part_number:    z.string().trim().min(1, 'Ingresa el numero de parte.'),
       parts_per_year: z.string(),
       project_life:   z.string(),
       customer:       z.string(),
       previous_job:   z.string(),
       supplier:       z.string(),
       deliver_by:     z.string(),
       // Seccion 2
       press:                  z.string(),
       num_cavities:           z.string(),
       num_hydraulic_slides:   z.string(),
       fully_automatic:        z.string(),
       presence_detectors:     z.string(),
       trimming_condition:     z.string(),
       punch_pins_required:    z.string(),
       residual_burr_mm:       z.string(),
       castings_by_auma:       z.string(),
       adjustments_toolmaker:  z.string(),
       gas_springs:            z.string(),
       // Secciones 3, 4 — mismo patron record que Mold
       considerations: z.record(z.string(), z.object({ checked: z.string().optional(), notes: z.string() })),
       // Seccion 5
       shot_sketch_file: z.object({ name: z.string(), size: z.number(), type: z.string() }).nullable(),
     }).superRefine((values, ctx) => {
       // validacion de toggles requeridos en secciones 3 y 4
       TRIMMING_TOGGLE_REQUIRED.forEach((key) => {
         if (!values.considerations[key]?.checked?.trim()) {
           ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selecciona si aplica.', path: ['considerations', key, 'checked'] });
         }
       });
       // others.notes obligatorio si others.checked === 'yes'
       if (values.considerations['others']?.checked === 'yes' && !values.considerations['others']?.notes?.trim()) {
         ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Especifica el concepto.', path: ['considerations', 'others', 'notes'] });
       }
     });
     type TrimmingFormValues = z.infer<typeof trimmingSchema>;
     ```
   - `getCreateDefaultValues` y `getEditDefaultValues` con valores iniciales propios de Trimming (en `edit` precargar mock realista).
   - Exportar `trimmingDefinition` como objeto que implementa `RfqWorkspaceDefinition<TrimmingFormValues>`.

5) Definir paginas, nav y page meta de Trimming (0.25 dia)
   - `TRIMMING_PAGES` en orden: `basic`, `trim_die`, `data_info`, `other_info`, `shot_sketch`.
   - `TRIMMING_NAV_GROUPS`: un unico grupo `{ key: 'TRIMMING', label: 'TRIMMING', items: [...] }` con las 5 entradas en el mismo orden.
   - `PAGE_META` con `navLabel`, `title` numerado (1..5) y `subtitle` corto para cada pagina.
   - `REQUIRED_FIELDS_BY_PAGE`:
     - `basic`: `['description', 'part_number']`.
     - Resto: vacio (validacion final al submit).

6) Componentes nuevos compartidos (0.5 dia)

   **Regla de Hooks — aplicar en todos los componentes de esta seccion:**
   - NUNCA llamar `useWatch`, `useFormContext`, `useWatch`, ni ningun hook directamente dentro de un callback de `.map()`, `.forEach()` o cualquier loop.
   - Todo componente que necesite un hook debe ser una funcion de React (nombre en PascalCase, retorna JSX), no una funcion helper anonima.
   - `YesNoToggle` ya cumple esta regla (es un componente). Siempre usarlo como `<YesNoToggle ... />`, nunca como llamada inline dentro del map.

   - `src/shared/components/ui/FileUploadField.tsx`:
     - Zona drag-and-drop con borde punteado `border-dashed border-[#d9dee5]`, hover `border-[var(--bocar-blue-70)]`.
     - Estado vacio: icono, copy "Arrastra un archivo o selecciona desde tu equipo" + boton outline "Subir archivo".
     - Estado con archivo: preview de imagen si `type.startsWith('image/')`, sino chip con nombre, peso (KB/MB) y boton "Reemplazar" + "Quitar".
     - Acepta `accept` (`.png,.jpg,.pdf,.dwg`) y `maxSizeMb` (10 MB por default).
     - Integra con RHF via `Controller`.
   - `YesNoDateRow` — debe ser un **componente React** (`function YesNoDateRow({ name, notesName }: ...) { ... }`), no una funcion helper:
     - Llama `useFormContext` y `useWatch` en el cuerpo del componente (nivel superior, no dentro de map).
     - Renderiza `<YesNoToggle name={name} />` + condicional: si `checked === 'yes'` muestra `<input type="date" ...>`, si no muestra el input de notas normal.
     - El condicional va en el JSX retornado, no como llamada de hook condicional.

7) Renderers de Trimming (0.5 dia)
   - `BasicPage` (Seccion 1):
     - `FormGrid` con 8 `TextField` sin placeholder. `description` y `part_number` con `required`.
     - `parts_per_year` `type="number"`, `deliver_by` `type="date"`, `project_life` `type="text"` (input libre).
     - `TextField` ya es un componente que llama hooks internamente — nunca llamar `register` o `getFieldState` directamente en el cuerpo de `BasicPage`.

   - `TrimDiePage` (Seccion 2):
     - `SectionCard` con tabla `Description | Specs` (grid 2 col `minmax(0,1.1fr) minmax(0,1.9fr)`).
     - Las 11 filas son heterogeneas (texto, toggle, select, number). Para evitar violar Rules of Hooks, NO mapear sobre un array de configuracion llamando hooks inline. En cambio, declarar cada fila explicitamente como JSX estatico dentro de `TrimDiePage`:
       ```tsx
       // ✅ CORRECTO — filas declaradas explicitamente, hooks solo dentro de componentes
       function TrimDiePage() {
         const { register } = useFormContext<TrimmingFormValues>(); // hook al nivel del componente
         return (
           <SectionCard ...>
             <div>Press</div><input {...register('press')} ... />
             <div>No. of cavities</div><input {...register('num_cavities')} ... />
             <div>Fully Automatic process</div><YesNoToggle name="fully_automatic" />
             {/* ... resto de filas */}
           </SectionCard>
         );
       }
       ```
     - `useFormContext` se llama una sola vez al nivel de `TrimDiePage`, no dentro de ningun loop.
     - `YesNoToggle` siempre como `<YesNoToggle name="..." />` (componente), no como funcion.
     - Wrap permitido para etiquetas largas (`Adjustments and optimization at tool maker's facilities`).

   - `DataInfoPage` (Seccion 3):
     - Reutiliza `ConsiderationTogglePage` del workspace de Mold (o su equivalente en `primitives.tsx`), alimentando un nuevo grupo `DATA_INFO` con 6 items.
     - **No re-implementar** `ConsiderationTogglePage` en el archivo de Trimming. Reusar el componente existente para no duplicar la logica de hooks.
     - `Latest trim die improvements` requiere `<textarea rows={2}>` en la columna notes: agregar prop `notesAs: 'input' | 'textarea'` al item de la lista `DATA_INFO` y que el renderer existente lo respete.

   - `OtherInfoPage` (Seccion 4):
     - Patron `Description | YES/NO | Notes` con 9 items.
     - 8 items usan `ConsiderationTogglePage` normal.
     - `Delivery date` usa el componente `YesNoDateRow` (definido en paso 6) renderizado explicitamente fuera del `.map()` del grupo, o como una variante del item que el renderer detecta por `id`.
     - Marcar `others.notes` como requerido si `others.checked === 'yes'` via `superRefine` en el schema (no en el renderer).

   - `ShotSketchPage` (Seccion 5):
     - `SectionCard` con `FileUploadField` ocupando todo el ancho.

8) Cablear `RfqWorkspace` para resolver definicion por tipo (0.25 dia)
   - El componente final queda como:
     ```tsx
     export function RfqWorkspace({ mode, onBack, rfqId, tipo }: RfqWorkspaceProps) {
       const definition = tipo === 'Trimming' ? trimmingDefinition : moldDefinition;
       return <RfqWorkspaceShell definition={definition} mode={mode} onBack={onBack} rfqId={rfqId} tipo={tipo} />;
     }
     ```
   - El shell hace todo lo demas (formulario, navegacion, submit, feedback).

9) Limpieza de placeholders en Trimming (incluido en paso 7)
   - Ningun `TextField`, `TextAreaField`, `FileUploadField` ni input de tabla recibe `placeholder` en Trimming.
   - Mold queda fuera del alcance: conserva sus placeholders actuales sin cambios.

10) Validacion visual y tecnica (0.5 dia)
    - `npm run build`.
    - `npm run preview -- --host 127.0.0.1 --port 4173`.
    - Playwright session `ui-check` en `/industrializacion/rfq/crear?tipo=Trimming` (o ruta correspondiente):
      - Capturas en 1440, 1024, 768, 390.
      - Validar: barra de progreso "Pagina 1 de 5", sidebar resaltando seccion activa, sin overflow horizontal, file uploader en mobile.
      - Validar estados: toggle activo/inactivo, fila con error, fila completada (check verde en sidebar).
    - Regresion Mold: tomar capturas comparativas para asegurar que el refactor no movio nada.

## Detalle de pantallas (UI y comportamiento)

### Layout global (shell compartido con Mold)
- Header de 72px: logo + breadcrumb `Industrializacion › Crear RFQ › TRIMMING` + avatar.
- Sidebar 232px desktop (oculto en <lg), select mobile en tablet/mobile.
- Main con `max-w-[960px]` centrado, padding `px-6 lg:px-12 py-8 lg:py-10`.
- Encima de la primera seccion: titulo `CREAR RFQ` o `EDITAR RFQ`, subtitulo `Pagina X de 5 . <navLabel>`, link `Regresar`.
- Barra de progreso azul `--bocar-blue-100` debajo del titulo.
- Banner de feedback `neutral | success | error` con los estilos ya definidos.
- Footer: boton outline `Guardar Borrador` + boton primario `Siguiente →` / `Enviar RFQ` (en la ultima pagina).

### Seccion 1 · RFQ (`basic`)
- `SectionCard` titulo `1. RFQ`, subtitulo "Datos principales del requerimiento que disparan el flujo."
- Grid 2 columnas, 4 filas:
  - Fila 1: `DESCRIPTION` (required) | `PART N°` (required).
  - Fila 2: `PARTS PER YEAR` (number) | `PROJECT LIFE`.
  - Fila 3: `CUSTOMER` | `PREVIOUS JOB`.
  - Fila 4: `SUPPLIER` | `DELIVER THIS QUOTE BY` (date).
- Sin placeholders. Solo labels en `text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-70)]`.
- Borde `1px` `rgba(217,222,229,0.92)`, radius 10px, altura ~40px (consistente con Mold).

### Seccion 2 · Trim Die (`trim_die`)
- `SectionCard` titulo `2. Trim Die`, subtitulo "Configuracion y especificaciones del herramental de trimming."
- Tabla 2 columnas `minmax(0,1.1fr) minmax(0,1.9fr)` con headers `Description | Specs`.
- Filas:
  1. `Press` → input text.
  2. `No. of cavities` → input text (acepta sufijo `x` literal).
  3. `No. of hydraulic slides` → input text.
  4. `Fully Automatic process` → `YesNoToggle`.
  5. `Presence Detectors` → `YesNoToggle`.
  6. `Trimming process — condition of casting` → select con `Cold | Hot`.
  7. `Punch pins required` → `YesNoToggle`.
  8. `Admissible residual burr after trimming in mm` → input number step 0.1.
  9. `Castings supplied by Auma` → `YesNoToggle`.
  10. `Adjustments and optimization at tool maker's facilities` → `YesNoToggle` (label con wrap).
  11. `Gas springs` → input text.

### Seccion 3 · Data Information Required (`data_info`)
- `SectionCard` titulo `3. Data Information Required in the Price of the Trim Die`, subtitulo "Entregables tecnicos solicitados al toolmaker."
- Tabla 3 columnas `minmax(0,1.6fr) minmax(0,0.55fr) minmax(0,1.85fr)`: `Description | Aplica | Notes`.
- Items (todos con toggle YES/NO + notes):
  1. `Design 3D model`.
  2. `Design 2D data`.
  3. `Punch pins Data`.
  4. `Manufacturing Proposals`.
  5. `Latest trim die improvements` → notes como `<textarea rows={2}>`.
  6. `Sketch of trim die concept including steel dimensions`.
- El campo Notes esta siempre habilitado (regla explicita del usuario).

### Seccion 4 · Other Information (`other_info`)
- `SectionCard` titulo `4. Other Information`, subtitulo "Otros entregables y servicios incluidos."
- Tabla 3 columnas igual a Seccion 3.
- Items:
  1. `Frame Refurbishment`.
  2. `Set of electric wires`.
  3. `Others` → si `checked === 'yes'`, Notes obligatorio (validacion en schema).
  4. `Delivery date (in which IMEX must pick up the trim die)` → notes es `<input type="date">` cuando `checked === 'yes'`, en otro caso queda deshabilitado o se oculta.
  5. `Ejector system in fixed side`.
  6. `Trim die No. 1`.
  7. `Trim die No. 2`.
  8. `Set of spare parts (recommended by tool maker)`.
  9. `Hydraulic Cylinders and limit switches`.

### Seccion 5 · Complete Shot Sketch (`shot_sketch`)
- `SectionCard` titulo `5. Complete Shot Sketch`, subtitulo "Adjunta el shot sketch completo del componente."
- `FileUploadField`:
  - `accept=".png,.jpg,.jpeg,.pdf,.dwg"`.
  - Area drag-and-drop con minHeight 220px, fondo blanco, borde dashed.
  - Preview de imagen si aplica; sino chip con nombre + peso.
  - Boton secundario `Subir archivo`.
  - Mensaje de error si el formato no es valido o el tamano excede 10 MB.

## Riesgos y mitigaciones
- Riesgo: el refactor del shell rompe Mold en alguna pantalla.
  - Mitigacion: hacer el refactor en commits pequenios y validar Mold con screenshots Playwright en 1440/1024/768/390 antes de empezar Trimming.
- Riesgo: el patron `considerations.<id>` se mezcla entre Mold y Trimming si reusamos el mismo namespace.
  - Mitigacion: cada definicion tiene su propio `WorkspaceFormValues`, su propio set de keys y su propio `TOGGLE_REQUIRED_*`. No hay shared state entre tipos.
- Riesgo: violar Rules of Hooks al renderizar filas con `YesNoToggle` o `useWatch` dentro de `.map()`.
  - Mitigacion: (1) `TrimDiePage` declara sus 11 filas como JSX estatico, no como map sobre array de config. (2) `YesNoDateRow` es un componente React con PascalCase, nunca una funcion helper. (3) No re-implementar `ConsiderationTogglePage` en el archivo de Trimming; reusar el existente.
- Riesgo: el `FileUploadField` introduce complejidad nueva (drag-and-drop, validacion de tipos).
  - Mitigacion: empezar con `<input type="file">` estilizado + drop zone basica; iterar si surge feedback.
- Riesgo: la regla "sin placeholders" se aplica solo a Trimming y rompe la consistencia con Mold.
  - Mitigacion: documentar la decision en la PR y agendar follow-up para limpiar placeholders en Mold si el usuario lo confirma.

## Supuestos y huecos de informacion
- No hay backend; los datos y la carga de archivos son mock.
- No hay flujo definido para guardar borradores ni para versionar archivos adjuntos.
- La ruta de entrada al flujo de Trimming sigue siendo la del workspace actual; el selector ya pasa `tipo='Trimming'`.
- `Project Life` se modela como input texto libre (decision confirmada).
- Sidebar agrupa las 5 secciones bajo un unico grupo `TRIMMING` (decision confirmada).
- La regla "sin placeholders" aplica unicamente a Trimming; Mold no se toca (decision confirmada).

## Verificacion y fuentes (metodo)
- Fuentes:
  - [src/features/rfq/components/RfqForm/RfqWorkspace.tsx](src/features/rfq/components/RfqForm/RfqWorkspace.tsx) (shell y patrones de UI).
  - [src/features/rfq/components/RfqForm/RfqTypeSelectionScreen.tsx](src/features/rfq/components/RfqForm/RfqTypeSelectionScreen.tsx) (entry point, `RfqTipo`).
  - Brief funcional provisto por el usuario (campos por seccion, layout 2-col / 3-col, reglas de toggle y archivo, regla "sin placeholders").
  - [specs/PLAN_IMPLEMENTACION_COMPRAS_DASHBOARD_RFQ_LIST.md](specs/PLAN_IMPLEMENTACION_COMPRAS_DASHBOARD_RFQ_LIST.md) (formato de plan).
- Metodo:
  - Lectura completa del workspace actual para mapear shell vs contenido.
  - Mapeo seccion por seccion del brief al patron existente (`SectionCard`, `FormGrid`, `ConsiderationTogglePage`, `YesNoToggle`).
  - Identificacion de la primitiva faltante (`FileUploadField`).
  - Validacion final con Playwright en las 4 anchuras antes de cierre.

## Nivel de confianza
85/100. Limitado por:
- Comportamiento exacto de la carga de archivos cuando exista backend (persistencia, versionado, validacion server-side).
- Comportamiento del `Delivery date` cuando se cambia de YES a NO (limpiar fecha o conservarla).
