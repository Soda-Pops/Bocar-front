import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { FieldPath } from 'react-hook-form';
import { z } from 'zod';

import { FileUploadField } from '@shared/components/ui/FileUploadField';
import { MultiFileUploadField } from '@shared/components/ui/MultiFileUploadField';

import {
  ConsiderationTogglePage,
  FormGrid,
  SectionCard,
  TextField,
  inputBaseClasses,
  type ConsiderationGroupConfig,
} from '../shell/primitives';
import { buildPageErrorMap, goToFirstRequiredError } from '../shell/requiredFields';
import type { NavGroup, PageMeta, RfqWorkspaceDefinition } from '../shell/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const TOGGLE_REQUIRED_CONSIDERATIONS = new Set([
  'd_3d', 'flan', 'run_des', 'run_over', 'man_prop', 'ldi', 'add_mach', 'sketch', 'drw_2d', 'drw_3d',
  'eyeb', 'ow_conn', 'stm', 'cmm_rep', 'gom_rep', 'h_val', 'dim_corr', 'sp_pt',
  'comp_d', 'subseq_d', 'repl_h13', 'sp_ei', 'ficf', 'hcls', 'fr_refur',
]);

const moldSchema = z
  .object({
    alloy: z.string(),
    buhler: z.string(),
    comments: z.string(),
    considerations: z.record(
      z.string(),
      z.object({ checked: z.string().optional(), notes: z.string() })
    ),
    cust: z.string(),
    dtq: z.string(),
    elab: z.string(),
    gates: z.string(),
    hydr_slides: z.string(),
    mech_slides: z.string(),
    num_cav: z.string(),
    num_tools: z.string(),
    part_dim: z.string(),
    part_name: z.string().trim().min(1, 'Enter the part name before continuing.'),
    part_number: z.string().trim().min(1, 'Enter the part number before submitting the RFQ.'),
    part_tech: z.string(),
    parts_stroke: z.string(),
    pnum: z.string(),
    ppy: z.string(),
    prlf: z.string(),
    projected: z.string(),
    rfq_name: z.string().trim().min(1, 'Enter the RFQ name to continue.'),
    sk_part: z.object({ name: z.string(), size: z.number(), type: z.string(), file: z.instanceof(File).optional() }).nullable(),
    files: z.array(z.object({ name: z.string(), size: z.number(), type: z.string(), file: z.instanceof(File).optional(), id: z.number().optional(), url: z.string().optional(), uploadedAt: z.string().optional() })),
    surface: z.string(),
    three_plate: z.string(),
    tt: z.string(),
    volume: z.string(),
    wall_max: z.string(),
    wall_min: z.string(),
    weight: z.string(),
  })
  .superRefine((values, ctx) => {
    // Iterate the required set (not the entries present in the form): the
    // validation result must be identical no matter which pages were visited.
    // Visiting a page registers its inputs and creates `considerations`
    // entries — iterating entries made fields required as a side effect of
    // navigation, with errors invisible in the sidebar.
    TOGGLE_REQUIRED_CONSIDERATIONS.forEach((key) => {
      if (!values.considerations[key]?.checked?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select whether it applies.',
          path: ['considerations', key, 'checked'],
        });
      }
    });
  });

export type MoldFormValues = z.infer<typeof moldSchema>;

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
  | 'comments'
  | 'files';

const PAGES: readonly MoldPageKey[] = [
  'basic', 'tool_eng', 'dcm', 'diritpotd', 'other_cons', 'ot_inf', 'spareparts',
  'geometry', 'tool_spec', 'comments', 'files',
];

