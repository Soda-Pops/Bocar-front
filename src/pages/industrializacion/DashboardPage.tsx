import { useEffect, useMemo, useState } from 'react';
import { TablePagination } from '@/shared/components/ui/TablePagination';
import { useNavigate } from 'react-router-dom';

import { DashboardHeader } from '@/features/analytics/components/DashboardHeader';
import { FilterSelect } from '@/features/analytics/components/Filters/FilterSelect';
import { SearchField } from '@/features/analytics/components/Filters/SearchField';
import { MonthlyRfqChart } from '@/features/analytics/components/Charts/MonthlyRfqChart';
import { DashboardMetricCard } from '@/features/analytics/components/KpiCards/DashboardMetricCard';
import {
  dashboardTabs,
  getDateOptions,
  getFilteredDashboardRows,
} from '@/features/analytics/services/analyticsService';
import { useRfqHistogramSeries } from '@/features/analytics/hooks/useRfqHistogramSeries';
import type { DashboardMetric, DashboardRow } from '@/features/analytics/types';
import type { SortOption } from '@/features/analytics/types';
import { CreateRfqButton } from '@/features/rfq/components/RfqActions/CreateRfqButton';
import { useRfqList } from '@/features/rfq/hooks/useRfqList';
import { MainLayout } from '@/layouts/MainLayout';
import { Header } from '@/layouts/components/Header';
import { ROUTES } from '@/app/config/routes';

const RFQ_TYPE_OPTIONS = ['Trimming', 'Mold'] as const;

function RfqStatusBadge({ status }: { status?: string }) {
  if (!status) return <span>—</span>;
  if (status === 'Draft') {
    return (
      <span className="inline-flex items-center rounded-full border border-[rgba(0,46,93,0.2)] bg-[rgba(0,46,93,0.08)] px-3 py-1 text-[11px] font-semibold tracking-[0.01em] text-[var(--bocar-blue-100)]">
        {status}
      </span>
    );
  }
  if (status === 'Active') {
    return (
      <span className="inline-flex items-center rounded-full border border-[rgba(141,198,63,0.3)] bg-[rgba(141,198,63,0.15)] px-3 py-1 text-[11px] font-semibold tracking-[0.01em] text-[#5a8a1f]">
        {status}
      </span>
    );
  }
  if (status === 'Closed') {
    return (
      <span className="inline-flex items-center rounded-full border border-[rgba(174,179,184,0.4)] bg-[rgba(174,179,184,0.15)] px-3 py-1 text-[11px] font-semibold tracking-[0.01em] text-[var(--bocar-blue-70)]">
        {status}
      </span>
    );
  }
  return <span className="text-[13px] text-[var(--bocar-text)]">{status}</span>;
}

const PAGE_SIZE = 4;

function getSortLabel(sortValue: SortOption) {
  if (sortValue === 'creator') return 'Creator';
  if (sortValue === 'recent') return 'Most recent';
  return '';
}

function getNextSortOption(value: string): SortOption {
  if (value === 'Creator') return 'creator';
  if (value === 'Most recent') return 'recent';
  return '';
}

