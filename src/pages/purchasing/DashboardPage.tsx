import { useMemo, useState } from 'react';
import { TablePagination } from '@/shared/components/ui/TablePagination';
import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { MonthlyRfqChart } from '@/features/analytics/components/Charts/MonthlyRfqChart';
import { DashboardHeader } from '@/features/analytics/components/DashboardHeader';
import { DashboardMetricCard } from '@/features/analytics/components/KpiCards/DashboardMetricCard';
import { FilterSelect } from '@/features/analytics/components/Filters/FilterSelect';
import { SearchField } from '@/features/analytics/components/Filters/SearchField';
import { PurchasingStatusBadge } from '@/features/purchasing/components/PurchasingStatusBadge';
import {
  formatDeadlineLabel,
  getDeadlineUrgencyTone,
  purchasingDeadlineRangeOptions,
} from '@/features/purchasing/constants';
import {
  getDashboardCardStatusClass,
  getFilteredDashboardRows,
  unlockRequests,
  urgentDeadlines,
} from '@/features/purchasing/services/purchasingDashboardService';
import { useRfqHistogramSeries } from '@/features/analytics/hooks/useRfqHistogramSeries';
import {
  usePurchasingDashboardCounts,
  type PurchasingStatusCounts,
} from '@/features/purchasing/hooks/usePurchasingDashboardCounts';
import { usePurchasingRfqList } from '@/features/purchasing/hooks/usePurchasingRfqList';
import type { PurchasingDashboardMetric, PurchasingDashboardRow, PurchasingRfqStatus } from '@/features/purchasing/types';
import { MainLayout } from '@/layouts/MainLayout';
import { Header } from '@/layouts/components/Header';
import { ActionMenu } from '@/shared/components/ui/ActionMenu';

const PAGE_SIZE = 4;

type DashboardTab = 'pending' | 'historical';

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <path d="M3 8H12.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path
        d="M9.5 4.5L13 8L9.5 11.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function DashboardStatusBadge({ status }: { status: PurchasingRfqStatus }) {
  if (status === 'QUOTING') {
    return (
      <span className="inline-flex items-center rounded-full border border-[rgba(141,198,63,0.3)] bg-[rgba(141,198,63,0.15)] px-3 py-1 text-[11px] font-semibold tracking-[0.01em] text-[#5a8a1f]">
        In quotation
      </span>
    );
  }
  return <PurchasingStatusBadge status={status} />;
}

function DeadlineBadge({ hoursToDeadline }: { hoursToDeadline: number }) {
  if (hoursToDeadline >= 9999) {
    return <span className="text-[12px] text-[var(--bocar-blue-50)]">—</span>;
  }

  const tone = getDeadlineUrgencyTone(hoursToDeadline);

  return (
    <span
      className={[
        'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold',
        tone === 'critical'
          ? 'border-[rgba(170,0,15,0.18)] bg-[rgba(170,0,15,0.08)] text-[var(--bocar-error)]'
          : tone === 'warning'
            ? 'border-[rgba(255,242,0,0.34)] bg-[rgba(255,242,0,0.2)] text-[var(--bocar-blue-100)]'
            : 'border-[rgba(217,222,229,0.9)] bg-[var(--bocar-bg)] text-[var(--bocar-blue-90)]',
      ].join(' ')}
    >
      {formatDeadlineLabel(hoursToDeadline)}
    </span>
  );
}

function getRowActions(row: PurchasingDashboardRow, navigate: ReturnType<typeof useNavigate>) {
  const detailAction = {
    key: 'view_detail' as const,
    label: 'View details',
    onSelect: () =>
      navigate(`${ROUTES.PURCHASING.RFQ_DETAIL.replace(':id', row.id)}?status=${row.status}&tipo=${row.machineType}`),
  };

  if (row.status === 'PENDING') {
    return [
      detailAction,
      {
        key: 'assign' as const,
        label: 'Assign suppliers',
        onSelect: () =>
          navigate(`${ROUTES.PURCHASING.RFQ_ASSIGN_SUPPLIERS.replace(':id', row.id)}?tipo=${row.machineType}`),
      },
    ];
  }

  return [detailAction];
}