const PAGE_META: Record<MoldPageKey, PageMeta> = {
  basic: { navLabel: 'RFQ', subtitle: 'Main requirement data that initiates the workflow.', title: '1. RFQ' },
  comments: { navLabel: 'COMMENTS', subtitle: 'Final notes and additional supplier context.', title: '10. Comments' },
  dcm: { navLabel: 'DCM', subtitle: 'Mold concept deliverables and requirements.', title: '3. DCM' },
  diritpotd: { navLabel: 'DIRITPOTD', subtitle: 'Design, engineering, and technical documentation.', title: '4. DIRITPOTD' },
  geometry: { navLabel: 'PART GEOMETRY', subtitle: 'Component dimensions and properties.', title: '8. Part Geometry' },
  other_cons: { navLabel: 'OTHER', subtitle: 'Other quotation deliverables.', title: '5. Other' },
  ot_inf: { navLabel: 'OT INF', subtitle: 'Additional documentation required from the supplier.', title: '6. OT INF' },
  spareparts: { navLabel: 'SK PART', subtitle: 'Attach the complete SK part sketch of the component.', title: '7. SK PART' },
  tool_eng: { navLabel: 'TOOL ENG.', subtitle: 'Tooling configuration and parameters.', title: '2. Tool Engineering' },
  tool_spec: { navLabel: 'TOOL SPECIFICATION', subtitle: 'Detailed tooling dimensions and configuration.', title: '9. Tool Specification' },
  files: { navLabel: 'UPLOAD FILES', subtitle: 'Attach blueprints, quotations and part specifications.', title: '11. Upload Files' },
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
  {
    key: 'FILES',
    label: 'FILES',
    items: [
      { key: 'files', label: 'UPLOAD FILES' },
    ],
  },
];

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
      { id: 'third_p_supp', label: '3thPSupp', noteExample: 'For structural parts with AlSi10 alloy, consider 3D forged steel.' },
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
      { id: 'man_prop', label: 'ManProp', noteExample: 'For structural parts with AlSi10 alloy, 3D forged steel required.' },
      { id: 'ldi', label: 'Ldi' },
      { id: 'add_mach', label: 'Add of mach st.' },
      { id: 'sketch', label: 'Sketch d conc, inc s dim' },
      { id: 'drw_2d', label: '2D Dr DesPDF and CNFl', noteExample: 'Include components, cavities, inserts, core pins, ejector pins and critical spare parts.' },
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
      { id: 'cmm_rep', label: 'CMM dim rep cal', noteExample: 'Position tolerance 10% of the product.' },
      { id: 'gom_rep', label: 'GOM rep. Ass cav, sl, in, cpln', noteExample: 'Aluminum surface tolerance 10% of the product.' },
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
      { id: 'repl_h13', label: 'Set of repl. H-13', noteExample: 'Replacement cavities.' },
      { id: 'sp_ei', label: 'Sp. set of E.I.' },
      { id: 'ficf', label: 'FICF' },
      { id: 'hcls', label: 'HCLS' },
      { id: 'fr_refur', label: 'Fr Refur.' },
    ],
  },
];

// ─── Required fields (single source of truth) ─────────────────────────────────

/** Paths of the yes/no toggles required on a consideration page, derived from
 * the group config + TOGGLE_REQUIRED_CONSIDERATIONS so both stay in sync. */
function requiredTogglePaths(page: MoldPageKey): readonly FieldPath<MoldFormValues>[] {
  const group = CONSIDERATION_GROUPS.find((g) => g.page === page);
  return (group?.items ?? [])
    .filter((item) => TOGGLE_REQUIRED_CONSIDERATIONS.has(item.id))
    .map((item) => `considerations.${item.id}.checked` as FieldPath<MoldFormValues>);
}

const REQUIRED_FIELDS_BY_PAGE: Partial<Record<MoldPageKey, readonly FieldPath<MoldFormValues>[]>> = {
  basic: ['rfq_name'],
  geometry: ['part_name', 'part_number'],
  diritpotd: requiredTogglePaths('diritpotd'),
  other_cons: requiredTogglePaths('other_cons'),
  ot_inf: requiredTogglePaths('ot_inf'),
};

// ─── Default values ───────────────────────────────────────────────────────────

