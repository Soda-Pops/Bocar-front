import { zodResolver } from '@hookform/resolvers/zod';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  FormProvider,
  type FieldErrors,
  type FieldPath,
  type SubmitErrorHandler,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { z } from 'zod';

import logoBocar from '@/assets/images/Logo-Bocar.png';
import { dashboardUser } from '@/features/analytics/services/analyticsService';
import { Button } from '@/shared/components/ui/Button';

type RfqWorkspaceMode = 'create' | 'edit';
type FeedbackTone = 'neutral' | 'success' | 'error';

type RfqWorkspaceProps = {
  mode: RfqWorkspaceMode;
  onBack: () => void;
  rfqId?: string;
};

const costRowSchema = z.object({
  notes: z.string(),
  price: z.string(),
  unit: z.string(),
  weeks: z.string(),
});

const workspaceSchema = z.object({
  alloy: z.string(),
  buhler: z.string(),
  comments: z.string(),
  considerations: z.record(z.string(), z.object({ checked: z.string(), notes: z.string() })),
  costs: z.record(z.string(), z.record(z.string(), costRowSchema)),
  cust: z.string(),
  dtq: z.string(),
  elab: z.string(),
  gates: z.string(),
  hydr_slides: z.string(),
  mech_slides: z.string(),
  num_cav: z.string(),
  num_tools: z.string(),
  part_dim: z.string(),
  part_name: z.string().trim().min(1, 'Ingresa el nombre de la pieza antes de continuar.'),
  part_number: z.string().trim().min(1, 'Ingresa el numero de parte antes de enviar la RFQ.'),
  part_tech: z.string(),
  parts_stroke: z.string(),
  pnum: z.string(),
  ppy: z.string(),
  prlf: z.string(),
  projected: z.string(),
  rfq_name: z.string().trim().min(1, 'Ingresa el nombre del RFQ para continuar.'),
  sk_part: z.string(),
  surface: z.string(),
  three_plate: z.string(),
  tt: z.string(),
  volume: z.string(),
  wall_max: z.string(),
  wall_min: z.string(),
  weight: z.string(),
});

type WorkspaceFormValues = z.infer<typeof workspaceSchema>;

type PageKey =
  | 'basic'
  | 'tool_eng'
  | 'dcm'
  | 'diritpotd'
  | 'other_cons'
  | 'ot_inf'
  | 'spareparts'
  | 'accessories'
  | 'materials'
  | 'manufacturing'
  | 'corrections'
  | 'logistics'
  | 'sampling'
  | 'geometry'
  | 'tool_spec'
  | 'comments';

type CostPageKey =
  | 'accessories'
  | 'materials'
  | 'manufacturing'
  | 'corrections'
  | 'logistics'
  | 'sampling';

type ConsiderationGroupKey = 'DCM' | 'DIRITPOTD' | 'OTHER' | 'OT_INF';

type ConsiderationItem = {
  id: string;
  label: string;
  noteExample?: string;
};

type ConsiderationGroup = {
  key: ConsiderationGroupKey;
  page: PageKey;
  subtitle: string;
  title: string;
  items: ConsiderationItem[];
};

type CostRow = {
  id: string;
  label: string;
};

type CostSubsection = {
  rows: CostRow[];
  title: string;
  unitHeader: 'hours' | 'unit';
};

type CostSection = {
  key: CostPageKey;
  rows?: CostRow[];
  subsections?: CostSubsection[];
  subtitle: string;
  title: string;
  unitHeader?: 'hours' | 'unit';
};

const PAGES: readonly PageKey[] = [
  'basic',
  'tool_eng',
  'dcm',
  'diritpotd',
  'other_cons',
  'ot_inf',
  'spareparts',
  'geometry',
  'tool_spec',
  'comments',
];

const COST_PAGES: readonly CostPageKey[] = [
  'accessories',
  'materials',
  'manufacturing',
  'corrections',
  'logistics',
  'sampling',
];

const REQUIRED_FIELDS_BY_PAGE: Partial<Record<PageKey, readonly FieldPath<WorkspaceFormValues>[]>> = {
  basic: ['rfq_name'],
  geometry: ['part_name', 'part_number'],
};

const PAGE_META: Record<PageKey, { navLabel: string; subtitle: string; title: string }> = {
  accessories: {
    navLabel: 'COST BREAKDOWN',
    subtitle: 'Costos de accesorios. Lo llena el toolmaker.',
    title: '8. Accessories',
  },
  basic: {
    navLabel: 'RFQ',
    subtitle: 'Datos principales del requerimiento que disparan el flujo.',
    title: '1. RFQ',
  },
  comments: {
    navLabel: 'COMMENTS',
    subtitle: 'Notas finales y contexto adicional para el proveedor.',
    title: '10. Comments',
  },
  corrections: {
    navLabel: 'COST BREAKDOWN',
    subtitle: 'Medicion y optimizacion de cavidades.',
    title: '11. Corrections',
  },
  dcm: {
    navLabel: 'DCM',
    subtitle: 'Entregables y requisitos del concepto de molde.',
    title: '3. DCM',
  },
  diritpotd: {
    navLabel: 'DIRITPOTD',
    subtitle: 'Diseno, ingenieria y documentacion tecnica.',
    title: '4. DIRITPOTD',
  },
  geometry: {
    navLabel: 'PART GEOMETRY',
    subtitle: 'Dimensiones y propiedades del componente.',
    title: '8. Part Geometry',
  },
  logistics: {
    navLabel: 'COST BREAKDOWN',
    subtitle: 'Empaque, transporte y otros costos logisticos.',
    title: '12. Logistics',
  },
  manufacturing: {
    navLabel: 'COST BREAKDOWN',
    subtitle: 'Tiempos y costos por proceso.',
    title: '10. Manufacturing',
  },
  materials: {
    navLabel: 'COST BREAKDOWN',
    subtitle: 'Partes compradas y materia prima.',
    title: '9. Materials',
  },
  other_cons: {
    navLabel: 'OTHER',
    subtitle: 'Otros entregables de la cotizacion.',
    title: '5. Other',
  },
  ot_inf: {
    navLabel: 'OT INF',
    subtitle: 'Documentacion adicional requerida al proveedor.',
    title: '6. OT INF',
  },
  sampling: {
    navLabel: 'COST BREAKDOWN',
    subtitle: 'Muestreo en las instalaciones del toolmaker.',
    title: '13. Sampling',
  },
  spareparts: {
    navLabel: 'SK PART',
    subtitle: 'Refacciones criticas a cotizar individualmente.',
    title: '7. SK PART - Spare Parts',
  },
  tool_eng: {
    navLabel: 'TOOL ENG.',
    subtitle: 'Configuracion y parametros del herramental.',
    title: '2. Tool Engineering',
  },
  tool_spec: {
    navLabel: 'TOOL SPECIFICATION',
    subtitle: 'Dimensiones y configuracion detallada del herramental.',
    title: '9. Tool Specification',
  },
};

