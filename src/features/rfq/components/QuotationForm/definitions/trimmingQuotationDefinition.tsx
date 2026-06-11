import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import type { FieldPath } from 'react-hook-form';
import { z } from 'zod';

import {
  FormGrid,
  ReadOnlyField,
  SectionCard,
  TextField,
  inputBaseClasses,
} from '../../RfqForm/shell/primitives';
import type {
  NavGroup,
  PageMeta,
  RfqWorkspaceDefinition,
} from '../../RfqForm/shell/types';
import { MultiFileUploadField } from '@shared/components/ui/MultiFileUploadField';
import { CostTable, computeBranchSubtotal } from '../shared/CostTable';
import { formatNum, mul, parseNum } from '../shared/formulas';

// ─── Inherited RFQ data (mock) ────────────────────────────────────────────────

type ConsiderationItem = {
  label: string;
  checked: 'yes' | 'no' | '';
  notes: string;
};

export type InheritedRfq = {
  // Section 1 — RFQ
  description: string;
  parts_per_year: string;
  customer: string;
  part_number: string;
  project_life: string;
  deliver_by: string;
  // Section 2 — Trim Die
  press: string;
  num_cavities: string;
  num_hydraulic_slides: string;
  fully_automatic: 'yes' | 'no' | '';
  presence_detectors: 'yes' | 'no' | '';
  trimming_condition: 'cold' | 'hot' | '';
  punch_pins_required: 'yes' | 'no' | '';
  residual_burr_mm: string;
  castings_by_auma: 'yes' | 'no' | '';
  adjustments_toolmaker: 'yes' | 'no' | '';
  gas_springs: string;
  // Section 3 — Data Information
  data_info: ConsiderationItem[];
  // Section 4 — Other Information
  other_info: ConsiderationItem[];
  // Section 5 — Shot Sketch
  shot_sketch_file: { name: string; size: number; type: string } | null;
  // Section 6 — Part Geometry
  pg_part_name: string;
  pg_part_number_geom: string;
  pg_part_dimension: string;
  pg_min_wall_thickness: string;
  pg_max_wall_thickness: string;
  pg_projected_area: string;
  pg_surface: string;
  pg_volume: string;
  pg_gross_weight: string;
  // Section 7 — Tool Specification
  ts_intro_extraction: string;
  ts_biscuit_position: string;
  ts_qty_punch_pins: string;
  ts_temp_trimmed: string;
  ts_ejector_fixed_side: string;
};

