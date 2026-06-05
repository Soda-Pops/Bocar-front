import type { RfqTipo } from '@/features/analytics/types';
import { tipoParam } from '@/features/rfq/services/rfqLifecycleService';
import { mapDetailToFormValues } from '@/features/rfq/services/rfqDetailToFormValues';
import { mapRfqDetail } from '@/features/rfq/services/rfqMappers';
import type { RfqDetail } from '@/features/rfq/services/rfqDetailService';
import {
  asignacionDetalleDto,
  costBreakdownDto,
  misAsignacionesDto,
  quotationResponseDto,
  type QuotationSendResponseDto,
} from '@/features/supplier/services/asignacionesDtos';
import { mapMisAsignaciones } from '@/features/supplier/services/asignacionesMappers';
import { quotationFormToDto } from '@/features/supplier/services/quotationFormToDto';
import type { SupplierMetric, SupplierRfqRow } from '@/features/supplier/types';
import { request } from '@/shared/http/httpClient';

const BASE = '/api_proveedores/v1/asginaciones';
const tipoQ = (tipo: RfqTipo) => `?tipo=${tipoParam(tipo)}`;

export async function misAsignaciones(signal?: AbortSignal): Promise<{
  assignedRows: SupplierRfqRow[];
  historicalRows: SupplierRfqRow[];
  metrics: SupplierMetric[];
}> {
  const dto = await request(`${BASE}/mis-asignaciones/`, {
    method: 'GET',
    schema: misAsignacionesDto,
    signal,
  });
  return mapMisAsignaciones(dto);
}

export async function detalleAsignacion(tipo: RfqTipo, id: number, signal?: AbortSignal): Promise<RfqDetail> {
  const dto = await request(`${BASE}/detalle/${id}/${tipoQ(tipo)}`, {
    method: 'GET',
    schema: asignacionDetalleDto,
    signal,
  });
  return mapRfqDetail(dto, tipo);
}

export async function detalleAsignacionFormValues(tipo: RfqTipo, id: number, signal?: AbortSignal) {
  const dto = await request(`${BASE}/detalle/${id}/${tipoQ(tipo)}`, {
    method: 'GET',
    schema: asignacionDetalleDto,
    signal,
  });
  return mapDetailToFormValues(tipo, dto);
}

export async function responderCotizacion(tipo: RfqTipo, id: number, values: unknown): Promise<void> {
  await request(`${BASE}/responder/${id}/${tipoQ(tipo)}`, {
    method: 'POST',
    body: quotationFormToDto(values),
    schema: costBreakdownDto,
  });
}

export async function verRespuesta(tipo: RfqTipo, id: number, signal?: AbortSignal): Promise<Record<string, unknown> | null> {
  try {
    return await request(`${BASE}/responder/${id}/detalle/${tipoQ(tipo)}`, {
      method: 'GET',
      schema: costBreakdownDto,
      signal,
    });
  } catch {
    return null;
  }
}

export async function actualizarCotizacion(tipo: RfqTipo, id: number, values: unknown): Promise<void> {
  await request(`${BASE}/responder/${id}/actualizar/${tipoQ(tipo)}`, {
    method: 'PATCH',
    body: quotationFormToDto(values),
    schema: costBreakdownDto,
  });
}

export async function enviarCotizacion(tipo: RfqTipo, id: number): Promise<QuotationSendResponseDto> {
  return request(`${BASE}/responder/${id}/enviar/${tipoQ(tipo)}`, {
    method: 'POST',
    schema: quotationResponseDto,
  });
}
