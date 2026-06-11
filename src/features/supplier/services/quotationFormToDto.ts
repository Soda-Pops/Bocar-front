import type { RfqTipo } from '@/features/analytics/types';

type Primitive = number | string;
type QuotationDto = Record<string, Primitive | Record<string, Primitive>>;
type Row = Record<string, unknown>;
type Values = Record<string, unknown>;

type TotalKeys = {
  left: string;
  price: string;
  total: string;
  weeks: string;
};

type RowTotals = {
  left: number;
  price: number;
  total: number;
  weeks: number;
};

const ROW_TOTAL_ZERO: RowTotals = { left: 0, price: 0, total: 0, weeks: 0 };

function isRecord(value: unknown): value is Values {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function child(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(/,/g, '');
  const numeric = Number(normalized);
  return Number.isNaN(numeric) ? undefined : numeric;
}

function parseString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : undefined;
}

function addNumber(out: QuotationDto, key: string, value: unknown) {
  const numeric = parseNumber(value);
  if (numeric !== undefined) out[key] = numeric;
}

function addString(out: QuotationDto, key: string, value: unknown) {
  const text = parseString(value);
  if (text !== undefined) out[key] = text;
}

function addTotal(out: QuotationDto, keys: TotalKeys, totals: RowTotals) {
  out[keys.left] = totals.left;
  out[keys.price] = totals.price;
  out[keys.total] = totals.total;
  out[keys.weeks] = totals.weeks;
}

function addRow(
  out: QuotationDto,
  row: unknown,
  backendPrefix: string,
  leftKey: 'unit' | 'h' | 'q',
  priceKey: 'price_unit' | 'price' | 'price_q',
  suffixes?: { left?: string; price?: string },
): RowTotals {
  const left = parseNumber(child(row, leftKey)) ?? 0;
  const price = parseNumber(child(row, priceKey)) ?? 0;
  const weeks = parseNumber(child(row, 'weeks')) ?? 0;
  const total = left * price;

  const leftSuffix = suffixes?.left ?? leftKey;
  const priceSuffix = suffixes?.price ?? priceKey;
  const leftField = leftSuffix ? `${backendPrefix}_${leftSuffix}` : backendPrefix;
  const priceField = priceSuffix ? `${backendPrefix}_${priceSuffix}` : backendPrefix;

  addNumber(out, leftField, child(row, leftKey));
  addNumber(out, priceField, child(row, priceKey));
  if (left !== 0 || price !== 0) out[`${backendPrefix}_total`] = total;
  addNumber(out, `${backendPrefix}_weeks`, child(row, 'weeks'));

  return { left, price, total, weeks };
}

function sumTotals(rows: RowTotals[]): RowTotals {
  return rows.reduce(
    (acc, row) => ({
      left: acc.left + row.left,
      price: acc.price + row.price,
      total: acc.total + row.total,
      weeks: acc.weeks + row.weeks,
    }),
    ROW_TOTAL_ZERO,
  );
}

function mapUnitSection(
  out: QuotationDto,
  source: unknown,
  rows: Record<string, string>,
  grandKeys: TotalKeys,
  suffixes?: { left?: string; price?: string },
): RowTotals {
  const totals = Object.entries(rows).map(([formKey, backendPrefix]) =>
    addRow(out, child(source, formKey), backendPrefix, 'unit', 'price_unit', suffixes),
  );
  const grand = sumTotals(totals);
  addTotal(out, grandKeys, grand);
  return grand;
}

function mapHourSection(
  out: QuotationDto,
  source: unknown,
  rows: Record<string, string>,
  grandKeys: TotalKeys,
): RowTotals {
  const totals = Object.entries(rows).map(([formKey, backendPrefix]) =>
    addRow(out, child(source, formKey), backendPrefix, 'h', 'price'),
  );
  const grand = sumTotals(totals);
  addTotal(out, grandKeys, grand);
  return grand;
}

function mapQuantitySection(
  out: QuotationDto,
  source: unknown,
  rows: Record<string, string>,
  grandKeys: TotalKeys,
): RowTotals {
  const totals = Object.entries(rows).map(([formKey, backendPrefix]) =>
    addRow(out, child(source, formKey), backendPrefix, 'q', 'price_q'),
  );
  const grand = sumTotals(totals);
  addTotal(out, grandKeys, grand);
  return grand;
}

