import type { Section } from '@/features/rfq/types';
import { RfqDataCell } from '@/features/rfq/components/RfqList/RfqDataCell';

// No se usa en las pantallas activas por ahora; reservado para integracion futura.

type RfqTableProps = {
  section: Section;
};

export function RfqTable({ section }: RfqTableProps) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr>
              {section.headers.map((header) => (
                <th
                  key={header}
                className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
              >
                {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row) => (
              <tr key={row.join('-')} className="transition-colors hover:bg-slate-50/70">
                {row.map((cell, index) => (
                  <RfqDataCell key={`${row[0]}-${index}-${cell}`} value={cell} columnIndex={index} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
