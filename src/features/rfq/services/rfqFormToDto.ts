import type { RfqTipo } from '@/features/analytics/types';
import type { MoldFormValues } from '@/features/rfq/components/RfqForm/definitions/moldDefinition';
import type { TrimmingFormValues } from '@/features/rfq/components/RfqForm/definitions/trimmingDefinition';

type FormValues = MoldFormValues | TrimmingFormValues;
export type RfqPayloadMode = 'draft' | 'submit';

function appendString(fd: FormData, key: string, value: unknown, mode: RfqPayloadMode): void {
  if (value === null || value === undefined) {
    if (mode === 'submit') fd.append(key, '');
    return;
  }
  if (value === '' && mode === 'draft') return;
  fd.append(key, String(value));
}

function appendNumber(fd: FormData, key: string, value: unknown, mode: RfqPayloadMode): void {
  if (value === null || value === undefined || value === '') {
    if (mode === 'submit') fd.append(key, '0');
    return;
  }
  const n = Number(value);
  if (!Number.isNaN(n)) {
    fd.append(key, String(n));
  } else if (mode === 'submit') {
    fd.append(key, '0');
  }
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function fallbackDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
}

function appendDate(fd: FormData, key: string, value: unknown, mode: RfqPayloadMode): void {
  if (isIsoDate(value)) {
    fd.append(key, value);
  } else if (mode === 'submit') {
    fd.append(key, fallbackDueDate());
  }
}

function splitDimension(value: string): string[] {
  return value.split(/[xX,* ]+/).filter(Boolean);
}

function checkedToBoolean(value: string | undefined): boolean {
  return value === 'yes' || value === 'true';
}

function appendConsideration(
  fd: FormData,
  values: Record<string, { checked?: string; notes: string }>,
  frontendKey: string,
  backendKey: string,
  mode: RfqPayloadMode,
): void {
  const item = values[frontendKey];
  if (!item && mode === 'draft') return;
  fd.append(backendKey, String(checkedToBoolean(item?.checked)));
  appendString(fd, `${backendKey}_note`, item?.notes ?? '', mode);
}

const moldConsiderationMap: Record<string, string> = {
  d_3d: 'D_3D',
  flan: 'FlAn',
  run_des: 'Run_des',
  run_over: 'Run_and_over_mod',
  man_prop: 'ManProp',
  ldi: 'Ldi',
  add_mach: 'Add_of_mach_st',
  sketch: 'Sketch_d_conc_inc_s_dim',
  drw_2d: 'D2_Dr_Des_PDF_CNF',
  drw_3d: 'D3_Mod_solid_Native',
  comp_d: 'Comp_Die',
  subseq_d: 'Subseq_D',
  repl_h13: 'Set_of_repl_H13',
  sp_ei: 'Sp_set_of_EI',
  ficf: 'FICF',
  hcls: 'HCLS',
  fr_refur: 'Fr_Refur',
  eyeb: 'Eyeb',
  ow_conn: 'Oil_Water_Conn',
  stm: 'STM_1and2',
  cmm_rep: 'CMM_dim_rep_cai',
  gom_rep: 'GOM_rep_ass',
  h_val: 'H_val_subc_in',
  dim_corr: 'Dim_corr_opt',
  sp_pt: 'Sp_Pt',
};

const moldSpecMap: Record<string, string> = {
  smach: 'SMACH',
  no_cav: 'No_CAV',
  no_hs: 'No_ofHS',
  no_ms: 'No_ofMS',
  third_p_supp: 'ThirdPSupp',
  no_subc: 'No_subc',
  jco: 'Jco',
  qc_sys: 'QcSys',
  ihtcs: 'Ihtcs',
  spin: 'Spin',
  hics: 'HICS',
  cm_gom: 'CMGOM',
  sp_thermo: 'SPforThermoR',
  n_return_v: 'NReturnV',
  vac_v: 'VacV',
  chill_bl: 'ChillBl',
  no_pl_jco: 'No_Pl_Jco_sys',
  ctbd: 'Oth',
};

const numericMoldSpecKeys = new Set(['no_hs', 'no_ms']);