function addFiles(payload: QuotationDto, values: unknown): QuotationDto | FormData {
  const files = asArray(child(values, 'files'));
  const newFiles = files
    .map((entry) => child(entry, 'file'))
    .filter((file): file is File => typeof File !== 'undefined' && file instanceof File);

  if (newFiles.length === 0) return payload;

  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    formData.append(key, isRecord(value) ? JSON.stringify(value) : String(value));
  });
  newFiles.forEach((file) => formData.append('archivos', file));
  return formData;
}

function mapCommonManufacturing(
  out: QuotationDto,
  source: unknown,
  options: {
    includeSimulation: boolean;
    overallPrefix: 'grand_total' | 'manuf_grand_total';
    overallHasPrice: boolean;
  },
): RowTotals {
  const machining = mapHourSection(
    out,
    child(source, 'machining'),
    {
      milling: 'mach_milling',
      turning: 'mach_turning',
      wire_cutting: 'mach_wire_cutting',
      edm: 'mach_edm',
      grinding: 'mach_grinding',
      drilling: 'mach_drilling',
      others: 'mach_others',
    },
    {
      left: 'mach_grand_total_h',
      price: 'mach_grand_total_price_h',
      total: 'mach_grand_total_sum',
      weeks: 'mach_grand_total_weeks',
    },
  );
  const manual = mapHourSection(
    out,
    child(source, 'manual_work'),
    {
      assembly: 'man_assembly',
      spotting: 'man_spotting',
      stripping_polishing: 'man_stripping_polishing',
      others: 'man_others',
    },
    {
      left: 'man_grand_total_h',
      price: 'man_grand_total_price_h',
      total: 'man_grand_total_sum',
      weeks: 'man_grand_total_weeks',
    },
  );
  const heat = mapHourSection(
    out,
    child(source, 'heat_surface'),
    {
      hardening: 'heat_hardening',
      nitriding: 'heat_nitriding',
      coating: 'heat_coating',
      graining: 'heat_graining',
      others: 'heat_others',
    },
    {
      left: 'heat_grand_total_h',
      price: 'heat_grand_total_price_h',
      total: 'heat_grand_total_sum',
      weeks: 'heat_grand_total_weeks',
    },
  );
  const engineeringRows: Record<string, string> = options.includeSimulation
    ? {
        design: 'eng_design',
        cam_nc: 'eng_cam_nc',
        simulation: 'eng_simulation',
        others: 'eng_others',
      }
    : {
        design: 'eng_design',
        cam_nc: 'eng_cam_nc',
        others: 'eng_others',
      };
  const engineering = mapHourSection(
    out,
    child(source, 'engineering_design'),
    engineeringRows,
    {
      left: 'eng_grand_total_h',
      price: 'eng_grand_total_price_h',
      total: 'eng_grand_total_sum',
      weeks: 'eng_grand_total_weeks',
    },
  );
  const grand = sumTotals([machining, manual, heat, engineering]);
  out[`${options.overallPrefix}_h`] = grand.left;
  if (options.overallHasPrice) out[`${options.overallPrefix}_price_h`] = grand.price;
  out[`${options.overallPrefix}_sum`] = grand.total;
  out[`${options.overallPrefix}_weeks`] = grand.weeks;
  return grand;
}

