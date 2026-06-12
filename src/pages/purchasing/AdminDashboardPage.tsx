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
  buildUpcomingDeadlineItems,
  getFilteredDashboardRows,
} from '@/features/purchasing/services/purchasingDashboardService';
import { ExtensionRequestsPanel } from '@/features/purchasing/components/ExtensionRequestsPanel';
import { PurchasingWidgetPanel } from '@/features/purchasing/components/PurchasingWidgetPanel';
import { useRfqHistogramSeries } from '@/features/analytics/hooks/useRfqHistogramSeries';
import {
  usePurchasingDashboardCounts,
  type PurchasingStatusCounts,
} from '@/features/purchasing/hooks/usePurchasingDashboardCounts';
import { usePurchasingRfqList } from '@/features/purchasing/hooks/usePurchasingRfqList';
import { useSolicitudesExtension } from '@/features/purchasing/hooks/useSolicitudesExtension';
import type {
  PurchasingDashboardMetric,
  PurchasingDashboardRow,
  PurchasingRfqStatus,
} from '@/features/purchasing/types';
import { MainLayout } from '@/layouts/MainLayout';
import { Header } from '@/layouts/components/Header';
import { ActionMenu } from '@/shared/components/ui/ActionMenu';

const PAGE_SIZE = 4;

type AdminTab = 'pending' | 'eliminated' | 'historical';

const PENDING_STATUSES: PurchasingRfqStatus[] = ['PENDING', 'QUOTING', 'EXPIRED'];
const HISTORICAL_STATUSES: PurchasingRfqStatus[] = ['BENCHMARK_READY', 'CLOSED'];