function getInheritedRfqMock(rfqId: string): InheritedRfq {
  return {
    description: 'Lateral door support',
    parts_per_year: '180,000',
    customer: 'BMW AG',
    part_number: `${rfqId.toUpperCase()}-TR`,
    project_life: '5 years',
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
    data_info: [
      { label: 'Design 3D model', checked: 'yes', notes: 'Native CATIA V5 format.' },
      { label: 'Design 2D data', checked: 'yes', notes: 'PDF + DXF.' },
      { label: 'Punch pins Data', checked: 'yes', notes: '' },
      { label: 'Manufacturing Proposals', checked: 'yes', notes: 'View M1 proposal.' },
      {
        label: 'Latest trim die improvements',
        checked: 'yes',
        notes: 'Review of steel inserts from the previous print.',
      },
      {
        label: 'Sketch of trim die concept including steel dimensions',
        checked: 'yes',
        notes: 'Include steel dimensions.',
      },
    ],
    other_info: [
      { label: 'Frame Refurbishment', checked: 'yes', notes: '' },
      { label: 'Set of electric wires', checked: 'no', notes: '' },
      { label: 'Others', checked: 'no', notes: '' },
      { label: 'Delivery date (pick-up by IMEX)', checked: 'yes', notes: '2026-09-01' },
      { label: 'Ejector system in fixed side', checked: 'yes', notes: '' },
      { label: 'Trim die No. 1', checked: 'yes', notes: '' },
      { label: 'Trim die No. 2', checked: 'no', notes: '' },
      { label: 'Set of spare parts (recommended by tool maker)', checked: 'yes', notes: 'View attached list.' },
      { label: 'Hydraulic Cylinders and limit switches', checked: 'yes', notes: 'Bosch Rexroth.' },
    ],
    shot_sketch_file: { name: 'Shot_Sketch_SoporteLateral_v3.pdf', size: 2_340_000, type: 'application/pdf' },
    pg_part_name: 'Lateral door support',
    pg_part_number_geom: '0',
    pg_part_dimension: '320 × 180 × 75 mm',
    pg_min_wall_thickness: '3 mm',
    pg_max_wall_thickness: '14 mm',
    pg_projected_area: '420.50 cm²',
    pg_surface: '1,180.00 cm²',
    pg_volume: '285.30 cm³',
    pg_gross_weight: '780.00 g',
    ts_intro_extraction: 'Manual extraction',
    ts_biscuit_position: 'Left side',
    ts_qty_punch_pins: '8',
    ts_temp_trimmed: '200°C',
    ts_ejector_fixed_side: 'Yes — 4 pins',
  };
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const moneyCell = z.string();
const hRow = z.object({ h: moneyCell, price: moneyCell, weeks: moneyCell });
const unitRow = z.object({ unit: moneyCell, price_unit: moneyCell, weeks: moneyCell });

const basicDataSchema = z.object({
  company: z.string(),
  elaborated_by: z.string(),
  country: z.string(),
  currency: z.union([z.literal('EUR'), z.literal('USD'), z.literal('')]),
  last_edited_by: z.string(),
  last_change: z.string(),
});

const materialCostsSchema = z.object({
  raw_materials: unitRow,
  others: unitRow,
});

const accessoriesCostsSchema = z.object({
  merkle_cylinders: unitRow,
  telemecanique: unitRow,
  ifm_sensors: unitRow,
  air_devices: unitRow,
  others: unitRow,
});

const machiningSchema = z.object({
  milling: hRow,
  turning: hRow,
  wire_cutting: hRow,
  edm: hRow,
  grinding: hRow,
  drilling: hRow,
  others: hRow,
});

const manualWorkSchema = z.object({
  assembly: hRow,
  spotting: hRow,
  stripping_polishing: hRow,
  others: hRow,
});

const heatSurfaceSchema = z.object({
  hardening: hRow,
  nitriding: hRow,
  coating: hRow,
  graining: hRow,
  others: hRow,
});

const engineeringDesignSchema = z.object({
  design: hRow,
  cam_nc: hRow,
  others: hRow,
});

const manufacturingSchema = z.object({
  machining: machiningSchema,
  manual_work: manualWorkSchema,
  heat_surface: heatSurfaceSchema,
  engineering_design: engineeringDesignSchema,
});

const trimDieAdjustmentSchema = z.object({
  adjustment: hRow,
  others: hRow,
});

const logisticsSchema = z.object({
  transport_to_btc: unitRow,
  transport_from_btc: unitRow,
  duty_costs: unitRow,
  cleaning_packaging: unitRow,
  other_costs: unitRow,
});

const toolReplacementSchema = z.object({
  die_improvements: unitRow,
  others: unitRow,
});

const sparePartSchema = z.object({
  concept: z.string(),
  unit: moneyCell,
  price_unit: moneyCell,
  weeks: moneyCell,
});

const trimmingQuotationSchema = z.object({
  supplier: z.string().trim().min(1, 'Enter the supplier name.'),
  ts_max_weight_trim_die: z.string().trim().min(1, 'Enter the maximum trim die weight.'),
  comments: z.string(),
  basic_data: basicDataSchema,
  material_costs: materialCostsSchema,
  accessories_costs: accessoriesCostsSchema,
  manufacturing: manufacturingSchema,
  trim_die_adjustment: trimDieAdjustmentSchema,
  logistics: logisticsSchema,
  tool_replacement: toolReplacementSchema,
  spare_parts: z.array(sparePartSchema),
  files: z.array(
    z.object({
      name: z.string(),
      size: z.number(),
      type: z.string(),
      file: z.instanceof(File).optional(),
      id: z.number().optional(),
      url: z.string().optional(),
      uploadedAt: z.string().optional(),
    }),
  ),
});

type TrimmingQuotationValues = z.infer<typeof trimmingQuotationSchema>;

// ─── Navigation ───────────────────────────────────────────────────────────────

type PageKey =
  | 'basic'
  | 'trim_die'
  | 'data_info'
  | 'other_info'
  | 'cost_and_timing_breakdown'
  | 'shot_sketch'
  | 'basic_data'
  | 'part_geometry'
  | 'tool_spec'
  | 'comments'
  | 'material_costs'
  | 'accessories_costs'
  | 'manufacturing_costs'
  | 'trim_die_adjustment'
  | 'logistics'
  | 'tool_replacement'
  | 'spare_parts'
  | 'files';

const PAGES: readonly PageKey[] = [
  'basic',
  'trim_die',
  'data_info',
  'other_info',
  'cost_and_timing_breakdown',
  'shot_sketch',
  'basic_data',
  'part_geometry',
  'tool_spec',
  'comments',
  'material_costs',
  'accessories_costs',
  'manufacturing_costs',
  'trim_die_adjustment',
  'logistics',
  'tool_replacement',
  'spare_parts',
  'files',
];

const PAGE_META: Record<PageKey, PageMeta> = {
  basic: {
    navLabel: 'RFQ',
    subtitle: 'Inherited RFQ data. Enter the supplier name.',
    title: '1. RFQ',
  },
  trim_die: {
    navLabel: 'TRIM DIE',
    subtitle: 'Trimming tooling configuration and specifications captured by Industrialization.',
    title: '2. Trim Die',
  },
  data_info: {
    navLabel: 'DATA INFORMATION',
    subtitle: 'Technical deliverables requested from the toolmaker, as defined by Industrialization.',
    title: '3. Data Information Required in the Price of the Trim Die',
  },
  other_info: {
    navLabel: 'OTHER INFORMATION',
    subtitle: 'Other required deliverables and services, as defined by Industrialization.',
    title: '4. Other Information',
  },
  cost_and_timing_breakdown: {
    navLabel: 'COST AND TIMING BREAKDOWN',
    subtitle: 'Cost and Timing Breakdown',
    title: '5. Cost and Timing Breakdown',
  },
  shot_sketch: {
    navLabel: 'SHOT SKETCH',
    subtitle: 'Shot sketch attached by Industrialization as a technical reference.',
    title: '5. Complete Shot Sketch',
  },
  basic_data: {
    navLabel: 'BASIC DATA',
    subtitle: 'General information about your organization for this quotation.',
    title: '1. Basic Data',
  },
  part_geometry: {
    navLabel: 'PART GEOMETRY',
    subtitle: 'Part geometry and properties captured by Industrialization.',
    title: '2. Part Geometry',
  },
  tool_spec: {
    navLabel: 'TOOL SPECIFICATION',
    subtitle: 'Tooling specifications. Add the maximum trim die weight.',
    title: '3. Tool Specification',
  },
  comments: {
    navLabel: 'COMMENTS',
    subtitle: 'Additional notes for the Purchasing team.',
    title: '4. Comments',
  },
  material_costs: {
    navLabel: 'MATERIAL COSTS',
    subtitle: 'Purchased parts and raw material costs.',
    title: '5. Material Costs (Purchased Parts and Raw Materials)',
  },
  accessories_costs: {
    navLabel: 'ACCESORIES COSTS',
    subtitle: 'Standard trim die accessory costs.',
    title: '6. Accesories Costs',
  },
  manufacturing_costs: {
    navLabel: 'MANUFACTURING COSTS',
    subtitle: 'Process times and costs by category.',
    title: '7. Manufacturing Costs (Process Times and Costs)',
  },
  trim_die_adjustment: {
    navLabel: 'TRIM DIE ADJUSTMENT',
    subtitle: 'Hours and costs for the final trim die adjustment.',
    title: '8. Trim Die Adjustment',
  },
  logistics: {
    navLabel: 'LOGISTICS',
    subtitle: 'Logistics costs associated with the trim die.',
    title: '9. Logistics',
  },
  tool_replacement: {
    navLabel: 'TOOL REPLACEMENT',
    subtitle: 'Tooling replacement costs, if applicable.',
    title: '10. Tool Replacement',
  },
  spare_parts: {
    navLabel: 'SPARE PARTS',
    subtitle: 'Required spare part costs for the trim die.',
    title: '11. Spare Parts',
  },
  files: {
    navLabel: 'FILES',
    subtitle: 'Attach supporting documents for this quotation.',
    title: '12. Files',
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
      { key: 'cost_and_timing_breakdown', label: 'COST AND TIMING BREAKDOWN' },
      { key: 'shot_sketch', label: 'SHOT SKETCH' },
    ],
  },
  {
    key: 'COST_BREAKDOWN',
    label: 'COST BREAKDOWN',
    items: [
      { key: 'basic_data', label: 'BASIC DATA' },
      { key: 'part_geometry', label: 'PART GEOMETRY' },
      { key: 'tool_spec', label: 'TOOL SPECIFICATION' },
      { key: 'comments', label: 'COMMENTS' },
      { key: 'material_costs', label: 'MATERIAL COSTS' },
      { key: 'accessories_costs', label: 'ACCESORIES COSTS' },
      { key: 'manufacturing_costs', label: 'MANUFACTURING COSTS' },
      { key: 'trim_die_adjustment', label: 'TRIM DIE ADJUSTMENT' },
      { key: 'logistics', label: 'LOGISTICS' },
      { key: 'tool_replacement', label: 'TOOL REPLACEMENT' },
      { key: 'spare_parts', label: 'SPARE PARTS' },
    ],
  },
  {
    key: 'FILES',
    label: 'FILES',
    items: [{ key: 'files', label: 'FILES' }],
  },
];

