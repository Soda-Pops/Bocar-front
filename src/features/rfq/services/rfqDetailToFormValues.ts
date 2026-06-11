import type { RfqTipo } from '@/features/analytics/types';
import type { MoldFormValues } from '@/features/rfq/components/RfqForm/definitions/moldDefinition';
import type { TrimmingFormValues } from '@/features/rfq/components/RfqForm/definitions/trimmingDefinition';
import type { RfqDetailDto } from '@/features/rfq/services/rfqDtos';
import { resolveFileUrl } from '@/features/rfq/services/rfqMappers';
import type { FileInfo } from '@/shared/components/ui/MultiFileUploadField';

type RawRfq = Record<string, unknown>;

/** Maps backend `archivos` (already uploaded) into the form's file field shape. */
function mapUploadedFiles(dto: RfqDetailDto): FileInfo[] {
  return (dto.archivos ?? []).map((file) => {
    const parts = file.archivo.split(/[\\/]/);
    return {
      id: file.id,
      name: parts[parts.length - 1] ?? file.archivo,
      size: 0,
      type: '',
      url: resolveFileUrl(file.archivo),
      uploadedAt: file.uploaded_at,
    };
  });
}

function text(raw: RawRfq, key: string): string {
  const value = raw[key];
  if (value === null || value === undefined) return '';
  return String(value);
}

function dateText(raw: RawRfq, key: string): string {
  const value = text(raw, key);
  return value.includes('T') ? value.slice(0, 10) : value;
}

function yesNo(raw: RawRfq, key: string): string {
  const value = raw[key];
  if (value === true) return 'yes';
  if (value === false) return 'no';
  return '';
}

function consideration(raw: RawRfq, backendKey: string) {
  return {
    checked: yesNo(raw, backendKey),
    notes: text(raw, `${backendKey}_note`),
  };
}

function splitDimension(value: string): [string, string, string] {
  const parts = value.split(/[xX,* ]+/).filter(Boolean);
  return [parts[0] ?? '', parts[1] ?? '', parts[2] ?? ''];
}

export function mapDetailToMoldFormValues(dto: RfqDetailDto): MoldFormValues {
  const raw = dto as RawRfq;
  const [length, width, height] = splitDimension(text(raw, 'part_dim'));

  return {
    alloy: text(raw, 'alloy'),
    buhler: text(raw, 'SMACH'),
    comments: text(raw, 'comments'),
    considerations: {
      d_3d: consideration(raw, 'D_3D'),
      flan: consideration(raw, 'FlAn'),
      run_des: consideration(raw, 'Run_des'),
      run_over: consideration(raw, 'Run_and_over_mod'),
      man_prop: consideration(raw, 'ManProp'),
      ldi: consideration(raw, 'Ldi'),
      add_mach: consideration(raw, 'Add_of_mach_st'),
      sketch: consideration(raw, 'Sketch_d_conc_inc_s_dim'),
      drw_2d: consideration(raw, 'D2_Dr_Des_PDF_CNF'),
      drw_3d: consideration(raw, 'D3_Mod_solid_Native'),
      comp_d: consideration(raw, 'Comp_Die'),
      subseq_d: consideration(raw, 'Subseq_D'),
      repl_h13: consideration(raw, 'Set_of_repl_H13'),
      sp_ei: consideration(raw, 'Sp_set_of_EI'),
      ficf: consideration(raw, 'FICF'),
      hcls: consideration(raw, 'HCLS'),
      fr_refur: consideration(raw, 'Fr_Refur'),
      eyeb: consideration(raw, 'Eyeb'),
      ow_conn: consideration(raw, 'Oil_Water_Conn'),
      stm: consideration(raw, 'STM_1and2'),
      cmm_rep: consideration(raw, 'CMM_dim_rep_cai'),
      gom_rep: consideration(raw, 'GOM_rep_ass'),
      h_val: consideration(raw, 'H_val_subc_in'),
      dim_corr: consideration(raw, 'Dim_corr_opt'),
      sp_pt: consideration(raw, 'Sp_Pt'),
      smach: { checked: '', notes: text(raw, 'SMACH') },
      no_cav: { checked: '', notes: text(raw, 'No_CAV') },
      no_hs: { checked: '', notes: text(raw, 'No_ofHS') },
      no_ms: { checked: '', notes: text(raw, 'No_ofMS') },
      third_p_supp: { checked: '', notes: text(raw, 'ThirdPSupp') },
      no_subc: { checked: '', notes: text(raw, 'No_subc') },
      jco: { checked: '', notes: text(raw, 'Jco') },
      qc_sys: { checked: '', notes: text(raw, 'QcSys') },
      ihtcs: { checked: '', notes: text(raw, 'Ihtcs') },
      spin: { checked: '', notes: text(raw, 'Spin') },
      hics: { checked: '', notes: text(raw, 'HICS') },
      cm_gom: { checked: '', notes: text(raw, 'CMGOM') },
      sp_thermo: { checked: '', notes: text(raw, 'SPforThermoR') },
      n_return_v: { checked: '', notes: text(raw, 'NReturnV') },
      vac_v: { checked: '', notes: text(raw, 'VacV') },
      chill_bl: { checked: '', notes: text(raw, 'ChillBl') },
      no_pl_jco: { checked: '', notes: text(raw, 'No_Pl_Jco_sys') },
      ctbd: { checked: '', notes: text(raw, 'Oth') },
    },
    cust: text(raw, 'CUST'),
    dtq: dateText(raw, 'due_date'),
    elab: text(raw, 'ELAB'),
    gates: text(raw, 'number_of_gates_per_part'),
    hydr_slides: text(raw, 'No_ofHS'),
    mech_slides: text(raw, 'No_ofMS'),
    num_cav: text(raw, 'No_CAV'),
    num_tools: text(raw, 'number_of_tools'),
    part_dim: [length, width, height].filter(Boolean).join(' x '),
    part_name: text(raw, 'PT') || text(raw, 'DESC'),
    part_number: text(raw, 'PNUM'),
    part_tech: text(raw, 'PT'),
    parts_stroke: text(raw, 'number_of_parts_per_stroke'),
    pnum: text(raw, 'PNUM'),
    ppy: text(raw, 'PPY'),
    prlf: text(raw, 'PRLF'),
    projected: text(raw, 'projected_area_cm2'),
    rfq_name: text(raw, 'DESC') || `RFQ-${dto.id}`,
    sk_part: null,
    files: mapUploadedFiles(dto),
    surface: text(raw, 'surface_cm2'),
    three_plate: text(raw, 'ThirdPSupp'),
    tt: text(raw, 'TT'),
    volume: text(raw, 'volume_cm3'),
    wall_max: text(raw, 'max_wall_thickness_mm'),
    wall_min: text(raw, 'min_wall_thickness_mm'),
    weight: text(raw, 'gross_weight_g'),
  };
}

