import type { DashboardRow, RfqTipo } from '@/features/analytics/types';
import { env } from '@/app/config/env';
import type { RfqDetail, RfqSpecField } from '@/features/rfq/services/rfqDetailService';
import type {
  RfqComercializacionListItemDto,
  RfqDetailDto,
  RfqListItemDto,
} from '@/features/rfq/services/rfqDtos';
import { mapBackendStatus, parseProgreso } from '@/features/rfq/services/rfqStatusMapper';
import type { PurchasingDashboardRow, PurchasingPriority, PurchasingRfqRow, PurchasingRfqStatus } from '@/features/purchasing/types';
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

export function resolveFileUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const suffix = url.startsWith('/') ? url : `/${url}`;
  return `${env.apiBaseUrl}${suffix}`;
}

export function mapIndustrializacionRow(dto: RfqListItemDto, tipo: RfqTipo): DashboardRow {
  const status = mapBackendStatus({
    status: dto.status,
    complete: dto.complete,
    logicalDelete: dto.logical_delete,
    allAssignmentsClosed: dto.all_assignments_closed,
    hasReceivedQuote: dto.has_received_quote,
  });

  const displayStatus =
    status === 'DRAFT'
      ? 'Draft'
      : status === 'CLOSED'
      ? 'Done'
      : status === 'BENCHMARK_READY'
      ? 'Benchmark Ready'
      : 'Active';

  return {
    id: formatId(dto.id),
    material: tipo,
    createdBy: dto.created_by_name ?? '-',
    date: formatDateForDisplay(dto.created_date),
    supplier: '-',
    tipo,
    status: displayStatus,
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
  const rawStatus = mapBackendStatus({
    status: dto.status,
    complete: dto.complete,
    allAssignmentsClosed: dto.progreso_proveedores === 'Completo',
    hasReceivedQuote: progress.quoted > 0,
    progreso: dto.progreso_proveedores,
    deadlineExpired: parsedDeadline.expired,
  });
  // ANSWERED es exclusivo de la vista de proveedor; nunca se produce aquí.
  const status: PurchasingRfqStatus = rawStatus === 'ANSWERED' ? 'QUOTING' : rawStatus;

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

export type MapRfqDetailOptions = {
  /** Vista de proveedor: oculta BENCHMARK_READY y la lista de proveedores asignados. */
  forSupplier?: boolean;
  /** Solo aplica con forSupplier: el proveedor ya envió su cotización. */
  isAnswered?: boolean;
};

export function mapRfqDetail(
  dto: RfqDetailDto,
  tipo: RfqTipo,
  options: MapRfqDetailOptions = {},
): RfqDetail {
  const { forSupplier = false, isAnswered = false } = options;
  const raw = dto as Record<string, unknown>;
  let status = mapBackendStatus({
    status: dto.status,
    complete: dto.complete,
    logicalDelete: dto.logical_delete,
    // BENCHMARK_READY es solo para Compras; los proveedores no deben verlo.
    allAssignmentsClosed: forSupplier ? undefined : dto.all_assignments_closed,
    hasReceivedQuote: forSupplier ? undefined : dto.has_received_quote,
  });
  // En la vista de proveedor, si ya respondió, mostramos ANSWERED.
  if (forSupplier && isAnswered && status !== 'CLOSED' && status !== 'CANCELLED') {
    status = 'ANSWERED';
  }
  const files = (dto.archivos ?? []).map((file) => {
    const parts = file.archivo.split(/[\\/]/);
    return {
      id: file.id,
      name: parts[parts.length - 1] ?? file.archivo,
      url: resolveFileUrl(file.archivo),
      uploadedAt: file.uploaded_at,
    };
  });

  const specs =
    tipo === 'Mold'
      ? [
          spec(raw, 'DESC', 'Description'),
          spec(raw, 'CUST', 'Customer'),
          spec(raw, 'PPY', 'Parts per year'),
          spec(raw, 'PT', 'Part Technology'),
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

  // Los proveedores no deben ver la lista de proveedores asignados.
  const suppliers = forSupplier
    ? []
    : (dto.assigned_suppliers ?? []).map((s) => ({
        backendId: s.id_Proveedor__id,
        name: s.id_Proveedor__company_name,
        category: '',
        contact: '',
        score: '',
        scoreTone: 'success' as const,
        status: 'Assigned',
      }));

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
    suppliers,
    benchmark: [],
  };
}
