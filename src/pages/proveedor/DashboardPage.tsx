import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { DashboardMetricCard } from '@/features/analytics/components/KpiCards/DashboardMetricCard';
import { FilterSelect } from '@/features/analytics/components/Filters/FilterSelect';
import { SearchField } from '@/features/analytics/components/Filters/SearchField';
import {
  assignedRows,
  getFilteredRows,
  historicalRows,
  supplierMetrics,
} from '@/features/supplier/services/supplierDashboardService';
import type { SupplierMetricKey, SupplierRfqRow, SupplierRfqStatus, SupplierTab } from '@/features/supplier/types';
import { MainLayout } from '@/layouts/MainLayout';
import { Header } from '@/layouts/components/Header';

const PAGE_SIZE = 4;

const statusMeta: Record<SupplierRfqStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Pending',
    className:
      'border-[rgba(255,210,0,0.4)] bg-[rgba(255,210,0,0.18)] text-[#8a6400]',
  },
  QUOTED: {
    label: 'Quoted',
    className:
      'border-[rgba(141,198,63,0.35)] bg-[rgba(141,198,63,0.18)] text-[#4a7a10]',
  },
  DONE: {
    label: 'Done',
    className:
      'border-[rgba(174,179,184,0.35)] bg-[rgba(174,179,184,0.18)] text-[var(--bocar-blue-70)]',
  },
};

function StatusBadge({ status }: { status: SupplierRfqStatus }) {
  const meta = statusMeta[status];
  return (
    <span
      className={[
        'inline-flex items-center rounded-xl border px-3 py-1 text-[11px] font-semibold tracking-[0.01em]',
        meta.className,
      ].join(' ')}
    >
      {meta.label}
    </span>
  );
}

function ViewButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center rounded-[8px] bg-[var(--bocar-blue-100)] px-4 text-[12px] font-medium text-white transition hover:bg-[#0b3b6b] focus:outline-none"
    >
      View
    </button>
  );
}