export function mapDetailToTrimmingFormValues(dto: RfqDetailDto): TrimmingFormValues {
  const raw = dto as RawRfq;
  const otherInfo = {
    frame_refur: { checked: yesNo(raw, 'oi_frame_refurbishment'), notes: '' },
    elec_wires: { checked: yesNo(raw, 'oi_set_of_electric_wires'), notes: '' },
    others: { checked: text(raw, 'oi_others') ? 'yes' : 'no', notes: text(raw, 'oi_others') },
    delivery_date: { checked: dateText(raw, 'oi_delivery_date_imex') ? 'yes' : 'no', notes: dateText(raw, 'oi_delivery_date_imex') },
    ejector_fixed: { checked: text(raw, 'oi_ejector_system_fixed_side'), notes: '' },
  };

  return {
    description: text(raw, 'DESC'),
    part_number: text(raw, 'PNUM') || text(raw, 'part_number'),
    parts_per_year: text(raw, 'PPY'),
    project_life: text(raw, 'PRLF'),
    customer: text(raw, 'CUST'),
    previous_job: '',
    supplier: '',
    deliver_by: dateText(raw, 'due_date'),
    press: text(raw, 'press'),
    num_cavities: text(raw, 'no_of_cavities'),
    num_hydraulic_slides: text(raw, 'no_of_hydraulic_slides'),
    fully_automatic: text(raw, 'fully_automatic_process'),
    presence_detectors: text(raw, 'presence_detectors'),
    trimming_condition: text(raw, 'trimming_process_condition'),
    punch_pins_required: text(raw, 'quantity_of_punch_pins'),
    residual_burr_mm: text(raw, 'admissible_residual_burr_mm'),
    castings_by_auma: text(raw, 'castings_supplied_by_auma'),
    adjustments_toolmaker: text(raw, 'adjustments_optimization_at_tool'),
    gas_springs: text(raw, 'gas_springs'),
    considerations: {
      design_3d: consideration(raw, 'di_design_3d_model'),
      design_2d: consideration(raw, 'di_design_2d_data'),
      punch_pins: consideration(raw, 'di_punch_pins_data'),
      manuf_proposals: consideration(raw, 'di_manufacturing_proposals'),
      latest_improvements: consideration(raw, 'di_latest_trim_die_improvements'),
      sketch_concept: consideration(raw, 'di_sketch_trim_die_concept'),
      trim_die_1: consideration(raw, 'di_trim_die_no1'),
      trim_die_2: consideration(raw, 'di_trim_die_no2'),
      spare_parts_set: consideration(raw, 'di_set_of_spare_parts'),
      hydraulic_cyl: consideration(raw, 'di_hydraulic_cylinders_limit_sw'),
      ...otherInfo,
    },
    shot_sketch_file: null,
    pg_part_name: text(raw, 'part_name'),
    pg_alloy: '',
    pg_part_number_geom: text(raw, 'part_number'),
    pg_part_dimension: [
      text(raw, 'part_dim_length_mm'),
      text(raw, 'part_dim_width_mm'),
      text(raw, 'part_dim_height_mm'),
    ].filter(Boolean).join(' x '),
    pg_min_wall_thickness: text(raw, 'min_wall_thickness_mm'),
    pg_max_wall_thickness: text(raw, 'max_wall_thickness_mm'),
    pg_projected_area: text(raw, 'projected_area_cm2'),
    pg_surface: text(raw, 'surface_cm2'),
    pg_volume: text(raw, 'volume_cm3'),
    pg_gross_weight: text(raw, 'gross_weight_g'),
    ts_buhler_machine_ton: text(raw, 'press_type'),
    ts_num_cavities_sets: text(raw, 'no_of_cavities'),
    ts_three_plate_mold: '',
    ts_num_gates_per_part: '',
    ts_num_mech_slides: '',
    ts_num_hydr_slides: text(raw, 'no_of_hydraulic_slides'),
    ts_num_parts_per_stroke: '',
    ts_num_tools: '',
    ts_intro_extraction: '',
    ts_biscuit_position: '',
    ts_qty_punch_pins: '',
    ts_temp_trimmed: '',
    ts_ejector_fixed_side: '',
    comments: text(raw, 'comments'),
    files: mapUploadedFiles(dto),
  };
}

export function mapDetailToFormValues(tipo: RfqTipo, dto: RfqDetailDto) {
  return tipo === 'Mold' ? mapDetailToMoldFormValues(dto) : mapDetailToTrimmingFormValues(dto);
}

