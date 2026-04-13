import { isStatusValue } from '@/shared/utils/dashboard';
import { Button } from '@/shared/components/ui/Button';
import { RfqStatusBadge } from '@/features/rfq/components/RfqList/RfqStatusBadge';

// No se usa en las pantallas activas por ahora; reservado para integracion futura.

type DataCellProps = {
  value: string;
  columnIndex: number;
};

export function RfqDataCell({ value, columnIndex }: DataCellProps) {
  if (value === 'Editar' || value === 'Ver') {
    return (
      <td className="border-b border-slate-100 px-4 py-4 text-center align-middle">
        <Button compact>{value}</Button>
      </td>
    );
  }

  if (isStatusValue(value)) {
    return (
      <td className="border-b border-slate-100 px-4 py-4 text-center align-middle">
        <RfqStatusBadge value={value} />
      </td>
    );
  }

  return (
    <td
      className={[
        'whitespace-nowrap border-b border-slate-100 px-4 py-4 text-sm align-middle',
        columnIndex === 0 ? 'font-semibold text-slate-900' : 'text-slate-700',
      ].join(' ')}
    >
      {value}
    </td>
  );
}
