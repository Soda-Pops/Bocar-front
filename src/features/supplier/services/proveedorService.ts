import { z } from 'zod';
import { request } from '@/shared/http/httpClient';

export const miPerfilDto = z.object({
  company_name:   z.string(),
  continent_name: z.string(),
  country_name:   z.string().nullable(),
  rating:         z.number(),
});

export type MiPerfilDto = z.infer<typeof miPerfilDto>;

export async function fetchMiPerfil(signal?: AbortSignal): Promise<MiPerfilDto> {
  return request('/api_proveedores/v1/mi-perfil/', {
    method: 'GET',
    schema: miPerfilDto,
    signal,
  });
}
