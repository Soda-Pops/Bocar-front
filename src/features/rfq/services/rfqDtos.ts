import { z } from 'zod';

export const backendRfqStatusDto = z.enum(['En_Ind', 'En_Com', 'En_Pro']);

export const detailMsgDto = z.object({
  detail: z.string(),
});

export const uploadedFileDto = z.object({
  id: z.number(),
  archivo: z.string(),
  uploaded_at: z.string(),
});

export const rfqListItemDto = z.object({
  id: z.number(),
  status: backendRfqStatusDto,
  created_by: z.number().nullable().optional(),
  created_by_name: z.string().nullable().optional(),
  created_date: z.string(),
  due_date: z.string(),
  complete: z.boolean().default(false),
  logical_delete: z.boolean().default(false),
  rfq_type: z.string().optional(),
});

export const rfqIndustrializacionListResponseDto = z.object({
  mold: z.array(rfqListItemDto),
  trimming: z.array(rfqListItemDto),
});

export const rfqComercializacionListItemDto = z.object({
  id: z.number(),
  nombre_pieza: z.string().nullable().optional(),
  status: backendRfqStatusDto,
  tipo: z.string().optional(),
  deadline: z.string(),
  fecha_creacion: z.string(),
  creado_por: z.string().nullable().optional(),
  progreso_proveedores: z.string().optional(),
});

export const rfqComercializacionListResponseDto = z.object({
  mold: z.array(rfqComercializacionListItemDto),
  trimming: z.array(rfqComercializacionListItemDto),
});

export const rfqDetailDto = z
  .object({
    id: z.number(),
    status: backendRfqStatusDto,
    created_by: z.number().nullable().optional(),
    created_by_name: z.string().nullable().optional(),
    created_date: z.string().optional(),
    due_date: z.string(),
    complete: z.boolean().default(false),
    logical_delete: z.boolean().default(false),
    archivos: z.array(uploadedFileDto).optional(),
  })
  .passthrough();

export const dashboardCountDto = z.object({
  completados: z.number(),
  en_comercializacion: z.number(),
  borradores: z.number(),
  histograma: z.record(z.string(), z.number()).or(z.array(z.unknown())).optional(),
});

export type BackendRfqStatusDto = z.infer<typeof backendRfqStatusDto>;
export type RfqListItemDto = z.infer<typeof rfqListItemDto>;
export type RfqComercializacionListItemDto = z.infer<typeof rfqComercializacionListItemDto>;
export type RfqDetailDto = z.infer<typeof rfqDetailDto>;
export type DashboardCountDto = z.infer<typeof dashboardCountDto>;

