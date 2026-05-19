import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { FileUploadField } from '@shared/components/ui/FileUploadField';

import {
  ConsiderationTogglePage,
  FormGrid,
  SectionCard,
  TextField,
  YesNoToggle,
  inputBaseClasses,
  type ConsiderationGroupConfig,
} from '../shell/primitives';
import type { NavGroup, PageMeta, RfqWorkspaceDefinition } from '../shell/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const TRIMMING_TOGGLE_REQUIRED = new Set([
  'design_3d', 'design_2d', 'punch_pins', 'manuf_proposals', 'latest_improvements', 'sketch_concept',
  'frame_refur', 'elec_wires', 'others', 'delivery_date',
  'ejector_fixed', 'trim_die_1', 'trim_die_2', 'spare_parts_set', 'hydraulic_cyl',
]);

const trimmingSchema = z
  .object({
    description: z.string().trim().min(1, 'Ingresa la descripcion.'),
    part_number: z.string().trim().min(1, 'Ingresa el numero de parte.'),
    parts_per_year: z.string(),
    project_life: z.string(),
    customer: z.string(),
    previous_job: z.string(),
    supplier: z.string(),
    deliver_by: z.string(),
    press: z.string(),
    num_cavities: z.string(),
    num_hydraulic_slides: z.string(),
    fully_automatic: z.string(),
    presence_detectors: z.string(),
    trimming_condition: z.string(),
    punch_pins_required: z.string(),
    residual_burr_mm: z.string(),
    castings_by_auma: z.string(),
    adjustments_toolmaker: z.string(),
    gas_springs: z.string(),
    considerations: z.record(
      z.string(),
      z.object({ checked: z.string().optional(), notes: z.string() })
    ),
    shot_sketch_file: z
      .object({ name: z.string(), size: z.number(), type: z.string() })
      .nullable(),
  })
  .superRefine((values, ctx) => {
    TRIMMING_TOGGLE_REQUIRED.forEach((key) => {
      if (!values.considerations[key]?.checked?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecciona si aplica.',
          path: ['considerations', key, 'checked'],
        });
      }
    });
    if (
      values.considerations['others']?.checked === 'yes' &&
      !values.considerations['others']?.notes?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Especifica el concepto.',
        path: ['considerations', 'others', 'notes'],
      });
    }
  });

type TrimmingFormValues = z.infer<typeof trimmingSchema>;

// ─── Navigation ───────────────────────────────────────────────────────────────

type TrimmingPageKey = 'basic' | 'trim_die' | 'data_info' | 'other_info' | 'shot_sketch';

const PAGES: readonly TrimmingPageKey[] = [
  'basic', 'trim_die', 'data_info', 'other_info', 'shot_sketch',
];

const PAGE_META: Record<TrimmingPageKey, PageMeta> = {
  basic: {
    navLabel: 'RFQ',
    subtitle: 'Datos principales del requerimiento que disparan el flujo.',
    title: '1. RFQ',
  },
  trim_die: {
    navLabel: 'TRIM DIE',
    subtitle: 'Configuracion y especificaciones del herramental de trimming.',
    title: '2. Trim Die',
  },
  data_info: {
    navLabel: 'DATA INFORMATION',
    subtitle: 'Entregables tecnicos solicitados al toolmaker.',
    title: '3. Data Information Required in the Price of the Trim Die',
  },
  other_info: {
    navLabel: 'OTHER INFORMATION',
    subtitle: 'Otros entregables y servicios incluidos.',
    title: '4. Other Information',
  },
  shot_sketch: {
    navLabel: 'SHOT SKETCH',
    subtitle: 'Adjunta el shot sketch completo del componente.',
    title: '5. Complete Shot Sketch',
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
      { key: 'shot_sketch', label: 'SHOT SKETCH' },
    ],
  },
];

const REQUIRED_FIELDS_BY_PAGE: Partial<Record<TrimmingPageKey, readonly (keyof TrimmingFormValues)[]>> = {
  basic: ['description', 'part_number'],
};

