import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';
import type { FieldPath } from 'react-hook-form';
import { z } from 'zod';

import { MultiFileUploadField } from '@shared/components/ui/MultiFileUploadField';

import {
  ConsiderationTogglePage,
  FormGrid,
  SectionCard,
  TextField,
  YesNoToggle,
  inputBaseClasses,
  type ConsiderationGroupConfig,
} from '../shell/primitives';
import { buildPageErrorMap, goToFirstRequiredError } from '../shell/requiredFields';
import type { NavGroup, PageMeta, RfqWorkspaceDefinition } from '../shell/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const TRIMMING_TOGGLE_REQUIRED = new Set([
  'design_3d', 'design_2d', 'punch_pins', 'manuf_proposals', 'latest_improvements', 'sketch_concept',
  'frame_refur', 'elec_wires', 'others', 'delivery_date',
  'ejector_fixed', 'trim_die_1', 'trim_die_2', 'spare_parts_set', 'hydraulic_cyl',
]);

const requiredText = (message = 'Complete this field before submitting the RFQ.') =>
  z.string().trim().min(1, message);

const fileSchema = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
  file: z.instanceof(File).optional(),
  id: z.number().optional(),
  url: z.string().optional(),
  uploadedAt: z.string().optional(),
});

const trimmingBaseSchema = z
  .object({
    // Section 1 — RFQ
    description: z.string(), // draft requires this as DESC; submit requires all rendered fields below
    part_number: z.string(),
    parts_per_year: z.string(), // optional · number as string (input type number)
    project_life: z.string(), // optional · free-form string (ej. "5 years")
    customer: z.string(), // optional · free-form string
    previous_job: z.string(), // optional · free-form string (referencia a job anterior)
    deliver_by: z.string().refine(
      (v) => !v || v > new Date().toISOString().slice(0, 10),
      { message: 'Date must be in the future.' }
    ),
    // Section 2 — Trim Die
    press: z.string(), // optional · free-form string (modelo de prensa)
    num_cavities: z.string(), // optional · free-form string (ej. "2x")
    num_hydraulic_slides: z.string(), // optional · number as string
    fully_automatic: z.string(), // opcional · valores esperados: 'yes' | 'no' (YesNoToggle), no restringido by Zod
    presence_detectors: z.string(), // opcional · valores esperados: 'yes' | 'no', no restringido by Zod
    trimming_condition: z.string(), // opcional · valores esperados: '' | 'cold' | 'hot' (select), no restringido by Zod
    punch_pins_required: z.string(), // opcional · valores esperados: 'yes' | 'no', no restringido by Zod
    residual_burr_mm: z.string(), // optional · number as string (input step 0.1)
    castings_by_auma: z.string(), // opcional · valores esperados: 'yes' | 'no', no restringido by Zod
    adjustments_toolmaker: z.string(), // opcional · valores esperados: 'yes' | 'no', no restringido by Zod
    gas_springs: z.string(), // optional · free-form string (ej. "Nitrogen, 4 pcs.")
    // Secciones 3 y 4 — consideraciones YES/NO
    considerations: z.record(
      z.string(),
      z.object({ checked: z.string().optional(), notes: z.string() })
    ), // free-form keys -> { checked?: string, notes: string }; superRefine: las 15 claves de TRIMMING_TOGGLE_REQUIRED require a non-empty checked value; if others.checked === 'yes', notes is also required
    // Section 5 — Part Geometry
    pg_part_name: z.string(), // optional · free-form string
    pg_part_number_geom: z.string(), // optional · number as string (input step 0.01)
    pg_part_dimension: z.string(), // optional · free-form string (ej. "320x180x75" in mm)
    pg_min_wall_thickness: z.string(), // optional · number as string (input step 0.01, in mm)
    pg_max_wall_thickness: z.string(), // optional · number as string (input step 0.01, in mm)
    pg_projected_area: z.string(), // optional · number as string (input step 0.01, en cm²)
    pg_surface: z.string(), // optional · number as string (input step 0.01, en cm²)
    pg_volume: z.string(), // optional · number as string (input step 0.01, en cm³)
    pg_gross_weight: z.string(), // optional · number as string (input step 0.01, en g)
    // Section 7 — Tool Specification (solo los campos realmente renderizados)
    ts_intro_extraction: z.string(),
    ts_biscuit_position: z.string(),
    ts_qty_punch_pins: z.string(),
    ts_temp_trimmed: z.string(),
    ts_ejector_fixed_side: z.string(),
    // Section 8 — Comments
    comments: z.string(), // optional · free-form text (textarea, no length limit)
    // Section 9 — Files
    files: z.array(fileSchema), // optional · attached files: PPT, STP, PDF; max. 25 MB per file
  });