function mapMoldSetOfCavities(values: Values): Record<string, Primitive> {
  const out: QuotationDto = {};
  const socAccs = child(values, 'soc_accessories_costs');
  const accRows = [
    addRow(out, child(socAccs, 'jet_cooling'), 'soc_accs_jet_cooling', 'unit', 'price_unit'),
    addRow(out, child(socAccs, 'squeeze_pin'), 'soc_accs_squeeze_pin', 'unit', 'price_unit'),
    addRow(out, child(socAccs, 'interchangeable_inserts'), 'soc_accs_interchangeable_inserts', 'unit', 'price_unit'),
    addRow(out, child(socAccs, 'inserts_spare'), 'soc_accs_inserts_spare', 'unit', 'price_unit'),
    addRow(out, child(socAccs, 'chill_blocks'), 'soc_accs_chill_blocks', 'unit', 'price_unit'),
    addRow(out, child(socAccs, 'others'), 'soc_accs_others', 'unit', 'price_unit'),
  ];
  delete out.soc_accs_jet_cooling_price_unit;
  addTotal(out, {
    left: 'soc_accs_grand_total_unit',
    price: 'soc_accs_grand_total_price_unit',
    total: 'soc_accs_grand_total_sum',
    weeks: 'soc_accs_grand_total_weeks',
  }, sumTotals(accRows));

  mapUnitSection(
    out,
    child(values, 'soc_material_costs'),
    {
      raw_materials: 'soc_mat_raw_materials',
      others: 'soc_mat_others',
    },
    {
      left: 'soc_mat_grand_total_unit',
      price: 'soc_mat_grand_total_price_unit',
      total: 'soc_mat_grand_total_sum',
      weeks: 'soc_mat_grand_total_weeks',
    },
  );

  const socManufacturing = child(values, 'soc_manufacturing');
  const mach = mapHourSection(out, child(socManufacturing, 'machining'), {
    milling: 'soc_mach_milling',
    turning: 'soc_mach_turning',
    wire_cutting: 'soc_mach_wire_cutting',
    edm: 'soc_mach_edm',
    grinding: 'soc_mach_grinding',
    drilling: 'soc_mach_drilling',
    others: 'soc_mach_others',
  }, {
    left: 'soc_mach_grand_total_h',
    price: 'soc_mach_grand_total_price_h',
    total: 'soc_mach_grand_total_sum',
    weeks: 'soc_mach_grand_total_weeks',
  });
  const man = mapHourSection(out, child(socManufacturing, 'manual_work'), {
    assembly: 'soc_man_assembly',
    spotting: 'soc_man_spotting',
    stripping_polishing: 'soc_man_stripping_polishing',
    others: 'soc_man_others',
  }, {
    left: 'soc_man_grand_total_h',
    price: 'soc_man_grand_total_price_h',
    total: 'soc_man_grand_total_sum',
    weeks: 'soc_man_grand_total_weeks',
  });
  const heat = mapHourSection(out, child(socManufacturing, 'heat_surface'), {
    hardening: 'soc_heat_hardening',
    nitriding: 'soc_heat_nitriding',
    coating: 'soc_heat_coating',
    graining: 'soc_heat_graining',
    others: 'soc_heat_others',
  }, {
    left: 'soc_heat_grand_total_h',
    price: 'soc_heat_grand_total_price_h',
    total: 'soc_heat_grand_total_sum',
    weeks: 'soc_heat_grand_total_weeks',
  });
  const eng = mapHourSection(out, child(socManufacturing, 'engineering_design'), {
    design: 'soc_eng_design',
    cam_nc: 'soc_eng_cam_nc',
    others: 'soc_eng_others',
  }, {
    left: 'soc_eng_grand_total_h',
    price: 'soc_eng_grand_total_price_h',
    total: 'soc_eng_grand_total_sum',
    weeks: 'soc_eng_grand_total_weeks',
  });
  const socManufacturingGrand = sumTotals([mach, man, heat, eng]);
  out.soc_manuf_grand_total_sum = socManufacturingGrand.total;
  out.soc_manuf_grand_total_weeks = socManufacturingGrand.weeks;

  const corrSource = child(values, 'soc_corrections_optimizations');
  const socCorr = [
    addRow(out, child(corrSource, 'measurement'), 'soc_corr_measurement_cavities', 'h', 'price'),
    addRow(out, child(corrSource, 'others'), 'soc_corr_others', 'h', 'price'),
  ];
  addTotal(out, {
    left: 'soc_corr_grand_total_h',
    price: 'soc_corr_grand_total_price_h',
    total: 'soc_corr_grand_total_sum',
    weeks: 'soc_corr_grand_total_weeks',
  }, sumTotals(socCorr));

  mapUnitSection(
    out,
    child(values, 'soc_logistics'),
    {
      cleaning_packaging: 'soc_log_cleaning_packaging',
      other_costs: 'soc_log_other_costs',
    },
    {
      left: 'soc_log_grand_total_unit',
      price: 'soc_log_grand_total_price_unit',
      total: 'soc_log_grand_total_sum',
      weeks: 'soc_log_grand_total_weeks',
    },
  );

  mapUnitSection(
    out,
    child(values, 'soc_spare_parts'),
    {
      interchangeable_inserts: 'soc_sp_interchangeable_inserts',
      core_pins: 'soc_sp_core_pins',
      others: 'soc_sp_others',
    },
    {
      left: 'soc_sp_grand_total_unit',
      price: 'soc_sp_grand_total_price_unit',
      total: 'soc_sp_grand_total_sum',
      weeks: 'soc_sp_grand_total_weeks',
    },
  );

  return out as Record<string, Primitive>;
}