function DashboardStatusBadge({ status }: { status: PurchasingRfqStatus }) {
  if (status === 'QUOTING') {
    return (
      <span className="inline-flex items-center rounded-full border border-[rgba(141,198,63,0.3)] bg-[rgba(141,198,63,0.15)] px-3 py-1 text-[11px] font-semibold tracking-[0.01em] text-[#5a8a1f]">
        In quotation
      </span>
    );
  }
  if (status === 'EXPIRED') {
    return (
      <span className="inline-flex items-center rounded-full border border-[rgba(170,0,15,0.22)] bg-[rgba(170,0,15,0.08)] px-3 py-1 text-[11px] font-semibold tracking-[0.01em] text-[var(--bocar-error)]">
        Expired
      </span>
    );
  }
  if (status === 'CANCELLED') {
    return (
      <span className="inline-flex items-center rounded-full border border-[rgba(174,179,184,0.4)] bg-[rgba(174,179,184,0.15)] px-3 py-1 text-[11px] font-semibold tracking-[0.01em] text-[var(--bocar-blue-70)]">
        Cancelled
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
  const detailHref = `${ROUTES.PURCHASING.RFQ_DETAIL.replace(':id', row.id)}?status=${row.status}&tipo=${row.machineType}`;
  const detailAction = {
    key: 'view_detail' as const,
    label: 'View details',
    onSelect: () => navigate(detailHref, { state: { fromAdmin: true } }),
  };

  if (row.status === 'PENDING') {
    return [
      {
        key: 'assign' as const,
        label: 'Assign',
        onSelect: () =>
          navigate(`${detailHref}#assign-suppliers`, {
            state: { fromAdmin: true, scrollTo: 'assign-suppliers' },
          }),
      },
      detailAction,
    ];
  }

  return [detailAction];
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const rfqHistogram = useRfqHistogramSeries();
  const rfqs = usePurchasingRfqList();
  const dashboardCounts = usePurchasingDashboardCounts();
  const extensionRequests = useSolicitudesExtension();
  const allRows = rfqs.state.status === 'success' ? rfqs.state.data : [];
  const upcomingDeadlineItems = useMemo(
    () => buildUpcomingDeadlineItems(allRows),
    [allRows],
  );
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');
  const [activeStatusFilter, setActiveStatusFilter] = useState<PurchasingRfqStatus | ''>('');
  const [searchValue, setSearchValue] = useState('');
  const [tipoValue, setTipoValue] = useState('');
  const [deadlineValue, setDeadlineValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const superuserPurchasingMetrics = useMemo(
    () =>
      buildSuperuserPurchasingMetrics(
        dashboardCounts.state.status === 'success' ? dashboardCounts.state.data.estatus : undefined,
        allRows.filter((row) => row.status === 'CANCELLED').length,
      ),
    [allRows, dashboardCounts.state],
  );

  const sourceRows = useMemo(() => {
    if (activeTab === 'pending') {
      return allRows.filter((row) => PENDING_STATUSES.includes(row.status));
    }
    if (activeTab === 'eliminated') {
      return allRows.filter((row) => row.status === 'CANCELLED');
    }
    return allRows.filter((row) => HISTORICAL_STATUSES.includes(row.status));
  }, [activeTab, allRows]);

  const filteredRows = useMemo(() => {
    const base = getFilteredDashboardRows(sourceRows, { searchValue, tipoValue, deadlineValue });
    if (!activeStatusFilter) return base;
    return base.filter((row) => row.status === activeStatusFilter);
  }, [sourceRows, searchValue, tipoValue, deadlineValue, activeStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const visibleRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleTabChange(tab: AdminTab) {
    setActiveTab(tab);
    setActiveStatusFilter('');
    setCurrentPage(1);
    setSearchValue('');
    setTipoValue('');
    setDeadlineValue('');
  }

  function handleFilterChange(setter: (v: string) => void) {
    return (value: string) => {
      setter(value);
      setCurrentPage(1);
    };
  }

  function handleMetricSelect(key: string) {
    const metric = superuserPurchasingMetrics.find((m) => m.key === key);
    if (!metric) return;
    if (metric.status === 'QUOTING' || metric.status === 'EXPIRED') {
      setActiveTab('pending');
      setActiveStatusFilter((prev) => (prev === metric.status ? '' : metric.status));
      setCurrentPage(1);
    } else if (metric.status === 'CANCELLED') {
      handleTabChange('eliminated');
    } else if (metric.status === 'PENDING') {
      handleTabChange('pending');
    } else if (metric.status === 'BENCHMARK_READY' || metric.status === 'CLOSED') {
      setActiveTab('historical');
      setActiveStatusFilter(metric.status);
      setCurrentPage(1);
      setSearchValue('');
      setTipoValue('');
      setDeadlineValue('');
    }
  }

  const machineTypeOptions = [
    { label: 'Mold', value: 'Mold' },
    { label: 'Trimming', value: 'Trimming' },
  ];
  const deadlineOptions = purchasingDeadlineRangeOptions.map((opt) => ({
    label: opt.label,
    value: opt.value,
  }));

  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'pending', label: 'RFQs to assign' },
    { key: 'eliminated', label: 'Deleted RFQs' },
    { key: 'historical', label: 'Historical' },
  ];

  return (
    <MainLayout
      header={
        <Header
          areaLabel="Purchasing . Super User"
          variant="dark"
        />
      }
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-6 pb-8 pt-8 sm:px-8 lg:px-12 lg:pb-10 lg:pt-8 xl:px-14">
        <DashboardHeader />

        <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(400px,0.9fr)]">
          <div className="grid gap-3 sm:grid-cols-3">
            {superuserPurchasingMetrics.map((metric) => (
              <DashboardMetricCard
                key={metric.key}
                isActive={
                  (activeStatusFilter !== '' && metric.status === activeStatusFilter) ||
                  (activeStatusFilter === '' && (
                    (metric.status === 'PENDING' && activeTab === 'pending') ||
                    (metric.status === 'CANCELLED' && activeTab === 'eliminated') ||
                    (metric.status === 'BENCHMARK_READY' && activeTab === 'historical')
                  ))
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

        <div className="mt-8 flex justify-center border-b border-[var(--bocar-border)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={[
                'px-4 pb-3 pt-1 text-[14px] transition focus:outline-none',
                activeTab === tab.key
                  ? 'border-b-2 border-[var(--bocar-blue-100)] font-semibold text-[var(--bocar-text)]'
                  : 'border-b-2 border-transparent font-medium text-[var(--bocar-blue-70)] hover:text-[var(--bocar-text)]',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <SearchField
            value={searchValue}
            onChange={handleFilterChange(setSearchValue)}
          />
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <FilterSelect
              label="RFQ type"
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
            <button
              type="button"
              onClick={() => navigate(ROUTES.PURCHASING.RFQ_CREATE)}
              className="ml-auto inline-flex h-9 items-center gap-2 rounded-[10px] bg-[var(--bocar-blue-100)] px-5 text-[13px] font-medium text-white transition hover:bg-[#0b3b6b] focus:outline-none focus:shadow-[0_0_0_3px_rgba(0,46,93,0.2)]"
            >
              Create RFQ
            </button>
          </div>
        </div>

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
                          <p className="m-0 mt-1 line-clamp-2 max-w-[240px] text-[13px] text-[var(--bocar-text)]" title={row.desc ?? '-'}>
                            {row.desc ?? '-'}
                          </p>
                          <p className="m-0 mt-1 text-[13px] text-[var(--bocar-text)]">{row.project}</p>
                          <p className="m-0 mt-1 text-[12px] text-[var(--bocar-blue-70)]">
                            {row.machineType}
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

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-[#eef1f5]">
                      {(activeTab === 'historical'
                        ? ['ID', 'DESC', 'TYPE', 'STATUS', 'DATE', 'CREATED BY', 'ACTION']
                        : ['ID', 'DESC', 'STATUS', 'TYPE', 'DEADLINE', 'CREATION DATE', 'CREATED BY', 'SUPPLIER PROGRESS', 'ACTIONS']
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
                        <td colSpan={activeTab === 'historical' ? 7 : 9} className="px-6 py-12 text-center">
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
                          <td
                            className="max-w-[260px] border-b border-[rgba(217,222,229,0.72)] px-5 py-4 text-[13px] text-[var(--bocar-text)] lg:px-4 lg:py-4"
                            title={row.desc ?? '-'}
                          >
                            <span className="block truncate">{row.desc ?? '-'}</span>
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
                              onClick={() =>
                                navigate(
                                  `${ROUTES.PURCHASING.RFQ_DETAIL.replace(':id', row.id)}?status=${row.status}&tipo=${row.machineType}`,
                                  { state: { fromAdmin: true } },
                                )
                              }
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
                          <td
                            className="max-w-[260px] border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5 align-middle text-[13px] text-[var(--bocar-text)]"
                            title={row.desc ?? '-'}
                          >
                            <span className="block truncate">{row.desc ?? '-'}</span>
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

        <section className="mt-5 grid items-start gap-4 lg:grid-cols-2">
          <PurchasingWidgetPanel
            title="UPCOMING DEADLINES"
            caption="RFQs requiring immediate follow-up before closing."
            items={upcomingDeadlineItems}
            isLoading={rfqs.state.status === 'loading'}
            emptyLabel="No RFQs with upcoming deadlines."
            pageSize={2}
          />
          <ExtensionRequestsPanel
            requests={extensionRequests.state.status === 'success' ? extensionRequests.state.data : []}
            isLoading={extensionRequests.state.status === 'loading'}
            onResolved={extensionRequests.reload}
          />
        </section>
      </div>
    </MainLayout>
  );
}

function buildSuperuserPurchasingMetrics(
  counts: PurchasingStatusCounts | undefined,
  deletedCount: number,
): PurchasingDashboardMetric[] {
  const count = (status: keyof PurchasingStatusCounts) => counts?.[status]?.total ?? 0;
  return [
    { key: 'pending', label: 'RFQs TO ASSIGN', status: 'PENDING', value: String(count('PENDING')), valueColor: 'var(--bocar-blue-100)' },
    { key: 'quoting', label: 'RFQs IN QUOTATION', status: 'QUOTING', value: String(count('QUOTING')), valueColor: '#5a8a1f' },
    { key: 'eliminated', label: 'DELETED RFQs', status: 'CANCELLED', value: String(deletedCount), valueColor: '#AA000F' },
    { key: 'expired', label: 'EXPIRED RFQs', status: 'EXPIRED', value: String(count('EXPIRED')), valueColor: 'var(--bocar-error)' },
    { key: 'benchmark_ready', label: 'BENCHMARK READY', status: 'BENCHMARK_READY', value: String(count('BENCHMARK_READY')), valueColor: '#005f8e' },
    { key: 'closed', label: 'CLOSED RFQs', status: 'CLOSED', value: String(count('CLOSED')), valueColor: 'var(--bocar-blue-50)' },
  ];
}

function getChartStatusText(status: ReturnType<typeof useRfqHistogramSeries>['status']) {
  if (status === 'loading') return 'Loading';
  if (status === 'error') return 'Unavailable';
  return 'Live';
}

export default AdminDashboardPage;
