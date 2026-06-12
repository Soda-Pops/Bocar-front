import type { RfqTipo } from '@/features/analytics/types';

// ─────────────────────────────────────────────────────────────────────────────
// Mapeo INVERSO del cost breakdown: DTO plano del backend → valores del
// formulario de cotización. Es el espejo exacto de `quotationFormToDto.ts`.
// Devuelve un deep-partial; el `buildXQuotationDefinition` lo fusiona sobre los
// defaults (deepMerge), por lo que solo necesitamos rellenar lo que el proveedor
// captura (las celdas leaf unit/h/q + price + weeks). Los totales/grand-totals
// que escribe el forward NO se leen aquí: se recalculan en el formulario.
// ─────────────────────────────────────────────────────────────────────────────

type Dto = Record<string, unknown>;
type Row = Record<string, string>;

function asDto(value: unknown): Dto {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Dto)
    : {};
}

/** Backend value → string para el form. null/undefined → ''. */
function s(dto: Dto, key: string): string {
  const v = dto[key];
  if (v === null || v === undefined) return '';
  return String(v);
}

/** Fila de tipo "Unit". Sufijos por defecto: `_unit` / `_price_unit`. */
function readUnit(
  dto: Dto,
  prefix: string,
  unitKey = `${prefix}_unit`,
  priceKey = `${prefix}_price_unit`,
): Row {
  return { unit: s(dto, unitKey), price_unit: s(dto, priceKey), weeks: s(dto, `${prefix}_weeks`) };
}

/** Fila de tipo "Hour": `_h` / `_price`. */
function readH(dto: Dto, prefix: string): Row {
  return { h: s(dto, `${prefix}_h`), price: s(dto, `${prefix}_price`), weeks: s(dto, `${prefix}_weeks`) };
}

/** Fila de tipo "Quantity": `_q` / `_price_q`. */
function readQ(dto: Dto, prefix: string): Row {
  return { q: s(dto, `${prefix}_q`), price_q: s(dto, `${prefix}_price_q`), weeks: s(dto, `${prefix}_weeks`) };
}

function mapRows<T extends Row>(dto: Dto, map: Record<string, string>, reader: (d: Dto, p: string) => T): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [formKey, prefix] of Object.entries(map)) {
    out[formKey] = reader(dto, prefix);
  }
  return out;
}

// ─── MOLD ──────────────────────────────────────────────────────────────────────

