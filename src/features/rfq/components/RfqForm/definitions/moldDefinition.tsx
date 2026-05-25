import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';
import type { FieldPath, Resolver } from 'react-hook-form';
import { z } from 'zod';

import {
  ConsiderationTogglePage,
  FormGrid,
  SectionCard,
  TextAreaField,
  TextField,
  inputBaseClasses,
  type ConsiderationGroupConfig,
} from '../shell/primitives';
import type { NavGroup, PageMeta, RfqWorkspaceDefinition } from '../shell/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const TOGGLE_REQUIRED_CONSIDERATIONS = new Set([
  'd_3d', 'flan', 'run_des', 'run_over', 'man_prop', 'ldi', 'add_mach', 'sketch', 'drw_2d', 'drw_3d',
  'eyeb', 'ow_conn', 'stm', 'cmm_rep', 'gom_rep', 'h_val', 'dim_corr', 'sp_pt',
  'comp_d', 'subseq_d', 'repl_h13', 'sp_ei', 'ficf', 'hcls', 'fr_refur',
]);

const moldSchema = z
  .object({
    alloy: z.string(), // opcional · string libre (ej. "AlSi10MnMg")
    buhler: z.string(), // opcional · número como string (input type number, en toneladas)
    comments: z.string(), // opcional · texto libre (textarea, sin límite de longitud)
    considerations: z.record(
      z.string(),
      z.object({ checked: z.string().optional(), notes: z.string() })
    ), // claves libres → { checked?: string, notes: string }; superRefine: las 25 claves de TOGGLE_REQUIRED_CONSIDERATIONS requieren checked no vacío
    cust: z.string(), // opcional · nombre del cliente, string libre
    dtq: z.string(), // opcional · semana de entrega de cotización, string libre (ej. "WEEK")
    elab: z.string(), // opcional · nombre del elaborador, string libre
    gates: z.string(), // opcional · número de gates por pieza, número como string
    hydr_slides: z.string(), // opcional · número de slides hidráulicos, número como string
    mech_slides: z.string(), // opcional · número de slides mecánicos, número como string
    num_cav: z.string(), // opcional · número de cavidades, número como string
    num_tools: z.string(), // opcional · número de herramientas, número como string
    part_dim: z.string(), // opcional · dimensiones en string libre (ej. "L x W x H" en mm)
    part_name: z.string().trim().min(1, 'Ingresa el nombre de la pieza antes de continuar.'), // requerido · trim · mínimo 1 carácter
    part_number: z.string().trim().min(1, 'Ingresa el numero de parte antes de enviar la RFQ.'), // requerido · trim · mínimo 1 carácter
    part_tech: z.string(), // opcional · tecnología de la pieza, string libre (ej. "POWERTRAIN")
    parts_stroke: z.string(), // opcional · piezas por golpe, número como string
    pnum: z.string(), // opcional · número de parte legacy / folio interno, string libre
    ppy: z.string(), // opcional · partes por año, número como string
    prlf: z.string(), // opcional · vida del proyecto en años, número como string
    projected: z.coerce.number().optional(), // opcional · decimal (cm²); coerciona el string del input a number en validación
    rfq_name: z.string().trim().min(1, 'Ingresa el nombre del RFQ para continuar.'), // requerido · trim · mínimo 1 carácter
    sk_part: z.string(), // opcional · lista de spare parts, texto libre (textarea)
    surface: z.string(), // opcional · superficie en cm², número como string
    three_plate: z.string(), // opcional · three plate mold, número como string
    tt: z.string(), // opcional · tool type, string libre (ej. "PRODUCTION")
    volume: z.string(), // opcional · volumen en cm³, número como string
    wall_max: z.string(), // opcional · espesor máximo de pared en mm, número como string
    wall_min: z.string(), // opcional · espesor mínimo de pared en mm, número como string
    weight: z.coerce.number().optional(), // opcional · decimal (g); coerciona el string del input a number en validación
  })
  .superRefine((values, ctx) => {
    TOGGLE_REQUIRED_CONSIDERATIONS.forEach((key) => {
      if (!values.considerations[key]?.checked?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: 'Selecciona si aplica.',
          path: ['considerations', key, 'checked'],
        });
      }
    });
  });

type MoldFormValues = z.infer<typeof moldSchema>;

// ─── Navigation ───────────────────────────────────────────────────────────────

type MoldPageKey =
  | 'basic'
  | 'tool_eng'
  | 'dcm'
  | 'diritpotd'
  | 'other_cons'
  | 'ot_inf'
  | 'spareparts'
  | 'geometry'
  | 'tool_spec'
  | 'comments';

