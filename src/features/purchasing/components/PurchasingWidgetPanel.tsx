import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { formatDeadlineLabel, getDeadlineUrgencyTone } from '@/features/purchasing/constants';
import { getDashboardCardStatusClass } from '@/features/purchasing/services/purchasingDashboardService';
import type { PurchasingWidgetItem } from '@/features/purchasing/types';
import { TablePagination } from '@/shared/components/ui/TablePagination';

type PurchasingWidgetPanelProps = {
  title: string;
  caption: string;
  items: PurchasingWidgetItem[];
  isLoading?: boolean;
  emptyLabel?: string;
  /** Items per page. Pagination only appears when there are more items than this. */
  pageSize?: number;
};

/**
 * Panel de widget del dashboard de Compras con paginación in-place.
 * Cada item es navegable a su `href`; la paginación permite recorrer todos los
 * elementos sin salir del dashboard (no hay pantalla "View all" separada).
 */
export function PurchasingWidgetPanel({
  title,
  caption,
  items,
  isLoading = false,
  emptyLabel = 'No items to show.',
  pageSize = 4,
}: PurchasingWidgetPanelProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Si la lista cambia (recarga, filtros) y la página actual queda fuera de rango, vuelve al inicio.
  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const visibleItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize],
  );

  return (
    <section className="flex flex-col rounded-[14px] border border-[var(--bocar-border)] bg-white p-5 shadow-[0_10px_24px_rgba(0,46,93,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-[13px] font-bold uppercase tracking-[0.07em] text-[var(--bocar-text)]">
            {title}
          </h2>
          <p className="m-0 mt-1 text-[12px] text-[var(--bocar-blue-70)]">{caption}</p>
        </div>
        {!isLoading && items.length > 0 ? (
          <span className="shrink-0 rounded-full bg-[var(--bocar-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--bocar-blue-70)]">
            {items.length}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid flex-1 gap-3">
        {isLoading ? (
          <p className="m-0 text-[13px] text-[var(--bocar-blue-50)]">Loading...</p>
        ) : items.length === 0 ? (
          <p className="m-0 text-[13px] text-[var(--bocar-blue-50)]">{emptyLabel}</p>
        ) : (
          visibleItems.map((item) => {
            const deadlineTone =
              typeof item.hoursToDeadline === 'number'
                ? getDeadlineUrgencyTone(item.hoursToDeadline)
                : 'neutral';

            return (
              <button
                key={item.id}
                type="button"
                disabled={!item.href}
                onClick={() => item.href && navigate(item.href)}
                className={[
                  'w-full rounded-[12px] border px-4 py-4 text-left transition focus:outline-none',
                  item.href
                    ? 'cursor-pointer hover:shadow-[0_6px_16px_rgba(0,46,93,0.08)] focus-visible:ring-2 focus-visible:ring-[var(--bocar-blue-100)]'
                    : 'cursor-default',
                  typeof item.hoursToDeadline === 'number'
                    ? getDashboardCardStatusClass(item.hoursToDeadline)
                    : 'border-[rgba(217,222,229,0.84)] bg-white',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="m-0 text-[13px] font-semibold text-[var(--bocar-blue-100)]">
                    {item.title}
                  </p>
                  {typeof item.hoursToDeadline === 'number' ? (
                    <span
                      className={[
                        'shrink-0 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                        deadlineTone === 'critical'
                          ? 'border-[rgba(170,0,15,0.16)] bg-[rgba(170,0,15,0.08)] text-[var(--bocar-error)]'
                          : deadlineTone === 'warning'
                            ? 'border-[rgba(255,242,0,0.32)] bg-[rgba(255,242,0,0.18)] text-[var(--bocar-blue-100)]'
                            : 'border-[rgba(217,222,229,0.9)] bg-[var(--bocar-bg)] text-[var(--bocar-blue-90)]',
                      ].join(' ')}
                    >
                      {formatDeadlineLabel(item.hoursToDeadline)}
                    </span>
                  ) : null}
                </div>
                {item.subtitle ? (
                  <p className="m-0 mt-1 text-[12px] text-[var(--bocar-text)]">{item.subtitle}</p>
                ) : null}
                {item.meta ? (
                  <p className="m-0 mt-1 text-[12px] text-[var(--bocar-blue-70)]">{item.meta}</p>
                ) : null}
              </button>
            );
          })
        )}
      </div>

      {!isLoading && items.length > pageSize ? (
        <div className="mt-2 border-t border-[var(--bocar-border)]">
          <TablePagination
            currentPage={Math.min(currentPage, totalPages)}
            totalPages={totalPages}
            visibleCount={visibleItems.length}
            totalCount={items.length}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : null}
    </section>
  );
}
