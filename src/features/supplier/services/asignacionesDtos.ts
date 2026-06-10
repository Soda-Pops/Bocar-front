import { z } from 'zod';

import { detailMsgDto, rfqDetailDto } from '@/features/rfq/services/rfqDtos';

export const asignacionDto = z.object({
  id: z.number(),
  rfq_nombre: z.string().nullable().optional(),
  DESC: z.string().nullable().optional(),
  fecha_de_asignacion: z.string(),
  due_date: z.string(),
  deadline: z.string(),
  en_tiempo: z.boolean().optional(),
  tiene_borrador: z.boolean().optional(),
  is_answered: z.boolean(),
  is_closed: z.boolean(),
});

export const misAsignacionesDto = z.object({
  pendientes: z.object({
    mold: z.array(asignacionDto),
    trimming: z.array(asignacionDto),
  }),
  contestadas: z.object({
    mold: z.array(asignacionDto),
    trimming: z.array(asignacionDto),
  }),
});

export const asignacionDetalleDto = rfqDetailDto;

export const asignacionDetalleConBorradorDto = z.object({
  rfq: rfqDetailDto,
  tiene_borrador: z.boolean(),
  is_answered: z.boolean().default(false),
});

export const quotationResponseDto = z.object({
  assignment_closed: z.boolean().optional(),
  rfq_completed: z.boolean().optional(),
}).passthrough().or(detailMsgDto);

export const costBreakdownDto = z.record(z.string(), z.unknown());

export type AsignacionDto = z.infer<typeof asignacionDto>;
export type MisAsignacionesDto = z.infer<typeof misAsignacionesDto>;
export type QuotationSendResponseDto = z.infer<typeof quotationResponseDto>;
