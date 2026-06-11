import type { AiPrediction } from '@/features/rfq/services/iaPredictionService';
import type { RfqSupplier } from '@/features/rfq/services/rfqDetailService';

type AiCostPredictionPanelProps = {
  error?: Error | null;
  loading: boolean;
  onRetry: () => void;
  predictions: AiPrediction[];
  suppliers: RfqSupplier[];
};

const usdFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: 'currency',
});

function formatCurrency(value: number) {
  return usdFormatter.format(value);
}

function PredictionSkeleton() {
  return (
    <div className="mt-4 overflow-hidden rounded-[6px] border border-[var(--bocar-border)]">
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="grid gap-4 border-t border-[rgba(217,222,229,0.72)] px-5 py-4 first:border-t-0 md:grid-cols-[1.3fr_1fr_1.2fr]"
        >
          <span className="h-4 w-40 animate-pulse rounded bg-[rgba(217,222,229,0.9)]" />
          <span className="h-4 w-28 animate-pulse rounded bg-[rgba(217,222,229,0.9)]" />
          <span className="h-4 w-52 animate-pulse rounded bg-[rgba(217,222,229,0.9)]" />
        </div>
      ))}
    </div>
  );
}

export function AiCostPredictionPanel({
  error,
  loading,
  onRetry,
  predictions,
  suppliers,
}: AiCostPredictionPanelProps) {
  const visiblePredictions = suppliers.length > 0 ? predictions.slice(0, suppliers.length) : predictions;
  const rows = visiblePredictions.map((prediction, index) => {
    const supplier = suppliers[index];
    return {
      ...prediction,
      supplierName: supplier?.name || prediction.supplier,
    };
  });

  return (
    <div className="border-t border-[rgba(217,222,229,0.88)] px-7 py-6 lg:px-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="m-0 text-[15px] font-semibold text-[var(--bocar-text)]">
            Predicción de Costos por AI
          </h2>
          <p className="m-0 mt-1 text-[12px] leading-[1.5] text-[var(--bocar-blue-50)]">
            Estimación generada por modelo de IA. Úsala como referencia para priorizar análisis comercial.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-[4px] border border-[rgba(31,58,97,0.16)] bg-[rgba(31,58,97,0.05)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-70)]">
          Referencial
        </span>
      </div>

      {loading ? <PredictionSkeleton /> : null}

      {!loading && error ? (
        <div
          role="alert"
          className="mt-4 flex flex-col gap-3 rounded-[8px] border border-[rgba(170,0,15,0.22)] bg-[rgba(170,0,15,0.06)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="m-0 text-[13px] leading-[1.5] text-[var(--bocar-error)]">
            No se pudo generar la predicción. {error.message}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-9 min-w-[110px] items-center justify-center rounded-[8px] bg-[var(--bocar-blue-100)] px-4 text-[12px] font-semibold text-white transition hover:bg-[#0b3b6b] focus:outline-none focus:shadow-[0_0_0_3px_rgba(0,46,93,0.16)]"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <div className="mt-4 rounded-[8px] border border-dashed border-[var(--bocar-border)] bg-[var(--bocar-bg)] px-4 py-6 text-[13px] text-[var(--bocar-blue-70)]">
          No hay predicciones disponibles para mostrar.
        </div>
      ) : null}

      {!loading && !error && rows.length > 0 ? (
        <>
          <div className="mt-4 grid gap-3 sm:hidden">
            {rows.map((row) => (
              <article
                key={`${row.supplier}-${row.supplierName}`}
                className="rounded-[6px] border border-[var(--bocar-border)] bg-[var(--bocar-bg)] px-4 py-3"
              >
                <p className="m-0 text-[12px] font-semibold text-[var(--bocar-text)]">{row.supplierName}</p>
                <p className="m-0 mt-2 text-[15px] font-semibold text-[var(--bocar-blue-100)]">
                  {formatCurrency(row.price)}
                </p>
                <p className="m-0 mt-1 text-[12px] text-[var(--bocar-blue-70)]">
                  Rango {formatCurrency(row.priceLow)} - {formatCurrency(row.priceHigh)}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-4 hidden overflow-x-auto sm:block">
            <table className="w-full max-w-[1040px] border-separate border-spacing-0 overflow-hidden rounded-[6px] border border-[var(--bocar-border)] text-left">
              <thead>
                <tr className="bg-[var(--bocar-bg)]">
                  {['Proveedor', 'Precio estimado', 'Rango (low-high)'].map((header) => (
                    <th key={header} className="px-6 py-3 text-[12px] font-semibold text-[var(--bocar-text)]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.supplier}-${row.supplierName}`} className="border-t border-[rgba(217,222,229,0.72)]">
                    <td className="px-6 py-3.5 text-[12px] font-medium text-[var(--bocar-text)]">
                      {row.supplierName}
                    </td>
                    <td className="px-6 py-3.5 text-[12px] font-semibold text-[var(--bocar-blue-100)]">
                      {formatCurrency(row.price)}
                    </td>
                    <td className="px-6 py-3.5 text-[12px] text-[var(--bocar-text)]">
                      {formatCurrency(row.priceLow)} - {formatCurrency(row.priceHigh)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
