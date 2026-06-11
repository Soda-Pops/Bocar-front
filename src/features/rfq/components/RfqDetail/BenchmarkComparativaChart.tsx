import type { RfqTipo } from '@/features/analytics/types';
import { useRfqComparativa } from '@/features/rfq/hooks/useRfqComparativa';

type BenchmarkComparativaChartProps = {
  tipo: RfqTipo;
  rfqNumericId: number;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

export function BenchmarkComparativaChart({ tipo, rfqNumericId }: BenchmarkComparativaChartProps) {
  const { state } = useRfqComparativa(tipo, rfqNumericId);

  return (
    <div className="border-t border-[rgba(217,222,229,0.88)] px-7 py-6 lg:px-12">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 text-[15px] font-semibold text-[var(--bocar-text)]">Benchmark Comparison</h2>
        <span className="rounded-[4px] bg-[var(--bocar-bg)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
          Grand Total
        </span>
      </div>

      {state.status === 'loading' || state.status === 'idle' ? (
        <p className="m-0 mt-4 rounded-[8px] border border-dashed border-[var(--bocar-border)] px-4 py-3 text-[13px] text-[var(--bocar-blue-50)]">
          Loading benchmark comparison...
        </p>
      ) : null}

      {state.status === 'error' ? (
        <p
          className="m-0 mt-4 rounded-[8px] border border-[rgba(170,0,15,0.22)] bg-[rgba(170,0,15,0.06)] px-4 py-3 text-[13px] text-[var(--bocar-error)]"
          role="alert"
        >
          The benchmark comparison could not be loaded.
        </p>
      ) : null}

      {state.status === 'success' && state.data.length === 0 ? (
        <p className="m-0 mt-4 rounded-[8px] border border-dashed border-[var(--bocar-border)] px-4 py-3 text-[13px] text-[var(--bocar-blue-50)]">
          No supplier has answered this RFQ yet.
        </p>
      ) : null}

      {state.status === 'success' && state.data.length > 0 ? (
        <div className="mt-5 grid gap-4">
          {(() => {
            const maxGrandTotal = Math.max(...state.data.map((row) => row.grandTotal), 0);
            return state.data.map((row) => {
              const widthPct =
                maxGrandTotal > 0 ? Math.max((row.grandTotal / maxGrandTotal) * 100, 2) : 2;
              return (
                <div
                  key={row.usuarioId}
                  className="grid items-center gap-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4"
                >
                  <span
                    className="truncate text-[13px] font-semibold text-[var(--bocar-text)]"
                    title={row.nombreEmpresa}
                  >
                    {row.nombreEmpresa}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="h-6 flex-1 overflow-hidden rounded-[4px] bg-[var(--bocar-bg)]">
                      <div
                        aria-label={`${row.nombreEmpresa}: ${currencyFormatter.format(row.grandTotal)}`}
                        className="h-full rounded-[4px] bg-[var(--bocar-blue-100)] transition-[width] duration-500"
                        role="img"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="w-[110px] shrink-0 text-right text-[13px] font-medium tabular-nums text-[var(--bocar-text)]">
                      {currencyFormatter.format(row.grandTotal)}
                    </span>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      ) : null}
    </div>
  );
}
