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

export type ExtensionRequestItem = {
  id: number;
  rfqId: number;
  rfqTipo: 'Mold' | 'Trimming';
  rfqNombre: string;
  proveedorNombre: string;
  motivo: string;
  dueDateActual: string;
  nuevaFecha: string;
  status: string;
  solicitadaAt: string;
};

/**
 * Solicitudes de desbloqueo (extensión de tiempo) enviadas por proveedores.
 * Provienen del bloque `solicitudes_extension` de GET /solicitudes/.
 */
export async function listExtensionRequests(signal?: AbortSignal): Promise<ExtensionRequestItem[]> {
  const data = await request(`${BASE}/solicitudes/`, {
    method: 'GET',
    schema: solicitudesPendientesDto,
    signal,
  });
  const mapItem = (
    r: (typeof data.solicitudes_extension.mold)[number],
    tipo: 'Mold' | 'Trimming',
  ): ExtensionRequestItem => ({
    id: r.id,
    rfqId: r.rfq_id ?? 0,
    rfqTipo: tipo,
    rfqNombre: r.rfq_nombre ?? '-',
    proveedorNombre: r.proveedor_nombre ?? '-',
    motivo: r.motivo ?? '-',
    dueDateActual: r.due_date_actual ?? '',
    nuevaFecha: r.nueva_fecha ?? '',
    status: r.status ?? 'Pendiente',
    solicitadaAt: r.solicitada_at ?? '',
  });
  const mold = data.solicitudes_extension.mold.map((r) => mapItem(r, 'Mold'));
  const trimming = data.solicitudes_extension.trimming.map((r) => mapItem(r, 'Trimming'));
  return [...mold, ...trimming].sort((a, b) => b.id - a.id);
}

/**
 * Aprueba o rechaza una solicitud de extensión usando el endpoint vigente de
 * Comercialización (no el legacy de Asignaciones).
 * PATCH /api_comercializacion/v1/extension/<id>/resolver/?tipo=mold|trimming
 */
export async function resolverExtension(
  tipo: RfqTipo,
  id: number,
  status: 'Aprobada' | 'Rechazada',
): Promise<void> {
  await request(`${BASE}/extension/${id}/resolver/${tipoQ(tipo)}`, {
    method: 'PATCH',
    body: { status },
    schema: comercializacionMessageDto,
  });
}