function WidgetPanel({
  actionHref,
  caption,
  items,
  title,
}: {
  actionHref?: string;
  caption: string;
  items: typeof urgentDeadlines;
  title: string;
}) {
  const navigate = useNavigate();
  const rfqs = usePurchasingRfqList();

  return (
    <section className="rounded-[14px] border border-[var(--bocar-border)] bg-white p-5 shadow-[0_10px_24px_rgba(0,46,93,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-[13px] font-bold uppercase tracking-[0.07em] text-[var(--bocar-text)]">
            {title}
          </h2>
          <p className="m-0 mt-1 text-[12px] text-[var(--bocar-blue-70)]">{caption}</p>
        </div>
        {actionHref ? (
          <button
            type="button"
            onClick={() => navigate(actionHref)}
            className="inline-flex h-8 items-center gap-1.5 rounded-[9px] border border-[rgba(217,222,229,0.92)] bg-white px-3 text-[12px] font-medium text-[var(--bocar-blue-100)] transition hover:bg-[var(--bocar-bg)] focus:outline-none"
          >
            View all
            <ArrowRightIcon />
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3">
        {items.map((item) => {
          const deadlineTone =
            typeof item.hoursToDeadline === 'number'
              ? getDeadlineUrgencyTone(item.hoursToDeadline)
              : 'neutral';

          return (
            <div
              key={item.id}
              className={[
                'rounded-[12px] border px-4 py-4',
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
              {item.meta ? (
                <p className="m-0 mt-1 text-[12px] text-[var(--bocar-blue-70)]">{item.meta}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const rfqs = usePurchasingRfqList();
  const rfqHistogram = useRfqHistogramSeries();
  const dashboardCounts = usePurchasingDashboardCounts();
  const [activeTab, setActiveTab] = useState<DashboardTab>('pending');
  const [activeStatusFilter, setActiveStatusFilter] = useState<PurchasingRfqStatus | ''>('');
  const [searchValue, setSearchValue] = useState('');
  const [tipoValue, setTipoValue] = useState('');
  const [deadlineValue, setDeadlineValue] = useState('');
  const [sortValue, setSortValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const allRows = rfqs.state.status === 'success' ? rfqs.state.data : [];
  const purchasingQueueRows = allRows.filter((row) => row.status !== 'CLOSED' && row.status !== 'CANCELLED' && row.status !== 'BENCHMARK_READY');
  const historicalRows = allRows.filter((row) => row.status === 'CLOSED' || row.status === 'CANCELLED' || row.status === 'BENCHMARK_READY');
  const purchasingMetrics = useMemo(
    () =>
      buildPurchasingMetrics(
        dashboardCounts.state.status === 'success' ? dashboardCounts.state.data.estatus : undefined,
      ),
    [dashboardCounts.state],
  );
  const sourceRows = activeTab === 'pending' ? purchasingQueueRows : historicalRows;

  const filteredRows = useMemo(() => {
    let base = getFilteredDashboardRows(sourceRows, { searchValue, tipoValue, deadlineValue });
    if (activeStatusFilter) {
      base = base.filter((row) => row.status === activeStatusFilter);
    }
    if (sortValue === 'Deadline') {
      return [...base].sort((a, b) => a.hoursToDeadline - b.hoursToDeadline);
    }
    if (sortValue === 'Creator') {
      return [...base].sort((a, b) => a.owner.localeCompare(b.owner));
    }
    return base;
  }, [sourceRows, searchValue, tipoValue, deadlineValue, activeStatusFilter, sortValue]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const visibleRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleTabChange(tab: DashboardTab) {
    setActiveTab(tab);
    setActiveStatusFilter('');
    setCurrentPage(1);
    setSearchValue('');
    setTipoValue('');
    setDeadlineValue('');
    setSortValue('');
  }

  function handleMetricSelect(key: string) {
    const metric = purchasingMetrics.find((m) => m.key === key);
    if (!metric) return;
    if (metric.status === 'QUOTING' || metric.status === 'EXPIRED' || metric.status === 'PENDING') {
      setActiveTab('pending');
      setActiveStatusFilter((prev) => (prev === metric.status ? '' : metric.status));
      setCurrentPage(1);
    } else if (metric.status === 'BENCHMARK_READY' || metric.status === 'CLOSED') {
      handleTabChange('historical');
      setActiveStatusFilter(metric.status);
    }
  }

  function handleFilterChange(setter: (v: string) => void) {
    return (value: string) => {
      setter(value);
      setCurrentPage(1);
    };
  }

  const machineTypeOptions = [
    { label: 'Mold', value: 'Mold' },
    { label: 'Trimming', value: 'Trimming' },
  ];
  const deadlineOptions = purchasingDeadlineRangeOptions.map((opt) => ({
    label: opt.label,
    value: opt.value,
  }));

  return (
    <MainLayout header={<Header areaLabel="Purchasing" />}>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-6 pb-8 pt-8 sm:px-8 lg:px-12 lg:pb-10 lg:pt-8 xl:px-14">

        {/* Dashboard title */}
        <DashboardHeader />

        {/* KPI cards + chart */}
        <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(400px,0.9fr)]">
          <div className="grid gap-3 sm:grid-cols-2">
            {purchasingMetrics.map((metric) => (
              <DashboardMetricCard
                key={metric.key}
                isActive={
                  (activeStatusFilter !== '' && metric.status === activeStatusFilter) ||
                  (activeStatusFilter === '' && metric.status === 'BENCHMARK_READY' && activeTab === 'historical')
                }
                metric={metric}
                onSelect={handleMetricSelect}
              />
            ))}
          </div>
          <MonthlyRfqChart
            series={rfqHistogram.series}
            statusText={getChartStatusText(rfqHistogram.status)}
          />
        </section>

        {/* Tabs */}
        <div className="mt-8 flex justify-center border-b border-[var(--bocar-border)]">
          <button
            type="button"
            onClick={() => handleTabChange('pending')}
            className={[
              'mr-6 px-1 pb-3 pt-1 text-[14px] transition focus:outline-none',
              activeTab === 'pending'
                ? 'border-b-2 border-[var(--bocar-blue-100)] font-semibold text-[var(--bocar-text)]'
                : 'border-b-2 border-transparent font-medium text-[var(--bocar-blue-70)] hover:text-[var(--bocar-text)]',
            ].join(' ')}
          >
            RFQs to assign
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('historical')}
            className={[
              'px-1 pb-3 pt-1 text-[14px] transition focus:outline-none',
              activeTab === 'historical'
                ? 'border-b-2 border-[var(--bocar-blue-100)] font-semibold text-[var(--bocar-text)]'
                : 'border-b-2 border-transparent font-medium text-[var(--bocar-blue-70)] hover:text-[var(--bocar-text)]',
            ].join(' ')}
          >
            Historical
          </button>
        </div>

        {/* Filter bar */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <SearchField
            value={searchValue}
            onChange={handleFilterChange(setSearchValue)}
          />
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <FilterSelect
              label="Type"
              options={machineTypeOptions}
              value={tipoValue}
              onChange={handleFilterChange(setTipoValue)}
            />
            {activeTab === 'pending' && (
              <FilterSelect
                label="Deadline"
                options={deadlineOptions}
                value={deadlineValue}
                onChange={handleFilterChange(setDeadlineValue)}
              />
            )}
            <FilterSelect
              label="Sort by"
              options={[
                { label: 'Most recent', value: 'Most recent' },
                { label: 'Deadline', value: 'Deadline' },
                { label: 'Creator', value: 'Creator' },
              ]}
              value={sortValue}
              onChange={handleFilterChange(setSortValue)}
            />
          </div>
        </div>

        {/* Table card */}
        <section className="mt-5 overflow-hidden rounded-[14px] border border-[var(--bocar-border)] bg-white shadow-[0_12px_28px_rgba(0,46,93,0.06)]">
          {rfqs.state.status === 'loading' ? (
            <div className="px-6 py-12 text-center text-[14px] text-[var(--bocar-blue-70)]">
              Loading purchasing RFQs...
            </div>
          ) : rfqs.state.status === 'error' ? (
            <div className="px-6 py-12 text-center text-[14px] text-[var(--bocar-error)]">
              {rfqs.state.error.message}
            </div>
          ) : (
          <>

          {/* Mobile cards */}
          <div className="grid gap-3 p-4 lg:hidden">
            {visibleRows.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-[var(--bocar-border)] bg-[var(--bocar-bg)] px-4 py-8 text-center">
                <p className="m-0 text-[14px] font-medium text-[var(--bocar-text)]">
                  No RFQs match the current filters.
                </p>
              </div>
            ) : (
              visibleRows.map((row) => (
                <article
                  key={`${row.id}-mobile`}
                  className="rounded-[12px] border border-[rgba(217,222,229,0.84)] bg-white px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="m-0 text-[13px] font-semibold text-[var(--bocar-blue-100)]">
                        {row.id}
                      </p>
                      <p className="m-0 mt-1 text-[13px] text-[var(--bocar-text)]">{row.project}</p>
                      <p className="m-0 mt-1 text-[12px] text-[var(--bocar-blue-70)]">
                        {row.material} · {row.machineType}
                      </p>
                    </div>
                    <ActionMenu dark actions={getRowActions(row, navigate)} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <DashboardStatusBadge status={row.status} />
                    <DeadlineBadge hoursToDeadline={row.hoursToDeadline} />
                  </div>
                  <dl className="mt-3 grid gap-2 text-[12px]">
                    <div className="flex gap-2">
                      <dt className="font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-50)]">Created by</dt>
                      <dd className="m-0 text-[var(--bocar-text)]">{row.owner}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-50)]">Date</dt>
                      <dd className="m-0 text-[var(--bocar-text)]">{row.createdAt}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-50)]">Progress</dt>
                      <dd className="m-0 text-[var(--bocar-text)]">
                        {row.supplierProgress?.label ?? 'No quotations'}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#eef1f5]">
                  {(activeTab === 'historical'
                    ? ['ID', 'TYPE', 'STATUS', 'DATE', 'CREATED BY', 'ACTION']
                    : ['ID', 'STATUS', 'TYPE', 'DEADLINE', 'CREATION DATE', 'CREATED BY', 'SUPPLIER PROGRESS', 'ACTIONS']
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
                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'historical' ? 6 : 8} className="px-6 py-12 text-center">
                      <p className="m-0 text-[14px] font-medium text-[var(--bocar-text)]">
                        No RFQs match the current filters.
                      </p>
                    </td>
                  </tr>
                ) : activeTab === 'historical' ? (
                  visibleRows.map((row) => (
                    <tr key={row.id} className="transition hover:bg-[rgba(245,247,250,0.84)]">
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 text-[13px] text-[var(--bocar-blue-70)] lg:px-4 lg:py-4">
                        {row.id}
                      </td>
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 text-[13px] lg:px-4 lg:py-4">
                        {row.machineType}
                      </td>
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 lg:px-4 lg:py-4">
                        <DashboardStatusBadge status={row.status} />
                      </td>
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 text-[13px] lg:px-4 lg:py-4">
                        {row.createdAt}
                      </td>
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 text-[13px] lg:px-4 lg:py-4">
                        {row.owner}
                      </td>
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 lg:px-4 lg:py-4">
                        <button
                          type="button"
                          className="inline-flex h-9 min-w-[58px] items-center justify-center rounded-[8px] bg-[var(--bocar-blue-100)] px-4 text-[13px] font-medium text-white transition hover:bg-[#0b3b6b]"
                          onClick={() => navigate(`${ROUTES.PURCHASING.RFQ_DETAIL.replace(':id', row.id)}?tipo=${row.machineType}`, { state: { fromAdmin: false } })}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  visibleRows.map((row) => (
                    <tr key={row.id} className="transition hover:bg-[rgba(245,247,250,0.8)]">
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5 align-middle text-[13px] font-semibold text-[var(--bocar-blue-100)]">
                        {row.id}
                      </td>
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5 align-middle">
                        <DashboardStatusBadge status={row.status} />
                      </td>
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5 align-middle text-[13px] text-[var(--bocar-text)]">
                        {row.machineType}
                      </td>
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5 align-middle">
                        <DeadlineBadge hoursToDeadline={row.hoursToDeadline} />
                      </td>
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5 align-middle text-[13px] text-[var(--bocar-text)]">
                        {row.createdAt}
                      </td>
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5 align-middle text-[13px] text-[var(--bocar-text)]">
                        {row.owner}
                      </td>
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5 align-middle text-[13px] text-[var(--bocar-text)]">
                        {row.supplierProgress?.label ?? 'No quotations'}
                      </td>
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5 align-middle">
                        <ActionMenu dark actions={getRowActions(row, navigate)} />
                      </td>
                    </tr>
                  ))
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

        {/* Bottom panels */}
        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          <WidgetPanel
            title="UPCOMING DEADLINES"
            caption="RFQs requiring immediate follow-up before closing."
            items={urgentDeadlines}
          />
          <WidgetPanel
            title="PENDING UNLOCK REQUESTS"
            caption="Reopening requests received from suppliers."
            items={unlockRequests}
          />
        </section>

      </div>
    </MainLayout>
  );
}

export default DashboardPage;

function buildPurchasingMetrics(counts?: PurchasingStatusCounts): PurchasingDashboardMetric[] {
  const count = (status: keyof PurchasingStatusCounts) => counts?.[status]?.total ?? 0;
  return [
    { key: 'pending', label: 'PENDING', status: 'PENDING', value: String(count('PENDING')), valueColor: 'var(--bocar-blue-100)' },
    { key: 'quoting', label: 'QUOTING', status: 'QUOTING', value: String(count('QUOTING')), valueColor: '#5a8a1f' },
    { key: 'benchmark_ready', label: 'BENCHMARK READY', status: 'BENCHMARK_READY', value: String(count('BENCHMARK_READY')), valueColor: '#005f8e' },
    { key: 'closed', label: 'CLOSED RFQs', status: 'CLOSED', value: String(count('CLOSED')), valueColor: 'var(--bocar-blue-50)' },
    { key: 'expired', label: 'EXPIRED', status: 'EXPIRED', value: String(count('EXPIRED')), valueColor: 'var(--bocar-error)' },
  ];
}

function getChartStatusText(status: ReturnType<typeof useRfqHistogramSeries>['status']) {
  if (status === 'loading') return 'Loading';
  if (status === 'error') return 'Unavailable';
  return 'Live';
}