function moldDtoToForm(dto: Dto): Dto {
  const out: Dto = {
    supplier: s(dto, 'supplier_name'),
    ts_max_weight_mold: s(dto, 'max_weight_for_mold'),
    comments: s(dto, 'comments'),
    basic_data: { base_currency: s(dto, 'base_currency_exchange_rate') },
    accessories_costs: mapRows(dto, {
      parker_hydraulic: 'accs_parker_hydraulic',
      jet_cooling: 'accs_jet_cooling',
      squeeze_pin: 'accs_squeeze_pin',
      interchangeable_inserts: 'accs_interchangeable_inserts',
      chill_blocks: 'accs_chill_blocks_vacuum',
      eyebolts: 'accs_eyebolts',
      oil_water_connectors: 'accs_oil_water_conn',
      lethiguel_distributor: 'accs_lethiguel_dist',
      others: 'accs_others',
    }, readUnit),
    material_costs: mapRows(dto, {
      die_frame: 'mat_die_frame',
      cavity: 'mat_cavity',
      steel_pipes_tubes: 'mat_steel_pipes',
      others: 'mat_others',
    }, readUnit),
    manufacturing: {
      machining: mapRows(dto, {
        milling: 'mach_milling', turning: 'mach_turning', wire_cutting: 'mach_wire_cutting',
        edm: 'mach_edm', grinding: 'mach_grinding', drilling: 'mach_drilling', others: 'mach_others',
      }, readH),
      manual_work: mapRows(dto, {
        assembly: 'man_assembly', spotting: 'man_spotting',
        stripping_polishing: 'man_stripping_polishing', others: 'man_others',
      }, readH),
      heat_surface: mapRows(dto, {
        hardening: 'heat_hardening', nitriding: 'heat_nitriding', coating: 'heat_coating',
        graining: 'heat_graining', others: 'heat_others',
      }, readH),
      engineering_design: mapRows(dto, {
        design: 'eng_design', cam_nc: 'eng_cam_nc', simulation: 'eng_simulation', others: 'eng_others',
      }, readH),
    },
    corrections_optimizations: mapRows(dto, {
      measurement: 'corr_mold_measurement',
      dimensional_corrections: 'corr_dim_corrections',
      optimizations: 'corr_optimizations',
      others: 'corr_others',
    }, readH),
    logistics: {
      transport_to_btc: readUnit(dto, 'log_transport_supplier_to_btc', 'log_transport_supplier_to_btc', 'log_transport_supplier_to_btc_price'),
      transport_from_btc: readUnit(dto, 'log_transport_btc_to_supplier', 'log_transport_btc_to_supplier', 'log_transport_btc_to_supplier_price'),
      duty_costs: readUnit(dto, 'log_duty_costs', 'log_duty_costs_unit', 'log_duty_costs_price'),
      cleaning_packaging: readUnit(dto, 'log_cleaning_packaging', 'log_cleaning_packaging_unit', 'log_cleaning_packaging_price'),
      other_costs: readUnit(dto, 'log_others', 'log_others_unit', 'log_others_price'),
    },
    tool_replacement: mapRows(dto, {
      die_improvements: 'toolrep_die_improvements',
      others: 'toolrep_others',
    }, readUnit),
    sampling: mapRows(dto, {
      tryout_cost: 'samp_tryout',
      measurement: 'samp_measurement',
      others: 'samp_others',
    }, readQ),
    spare_parts: mapRows(dto, {
      interchangeable_inserts: 'sp_interchangeable_inserts',
      core_pins: 'sp_core_pins',
      inserts_spare: 'sp_inserts_as_spare',
      others: 'sp_others',
    }, readUnit),
  };

  // ctbd se guarda/lee como objeto JSON tal cual.
  if (dto.ctbd && typeof dto.ctbd === 'object' && !Array.isArray(dto.ctbd)) {
    out.ctbd = dto.ctbd as Dto;
  }

  // set_of_cavities llega como objeto anidado; sus campos viven bajo soc_*.
  const soc = asDto(dto.set_of_cavities);
  out.soc_accessories_costs = mapRows(soc, {
    jet_cooling: 'soc_accs_jet_cooling',
    squeeze_pin: 'soc_accs_squeeze_pin',
    interchangeable_inserts: 'soc_accs_interchangeable_inserts',
    inserts_spare: 'soc_accs_inserts_spare',
    chill_blocks: 'soc_accs_chill_blocks',
    others: 'soc_accs_others',
  }, readUnit);
  out.soc_material_costs = mapRows(soc, {
    raw_materials: 'soc_mat_raw_materials',
    others: 'soc_mat_others',
  }, readUnit);
  out.soc_manufacturing = {
    machining: mapRows(soc, {
      milling: 'soc_mach_milling', turning: 'soc_mach_turning', wire_cutting: 'soc_mach_wire_cutting',
      edm: 'soc_mach_edm', grinding: 'soc_mach_grinding', drilling: 'soc_mach_drilling', others: 'soc_mach_others',
    }, readH),
    manual_work: mapRows(soc, {
      assembly: 'soc_man_assembly', spotting: 'soc_man_spotting',
      stripping_polishing: 'soc_man_stripping_polishing', others: 'soc_man_others',
    }, readH),
    heat_surface: mapRows(soc, {
      hardening: 'soc_heat_hardening', nitriding: 'soc_heat_nitriding', coating: 'soc_heat_coating',
      graining: 'soc_heat_graining', others: 'soc_heat_others',
    }, readH),
    engineering_design: mapRows(soc, {
      design: 'soc_eng_design', cam_nc: 'soc_eng_cam_nc', others: 'soc_eng_others',
    }, readH),
  };
  out.soc_corrections_optimizations = {
    measurement: readH(soc, 'soc_corr_measurement_cavities'),
    others: readH(soc, 'soc_corr_others'),
  };
  out.soc_logistics = mapRows(soc, {
    cleaning_packaging: 'soc_log_cleaning_packaging',
    other_costs: 'soc_log_other_costs',
  }, readUnit);
  out.soc_spare_parts = mapRows(soc, {
    interchangeable_inserts: 'soc_sp_interchangeable_inserts',
    core_pins: 'soc_sp_core_pins',
    others: 'soc_sp_others',
  }, readUnit);

  return out;
}

