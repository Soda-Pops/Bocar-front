import type { RfqTipo } from '@/features/analytics/types';
import type { AsignacionDto, MisAsignacionesDto } from '@/features/supplier/services/asignacionesDtos';
import type { SupplierMetric, SupplierRfqRow } from '@/features/supplier/types';
import { formatDateForDisplay } from '@/shared/utils/deadline';
import { formatId } from '@/shared/utils/rfqId';

function mapAssignment(dto: AsignacionDto, tipo: RfqTipo, answered: boolean): SupplierRfqRow {
  return {
    id: formatId(dto.id),
    assignmentId: dto.id,
    status: answered ? 'DONE' : dto.tiene_borrador ? 'QUOTED' : 'PENDING',
    tipo,
    deadline: formatDateForDisplay(dto.due_date),
  };
}

export function mapMisAsignaciones(dto: MisAsignacionesDto): {
  assignedRows: SupplierRfqRow[];
  historicalRows: SupplierRfqRow[];
  metrics: SupplierMetric[];
} {
  const assignedRows = [
    ...dto.pendientes.mold.map((item) => mapAssignment(item, 'Mold', false)),
    ...dto.pendientes.trimming.map((item) => mapAssignment(item, 'Trimming', false)),
  ];
  const historicalRows = [
    ...dto.contestadas.mold.map((item) => mapAssignment(item, 'Mold', true)),
    ...dto.contestadas.trimming.map((item) => mapAssignment(item, 'Trimming', true)),
  ];
  const pending = assignedRows.filter((row) => row.status === 'PENDING').length;
  const quoted = assignedRows.filter((row) => row.status === 'QUOTED').length;

  return {
    assignedRows,
    historicalRows,
    metrics: [
      { key: 'assigned', label: 'ASSIGNED RFQs', value: String(assignedRows.length), valueColor: 'var(--bocar-blue-100)' },
      { key: 'pending', label: 'PENDING RFQs', value: String(pending), valueColor: '#c8970a' },
      { key: 'quoted', label: 'QUOTED RFQs', value: String(quoted), valueColor: '#5a8a1f' },
      { key: 'historical', label: 'HISTORICAL RFQs', value: String(historicalRows.length), valueColor: 'var(--bocar-blue-50)' },
    ],
  };
}