const trimmingDraftSchema = trimmingBaseSchema.extend({
  description: requiredText('Enter DESC before saving the RFQ draft.'),
}).superRefine((values, ctx) => {
  const dateNotes = values.considerations['delivery_date']?.notes?.trim();
  if (dateNotes && dateNotes <= new Date().toISOString().slice(0, 10)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Date must be in the future.',
      path: ['considerations', 'delivery_date', 'notes'],
    });
  }
});

const trimmingSubmitSchema = trimmingBaseSchema
  .extend({
    description: requiredText('Enter DESC before submitting the RFQ.'),
    part_number: requiredText(),
    parts_per_year: requiredText(),
    project_life: requiredText(),
    customer: requiredText(),
    previous_job: requiredText(),
    deliver_by: requiredText().refine(
      (v) => !v || v > new Date().toISOString().slice(0, 10),
      { message: 'Date must be in the future.' }
    ),
    press: requiredText(),
    num_cavities: requiredText(),
    num_hydraulic_slides: requiredText(),
    fully_automatic: requiredText('Select YES or NO.'),
    presence_detectors: requiredText('Select YES or NO.'),
    trimming_condition: requiredText(),
    punch_pins_required: requiredText('Select YES or NO.'),
    residual_burr_mm: requiredText(),
    castings_by_auma: requiredText('Select YES or NO.'),
    adjustments_toolmaker: requiredText('Select YES or NO.'),
    gas_springs: requiredText(),
    pg_part_name: requiredText(),
    pg_part_number_geom: requiredText(),
    pg_part_dimension: requiredText(),
    pg_min_wall_thickness: requiredText(),
    pg_max_wall_thickness: requiredText(),
    pg_projected_area: requiredText(),
    pg_surface: requiredText(),
    pg_volume: requiredText(),
    pg_gross_weight: requiredText(),
    ts_intro_extraction: requiredText(),
    ts_biscuit_position: requiredText(),
    ts_qty_punch_pins: requiredText(),
    ts_temp_trimmed: requiredText(),
    ts_ejector_fixed_side: requiredText(),
    comments: requiredText(),
    files: z.array(fileSchema).min(1, 'Attach at least one file.'),
  })
  .superRefine((values, ctx) => {
    TRIMMING_TOGGLE_REQUIRED.forEach((key) => {
      if (!values.considerations[key]?.checked?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: 'Select whether it applies.',
          path: ['considerations', key, 'checked'],
        });
      }
      // delivery_date.notes is a date picker — only required when the toggle is YES
      if (key === 'delivery_date') {
        const dateNotes = values.considerations[key]?.notes?.trim();
        if (values.considerations[key]?.checked === 'yes' && !dateNotes) {
          ctx.addIssue({
            code: "custom",
            message: 'Select a delivery date.',
            path: ['considerations', key, 'notes'],
          });
        } else if (dateNotes && dateNotes <= new Date().toISOString().slice(0, 10)) {
          ctx.addIssue({
            code: "custom",
            message: 'Date must be in the future.',
            path: ['considerations', key, 'notes'],
          });
        }
      } else if (!values.considerations[key]?.notes?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: 'Complete the notes/specifications. Use N/A if it does not apply.',
          path: ['considerations', key, 'notes'],
        });
      }
    });
  });

export type TrimmingFormValues = z.infer<typeof trimmingBaseSchema>;

// ─── Navigation ───────────────────────────────────────────────────────────────

type TrimmingPageKey =
  | 'basic'
  | 'trim_die'
  | 'data_info'
  | 'other_info'
  | 'part_geometry'
  | 'tool_spec'
  | 'comments'
  | 'files';