const REQUIRED_FIELDS_BY_PAGE: Partial<Record<PageKey, readonly FieldPath<TrimmingQuotationValues>[]>> = {
  basic: ['supplier'],
  tool_spec: ['ts_max_weight_trim_die'],
};

// ─── Default values ───────────────────────────────────────────────────────────

function emptyHRow() {
  return { h: '', price: '', weeks: '' };
}
function emptyUnitRow() {
  return { unit: '', price_unit: '', weeks: '' };
}

function getCreateDefaultValues(): TrimmingQuotationValues {
  return {
    supplier: '',
    ts_max_weight_trim_die: '',
    comments: '',
    basic_data: {
      company: '',
      elaborated_by: '',
      country: '',
      currency: '',
      last_edited_by: '',
      last_change: '',
    },
    material_costs: {
      raw_materials: emptyUnitRow(),
      others: emptyUnitRow(),
    },
    accessories_costs: {
      merkle_cylinders: emptyUnitRow(),
      telemecanique: emptyUnitRow(),
      ifm_sensors: emptyUnitRow(),
      air_devices: emptyUnitRow(),
      others: emptyUnitRow(),
    },
    manufacturing: {
      machining: {
        milling: emptyHRow(),
        turning: emptyHRow(),
        wire_cutting: emptyHRow(),
        edm: emptyHRow(),
        grinding: emptyHRow(),
        drilling: emptyHRow(),
        others: emptyHRow(),
      },
      manual_work: {
        assembly: emptyHRow(),
        spotting: emptyHRow(),
        stripping_polishing: emptyHRow(),
        others: emptyHRow(),
      },
      heat_surface: {
        hardening: emptyHRow(),
        nitriding: emptyHRow(),
        coating: emptyHRow(),
        graining: emptyHRow(),
        others: emptyHRow(),
      },
      engineering_design: {
        design: emptyHRow(),
        cam_nc: emptyHRow(),
        others: emptyHRow(),
      },
    },
    trim_die_adjustment: {
      adjustment: emptyHRow(),
      others: emptyHRow(),
    },
    logistics: {
      transport_to_btc: emptyUnitRow(),
      transport_from_btc: emptyUnitRow(),
      duty_costs: emptyUnitRow(),
      cleaning_packaging: emptyUnitRow(),
      other_costs: emptyUnitRow(),
    },
    tool_replacement: {
      die_improvements: emptyUnitRow(),
      others: emptyUnitRow(),
    },
    spare_parts: [
      { concept: 'Spare Parts (Punch pins)', unit: '', price_unit: '', weeks: '' },
      { concept: 'Other', unit: '', price_unit: '', weeks: '' },
    ],
    files: [],
  };
}

function getEditDefaultValues(quotationId?: string): TrimmingQuotationValues {
  const base = getCreateDefaultValues();
  return {
    ...base,
    supplier: 'Herramental Precision SA',
    ts_max_weight_trim_die: '850 kg',
    comments: `Quotation linked to ${(quotationId ?? 'COT-001').toUpperCase()}.`,
    basic_data: {
      company: 'Herramental Precision SA',
      elaborated_by: 'Carlos Martinez',
      country: 'Mexico',
      currency: 'USD',
      last_edited_by: 'Carlos Martinez',
      last_change: '2026-05-20',
    },
    material_costs: {
      raw_materials: { unit: '420', price_unit: '4.80', weeks: '4' },
      others: { unit: '6', price_unit: '120.00', weeks: '2' },
    },
    manufacturing: {
      ...base.manufacturing,
      machining: {
        ...base.manufacturing.machining,
        milling: { h: '120', price: '65', weeks: '4' },
        turning: { h: '40', price: '60', weeks: '2' },
      },
    },
  };
}

// ─── Completion / error maps ──────────────────────────────────────────────────

function getCompletedMap(values: TrimmingQuotationValues): Partial<Record<string, boolean>> {
  return {
    basic: values.supplier.trim().length > 0,
    tool_spec: values.ts_max_weight_trim_die.trim().length > 0,
  };
}

function getPageErrorMap(
  errors: Parameters<RfqWorkspaceDefinition<TrimmingQuotationValues>['getPageErrorMap']>[0]
): Partial<Record<string, boolean>> {
  return {
    basic: Boolean(errors.supplier),
    tool_spec: Boolean(errors.ts_max_weight_trim_die),
  };
}

// ─── Shared readonly display primitives (local) ───────────────────────────────

const ROW_CLASS =
  'grid gap-3 py-4 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1.65fr)] md:items-center md:gap-5';
const LABEL_CLASS = 'text-[13px] font-medium leading-[1.5] text-[var(--bocar-text)]';

function ReadOnlyValueCell({ value }: { value: ReactNode }) {
  const empty = value === '' || value === null || value === undefined;
  return (
    <div className="flex min-h-[42px] items-center rounded-[10px] border border-[rgba(217,222,229,0.92)] bg-[#f5f7fa] px-3.5 py-2.5 text-[14px] font-medium text-[var(--bocar-text)]">
      {empty ? <span className="text-[var(--bocar-blue-30)]">—</span> : value}
    </div>
  );
}

function YesNoBadge({ value }: { value: 'yes' | 'no' | '' }) {
  if (value === 'yes') {
    return (
      <span className="inline-flex items-center rounded-[6px] border border-[rgba(141,198,63,0.35)] bg-[rgba(141,198,63,0.12)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#3d6e12]">
        YES
      </span>
    );
  }
  if (value === 'no') {
    return (
      <span className="inline-flex items-center rounded-[6px] border border-[rgba(217,222,229,0.92)] bg-[#f5f7fa] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
        NO
      </span>
    );
  }
  return <span className="text-[13px] text-[var(--bocar-blue-30)]">—</span>;
}

function SectionTableHeader({
  col1 = 'Description',
  col2 = 'From RFQ',
}: {
  col1?: string;
  col2?: string;
}) {
  return (
    <div className="hidden grid-cols-[minmax(0,1.35fr)_minmax(0,1.65fr)] gap-5 border-b border-[rgba(217,222,229,0.86)] pb-3 md:grid">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
        {col1}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
        {col2}
      </div>
    </div>
  );
}