function getCreateDefaultValues(): MoldFormValues {
  return {
    alloy: '', buhler: '', comments: '', considerations: {}, cust: '', dtq: '', elab: '', gates: '',
    hydr_slides: '', mech_slides: '', num_cav: '', num_tools: '', part_dim: '', part_name: '',
    part_number: '', part_tech: '', parts_stroke: '', pnum: '', ppy: '', prlf: '', projected: '',
    rfq_name: '', sk_part: null, files: [], surface: '', three_plate: '', tt: '', volume: '', wall_max: '',
    wall_min: '', weight: '',
  };
}

function getEditDefaultValues(rfqId?: string): MoldFormValues {
  return {
    alloy: 'AlSi10MnMg',
    buhler: '3400',
    comments: 'Validate the dimensional package with the supplier before final release.',
    considerations: {
      cmm_rep: { checked: 'yes', notes: 'Position tolerance 10% of the product.' },
      comp_d: { checked: 'yes', notes: '' },
      d_3d: { checked: 'yes', notes: 'Preliminary model available in M1 review.' },
      drw_2d: { checked: 'yes', notes: 'PDF + CNF with critical components required.' },
      man_prop: { checked: 'yes', notes: 'Quote proposal with 3D forged steel.' },
      smach: { checked: '', notes: 'Buhler 3400T confirmed for production run.' },
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
    rfq_name: 'Door support project',
    sk_part: null,
    files: [],
    surface: '522',
    three_plate: '0',
    tt: 'PRODUCTION',
    volume: '418',
    wall_max: '4.2',
    wall_min: '2.6',
    weight: '1280',
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
  return buildPageErrorMap(REQUIRED_FIELDS_BY_PAGE, errors);
}

// ─── Page components ──────────────────────────────────────────────────────────

/** A spec counts as "filled" when it is non-empty and not numerically zero. */
function isNonZeroSpec(value: string | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  const n = Number(trimmed);
  return Number.isNaN(n) ? true : n !== 0;
}

const EXCLUSIVE_NOTE =
  'VacV (Vacuum Valves) and ChillBl (Chill Blocks) are mutually exclusive: only one of them can be captured per RFQ. Filling one with a value other than 0 locks the other at 0 until it is cleared back to 0.';

/**
 * VacV (C27) and ChillBl (C28) are mutually exclusive: the first one filled
 * with a value ≠ 0 disables the other and forces it to 0. Clearing it back to
 * 0 re-enables the other.
 */
function useVacChillExclusion() {
  const { setValue } = useFormContext();
  const vacV = useWatch({ name: 'considerations.vac_v.notes' }) as string | undefined;
  const chillBl = useWatch({ name: 'considerations.chill_bl.notes' }) as string | undefined;

  const vacVFilled = isNonZeroSpec(vacV);
  const chillBlFilled = isNonZeroSpec(chillBl);

  // VacV wins ties (only one of the two should ever come filled from the RFQ).
  const chillBlDisabled = vacVFilled;
  const vacVDisabled = chillBlFilled && !vacVFilled;

  useEffect(() => {
    if (vacVFilled && isNonZeroSpec(chillBl)) {
      setValue('considerations.chill_bl.notes', '0', { shouldDirty: true });
    }
  }, [vacVFilled, chillBl, setValue]);

  useEffect(() => {
    if (chillBlFilled && !vacVFilled && isNonZeroSpec(vacV)) {
      setValue('considerations.vac_v.notes', '0', { shouldDirty: true });
    }
  }, [chillBlFilled, vacVFilled, vacV, setValue]);

  return { vacVDisabled, chillBlDisabled };
}

function ConsiderationPage({ group }: { group: MoldConsiderationGroup }) {
  const { register } = useFormContext();
  const { vacVDisabled, chillBlDisabled } = useVacChillExclusion();

  function isItemDisabled(id: string): boolean {
    if (id === 'vac_v') return vacVDisabled;
    if (id === 'chill_bl') return chillBlDisabled;
    return false;
  }

  const hasExclusivePair =
    group.items.some((item) => item.id === 'vac_v') &&
    group.items.some((item) => item.id === 'chill_bl');

  return (
    <SectionCard subtitle={group.subtitle} title={group.title}>
      {hasExclusivePair ? (
        <div className="mb-4 rounded-[10px] border border-[rgba(0,46,93,0.18)] bg-[rgba(0,46,93,0.05)] px-4 py-3 text-[12px] leading-[1.5] text-[var(--bocar-blue-70)]">
          {EXCLUSIVE_NOTE}
        </div>
      ) : null}
      <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)] gap-5 border-b border-[rgba(217,222,229,0.86)] pb-3 md:grid">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
          Deliverable / requirement
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
          Specifications
        </div>
      </div>
      <div className="divide-y divide-[rgba(236,240,245,0.9)]">
        {group.items.map((item) => {
          const disabled = isItemDisabled(item.id);
          return (
            <div
              key={item.id}
              className="grid gap-3 py-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)] md:items-center md:gap-5"
            >
              <div className="text-[13px] font-medium leading-[1.5] text-[var(--bocar-text)]">
                {item.label}
              </div>
              <input
                className={
                  disabled
                    ? 'w-full rounded-[10px] border border-[rgba(217,222,229,0.92)] bg-[#f5f7fa] px-3.5 py-2.5 text-[14px] text-[var(--bocar-blue-30)] outline-none cursor-not-allowed'
                    : inputBaseClasses(false)
                }
                disabled={disabled}
                placeholder={item.noteExample ?? 'Specifications / notes'}
                title={disabled ? 'Locked: the other exclusive field has a value other than 0.' : undefined}
                {...register(`considerations.${item.id}.notes`)}
              />
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function BasicPage() {
  return (
    <SectionCard subtitle={PAGE_META.basic.subtitle} title={PAGE_META.basic.title}>
      <FormGrid>
        <TextField
          hint="Display name for Purchasing, Industrialization, and internal tracking."
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
      <FileUploadField
        accept=".png,.jpg,.jpeg,.pdf,.dwg"
        maxSizeMb={10}
        name="sk_part"
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
  const { register } = useFormContext();
  return (
    <SectionCard subtitle={PAGE_META.comments.subtitle} title={PAGE_META.comments.title}>
      <textarea
        className={`${inputBaseClasses(false)} resize-y`}
        placeholder="Enter an additional comment"
        rows={6}
        {...register('comments')}
      />
    </SectionCard>
  );
}

function FilesPage({ readOnly }: { readOnly?: boolean }) {
  return (
    <SectionCard subtitle={PAGE_META.files.subtitle} title={PAGE_META.files.title}>
      <MultiFileUploadField
        accept=".ppt,.pptx,.stp,.pdf"
        acceptLabel="PPT, STP, PDF"
        maxSizeMb={25}
        name="files"
        readOnly={readOnly}
      />
    </SectionCard>
  );
}

function renderPage(page: string, readOnly?: boolean): ReactNode {
  if (page === 'basic') return <BasicPage />;
  if (page === 'tool_eng') return <ToolEngineeringPage />;
  if (page === 'spareparts') return <SparePartsPage />;
  if (page === 'geometry') return <GeometryPage />;
  if (page === 'tool_spec') return <ToolSpecificationPage />;
  if (page === 'comments') return <CommentsPage />;
  if (page === 'files') return <FilesPage readOnly={readOnly} />;

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
  resolver: zodResolver(moldSchema),
  getCreateDefaultValues,
  getEditDefaultValues,
  pages: PAGES,
  navGroups: NAV_GROUPS,
  pageMeta: PAGE_META,
  requiredFieldsByPage: REQUIRED_FIELDS_BY_PAGE,
  renderPage,
  getCompletedMap,
  getPageErrorMap,
  onInvalidSubmit: (fieldErrors, ctx) => {
    goToFirstRequiredError(PAGES, REQUIRED_FIELDS_BY_PAGE, fieldErrors, ctx);
  },
};