type NavItem = { key: PageKey; label: string };
type NavGroup = { key: 'MOLD' | 'COST_BREAKDOWN'; label: string; items: readonly NavItem[] };

const NAV_GROUPS: readonly NavGroup[] = [
  {
    items: [
      { key: 'basic', label: 'RFQ' },
      { key: 'tool_eng', label: 'TOOL ENG.' },
      { key: 'dcm', label: 'DCM' },
      { key: 'diritpotd', label: 'DIRITPOTD' },
      { key: 'other_cons', label: 'OTHER' },
      { key: 'ot_inf', label: 'OT INF' },
      { key: 'spareparts', label: 'SK PART' },
    ],
    key: 'MOLD',
    label: 'MOLD',
  },
  {
    items: [
      { key: 'geometry', label: 'PART GEOMETRY' },
      { key: 'tool_spec', label: 'TOOL SPECIFICATION' },
      { key: 'comments', label: 'COMMENTS' },
    ],
    key: 'COST_BREAKDOWN',
    label: 'COST BREAKDOWN',
  },
];

const CONSIDERATION_GROUPS: readonly ConsiderationGroup[] = [
  {
    items: [
      { id: 'smach', label: 'Smash' },
      { id: 'no_cav', label: 'No.CAV' },
      { id: 'no_hs', label: 'No.ofHS' },
      { id: 'no_ms', label: 'No.ofMS' },
      {
        id: 'third_p_supp',
        label: '3thPSupp',
        noteExample: 'Para partes estructurales con aleacion AlSi10, considerar acero 3D forjado.',
      },
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
    key: 'DCM',
    page: 'dcm',
    subtitle: PAGE_META.dcm.subtitle,
    title: PAGE_META.dcm.title,
  },
  {
    items: [
      { id: 'd_3d', label: '3D' },
      { id: 'flan', label: 'FiAn' },
      { id: 'run_des', label: 'Run des' },
      { id: 'run_over', label: 'Run and over mod' },
      {
        id: 'man_prop',
        label: 'ManProp',
        noteExample: 'Para partes estructurales con aleacion AlSi10, acero 3D forjado requerido.',
      },
      { id: 'ldi', label: 'Ldi' },
      { id: 'add_mach', label: 'Add of mach st.' },
      { id: 'sketch', label: 'Sketch d conc, inc s dim' },
      {
        id: 'drw_2d',
        label: '2D Dr DesPDF and CNFl',
        noteExample: 'Incluir componentes, cavidades, insertos, core pins, ejector pins y spare parts criticos.',
      },
      { id: 'drw_3d', label: '3D D. Mod. solid. (Native Format)' },
    ],
    key: 'DIRITPOTD',
    page: 'diritpotd',
    subtitle: PAGE_META.diritpotd.subtitle,
    title: PAGE_META.diritpotd.title,
  },
  {
    items: [
      { id: 'eyeb', label: 'Eyeb' },
      { id: 'ow_conn', label: 'C&W Conn' },
      { id: 'stm', label: 'STM (1&2)' },
      {
        id: 'cmm_rep',
        label: 'CMM dim rep cal',
        noteExample: 'Tolerancia de posicion 10% del producto.',
      },
      {
        id: 'gom_rep',
        label: 'GOM rep. Ass cav, sl, in, cpln',
        noteExample: 'Tolerancia superficies de aluminio 10% del producto.',
      },
      {
        id: 'h_val',
        label: 'H val subc& in',
        noteExample: '44 - 46 HRC (H11 - H13).',
      },
      { id: 'dim_corr', label: 'Dim con&opt' },
      { id: 'sp_pt', label: 'Sp Pl' },
    ],
    key: 'OTHER',
    page: 'other_cons',
    subtitle: PAGE_META.other_cons.subtitle,
    title: PAGE_META.other_cons.title,
  },
  {
    items: [
      { id: 'comp_d', label: 'Comp. D.' },
      { id: 'subseq_d', label: 'Subseq. D.' },
      {
        id: 'repl_h13',
        label: 'Set of repl. H-13',
        noteExample: 'Cavidades de reemplazo.',
      },
      { id: 'sp_ei', label: 'Sp. set of E.I.' },
      { id: 'ficf', label: 'FICF' },
      { id: 'hcls', label: 'HCLS' },
      { id: 'fr_refur', label: 'Fr Refur.' },
    ],
    key: 'OT_INF',
    page: 'ot_inf',
    subtitle: PAGE_META.ot_inf.subtitle,
    title: PAGE_META.ot_inf.title,
  },
];

const COST_SECTIONS: readonly CostSection[] = [
  {
    key: 'accessories',
    rows: [
      { id: 'acc_parker', label: 'Cilindros hidraulicos Parker & Square D' },
      { id: 'acc_jet', label: 'Jet cooling' },
      { id: 'acc_squeeze', label: 'Squeeze pin' },
      { id: 'acc_interch', label: 'Insertos intercambiables' },
      { id: 'acc_chill', label: 'Chill blocks / Vacuum valves' },
      { id: 'acc_eye', label: 'Eyebolts' },
      { id: 'acc_owconn', label: 'Conectores O&W' },
      { id: 'acc_leth', label: 'Distribuidor Lethiguel' },
      { id: 'acc_other', label: 'Otros' },
    ],
    subtitle: PAGE_META.accessories.subtitle,
    title: PAGE_META.accessories.title,
    unitHeader: 'unit',
  },
  {
    key: 'materials',
    rows: [
      { id: 'mat_frame', label: 'Die frame' },
      { id: 'mat_cav', label: 'Cavidad' },
      { id: 'mat_pipes', label: 'Tuberia de acero' },
      { id: 'mat_other', label: 'Otros' },
    ],
    subtitle: PAGE_META.materials.subtitle,
    title: PAGE_META.materials.title,
    unitHeader: 'unit',
  },
  {
    key: 'manufacturing',
    subsections: [
      {
        rows: [
          { id: 'man_mill', label: 'Milling' },
          { id: 'man_turn', label: 'Turning' },
          { id: 'man_wire', label: 'Corte por hilo' },
          { id: 'man_edm', label: 'EDM' },
          { id: 'man_grind', label: 'Rectificado' },
          { id: 'man_drill', label: 'Barrenado' },
          { id: 'man_other', label: 'Otros' },
        ],
        title: 'Maquinado',
        unitHeader: 'hours',
      },
      {
        rows: [
          { id: 'mw_assy', label: 'Ensamble' },
          { id: 'mw_spot', label: 'Spotting' },
          { id: 'mw_strip', label: 'Stripping y pulido' },
          { id: 'mw_other', label: 'Otros' },
        ],
        title: 'Trabajo manual',
        unitHeader: 'hours',
      },
      {
        rows: [
          { id: 'ht_hard', label: 'Endurecimiento' },
          { id: 'ht_nitr', label: 'Nitrurado' },
          { id: 'ht_coat', label: 'Recubrimiento' },
          { id: 'ht_grain', label: 'Graining' },
          { id: 'ht_other', label: 'Otros' },
        ],
        title: 'Tratamiento termico y superficial',
        unitHeader: 'hours',
      },
      {
        rows: [
          { id: 'ed_design', label: 'Diseno' },
          { id: 'ed_cam', label: 'CAM / programacion NC' },
          { id: 'ed_other', label: 'Otros' },
        ],
        title: 'Ingenieria y diseno',
        unitHeader: 'hours',
      },
    ],
    subtitle: PAGE_META.manufacturing.subtitle,
    title: PAGE_META.manufacturing.title,
  },
  {
    key: 'corrections',
    rows: [
      { id: 'cor_meas', label: 'Medicion de cavidades' },
      { id: 'cor_other', label: 'Otros' },
    ],
    subtitle: PAGE_META.corrections.subtitle,
    title: PAGE_META.corrections.title,
    unitHeader: 'hours',
  },
  {
    key: 'logistics',
    rows: [
      { id: 'log_pack', label: 'Limpieza y empaque' },
      { id: 'log_other', label: 'Otros costos' },
    ],
    subtitle: PAGE_META.logistics.subtitle,
    title: PAGE_META.logistics.title,
    unitHeader: 'unit',
  },
  {
    key: 'sampling',
    rows: [
      { id: 'samp_parts', label: 'Piezas de muestreo (50)' },
      { id: 'samp_meas', label: 'Mediciones (5)' },
    ],
    subtitle: PAGE_META.sampling.subtitle,
    title: PAGE_META.sampling.title,
    unitHeader: 'unit',
  },
];

function isCostPage(page: PageKey): page is CostPageKey {
  return COST_PAGES.includes(page as CostPageKey);
}

function getStorageBaseKey(mode: RfqWorkspaceMode, rfqId?: string) {
  return mode === 'edit' ? `bocar-rfq-workspace-${(rfqId ?? 'RFQ-021').toLowerCase()}` : 'bocar-rfq-workspace-create';
}

function readStorageValue<T>(key: string, fallback: T) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);

    if (!rawValue) {
      return fallback;
    }

    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function writeStorageValue(key: string, value: unknown) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // No bloquear el flujo si el navegador restringe almacenamiento local.
  }
}