const PAGES: readonly MoldPageKey[] = [
  'basic', 'tool_eng', 'dcm', 'diritpotd', 'other_cons', 'ot_inf', 'spareparts',
  'geometry', 'tool_spec', 'comments',
];

const PAGE_META: Record<MoldPageKey, PageMeta> = {
  basic: { navLabel: 'RFQ', subtitle: 'Datos principales del requerimiento que disparan el flujo.', title: '1. RFQ' },
  comments: { navLabel: 'COMMENTS', subtitle: 'Notas finales y contexto adicional para el proveedor.', title: '10. Comments' },
  dcm: { navLabel: 'DCM', subtitle: 'Entregables y requisitos del concepto de molde.', title: '3. DCM' },
  diritpotd: { navLabel: 'DIRITPOTD', subtitle: 'Diseno, ingenieria y documentacion tecnica.', title: '4. DIRITPOTD' },
  geometry: { navLabel: 'PART GEOMETRY', subtitle: 'Dimensiones y propiedades del componente.', title: '8. Part Geometry' },
  other_cons: { navLabel: 'OTHER', subtitle: 'Otros entregables de la cotizacion.', title: '5. Other' },
  ot_inf: { navLabel: 'OT INF', subtitle: 'Documentacion adicional requerida al proveedor.', title: '6. OT INF' },
  spareparts: { navLabel: 'SK PART', subtitle: 'Refacciones criticas a cotizar individualmente.', title: '7. SK PART' },
  tool_eng: { navLabel: 'TOOL ENG.', subtitle: 'Configuracion y parametros del herramental.', title: '2. Tool Engineering' },
  tool_spec: { navLabel: 'TOOL SPECIFICATION', subtitle: 'Dimensiones y configuracion detallada del herramental.', title: '9. Tool Specification' },
};

const NAV_GROUPS: readonly NavGroup[] = [
  {
    key: 'MOLD',
    label: 'MOLD',
    items: [
      { key: 'basic', label: 'RFQ' },
      { key: 'tool_eng', label: 'TOOL ENG.' },
      { key: 'dcm', label: 'DCM' },
      { key: 'diritpotd', label: 'DIRITPOTD' },
      { key: 'other_cons', label: 'OTHER' },
      { key: 'ot_inf', label: 'OT INF' },
      { key: 'spareparts', label: 'SK PART' },
    ],
  },
  {
    key: 'COST_BREAKDOWN',
    label: 'COST BREAKDOWN',
    items: [
      { key: 'geometry', label: 'PART GEOMETRY' },
      { key: 'tool_spec', label: 'TOOL SPECIFICATION' },
      { key: 'comments', label: 'COMMENTS' },
    ],
  },
];

const REQUIRED_FIELDS_BY_PAGE: Partial<Record<MoldPageKey, readonly FieldPath<MoldFormValues>[]>> = {
  basic: ['rfq_name'],
  diritpotd: [
    'considerations.d_3d.checked',
    'considerations.flan.checked',
    'considerations.run_des.checked',
    'considerations.run_over.checked',
    'considerations.man_prop.checked',
    'considerations.ldi.checked',
    'considerations.add_mach.checked',
    'considerations.sketch.checked',
    'considerations.drw_2d.checked',
    'considerations.drw_3d.checked',
  ],
  other_cons: [
    'considerations.eyeb.checked',
    'considerations.ow_conn.checked',
    'considerations.stm.checked',
    'considerations.cmm_rep.checked',
    'considerations.gom_rep.checked',
    'considerations.h_val.checked',
    'considerations.dim_corr.checked',
    'considerations.sp_pt.checked',
  ],
  ot_inf: [
    'considerations.comp_d.checked',
    'considerations.subseq_d.checked',
    'considerations.repl_h13.checked',
    'considerations.sp_ei.checked',
    'considerations.ficf.checked',
    'considerations.hcls.checked',
    'considerations.fr_refur.checked',
  ],
  geometry: ['part_name', 'part_number'],
};

// ─── Consideration groups ─────────────────────────────────────────────────────

type MoldConsiderationGroup = ConsiderationGroupConfig & {
  key: string;
  page: MoldPageKey;
};

