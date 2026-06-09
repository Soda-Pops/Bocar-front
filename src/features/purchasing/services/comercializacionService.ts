import type { RfqTipo } from '@/features/analytics/types';
import {
  comercializacionMessageDto,
  comercializacionRfqListResponseDto,
  solicitudesPendientesDto,
} from '@/features/purchasing/services/comercializacionDtos';
import { mapComercializacionRow } from '@/features/rfq/services/rfqMappers';
import { tipoParam } from '@/features/rfq/services/rfqLifecycleService';
import type { PurchasingDashboardRow, PurchasingRfqRow } from '@/features/purchasing/types';
import { request } from '@/shared/http/httpClient';

const BASE = '/api_comercializacion/v1';

const tipoQ = (tipo: RfqTipo) => `?tipo=${tipoParam(tipo)}`;

export async function listRfqsComercializacion(
  signal?: AbortSignal,
): Promise<Array<PurchasingDashboardRow & PurchasingRfqRow>> {
  const dto = await request(`${BASE}/rfqs/`, {
    method: 'GET',
    schema: comercializacionRfqListResponseDto,
    signal,
  });
  return [
    ...dto.mold.map((item) => mapComercializacionRow(item, 'Mold')),
    ...dto.trimming.map((item) => mapComercializacionRow(item, 'Trimming')),
  ].filter((row) => row.status !== 'DRAFT');
}

export async function createAsignaciones(
  tipo: RfqTipo,
  input: { id_rfq: number; due_date: string; proveedores: number[] },
): Promise<void> {
  await request(`${BASE}/asignaciones/crear/${tipoQ(tipo)}`, {
    method: 'POST',
    body: input,
    schema: comercializacionMessageDto,
  });
}

export async function approveEdit(tipo: RfqTipo, id: number): Promise<void> {
  await request(`${BASE}/edit-requests/${id}/aprobar/${tipoQ(tipo)}`, {
    method: 'PATCH',
    schema: comercializacionMessageDto,
  });
}

export async function rejectEdit(tipo: RfqTipo, id: number): Promise<void> {
  await request(`${BASE}/edit-requests/${id}/rechazar/${tipoQ(tipo)}`, {
    method: 'PATCH',
    schema: comercializacionMessageDto,
  });
}

export async function listSolicitudes(signal?: AbortSignal): Promise<unknown> {
  return request(`${BASE}/solicitudes/`, {
    method: 'GET',
    schema: solicitudesPendientesDto,
    signal,
  });
}

export type EditRequestItem = {
  id: number;
  rfqId: number;
  rfqTipo: 'Mold' | 'Trimming';
  requestedByName: string;
  requestedAt: string;
  reason: string;
  status: string;
};

export async function listEditRequests(signal?: AbortSignal): Promise<EditRequestItem[]> {
  const data = await request(`${BASE}/solicitudes/`, {
    method: 'GET',
    schema: solicitudesPendientesDto,
    signal,
  });
  const mold = data.solicitudes_edicion.mold.map((r) => ({
    id: r.id,
    rfqId: r.rfq_mold ?? 0,
    rfqTipo: 'Mold' as const,
    requestedByName: r.requested_by_name ?? '-',
    requestedAt: r.requested_at ?? '',
    reason: r.reason ?? '-',
    status: r.status ?? 'SOLICITUD_EDICION',
  }));
  const trimming = data.solicitudes_edicion.trimming.map((r) => ({
    id: r.id,
    rfqId: r.rfq_trimming ?? 0,
    rfqTipo: 'Trimming' as const,
    requestedByName: r.requested_by_name ?? '-',
    requestedAt: r.requested_at ?? '',
    reason: r.reason ?? '-',
    status: r.status ?? 'SOLICITUD_EDICION',
  }));
  return [...mold, ...trimming].sort((a, b) => b.id - a.id);
}
