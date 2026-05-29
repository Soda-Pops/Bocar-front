import { useFormContext, useWatch } from 'react-hook-form';

import { inputBaseClasses } from '../../RfqForm/shell/primitives';
import { formatNum, mul, parseNum } from './formulas';

export type CostColumnKey = 'h' | 'unit' | 'price' | 'price_unit' | 'total' | 'weeks';

export type CostTableColumns = readonly [CostColumnKey, CostColumnKey, CostColumnKey, CostColumnKey];

export type CostTableRow = {
  key: string;
  label: string;
};

export type CostTableProps = {
  title?: string;
  hint?: string;
  columns: CostTableColumns;
  rows: ReadonlyArray<CostTableRow>;
  totalLabel: string;
  basePath: string;
  showTotalsRow?: boolean;
};

const COLUMN_LABELS: Record<CostColumnKey, string> = {
  h: 'h',
  unit: 'Unit',
  price: 'Price/h',
  price_unit: 'Price/u',
  total: 'Total',
  weeks: 'Weeks',
};

// First column key (h or unit) for the editable left value
function leftKey(cols: CostTableColumns): 'h' | 'unit' {
  return cols[0] === 'unit' ? 'unit' : 'h';
}

function priceKey(cols: CostTableColumns): 'price' | 'price_unit' {
  return cols[1] === 'price_unit' ? 'price_unit' : 'price';
}

const GRID_CLASS =
  'grid gap-3 md:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))] md:items-center';

const HEADER_LABEL_CLASS =
  'text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]';

const ROW_LABEL_CLASS = 'text-[13px] font-medium leading-[1.5] text-[var(--bocar-text)]';

const READONLY_INPUT_CLASS = [
  'w-full rounded-[10px] border border-[rgba(217,222,229,0.92)] bg-[#f5f7fa] px-3.5 py-2.5 text-[14px] text-[var(--bocar-text)] outline-none cursor-not-allowed',
].join(' ');

const TOTALS_INPUT_CLASS = [
  'w-full rounded-[10px] border border-[rgba(217,222,229,0.92)] bg-[#f5f7fa] px-3.5 py-2.5 text-[14px] font-semibold text-[var(--bocar-text)] outline-none cursor-not-allowed',
].join(' ');

export function CostTable({
  title,
  hint,
  columns,
  rows,
  totalLabel,
  basePath,
  showTotalsRow = true,
}: CostTableProps) {
  const { register, control } = useFormContext();
  const branch = useWatch({ control, name: basePath }) as
    | Record<string, Record<string, unknown> | undefined>
    | undefined;

  const left = leftKey(columns);
  const price = priceKey(columns);

  const totals = rows.reduce(
    (acc, row) => {
      const r = branch?.[row.key];
      const lv = parseNum(r?.[left]);
      const pv = parseNum(r?.[price]);
      const wv = parseNum(r?.[`weeks`]);
      acc.left += lv;
      acc.price += pv;
      acc.total += lv * pv;
      acc.weeks += wv;
      return acc;
    },
    { left: 0, price: 0, total: 0, weeks: 0 }
  );

  return (
    <div className="space-y-3">
      {title ? (
        <div className="flex flex-col gap-1">
          <h4 className="m-0 text-[14px] font-semibold leading-[1.4] text-[var(--bocar-blue-100)]">
            {title}
          </h4>
          {hint ? (
            <p className="m-0 text-[12px] leading-[1.5] text-[var(--bocar-blue-50)]">{hint}</p>
          ) : null}
        </div>
      ) : null}

      {/* Desktop header */}
      <div
        className={`hidden border-b border-[rgba(217,222,229,0.86)] pb-3 md:grid ${GRID_CLASS}`}
      >
        <div className={HEADER_LABEL_CLASS}>{title ? '' : 'Concept'}</div>
        {columns.map((col, idx) => (
          <div key={`${col}-${idx}`} className={HEADER_LABEL_CLASS}>
            {COLUMN_LABELS[col]}
          </div>
        ))}
      </div>

      {/* Body rows */}
      <div className="divide-y divide-[rgba(236,240,245,0.9)]">
        {rows.map((row) => {
          const leftName = `${basePath}.${row.key}.${left}`;
          const priceName = `${basePath}.${row.key}.${price}`;
          const weeksName = `${basePath}.${row.key}.weeks`;
          const r = branch?.[row.key];
          const totalValue = mul(r?.[left], r?.[price]);

          return (
            <div key={row.key} className={`py-3 ${GRID_CLASS}`}>
              <div className={ROW_LABEL_CLASS}>{row.label}</div>
              <input
                className={inputBaseClasses(false)}
                placeholder="0"
                step="0.01"
                type="number"
                {...register(leftName)}
              />
              <input
                className={inputBaseClasses(false)}
                placeholder="0.00"
                step="0.01"
                type="number"
                {...register(priceName)}
              />
              <input
                aria-label={`Total ${row.label}`}
                className={READONLY_INPUT_CLASS}
                disabled
                tabIndex={-1}
                type="text"
                value={formatNum(totalValue)}
                readOnly
              />
              <input
                className={inputBaseClasses(false)}
                placeholder="0"
                step="0.01"
                type="number"
                {...register(weeksName)}
              />
            </div>
          );
        })}
      </div>

      {/* Totals row */}
      {showTotalsRow ? (
        <div
          className={`mt-1 rounded-[10px] bg-[rgba(0,46,93,0.04)] px-3 py-3 ${GRID_CLASS}`}
        >
          <div className="text-[13px] font-semibold text-[var(--bocar-text)]">{totalLabel}</div>
          <input
            aria-label={`${totalLabel} ${COLUMN_LABELS[columns[0]]}`}
            className={TOTALS_INPUT_CLASS}
            disabled
            tabIndex={-1}
            type="text"
            value={formatNum(totals.left)}
            readOnly
          />
          <input
            aria-label={`${totalLabel} ${COLUMN_LABELS[columns[1]]}`}
            className={TOTALS_INPUT_CLASS}
            disabled
            tabIndex={-1}
            type="text"
            value={formatNum(totals.price)}
            readOnly
          />
          <input
            aria-label={`${totalLabel} ${COLUMN_LABELS[columns[2]]}`}
            className={TOTALS_INPUT_CLASS}
            disabled
            tabIndex={-1}
            type="text"
            value={formatNum(totals.total)}
            readOnly
          />
          <input
            aria-label={`${totalLabel} ${COLUMN_LABELS[columns[3]]}`}
            className={TOTALS_INPUT_CLASS}
            disabled
            tabIndex={-1}
            type="text"
            value={formatNum(totals.weeks)}
            readOnly
          />
        </div>
      ) : null}
    </div>
  );
}

// Exposed helper: sum subtotals across multiple `CostTable` branches (for Manufacturing grand total).
export function computeBranchSubtotal(
  branch: Record<string, Record<string, unknown> | undefined> | undefined,
  leftCol: 'h' | 'unit',
  priceCol: 'price' | 'price_unit'
): { left: number; price: number; total: number; weeks: number } {
  if (!branch) return { left: 0, price: 0, total: 0, weeks: 0 };
  let left = 0;
  let price = 0;
  let total = 0;
  let weeks = 0;
  for (const row of Object.values(branch)) {
    if (!row) continue;
    const lv = parseNum(row[leftCol]);
    const pv = parseNum(row[priceCol]);
    left += lv;
    price += pv;
    total += lv * pv;
    weeks += parseNum(row['weeks']);
  }
  return { left, price, total, weeks };
}
