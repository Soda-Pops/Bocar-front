import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
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
import { formatNum } from '../shared/formulas';

// ─── Inherited RFQ data (mock) ────────────────────────────────────────────────

type ConsiderationItem = {
  label: string;
  checked: 'yes' | 'no' | '';
  notes: string;
};

export type InheritedMoldRfq = {
  // RFQ
  description: string;
  parts_per_year: string;
  customer: string;
  part_number: string;
  project_life: string;
  deliver_by: string;
  // Tool Engineering
  te_machine: string;
  te_num_cavities: string;
  te_num_hydraulic_slides: string;
  te_num_mech_slides: string;
  te_fully_automatic: 'yes' | 'no' | '';
  te_presence_detectors: 'yes' | 'no' | '';
  te_ejector_system: string;
  te_three_plate_mold: string;
  te_num_gates_per_part: string;
  // DCM (Die Casting Machine)
  dcm_model: string;
  dcm_locking_force: string;
  dcm_shot_weight: string;
  dcm_platen_dimension: string;
  dcm_tie_bar: string;
  // DCM SPECS captured by Industrialization (obfuscated keys), carried into the
  // Cost Breakdown Unit column as readonly values.
  dcm_no_hs: string; // No.ofHS (C15)
  dcm_jco: string; // Jco (C19)
  dcm_ihtcs: string; // Ihtcs (C21)
  dcm_spin: string; // Spin (C22)
  dcm_vac_v: string; // VacV (C27)
  dcm_chill_bl: string; // ChillBl (C28)
  dcm_oth: string; // Oth (C30)
  // Data Information Required in the Price of the Die
  diritpotd: ConsiderationItem[];
  // Other items
  other_items: ConsiderationItem[];
  // Other Information
  ot_inf: ConsiderationItem[];
  // Costs to Be Determined
  ctbd_items: ConsiderationItem[];
  // Part Geometry
  pg_part_name: string;
  pg_alloy: string;
  pg_part_number_geom: string;
  pg_part_dimension: string;
  pg_min_wall_thickness: string;
  pg_max_wall_thickness: string;
  pg_projected_area: string;
  pg_surface: string;
  pg_volume: string;
  pg_gross_weight: string;
  // Tool Specification
  ts_buhler_machine_ton: string;
  ts_num_cavities_sets: string;
  ts_three_plate_mold: string;
  ts_num_gates_per_part: string;
  ts_num_mech_slides: string;
  ts_num_hydr_slides: string;
  ts_num_parts_per_stroke: string;
  ts_num_tools: string;
};