const CONSIDERATION_GROUPS: readonly MoldConsiderationGroup[] = [
  {
    key: 'DCM',
    page: 'dcm',
    title: PAGE_META.dcm.title,
    subtitle: PAGE_META.dcm.subtitle,
    items: [
      { id: 'smach', label: 'Smash' },
      { id: 'no_cav', label: 'No.CAV' },
      { id: 'no_hs', label: 'No.ofHS' },
      { id: 'no_ms', label: 'No.ofMS' },
      { id: 'third_p_supp', label: '3thPSupp', noteExample: 'Para partes estructurales con aleacion AlSi10, considerar acero 3D forjado.' },
      { id: 'no_subc', label: 'No.subc' },
      { id: 'jco', label: 'Jco' },
      { id: 'qc_sys', label: 'QcSys' },
      { id: 'ihtcs', label: 'Ihtcs' },
      { id: 'spin', label: 'Spin' },
      { id: 'hics', label: 'HICS' },
      { id: 'cm_gom', label: 'CMGOM' },
      { id: 'sp_thermo', label: 'SPforThermoR' },
      { id: 'n_return_v', label: 'NReturnV' },
      { id: 'vac_v', label: 'VacV' },
      { id: 'chill_bl', label: 'ChillBl' },
      { id: 'no_pl_jco', label: 'No.Pl.Jco sys' },
      { id: 'ctbd', label: 'Oth' },
    ],
  },
  {
    key: 'DIRITPOTD',
    page: 'diritpotd',
    title: PAGE_META.diritpotd.title,
    subtitle: PAGE_META.diritpotd.subtitle,
    items: [
      { id: 'd_3d', label: '3D' },
      { id: 'flan', label: 'FiAn' },
      { id: 'run_des', label: 'Run des' },
      { id: 'run_over', label: 'Run and over mod' },
      { id: 'man_prop', label: 'ManProp', noteExample: 'Para partes estructurales con aleacion AlSi10, acero 3D forjado requerido.' },
      { id: 'ldi', label: 'Ldi' },
      { id: 'add_mach', label: 'Add of mach st.' },
      { id: 'sketch', label: 'Sketch d conc, inc s dim' },
      { id: 'drw_2d', label: '2D Dr DesPDF and CNFl', noteExample: 'Incluir componentes, cavidades, insertos, core pins, ejector pins y spare parts criticos.' },
      { id: 'drw_3d', label: '3D D. Mod. solid. (Native Format)' },
    ],
  },
  {
    key: 'OTHER',
    page: 'other_cons',
    title: PAGE_META.other_cons.title,
    subtitle: PAGE_META.other_cons.subtitle,
    items: [
      { id: 'eyeb', label: 'Eyeb' },
      { id: 'ow_conn', label: 'C&W Conn' },
      { id: 'stm', label: 'STM (1&2)' },
      { id: 'cmm_rep', label: 'CMM dim rep cal', noteExample: 'Tolerancia de posicion 10% del producto.' },
      { id: 'gom_rep', label: 'GOM rep. Ass cav, sl, in, cpln', noteExample: 'Tolerancia superficies de aluminio 10% del producto.' },
      { id: 'h_val', label: 'H val subc& in', noteExample: '44 - 46 HRC (H11 - H13).' },
      { id: 'dim_corr', label: 'Dim con&opt' },
      { id: 'sp_pt', label: 'Sp Pl' },
    ],
  },
  {
    key: 'OT_INF',
    page: 'ot_inf',
    title: PAGE_META.ot_inf.title,
    subtitle: PAGE_META.ot_inf.subtitle,
    items: [
      { id: 'comp_d', label: 'Comp. D.' },
      { id: 'subseq_d', label: 'Subseq. D.' },
      { id: 'repl_h13', label: 'Set of repl. H-13', noteExample: 'Cavidades de reemplazo.' },
      { id: 'sp_ei', label: 'Sp. set of E.I.' },
      { id: 'ficf', label: 'FICF' },
      { id: 'hcls', label: 'HCLS' },
      { id: 'fr_refur', label: 'Fr Refur.' },
    ],
  },
];

// ─── Default values ───────────────────────────────────────────────────────────

function getCreateDefaultValues(): MoldFormValues {
  return {
    alloy: '', buhler: '', comments: '', considerations: {}, cust: '', dtq: '', elab: '', gates: '',
    hydr_slides: '', mech_slides: '', num_cav: '', num_tools: '', part_dim: '', part_name: '',
    part_number: '', part_tech: '', parts_stroke: '', pnum: '', ppy: '', prlf: '',
    rfq_name: '', sk_part: '', surface: '', three_plate: '', tt: '', volume: '', wall_max: '',
    wall_min: '',
  };
}