function readStoredPage(storageBaseKey: string) {
  const storedPage = readStorageValue<string | null>(`${storageBaseKey}-page`, null);

  if (storedPage && PAGES.includes(storedPage as PageKey)) {
    return storedPage as PageKey;
  }

  return 'basic' as const;
}

function getCreateDefaultValues(): WorkspaceFormValues {
  return {
    alloy: '',
    buhler: '',
    comments: '',
    considerations: {},
    costs: {},
    cust: '',
    dtq: '',
    elab: '',
    gates: '',
    hydr_slides: '',
    mech_slides: '',
    num_cav: '',
    num_tools: '',
    part_dim: '',
    part_name: '',
    part_number: '',
    part_tech: '',
    parts_stroke: '',
    pnum: '',
    ppy: '',
    prlf: '',
    projected: '',
    rfq_name: '',
    sk_part: '',
    surface: '',
    three_plate: '',
    tt: '',
    volume: '',
    wall_max: '',
    wall_min: '',
    weight: '',
  };
}

function getEditDefaultValues(rfqId?: string): WorkspaceFormValues {
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
    costs: {
      accessories: {
        acc_jet: { notes: 'Set principal', price: '4200', unit: '1', weeks: '2' },
        acc_parker: { notes: 'Incluye Square D', price: '7800', unit: '2', weeks: '4' },
      },
      materials: {
        mat_cav: { notes: 'Acero H13', price: '13000', unit: '2', weeks: '6' },
      },
      sampling: {
        samp_parts: { notes: '50 piezas funcionales', price: '45', unit: '50', weeks: '1' },
      },
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
    projected: '336',
    rfq_name: 'Proyecto soporte puerta',
    sk_part: 'Inserto lateral H13 (Set de seguridad) - 2 pzas.\nCavidad principal de reemplazo (H13 forjado) - 1 pza.',
    surface: '522',
    three_plate: '0',
    tt: 'PRODUCTION',
    volume: '418',
    wall_max: '4.2',
    wall_min: '2.6',
    weight: '1280',
  };
}

