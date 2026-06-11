import { z } from 'zod';

export const backendRfqStatusDto = z.enum(['En_Ind', 'En_Com', 'En_Pro']);
export const operationalRfqStatusDto = z.enum([
  'PENDING',
  'QUOTING',
  'BENCHMARK_READY',
  'CLOSED',
  'EXPIRED',
]);

export const detailMsgDto = z.object({
  detail: z.string(),
});

export const createRfqResponseDto = detailMsgDto.extend({
  id: z.number(),
});

export const uploadedFileDto = z.object({
  id: z.number(),
  archivo: z.string(),
  uploaded_at: z.string(),
});

export const rfqListItemDto = z.object({
  id: z.number(),
  DESC: z.string().nullable().optional(),
  status: backendRfqStatusDto,
  created_by: z.number().nullable().optional(),
  created_by_name: z.string().nullable().optional(),
  created_date: z.string(),
  due_date: z.string(),
  complete: z.boolean().default(false),
  logical_delete: z.boolean().default(false),
  rfq_type: z.string().optional(),
  all_assignments_closed: z.boolean().default(false),
  has_received_quote: z.boolean().default(false),
});

export const rfqIndustrializacionListResponseDto = z.object({
  mold: z.array(rfqListItemDto),
  trimming: z.array(rfqListItemDto),
});

export const rfqComercializacionListItemDto = z.object({
  id: z.number(),
  DESC: z.string().nullable().optional(),
  nombre_pieza: z.string().nullable().optional(),
  status: backendRfqStatusDto,
  complete: z.boolean().default(false),
  tipo: z.string().optional(),
  deadline: z.string(),
  fecha_creacion: z.string(),
  creado_por: z.string().nullable().optional(),
  progreso_proveedores: z.string().optional(),
  operational_status: operationalRfqStatusDto.optional(),
});

export const rfqComercializacionListResponseDto = z.object({
  mold: z.array(rfqComercializacionListItemDto),
  trimming: z.array(rfqComercializacionListItemDto),
});

export const assignedSupplierDto = z.object({
  id_Proveedor__id: z.number(),
  id_Proveedor__company_name: z.string(),
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
    all_assignments_closed: z.boolean().default(false),
    has_received_quote: z.boolean().default(false),
    assigned_suppliers: z.array(assignedSupplierDto).default([]),
  })
  .passthrough();

export type AssignedSupplierDto = z.infer<typeof assignedSupplierDto>;

const dashboardCountGroupDto = z.object({
  molds: z.number(),
  trimmings: z.number(),
  total: z.number(),
});

export const dashboardCountDto = z.object({
  completados: dashboardCountGroupDto,
  en_comercializacion: dashboardCountGroupDto,
  borradores: dashboardCountGroupDto.extend({
    user_id: z.number().optional(),
  }),
  estatus: z
    .object({
      PENDING: dashboardCountGroupDto,
      QUOTING: dashboardCountGroupDto,
      BENCHMARK_READY: dashboardCountGroupDto,
      CLOSED: dashboardCountGroupDto,
      EXPIRED: dashboardCountGroupDto,
    })
    .optional(),
  histograma: z.record(z.string(), z.number()).or(z.array(z.unknown())).optional(),
});

export type BackendRfqStatusDto = z.infer<typeof backendRfqStatusDto>;
export type OperationalRfqStatusDto = z.infer<typeof operationalRfqStatusDto>;
export type CreateRfqResponseDto = z.infer<typeof createRfqResponseDto>;
export type RfqListItemDto = z.infer<typeof rfqListItemDto>;
export type RfqComercializacionListItemDto = z.infer<typeof rfqComercializacionListItemDto>;
export type RfqDetailDto = z.infer<typeof rfqDetailDto>;
export type DashboardCountDto = z.infer<typeof dashboardCountDto>;