function getEditDefaultValues(rfqId?: string): MoldFormValues {
  return {
    alloy: 'AlSi10MnMg',
    buhler: '3400',
    comments: 'Validar paquete dimensional con el proveedor antes del release final.',
    considerations: {
      cmm_rep: { checked: 'yes', notes: 'Tolerancia de posicion 10% del producto.' },
      comp_d: { checked: 'yes', notes: '' },
      d_3d: { checked: 'yes', notes: 'Modelo preliminar disponible en revision M1.' },
      drw_2d: { checked: 'yes', notes: 'Se requiere PDF + CNF con componentes criticos.' },
      man_prop: { checked: 'yes', notes: 'Cotizar propuesta con acero 3D forjado.' },
      smach: { checked: '', notes: 'Buhler 3400T confirmada para la corrida.' },
    },
    cust: 'Name XX',
    dtq: '12',
    elab: 'Ing. Torres',
    gates: '2',
    hydr_slides: '1',
    mech_slides: '2',
    num_cav: '2',
    num_tools: '1',
    part_dim: '410 x 180 x 88',
    part_name: 'Door side support',
    part_number: `${(rfqId ?? 'RFQ-021').toUpperCase()}-MAT`,
    part_tech: 'POWERTRAIN',
    parts_stroke: '1',
    pnum: 'MAT-2024-001',
    ppy: '240000',
    prlf: '5',
    projected: 336,
    rfq_name: 'Proyecto soporte puerta',
    sk_part: 'Inserto lateral H13 (Set de seguridad) - 2 pzas.\nCavidad principal de reemplazo (H13 forjado) - 1 pza.',
    surface: '522',
    three_plate: '0',
    tt: 'PRODUCTION',
    volume: '418',
    wall_max: '4.2',
    wall_min: '2.6',
    weight: 1280,
  };
}

// ─── Completion / error maps ──────────────────────────────────────────────────

function getCompletedMap(values: MoldFormValues): Partial<Record<string, boolean>> {
  return {
    basic: values.rfq_name.trim().length > 0,
    geometry: values.part_name.trim().length > 0 && values.part_number.trim().length > 0,
  };
}

function getPageErrorMap(
  errors: Parameters<RfqWorkspaceDefinition<MoldFormValues>['getPageErrorMap']>[0]
): Partial<Record<string, boolean>> {
  const cons = errors.considerations as Record<string, unknown> | undefined;

  function pageHasConsidErrors(page: MoldPageKey): boolean {
    if (!cons) return false;
    const group = CONSIDERATION_GROUPS.find((g) => g.page === page);
    if (!group) return false;
    return group.items.some((item) => TOGGLE_REQUIRED_CONSIDERATIONS.has(item.id) && Boolean(cons[item.id]));
  }

  return {
    basic: Boolean(errors.rfq_name),
    diritpotd: pageHasConsidErrors('diritpotd'),
    other_cons: pageHasConsidErrors('other_cons'),
    ot_inf: pageHasConsidErrors('ot_inf'),
    geometry: Boolean(errors.part_name || errors.part_number),
  };
}

// ─── Page components ──────────────────────────────────────────────────────────

