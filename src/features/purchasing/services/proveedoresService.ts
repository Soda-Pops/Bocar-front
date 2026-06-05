import type { RfqSupplier } from '@/features/rfq/services/rfqDetailService';
import { proveedoresResponseDto } from '@/features/purchasing/services/comercializacionDtos';
import { mapProveedorToSupplier } from '@/features/purchasing/services/comercializacionMappers';
import { request } from '@/shared/http/httpClient';

export async function listProveedores(signal?: AbortSignal): Promise<RfqSupplier[]> {
  const dto = await request('/api_proveedores/v1/proveedores/', {
    method: 'GET',
    schema: proveedoresResponseDto,
    signal,
  });
  return dto.map(mapProveedorToSupplier);
}