const PAGES: readonly TrimmingPageKey[] = [
  'basic', 'trim_die', 'data_info', 'other_info',
  'part_geometry', 'tool_spec', 'comments', 'files',
];

const PAGE_META: Record<TrimmingPageKey, PageMeta> = {
  basic: {
    navLabel: 'RFQ',
    subtitle: 'Main requirement data that initiates the workflow.',
    title: '1. RFQ',
  },
  trim_die: {
    navLabel: 'TRIM DIE',
    subtitle: 'Trim die configuration and specifications.',
    title: '2. Trim Die',
  },
  data_info: {
    navLabel: 'DATA INFORMATION',
    subtitle: 'Technical deliverables requested from the toolmaker.',
    title: '3. Data Information Required in the Price of the Trim Die',
  },
  other_info: {
    navLabel: 'OTHER INFORMATION',
    subtitle: 'Other deliverables and included services.',
    title: '4. Other Information',
  },
  part_geometry: {
    navLabel: 'PART GEOMETRY',
    subtitle: 'Part geometry and physical properties.',
    title: '5. Part Geometry',
  },
  tool_spec: {
    navLabel: 'TOOL SPECIFICATION',
    subtitle: 'Technical specifications of the tooling and machine.',
    title: '6. Tool Specification',
  },
  comments: {
    navLabel: 'COMMENTS',
    subtitle: 'Additional comments for the supplier.',
    title: '7. Comments',
  },
  files: {
    navLabel: 'UPLOAD FILES',
    subtitle: 'Attach blueprints, quotations and part specifications.',
    title: '8. Upload Files',
  },
};

