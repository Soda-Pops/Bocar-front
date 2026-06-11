import { z } from 'zod';

import type { RfqTipo } from '@/features/analytics/types';
import type { RfqDetailDto } from '@/features/rfq/services/rfqDtos';
import { http } from '@/shared/http/httpClient';

export type AiPredictionInput = {
  die_casting_machine: number;
  part_lenght: number;
  part_height: number;
  part_depth: number;
  part_weight_kg: number;
  total_part_weight_kg: number;
  projected_area_per_part_cm2: number;
  total_projected_area_cm2: number;
  no_of_cavities: number;
  plates: number;
  sliders: number;
  subcores: number;
  squeezers: number;
  total_mechanisms: number;
  inserts: number;
  jet_coolers: number;
  product_type: string;
  comodity: string;
  country: string;
};

const aiPredictionDto = z.object({
  supplier: z.string(),
  price: z.number(),
  price_low: z.number(),
  price_high: z.number(),
});

const aiPredictionResponseDto = z.object({
  predictions: z.array(aiPredictionDto),
  message: z.string(),
});

export type AiPredictionDto = z.infer<typeof aiPredictionDto>;

export type AiPrediction = {
  supplier: string;
  price: number;
  priceLow: number;
  priceHigh: number;
};

export type AiPredictionResponse = {
  predictions: AiPrediction[];
  message: string;
};

type RawRfq = Record<string, unknown>;

function numberParts(value: unknown): number[] {
  if (typeof value === 'number' && Number.isFinite(value)) return [value];
  if (typeof value !== 'string') return [];
  return [...value.matchAll(/-?\d+(?:[.,]\d+)?/g)]
    .map((match) => Number(match[0].replace(',', '.')))
    .filter((n) => Number.isFinite(n));
}

function toNum(value: unknown): number {
  const [first] = numberParts(value);
  return first ?? 0;
}

function positiveOrOne(value: unknown): number {
  const parsed = Math.trunc(toNum(value));
  return parsed > 0 ? parsed : 1;
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function mapResponse(dto: z.infer<typeof aiPredictionResponseDto>): AiPredictionResponse {
  return {
    message: dto.message,
    predictions: dto.predictions.map((prediction) => ({
      supplier: prediction.supplier,
      price: prediction.price,
      priceLow: prediction.price_low,
      priceHigh: prediction.price_high,
    })),
  };
}

export function buildMoldPredictionInput(dto: RfqDetailDto): AiPredictionInput {
  const raw = dto as RawRfq;
  const cavities = positiveOrOne(raw.No_CAV);
  const partWeightKg = toNum(raw.gross_weight_g) / 1000;
  const projectedArea = toNum(raw.projected_area_cm2);
  const sliders = toNum(raw.No_ofHS) + toNum(raw.No_ofMS);
  const subcores = toNum(raw.No_subc);
  const squeezers = toNum(raw.Spin);

  return {
    die_casting_machine: toNum(raw.SMACH),
    part_lenght: toNum(raw.part_dim_length_mm),
    part_height: toNum(raw.part_dim_height_mm),
    part_depth: toNum(raw.part_dim_width_mm),
    part_weight_kg: partWeightKg,
    total_part_weight_kg: partWeightKg * cavities,
    projected_area_per_part_cm2: projectedArea,
    total_projected_area_cm2: projectedArea * cavities,
    no_of_cavities: cavities,
    plates: Math.trunc(toNum(raw.three_plate_mold)),
    sliders,
    subcores,
    squeezers,
    total_mechanisms: sliders + subcores + squeezers,
    inserts: toNum(raw.Ihtcs),
    jet_coolers: toNum(raw.Jco),
    product_type: toText(raw.TT),
    comodity: toText(raw.PT),
    country: '',
  };
}

export function buildTrimmingPredictionInput(dto: RfqDetailDto): AiPredictionInput {
  const raw = dto as RawRfq;
  const dimensions = numberParts(raw.part_dimension);
  const cavities = positiveOrOne(raw.no_of_cavities);
  const partWeightKg = toNum(raw.gross_weight_g) / 1000;
  const projectedArea = toNum(raw.projected_area_cm2);
  const sliders = toNum(raw.no_of_hydraulic_slides);
  const subcores = 0;
  const squeezers = toNum(raw.quantity_of_punch_pins);

  return {
    die_casting_machine: toNum(raw.press),
    part_lenght: toNum(raw.part_dim_length_mm) || dimensions[0] || 0,
    part_height: dimensions[1] || 0,
    part_depth: dimensions[2] || 0,
    part_weight_kg: partWeightKg,
    total_part_weight_kg: partWeightKg * cavities,
    projected_area_per_part_cm2: projectedArea,
    total_projected_area_cm2: projectedArea * cavities,
    no_of_cavities: cavities,
    plates: 0,
    sliders,
    subcores,
    squeezers,
    total_mechanisms: sliders + subcores + squeezers,
    inserts: 0,
    jet_coolers: 0,
    product_type: toText(raw.trimming_process_condition),
    comodity: '',
    country: '',
  };
}

export function buildAiPredictionInput(dto: RfqDetailDto, tipo: RfqTipo): AiPredictionInput {
  return tipo === 'Mold' ? buildMoldPredictionInput(dto) : buildTrimmingPredictionInput(dto);
}

export async function fetchAiPredictions(
  input: AiPredictionInput,
  signal?: AbortSignal,
): Promise<AiPredictionResponse> {
  const dto = await http.post<z.infer<typeof aiPredictionResponseDto>>('/api_ia/v1/predictions/', input, {
    signal,
    schema: aiPredictionResponseDto,
  });
  return mapResponse(dto);
}

export const createCostPrediction = fetchAiPredictions;
export type CostPredictionPayload = AiPredictionInput;
export type CostPrediction = AiPrediction;
export type CostPredictionResponse = AiPredictionResponse;