function getDefaultValues(mode: RfqWorkspaceMode, rfqId?: string) {
  return mode === 'edit' ? getEditDefaultValues(rfqId) : getCreateDefaultValues();
}

function mergeFormValues(baseValues: WorkspaceFormValues, storedValues: Partial<WorkspaceFormValues>) {
  return {
    ...baseValues,
    ...storedValues,
    considerations: {
      ...baseValues.considerations,
      ...(storedValues.considerations ?? {}),
    },
    costs: {
      ...baseValues.costs,
      ...(storedValues.costs ?? {}),
    },
  };
}

function loadInitialValues(mode: RfqWorkspaceMode, rfqId?: string) {
  const storageBaseKey = getStorageBaseKey(mode, rfqId);
  const baseValues = getDefaultValues(mode, rfqId);
  const storedValues = readStorageValue<Partial<WorkspaceFormValues>>(`${storageBaseKey}-draft`, {});

  return mergeFormValues(baseValues, storedValues);
}

function getInitialFeedback(mode: RfqWorkspaceMode, rfqId?: string) {
  if (mode === 'edit') {
    return {
      text: `Estas ajustando ${(rfqId ?? 'RFQ-021').toUpperCase()} con el nuevo workspace multipantalla.`,
      tone: 'neutral' as const,
    };
  }

  return {
    text: 'Completa las secciones del sidebar y envia la RFQ cuando ya no tengas campos obligatorios pendientes.',
    tone: 'neutral' as const,
  };
}

function getPageErrorMap(errors: FieldErrors<WorkspaceFormValues>) {
  return {
    basic: Boolean(errors.rfq_name),
    geometry: Boolean(errors.part_name || errors.part_number),
  } satisfies Partial<Record<PageKey, boolean>>;
}

function getCompletedMap(values: WorkspaceFormValues) {
  return {
    basic: values.rfq_name.trim().length > 0,
    geometry: values.part_name.trim().length > 0 && values.part_number.trim().length > 0,
  } satisfies Partial<Record<PageKey, boolean>>;
}

function getFeedbackClasses(tone: FeedbackTone) {
  if (tone === 'success') {
    return 'border-[rgba(141,198,63,0.24)] bg-[rgba(141,198,63,0.12)] text-[var(--bocar-blue-100)]';
  }

  if (tone === 'error') {
    return 'border-[rgba(170,0,15,0.22)] bg-[rgba(170,0,15,0.08)] text-[var(--bocar-error)]';
  }

  return 'border-[rgba(31,58,97,0.16)] bg-[rgba(31,58,97,0.05)] text-[var(--bocar-blue-90)]';
}

function fieldPath(path: string) {
  return path as FieldPath<WorkspaceFormValues>;
}

function BackArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <path d="M10.5 3.5L6 8L10.5 12.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M6.5 8H13.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function FieldShell({
  children,
  error,
  hint,
  label,
  required = false,
  span = 1,
}: {
  children: ReactNode;
  error?: string;
  hint?: string;
  label: string;
  required?: boolean;
  span?: 1 | 2;
}) {
  return (
    <div className={span === 2 ? 'md:col-span-2' : undefined}>
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-70)]">
        {label}
        {required ? <span className="ml-1 text-[var(--bocar-error)]">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-2 m-0 text-[12px] leading-[1.45] text-[var(--bocar-error)]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-2 m-0 text-[12px] leading-[1.45] text-[var(--bocar-blue-50)]">{hint}</p>
      ) : null}
    </div>
  );
}

function inputBaseClasses(hasError: boolean) {
  return [
    'w-full rounded-[10px] border bg-white px-3.5 py-2.5 text-[14px] text-[var(--bocar-text)] outline-none transition placeholder:text-[var(--bocar-blue-30)]',
    hasError
      ? 'border-[rgba(170,0,15,0.34)] bg-[#fff8f8] focus:border-[var(--bocar-error)] focus:shadow-[0_0_0_3px_rgba(170,0,15,0.08)]'
      : 'border-[rgba(217,222,229,0.92)] focus:border-[var(--bocar-blue-70)] focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)]',
  ].join(' ');
}

