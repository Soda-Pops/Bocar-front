import type { DashboardRow, RfqTipo } from '@/features/analytics/types';
import type { RfqDetail, RfqSpecField } from '@/features/rfq/services/rfqDetailService';
import type {
  RfqComercializacionListItemDto,
  RfqDetailDto,
  RfqListItemDto,
} from '@/features/rfq/services/rfqDtos';
import { mapBackendStatus, parseProgreso } from '@/features/rfq/services/rfqStatusMapper';
import type { PurchasingDashboardRow, PurchasingPriority, PurchasingRfqRow } from '@/features/purchasing/types';
import { parseBackendDeadline, formatDateForDisplay } from '@/shared/utils/deadline';
import { formatId } from '@/shared/utils/rfqId';

function valueOf(dto: Record<string, unknown>, key: string): string {
  const value = dto[key];
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function spec(dto: Record<string, unknown>, code: string, label: string): RfqSpecField {
  return { code, label, value: valueOf(dto, code) };
}

function inferTitle(dto: Record<string, unknown>, tipo: RfqTipo): string {
  if (tipo === 'Mold') return valueOf(dto, 'PT') !== '-' ? valueOf(dto, 'PT') : valueOf(dto, 'DESC');
  return valueOf(dto, 'part_name') !== '-' ? valueOf(dto, 'part_name') : valueOf(dto, 'DESC');
}

function inferMaterial(dto: Record<string, unknown>): string {
  return valueOf(dto, 'alloy') !== '-' ? valueOf(dto, 'alloy') : valueOf(dto, 'DESC');
}

export function mapIndustrializacionRow(dto: RfqListItemDto, tipo: RfqTipo): DashboardRow {
  const status = mapBackendStatus({
    status: dto.status,
    complete: dto.complete,
    logicalDelete: dto.logical_delete,
  });

  return {
    id: formatId(dto.id),
    material: tipo,
    createdBy: dto.created_by_name ?? '-',
    date: formatDateForDisplay(dto.created_date),
    supplier: '-',
    tipo,
    status: status === 'DRAFT' ? 'Draft' : status === 'CLOSED' ? 'Done' : 'Active',
  };
}

function priorityFromHours(hours: number): PurchasingPriority {
  if (hours <= 48) return 'High';
  if (hours <= 168) return 'Medium';
  return 'Low';
}

export function mapComercializacionRow(
  dto: RfqComercializacionListItemDto,
  tipo: RfqTipo,
): PurchasingDashboardRow & PurchasingRfqRow {
  const parsedDeadline = parseBackendDeadline(dto.deadline);
  const progress = parseProgreso(dto.progreso_proveedores);
  const status = mapBackendStatus({
    status: dto.status,
    complete: dto.progreso_proveedores === 'Completo',
    progreso: dto.progreso_proveedores,
    deadlineExpired: parsedDeadline.expired,
  });

  const supplierProgress =
    progress.total > 0
      ? {
          quotedSuppliers: progress.quoted,
          totalSuppliers: progress.total,
          label: dto.progreso_proveedores ?? `${progress.quoted}/${progress.total} contestados`,
        }
      : null;

  return {
    id: formatId(dto.id),
    material: tipo,
    project: dto.nombre_pieza ?? formatId(dto.id),
    supplierSuggestion: '',
    region: 'N/A',
    machineType: tipo,
    deadline: dto.deadline,
    hoursToDeadline: parsedDeadline.hours,
    priority: priorityFromHours(parsedDeadline.hours),
    owner: dto.creado_por ?? '-',
    status,
    createdAt: dto.fecha_creacion,
    supplierProgress,
  };
}

export function mapRfqDetail(dto: RfqDetailDto, tipo: RfqTipo): RfqDetail {
  const raw = dto as Record<string, unknown>;
  const status = mapBackendStatus({
    status: dto.status,
    complete: dto.complete,
    logicalDelete: dto.logical_delete,
  });
  const files = (dto.archivos ?? []).map((file) => {
    const parts = file.archivo.split(/[\\/]/);
    return { name: parts[parts.length - 1] ?? file.archivo };
  });

  const specs =
    tipo === 'Mold'
      ? [
          spec(raw, 'DESC', 'Description'),
          spec(raw, 'CUST', 'Customer'),
          spec(raw, 'PPY', 'Parts per year'),
          spec(raw, 'PT', 'Part Technology'),
          spec(raw, 'PNUM', 'Part number'),
          spec(raw, 'comments', 'Comments'),
        ]
      : [
          spec(raw, 'DESC', 'Description'),
          spec(raw, 'CUST', 'Customer'),
          spec(raw, 'PPY', 'Parts per year'),
          spec(raw, 'part_name', 'Part name'),
          spec(raw, 'part_number', 'Part number'),
          spec(raw, 'comments', 'Comments'),
        ];

  return {
    id: formatId(dto.id),
    title: inferTitle(raw, tipo),
    material: inferMaterial(raw),
    client: valueOf(raw, 'CUST'),
    createdBy: dto.created_by_name ?? '-',
    createdById: String(dto.created_by ?? ''),
    createdAt: formatDateForDisplay(dto.created_date),
    status,
    deadline: formatDateForDisplay(dto.due_date),
    specs,
    files,
    suppliers: [],
    benchmark: [],
  };
}