// ─── TRIMMING ────────────────────────────────────────────────────────────────

function trimmingDtoToForm(dto: Dto): Dto {
  return {
    supplier: s(dto, 'supplier_name'),
    ts_max_weight_trim_die: s(dto, 'max_weight_for_trim_die'),
    comments: s(dto, 'comments'),
    basic_data: { currency: s(dto, 'base_currency_exchange_rate') },
    material_costs: mapRows(dto, {
      raw_materials: 'mat_raw_materials',
      others: 'mat_others',
    }, readUnit),
    accessories_costs: mapRows(dto, {
      merkle_cylinders: 'accs_merkle_cylinders',
      telemecanique: 'accs_telemecanique',
      ifm_sensors: 'accs_sensores_ifm',
      air_devices: 'accs_air_devices',
      others: 'accs_others',
    }, readUnit),
    manufacturing: {
      machining: mapRows(dto, {
        milling: 'mach_milling', turning: 'mach_turning', wire_cutting: 'mach_wire_cutting',
        edm: 'mach_edm', grinding: 'mach_grinding', drilling: 'mach_drilling', others: 'mach_others',
      }, readH),
      manual_work: mapRows(dto, {
        assembly: 'man_assembly', spotting: 'man_spotting',
        stripping_polishing: 'man_stripping_polishing', others: 'man_others',
      }, readH),
      heat_surface: mapRows(dto, {
        hardening: 'heat_hardening', nitriding: 'heat_nitriding', coating: 'heat_coating',
        graining: 'heat_graining', others: 'heat_others',
      }, readH),
      engineering_design: mapRows(dto, {
        design: 'eng_design', cam_nc: 'eng_cam_nc', others: 'eng_others',
      }, readH),
    },
    trim_die_adjustment: mapRows(dto, {
      adjustment: 'adj_adjustment',
      others: 'adj_others',
    }, readH),
    logistics: mapRows(dto, {
      transport_to_btc: 'log_transport_supplier_to_btc',
      transport_from_btc: 'log_transport_btc_to_supplier',
      duty_costs: 'log_duty_costs',
      cleaning_packaging: 'log_cleaning_packaging',
      other_costs: 'log_other_costs',
    }, readUnit),
    tool_replacement: mapRows(dto, {
      die_improvements: 'toolrep_die_improvements',
      others: 'toolrep_others',
    }, readUnit),
    // spare_parts es un array de 2 filas; se conservan los labels desde los defaults.
    spare_parts: [
      { concept: 'Spare Parts (Punch pins)', ...readUnit(dto, 'sp_punch_pins') },
      { concept: 'Other', ...readUnit(dto, 'sp_others') },
    ],
  };
}

/**
 * Convierte el cost breakdown guardado (borrador) en un deep-partial de valores
 * de formulario para rehidratar la pantalla de cotización al continuar un draft.
 */
export function quotationDtoToFormValues(tipo: RfqTipo, dto: unknown): Record<string, unknown> {
  const safe = asDto(dto);
  return tipo === 'Mold' ? moldDtoToForm(safe) : trimmingDtoToForm(safe);
}