const trimmingConsiderationMap: Record<string, string> = {
  // Data Information (sección 3)
  design_3d: 'di_design_3d_model',
  design_2d: 'di_design_2d_data',
  punch_pins: 'di_punch_pins_data',
  manuf_proposals: 'di_manufacturing_proposals',
  latest_improvements: 'di_latest_trim_die_improvements',
  sketch_concept: 'di_sketch_trim_die_concept',
  // Other Information (sección 4) — toggles con patrón estándar booleano + _note
  trim_die_1: 'di_trim_die_no1',
  trim_die_2: 'di_trim_die_no2',
  spare_parts_set: 'di_set_of_spare_parts',
  hydraulic_cyl: 'di_hydraulic_cylinders_limit_sw',
  frame_refur: 'oi_frame_refurbishment',
  elec_wires: 'oi_set_of_electric_wires',
};

function appendFiles(fd: FormData, values: FormValues): void {
  for (const item of values.files ?? []) {
    if (item.file) fd.append('archivos', item.file);
  }
}

function moldToFormData(values: MoldFormValues, mode: RfqPayloadMode): FormData {
  const fd = new FormData();
  fd.append('due_date', isIsoDate(values.dtq) ? values.dtq : fallbackDueDate());
  appendDate(fd, 'DTQ', values.dtq, mode);
  appendString(fd, 'DESC', values.rfq_name, mode);
  appendString(fd, 'CUST', values.cust, mode);
  appendString(fd, 'PT', values.part_tech || values.part_name, mode);
  appendString(fd, 'part_name', values.part_name, mode);
  appendString(fd, 'PNUM', values.pnum || values.part_number, mode);
  appendNumber(fd, 'PPY', values.ppy, mode);
  appendNumber(fd, 'PRLF', values.prlf, mode);
  appendString(fd, 'TT', values.tt, mode);
  appendString(fd, 'ELAB', values.elab, mode);
  appendString(fd, 'SMACH', values.buhler, mode);
  appendString(fd, 'No_CAV', values.num_cav, mode);
  appendNumber(fd, 'No_ofHS', values.hydr_slides || values.considerations.no_hs?.notes, mode);
  appendNumber(fd, 'No_ofMS', values.mech_slides, mode);
  appendString(fd, 'alloy', values.alloy, mode);
  const [length, width, height] = splitDimension(values.part_dim);
  appendNumber(fd, 'part_dim_length_mm', length, mode);
  appendNumber(fd, 'part_dim_width_mm', width, mode);
  appendNumber(fd, 'part_dim_height_mm', height, mode);
  appendNumber(fd, 'min_wall_thickness_mm', values.wall_min, mode);
  appendNumber(fd, 'max_wall_thickness_mm', values.wall_max, mode);
  appendNumber(fd, 'projected_area_cm2', values.projected, mode);
  appendNumber(fd, 'surface_cm2', values.surface, mode);
  appendNumber(fd, 'volume_cm3', values.volume, mode);
  appendNumber(fd, 'gross_weight_g', values.weight, mode);
  appendNumber(fd, 'three_plate_mold', values.three_plate, mode);
  appendNumber(fd, 'number_of_gates_per_part', values.gates, mode);
  appendNumber(fd, 'number_of_parts_per_stroke', values.parts_stroke, mode);
  appendNumber(fd, 'number_of_tools', values.num_tools, mode);
  appendString(fd, 'comments', values.comments, mode);

  Object.entries(moldSpecMap).forEach(([frontendKey, backendKey]) => {
    if (numericMoldSpecKeys.has(frontendKey)) {
      appendNumber(fd, backendKey, values.considerations[frontendKey]?.notes, mode);
    } else {
      appendString(fd, backendKey, values.considerations[frontendKey]?.notes, mode);
    }
  });

  Object.entries(moldConsiderationMap).forEach(([frontendKey, backendKey]) => {
    appendConsideration(fd, values.considerations, frontendKey, backendKey, mode);
  });
  appendFiles(fd, values);
  return fd;
}