function ConsiderationTableReadonly({
  items,
}: {
  items: ConsiderationItem[];
}) {
  return (
    <>
      <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,0.55fr)_minmax(0,1.85fr)] gap-5 border-b border-[rgba(217,222,229,0.86)] pb-3 md:grid">
        {(['Description', 'Applies', 'Notes'] as const).map((h) => (
          <div
            key={h}
            className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]"
          >
            {h}
          </div>
        ))}
      </div>

      <div className="divide-y divide-[rgba(236,240,245,0.9)]">
        {items.map((item) => (
          <div
            key={item.label}
            className="grid gap-3 py-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.55fr)_minmax(0,1.85fr)] md:items-center md:gap-5"
          >
            <div className={LABEL_CLASS}>{item.label}</div>
            <YesNoBadge value={item.checked} />
            <ReadOnlyValueCell value={item.notes || null} />
          </div>
        ))}
      </div>
    </>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

// ─── Page components ──────────────────────────────────────────────────────────

function BasicPage({ inherited }: { inherited: InheritedRfq }) {
  return (
    <SectionCard subtitle={PAGE_META.basic.subtitle} title={PAGE_META.basic.title}>
      <FormGrid>
        <ReadOnlyField label="DESCRIPTION" value={inherited.description} />
        <ReadOnlyField label="PART N°" value={inherited.part_number} />
        <ReadOnlyField label="PARTS PER YEAR" value={inherited.parts_per_year} />
        <ReadOnlyField label="PROJECT LIFE" value={inherited.project_life} />
        <ReadOnlyField label="CUSTOMER" value={inherited.customer} />
        <ReadOnlyField label="DELIVER THIS QUOTE BY" value={inherited.deliver_by} />
        <TextField
          hint="Legal name or trade name under which you quote."
          label="SUPPLIER"
          name="supplier"
          required
          span={2}
        />
      </FormGrid>
    </SectionCard>
  );
}