function getInheritedMoldRfqMock(rfqId: string): InheritedMoldRfq {
  return {
    description: 'Front transmission housing',
    parts_per_year: '240,000',
    customer: 'Mercedes-Benz AG',
    part_number: `${rfqId.toUpperCase()}-MO`,
    project_life: '7 years',
    deliver_by: '2026-10-30',
    te_machine: 'Bühler 900T',
    te_num_cavities: '1x',
    te_num_hydraulic_slides: '2',
    te_num_mech_slides: '4',
    te_fully_automatic: 'yes',
    te_presence_detectors: 'yes',
    te_ejector_system: 'Ejector plate, 12 pins',
    te_three_plate_mold: '0',
    te_num_gates_per_part: '2',
    dcm_model: 'Bühler Carat 110',
    dcm_locking_force: '11,000 kN',
    dcm_shot_weight: '4.2 kg',
    dcm_platen_dimension: '1,100 × 950 mm',
    dcm_tie_bar: '730 × 730 mm',
    dcm_no_hs: '2',
    dcm_jco: '4',
    dcm_ihtcs: '3',
    dcm_spin: '1',
    dcm_vac_v: '2',
    dcm_chill_bl: '0',
    dcm_oth: '',
    diritpotd: [
      { label: 'Design 3D model', checked: 'yes', notes: 'Native CATIA V5 format.' },
      { label: 'Design 2D data', checked: 'yes', notes: 'PDF + DXF.' },
      { label: 'Manufacturing Proposals', checked: 'yes', notes: 'View M1 proposal.' },
      { label: 'Latest mold improvements', checked: 'yes', notes: 'Insert review.' },
      { label: 'Sketch of mold concept including steel dimensions', checked: 'yes', notes: '' },
      { label: 'Cooling circuit layout', checked: 'yes', notes: 'Circuit diagram v2.' },
    ],
    other_items: [
      { label: 'Frame Refurbishment', checked: 'yes', notes: '' },
      { label: 'Set of electric wires', checked: 'no', notes: '' },
      { label: 'Delivery date (pick-up by IMEX)', checked: 'yes', notes: '2026-09-15' },
      { label: 'Ejector system in fixed side', checked: 'yes', notes: '' },
      { label: 'Set of spare parts (recommended by tool maker)', checked: 'yes', notes: '' },
      { label: 'Hydraulic Cylinders and limit switches', checked: 'yes', notes: 'Bosch Rexroth.' },
    ],
    ot_inf: [
      { label: 'Mold No. 1', checked: 'yes', notes: '' },
      { label: 'Mold No. 2', checked: 'no', notes: '' },
      { label: 'Others', checked: 'no', notes: '' },
    ],
    ctbd_items: [
      { label: 'Vacuum system', checked: 'yes', notes: 'Required per drawing.' },
      { label: 'Temperature control unit', checked: 'yes', notes: 'External unit.' },
      { label: 'Sensor integration', checked: 'no', notes: '' },
      { label: 'Others', checked: 'no', notes: '' },
    ],
    pg_part_name: 'Front transmission housing',
    pg_alloy: 'AlSi9Cu3(Fe)',
    pg_part_number_geom: '0',
    pg_part_dimension: '410 × 260 × 95 mm',
    pg_min_wall_thickness: '2.5 mm',
    pg_max_wall_thickness: '18 mm',
    pg_projected_area: '680.00 cm²',
    pg_surface: '2,140.00 cm²',
    pg_volume: '520.80 cm³',
    pg_gross_weight: '1,410.00 g',
    ts_buhler_machine_ton: '900',
    ts_num_cavities_sets: '1',
    ts_three_plate_mold: '0',
    ts_num_gates_per_part: '2',
    ts_num_mech_slides: '4',
    ts_num_hydr_slides: '2',
    ts_num_parts_per_stroke: '1',
    ts_num_tools: '1',
  };
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const moneyCell = z.string().refine(
  (v) => v === '' || /^\d+(\.\d*)?$/.test(v),
  'Must be a valid number',
);
const hRow = z.object({ h: moneyCell, price: moneyCell, weeks: moneyCell });
const unitRow = z.object({ unit: moneyCell, price_unit: moneyCell, weeks: moneyCell });
const qRow = z.object({ q: moneyCell, price_q: moneyCell, weeks: moneyCell });

const moldBasicDataSchema = z.object({
  company: z.string(),
  elaborated_by: z.string(),
  country: z.string(),
  base_currency: z.string(),
  exchange_rate_to: z.string(),
  last_edited_by: z.string(),
  last_change: z.string(),
});

const moldAccessoriesCostsSchema = z.object({
  parker_hydraulic: unitRow,
  jet_cooling: unitRow,
  squeeze_pin: unitRow,
  interchangeable_inserts: unitRow,
  chill_blocks: unitRow,
  eyebolts: unitRow,
  oil_water_connectors: unitRow,
  lethiguel_distributor: unitRow,
  others: unitRow,
});

const moldMaterialCostsSchema = z.object({
  die_frame: unitRow,
  cavity: unitRow,
  steel_pipes_tubes: unitRow,
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

const moldEngineeringDesignSchema = z.object({
  design: hRow,
  cam_nc: hRow,
  simulation: hRow,
  others: hRow,
});

const moldManufacturingSchema = z.object({
  machining: machiningSchema,
  manual_work: manualWorkSchema,
  heat_surface: heatSurfaceSchema,
  engineering_design: moldEngineeringDesignSchema,
});

const correctionsOptimizationsSchema = z.object({
  measurement: hRow,
  dimensional_corrections: hRow,
  optimizations: hRow,
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

const samplingSchema = z.object({
  tryout_cost: qRow,
  measurement: qRow,
  others: qRow,
});

const moldSparePartsSchema = z.object({
  interchangeable_inserts: unitRow,
  core_pins: unitRow,
  inserts_spare: unitRow,
  others: unitRow,
});

const socAccessoriesCostsSchema = z.object({
  jet_cooling: unitRow,
  squeeze_pin: unitRow,
  interchangeable_inserts: unitRow,
  inserts_spare: unitRow,
  chill_blocks: unitRow,
  others: unitRow,
});

const socMaterialCostsSchema = z.object({
  raw_materials: unitRow,
  others: unitRow,
});

const socLogisticsSchema = z.object({
  cleaning_packaging: unitRow,
  other_costs: unitRow,
});

const socSparePartsSchema = z.object({
  interchangeable_inserts: unitRow,
  core_pins: unitRow,
  others: unitRow,
});

const moldQuotationSchema = z.object({
  supplier: z.string().trim().min(1, 'Enter the supplier name.'),
  ts_max_weight_mold: z.string().trim().min(1, 'Enter the maximum mold weight.'),
  comments: z.string(),
  basic_data: moldBasicDataSchema,
  accessories_costs: moldAccessoriesCostsSchema,
  material_costs: moldMaterialCostsSchema,
  manufacturing: moldManufacturingSchema,
  corrections_optimizations: correctionsOptimizationsSchema,
  logistics: logisticsSchema,
  tool_replacement: toolReplacementSchema,
  sampling: samplingSchema,
  spare_parts: moldSparePartsSchema,
  soc_accessories_costs: socAccessoriesCostsSchema,
  soc_material_costs: socMaterialCostsSchema,
  soc_manufacturing: moldManufacturingSchema,
  soc_corrections_optimizations: correctionsOptimizationsSchema,
  soc_logistics: socLogisticsSchema,
  soc_spare_parts: socSparePartsSchema,
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

type MoldQuotationValues = z.infer<typeof moldQuotationSchema>;

// ─── Navigation ───────────────────────────────────────────────────────────────

type PageKey =
  | 'rfq'
  | 'tool_eng'
  | 'dcm'
  | 'diritpotd'
  | 'other'
  | 'ot_inf'
  | 'ctbd'
  | 'basic_data'
  | 'part_geometry'
  | 'tool_spec'
  | 'comments'
  | 'accessories_costs'
  | 'material_costs'
  | 'manufacturing_costs'
  | 'corrections_optimizations'
  | 'logistics'
  | 'tool_replacement'
  | 'sampling'
  | 'spare_parts'
  | 'soc_accessories_costs'
  | 'soc_material_costs'
  | 'soc_manufacturing_costs'
  | 'soc_corrections_optimizations'
  | 'soc_logistics'
  | 'soc_spare_parts'
  | 'files';

const PAGES: readonly PageKey[] = [
  'rfq',
  'tool_eng',
  'dcm',
  'diritpotd',
  'other',
  'ot_inf',
  'ctbd',
  'basic_data',
  'part_geometry',
  'tool_spec',
  'comments',
  'accessories_costs',
  'material_costs',
  'manufacturing_costs',
  'corrections_optimizations',
  'logistics',
  'tool_replacement',
  'sampling',
  'spare_parts',
  'soc_accessories_costs',
  'soc_material_costs',
  'soc_manufacturing_costs',
  'soc_corrections_optimizations',
  'soc_logistics',
  'soc_spare_parts',
  'files',
];

const PAGE_META: Record<PageKey, PageMeta> = {
  rfq: {
    navLabel: 'RFQ',
    subtitle: 'Inherited RFQ data. Enter the supplier name.',
    title: '1. RFQ',
  },
  tool_eng: {
    navLabel: 'TOOL ENG.',
    subtitle: 'Mold engineering specifications captured by Industrialization.',
    title: '2. Tool Engineering',
  },
  dcm: {
    navLabel: 'DCM',
    subtitle: 'Die casting machine data assigned to this mold.',
    title: '3. Die Casting Machine',
  },
  diritpotd: {
    navLabel: 'DIRITPOTD',
    subtitle: 'Technical deliverables required in the mold price, as defined by Industrialization.',
    title: '4. Data Information Required in the Price of the Die',
  },
  other: {
    navLabel: 'OTHER',
    subtitle: 'Other required deliverables and services, as defined by Industrialization.',
    title: '5. Other',
  },
  ot_inf: {
    navLabel: 'OT INF',
    subtitle: 'Additional mold information.',
    title: '6. Other Information',
  },
  ctbd: {
    navLabel: 'CTBD',
    subtitle: 'Cost and Timing Breakdown',
    title: '8. CTBD',
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
    subtitle: 'Tooling specifications. Add the maximum mold weight.',
    title: '3. Tool Specification',
  },
  comments: {
    navLabel: 'COMMENTS',
    subtitle: 'Additional notes for the Purchasing team.',
    title: '4. Comments',
  },
  accessories_costs: {
    navLabel: 'ACCESORIES COSTS',
    subtitle: 'Standard mold accessory costs.',
    title: '5. Accesories Costs',
  },
  material_costs: {
    navLabel: 'MATERIAL COSTS',
    subtitle: 'Purchased parts and raw material costs.',
    title: '6. Material Costs (Purchased Parts and Raw Materials)',
  },
  manufacturing_costs: {
    navLabel: 'MANUFACTURING COSTS',
    subtitle: 'Process times and costs by category.',
    title: '7. Manufacturing Costs (Process Times and Costs)',
  },
  corrections_optimizations: {
    navLabel: 'CORRECTIONS AND OPTIMIZATIONS',
    subtitle: 'Hours and costs for mold corrections and optimizations.',
    title: '8. Corrections and Optimizations',
  },
  logistics: {
    navLabel: 'LOGISTICS',
    subtitle: 'Logistics costs associated with the mold.',
    title: '9. Logistics',
  },
  tool_replacement: {
    navLabel: 'TOOL REPLACEMENT',
    subtitle: 'Tooling replacement costs, if applicable.',
    title: '10. Tool Replacement',
  },
  sampling: {
    navLabel: 'SAMPLING',
    subtitle: 'Mold sampling and testing costs.',
    title: '11. Sampling',
  },
  spare_parts: {
    navLabel: 'SPARE PARTS',
    subtitle: 'Spare part costs required for the mold.',
    title: '12. Spare Parts',
  },
  soc_accessories_costs: {
    navLabel: 'ACCESORIES COSTS',
    subtitle: 'Accessory costs specific to the cavity set.',
    title: '1. Accesories Costs',
  },
  soc_material_costs: {
    navLabel: 'MATERIAL COSTS',
    subtitle: 'Raw material costs for the cavity set.',
    title: '2. Material Costs (Purchased Parts and Raw Materials)',
  },
  soc_manufacturing_costs: {
    navLabel: 'MANUFACTURING COSTS',
    subtitle: 'Process times and costs for the cavity set.',
    title: '3. Manufacturing Costs (Process Times and Costs)',
  },
  soc_corrections_optimizations: {
    navLabel: 'CORRECTIONS AND OPTIMIZATIONS',
    subtitle: 'Correction and optimization hours and costs for the cavity set.',
    title: '4. Corrections and Optimizations',
  },
  soc_logistics: {
    navLabel: 'LOGISTICS',
    subtitle: 'Logistics costs for the cavity set.',
    title: '5. Logistics',
  },
  soc_spare_parts: {
    navLabel: 'SPARE PARTS',
    subtitle: 'Spare part costs for the cavity set.',
    title: '6. Spare Parts',
  },
  files: {
    navLabel: 'FILES',
    subtitle: 'Attach supporting files for this quotation (PPT, STP, PDF).',
    title: 'Files',
  },
};

const NAV_GROUPS: readonly NavGroup[] = [
  {
    key: 'MOLD',
    label: 'MOLD',
    items: [
      { key: 'rfq', label: 'RFQ' },
      { key: 'tool_eng', label: 'TOOL ENG.' },
      { key: 'dcm', label: 'DCM' },
      { key: 'diritpotd', label: 'DIRITPOTD' },
      { key: 'other', label: 'OTHER' },
      { key: 'ot_inf', label: 'OT INF' },
      { key: 'ctbd', label: 'CTBD' },
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
      { key: 'accessories_costs', label: 'ACCESORIES COSTS' },
      { key: 'material_costs', label: 'MATERIAL COSTS' },
      { key: 'manufacturing_costs', label: 'MANUFACTURING COSTS' },
      { key: 'corrections_optimizations', label: 'CORRECTIONS AND OPTIMIZATIONS' },
      { key: 'logistics', label: 'LOGISTICS' },
      { key: 'tool_replacement', label: 'TOOL REPLACEMENT' },
      { key: 'sampling', label: 'SAMPLING' },
      { key: 'spare_parts', label: 'SPARE PARTS' },
    ],
  },
  {
    key: 'SET_OF_CAVITIES',
    label: 'SET OF CAVITIES',
    items: [
      { key: 'soc_accessories_costs', label: 'ACCESORIES COSTS' },
      { key: 'soc_material_costs', label: 'MATERIAL COSTS' },
      { key: 'soc_manufacturing_costs', label: 'MANUFACTURING COSTS' },
      { key: 'soc_corrections_optimizations', label: 'CORRECTIONS AND OPTIMIZATIONS' },
      { key: 'soc_logistics', label: 'LOGISTICS' },
      { key: 'soc_spare_parts', label: 'SPARE PARTS' },
    ],
  },
  {
    key: 'FILES',
    label: 'FILES',
    items: [{ key: 'files', label: 'FILES' }],
  },
];

const REQUIRED_FIELDS_BY_PAGE: Partial<Record<PageKey, readonly FieldPath<MoldQuotationValues>[]>> = {
  rfq: ['supplier'],
  tool_spec: ['ts_max_weight_mold'],
};

// ─── Default values ───────────────────────────────────────────────────────────

function emptyHRow() {
  return { h: '', price: '', weeks: '' };
}
function emptyUnitRow() {
  return { unit: '', price_unit: '', weeks: '' };
}
function emptyQRow() {
  return { q: '', price_q: '', weeks: '' };
}

function getCreateDefaultValues(): MoldQuotationValues {
  return {
    supplier: '',
    ts_max_weight_mold: '',
    comments: '',
    basic_data: {
      company: '',
      elaborated_by: '',
      country: '',
      base_currency: '',
      exchange_rate_to: '',
      last_edited_by: '',
      last_change: '',
    },
    accessories_costs: {
      parker_hydraulic: emptyUnitRow(),
      jet_cooling: emptyUnitRow(),
      squeeze_pin: emptyUnitRow(),
      interchangeable_inserts: emptyUnitRow(),
      chill_blocks: emptyUnitRow(),
      eyebolts: emptyUnitRow(),
      oil_water_connectors: emptyUnitRow(),
      lethiguel_distributor: emptyUnitRow(),
      others: emptyUnitRow(),
    },
    material_costs: {
      die_frame: emptyUnitRow(),
      cavity: emptyUnitRow(),
      steel_pipes_tubes: emptyUnitRow(),
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
        simulation: emptyHRow(),
        others: emptyHRow(),
      },
    },
    corrections_optimizations: {
      measurement: emptyHRow(),
      dimensional_corrections: emptyHRow(),
      optimizations: emptyHRow(),
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
    sampling: {
      tryout_cost: emptyQRow(),
      measurement: emptyQRow(),
      others: emptyQRow(),
    },
    spare_parts: {
      interchangeable_inserts: emptyUnitRow(),
      core_pins: emptyUnitRow(),
      inserts_spare: emptyUnitRow(),
      others: emptyUnitRow(),
    },
    soc_accessories_costs: {
      jet_cooling: emptyUnitRow(),
      squeeze_pin: emptyUnitRow(),
      interchangeable_inserts: emptyUnitRow(),
      inserts_spare: emptyUnitRow(),
      chill_blocks: emptyUnitRow(),
      others: emptyUnitRow(),
    },
    soc_material_costs: {
      raw_materials: emptyUnitRow(),
      others: emptyUnitRow(),
    },
    soc_manufacturing: {
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
        simulation: emptyHRow(),
        others: emptyHRow(),
      },
    },
    soc_corrections_optimizations: {
      measurement: emptyHRow(),
      dimensional_corrections: emptyHRow(),
      optimizations: emptyHRow(),
      others: emptyHRow(),
    },
    soc_logistics: {
      cleaning_packaging: emptyUnitRow(),
      other_costs: emptyUnitRow(),
    },
    soc_spare_parts: {
      interchangeable_inserts: emptyUnitRow(),
      core_pins: emptyUnitRow(),
      others: emptyUnitRow(),
    },
    files: [],
  };
}

function getEditDefaultValues(quotationId?: string): MoldQuotationValues {
  const base = getCreateDefaultValues();
  return {
    ...base,
    supplier: 'Moldeo Industrial SA',
    ts_max_weight_mold: '3,200 kg',
    comments: `Quotation linked to ${(quotationId ?? 'COT-001').toUpperCase()}.`,
    basic_data: {
      company: 'Moldeo Industrial SA',
      elaborated_by: 'Patricia Rios',
      country: 'Mexico',
      base_currency: 'EUR',
      exchange_rate_to: 'MXN',
      last_edited_by: 'Patricia Rios',
      last_change: '2026-05-20',
    },
    material_costs: {
      ...base.material_costs,
      die_frame: { unit: '1', price_unit: '18500.00', weeks: '6' },
      cavity: { unit: '1', price_unit: '22000.00', weeks: '8' },
    },
    manufacturing: {
      ...base.manufacturing,
      machining: {
        ...base.manufacturing.machining,
        milling: { h: '280', price: '75', weeks: '6' },
        turning: { h: '60', price: '70', weeks: '3' },
      },
    },
  };
}

// ─── Completion / error maps ──────────────────────────────────────────────────

function getCompletedMap(values: MoldQuotationValues): Partial<Record<string, boolean>> {
  return {
    rfq: values.supplier.trim().length > 0,
    tool_spec: values.ts_max_weight_mold.trim().length > 0,
  };
}

function getPageErrorMap(
  errors: Parameters<RfqWorkspaceDefinition<MoldQuotationValues>['getPageErrorMap']>[0]
): Partial<Record<string, boolean>> {
  return {
    rfq: Boolean(errors.supplier),
    tool_spec: Boolean(errors.ts_max_weight_mold),
  };
}

const getDraftPageErrorMap = getPageErrorMap;
const getSubmitPageErrorMap = getPageErrorMap;

// ─── Shared readonly display primitives ──────────────────────────────────────

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

function SectionTableHeader({ col1 = 'Description', col2 = 'From RFQ' }: { col1?: string; col2?: string }) {
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

function ConsiderationTableReadonly({ items }: { items: ConsiderationItem[] }) {
  return (
    <>
      <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,0.55fr)_minmax(0,1.85fr)] gap-5 border-b border-[rgba(217,222,229,0.86)] pb-3 md:grid">
        {(['Description', 'Applies', 'Notes'] as const).map((h) => (
          <div key={h} className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
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

// ─── MOLD group pages ─────────────────────────────────────────────────────────

function MoldRfqPage({ inherited }: { inherited: InheritedMoldRfq }) {
  return (
    <SectionCard subtitle={PAGE_META.rfq.subtitle} title={PAGE_META.rfq.title}>
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

function ToolEngPage({ inherited }: { inherited: InheritedMoldRfq }) {
  const rows: { label: string; value: ReactNode }[] = [
    { label: 'Machine', value: inherited.te_machine },
    { label: 'No. of cavities', value: inherited.te_num_cavities },
    { label: 'No. of hydraulic slides', value: inherited.te_num_hydraulic_slides },
    { label: 'No. of mechanical slides', value: inherited.te_num_mech_slides },
    { label: 'Fully automatic process', value: <YesNoBadge value={inherited.te_fully_automatic} /> },
    { label: 'Presence detectors', value: <YesNoBadge value={inherited.te_presence_detectors} /> },
    { label: 'Ejector system', value: inherited.te_ejector_system },
    { label: 'Three plate mold', value: inherited.te_three_plate_mold },
    { label: 'No. of gates per part', value: inherited.te_num_gates_per_part },
  ];

  return (
    <SectionCard subtitle={PAGE_META.tool_eng.subtitle} title={PAGE_META.tool_eng.title}>
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

function DcmPage({ inherited }: { inherited: InheritedMoldRfq }) {
  const rows: { label: string; value: ReactNode }[] = [
    { label: 'Machine model', value: inherited.dcm_model },
    { label: 'Locking force', value: inherited.dcm_locking_force },
    { label: 'Shot weight', value: inherited.dcm_shot_weight },
    { label: 'Platen dimension', value: inherited.dcm_platen_dimension },
    { label: 'Tie bar distance', value: inherited.dcm_tie_bar },
  ];

  return (
    <SectionCard subtitle={PAGE_META.dcm.subtitle} title={PAGE_META.dcm.title}>
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

function DiritpotdPage({ inherited }: { inherited: InheritedMoldRfq }) {
  return (
    <SectionCard subtitle={PAGE_META.diritpotd.subtitle} title={PAGE_META.diritpotd.title}>
      <ConsiderationTableReadonly items={inherited.diritpotd} />
    </SectionCard>
  );
}

function MoldOtherPage({ inherited }: { inherited: InheritedMoldRfq }) {
  return (
    <SectionCard subtitle={PAGE_META.other.subtitle} title={PAGE_META.other.title}>
      <ConsiderationTableReadonly items={inherited.other_items} />
    </SectionCard>
  );
}

function OtInfPage({ inherited }: { inherited: InheritedMoldRfq }) {
  return (
    <SectionCard subtitle={PAGE_META.ot_inf.subtitle} title={PAGE_META.ot_inf.title}>
      <ConsiderationTableReadonly items={inherited.ot_inf} />
    </SectionCard>
  );
}

function CtbdPage() {
  const { control } = useFormContext<MoldQuotationValues>();
  const currency = useWatch({ control, name: 'basic_data.base_currency' }) as string | undefined;

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
const spa = { border: 'none' as const, background: 'transparent' };
  const th0 = { border: 'none' as const, background: 'transparent' };
  const inp = { width: '100%', height: RH, border: 'none' as const, outline: 'none', padding: '0 10px', fontSize: 13, color: 'var(--bocar-text)', background: 'transparent', display: 'block' as const, boxSizing: 'border-box' as const };

  return (
    <SectionCard subtitle={PAGE_META.ctbd.subtitle} title={PAGE_META.ctbd.title}>
      <div className="overflow-x-auto">
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* ── TABLE 1: M 1 ──────────────────────────────────────────────────── */}
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
                <th colSpan={2} style={th1}>M 1</th>
              </tr>
              <tr style={{ height: RH }}>
                <th colSpan={2} style={th0} />
                <th style={th2}>Pr</th>
                <th style={th2}>Weeks</th>
              </tr>
              <tr style={{ height: RH }}>
                <th colSpan={2} style={{ ...th2, color: 'var(--bocar-blue-100)', fontWeight: 700 }}>SUMM</th>
                <th style={th3}>Pr BD</th>
                <th style={th3}>T BD</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ height: RH }}>
                <td rowSpan={3} style={secWrap}>D FAB</td>
                <td style={lbl}>Mat cst (pur pt &amp; rw mat)</td>
                <td style={dat}><input style={inp} /></td>
                <td style={dat}><input style={inp} /></td>
              </tr>
              <tr style={{ height: RH }}>
                <td style={lbl}>Accs</td>
                <td style={dat}><input style={inp} /></td>
                <td style={dat}><input style={inp} /></td>
              </tr>
              <tr style={{ height: RH }}>
                <td style={lbl}>Man cst</td>
                <td style={dat}><input style={inp} /></td>
                <td style={dat}><input style={inp} /></td>
              </tr>
              <tr style={{ height: RH }}>
                <td rowSpan={2} style={secWrap}>ACT REQ POST-F</td>
                <td style={lbl}>Corr, opt and meas</td>
                <td style={dat}><input style={inp} /></td>
                <td style={dat}><input style={inp} /></td>
              </tr>
              <tr style={{ height: RH }}>
                <td style={lbl}>Log cst</td>
                <td style={dat}><input style={inp} /></td>
                <td style={dat}><input style={inp} /></td>
              </tr>
              <tr style={{ height: RH }}>
                <td colSpan={2} style={tot}>GR TOT</td>
                <td style={dat}><input style={inp} /></td>
                <td style={dat}><input style={inp} /></td>
              </tr>
              <tr style={{ height: RH }}>
                <td colSpan={2} style={sec}>SAMP IN SUPP FAC</td>
                <td style={dat}><input style={inp} /></td>
                <td style={dat}><input style={inp} /></td>
              </tr>
              <tr style={{ height: RH }}>
                <td colSpan={2} style={sec}>SP PT</td>
                <td style={dat}><input style={inp} /></td>
                <td style={dat}><input style={inp} /></td>
              </tr>
              <tr style={{ height: RH }}>
                <td colSpan={2} style={sec}>CURR</td>
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

          {/* ── TABLE 2: TOOL REP ─────────────────────────────────────────────── */}
          <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 90 }} />
              <col style={{ width: 90 }} />
            </colgroup>
            <thead>
              <tr style={{ height: RH }}><th colSpan={2} style={th1}>TOOL REP</th></tr>
              <tr style={{ height: RH }}><th style={th2}>Pr</th><th style={th2}>Weeks</th></tr>
              <tr style={{ height: RH }}><th style={th3}>Pr BD</th><th style={th3}>T BD</th></tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} style={{ height: RH }}>
                  <td style={dat}><input style={inp} /></td>
                  <td style={dat}><input style={inp} /></td>
                </tr>
              ))}
              <tr style={{ height: RH }}><td style={spa} /><td style={spa} /></tr>
            </tbody>
          </table>

          {/* ── TABLE 3: SET OF CAV ───────────────────────────────────────────── */}
          <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 90 }} />
              <col style={{ width: 90 }} />
            </colgroup>
            <thead>
              <tr style={{ height: RH }}><th colSpan={2} style={th1}>SET OF CAV</th></tr>
              <tr style={{ height: RH }}><th style={th2}>Pr</th><th style={th2}>Weeks</th></tr>
              <tr style={{ height: RH }}><th style={th3}>Pr BD</th><th style={th3}>T BD</th></tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} style={{ height: RH }}>
                  <td style={dat}><input style={inp} /></td>
                  <td style={dat}><input style={inp} /></td>
                </tr>
              ))}
              <tr style={{ height: RH }}><td style={spa} /><td style={spa} /></tr>
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
                <td className="border-b border-r border-[rgba(217,222,229,0.92)] bg-[rgba(0,46,93,0.05)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-70)] whitespace-nowrap">SUPP</td>
                <td className="border-b border-[rgba(217,222,229,0.92)] p-2" colSpan={3} style={{ minWidth: 300 }}>
                  <input className="w-full rounded-[8px] border border-[rgba(217,222,229,0.92)] bg-white px-3 py-1.5 text-[13px] text-[var(--bocar-text)] outline-none transition focus:border-[var(--bocar-blue-70)] focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)]" />
                </td>
              </tr>
              <tr>
                <td className="border-b border-r border-[rgba(217,222,229,0.92)] bg-[rgba(0,46,93,0.05)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-70)] whitespace-nowrap">SIGN</td>
                <td className="border-b border-[rgba(217,222,229,0.92)] p-2" colSpan={3}>
                  <input className="w-full rounded-[8px] border border-[rgba(217,222,229,0.92)] bg-white px-3 py-1.5 text-[13px] text-[var(--bocar-text)] outline-none transition focus:border-[var(--bocar-blue-70)] focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)]" />
                </td>
              </tr>
              <tr>
                <td className="border-b border-r border-[rgba(217,222,229,0.92)] bg-[rgba(0,46,93,0.05)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-70)] whitespace-nowrap">DATE</td>
                <td className="border-b border-r border-[rgba(217,222,229,0.92)] p-2" style={{ minWidth: 130 }}>
                  <input className="w-full rounded-[8px] border border-[rgba(217,222,229,0.92)] bg-white px-3 py-1.5 text-[13px] text-[var(--bocar-text)] outline-none transition focus:border-[var(--bocar-blue-70)] focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)]" />
                </td>
                <td className="border-b border-r border-[rgba(217,222,229,0.92)] bg-[rgba(0,46,93,0.05)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-70)] whitespace-nowrap">QT No</td>
                <td className="border-b border-[rgba(217,222,229,0.92)] p-2" style={{ minWidth: 130 }}>
                  <input className="w-full rounded-[8px] border border-[rgba(217,222,229,0.92)] bg-white px-3 py-1.5 text-[13px] text-[var(--bocar-text)] outline-none transition focus:border-[var(--bocar-blue-70)] focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)]" />
                </td>
              </tr>
              <tr>
                <td className="border-r border-[rgba(217,222,229,0.92)] bg-[rgba(0,46,93,0.05)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-70)] whitespace-nowrap">PREP</td>
                <td className="border-r border-[rgba(217,222,229,0.92)] p-2">
                  <input className="w-full rounded-[8px] border border-[rgba(217,222,229,0.92)] bg-white px-3 py-1.5 text-[13px] text-[var(--bocar-text)] outline-none transition focus:border-[var(--bocar-blue-70)] focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)]" />
                </td>
                <td className="border-r border-[rgba(217,222,229,0.92)] bg-[rgba(0,46,93,0.05)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-70)] whitespace-nowrap">INC.</td>
                <td className="p-2">
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

// ─── COST BREAKDOWN pages ─────────────────────────────────────────────────────

function MoldBasicDataPage() {
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
        <TextField
          label="BASE CURRENCY"
          name="basic_data.base_currency"
          placeholder="e.g. EUR"
        />
        <TextField
          label="EXCHANGE RATE TO"
          name="basic_data.exchange_rate_to"
          placeholder="e.g. MXN"
        />
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

function MoldPartGeometryPage({ inherited }: { inherited: InheritedMoldRfq }) {
  const rows: { label: string; value: ReactNode }[] = [
    { label: 'Part Name', value: inherited.pg_part_name },
    { label: 'Alloy', value: inherited.pg_alloy },
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

function MoldToolSpecPage({ inherited }: { inherited: InheritedMoldRfq }) {
  return (
    <SectionCard subtitle={PAGE_META.tool_spec.subtitle} title={PAGE_META.tool_spec.title}>
      <FormGrid>
        <ReadOnlyField label="Bühler Machine Ton" value={inherited.ts_buhler_machine_ton} />
        <ReadOnlyField label="Number of cavities/sets" value={inherited.ts_num_cavities_sets} />
        <ReadOnlyField label="Three plate mold" value={inherited.ts_three_plate_mold} />
        <ReadOnlyField label="Number of gates per part" value={inherited.ts_num_gates_per_part} />
        <ReadOnlyField label="Number of mech. slides" value={inherited.ts_num_mech_slides} />
        <ReadOnlyField label="Number of hydr. slides" value={inherited.ts_num_hydr_slides} />
        <ReadOnlyField label="Number of parts per stroke" value={inherited.ts_num_parts_per_stroke} />
        <ReadOnlyField label="Number of tools" value={inherited.ts_num_tools} />
        <TextField
          hint="Maximum weight capacity supported by the proposed mold."
          label="MAXIMUM WEIGHT FOR THE MOLD"
          name="ts_max_weight_mold"
          placeholder="e.g. 3,200 kg"
          required
          span={2}
        />
      </FormGrid>
    </SectionCard>
  );
}

function MoldCommentsPage() {
  const { register } = useFormContext<MoldQuotationValues>();
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

function MoldAccessoriesCostsPage() {
  return (
    <SectionCard subtitle={PAGE_META.accessories_costs.subtitle} title={PAGE_META.accessories_costs.title}>
      <CostTable
        basePath="accessories_costs"
        columns={['unit', 'price_unit', 'total', 'weeks']}
        hint="Unit values marked as readonly were captured by Industrialization in the RFQ (DCM) and cannot be edited."
        rows={[
          { key: 'parker_hydraulic', label: '1. Parker Hydraulic Cylinders & Square D limit switches', unitReadOnly: true },
          { key: 'jet_cooling', label: '2. Jet cooling', unitReadOnly: true },
          { key: 'squeeze_pin', label: '3. Squeeze pin', unitReadOnly: true },
          { key: 'interchangeable_inserts', label: '4. Interchangeable inserts', unitReadOnly: true },
          { key: 'chill_blocks', label: '5. Chill Blocks / Vacuum Valves', unitReadOnly: true },
          { key: 'eyebolts', label: '6. Eyebolts' },
          { key: 'oil_water_connectors', label: '7. Oil and Water Connectors' },
          { key: 'lethiguel_distributor', label: '8. Lethiguel Distributor' },
          { key: 'others', label: '9. Others', unitReadOnly: true },
        ]}
        totalLabel="10. Total Accesories Cost Σ"
      />
    </SectionCard>
  );
}

function MoldMaterialCostsPage() {
  return (
    <SectionCard subtitle={PAGE_META.material_costs.subtitle} title={PAGE_META.material_costs.title}>
      <CostTable
        basePath="material_costs"
        columns={['unit', 'price_unit', 'total', 'weeks']}
        rows={[
          { key: 'die_frame', label: '1. Die frame' },
          { key: 'cavity', label: '2. Cavity' },
          { key: 'steel_pipes_tubes', label: '3. Steel Pipes Tubes' },
          { key: 'others', label: '4. Others' },
        ]}
        totalLabel="5. Total Material Costs Σ"
      />
    </SectionCard>
  );
}

function MoldManufacturingCostsPage() {
  const { control } = useFormContext<MoldQuotationValues>();
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
    <SectionCard subtitle={PAGE_META.manufacturing_costs.subtitle} title={PAGE_META.manufacturing_costs.title}>
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
          hint="For Tool Replacement Molds, the cost for 'Design' is not included; only CAM and NC Programming."
          rows={[
            { key: 'design', label: 'Design' },
            { key: 'cam_nc', label: 'CAM and NC programming' },
            { key: 'simulation', label: 'Simulation (In case that the tool engineer requires it)' },
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
            <input aria-label="Grand total h" className={grandInputClass} disabled tabIndex={-1} type="text" value={formatNum(grand.h)} readOnly />
            <input aria-label="Grand total Price/h" className={grandInputClass} disabled tabIndex={-1} type="text" value={formatNum(grand.price)} readOnly />
            <input aria-label="Grand total Total" className={grandInputClass} disabled tabIndex={-1} type="text" value={formatNum(grand.total)} readOnly />
            <input aria-label="Grand total Weeks" className={grandInputClass} disabled tabIndex={-1} type="text" value={formatNum(grand.weeks)} readOnly />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function CorrectionsOptimizationsPage() {
  return (
    <SectionCard subtitle={PAGE_META.corrections_optimizations.subtitle} title={PAGE_META.corrections_optimizations.title}>
      <CostTable
        basePath="corrections_optimizations"
        columns={['h', 'price', 'total', 'weeks']}
        rows={[
          { key: 'measurement', label: '1. Measurement of the Mold' },
          { key: 'dimensional_corrections', label: '2. Dimensional corrections of the Tool' },
          { key: 'optimizations', label: '3. Optimizations' },
          { key: 'others', label: '4. Others' },
        ]}
        totalLabel="5. Grand total Σ"
      />
    </SectionCard>
  );
}

function MoldLogisticsPage() {
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

function MoldToolReplacementPage() {
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

function SamplingPage() {
  return (
    <SectionCard subtitle={PAGE_META.sampling.subtitle} title={PAGE_META.sampling.title}>
      <CostTable
        basePath="sampling"
        columns={['q', 'price_q', 'total', 'weeks']}
        rows={[
          { key: 'tryout_cost', label: '1. Tryout cost' },
          { key: 'measurement', label: '2. Measurement' },
          { key: 'others', label: '3. Others' },
        ]}
        totalLabel="4. Total sampling Σ"
      />
    </SectionCard>
  );
}

function MoldSparePartsPage() {
  return (
    <SectionCard subtitle={PAGE_META.spare_parts.subtitle} title={PAGE_META.spare_parts.title}>
      <CostTable
        basePath="spare_parts"
        columns={['unit', 'price_unit', 'total', 'weeks']}
        hint="Unit values marked as readonly were captured by Industrialization in the RFQ (DCM) and cannot be edited."
        rows={[
          { key: 'interchangeable_inserts', label: '1. Interchangeable inserts', unitReadOnly: true },
          { key: 'core_pins', label: '2. Core Pins', unitReadOnly: true },
          { key: 'inserts_spare', label: '3. Inserts as spare parts' },
          { key: 'others', label: '4. Others', unitReadOnly: true },
        ]}
        totalLabel="5. Grand total Σ"
      />
    </SectionCard>
  );
}

// ─── SET OF CAVITIES pages ────────────────────────────────────────────────────

function SocAccessoriesCostsPage() {
  return (
    <SectionCard subtitle={PAGE_META.soc_accessories_costs.subtitle} title={PAGE_META.soc_accessories_costs.title}>
      <CostTable
        basePath="soc_accessories_costs"
        columns={['unit', 'price_unit', 'total', 'weeks']}
        rows={[
          { key: 'jet_cooling', label: '1. Jet cooling' },
          { key: 'squeeze_pin', label: '2. Squeeze pin' },
          { key: 'interchangeable_inserts', label: '3. Interchangeable inserts' },
          { key: 'inserts_spare', label: '4. Inserts as spare parts' },
          { key: 'chill_blocks', label: '5. Chill Blocks' },
          { key: 'others', label: '6. Others' },
        ]}
        totalLabel="7. Total accesories Σ"
      />
    </SectionCard>
  );
}

function SocMaterialCostsPage() {
  return (
    <SectionCard subtitle={PAGE_META.soc_material_costs.subtitle} title={PAGE_META.soc_material_costs.title}>
      <CostTable
        basePath="soc_material_costs"
        columns={['unit', 'price_unit', 'total', 'weeks']}
        rows={[
          { key: 'raw_materials', label: '1. Raw materials' },
          { key: 'others', label: '2. Others' },
        ]}
        totalLabel="3. Total material costs Σ"
      />
    </SectionCard>
  );
}

function SocManufacturingCostsPage() {
  const { control } = useFormContext<MoldQuotationValues>();
  const machining = useWatch({ control, name: 'soc_manufacturing.machining' });
  const manualWork = useWatch({ control, name: 'soc_manufacturing.manual_work' });
  const heatSurface = useWatch({ control, name: 'soc_manufacturing.heat_surface' });
  const engineering = useWatch({ control, name: 'soc_manufacturing.engineering_design' });

  const sub1 = computeBranchSubtotal(
    machining as Record<string, Record<string, unknown> | undefined> | undefined, 'h', 'price'
  );
  const sub2 = computeBranchSubtotal(
    manualWork as Record<string, Record<string, unknown> | undefined> | undefined, 'h', 'price'
  );
  const sub3 = computeBranchSubtotal(
    heatSurface as Record<string, Record<string, unknown> | undefined> | undefined, 'h', 'price'
  );
  const sub4 = computeBranchSubtotal(
    engineering as Record<string, Record<string, unknown> | undefined> | undefined, 'h', 'price'
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
    <SectionCard subtitle={PAGE_META.soc_manufacturing_costs.subtitle} title={PAGE_META.soc_manufacturing_costs.title}>
      <div className="space-y-10">
        <CostTable
          basePath="soc_manufacturing.machining"
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
          basePath="soc_manufacturing.manual_work"
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
          basePath="soc_manufacturing.heat_surface"
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
          basePath="soc_manufacturing.engineering_design"
          columns={['h', 'price', 'total', 'weeks']}
          hint="For Tool Replacement Molds, the cost for 'Design' is not included; only CAM and NC Programming."
          rows={[
            { key: 'design', label: 'Design' },
            { key: 'cam_nc', label: 'CAM and NC programming' },
            { key: 'simulation', label: 'Simulation (In case that the tool engineer requires it)' },
            { key: 'others', label: 'Others' },
          ]}
          title="Engineering and Design"
          totalLabel="Total engineering and design Σ"
        />
        <div className="space-y-2">
          <div className="rounded-[10px] bg-[rgba(0,46,93,0.08)] px-3 py-3 md:grid md:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))] md:items-center md:gap-3">
            <div className="text-[13px] font-semibold text-[var(--bocar-text)]">Grand total manufacturing costs Σ</div>
            <input aria-label="Grand total h" className={grandInputClass} disabled tabIndex={-1} type="text" value={formatNum(grand.h)} readOnly />
            <input aria-label="Grand total Price/h" className={grandInputClass} disabled tabIndex={-1} type="text" value={formatNum(grand.price)} readOnly />
            <input aria-label="Grand total Total" className={grandInputClass} disabled tabIndex={-1} type="text" value={formatNum(grand.total)} readOnly />
            <input aria-label="Grand total Weeks" className={grandInputClass} disabled tabIndex={-1} type="text" value={formatNum(grand.weeks)} readOnly />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function SocCorrectionsOptimizationsPage() {
  return (
    <SectionCard subtitle={PAGE_META.soc_corrections_optimizations.subtitle} title={PAGE_META.soc_corrections_optimizations.title}>
      <CostTable
        basePath="soc_corrections_optimizations"
        columns={['h', 'price', 'total', 'weeks']}
        rows={[
          { key: 'measurement', label: '1. Measurement of the Mold' },
          { key: 'dimensional_corrections', label: '2. Dimensional corrections of the Tool' },
          { key: 'optimizations', label: '3. Optimizations' },
          { key: 'others', label: '4. Others' },
        ]}
        totalLabel="5. Total corrections and optimizations Σ"
      />
    </SectionCard>
  );
}

function SocLogisticsPage() {
  return (
    <SectionCard subtitle={PAGE_META.soc_logistics.subtitle} title={PAGE_META.soc_logistics.title}>
      <CostTable
        basePath="soc_logistics"
        columns={['unit', 'price_unit', 'total', 'weeks']}
        rows={[
          { key: 'cleaning_packaging', label: '1. Cleaning and Packaging' },
          { key: 'other_costs', label: '2. Other costs' },
        ]}
        totalLabel="3. Total logistics Σ"
      />
    </SectionCard>
  );
}

function SocSparePartsPage() {
  return (
    <SectionCard subtitle={PAGE_META.soc_spare_parts.subtitle} title={PAGE_META.soc_spare_parts.title}>
      <CostTable
        basePath="soc_spare_parts"
        columns={['unit', 'price_unit', 'total', 'weeks']}
        rows={[
          { key: 'interchangeable_inserts', label: '1. Interchangeable inserts' },
          { key: 'core_pins', label: '2. Core Pins' },
          { key: 'others', label: '3. Others' },
        ]}
        totalLabel="4. Total Spare Parts Σ"
      />
    </SectionCard>
  );
}

// ─── Definition factory ───────────────────────────────────────────────────────

/** A DCM spec counts as "filled" when it is non-empty and not numerically zero. */
function isNonZeroSpec(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const n = Number(trimmed);
  return Number.isNaN(n) ? true : n !== 0;
}

export function buildMoldQuotationDefinition(
  rfqId: string,
  inheritedOverride?: InheritedMoldRfq,
): RfqWorkspaceDefinition<MoldQuotationValues> {
  const inherited = inheritedOverride ?? getInheritedMoldRfqMock(rfqId);

  // Chill Blocks / Vacuum Valves is a single Cost Breakdown row: only one of
  // VacV (C27) / ChillBl (C28) comes filled (≠ 0) from Industrialization.
  const chillOrVac = isNonZeroSpec(inherited.dcm_vac_v)
    ? inherited.dcm_vac_v
    : isNonZeroSpec(inherited.dcm_chill_bl)
      ? inherited.dcm_chill_bl
      : '';

  // Pre-fills the Unit cells that the supplier no longer captures: their value
  // comes from the DCM SPECS entered by Industrialization in the RFQ. The
  // matching rows are rendered readonly (`unitReadOnly`) in the pages above.
  function withInheritedUnits(values: MoldQuotationValues): MoldQuotationValues {
    return {
      ...values,
      accessories_costs: {
        ...values.accessories_costs,
        parker_hydraulic: { ...values.accessories_costs.parker_hydraulic, unit: inherited.dcm_no_hs || '0' },
        jet_cooling: { ...values.accessories_costs.jet_cooling, unit: inherited.dcm_jco || '0' },
        squeeze_pin: { ...values.accessories_costs.squeeze_pin, unit: inherited.dcm_spin || '0' },
        interchangeable_inserts: { ...values.accessories_costs.interchangeable_inserts, unit: inherited.dcm_ihtcs || '0' },
        chill_blocks: { ...values.accessories_costs.chill_blocks, unit: chillOrVac || '0' },
        others: { ...values.accessories_costs.others, unit: inherited.dcm_oth || '0' },
      },
      spare_parts: {
        ...values.spare_parts,
        interchangeable_inserts: { ...values.spare_parts.interchangeable_inserts, unit: inherited.dcm_ihtcs || '0' },
        core_pins: { ...values.spare_parts.core_pins, unit: inherited.dcm_jco || '0' },
        others: { ...values.spare_parts.others, unit: inherited.dcm_oth || '0' },
      },
    };
  }

  function FilesPage() {
    return (
      <SectionCard subtitle={PAGE_META.files.subtitle} title={PAGE_META.files.title}>
        <MultiFileUploadField
          accept=".ppt,.pptx,.stp,.pdf"
          acceptLabel="PPT, STP, PDF"
          maxSizeMb={25}
          name="files"
        />
      </SectionCard>
    );
  }

  function renderPage(page: string): ReactNode {
    if (page === 'rfq') return <MoldRfqPage inherited={inherited} />;
    if (page === 'tool_eng') return <ToolEngPage inherited={inherited} />;
    if (page === 'dcm') return <DcmPage inherited={inherited} />;
    if (page === 'diritpotd') return <DiritpotdPage inherited={inherited} />;
    if (page === 'other') return <MoldOtherPage inherited={inherited} />;
    if (page === 'ot_inf') return <OtInfPage inherited={inherited} />;
    if (page === 'ctbd') return <CtbdPage />;
    if (page === 'basic_data') return <MoldBasicDataPage />;
    if (page === 'part_geometry') return <MoldPartGeometryPage inherited={inherited} />;
    if (page === 'tool_spec') return <MoldToolSpecPage inherited={inherited} />;
    if (page === 'comments') return <MoldCommentsPage />;
    if (page === 'accessories_costs') return <MoldAccessoriesCostsPage />;
    if (page === 'material_costs') return <MoldMaterialCostsPage />;
    if (page === 'manufacturing_costs') return <MoldManufacturingCostsPage />;
    if (page === 'corrections_optimizations') return <CorrectionsOptimizationsPage />;
    if (page === 'logistics') return <MoldLogisticsPage />;
    if (page === 'tool_replacement') return <MoldToolReplacementPage />;
    if (page === 'sampling') return <SamplingPage />;
    if (page === 'spare_parts') return <MoldSparePartsPage />;
    if (page === 'soc_accessories_costs') return <SocAccessoriesCostsPage />;
    if (page === 'soc_material_costs') return <SocMaterialCostsPage />;
    if (page === 'soc_manufacturing_costs') return <SocManufacturingCostsPage />;
    if (page === 'soc_corrections_optimizations') return <SocCorrectionsOptimizationsPage />;
    if (page === 'soc_logistics') return <SocLogisticsPage />;
    if (page === 'soc_spare_parts') return <SocSparePartsPage />;
    if (page === 'files') return <FilesPage />;
    return null;
  }

  return {
    resolver: zodResolver(moldQuotationSchema),
    draftResolver: zodResolver(moldQuotationSchema),
    submitResolver: zodResolver(moldQuotationSchema),
    getCreateDefaultValues: () => withInheritedUnits(getCreateDefaultValues()),
    getEditDefaultValues: (id?: string) => withInheritedUnits(getEditDefaultValues(id)),
    pages: PAGES,
    navGroups: NAV_GROUPS,
    pageMeta: PAGE_META,
    requiredFieldsByPage: REQUIRED_FIELDS_BY_PAGE,
    draftRequiredFieldsByPage: REQUIRED_FIELDS_BY_PAGE,
    submitRequiredFieldsByPage: REQUIRED_FIELDS_BY_PAGE,
    renderPage,
    getCompletedMap,
    getPageErrorMap,
    getDraftPageErrorMap,
    getSubmitPageErrorMap,
    onInvalidSubmit: (fieldErrors, { setCurrentPage, setFocus }) => {
      if (fieldErrors.supplier) {
        setCurrentPage('rfq');
        setFocus('supplier');
        return;
      }
      if (fieldErrors.ts_max_weight_mold) {
        setCurrentPage('tool_spec');
        setFocus('ts_max_weight_mold');
      }
    },
  };
}