function TextField({
  hint,
  label,
  name,
  placeholder,
  required = false,
  span = 1,
  type = 'text',
}: {
  hint?: string;
  label: string;
  name: FieldPath<WorkspaceFormValues>;
  placeholder?: string;
  required?: boolean;
  span?: 1 | 2;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
}) {
  const {
    formState,
    getFieldState,
    register,
  } = useFormContext<WorkspaceFormValues>();
  const { error } = getFieldState(name, formState);

  return (
    <FieldShell error={error?.message} hint={hint} label={label} required={required} span={span}>
      <input
        aria-invalid={Boolean(error)}
        className={inputBaseClasses(Boolean(error))}
        placeholder={placeholder}
        type={type}
        {...register(name)}
      />
    </FieldShell>
  );
}

function TextAreaField({
  hint,
  label,
  name,
  placeholder,
  rows = 5,
  span = 2,
}: {
  hint?: string;
  label: string;
  name: FieldPath<WorkspaceFormValues>;
  placeholder?: string;
  rows?: TextareaHTMLAttributes<HTMLTextAreaElement>['rows'];
  span?: 1 | 2;
}) {
  const {
    formState,
    getFieldState,
    register,
  } = useFormContext<WorkspaceFormValues>();
  const { error } = getFieldState(name, formState);

  return (
    <FieldShell error={error?.message} hint={hint} label={label} span={span}>
      <textarea
        aria-invalid={Boolean(error)}
        className={`${inputBaseClasses(Boolean(error))} min-h-[112px] resize-y`}
        placeholder={placeholder}
        rows={rows}
        {...register(name)}
      />
    </FieldShell>
  );
}