function trimmingToFormData(values: TrimmingFormValues, mode: RfqPayloadMode): FormData {
  const fd = new FormData();
  // ─── 1. RFQ ───────────────────────────────────────────────────────────────
  fd.append('due_date', isIsoDate(values.deliver_by) ? values.deliver_by : fallbackDueDate());
  appendDate(fd, 'DTQ', values.deliver_by, mode);
  appendString(fd, 'DESC', values.description, mode);
  appendString(fd, 'CUST', values.customer, mode);
  appendString(fd, 'PNUM', values.part_number, mode);
  appendNumber(fd, 'PPY', values.parts_per_year, mode);
  appendNumber(fd, 'PRLF', values.project_life, mode);
  appendString(fd, 'previous_job', values.previous_job, mode);
  // ─── 2. Trim Die ──────────────────────────────────────────────────────────
  appendString(fd, 'press', values.press, mode);
  appendString(fd, 'no_of_cavities', values.num_cavities, mode);
  appendString(fd, 'no_of_hydraulic_slides', values.num_hydraulic_slides, mode);
  appendString(fd, 'fully_automatic_process', values.fully_automatic, mode);
  appendString(fd, 'presence_detectors', values.presence_detectors, mode);
  appendString(fd, 'trimming_process_condition', values.trimming_condition, mode);
  fd.append('punch_pins_required', String(checkedToBoolean(values.punch_pins_required)));
  appendNumber(fd, 'admissible_residual_burr_mm', values.residual_burr_mm, mode);
  appendString(fd, 'castings_supplied_by_auma', values.castings_by_auma, mode);
  appendString(fd, 'adjustments_optimization_at_tool', values.adjustments_toolmaker, mode);
  appendString(fd, 'gas_springs', values.gas_springs, mode);
  // ─── 6. Part Geometry ─────────────────────────────────────────────────────
  appendString(fd, 'part_name', values.pg_part_name || values.description, mode);
  appendString(fd, 'part_number', values.pg_part_number_geom || values.part_number, mode);
  appendString(fd, 'part_dimension', values.pg_part_dimension, mode);
  appendNumber(fd, 'min_wall_thickness_mm', values.pg_min_wall_thickness, mode);
  appendNumber(fd, 'max_wall_thickness_mm', values.pg_max_wall_thickness, mode);
  appendNumber(fd, 'projected_area_cm2', values.pg_projected_area, mode);
  appendNumber(fd, 'surface_cm2', values.pg_surface, mode);
  appendNumber(fd, 'volume_cm3', values.pg_volume, mode);
  appendNumber(fd, 'gross_weight_g', values.pg_gross_weight, mode);
  // ─── 7. Tool Specification ────────────────────────────────────────────────
  // "Press Type" reutiliza el input de press, así que press_type espeja press.
  appendString(fd, 'press_type', values.press, mode);
  appendString(fd, 'introduction_extraction_process', values.ts_intro_extraction, mode);
  appendString(fd, 'biscuit_position', values.ts_biscuit_position, mode);
  appendString(fd, 'quantity_of_punch_pins', values.ts_qty_punch_pins, mode);
  appendString(fd, 'temperature_when_trimmed', values.ts_temp_trimmed, mode);
  appendString(fd, 'oi_ejector_system_fixed_side', values.ts_ejector_fixed_side, mode);
  // ─── 8. Comments ──────────────────────────────────────────────────────────
  appendString(fd, 'comments', values.comments, mode);

  // ─── 3 y 4. Considerations (toggle booleano + _note) ──────────────────────
  Object.entries(trimmingConsiderationMap).forEach(([frontendKey, backendKey]) => {
    appendConsideration(fd, values.considerations, frontendKey, backendKey, mode);
  });

  // Other Information con claves de backend que no siguen el sufijo _note
  const other = values.considerations.others;
  fd.append('oi_others_applies', String(checkedToBoolean(other?.checked)));
  appendString(fd, 'oi_others', other?.notes ?? '', mode);

  const delivery = values.considerations.delivery_date;
  fd.append('oi_delivery_date_imex_applies', String(checkedToBoolean(delivery?.checked)));
  if (isIsoDate(delivery?.notes)) {
    fd.append('oi_delivery_date_imex', delivery!.notes);
  }

  const ejector = values.considerations.ejector_fixed;
  fd.append('oi_ejector_fixed_applies', String(checkedToBoolean(ejector?.checked)));
  appendString(fd, 'oi_ejector_fixed_note', ejector?.notes ?? '', mode);

  appendFiles(fd, values);
  return fd;
}

export function rfqFormToFormData(
  tipo: RfqTipo,
  values: FormValues,
  mode: RfqPayloadMode = 'draft',
): FormData {
  return tipo === 'Mold'
    ? moldToFormData(values as MoldFormValues, mode)
    : trimmingToFormData(values as TrimmingFormValues, mode);
}