function moldFormToPayload(values: Values): QuotationDto {
  const out: QuotationDto = {};
  addString(out, 'base_currency_exchange_rate', child(child(values, 'basic_data'), 'base_currency'));

  mapUnitSection(
    out,
    child(values, 'accessories_costs'),
    {
      parker_hydraulic: 'accs_parker_hydraulic',
      jet_cooling: 'accs_jet_cooling',
      squeeze_pin: 'accs_squeeze_pin',
      interchangeable_inserts: 'accs_interchangeable_inserts',
      chill_blocks: 'accs_chill_blocks_vacuum',
      eyebolts: 'accs_eyebolts',
      oil_water_connectors: 'accs_oil_water_conn',
      lethiguel_distributor: 'accs_lethiguel_dist',
      others: 'accs_others',
    },
    {
      left: 'accs_grand_total_unit',
      price: 'accs_grand_total_price_unit',
      total: 'accs_grand_total_sum',
      weeks: 'accs_grand_total_weeks',
    },
  );

  mapUnitSection(
    out,
    child(values, 'material_costs'),
    {
      die_frame: 'mat_die_frame',
      cavity: 'mat_cavity',
      steel_pipes_tubes: 'mat_steel_pipes',
      others: 'mat_others',
    },
    {
      left: 'mat_grand_total_unit',
      price: 'mat_grand_total_price_unit',
      total: 'mat_grand_total_sum',
      weeks: 'mat_grand_total_weeks',
    },
  );

  mapCommonManufacturing(out, child(values, 'manufacturing'), {
    includeSimulation: true,
    overallPrefix: 'grand_total',
    overallHasPrice: true,
  });

  mapHourSection(
    out,
    child(values, 'corrections_optimizations'),
    {
      measurement: 'corr_mold_measurement',
      dimensional_corrections: 'corr_dim_corrections',
      optimizations: 'corr_optimizations',
      others: 'corr_others',
    },
    {
      left: 'corr_grand_total_h',
      price: 'corr_grand_total_price_h',
      total: 'corr_grand_total_sum',
      weeks: 'corr_grand_total_weeks',
    },
  );

  const logistics = child(values, 'logistics');
  const logisticsGrand = sumTotals([
    addRow(out, child(logistics, 'transport_to_btc'), 'log_transport_supplier_to_btc', 'unit', 'price_unit', { left: '', price: 'price' }),
    addRow(out, child(logistics, 'transport_from_btc'), 'log_transport_btc_to_supplier', 'unit', 'price_unit', { left: '', price: 'price' }),
    addRow(out, child(logistics, 'duty_costs'), 'log_duty_costs', 'unit', 'price_unit', { price: 'price' }),
    addRow(out, child(logistics, 'cleaning_packaging'), 'log_cleaning_packaging', 'unit', 'price_unit', { price: 'price' }),
    addRow(out, child(logistics, 'other_costs'), 'log_others', 'unit', 'price_unit', { price: 'price' }),
  ]);
  addTotal(out, {
    left: 'log_grand_total_unit',
    price: 'log_grand_total_price',
    total: 'log_grand_total_sum',
    weeks: 'log_grand_total_weeks',
  }, logisticsGrand);

  mapUnitSection(
    out,
    child(values, 'tool_replacement'),
    {
      die_improvements: 'toolrep_die_improvements',
      others: 'toolrep_others',
    },
    {
      left: 'toolrep_grand_total_unit',
      price: 'toolrep_grand_total_price_unit',
      total: 'toolrep_grand_total_sum',
      weeks: 'toolrep_grand_total_weeks',
    },
  );

  mapQuantitySection(
    out,
    child(values, 'sampling'),
    {
      tryout_cost: 'samp_tryout',
      measurement: 'samp_measurement',
      others: 'samp_others',
    },
    {
      left: 'samp_grand_total_q',
      price: 'samp_grand_total_price_q',
      total: 'samp_grand_total_sum',
      weeks: 'samp_grand_total_weeks',
    },
  );

  mapUnitSection(
    out,
    child(values, 'spare_parts'),
    {
      interchangeable_inserts: 'sp_interchangeable_inserts',
      core_pins: 'sp_core_pins',
      inserts_spare: 'sp_inserts_as_spare',
      others: 'sp_others',
    },
    {
      left: 'sp_grand_total_unit',
      price: 'sp_grand_total_price_unit',
      total: 'sp_grand_total_sum',
      weeks: 'sp_grand_total_weeks',
    },
  );

  out.set_of_cavities = mapMoldSetOfCavities(values);
  return out;
}

