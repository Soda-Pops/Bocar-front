import { z } from 'zod';
import type { RfqTipo } from '@/features/analytics/types';
import type { MoldFormValues } from '@/features/rfq/components/RfqForm/definitions/moldDefinition';
import type { TrimmingFormValues } from '@/features/rfq/components/RfqForm/definitions/trimmingDefinition';
import {
  createRfqResponseDto,
  dashboardCountDto,
  detailMsgDto,
  rfqDetailDto,
  rfqIndustrializacionListResponseDto,
  type CreateRfqResponseDto,
  type DashboardCountDto,
} from '@/features/rfq/services/rfqDtos';
import { rfqFormToFormData } from '@/features/rfq/services/rfqFormToDto';
import { mapDetailToFormValues } from '@/features/rfq/services/rfqDetailToFormValues';
import { mapIndustrializacionRow, mapRfqDetail } from '@/features/rfq/services/rfqMappers';
import type { RfqDetail } from '@/features/rfq/services/rfqDetailService';
import type { DashboardRow } from '@/features/analytics/types';
import { request } from '@/shared/http/httpClient';

const INDUSTRIALIZACION_BASE = '/api_industrializacion/v1';
const GENERAL_BASE = '/api_general/v1';

export const tipoParam = (tipo: RfqTipo): 'mold' | 'trimming' =>
  tipo === 'Mold' ? 'mold' : 'trimming';

const tipoQ = (tipo: RfqTipo) => `?tipo=${tipoParam(tipo)}`;

export async function listRfqsIndustrializacion(signal?: AbortSignal): Promise<DashboardRow[]> {
  const dto = await request(`${INDUSTRIALIZACION_BASE}/rfqs/`, {
    method: 'GET',
    schema: rfqIndustrializacionListResponseDto,
    signal,
  });
  return [
    ...dto.mold.map((item) => mapIndustrializacionRow(item, 'Mold')),
    ...dto.trimming.map((item) => mapIndustrializacionRow(item, 'Trimming')),
  ];
}

export async function fetchDashboardCounts(userId?: number, signal?: AbortSignal): Promise<DashboardCountDto> {
  const suffix = userId ? `?user_id=${userId}` : '';
  return request(`${GENERAL_BASE}/rfq-count/${suffix}`, {
    method: 'GET',
    schema: dashboardCountDto,
    signal,
  });
}

export async function createRfq(
  tipo: RfqTipo,
  values: MoldFormValues | TrimmingFormValues,
): Promise<CreateRfqResponseDto> {
  return request(`${INDUSTRIALIZACION_BASE}/rfq/${tipoQ(tipo)}`, {
    method: 'POST',
    body: rfqFormToFormData(tipo, values),
    schema: createRfqResponseDto,
  });
}

export async function updateRfq(
  tipo: RfqTipo,
  id: number,
  values: MoldFormValues | TrimmingFormValues,
): Promise<{ detail: string }> {
  return request(`${INDUSTRIALIZACION_BASE}/rfq/${id}/${tipoQ(tipo)}`, {
    method: 'PATCH',
    body: rfqFormToFormData(tipo, values),
    schema: detailMsgDto,
  });
}

export async function sendRfqToCom(tipo: RfqTipo, id: number): Promise<void> {
  await request(`${INDUSTRIALIZACION_BASE}/rfq/${id}/enviar/${tipoQ(tipo)}`, {
    method: 'POST',
    schema: detailMsgDto,
  });
}

export async function deleteRfq(tipo: RfqTipo, id: number): Promise<void> {
  await request(`${INDUSTRIALIZACION_BASE}/rfq/${id}/${tipoQ(tipo)}`, {
    method: 'DELETE',
  });
}

export async function requestEdit(tipo: RfqTipo, id: number, reason: string): Promise<void> {
  const key = tipo === 'Mold' ? 'rfq_mold' : 'rfq_trimming';
  await request(`${INDUSTRIALIZACION_BASE}/edit-requests/${tipoQ(tipo)}`, {
    method: 'POST',
    body: { [key]: id, reason },
    schema: detailMsgDto,
  });
}

const COMERCIALIZACION_BASE = '/api_comercializacion/v1';

const solicitudesEdicionDto = z.object({
  solicitudes_edicion: z.object({
    mold: z.array(z.object({ id: z.number(), rfq_mold: z.number().optional() })).default([]),
    trimming: z.array(z.object({ id: z.number(), rfq_trimming: z.number().optional() })).default([]),
  }),
});

export async function getPendingEditRequestId(tipo: RfqTipo, rfqNumericId: number): Promise<number> {
  const data = await request(`${COMERCIALIZACION_BASE}/solicitudes/`, {
    method: 'GET',
    schema: solicitudesEdicionDto,
  });
  const list =
    tipo === 'Mold'
      ? data.solicitudes_edicion.mold
      : data.solicitudes_edicion.trimming;
  const match = list.find((r) =>
    tipo === 'Mold'
      ? (r as { rfq_mold?: number }).rfq_mold === rfqNumericId
      : (r as { rfq_trimming?: number }).rfq_trimming === rfqNumericId,
  );
  if (!match) throw new Error('No se encontró la solicitud de edición pendiente.');
  return match.id;
}

export async function approveEditRequest(tipo: RfqTipo, editRequestId: number): Promise<void> {
  await request(`${COMERCIALIZACION_BASE}/edit-requests/${editRequestId}/aprobar/${tipoQ(tipo)}`, {
    method: 'PATCH',
    schema: detailMsgDto,
  });
}

export async function rejectEditRequest(tipo: RfqTipo, editRequestId: number): Promise<void> {
  await request(`${COMERCIALIZACION_BASE}/edit-requests/${editRequestId}/rechazar/${tipoQ(tipo)}`, {
    method: 'PATCH',
    schema: detailMsgDto,
  });
}

export async function closeRfq(
  tipo: RfqTipo,
  id: number,
  body: { closure_reason: string },
): Promise<void> {
  await request(`${COMERCIALIZACION_BASE}/rfq/${id}/cerrar/${tipoQ(tipo)}`, {
    method: 'POST',
    body,
    schema: detailMsgDto,
  });
}

export async function getRfqDetail(tipo: RfqTipo, id: number, signal?: AbortSignal): Promise<RfqDetail> {
  const path =
    tipo === 'Mold'
      ? `/api_mold/v1/rfq-molds/${id}/`
      : `/api_trimming/v1/rfq-trimmings/${id}/`;
  const dto = await request(path, {
    method: 'GET',
    schema: rfqDetailDto,
    signal,
  });
  return mapRfqDetail(dto, tipo);
}

export async function getRfqFormValues(tipo: RfqTipo, id: number, signal?: AbortSignal) {
  const path =
    tipo === 'Mold'
      ? `/api_mold/v1/rfq-molds/${id}/`
      : `/api_trimming/v1/rfq-trimmings/${id}/`;
  const dto = await request(path, {
    method: 'GET',
    schema: rfqDetailDto,
    signal,
  });
  return mapDetailToFormValues(tipo, dto);
}
