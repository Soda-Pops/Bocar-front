import type { RfqTipo } from '@/features/analytics/types';
import type { MoldFormValues } from '@/features/rfq/components/RfqForm/definitions/moldDefinition';
import type { TrimmingFormValues } from '@/features/rfq/components/RfqForm/definitions/trimmingDefinition';

type FormValues = MoldFormValues | TrimmingFormValues;

function appendIfPresent(fd: FormData, key: string, value: unknown): void {
  if (value === null || value === undefined || value === '') return;
  fd.append(key, String(value));
}

function appendNumber(fd: FormData, key: string, value: unknown): void {
  if (value === null || value === undefined || value === '') return;
  const n = Number(value);
  if (!Number.isNaN(n)) fd.append(key, String(n));
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function fallbackDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
}

function checkedToBoolean(value: string | undefined): boolean {
  return value === 'yes' || value === 'true';
}

function appendConsideration(
  fd: FormData,
  values: Record<string, { checked?: string; notes: string }>,
  frontendKey: string,
  backendKey: string,
): void {
  const item = values[frontendKey];
  if (!item) return;
  fd.append(backendKey, String(checkedToBoolean(item.checked)));
  appendIfPresent(fd, `${backendKey}_note`, item.notes);
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

const trimmingConsiderationMap: Record<string, string> = {
  design_3d: 'di_design_3d_model',
  design_2d: 'di_design_2d_data',
  punch_pins: 'di_punch_pins_data',
  manuf_proposals: 'di_manufacturing_proposals',
  latest_improvements: 'di_latest_trim_die_improvements',
  sketch_concept: 'di_sketch_trim_die_concept',
  trim_die_1: 'di_trim_die_no1',
  trim_die_2: 'di_trim_die_no2',
  spare_parts_set: 'di_set_of_spare_parts',
  hydraulic_cyl: 'di_hydraulic_cylinders_limit_sw',
};

function appendFiles(fd: FormData, values: FormValues): void {
  for (const item of values.files ?? []) {
    if (item.file) fd.append('archivos', item.file);
  }
}

function moldToFormData(values: MoldFormValues): FormData {
  const fd = new FormData();
  fd.append('due_date', isIsoDate(values.dtq) ? values.dtq : fallbackDueDate());
  appendIfPresent(fd, 'DESC', values.rfq_name);
  appendIfPresent(fd, 'CUST', values.cust);
  appendIfPresent(fd, 'PT', values.part_tech || values.part_name);
  appendIfPresent(fd, 'PNUM', values.pnum || values.part_number);
  appendNumber(fd, 'PPY', values.ppy);
  appendNumber(fd, 'PRLF', values.prlf);
  appendIfPresent(fd, 'TT', values.tt);
  appendIfPresent(fd, 'ELAB', values.elab);
  appendIfPresent(fd, 'SMACH', values.buhler);
  appendIfPresent(fd, 'No_CAV', values.num_cav);
  appendNumber(fd, 'No_ofHS', values.hydr_slides || values.considerations.no_hs?.notes);
  appendNumber(fd, 'No_ofMS', values.mech_slides);
  appendIfPresent(fd, 'Jco', values.considerations.jco?.notes);
  appendIfPresent(fd, 'Ihtcs', values.considerations.ihtcs?.notes);
  appendIfPresent(fd, 'Spin', values.considerations.spin?.notes);
  appendIfPresent(fd, 'VacV', values.considerations.vac_v?.notes);
  appendIfPresent(fd, 'ChillBl', values.considerations.chill_bl?.notes);
  appendIfPresent(fd, 'Oth', values.considerations.ctbd?.notes);
  appendIfPresent(fd, 'alloy', values.alloy);
  appendNumber(fd, 'min_wall_thickness_mm', values.wall_min);
  appendNumber(fd, 'max_wall_thickness_mm', values.wall_max);
  appendNumber(fd, 'projected_area_cm2', values.projected);
  appendNumber(fd, 'surface_cm2', values.surface);
  appendNumber(fd, 'volume_cm3', values.volume);
  appendNumber(fd, 'gross_weight_g', values.weight);
  appendNumber(fd, 'number_of_gates_per_part', values.gates);
  appendNumber(fd, 'number_of_parts_per_stroke', values.parts_stroke);
  appendNumber(fd, 'number_of_tools', values.num_tools);
  appendIfPresent(fd, 'comments', values.comments);

  Object.entries(moldConsiderationMap).forEach(([frontendKey, backendKey]) => {
    appendConsideration(fd, values.considerations, frontendKey, backendKey);
  });
  if (values.sk_part?.file) fd.append('archivos', values.sk_part.file);
  appendFiles(fd, values);
  return fd;
}

function trimmingToFormData(values: TrimmingFormValues): FormData {
  const fd = new FormData();
  fd.append('due_date', isIsoDate(values.deliver_by) ? values.deliver_by : fallbackDueDate());
  appendIfPresent(fd, 'DESC', values.description);
  appendIfPresent(fd, 'CUST', values.customer);
  appendIfPresent(fd, 'PNUM', values.part_number);
  appendNumber(fd, 'PPY', values.parts_per_year);
  appendNumber(fd, 'PRLF', values.project_life);
  appendIfPresent(fd, 'press', values.press);
  appendNumber(fd, 'no_of_cavities', values.num_cavities);
  appendIfPresent(fd, 'no_of_hydraulic_slides', values.num_hydraulic_slides);
  appendIfPresent(fd, 'fully_automatic_process', values.fully_automatic);
  appendIfPresent(fd, 'presence_detectors', values.presence_detectors);
  appendIfPresent(fd, 'trimming_process_condition', values.trimming_condition);
  appendNumber(fd, 'admissible_residual_burr_mm', values.residual_burr_mm);
  appendIfPresent(fd, 'castings_supplied_by_auma', values.castings_by_auma);
  appendIfPresent(fd, 'adjustments_optimization_at_tool', values.adjustments_toolmaker);
  appendIfPresent(fd, 'gas_springs', values.gas_springs);
  appendIfPresent(fd, 'part_name', values.pg_part_name || values.description);
  appendIfPresent(fd, 'part_number', values.pg_part_number_geom || values.part_number);
  appendNumber(fd, 'part_dim_length_mm', values.pg_part_dimension);
  appendNumber(fd, 'min_wall_thickness_mm', values.pg_min_wall_thickness);
  appendNumber(fd, 'max_wall_thickness_mm', values.pg_max_wall_thickness);
  appendNumber(fd, 'projected_area_cm2', values.pg_projected_area);
  appendNumber(fd, 'surface_cm2', values.pg_surface);
  appendNumber(fd, 'volume_cm3', values.pg_volume);
  appendNumber(fd, 'gross_weight_g', values.pg_gross_weight);
  appendIfPresent(fd, 'press_type', values.ts_buhler_machine_ton);
  appendIfPresent(fd, 'quantity_of_punch_pins', values.punch_pins_required);
  appendIfPresent(fd, 'comments', values.comments);

  Object.entries(trimmingConsiderationMap).forEach(([frontendKey, backendKey]) => {
    appendConsideration(fd, values.considerations, frontendKey, backendKey);
  });
  const other = values.considerations.others;
  if (other) appendIfPresent(fd, 'oi_others', other.notes);
  const delivery = values.considerations.delivery_date;
  if (delivery && isIsoDate(delivery.notes)) appendIfPresent(fd, 'oi_delivery_date_imex', delivery.notes);
  fd.append('oi_frame_refurbishment', String(checkedToBoolean(values.considerations.frame_refur?.checked)));
  fd.append('oi_set_of_electric_wires', String(checkedToBoolean(values.considerations.elec_wires?.checked)));
  appendIfPresent(fd, 'oi_ejector_system_fixed_side', values.considerations.ejector_fixed?.checked);

  if (values.shot_sketch_file?.file) fd.append('archivos', values.shot_sketch_file.file);
  appendFiles(fd, values);
  return fd;
}

export function rfqFormToFormData(tipo: RfqTipo, values: FormValues): FormData {
  return tipo === 'Mold'
    ? moldToFormData(values as MoldFormValues)
    : trimmingToFormData(values as TrimmingFormValues);
}