function TrimDiePage({ inherited }: { inherited: InheritedRfq }) {
  const rows: { label: string; value: ReactNode }[] = [
    { label: 'Press', value: inherited.press },
    { label: 'No. of cavities', value: inherited.num_cavities },
    { label: 'No. of hydraulic slides', value: inherited.num_hydraulic_slides },
    {
      label: 'Fully Automatic process',
      value: <YesNoBadge value={inherited.fully_automatic} />,
    },
    {
      label: 'Presence Detectors',
      value: <YesNoBadge value={inherited.presence_detectors} />,
    },
    {
      label: 'Trimming process — condition of casting',
      value:
        inherited.trimming_condition === 'cold'
          ? 'Cold'
          : inherited.trimming_condition === 'hot'
            ? 'Hot'
            : null,
    },
    {
      label: 'Punch pins required',
      value: <YesNoBadge value={inherited.punch_pins_required} />,
    },
    {
      label: 'Admissible residual burr after trimming in mm',
      value: inherited.residual_burr_mm,
    },
    {
      label: 'Castings supplied by Auma',
      value: <YesNoBadge value={inherited.castings_by_auma} />,
    },
    {
      label: "Adjustments and optimization at tool maker's facilities",
      value: <YesNoBadge value={inherited.adjustments_toolmaker} />,
    },
    { label: 'Gas springs', value: inherited.gas_springs },
  ];

  return (
    <SectionCard subtitle={PAGE_META.trim_die.subtitle} title={PAGE_META.trim_die.title}>
      <SectionTableHeader col2="From RFQ" />
      <div className="divide-y divide-[rgba(236,240,245,0.9)]">
        {rows.map((row) => (
          <div key={row.label} className={ROW_CLASS}>
            <div className={LABEL_CLASS}>{row.label}</div>
            <ReadOnlyValueCell value={row.value} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function DataInfoPage({ inherited }: { inherited: InheritedRfq }) {
  return (
    <SectionCard subtitle={PAGE_META.data_info.subtitle} title={PAGE_META.data_info.title}>
      <ConsiderationTableReadonly items={inherited.data_info} />
    </SectionCard>
  );
}

function OtherInfoPage({ inherited }: { inherited: InheritedRfq }) {
  return (
    <SectionCard subtitle={PAGE_META.other_info.subtitle} title={PAGE_META.other_info.title}>
      <ConsiderationTableReadonly items={inherited.other_info} />
    </SectionCard>
  );
}

function ShotSketchPage({ inherited }: { inherited: InheritedRfq }) {
  const file = inherited.shot_sketch_file;

  function getExtColor(name: string) {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') return '#AA000F';
    if (ext === 'dwg') return '#1F3A61';
    return '#7F8FA3';
  }
  function getExtLabel(name: string) {
    return (name.split('.').pop()?.toUpperCase() ?? 'FILE').slice(0, 4);
  }

  return (
    <SectionCard subtitle={PAGE_META.shot_sketch.subtitle} title={PAGE_META.shot_sketch.title}>
      {file ? (
        <div className="flex items-center gap-4 rounded-[12px] border border-[rgba(217,222,229,0.92)] bg-[#f5f7fa] px-5 py-4">
          <span
            className="flex h-10 w-12 shrink-0 items-center justify-center rounded-[6px] text-[10px] font-bold uppercase tracking-[0.04em] text-white"
            style={{ backgroundColor: getExtColor(file.name) }}
          >
            {getExtLabel(file.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-[14px] font-semibold text-[var(--bocar-text)]">
              {file.name}
            </p>
            <p className="m-0 mt-0.5 text-[12px] text-[var(--bocar-blue-50)]">
              {formatFileSize(file.size)} · Uploaded by Industrialization
            </p>
          </div>
          <button
            className="shrink-0 rounded-[8px] border border-[#d9dee5] bg-white px-3 py-1.5 text-[12px] font-semibold text-[var(--bocar-blue-100)] transition hover:border-[var(--bocar-blue-70)]"
            type="button"
          >
            View file
          </button>
        </div>
      ) : (
        <div className="flex min-h-[100px] items-center justify-center rounded-[12px] border border-[rgba(217,222,229,0.92)] bg-[#f5f7fa] px-5 py-6 text-[13px] text-[var(--bocar-blue-30)]">
          No shot sketch was attached to this RFQ.
        </div>
      )}
    </SectionCard>
  );
}

function BasicDataPage() {
  const { register } = useFormContext<TrimmingQuotationValues>();
  return (
    <SectionCard subtitle={PAGE_META.basic_data.subtitle} title={PAGE_META.basic_data.title}>
      <FormGrid>
        <TextField label="COMPANY" name="basic_data.company" placeholder="Legal name" />
        <TextField
          label="ELABORATED BY"
          name="basic_data.elaborated_by"
          placeholder="Responsible person name"
        />
        <TextField label="COUNTRY" name="basic_data.country" placeholder="Country" />
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-70)]">
            BASE CURRENCY / EXCHANGE RATE TO
          </label>
          <select className={inputBaseClasses(false)} {...register('basic_data.currency')}>
            <option value="">—</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <TextField
          label="LAST EDITED BY"
          name="basic_data.last_edited_by"
          placeholder="Last editor"
        />
        <TextField label="LAST CHANGE" name="basic_data.last_change" type="date" />
      </FormGrid>
    </SectionCard>
  );
}

function PartGeometryPage({ inherited }: { inherited: InheritedRfq }) {
  const rows: { label: string; value: ReactNode }[] = [
    { label: 'Part Name', value: inherited.pg_part_name },
    { label: 'Part number', value: inherited.pg_part_number_geom },
    { label: 'Part dimension in mm', value: inherited.pg_part_dimension },
    { label: 'Min. wall thickness in mm', value: inherited.pg_min_wall_thickness },
    { label: 'Max. wall thickness in mm', value: inherited.pg_max_wall_thickness },
    { label: 'Projected area in cm²', value: inherited.pg_projected_area },
    { label: 'Surface in cm²', value: inherited.pg_surface },
    { label: 'Volume in cm³', value: inherited.pg_volume },
    { label: 'Gross weight in g', value: inherited.pg_gross_weight },
  ];

  return (
    <SectionCard subtitle={PAGE_META.part_geometry.subtitle} title={PAGE_META.part_geometry.title}>
      <SectionTableHeader col2="From RFQ" />
      <div className="divide-y divide-[rgba(236,240,245,0.9)]">
        {rows.map((row) => (
          <div key={row.label} className={ROW_CLASS}>
            <div className={LABEL_CLASS}>{row.label}</div>
            <ReadOnlyValueCell value={row.value} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ToolSpecPage({ inherited }: { inherited: InheritedRfq }) {
  return (
    <SectionCard subtitle={PAGE_META.tool_spec.subtitle} title={PAGE_META.tool_spec.title}>
      <FormGrid>
        <ReadOnlyField label="Press Type" value={inherited.press} />
        <ReadOnlyField label="Number of cavities" value={inherited.num_cavities} />
        <ReadOnlyField label="Introduction / Extraction Process" value={inherited.ts_intro_extraction} />
        <ReadOnlyField label="Biscuit Position" value={inherited.ts_biscuit_position} />
        <ReadOnlyField label="Number of hydr. slides" value={inherited.num_hydraulic_slides} />
        <ReadOnlyField label="Quantity of punch pins" value={inherited.ts_qty_punch_pins} />
        <ReadOnlyField label="Admissible residual Burr in mm" value={inherited.residual_burr_mm} />
        <ReadOnlyField label="Temperature of part when trimmed" value={inherited.ts_temp_trimmed} />
        <ReadOnlyField label="Gas Springs" value={inherited.gas_springs} />
        <ReadOnlyField label="Ejector system in fixed side" value={inherited.ts_ejector_fixed_side} />
        <TextField
          hint="Maximum weight capacity supported by the proposed trim die."
          label="MAXIMUM WEIGHT FOR THE TRIM DIE"
          name="ts_max_weight_trim_die"
          placeholder="e.g. 850 kg"
          required
          span={2}
        />
      </FormGrid>
    </SectionCard>
  );
}

function CommentsPage() {
  const { register } = useFormContext<TrimmingQuotationValues>();
  return (
    <SectionCard subtitle={PAGE_META.comments.subtitle} title={PAGE_META.comments.title}>
      <textarea
        className={`${inputBaseClasses(false)} resize-y`}
        placeholder="Additional comments for Purchasing..."
        rows={8}
        {...register('comments')}
      />
    </SectionCard>
  );
}

function MaterialCostsPage() {
  return (
    <SectionCard subtitle={PAGE_META.material_costs.subtitle} title={PAGE_META.material_costs.title}>
      <CostTable
        basePath="material_costs"
        columns={['unit', 'price_unit', 'total', 'weeks']}
        rows={[
          { key: 'raw_materials', label: '1. Raw materials' },
          { key: 'others', label: '2. Others' },
        ]}
        totalLabel="3. Total Material Costs Σ"
      />
    </SectionCard>
  );
}

function AccessoriesCostsPage() {
  return (
    <SectionCard subtitle={PAGE_META.accessories_costs.subtitle} title={PAGE_META.accessories_costs.title}>
      <CostTable
        basePath="accessories_costs"
        columns={['unit', 'price_unit', 'total', 'weeks']}
        rows={[
          { key: 'merkle_cylinders', label: '1. Merkle Cylinders' },
          { key: 'telemecanique', label: '2. Telemecanique limit switches' },
          { key: 'ifm_sensors', label: '3. IFM Sensors' },
          { key: 'air_devices', label: '4. Air Devices' },
          { key: 'others', label: '5. Others' },
        ]}
        totalLabel="6. Total Accesories Cost Σ"
      />
    </SectionCard>
  );
}

function ManufacturingCostsPage() {
  const { control } = useFormContext<TrimmingQuotationValues>();
  const machining = useWatch({ control, name: 'manufacturing.machining' });
  const manualWork = useWatch({ control, name: 'manufacturing.manual_work' });
  const heatSurface = useWatch({ control, name: 'manufacturing.heat_surface' });
  const engineering = useWatch({ control, name: 'manufacturing.engineering_design' });

  const sub1 = computeBranchSubtotal(
    machining as Record<string, Record<string, unknown> | undefined> | undefined,
    'h',
    'price'
  );
  const sub2 = computeBranchSubtotal(
    manualWork as Record<string, Record<string, unknown> | undefined> | undefined,
    'h',
    'price'
  );
  const sub3 = computeBranchSubtotal(
    heatSurface as Record<string, Record<string, unknown> | undefined> | undefined,
    'h',
    'price'
  );
  const sub4 = computeBranchSubtotal(
    engineering as Record<string, Record<string, unknown> | undefined> | undefined,
    'h',
    'price'
  );

  const grand = {
    h: sub1.left + sub2.left + sub3.left + sub4.left,
    price: sub1.price + sub2.price + sub3.price + sub4.price,
    total: sub1.total + sub2.total + sub3.total + sub4.total,
    weeks: sub1.weeks + sub2.weeks + sub3.weeks + sub4.weeks,
  };

  const grandInputClass =
    'w-full rounded-[10px] border border-[rgba(217,222,229,0.92)] bg-[#f5f7fa] px-3.5 py-2.5 text-[14px] font-semibold text-[var(--bocar-text)] outline-none cursor-not-allowed';

  return (
    <SectionCard
      subtitle={PAGE_META.manufacturing_costs.subtitle}
      title={PAGE_META.manufacturing_costs.title}
    >
      <div className="space-y-10">
        <CostTable
          basePath="manufacturing.machining"
          columns={['h', 'price', 'total', 'weeks']}
          rows={[
            { key: 'milling', label: 'Milling' },
            { key: 'turning', label: 'Turning' },
            { key: 'wire_cutting', label: 'Wire cutting' },
            { key: 'edm', label: 'EDM' },
            { key: 'grinding', label: 'Grinding' },
            { key: 'drilling', label: 'Drilling' },
            { key: 'others', label: 'Others' },
          ]}
          title="Machining"
          totalLabel="Total machining"
        />

        <CostTable
          basePath="manufacturing.manual_work"
          columns={['h', 'price', 'total', 'weeks']}
          rows={[
            { key: 'assembly', label: 'Assembly' },
            { key: 'spotting', label: 'Spotting' },
            { key: 'stripping_polishing', label: 'Stripping and polishing' },
            { key: 'others', label: 'Others' },
          ]}
          title="Manual Work"
          totalLabel="Total manual work Σ"
        />

        <CostTable
          basePath="manufacturing.heat_surface"
          columns={['h', 'price', 'total', 'weeks']}
          rows={[
            { key: 'hardening', label: 'Hardening' },
            { key: 'nitriding', label: 'Nitriding' },
            { key: 'coating', label: 'Coating' },
            { key: 'graining', label: 'Graining' },
            { key: 'others', label: 'Others' },
          ]}
          title="Heat and surface treatment"
          totalLabel="Total heat and surface treatment Σ"
        />

        <CostTable
          basePath="manufacturing.engineering_design"
          columns={['h', 'price', 'total', 'weeks']}
          hint="For Tool Replacement Trim Die, the cost for 'Design' is not included; only CAM and NC Programming."
          rows={[
            { key: 'design', label: 'Design' },
            { key: 'cam_nc', label: 'CAM and NC programming' },
            { key: 'others', label: 'Others' },
          ]}
          title="Engineering and Design"
          totalLabel="Total engineering and design Σ"
        />

        <div className="space-y-2">
          <div className="rounded-[10px] bg-[rgba(0,46,93,0.08)] px-3 py-3 md:grid md:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))] md:items-center md:gap-3">
            <div className="text-[13px] font-semibold text-[var(--bocar-text)]">
              Grand total manufacturing costs Σ
            </div>
            <input
              aria-label="Grand total h"
              className={grandInputClass}
              disabled
              tabIndex={-1}
              type="text"
              value={formatNum(grand.h)}
              readOnly
            />
            <input
              aria-label="Grand total Price/h"
              className={grandInputClass}
              disabled
              tabIndex={-1}
              type="text"
              value={formatNum(grand.price)}
              readOnly
            />
            <input
              aria-label="Grand total Total"
              className={grandInputClass}
              disabled
              tabIndex={-1}
              type="text"
              value={formatNum(grand.total)}
              readOnly
            />
            <input
              aria-label="Grand total Weeks"
              className={grandInputClass}
              disabled
              tabIndex={-1}
              type="text"
              value={formatNum(grand.weeks)}
              readOnly
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function TrimDieAdjustmentPage() {
  return (
    <SectionCard
      subtitle={PAGE_META.trim_die_adjustment.subtitle}
      title={PAGE_META.trim_die_adjustment.title}
    >
      <CostTable
        basePath="trim_die_adjustment"
        columns={['h', 'price', 'total', 'weeks']}
        rows={[
          { key: 'adjustment', label: '1. Adjustment' },
          { key: 'others', label: '2. Others' },
        ]}
        totalLabel="3. Grand total Σ"
      />
    </SectionCard>
  );
}

function LogisticsPage() {
  return (
    <SectionCard subtitle={PAGE_META.logistics.subtitle} title={PAGE_META.logistics.title}>
      <CostTable
        basePath="logistics"
        columns={['unit', 'price_unit', 'total', 'weeks']}
        hint="If the toolmaker isn't in Europe, use the 'Other costs' row to include any cost regarded to Transportation."
        rows={[
          { key: 'transport_to_btc', label: '1. Transportation Supplier facilities to BTC' },
          { key: 'transport_from_btc', label: '2. Transportation BTC to Supplier facilities' },
          { key: 'duty_costs', label: '3. Duty costs' },
          { key: 'cleaning_packaging', label: '4. Cleaning and Packaging' },
          { key: 'other_costs', label: '5. Other costs' },
        ]}
        totalLabel="6. Grand total Σ"
      />
    </SectionCard>
  );
}

function ToolReplacementPage() {
  return (
    <SectionCard subtitle={PAGE_META.tool_replacement.subtitle} title={PAGE_META.tool_replacement.title}>
      <CostTable
        basePath="tool_replacement"
        columns={['unit', 'price_unit', 'total', 'weeks']}
        hint="If this is the first quotation for the project, leave this section blank. If it is a Tool Replacement, complete it according to the Design Costs in the 'Die improvements for Tool Replacement Molds' deck."
        rows={[
          { key: 'die_improvements', label: '1. Die improvements design' },
          { key: 'others', label: '2. Others' },
        ]}
        totalLabel="3. Grand total Σ"
      />
    </SectionCard>
  );
}

function SparePartsPage() {
  const { control, register } = useFormContext<TrimmingQuotationValues>();
  const { fields } = useFieldArray({ control, name: 'spare_parts' });
  const watched = useWatch({ control, name: 'spare_parts' }) as
    | Array<{ unit?: string; price_unit?: string; weeks?: string }>
    | undefined;

  const totals = (watched ?? []).reduce(
    (acc, row) => {
      const u = parseNum(row?.unit);
      const p = parseNum(row?.price_unit);
      const w = parseNum(row?.weeks);
      acc.unit += u;
      acc.price += p;
      acc.total += u * p;
      acc.weeks += w;
      return acc;
    },
    { unit: 0, price: 0, total: 0, weeks: 0 }
  );

  const readonlyInputClass =
    'w-full rounded-[10px] border border-[rgba(217,222,229,0.92)] bg-[#f5f7fa] px-3.5 py-2.5 text-[14px] text-[var(--bocar-text)] outline-none cursor-not-allowed';
  const totalsInputClass = `${readonlyInputClass} font-semibold`;

  const gridClass =
    'grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.6fr)] md:items-center';
  const headerLabelClass =
    'text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]';

  return (
    <SectionCard subtitle={PAGE_META.spare_parts.subtitle} title={PAGE_META.spare_parts.title}>
      <div className="space-y-3">
        <p className="m-0 text-[12px] leading-[1.5] text-[var(--bocar-blue-50)]">
          Quote each spare part required by Bocar individually (according to the 'Trim Die Concept' deck or
          'Die Improvements'). The first two rows are fixed; add additional rows according to
          necesites.
        </p>

        <div className={`hidden border-b border-[rgba(217,222,229,0.86)] pb-3 md:grid ${gridClass}`}>
          <div className={headerLabelClass}>Concept</div>
          <div className={headerLabelClass}>Unit</div>
          <div className={headerLabelClass}>Price/u</div>
          <div className={headerLabelClass}>Total</div>
          <div className={headerLabelClass}>Weeks</div>
        </div>

        <div className="divide-y divide-[rgba(236,240,245,0.9)]">
          {fields.map((field, index) => {
            const row = watched?.[index];
            const totalValue = mul(row?.unit, row?.price_unit);
            const isFixed = index < 2;
            return (
              <div key={field.id} className={`py-3 ${gridClass}`}>
                {isFixed ? (
                  <span className="text-[13px] font-medium text-[var(--bocar-text)]">
                    {index + 1}. {field.concept}
                  </span>
                ) : (
                  <input
                    className={inputBaseClasses(false)}
                    placeholder="Spare part name"
                    {...register(`spare_parts.${index}.concept` as const)}
                  />
                )}
                <input
                  className={inputBaseClasses(false)}
                  placeholder="0"
                  step="0.01"
                  type="number"
                  {...register(`spare_parts.${index}.unit` as const)}
                />
                <input
                  className={inputBaseClasses(false)}
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  {...register(`spare_parts.${index}.price_unit` as const)}
                />
                <input
                  aria-label="Total"
                  className={readonlyInputClass}
                  disabled
                  tabIndex={-1}
                  type="text"
                  value={formatNum(totalValue)}
                  readOnly
                />
                <input
                  className={inputBaseClasses(false)}
                  placeholder="0"
                  step="0.01"
                  type="number"
                  {...register(`spare_parts.${index}.weeks` as const)}
                />
              </div>
            );
          })}
        </div>


        <div className={`mt-2 rounded-[10px] bg-[rgba(0,46,93,0.04)] px-3 py-3 ${gridClass}`}>
          <div className="text-[13px] font-semibold text-[var(--bocar-text)]">Grand total Σ</div>
          <input
            aria-label="Grand total Unit"
            className={totalsInputClass}
            disabled
            tabIndex={-1}
            type="text"
            value={formatNum(totals.unit)}
            readOnly
          />
          <input
            aria-label="Grand total Price/u"
            className={totalsInputClass}
            disabled
            tabIndex={-1}
            type="text"
            value={formatNum(totals.price)}
            readOnly
          />
          <input
            aria-label="Grand total Total"
            className={totalsInputClass}
            disabled
            tabIndex={-1}
            type="text"
            value={formatNum(totals.total)}
            readOnly
          />
          <input
            aria-label="Grand total Weeks"
            className={totalsInputClass}
            disabled
            tabIndex={-1}
            type="text"
            value={formatNum(totals.weeks)}
            readOnly
          />
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Cost and Timing Breakdown page ──────────────────────────────────────────

function CostAndTimingBreakdownPage() {
  const { control } = useFormContext<TrimmingQuotationValues>();
  const currency = useWatch({ control, name: 'basic_data.currency' }) as string | undefined;

  const bd = '1px solid rgba(217,222,229,0.92)';
  const RH = 34;

  const th1 = { background: 'rgba(0,46,93,0.08)', border: bd, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'var(--bocar-blue-100)', textAlign: 'center' as const, padding: '0 10px', whiteSpace: 'nowrap' as const };
  const th2 = { background: 'rgba(0,46,93,0.04)', border: bd, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'var(--bocar-blue-70)', textAlign: 'center' as const, padding: '0 10px', whiteSpace: 'nowrap' as const };
  const th3 = { background: 'rgba(0,46,93,0.02)', border: bd, fontSize: 10, color: 'var(--bocar-blue-50)', textAlign: 'center' as const, padding: '0 10px', whiteSpace: 'nowrap' as const };
  const sec = { border: bd, background: '#f5f7fa', fontSize: 12, fontWeight: 600, color: 'var(--bocar-blue-100)', textAlign: 'center' as const, padding: '0 10px', verticalAlign: 'middle' as const, whiteSpace: 'nowrap' as const };
  const secWrap = { border: bd, background: '#f5f7fa', fontSize: 11, fontWeight: 600, color: 'var(--bocar-blue-100)', textAlign: 'center' as const, padding: '4px 8px', verticalAlign: 'middle' as const };
  const tot = { border: bd, background: 'rgba(0,46,93,0.06)', fontSize: 12, fontWeight: 700, color: 'var(--bocar-blue-100)', textAlign: 'center' as const, padding: '0 10px', verticalAlign: 'middle' as const, whiteSpace: 'nowrap' as const };
  const lbl = { border: bd, background: '#ffffff', fontSize: 13, color: 'var(--bocar-text)', padding: '0 12px', overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const };
  const dat = { border: bd, background: '#ffffff', padding: 0 };
  const th0 = { border: 'none' as const, background: 'transparent' };
  const inp = { width: '100%', height: RH, border: 'none' as const, outline: 'none', padding: '0 10px', fontSize: 13, color: 'var(--bocar-text)', background: 'transparent', display: 'block' as const, boxSizing: 'border-box' as const };

  return (
    <SectionCard subtitle={PAGE_META.cost_and_timing_breakdown.subtitle} title={PAGE_META.cost_and_timing_breakdown.title}>
      <div className="overflow-x-auto">
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* ── TABLE 1: TRIM DIE 1 ───────────────────────────────────────────── */}
          <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 86 }} />
              <col style={{ width: 172 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 90 }} />
            </colgroup>
            <thead>
              <tr style={{ height: RH }}>
                <th colSpan={2} style={th0} />
                <th colSpan={2} style={th1}>TRIM DIE 1</th>
              </tr>
              <tr style={{ height: RH }}>
                <th colSpan={2} style={th0} />
                <th style={th2}>Price</th>
                <th style={th2}>Weeks</th>
              </tr>
              <tr style={{ height: RH }}>
                <th colSpan={2} style={{ ...th2, color: 'var(--bocar-blue-100)', fontWeight: 700 }}>SUMM</th>
                <th style={th3}>Price Breakdown</th>
                <th style={th3}>Time Breakdown</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ height: RH }}>
                <td rowSpan={3} style={secWrap}>DIE FAB</td>
                <td style={lbl}>Material cost</td>
                <td style={dat}><input style={inp} /></td>
                <td style={dat}><input style={inp} /></td>
              </tr>
              <tr style={{ height: RH }}>
                <td style={lbl}>Accessories</td>
                <td style={dat}><input style={inp} /></td>
                <td style={dat}><input style={inp} /></td>
              </tr>
              <tr style={{ height: RH }}>
                <td style={lbl}>Manufacturing cost</td>
                <td style={dat}><input style={inp} /></td>
                <td style={dat}><input style={inp} /></td>
              </tr>
              <tr style={{ height: RH }}>
                <td rowSpan={2} style={secWrap}>ACT REQ POST-F</td>
                <td style={lbl}>Adjustment</td>
                <td style={dat}><input style={inp} /></td>
                <td style={dat}><input style={inp} /></td>
              </tr>
              <tr style={{ height: RH }}>
                <td style={lbl}>Logistic cost</td>
                <td style={dat}><input style={inp} /></td>
                <td style={dat}><input style={inp} /></td>
              </tr>
              <tr style={{ height: RH }}>
                <td colSpan={2} style={tot}>GRAND TOTAL</td>
                <td style={dat}><input style={inp} /></td>
                <td style={dat}><input style={inp} /></td>
              </tr>
              <tr style={{ height: RH }}>
                <td colSpan={2} style={sec}>SPARE PARTS</td>
                <td style={dat}><input style={inp} /></td>
                <td style={dat}><input style={inp} /></td>
              </tr>
              <tr style={{ height: RH }}>
                <td colSpan={2} style={sec}>CURRENCY</td>
                <td colSpan={2} style={dat}>
                  <select
                    className="w-full h-full border-none bg-transparent text-[13px] text-[var(--bocar-text)] outline-none cursor-pointer px-3"
                    defaultValue={currency ?? 'USD'}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── TABLE 2: TRIM DIE 2 ───────────────────────────────────────────── */}
          <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 90 }} />
              <col style={{ width: 90 }} />
            </colgroup>
            <thead>
              <tr style={{ height: RH }}><th colSpan={2} style={th1}>TRIM DIE 2</th></tr>
              <tr style={{ height: RH }}><th style={th2}>Price</th><th style={th2}>Weeks</th></tr>
              <tr style={{ height: RH }}><th style={th3}>Price Breakdown</th><th style={th3}>Time Breakdown</th></tr>
            </thead>
            <tbody>
              {Array.from({ length: 7 }).map((_, i) => (
                <tr key={i} style={{ height: RH }}>
                  <td style={dat}><input style={inp} /></td>
                  <td style={dat}><input style={inp} /></td>
                </tr>
              ))}
              <tr style={{ height: RH }}>
                <td colSpan={2} style={dat}>
                  <select
                    className="w-full h-full border-none bg-transparent text-[13px] text-[var(--bocar-text)] outline-none cursor-pointer px-3"
                    defaultValue={currency ?? 'USD'}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>

      {/* Metadata — bottom right */}
      <div className="mt-8 flex justify-end">
        <div className="overflow-hidden rounded-[12px] border border-[rgba(217,222,229,0.92)] shadow-[0_4px_16px_rgba(0,46,93,0.06)]">
          <table style={{ borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td className="border-b border-r border-[rgba(217,222,229,0.92)] bg-[rgba(0,46,93,0.05)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-70)] whitespace-nowrap">SUPPLIER NAME</td>
                <td className="border-b border-[rgba(217,222,229,0.92)] p-2" colSpan={3} style={{ minWidth: 300 }}>
                  <input className="w-full rounded-[8px] border border-[rgba(217,222,229,0.92)] bg-white px-3 py-1.5 text-[13px] text-[var(--bocar-text)] outline-none transition focus:border-[var(--bocar-blue-70)] focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)]" />
                </td>
              </tr>
              <tr>
                <td className="border-b border-r border-[rgba(217,222,229,0.92)] bg-[rgba(0,46,93,0.05)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-70)] whitespace-nowrap">SIGNATURE</td>
                <td className="border-b border-[rgba(217,222,229,0.92)] p-2" colSpan={3}>
                  <input className="w-full rounded-[8px] border border-[rgba(217,222,229,0.92)] bg-white px-3 py-1.5 text-[13px] text-[var(--bocar-text)] outline-none transition focus:border-[var(--bocar-blue-70)] focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)]" />
                </td>
              </tr>
              <tr>
                <td className="border-b border-r border-[rgba(217,222,229,0.92)] bg-[rgba(0,46,93,0.05)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-70)] whitespace-nowrap">DATE</td>
                <td className="border-b border-[rgba(217,222,229,0.92)] p-2" colSpan={3}>
                  <input className="w-full rounded-[8px] border border-[rgba(217,222,229,0.92)] bg-white px-3 py-1.5 text-[13px] text-[var(--bocar-text)] outline-none transition focus:border-[var(--bocar-blue-70)] focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)]" />
                </td>
              </tr>
              <tr>
                <td className="border-r border-[rgba(217,222,229,0.92)] bg-[rgba(0,46,93,0.05)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-70)] whitespace-nowrap">PREPARED BY</td>
                <td className="p-2" colSpan={3}>
                  <input className="w-full rounded-[8px] border border-[rgba(217,222,229,0.92)] bg-white px-3 py-1.5 text-[13px] text-[var(--bocar-text)] outline-none transition focus:border-[var(--bocar-blue-70)] focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)]" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  );
}

function FilesPage() {
  return (
    <SectionCard subtitle={PAGE_META.files.subtitle} title={PAGE_META.files.title}>
      <MultiFileUploadField name="files" />
    </SectionCard>
  );
}

// ─── Definition factory ───────────────────────────────────────────────────────

export function buildTrimmingQuotationDefinition(
  rfqId: string,
  inheritedOverride?: InheritedRfq,
): RfqWorkspaceDefinition<TrimmingQuotationValues> {
  const inherited = inheritedOverride ?? getInheritedRfqMock(rfqId);

  function renderPage(page: string): ReactNode {
    if (page === 'basic') return <BasicPage inherited={inherited} />;
    if (page === 'trim_die') return <TrimDiePage inherited={inherited} />;
    if (page === 'data_info') return <DataInfoPage inherited={inherited} />;
    if (page === 'other_info') return <OtherInfoPage inherited={inherited} />;
    if (page === 'cost_and_timing_breakdown') return <CostAndTimingBreakdownPage />;
    if (page === 'shot_sketch') return <ShotSketchPage inherited={inherited} />;
    if (page === 'basic_data') return <BasicDataPage />;
    if (page === 'part_geometry') return <PartGeometryPage inherited={inherited} />;
    if (page === 'tool_spec') return <ToolSpecPage inherited={inherited} />;
    if (page === 'comments') return <CommentsPage />;
    if (page === 'material_costs') return <MaterialCostsPage />;
    if (page === 'accessories_costs') return <AccessoriesCostsPage />;
    if (page === 'manufacturing_costs') return <ManufacturingCostsPage />;
    if (page === 'trim_die_adjustment') return <TrimDieAdjustmentPage />;
    if (page === 'logistics') return <LogisticsPage />;
    if (page === 'tool_replacement') return <ToolReplacementPage />;
    if (page === 'spare_parts') return <SparePartsPage />;
    if (page === 'files') return <FilesPage />;
    return null;
  }

  return {
    resolver: zodResolver(trimmingQuotationSchema),
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
      if (fieldErrors.supplier) {
        setCurrentPage('basic');
        setFocus('supplier');
        return;
      }
      if (fieldErrors.ts_max_weight_trim_die) {
        setCurrentPage('tool_spec');
        setFocus('ts_max_weight_trim_die');
      }
    },
  };
}