function SectionCard({
  children,
  subtitle,
  title,
}: {
  children: ReactNode;
  subtitle?: string;
  title: string;
}) {
  return (
    <section className="rounded-[18px] border border-[rgba(217,222,229,0.92)] bg-white shadow-[0_16px_36px_rgba(0,46,93,0.05)]">
      <div className="border-b border-[rgba(217,222,229,0.86)] px-5 py-5 sm:px-6">
        <h2 className="m-0 text-[16px] font-semibold tracking-[0.01em] text-[var(--bocar-text)]">{title}</h2>
        {subtitle ? <p className="mt-2 m-0 text-[13px] leading-[1.55] text-[var(--bocar-blue-50)]">{subtitle}</p> : null}
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2">{children}</div>;
}

function ChevronDownIcon({ rotated = false }: { rotated?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-3 w-3 shrink-0 transition-transform duration-200 ${rotated ? '' : '-rotate-90'}`}
      fill="none"
      viewBox="0 0 12 12"
    >
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function YesNoToggle({ name }: { name: FieldPath<WorkspaceFormValues> }) {
  const { control, setValue } = useFormContext<WorkspaceFormValues>();
  const rawValue = useWatch({ control, name });
  const value = typeof rawValue === 'string' ? rawValue : '';

  return (
    <div className="flex gap-1.5">
      <button
        className={[
          'rounded-lg border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition',
          value === 'yes'
            ? 'border-[var(--bocar-blue-100)] bg-[var(--bocar-blue-100)] text-white'
            : 'border-[#d9dee5] bg-white text-[var(--bocar-blue-70)] hover:border-[var(--bocar-blue-70)] hover:text-[var(--bocar-blue-100)]',
        ].join(' ')}
        type="button"
        onClick={() => setValue(name, value === 'yes' ? '' : 'yes', { shouldDirty: true })}
      >
        YES
      </button>
      <button
        className={[
          'rounded-lg border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition',
          value === 'no'
            ? 'border-transparent bg-[rgba(170,0,15,0.85)] text-white'
            : 'border-[#d9dee5] bg-white text-[var(--bocar-blue-70)] hover:border-[var(--bocar-blue-70)] hover:text-[var(--bocar-blue-100)]',
        ].join(' ')}
        type="button"
        onClick={() => setValue(name, value === 'no' ? '' : 'no', { shouldDirty: true })}
      >
        NO
      </button>
    </div>
  );
}

function WorkspaceSidebar({
  completed,
  current,
  onSelect,
  pageErrors,
}: {
  completed: Partial<Record<PageKey, boolean>>;
  current: PageKey;
  onSelect: (page: PageKey) => void;
  pageErrors: Partial<Record<PageKey, boolean>>;
}) {
  const [expanded, setExpanded] = useState<Record<NavGroup['key'], boolean>>(() => ({
    COST_BREAKDOWN: true,
    MOLD: true,
  }));

  return (
    <aside className="hidden lg:flex lg:w-[232px] lg:shrink-0 lg:flex-col lg:border-r lg:border-[#d9dee5] lg:bg-white">
      <nav className="flex-1 overflow-y-auto border-t border-[#d9dee5] px-2 pb-8 pt-2">
        {NAV_GROUPS.map((group) => {
          const isGroupOpen = expanded[group.key];

          return (
            <div key={group.key} className="mb-2">
              <button
                aria-expanded={isGroupOpen}
                className="flex w-full items-center justify-between px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.02em] text-[var(--bocar-text)] transition hover:text-[var(--bocar-blue-100)]"
                type="button"
                onClick={() => setExpanded((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
              >
                <span>{group.label}</span>
                <ChevronDownIcon rotated={isGroupOpen} />
              </button>

              {isGroupOpen ? (
                <div className="flex flex-col">
                  {group.items.map((item) => {
                    const isActive = current === item.key;
                    const hasError = Boolean(pageErrors[item.key]);
                    const isDone = Boolean(completed[item.key]);

                    return (
                      <button
                        key={item.key}
                        className={[
                          'flex items-center justify-between px-6 py-2 text-left text-[12px] font-medium tracking-[0.04em] transition',
                          isActive
                            ? 'bg-[rgba(0,46,93,0.08)] text-[var(--bocar-blue-100)]'
                            : 'text-[var(--bocar-blue-50)] hover:bg-[rgba(0,46,93,0.04)] hover:text-[var(--bocar-blue-100)]',
                        ].join(' ')}
                        type="button"
                        onClick={() => onSelect(item.key)}
                      >
                        <span>{item.label}</span>
                        {hasError ? (
                          <span className="h-2 w-2 rounded-full bg-[var(--bocar-error)]" />
                        ) : isDone ? (
                          <span className="text-[12px] font-semibold text-[var(--bocar-done)]">●</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function WorkspaceSidebarMobile({
  current,
  onSelect,
}: {
  current: PageKey;
  onSelect: (page: PageKey) => void;
}) {
  const allItems = NAV_GROUPS.flatMap((group) => group.items);

  return (
    <div className="border-b border-[#d9dee5] bg-white px-4 py-3 lg:hidden">
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bocar-blue-50)]">
        Sección
      </label>
      <select
        className="w-full rounded-[10px] border border-[#d9dee5] bg-white px-3 py-2 text-[13px] font-medium text-[var(--bocar-text)] outline-none focus:border-[var(--bocar-blue-70)]"
        value={current}
        onChange={(event) => onSelect(event.target.value as PageKey)}
      >
        {NAV_GROUPS.map((group) => (
          <optgroup key={group.key} label={group.label}>
            {group.items.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </optgroup>
        ))}
        {!allItems.some((item) => item.key === current) ? (
          <option value={current}>{PAGE_META[current]?.navLabel ?? current}</option>
        ) : null}
      </select>
    </div>
  );
}

// ─── Section 1: RFQ ───────────────────────────────────────────────────────────

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

// ─── Section 2: Tool Engineering ──────────────────────────────────────────────

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

// ─── Section 3: DCM (DESC + SPECS) ────────────────────────────────────────────

function ConsiderationPage({ group }: { group: ConsiderationGroup }) {
  const { register } = useFormContext<WorkspaceFormValues>();

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
          <div key={item.id} className="grid gap-3 py-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)] md:items-center md:gap-5">
            <div className="text-[13px] font-medium leading-[1.5] text-[var(--bocar-text)]">{item.label}</div>
            <input
              className={inputBaseClasses(false)}
              placeholder={item.noteExample ?? 'Especificaciones / notas'}
              {...register(fieldPath(`considerations.${item.id}.notes`))}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Sections 4 / 5 / 6: DESC + YES/NO + NOTES ───────────────────────────────

function ConsiderationTogglePage({ group }: { group: ConsiderationGroup }) {
  const { register } = useFormContext<WorkspaceFormValues>();

  return (
    <SectionCard subtitle={group.subtitle} title={group.title}>
      <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,0.55fr)_minmax(0,1.85fr)] gap-5 border-b border-[rgba(217,222,229,0.86)] pb-3 md:grid">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
          Entregable / requisito
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
          Aplica
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
          Especificaciones
        </div>
      </div>

      <div className="divide-y divide-[rgba(236,240,245,0.9)]">
        {group.items.map((item) => (
          <div
            key={item.id}
            className="grid gap-3 py-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.55fr)_minmax(0,1.85fr)] md:items-center md:gap-5"
          >
            <div className="text-[13px] font-medium leading-[1.5] text-[var(--bocar-text)]">{item.label}</div>
            <YesNoToggle name={fieldPath(`considerations.${item.id}.checked`)} />
            <input
              className={inputBaseClasses(false)}
              placeholder={item.noteExample ?? 'Especificaciones / notas'}
              {...register(fieldPath(`considerations.${item.id}.notes`))}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Section 7: SK PART ───────────────────────────────────────────────────────

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

// ─── Section 8: Part Geometry (single column) ─────────────────────────────────

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

// ─── Section 9: Tool Specification (single column) ────────────────────────────

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

// ─── Section 10: Comments ─────────────────────────────────────────────────────

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

// ─── Cost breakdown pages ─────────────────────────────────────────────────────

function CostTable({
  rows,
  sectionKey,
  unitHeader,
}: {
  rows: readonly CostRow[];
  sectionKey: CostPageKey;
  unitHeader: 'hours' | 'unit';
}) {
  const {
    control,
    register,
  } = useFormContext<WorkspaceFormValues>();
  const values = (useWatch({
    control,
    name: fieldPath(`costs.${sectionKey}`),
  }) as Record<string, { notes?: string; price?: string; unit?: string; weeks?: string }> | undefined) ?? {};

  const totalAmount = rows.reduce((accumulator, row) => {
    const currentRow = values[row.id];
    return accumulator + Number(currentRow?.unit ?? 0) * Number(currentRow?.price ?? 0);
  }, 0);

  const maxWeeks = rows.reduce((accumulator, row) => {
    const currentRow = values[row.id];
    return Math.max(accumulator, Number(currentRow?.weeks ?? 0));
  }, 0);

  return (
    <div className="overflow-x-auto rounded-[14px] border border-[rgba(217,222,229,0.92)]">
      <table className="min-w-[820px] w-full border-collapse">
        <thead>
          <tr className="bg-[rgba(0,46,93,0.05)] text-left">
            <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-70)]">Concepto</th>
            <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-70)]">
              {unitHeader === 'hours' ? 'h' : 'Unidad'}
            </th>
            <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-70)]">
              {unitHeader === 'hours' ? 'Precio/hora' : 'Precio/Unidad'}
            </th>
            <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-70)]">Total</th>
            <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-70)]">Semanas</th>
            <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-70)]">Notas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const currentRow = values[row.id] ?? {};
            const total = Number(currentRow.unit ?? 0) * Number(currentRow.price ?? 0);

            return (
              <tr key={row.id} className="border-t border-[rgba(236,240,245,0.95)]">
                <td className="px-3 py-3 text-[13px] font-medium text-[var(--bocar-text)]">{row.label}</td>
                <td className="p-3">
                  <input className={inputBaseClasses(false)} type="number" {...register(fieldPath(`costs.${sectionKey}.${row.id}.unit`))} />
                </td>
                <td className="p-3">
                  <input className={inputBaseClasses(false)} type="number" {...register(fieldPath(`costs.${sectionKey}.${row.id}.price`))} />
                </td>
                <td className="px-3 py-3 text-[13px] font-medium tabular-nums text-[var(--bocar-blue-100)]">{total.toFixed(2)}</td>
                <td className="p-3">
                  <input className={inputBaseClasses(false)} type="number" {...register(fieldPath(`costs.${sectionKey}.${row.id}.weeks`))} />
                </td>
                <td className="p-3">
                  <input className={inputBaseClasses(false)} {...register(fieldPath(`costs.${sectionKey}.${row.id}.notes`))} />
                </td>
              </tr>
            );
          })}
          <tr className="border-t border-[rgba(217,222,229,0.92)] bg-[rgba(0,46,93,0.05)]">
            <td className="px-3 py-3 text-[13px] font-semibold text-[var(--bocar-blue-100)]">S Total</td>
            <td className="px-3 py-3" />
            <td className="px-3 py-3" />
            <td className="px-3 py-3 text-[13px] font-semibold tabular-nums text-[var(--bocar-blue-100)]">{totalAmount.toFixed(2)}</td>
            <td className="px-3 py-3 text-[13px] font-semibold tabular-nums text-[var(--bocar-blue-100)]">{maxWeeks || ''}</td>
            <td className="px-3 py-3" />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CostPage({ section }: { section: CostSection }) {
  return (
    <SectionCard subtitle={section.subtitle} title={section.title}>
      {section.subsections ? (
        <div className="space-y-6">
          {section.subsections.map((subsection) => (
            <div key={subsection.title}>
              <p className="m-0 mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bocar-blue-100)]">
                {subsection.title}
              </p>
              <CostTable rows={subsection.rows} sectionKey={section.key} unitHeader={subsection.unitHeader} />
            </div>
          ))}
        </div>
      ) : (
        <CostTable rows={section.rows ?? []} sectionKey={section.key} unitHeader={section.unitHeader ?? 'unit'} />
      )}
    </SectionCard>
  );
}

// ─── Page router ──────────────────────────────────────────────────────────────

function renderPage(page: PageKey) {
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

  if (isCostPage(page)) {
    const section = COST_SECTIONS.find((s) => s.key === page);
    return section ? <CostPage section={section} /> : null;
  }

  return null;
}

// ─── Root component ───────────────────────────────────────────────────────────

export function RfqWorkspace({ mode, onBack, rfqId }: RfqWorkspaceProps) {
  const storageBaseKey = getStorageBaseKey(mode, rfqId);
  const [currentPage, setCurrentPage] = useState<PageKey>(() => readStoredPage(storageBaseKey));
  const [feedback, setFeedback] = useState<{ text: string; tone: FeedbackTone }>(() => getInitialFeedback(mode, rfqId));
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const form = useForm<WorkspaceFormValues>({
    defaultValues: loadInitialValues(mode, rfqId),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(workspaceSchema),
  });

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setFocus,
    trigger,
  } = form;

  const values = useWatch({ control });

  useEffect(() => {
    const nextValues = loadInitialValues(mode, rfqId);
    reset(nextValues);
    setCurrentPage(readStoredPage(getStorageBaseKey(mode, rfqId)));
    setFeedback(getInitialFeedback(mode, rfqId));
    setAttemptedSubmit(false);
  }, [mode, reset, rfqId]);

  useEffect(() => {
    writeStorageValue(`${storageBaseKey}-draft`, values);
  }, [storageBaseKey, values]);

  useEffect(() => {
    writeStorageValue(`${storageBaseKey}-page`, currentPage);
  }, [currentPage, storageBaseKey]);

  const currentIndex = PAGES.indexOf(currentPage);
  const completed = useMemo(() => getCompletedMap(values as WorkspaceFormValues), [values]);
  const pageErrors = useMemo(() => getPageErrorMap(errors), [errors]);
  const meta = PAGE_META[currentPage];
  const headerTitle = mode === 'edit' ? 'EDITAR RFQ' : 'CREAR RFQ';

  async function goNext() {
    const nextPage = PAGES[currentIndex + 1];

    if (!nextPage) {
      return;
    }

    const requiredFields = REQUIRED_FIELDS_BY_PAGE[currentPage] ?? [];

    if (requiredFields.length > 0) {
      const isCurrentPageValid = await trigger(requiredFields, { shouldFocus: true });

      if (!isCurrentPageValid) {
        setAttemptedSubmit(true);
        setFeedback({
          text: 'Corrige los campos obligatorios marcados antes de avanzar al siguiente bloque.',
          tone: 'error',
        });
        return;
      }
    }

    setCurrentPage(nextPage);
    setFeedback({
      text: `Continua con ${PAGE_META[nextPage].navLabel}. Tu progreso queda guardado como borrador local.`,
      tone: 'neutral',
    });
  }

  function goPrevious() {
    const previousPage = PAGES[currentIndex - 1];

    if (!previousPage) {
      return;
    }

    setCurrentPage(previousPage);
  }

  function handleSaveDraft() {
    writeStorageValue(`${storageBaseKey}-draft`, values);
    setFeedback({
      text:
        mode === 'edit'
          ? `${(rfqId ?? 'RFQ-021').toUpperCase()} quedo guardada como borrador editable.`
          : 'Borrador guardado. Puedes retomar el workspace exactamente donde lo dejaste.',
      tone: 'success',
    });
  }

  async function handleValidSubmit() {
    setAttemptedSubmit(true);
    writeStorageValue(`${storageBaseKey}-draft`, values);
    setFeedback({
      text:
        mode === 'edit'
          ? `${(rfqId ?? 'RFQ-021').toUpperCase()} quedo actualizada y lista para continuar el flujo.`
          : 'La RFQ quedo capturada en el nuevo flujo y esta lista para revision interna.',
      tone: 'success',
    });
  }

  const handleInvalidSubmit: SubmitErrorHandler<WorkspaceFormValues> = (fieldErrors) => {
    setAttemptedSubmit(true);
    setFeedback({
      text: 'Revisa los campos marcados. El sidebar te indica en que bloque sigue habiendo informacion obligatoria pendiente.',
      tone: 'error',
    });

    if (fieldErrors.rfq_name) {
      setCurrentPage('basic');
      setFocus('rfq_name');
      return;
    }

    if (fieldErrors.part_name || fieldErrors.part_number) {
      setCurrentPage('geometry');
      setFocus(fieldErrors.part_name ? 'part_name' : 'part_number');
    }
  };

  const progressPercent = ((currentIndex + 1) / PAGES.length) * 100;
  const showFeedback = feedback.tone !== 'neutral' || attemptedSubmit;

  return (
    <FormProvider {...form}>
      <div className="flex min-h-screen flex-col bg-[#f5f7fa]">
        <header className="flex h-[72px] items-center justify-between border-b border-[#d9dee5] bg-white px-6 lg:px-10">
          <div className="flex items-center gap-4 lg:gap-5">
            <img alt="Bocar" className="h-9 w-auto lg:h-10" src={logoBocar} />
            <span aria-hidden="true" className="hidden h-8 w-px bg-[#d9dee5] lg:block" />
            <span className="text-[15px] font-medium text-[var(--bocar-text)]">Industrializacion</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bocar-blue-100)] text-[14px] font-semibold text-white">
              {dashboardUser.initials}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="m-0 truncate text-[14px] font-semibold text-[var(--bocar-text)]">{dashboardUser.name}</p>
              <p className="mt-0.5 truncate text-[12px] text-[var(--bocar-blue-70)]">{dashboardUser.department}</p>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <WorkspaceSidebar
            completed={completed}
            current={currentPage}
            onSelect={setCurrentPage}
            pageErrors={attemptedSubmit ? pageErrors : {}}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <WorkspaceSidebarMobile current={currentPage} onSelect={setCurrentPage} />

            <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-12 lg:py-10">
              <div className="mx-auto w-full max-w-[960px]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="m-0 text-[28px] font-bold tracking-[-0.02em] text-[var(--bocar-text)] sm:text-[30px]">
                      {headerTitle}
                    </h1>
                    <p className="mt-2 mb-0 text-[13px] font-medium text-[var(--bocar-blue-50)]">
                      Página {currentIndex + 1} de {PAGES.length} . {meta.navLabel}
                    </p>
                  </div>

                  <button
                    className="inline-flex shrink-0 items-center gap-2 py-2 text-[13px] font-semibold text-[var(--bocar-blue-100)] transition hover:text-[var(--bocar-blue-90)]"
                    type="button"
                    onClick={onBack}
                  >
                    <BackArrowIcon />
                    Regresar
                  </button>
                </div>

                <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#e5e9ef]">
                  <div
                    className="h-full rounded-full bg-[var(--bocar-blue-100)] transition-[width] duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {showFeedback ? (
                  <div
                    className={`mt-5 rounded-[12px] border px-4 py-3 text-[13px] leading-[1.55] ${getFeedbackClasses(feedback.tone)}`}
                    role={feedback.tone === 'error' ? 'alert' : 'status'}
                  >
                    {feedback.text}
                  </div>
                ) : null}

                <form
                  className="mt-8"
                  noValidate
                  onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
                >
                  {renderPage(currentPage)}

                  <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {currentIndex === 0 ? (
                      <div className="hidden sm:block" />
                    ) : (
                      <button
                        className="inline-flex items-center justify-center rounded-[10px] border border-[#d9dee5] bg-white px-4 py-2.5 text-[13px] font-semibold text-[var(--bocar-blue-70)] transition hover:border-[var(--bocar-blue-70)] hover:text-[var(--bocar-blue-100)]"
                        type="button"
                        onClick={goPrevious}
                      >
                        ← Anterior
                      </button>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        className="inline-flex h-11 min-w-[180px] items-center justify-center rounded-[10px] border border-[#d9dee5] bg-white px-5 text-[13px] font-semibold text-[var(--bocar-blue-100)] transition hover:border-[var(--bocar-blue-70)] hover:bg-[rgba(245,247,250,0.8)] disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={isSubmitting}
                        type="button"
                        onClick={handleSaveDraft}
                      >
                        Guardar Borrador
                      </button>

                      {currentIndex === PAGES.length - 1 ? (
                        <Button
                          className="h-11 min-w-[180px] rounded-[10px] bg-[var(--bocar-blue-100)] px-5 text-[13px] font-semibold text-white hover:bg-[#0b3b6b] disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={isSubmitting}
                          type="submit"
                        >
                          {isSubmitting ? 'Enviando...' : mode === 'edit' ? 'Actualizar RFQ' : 'Enviar RFQ'}
                        </Button>
                      ) : (
                        <Button
                          className="h-11 min-w-[180px] rounded-[10px] bg-[var(--bocar-blue-100)] px-5 text-[13px] font-semibold text-white hover:bg-[#0b3b6b]"
                          type="button"
                          onClick={() => {
                            void goNext();
                          }}
                        >
                          Siguiente →
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </main>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
