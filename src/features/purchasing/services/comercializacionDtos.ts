import { z } from 'zod';

import { detailMsgDto, rfqComercializacionListResponseDto } from '@/features/rfq/services/rfqDtos';

export const comercializacionRfqListResponseDto = rfqComercializacionListResponseDto;
export const comercializacionMessageDto = detailMsgDto;

export const proveedorDto = z.object({
  id: z.number(),
  company_name: z.string(),
  contact_email: z.string().nullable().optional(),
  account_email: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  country_name: z.string().nullable().optional(),
  continent: z.string().nullable().optional(),
  continent_name: z.string().nullable().optional(),
  rating: z.number().nullable().optional(),
});

export const proveedoresResponseDto = z.array(proveedorDto);

const editRequestItemDto = z.object({
  id: z.number(),
  rfq_mold: z.number().nullable().optional(),
  rfq_trimming: z.number().nullable().optional(),
  requested_by_name: z.string().optional(),
  requested_at: z.string().optional(),
  status: z.string().optional(),
  reason: z.string().nullable().optional(),
});

const extensionItemDto = z.object({
  id: z.number(),
  rfq_id: z.number().nullable().optional(),
  rfq_nombre: z.string().nullable().optional(),
  proveedor_nombre: z.string().nullable().optional(),
  motivo: z.string().nullable().optional(),
  due_date_actual: z.string().nullable().optional(),
  nueva_fecha: z.string().nullable().optional(),
  status: z.string().optional(),
  solicitada_at: z.string().optional(),
});

export const solicitudesPendientesDto = z.object({
  solicitudes_edicion: z.object({
    mold: z.array(editRequestItemDto).default([]),
    trimming: z.array(editRequestItemDto).default([]),
  }),
  solicitudes_extension: z.object({
    mold: z.array(extensionItemDto).default([]),
    trimming: z.array(extensionItemDto).default([]),
  }),
});

export type ProveedorDto = z.infer<typeof proveedorDto>;

