import type { RfqTipo } from '@/features/analytics/types';
import type { AsignacionDto, MisAsignacionesDto } from '@/features/supplier/services/asignacionesDtos';
import type { SupplierMetric, SupplierRfqRow } from '@/features/supplier/types';
import { formatDateForDisplay, parseBackendDeadline } from '@/shared/utils/deadline';
import { formatId } from '@/shared/utils/rfqId';

function mapAssignment(dto: AsignacionDto, tipo: RfqTipo, answered: boolean): SupplierRfqRow {
  return {
    id: formatId(dto.rfq_id),
    desc: dto.DESC?.trim() || '-',
    assignmentId: dto.id,
    status: answered ? 'DONE' : dto.tiene_borrador ? 'QUOTED' : 'PENDING',
    tipo,
    deadline: formatDateForDisplay(dto.due_date),
    dueDate: dto.due_date,
    expired: dto.en_tiempo === false || parseBackendDeadline(dto.deadline).expired,
  };
}

export function mapMisAsignaciones(dto: MisAsignacionesDto): {
  pendingRows: SupplierRfqRow[];
  quotedRows: SupplierRfqRow[];
  historicalRows: SupplierRfqRow[];
  metrics: SupplierMetric[];
} {
  // Asignadas (is_answered=False): se separan en PENDING (sin borrador) y
  // QUOTED (con borrador guardado). Contestadas (is_answered=True) = historical.
  const assignedRows = [
    ...dto.pendientes.mold.map((item) => mapAssignment(item, 'Mold', false)),
    ...dto.pendientes.trimming.map((item) => mapAssignment(item, 'Trimming', false)),
  ];
  const pendingRows = assignedRows.filter((row) => row.status === 'PENDING');
  const quotedRows = assignedRows.filter((row) => row.status === 'QUOTED');
  const historicalRows = [
    ...dto.contestadas.mold.map((item) => mapAssignment(item, 'Mold', true)),
    ...dto.contestadas.trimming.map((item) => mapAssignment(item, 'Trimming', true)),
  ];

  return {
    pendingRows,
    quotedRows,
    historicalRows,
    // 3 cards que coinciden 1:1 con los 3 tabs.
    metrics: [
      { key: 'pending', label: 'PENDING RFQs', value: String(pendingRows.length), valueColor: '#c8970a' },
      { key: 'quoted', label: 'QUOTED RFQs', value: String(quotedRows.length), valueColor: '#5a8a1f' },
      { key: 'historical', label: 'HISTORICAL RFQs', value: String(historicalRows.length), valueColor: 'var(--bocar-blue-50)' },
    ],
  };
}