const NAV_GROUPS: readonly NavGroup[] = [
  {
    key: 'TRIMMING',
    label: 'TRIMMING',
    items: [
      { key: 'basic', label: 'RFQ' },
      { key: 'trim_die', label: 'TRIM DIE' },
      { key: 'data_info', label: 'DATA INFORMATION' },
      { key: 'other_info', label: 'OTHER INFORMATION' },
    ],
  },
  {
    key: 'COST_BREAKDOWN',
    label: 'COST BREAKDOWN',
    items: [
      { key: 'part_geometry', label: 'PART GEOMETRY' },
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

function requiredTogglePaths(ids: readonly string[]): readonly FieldPath<TrimmingFormValues>[] {
  return ids.flatMap((id) => [
    `considerations.${id}.checked` as FieldPath<TrimmingFormValues>,
    `considerations.${id}.notes` as FieldPath<TrimmingFormValues>,
  ]);
}

const DRAFT_REQUIRED_FIELDS_BY_PAGE: Partial<Record<TrimmingPageKey, readonly FieldPath<TrimmingFormValues>[]>> = {
  basic: ['description'],
};

const SUBMIT_REQUIRED_FIELDS_BY_PAGE: Partial<Record<TrimmingPageKey, readonly FieldPath<TrimmingFormValues>[]>> = {
  basic: [
    'description',
    'part_number',
    'parts_per_year',
    'project_life',
    'customer',
    'previous_job',
    'deliver_by',
  ],
  trim_die: [
    'press',
    'num_cavities',
    'num_hydraulic_slides',
    'fully_automatic',
    'presence_detectors',
    'trimming_condition',
    'punch_pins_required',
    'residual_burr_mm',
    'castings_by_auma',
    'adjustments_toolmaker',
    'gas_springs',
  ],
  data_info: [
    ...requiredTogglePaths([
      'design_3d',
      'design_2d',
      'punch_pins',
      'manuf_proposals',
      'latest_improvements',
      'sketch_concept',
    ]),
  ],
  other_info: requiredTogglePaths([
    'frame_refur',
    'elec_wires',
    'others',
    'delivery_date',
    'ejector_fixed',
    'trim_die_1',
    'trim_die_2',
    'spare_parts_set',
    'hydraulic_cyl',
  ]),
  part_geometry: [
    'pg_part_name',
    'pg_part_number_geom',
    'pg_part_dimension',
    'pg_min_wall_thickness',
    'pg_max_wall_thickness',
    'pg_projected_area',
    'pg_surface',
    'pg_volume',
    'pg_gross_weight',
  ],
  tool_spec: [
    'ts_intro_extraction',
    'ts_biscuit_position',
    'ts_qty_punch_pins',
    'ts_temp_trimmed',
    'ts_ejector_fixed_side',
  ],
  comments: ['comments'],
  files: ['files'],
};

// ─── Consideration group configs ──────────────────────────────────────────────

const DATA_INFO_GROUP: ConsiderationGroupConfig = {
  title: '3. Data Information Required in the Price of the Trim Die',
  subtitle: 'Technical deliverables requested from the toolmaker.',
  col1Header: 'Description',
  col3Header: 'Notes',
  items: [
    { id: 'design_3d', label: 'Design 3D model' },
    { id: 'design_2d', label: 'Design 2D data' },
    { id: 'punch_pins', label: 'Punch pins Data' },
    { id: 'manuf_proposals', label: 'Manufacturing Proposals' },
    { id: 'latest_improvements', label: 'Latest trim die improvements', notesAs: 'textarea' },
    { id: 'sketch_concept', label: 'Sketch of trim die concept including steel dimensions' },
  ],
};

const OTHER_INFO_GROUP: ConsiderationGroupConfig = {
  title: '4. Other Information',
  subtitle: 'Other deliverables and included services.',
  col1Header: 'Description',
  col3Header: 'Notes',
  items: [
    { id: 'frame_refur', label: 'Frame Refurbishment' },
    { id: 'elec_wires', label: 'Set of electric wires' },
    { id: 'others', label: 'Others' },
    {
      id: 'delivery_date',
      label: 'Delivery date (in which IMEX must pick up the trim die)',
      variant: 'date',
    },
    { id: 'ejector_fixed', label: 'Ejector system in fixed side' },
    { id: 'trim_die_1', label: 'Trim die No. 1' },
    { id: 'trim_die_2', label: 'Trim die No. 2' },
    { id: 'spare_parts_set', label: 'Set of spare parts (recommended by tool maker)' },
    { id: 'hydraulic_cyl', label: 'Hydraulic Cylinders and limit switches' },
  ],
};

// ─── Default values ───────────────────────────────────────────────────────────

function getCreateDefaultValues(): TrimmingFormValues {
  return {
    description: '',
    part_number: '',
    parts_per_year: '',
    project_life: '',
    customer: '',
    previous_job: '',
    deliver_by: '',
    press: '',
    num_cavities: '',
    num_hydraulic_slides: '',
    fully_automatic: '',
    presence_detectors: '',
    trimming_condition: '',
    punch_pins_required: '',
    residual_burr_mm: '',
    castings_by_auma: '',
    adjustments_toolmaker: '',
    gas_springs: '',
    considerations: {},
    pg_part_name: '',
    pg_part_number_geom: '',
    pg_part_dimension: '',
    pg_min_wall_thickness: '',
    pg_max_wall_thickness: '',
    pg_projected_area: '',
    pg_surface: '',
    pg_volume: '',
    pg_gross_weight: '',
    ts_intro_extraction: '',
    ts_biscuit_position: '',
    ts_qty_punch_pins: '',
    ts_temp_trimmed: '',
    ts_ejector_fixed_side: '',
    comments: '',
    files: [],
  };
}

function getEditDefaultValues(rfqId?: string): TrimmingFormValues {
  return {
    description: 'Lateral door support',
    part_number: `${(rfqId ?? 'TRM-001').toUpperCase()}-TR`,
    parts_per_year: '180000',
    project_life: '5 years',
    customer: 'BMW AG',
    previous_job: 'TRM-0098',
    deliver_by: '2026-09-15',
    press: 'Müller Weingarten PE2500',
    num_cavities: '2x',
    num_hydraulic_slides: '3',
    fully_automatic: 'yes',
    presence_detectors: 'yes',
    trimming_condition: 'hot',
    punch_pins_required: 'yes',
    residual_burr_mm: '0.3',
    castings_by_auma: 'no',
    adjustments_toolmaker: 'yes',
    gas_springs: 'Nitrogen, 4 pcs.',
    considerations: {
      design_3d: { checked: 'yes', notes: 'Native CATIA V5 format.' },
      design_2d: { checked: 'yes', notes: 'PDF + DXF.' },
      punch_pins: { checked: 'yes', notes: '' },
      manuf_proposals: { checked: 'yes', notes: 'View M1 proposal.' },
      latest_improvements: { checked: 'yes', notes: 'Review of steel inserts from the previous print.' },
      sketch_concept: { checked: 'yes', notes: 'Include steel dimensions.' },
      frame_refur: { checked: 'yes', notes: '' },
      elec_wires: { checked: 'no', notes: '' },
      others: { checked: 'no', notes: '' },
      delivery_date: { checked: 'yes', notes: '2026-09-01' },
      ejector_fixed: { checked: 'yes', notes: '' },
      trim_die_1: { checked: 'yes', notes: '' },
      trim_die_2: { checked: 'no', notes: '' },
      spare_parts_set: { checked: 'yes', notes: 'See attached list.' },
      hydraulic_cyl: { checked: 'yes', notes: 'Bosch Rexroth.' },
    },
    pg_part_name: 'Lateral door support',
    pg_part_number_geom: '0',
    pg_part_dimension: '320x180x75',
    pg_min_wall_thickness: '3',
    pg_max_wall_thickness: '14',
    pg_projected_area: '420.50',
    pg_surface: '1180.00',
    pg_volume: '285.30',
    pg_gross_weight: '780.00',
    ts_intro_extraction: 'Robot arm extraction',
    ts_biscuit_position: 'Bottom center',
    ts_qty_punch_pins: '12',
    ts_temp_trimmed: '280',
    ts_ejector_fixed_side: 'Spring return ejectors',
    comments: '',
    files: [],
  };
}

// ─── Completion / error maps ──────────────────────────────────────────────────

function getCompletedMap(values: TrimmingFormValues): Partial<Record<string, boolean>> {
  return {
    basic: values.description.trim().length > 0,
  };
}

function getPageErrorMap(
  errors: Parameters<RfqWorkspaceDefinition<TrimmingFormValues>['getPageErrorMap']>[0]
): Partial<Record<string, boolean>> {
  return buildPageErrorMap(SUBMIT_REQUIRED_FIELDS_BY_PAGE, errors);
}

function getDraftPageErrorMap(
  errors: Parameters<RfqWorkspaceDefinition<TrimmingFormValues>['getPageErrorMap']>[0]
): Partial<Record<string, boolean>> {
  return buildPageErrorMap(DRAFT_REQUIRED_FIELDS_BY_PAGE, errors);
}

function getSubmitPageErrorMap(
  errors: Parameters<RfqWorkspaceDefinition<TrimmingFormValues>['getPageErrorMap']>[0]
): Partial<Record<string, boolean>> {
  return buildPageErrorMap(SUBMIT_REQUIRED_FIELDS_BY_PAGE, errors);
}

// ─── Page components ──────────────────────────────────────────────────────────

function BasicPage() {
  return (
    <SectionCard subtitle={PAGE_META.basic.subtitle} title={PAGE_META.basic.title}>
      <FormGrid>
        <TextField label="DESCRIPTION" name="description" required />
        <TextField label="PART N°" name="part_number" required />
        <TextField label="PARTS PER YEAR" name="parts_per_year" type="number" />
        <TextField label="PROJECT LIFE" name="project_life" />
        <TextField label="CUSTOMER" name="customer" />
        <TextField label="PREVIOUS JOB" name="previous_job" />
        <TextField label="DELIVER THIS QUOTE BY" name="deliver_by" type="date" />
      </FormGrid>
    </SectionCard>
  );
}

function TrimDiePage() {
  const { register } = useFormContext<TrimmingFormValues>();

  const rowClass =
    'grid gap-3 py-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)] md:items-center md:gap-5';
  const labelClass = 'text-[13px] font-medium leading-[1.5] text-[var(--bocar-text)]';

  return (
    <SectionCard subtitle={PAGE_META.trim_die.subtitle} title={PAGE_META.trim_die.title}>
      <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)] gap-5 border-b border-[rgba(217,222,229,0.86)] pb-3 md:grid">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
          Description
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
          Specs
        </div>
      </div>

      <div className="divide-y divide-[rgba(236,240,245,0.9)]">
        <div className={rowClass}>
          <div className={labelClass}>Press</div>
          <input className={inputBaseClasses(false)} {...register('press')} />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>No. of cavities</div>
          <input className={inputBaseClasses(false)} {...register('num_cavities')} />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>No. of hydraulic slides</div>
          <input className={inputBaseClasses(false)} {...register('num_hydraulic_slides')} />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Fully Automatic process</div>
          <YesNoToggle name="fully_automatic" />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Presence Detectors</div>
          <YesNoToggle name="presence_detectors" />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Trimming process — condition of casting</div>
          <select className={inputBaseClasses(false)} {...register('trimming_condition')}>
            <option value="">—</option>
            <option value="cold">Cold</option>
            <option value="hot">Hot</option>
          </select>
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Punch pins required</div>
          <YesNoToggle name="punch_pins_required" />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Admissible residual burr after trimming in mm</div>
          <input
            className={inputBaseClasses(false)}
            step="0.1"
            type="number"
            {...register('residual_burr_mm')}
          />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Castings supplied by Auma</div>
          <YesNoToggle name="castings_by_auma" />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Adjustments and optimization at tool maker's facilities</div>
          <YesNoToggle name="adjustments_toolmaker" />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Gas springs</div>
          <input className={inputBaseClasses(false)} {...register('gas_springs')} />
        </div>
      </div>
    </SectionCard>
  );
}

function DataInfoPage() {
  return <ConsiderationTogglePage group={DATA_INFO_GROUP} />;
}

function OtherInfoPage() {
  return <ConsiderationTogglePage group={OTHER_INFO_GROUP} />;
}

function PartGeometryPage() {
  const { register } = useFormContext<TrimmingFormValues>();

  const rowClass =
    'grid gap-3 py-4 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1.65fr)] md:items-center md:gap-5';
  const labelClass = 'text-[13px] font-medium leading-[1.5] text-[var(--bocar-text)]';

  return (
    <SectionCard subtitle={PAGE_META.part_geometry.subtitle} title={PAGE_META.part_geometry.title}>
      <div className="hidden grid-cols-[minmax(0,1.35fr)_minmax(0,1.65fr)] gap-5 border-b border-[rgba(217,222,229,0.86)] pb-3 md:grid">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
          Description
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
          Input
        </div>
      </div>

      <div className="divide-y divide-[rgba(236,240,245,0.9)]">
        <div className={rowClass}>
          <div className={labelClass}>Part Name</div>
          <input className={inputBaseClasses(false)} {...register('pg_part_name')} />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Part number</div>
          <input
            className={inputBaseClasses(false)}
            step="0.01"
            type="number"
            {...register('pg_part_number_geom')}
          />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Part dimension in mm</div>
          <input className={inputBaseClasses(false)} {...register('pg_part_dimension')} />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Min. wall thickness in mm</div>
          <input
            className={inputBaseClasses(false)}
            step="0.01"
            type="number"
            {...register('pg_min_wall_thickness')}
          />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Max. wall thickness in mm</div>
          <input
            className={inputBaseClasses(false)}
            step="0.01"
            type="number"
            {...register('pg_max_wall_thickness')}
          />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Projected area in cm²</div>
          <input
            className={inputBaseClasses(false)}
            step="0.01"
            type="number"
            {...register('pg_projected_area')}
          />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Surface in cm²</div>
          <input
            className={inputBaseClasses(false)}
            step="0.01"
            type="number"
            {...register('pg_surface')}
          />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Volume in cm³</div>
          <input
            className={inputBaseClasses(false)}
            step="0.01"
            type="number"
            {...register('pg_volume')}
          />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Gross weight in g</div>
          <input
            className={inputBaseClasses(false)}
            step="0.01"
            type="number"
            {...register('pg_gross_weight')}
          />
        </div>
      </div>
    </SectionCard>
  );
}

function ToolSpecPage() {
  const { register } = useFormContext<TrimmingFormValues>();

  const rowClass =
    'grid gap-3 py-4 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1.65fr)] md:items-center md:gap-5';
  const labelClass = 'text-[13px] font-medium leading-[1.5] text-[var(--bocar-text)]';

  return (
    <SectionCard subtitle={PAGE_META.tool_spec.subtitle} title={PAGE_META.tool_spec.title}>
      <div className="hidden grid-cols-[minmax(0,1.35fr)_minmax(0,1.65fr)] gap-5 border-b border-[rgba(217,222,229,0.86)] pb-3 md:grid">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
          Description
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
          Input
        </div>
      </div>

      <div className="divide-y divide-[rgba(236,240,245,0.9)]">
        <div className={rowClass}>
          <div className={labelClass}>Press Type</div>
          <input className={inputBaseClasses(false)} {...register('press')} />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Number of cavities</div>
          <input className={inputBaseClasses(false)} {...register('num_cavities')} />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Introduction / Extraction Process</div>
          <input className={inputBaseClasses(false)} {...register('ts_intro_extraction')} />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Biscuit Position</div>
          <input className={inputBaseClasses(false)} {...register('ts_biscuit_position')} />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Number of hydr. slides</div>
          <input
            className={inputBaseClasses(false)}
            step="0.01"
            type="number"
            {...register('num_hydraulic_slides')}
          />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Quantity of punch pins</div>
          <input
            className={inputBaseClasses(false)}
            step="1"
            type="number"
            {...register('ts_qty_punch_pins')}
          />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Admissible residual Burr in mm</div>
          <input
            className={inputBaseClasses(false)}
            step="0.01"
            type="number"
            {...register('residual_burr_mm')}
          />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Temperature of part when trimmed</div>
          <input className={inputBaseClasses(false)} {...register('ts_temp_trimmed')} />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Gas Springs</div>
          <input className={inputBaseClasses(false)} {...register('gas_springs')} />
        </div>

        <div className={rowClass}>
          <div className={labelClass}>Ejector system in fixed side</div>
          <input className={inputBaseClasses(false)} {...register('ts_ejector_fixed_side')} />
        </div>
      </div>
    </SectionCard>
  );
}

function CommentsPage() {
  const { register } = useFormContext<TrimmingFormValues>();

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
  if (page === 'trim_die') return <TrimDiePage />;
  if (page === 'data_info') return <DataInfoPage />;
  if (page === 'other_info') return <OtherInfoPage />;
  if (page === 'part_geometry') return <PartGeometryPage />;
  if (page === 'tool_spec') return <ToolSpecPage />;
  if (page === 'comments') return <CommentsPage />;
  if (page === 'files') return <FilesPage readOnly={readOnly} />;
  return null;
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const trimmingDefinition: RfqWorkspaceDefinition<TrimmingFormValues> = {
  resolver: zodResolver(trimmingDraftSchema),
  draftResolver: zodResolver(trimmingDraftSchema),
  submitResolver: zodResolver(trimmingSubmitSchema),
  getCreateDefaultValues,
  getEditDefaultValues,
  pages: PAGES,
  navGroups: NAV_GROUPS,
  pageMeta: PAGE_META,
  requiredFieldsByPage: DRAFT_REQUIRED_FIELDS_BY_PAGE,
  draftRequiredFieldsByPage: DRAFT_REQUIRED_FIELDS_BY_PAGE,
  submitRequiredFieldsByPage: SUBMIT_REQUIRED_FIELDS_BY_PAGE,
  renderPage,
  getCompletedMap,
  getPageErrorMap,
  getDraftPageErrorMap,
  getSubmitPageErrorMap,
  onInvalidSubmit: (fieldErrors, ctx) => {
    goToFirstRequiredError(PAGES, SUBMIT_REQUIRED_FIELDS_BY_PAGE, fieldErrors, ctx);
  },
  onInvalidDraft: (fieldErrors, ctx) => {
    goToFirstRequiredError(PAGES, DRAFT_REQUIRED_FIELDS_BY_PAGE, fieldErrors, ctx);
  },
};