function RfqTable({
  rows,
  tab,
  onView,
}: {
  rows: SupplierRfqRow[];
  tab: SupplierTab;
  onView: (row: SupplierRfqRow) => void;
}) {
  const dateHeader = tab === 'assigned' ? 'DEADLINE' : 'DATE';

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr className="bg-[#eef1f5]">
            {['ID', 'STATUS', 'TYPE', dateHeader, 'ACTION'].map((h) => (
              <th
                key={h}
                className="border-b border-[var(--bocar-border)] px-5 py-3.5 text-left text-[11px] font-semibold tracking-[0.06em] text-[var(--bocar-blue-70)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-[14px] text-[var(--bocar-blue-70)]">
                No RFQs match the filters.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="transition hover:bg-[rgba(245,247,250,0.8)]">
                <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5 text-[13px] font-semibold text-[var(--bocar-blue-100)]">
                  {row.id}
                </td>
                <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5">
                  <StatusBadge status={row.status} />
                </td>
                <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5 text-[13px] text-[var(--bocar-text)]">
                  {row.tipo}
                </td>
                <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5 text-[13px] text-[var(--bocar-text)]">
                  {row.deadline}
                </td>
                <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5">
                  <ViewButton onClick={() => onView(row)} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function SupplierDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SupplierTab>('assigned');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'QUOTED' | ''>('');
  const [searchValue, setSearchValue] = useState('');
  const [deadlineValue, setDeadlineValue] = useState('');
  const [tipoValue, setTipoValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const sourceRows = activeTab === 'assigned' ? assignedRows : historicalRows;

  const filteredRows = useMemo(() => {
    let rows = getFilteredRows(sourceRows, searchValue, deadlineValue);
    if (activeTab === 'assigned' && statusFilter) {
      rows = rows.filter((r) => r.status === statusFilter);
    }
    if (tipoValue) {
      rows = rows.filter((r) => r.tipo === tipoValue);
    }
    return rows;
  }, [sourceRows, searchValue, deadlineValue, statusFilter, tipoValue, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const visibleRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function resetFilters() {
    setSearchValue('');
    setDeadlineValue('');
    setTipoValue('');
    setStatusFilter('');
    setCurrentPage(1);
  }

  function handleTabChange(tab: SupplierTab) {
    setActiveTab(tab);
    resetFilters();
  }

  function handleMetricSelect(key: SupplierMetricKey) {
    if (key === 'assigned') {
      handleTabChange('assigned');
    } else if (key === 'historical') {
      handleTabChange('historical');
    } else if (key === 'pending') {
      setActiveTab('assigned');
      setStatusFilter((prev) => (prev === 'PENDING' ? '' : 'PENDING'));
      setCurrentPage(1);
    } else if (key === 'quoted') {
      setActiveTab('assigned');
      setStatusFilter((prev) => (prev === 'QUOTED' ? '' : 'QUOTED'));
      setCurrentPage(1);
    }
  }

  function handleFilterChange(setter: (v: string) => void) {
    return (value: string) => {
      setter(value);
      setCurrentPage(1);
    };
  }

  const activeMetricKey: SupplierMetricKey | null =
    activeTab === 'historical'
      ? 'historical'
      : statusFilter === 'PENDING'
        ? 'pending'
        : statusFilter === 'QUOTED'
          ? 'quoted'
          : 'assigned';

  return (
    <MainLayout header={<Header areaLabel="Suppliers" />}>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-6 pb-8 pt-8 sm:px-8 lg:px-12 lg:pb-10 lg:pt-8 xl:px-14">

        <h1 className="m-0 text-[20px] font-bold uppercase tracking-[0.04em] text-[var(--bocar-blue-100)]">
          DASHBOARD
        </h1>

        {/* KPI cards */}
        <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="grid grid-cols-2 gap-3">
            {supplierMetrics.map((metric) => (
              <DashboardMetricCard
                key={metric.key}
                isActive={activeMetricKey === metric.key}
                metric={metric}
                onSelect={handleMetricSelect}
              />
            ))}
          </div>
          {/* placeholder card */}
          <div className="hidden rounded-[12px] border border-[var(--bocar-border)] bg-white shadow-[0_8px_18px_rgba(0,46,93,0.04)] lg:block" />
        </section>

        {/* Tabs */}
        <div className="mt-8 flex justify-center border-b border-[var(--bocar-border)]">
          <button
            type="button"
            onClick={() => handleTabChange('assigned')}
            className={[
              'mr-6 px-1 pb-3 pt-1 text-[14px] transition focus:outline-none',
              activeTab === 'assigned'
                ? 'border-b-2 border-[var(--bocar-blue-100)] font-semibold text-[var(--bocar-text)]'
                : 'border-b-2 border-transparent font-medium text-[var(--bocar-blue-70)] hover:text-[var(--bocar-text)]',
            ].join(' ')}
          >
            Assigned
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
          <SearchField value={searchValue} onChange={handleFilterChange(setSearchValue)} />
          <FilterSelect
            label="Deadline"
            options={[
              { label: '20/06/2024', value: '20/06/2024' },
              { label: '25/06/2024', value: '25/06/2024' },
              { label: '28/06/2024', value: '28/06/2024' },
            ]}
            value={deadlineValue}
            onChange={handleFilterChange(setDeadlineValue)}
          />
          <FilterSelect
            label="Type"
            options={[
              { label: 'Trimming', value: 'Trimming' },
              { label: 'Mold', value: 'Mold' },
            ]}
            value={tipoValue}
            onChange={handleFilterChange(setTipoValue)}
          />
        </div>

        {/* Table card */}
        <section className="mt-5 overflow-hidden rounded-[14px] border border-[var(--bocar-border)] bg-white shadow-[0_12px_28px_rgba(0,46,93,0.06)]">
          <RfqTable
            rows={visibleRows}
            tab={activeTab}
            onView={(row) => {
              if (row.status === 'PENDING') {
                navigate(
                  `${ROUTES.SUPPLIER.QUOTATION_CREATE.replace(':rfqId', row.id)}?tipo=${row.tipo}`
                );
              } else {
                navigate(ROUTES.SUPPLIER.RFQ_DETAIL.replace(':id', row.id));
              }
            }}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-4 text-[13px] text-[var(--bocar-blue-50)]">
            <p className="m-0">
              Showing {visibleRows.length} of {filteredRows.length} results
            </p>
            {totalPages > 1 ? (
              <div className="flex items-center gap-3">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={[
                      'min-w-[16px] text-[13px] transition hover:text-[var(--bocar-text)]',
                      page === safePage
                        ? 'font-semibold text-[var(--bocar-text)]'
                        : 'text-[var(--bocar-blue-50)]',
                    ].join(' ')}
                  >
                    {page}
                  </button>
                ))}
                {totalPages > 2 && <span className="text-[var(--bocar-blue-30)]">...</span>}
                <button
                  type="button"
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="text-[13px] text-[var(--bocar-blue-50)] transition hover:text-[var(--bocar-text)] disabled:opacity-30"
                >
                  {'>'}
                </button>
                <button
                  type="button"
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="text-[13px] text-[var(--bocar-blue-50)] transition hover:text-[var(--bocar-text)] disabled:opacity-30"
                >
                  {'»'}
                </button>
              </div>
            ) : null}
          </div>
        </section>

      </div>
    </MainLayout>
  );
}

export default SupplierDashboardPage;