// ─── Consideration group configs ──────────────────────────────────────────────

const DATA_INFO_GROUP: ConsiderationGroupConfig = {
  title: '3. Data Information Required in the Price of the Trim Die',
  subtitle: 'Entregables tecnicos solicitados al toolmaker.',
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
  subtitle: 'Otros entregables y servicios incluidos.',
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
    supplier: '',
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
    shot_sketch_file: null,
  };
}

function getEditDefaultValues(rfqId?: string): TrimmingFormValues {
  return {
    description: 'Soporte lateral de puerta',
    part_number: `${(rfqId ?? 'TRM-001').toUpperCase()}-TR`,
    parts_per_year: '180000',
    project_life: '5 años',
    customer: 'BMW AG',
    previous_job: 'TRM-0098',
    supplier: 'Herramental Precision SA',
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
      manuf_proposals: { checked: 'yes', notes: 'Ver propuesta M1.' },
      latest_improvements: { checked: 'yes', notes: 'Revision de insertos de acero en impresion anterior.' },
      sketch_concept: { checked: 'yes', notes: 'Incluir dimensiones de acero.' },
      frame_refur: { checked: 'yes', notes: '' },
      elec_wires: { checked: 'no', notes: '' },
      others: { checked: 'no', notes: '' },
      delivery_date: { checked: 'yes', notes: '2026-09-01' },
      ejector_fixed: { checked: 'yes', notes: '' },
      trim_die_1: { checked: 'yes', notes: '' },
      trim_die_2: { checked: 'no', notes: '' },
      spare_parts_set: { checked: 'yes', notes: 'Ver lista adjunta.' },
      hydraulic_cyl: { checked: 'yes', notes: 'Bosch Rexroth.' },
    },
    shot_sketch_file: null,
  };
}

// ─── Completion / error maps ──────────────────────────────────────────────────

function getCompletedMap(values: TrimmingFormValues): Partial<Record<string, boolean>> {
  return {
    basic: values.description.trim().length > 0 && values.part_number.trim().length > 0,
    shot_sketch: values.shot_sketch_file !== null,
  };
}

function getPageErrorMap(
  errors: Parameters<RfqWorkspaceDefinition<TrimmingFormValues>['getPageErrorMap']>[0]
): Partial<Record<string, boolean>> {
  return {
    basic: Boolean(errors.description || errors.part_number),
  };
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
        <TextField label="SUPPLIER" name="supplier" />
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

function ShotSketchPage() {
  return (
    <SectionCard subtitle={PAGE_META.shot_sketch.subtitle} title={PAGE_META.shot_sketch.title}>
      <FileUploadField
        accept=".png,.jpg,.jpeg,.pdf,.dwg"
        maxSizeMb={10}
        name="shot_sketch_file"
      />
    </SectionCard>
  );
}

function renderPage(page: string): ReactNode {
  if (page === 'basic') return <BasicPage />;
  if (page === 'trim_die') return <TrimDiePage />;
  if (page === 'data_info') return <DataInfoPage />;
  if (page === 'other_info') return <OtherInfoPage />;
  if (page === 'shot_sketch') return <ShotSketchPage />;
  return null;
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const trimmingDefinition: RfqWorkspaceDefinition<TrimmingFormValues> = {
  resolver: zodResolver(trimmingSchema),
  getCreateDefaultValues,
  getEditDefaultValues,
  pages: PAGES,
  navGroups: NAV_GROUPS,
  pageMeta: PAGE_META,
  requiredFieldsByPage: REQUIRED_FIELDS_BY_PAGE,
  renderPage,
  getCompletedMap,
  getPageErrorMap,
  onInvalidSubmit: (fieldErrors, { setCurrentPage, setFocus }) => {
    if (fieldErrors.description) {
      setCurrentPage('basic');
      setFocus('description');
      return;
    }
    if (fieldErrors.part_number) {
      setCurrentPage('basic');
      setFocus('part_number');
    }
  },
};