function trimmingFormToPayload(values: Values): QuotationDto {
  const out: QuotationDto = {};
  addString(out, 'base_currency_exchange_rate', child(child(values, 'basic_data'), 'currency'));
  addNumber(out, 'max_weight_for_trim_die', child(values, 'ts_max_weight_trim_die'));
  addString(out, 'comments', child(values, 'comments'));

  mapUnitSection(
    out,
    child(values, 'material_costs'),
    {
      raw_materials: 'mat_raw_materials',
      others: 'mat_others',
    },
    {
      left: 'mat_grand_total_unit',
      price: 'mat_grand_total_price_unit',
      total: 'mat_grand_total_sum',
      weeks: 'mat_grand_total_weeks',
    },
  );

  mapUnitSection(
    out,
    child(values, 'accessories_costs'),
    {
      merkle_cylinders: 'accs_merkle_cylinders',
      telemecanique: 'accs_telemecanique',
      ifm_sensors: 'accs_sensores_ifm',
      air_devices: 'accs_air_devices',
      others: 'accs_others',
    },
    {
      left: 'accs_grand_total_unit',
      price: 'accs_grand_total_price_unit',
      total: 'accs_grand_total_sum',
      weeks: 'accs_grand_total_weeks',
    },
  );

  mapCommonManufacturing(out, child(values, 'manufacturing'), {
    includeSimulation: false,
    overallPrefix: 'manuf_grand_total',
    overallHasPrice: true,
  });

  mapHourSection(
    out,
    child(values, 'trim_die_adjustment'),
    {
      adjustment: 'adj_adjustment',
      others: 'adj_others',
    },
    {
      left: 'adj_grand_total_h',
      price: 'adj_grand_total_price_h',
      total: 'adj_grand_total_sum',
      weeks: 'adj_grand_total_weeks',
    },
  );

  mapUnitSection(
    out,
    child(values, 'logistics'),
    {
      transport_to_btc: 'log_transport_supplier_to_btc',
      transport_from_btc: 'log_transport_btc_to_supplier',
      duty_costs: 'log_duty_costs',
      cleaning_packaging: 'log_cleaning_packaging',
      other_costs: 'log_other_costs',
    },
    {
      left: 'log_grand_total_unit',
      price: 'log_grand_total_price_unit',
      total: 'log_grand_total_sum',
      weeks: 'log_grand_total_weeks',
    },
  );

  mapUnitSection(
    out,
    child(values, 'tool_replacement'),
    {
      die_improvements: 'toolrep_die_improvements',
      others: 'toolrep_others',
    },
    {
      left: 'toolrep_grand_total_unit',
      price: 'toolrep_grand_total_price_unit',
      total: 'toolrep_grand_total_sum',
      weeks: 'toolrep_grand_total_weeks',
    },
  );

  const spareParts = asArray(child(values, 'spare_parts'));
  const spareRows = [
    addRow(out, spareParts[0], 'sp_punch_pins', 'unit', 'price_unit'),
    addRow(out, spareParts[1], 'sp_others', 'unit', 'price_unit'),
  ];
  addTotal(out, {
    left: 'sp_grand_total_unit',
    price: 'sp_grand_total_price_unit',
    total: 'sp_grand_total_sum',
    weeks: 'sp_grand_total_weeks',
  }, sumTotals(spareRows));

  return out;
}

export function quotationFormToDto(tipo: RfqTipo, values: unknown): QuotationDto | FormData {
  const safeValues = isRecord(values) ? values : {};
  const payload = tipo === 'Mold' ? moldFormToPayload(safeValues) : trimmingFormToPayload(safeValues);
  return addFiles(payload, safeValues);
}