function ConsiderationPage({ group }: { group: MoldConsiderationGroup }) {
  const { register } = useFormContext();

  return (
    <SectionCard subtitle={group.subtitle} title={group.title}>
      <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)] gap-5 border-b border-[rgba(217,222,229,0.86)] pb-3 md:grid">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
          Entregable / requisito
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
          Especificaciones
        </div>
      </div>
      <div className="divide-y divide-[rgba(236,240,245,0.9)]">
        {group.items.map((item) => (
          <div
            key={item.id}
            className="grid gap-3 py-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)] md:items-center md:gap-5"
          >
            <div className="text-[13px] font-medium leading-[1.5] text-[var(--bocar-text)]">
              {item.label}
            </div>
            <input
              className={inputBaseClasses(false)}
              placeholder={item.noteExample ?? 'Especificaciones / notas'}
              {...register(`considerations.${item.id}.notes`)}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function BasicPage() {
  return (
    <SectionCard subtitle={PAGE_META.basic.subtitle} title={PAGE_META.basic.title}>
      <FormGrid>
        <TextField
          hint="Nombre visible para compras, industrializacion y seguimiento interno."
          label="DESC"
          name="rfq_name"
          placeholder="Product / E-PCP Folio"
          required
        />
        <TextField label="CUST" name="cust" placeholder="Name XX" />
        <TextField label="PPY" name="ppy" type="number" />
        <TextField label="PT" name="part_tech" placeholder="POWERTRAIN" />
      </FormGrid>
    </SectionCard>
  );
}

function ToolEngineeringPage() {
  return (
    <SectionCard subtitle={PAGE_META.tool_eng.subtitle} title={PAGE_META.tool_eng.title}>
      <FormGrid>
        <TextField label="PNUM" name="pnum" />
        <TextField label="DTQ" name="dtq" placeholder="WEEK" />
        <TextField label="PRLF" name="prlf" placeholder="X Years" />
        <TextField label="ELAB" name="elab" placeholder="NAME" />
        <TextField label="TT" name="tt" placeholder="PRODUCTION" />
      </FormGrid>
    </SectionCard>
  );
}

function SparePartsPage() {
  return (
    <SectionCard subtitle={PAGE_META.spareparts.subtitle} title={PAGE_META.spareparts.title}>
      <TextAreaField
        label="Descripcion"
        name="sk_part"
        placeholder="Ingresa una descripcion adicional"
        rows={8}
        span={2}
      />
    </SectionCard>
  );
}

function GeometryPage() {
  return (
    <SectionCard subtitle={PAGE_META.geometry.subtitle} title={PAGE_META.geometry.title}>
      <div className="grid gap-5">
        <TextField label="Part Name" name="part_name" placeholder="Product / E-PCP Folio" required />
        <TextField label="Alloy" name="alloy" />
        <TextField label="Part Number" name="part_number" required />
        <TextField label="Part dimension in mm" name="part_dim" placeholder="L x W x H" />
        <TextField label="Min. wall thickness in mm" name="wall_min" type="number" />
        <TextField label="Max. wall thickness in mm" name="wall_max" type="number" />
        <TextField label="Projected area in cm2" name="projected" type="number" />
        <TextField label="Surface in cm2" name="surface" type="number" />
        <TextField label="Volume in cm3" name="volume" type="number" />
        <TextField label="Gross weight in g" name="weight" type="number" />
      </div>
    </SectionCard>
  );
}

function ToolSpecificationPage() {
  return (
    <SectionCard subtitle={PAGE_META.tool_spec.subtitle} title={PAGE_META.tool_spec.title}>
      <div className="grid gap-5">
        <TextField label="Bühler Machine Ton" name="buhler" type="number" />
        <TextField label="Number of cavities / sets" name="num_cav" type="number" />
        <TextField label="Three plate mold" name="three_plate" type="number" />
        <TextField label="Number of gates per part" name="gates" type="number" />
        <TextField label="Number of mech. slides" name="mech_slides" type="number" />
        <TextField label="Number of hydr. slides" name="hydr_slides" type="number" />
        <TextField label="Number of parts per stroke" name="parts_stroke" type="number" />
        <TextField label="Number of tools" name="num_tools" type="number" />
      </div>
    </SectionCard>
  );
}

function CommentsPage() {
  return (
    <SectionCard subtitle={PAGE_META.comments.subtitle} title={PAGE_META.comments.title}>
      <TextAreaField
        label="Comentarios adicionales"
        name="comments"
        placeholder="Ingresa un comentario adicional"
        rows={8}
        span={2}
      />
    </SectionCard>
  );
}

function renderPage(page: string): ReactNode {
  if (page === 'basic') return <BasicPage />;
  if (page === 'tool_eng') return <ToolEngineeringPage />;
  if (page === 'spareparts') return <SparePartsPage />;
  if (page === 'geometry') return <GeometryPage />;
  if (page === 'tool_spec') return <ToolSpecificationPage />;
  if (page === 'comments') return <CommentsPage />;

  if (page === 'dcm') {
    const group = CONSIDERATION_GROUPS.find((g) => g.page === page);
    return group ? <ConsiderationPage group={group} /> : null;
  }

  if (page === 'diritpotd' || page === 'other_cons' || page === 'ot_inf') {
    const group = CONSIDERATION_GROUPS.find((g) => g.page === page);
    return group ? <ConsiderationTogglePage group={group} /> : null;
  }

  return null;
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const moldDefinition: RfqWorkspaceDefinition<MoldFormValues> = {
  resolver: zodResolver(moldSchema) as Resolver<MoldFormValues>,
  getCreateDefaultValues,
  getEditDefaultValues,
  pages: PAGES,
  navGroups: NAV_GROUPS,
  pageMeta: PAGE_META,
  requiredFieldsByPage: REQUIRED_FIELDS_BY_PAGE,
  renderPage,
  getCompletedMap,
  getPageErrorMap,
  onInvalidSubmit: (fieldErrors, { setFocus }) => {
    if (fieldErrors.rfq_name) { setFocus('rfq_name'); return; }
    if (fieldErrors.part_name || fieldErrors.part_number) {
      setFocus(fieldErrors.part_name ? 'part_name' : 'part_number');
    }
  },
};
