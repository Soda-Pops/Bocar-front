import { z } from 'zod';

import type { RfqTipo } from '@/features/analytics/types';
import { tipoParam } from '@/features/rfq/services/rfqLifecycleService';
import { request } from '@/shared/http/httpClient';

const COMERCIALIZACION_BASE = '/api_comercializacion/v1';

const comparativaRowDto = z.object({
  usuario_id: z.number(),
  nombre_empresa: z.string(),
  accs_grand_total_sum: z.number().nullable().optional(),
  mat_grand_total_sum: z.number().nullable().optional(),
  grand_total_sum: z.number().nullable().optional(),
  corr_grand_total_sum: z.number().nullable().optional(),
  log_grand_total_sum: z.number().nullable().optional(),
  precio_total: z.number().nullable().optional(),
});

const comparativaResponseDto = z.array(comparativaRowDto);

export type RfqComparativaRow = {
  usuarioId: number;
  nombreEmpresa: string;
  accsGrandTotal: number;
  matGrandTotal: number;
  grandTotal: number;
  corrGrandTotal: number;
  logGrandTotal: number;
  precioTotal: number;
};

export async function getRfqComparativa(
  tipo: RfqTipo,
  rfqId: number,
  signal?: AbortSignal,
): Promise<RfqComparativaRow[]> {
  const dto = await request(
    `${COMERCIALIZACION_BASE}/rfq/${rfqId}/comparativa/?tipo=${tipoParam(tipo)}`,
    { method: 'GET', schema: comparativaResponseDto, signal },
  );
  return dto.map((row) => ({
    usuarioId: row.usuario_id,
    nombreEmpresa: row.nombre_empresa,
    accsGrandTotal: row.accs_grand_total_sum ?? 0,
    matGrandTotal: row.mat_grand_total_sum ?? 0,
    grandTotal: row.grand_total_sum ?? 0,
    corrGrandTotal: row.corr_grand_total_sum ?? 0,
    logGrandTotal: row.log_grand_total_sum ?? 0,
    precioTotal: row.precio_total ?? 0,
  }));
}