function DashboardPage() {
  const navigate = useNavigate();
  const rfqs = useRfqList();
  const rfqHistogram = useRfqHistogramSeries();
  const [activeTab, setActiveTab] = useState<'borradores' | 'activas' | 'historicas'>(
    'borradores',
  );
  const [searchValue, setSearchValue] = useState('');
  const [sortValue, setSortValue] = useState<SortOption>('');
  const [tipoValue, setTipoValue] = useState('');
  const [dateValue, setDateValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const allRows = rfqs.state.status === 'success' ? rfqs.state.data : [];
  const rowsByTab = useMemo(() => groupRowsByTab(allRows), [allRows]);
  const dashboardMetrics = useMemo(() => buildMetrics(rowsByTab), [rowsByTab]);
  const rows = rowsByTab[activeTab];
  const dateOptions = useMemo(() => getDateOptions(rows), [rows]);
  const filteredRows = useMemo(
    () => getFilteredDashboardRows(rows, searchValue, '', sortValue, tipoValue, dateValue),
    [rows, searchValue, sortValue, tipoValue, dateValue],
  );
  // Al cambiar cualquier filtro, regresamos a la primera página.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, sortValue, tipoValue, dateValue]);
  // Cambiar de tab limpia los filtros: las opciones de Date dependen del tab,
  // así que un valor heredado dejaría la tabla vacía.
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSearchValue('');
    setSortValue('');
    setTipoValue('');
    setDateValue('');
    setCurrentPage(1);
  };
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const visibleRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasRows = visibleRows.length > 0;
  const handleViewRfq = (rfqId: string) => {
    const row = allRows.find((item) => item.id === rfqId);
    navigate(`${ROUTES.INDUSTRIALIZATION.RFQ_DETAIL.replace(':id', rfqId)}?tipo=${row?.tipo ?? 'Mold'}`);
  };

  return (
    <MainLayout
      header={<Header areaLabel="Industrialization" />}
    >
      <div
        className="mx-auto flex w-full max-w-[1440px] flex-col px-6 pb-8 pt-8 sm:px-8 lg:px-12 lg:pb-8 lg:pt-8 xl:px-14"
        data-testid="industrialization-dashboard-main"
      >
        <DashboardHeader />

        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(405px,0.9fr)] lg:items-stretch xl:grid-cols-[minmax(0,1fr)_minmax(470px,0.96fr)]">
          <div className="grid grid-cols-2 grid-rows-2 gap-3 lg:h-full lg:min-h-[190px]">
            {dashboardMetrics.map((metric) => (
              <div
                key={metric.label}
                className={['h-full', metric.key === 'borradores' ? 'col-span-2' : ''].join(' ').trim()}
              >
                <DashboardMetricCard
                  isActive={metric.key === activeTab}
                  metric={metric}
                  onSelect={(key) => handleTabChange(key as typeof activeTab)}
                />
              </div>
            ))}
          </div>

          <MonthlyRfqChart
            series={rfqHistogram.series}
            statusText={getChartStatusText(rfqHistogram.status)}
          />
        </section>

        <section className="mt-8 border-b border-[rgba(217,222,229,0.9)]">
          <nav className="flex justify-between gap-6 overflow-x-auto pb-2.5 lg:gap-7">
            {dashboardTabs.map((tab) => {
              const isActive = tab.key === activeTab;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={[
                    'shrink-0 border-b-2 px-4 pb-2 text-[14px] font-medium transition lg:flex-1 lg:px-0 lg:pb-1 lg:text-[12px] lg:text-center',
                    isActive
                      ? 'border-[var(--bocar-blue-100)] text-[var(--bocar-blue-100)]'
                      : 'border-transparent text-[var(--bocar-blue-30)] hover:text-[var(--bocar-blue-70)]',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </section>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <SearchField value={searchValue} onChange={setSearchValue} />
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <FilterSelect
              label="Type"
              options={[...RFQ_TYPE_OPTIONS]}
              value={tipoValue}
              onChange={setTipoValue}
            />
            <FilterSelect
              label="Date"
              options={dateOptions}
              value={dateValue}
              onChange={setDateValue}
            />
            <FilterSelect
              label="Sort by"
              options={['Most recent', 'Creator']}
              value={getSortLabel(sortValue)}
              onChange={(nextValue) => setSortValue(getNextSortOption(nextValue))}
            />
          </div>
          <CreateRfqButton />
        </div>

        <section className="mt-6 overflow-hidden rounded-[14px] border border-[var(--bocar-border)] bg-white shadow-[0_12px_28px_rgba(0,46,93,0.06)]">
          {rfqs.state.status === 'loading' ? (
            <div className="px-6 py-12 text-center text-[14px] text-[var(--bocar-blue-70)]">
              Loading RFQs...
            </div>
          ) : rfqs.state.status === 'error' ? (
            <div className="px-6 py-12 text-center text-[14px] text-[var(--bocar-error)]">
              {rfqs.state.error.message}
            </div>
          ) : (
          <>
          <div className="grid gap-3 p-4 sm:hidden">
            {hasRows ? (
              visibleRows.map((row) => (
                <article
                  key={`${row.id}-mobile`}
                  className="rounded-[12px] border border-[rgba(217,222,229,0.84)] bg-[var(--bocar-bg)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="m-0 text-[13px] font-semibold text-[var(--bocar-blue-100)]">{row.id}</p>
                      <p className="mt-1 line-clamp-2 max-w-[220px] text-[13px] text-[var(--bocar-text)]" title={row.desc ?? '-'}>
                        {row.desc ?? '-'}
                      </p>
                      <p className="mt-1 text-[13px] text-[var(--bocar-blue-70)]">{row.tipo ?? '—'}</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-9 min-w-[58px] items-center justify-center rounded-[8px] bg-[var(--bocar-blue-100)] px-4 text-[13px] font-medium text-white transition hover:bg-[#0b3b6b]"
                      onClick={() => handleViewRfq(row.id)}
                    >
                      View
                    </button>
                  </div>

                  <dl className="mt-4 grid gap-3 text-[13px]">
                    <div className="grid gap-1">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-30)]">
                        Status
                      </dt>
                      <dd className="m-0"><RfqStatusBadge status={row.status} /></dd>
                    </div>
                    <div className="grid gap-1">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-30)]">
                        Date
                      </dt>
                      <dd className="m-0">{row.date}</dd>
                    </div>
                    {activeTab !== 'borradores' && (
                      <div className="grid gap-1">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-30)]">
                          Created by
                        </dt>
                        <dd className="m-0">{row.createdBy}</dd>
                      </div>
                    )}
                  </dl>
                </article>
              ))
            ) : (
              <div className="rounded-[12px] border border-dashed border-[var(--bocar-border)] bg-[var(--bocar-bg)] px-4 py-8 text-center text-[14px] text-[var(--bocar-blue-70)]">
                No RFQs match the current filters.
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#eef1f5]">
                  {(activeTab === 'borradores'
                    ? ['ID', 'DESC', 'TYPE', 'STATUS', 'DATE', 'ACTION']
                    : ['ID', 'DESC', 'TYPE', 'STATUS', 'DATE', 'CREATED BY', 'ACTION']
                  ).map((header) => (
                    <th
                      key={header}
                      className="border-b border-[var(--bocar-border)] px-5 py-3.5 text-left text-[11px] font-semibold tracking-[0.06em] text-[var(--bocar-blue-70)]"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hasRows ? (
                  visibleRows.map((row) => (
                    <tr key={row.id} className="transition hover:bg-[rgba(245,247,250,0.84)]">
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 text-[13px] text-[var(--bocar-blue-70)] lg:px-4 lg:py-4">
                        {row.id}
                      </td>
                      <td
                        className="max-w-[260px] border-b border-[rgba(217,222,229,0.72)] px-5 py-4 text-[13px] text-[var(--bocar-text)] lg:px-4 lg:py-4"
                        title={row.desc ?? '-'}
                      >
                        <span className="block truncate">{row.desc ?? '-'}</span>
                      </td>
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 text-[13px] lg:px-4 lg:py-4">
                        {row.tipo ?? '—'}
                      </td>
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 text-[13px] lg:px-4 lg:py-4">
                        <RfqStatusBadge status={row.status} />
                      </td>
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 text-[13px] lg:px-4 lg:py-4">
                        {row.date}
                      </td>
                      {activeTab !== 'borradores' && (
                        <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 text-[13px] lg:px-4 lg:py-4">
                          {row.createdBy}
                        </td>
                      )}
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 lg:px-4 lg:py-4">
                        <button
                          type="button"
                          className="inline-flex h-9 min-w-[58px] items-center justify-center rounded-[8px] bg-[var(--bocar-blue-100)] px-4 text-[13px] font-medium text-white transition hover:bg-[#0b3b6b] lg:h-9 lg:min-w-[58px] lg:px-4 lg:text-[13px]"
                          onClick={() => handleViewRfq(row.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={activeTab === 'borradores' ? 6 : 7}
                      className="px-6 py-12 text-center text-[14px] text-[var(--bocar-blue-70)]"
                    >
                      No RFQs match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={safePage}
            totalPages={totalPages}
            visibleCount={visibleRows.length}
            totalCount={filteredRows.length}
            onPageChange={setCurrentPage}
          />
          </>
          )}
        </section>
      </div>
    </MainLayout>
  );
}

export default DashboardPage;

function groupRowsByTab(rows: DashboardRow[]) {
  return {
    borradores: rows.filter((row) => row.status === 'Draft'),
    activas: rows.filter((row) => row.status === 'Active'),
    historicas: rows.filter((row) => row.status === 'Closed'),
  };
}

function getChartStatusText(status: ReturnType<typeof useRfqHistogramSeries>['status']) {
  if (status === 'loading') return 'Loading';
  if (status === 'error') return 'Unavailable';
  return 'Live';
}

function buildMetrics(rowsByTab: ReturnType<typeof groupRowsByTab>): DashboardMetric[] {
  const closed = rowsByTab.historicas.filter((r) => r.status === 'Closed').length;
  return [
    { key: 'borradores', label: 'DRAFT RFQs', value: String(rowsByTab.borradores.length), valueColor: 'var(--bocar-blue-100)' },
    { key: 'activas', label: 'ACTIVE RFQs', value: String(rowsByTab.activas.length), valueColor: '#5a8a1f' },
    { key: 'historicas', label: 'CLOSED RFQs', value: String(closed), valueColor: 'var(--bocar-blue-50)' },
  ];
}
