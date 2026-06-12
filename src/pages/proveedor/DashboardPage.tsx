import { useMemo, useState } from 'react';
import { TablePagination } from '@/shared/components/ui/TablePagination';
import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import type { RfqTipo } from '@/features/analytics/types';
import { DashboardMetricCard } from '@/features/analytics/components/KpiCards/DashboardMetricCard';
import { FilterSelect } from '@/features/analytics/components/Filters/FilterSelect';
import { SearchField } from '@/features/analytics/components/Filters/SearchField';
import {
  getFilteredRows,
} from '@/features/supplier/services/supplierDashboardService';
import { solicitarExtension } from '@/features/supplier/services/asignacionesService';
import { useMisAsignaciones } from '@/features/supplier/hooks/useMisAsignaciones';
import { RequestExtensionModal } from '@/features/supplier/components/RequestExtensionModal';
import { SupplierProfileCard } from '@/features/supplier/components/SupplierProfileCard';
import { useMutation } from '@/shared/hooks/useMutation';
import type { SupplierMetricKey, SupplierRfqRow, SupplierRfqStatus, SupplierTab } from '@/features/supplier/types';

const TABS: { key: SupplierTab; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'historical', label: 'Historical' },
];
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
  onRequestExtension,
}: {
  rows: SupplierRfqRow[];
  tab: SupplierTab;
  onView: (row: SupplierRfqRow) => void;
  onRequestExtension: (row: SupplierRfqRow) => void;
}) {
  const dateHeader = tab === 'historical' ? 'DATE' : 'DEADLINE';

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr className="bg-[#eef1f5]">
            {['ID', 'DESC', 'STATUS', 'TYPE', dateHeader, 'ACTION'].map((h) => (
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
              <td colSpan={6} className="px-6 py-12 text-center text-[14px] text-[var(--bocar-blue-70)]">
                No RFQs match the filters.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="transition hover:bg-[rgba(245,247,250,0.8)]">
                <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5 text-[13px] font-semibold text-[var(--bocar-blue-100)]">
                  {row.id}
                </td>
                <td
                  className="max-w-[260px] border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5 text-[13px] text-[var(--bocar-text)]"
                  title={row.desc ?? '-'}
                >
                  <span className="block truncate">{row.desc ?? '-'}</span>
                </td>
                <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5">
                  <StatusBadge status={row.status} />
                </td>
                <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5 text-[13px] text-[var(--bocar-text)]">
                  {row.tipo}
                </td>
                <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5 text-[13px] text-[var(--bocar-text)]">
                  <span className="inline-flex items-center gap-2">
                    {row.deadline}
                    {tab !== 'historical' && row.expired ? (
                      <span className="inline-flex items-center rounded-xl border border-[rgba(170,0,15,0.22)] bg-[rgba(170,0,15,0.08)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--bocar-error)]">
                        Expired
                      </span>
                    ) : null}
                  </span>
                </td>
                <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <ViewButton onClick={() => onView(row)} />
                    {tab !== 'historical' && row.expired ? (
                      <button
                        type="button"
                        onClick={() => onRequestExtension(row)}
                        className="inline-flex h-8 items-center rounded-[8px] border border-[var(--bocar-blue-100)] px-3 text-[12px] font-medium text-[var(--bocar-blue-100)] transition hover:bg-[var(--bocar-blue-100)] hover:text-white focus:outline-none"
                      >
                        Request extension
                      </button>
                    ) : null}
                  </div>
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
  const assignments = useMisAsignaciones();
  const [activeTab, setActiveTab] = useState<SupplierTab>('pending');
  const [searchValue, setSearchValue] = useState('');
  const [deadlineValue, setDeadlineValue] = useState('');
  const [tipoValue, setTipoValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [extensionRow, setExtensionRow] = useState<SupplierRfqRow | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const extensionMutation = useMutation(solicitarExtension);

  async function handleRequestExtension(data: { motivo: string; nueva_fecha: string }) {
    if (!extensionRow?.assignmentId) return;
    await extensionMutation.mutate(
      extensionRow.tipo as RfqTipo,
      extensionRow.assignmentId,
      data,
    );
    setExtensionRow(null);
    setSuccessMsg('Extension request sent. Purchasing will review it shortly.');
    assignments.reload();
  }

  const realData =
    assignments.state.status === 'success'
      ? assignments.state.data
      : { pendingRows: [], quotedRows: [], historicalRows: [], metrics: [] };
  const sourceRows =
    activeTab === 'pending'
      ? realData.pendingRows
      : activeTab === 'quoted'
        ? realData.quotedRows
        : realData.historicalRows;
  const supplierMetrics = realData.metrics;

  const deadlineOptions = useMemo(
    () =>
      Array.from(new Set(sourceRows.map((r) => r.deadline).filter(Boolean))).map((d) => ({
        label: d,
        value: d,
      })),
    [sourceRows],
  );

  const filteredRows = useMemo(() => {
    let rows = getFilteredRows(sourceRows, searchValue, deadlineValue);
    if (tipoValue) {
      rows = rows.filter((r) => r.tipo === tipoValue);
    }
    return rows;
  }, [sourceRows, searchValue, deadlineValue, tipoValue]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const visibleRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function resetFilters() {
    setSearchValue('');
    setDeadlineValue('');
    setTipoValue('');
    setCurrentPage(1);
  }

  function handleTabChange(tab: SupplierTab) {
    setActiveTab(tab);
    resetFilters();
  }

  // Card ↔ tab es 1:1: cada métrica selecciona su tab homónimo.
  function handleMetricSelect(key: SupplierMetricKey) {
    handleTabChange(key);
  }

  function handleFilterChange(setter: (v: string) => void) {
    return (value: string) => {
      setter(value);
      setCurrentPage(1);
    };
  }

  const activeMetricKey: SupplierMetricKey = activeTab;

  return (
    <MainLayout header={<Header areaLabel="Suppliers" />}>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-6 pb-8 pt-8 sm:px-8 lg:px-12 lg:pb-10 lg:pt-8 xl:px-14">

        <h1 className="m-0 text-[20px] font-bold uppercase tracking-[0.04em] text-[var(--bocar-blue-100)]">
          DASHBOARD
        </h1>

        {successMsg ? (
          <div
            role="status"
            className="mt-4 flex items-center justify-between gap-4 rounded-[10px] border border-[rgba(141,198,63,0.4)] bg-[rgba(141,198,63,0.12)] px-4 py-3 text-[13px] text-[#4a7a10]"
          >
            <span>{successMsg}</span>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="text-[12px] font-semibold text-[#4a7a10] underline-offset-2 hover:underline"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {/* KPI cards */}
        <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="grid grid-cols-3 gap-3">
            {supplierMetrics.map((metric) => (
              <DashboardMetricCard
                key={metric.key}
                isActive={activeMetricKey === metric.key}
                metric={metric}
                onSelect={handleMetricSelect}
              />
            ))}
          </div>
          <div className="hidden lg:block">
            <SupplierProfileCard />
          </div>
        </section>

        {/* Tabs — 1:1 con los cards */}
        <div className="mt-8 flex justify-center border-b border-[var(--bocar-border)]">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={[
                'mx-3 px-1 pb-3 pt-1 text-[14px] transition focus:outline-none',
                activeTab === tab.key
                  ? 'border-b-2 border-[var(--bocar-blue-100)] font-semibold text-[var(--bocar-text)]'
                  : 'border-b-2 border-transparent font-medium text-[var(--bocar-blue-70)] hover:text-[var(--bocar-text)]',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <SearchField value={searchValue} onChange={handleFilterChange(setSearchValue)} />
          <FilterSelect
            label="Deadline"
            options={deadlineOptions}
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
          {assignments.state.status === 'loading' ? (
            <div className="px-6 py-12 text-center text-[14px] text-[var(--bocar-blue-70)]">
              Loading assigned RFQs...
            </div>
          ) : assignments.state.status === 'error' ? (
            <div className="px-6 py-12 text-center text-[14px] text-[var(--bocar-error)]">
              {assignments.state.error.message}
            </div>
          ) : (
          <>
          <RfqTable
            rows={visibleRows}
            tab={activeTab}
            onView={(row) => {
              const id = row.assignmentId ? String(row.assignmentId) : row.id;
              navigate(`${ROUTES.SUPPLIER.RFQ_DETAIL.replace(':id', id)}?tipo=${row.tipo}`);
            }}
            onRequestExtension={(row) => {
              setSuccessMsg(null);
              setExtensionRow(row);
            }}
          />

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

      {extensionRow ? (
        <RequestExtensionModal
          rfqId={extensionRow.id}
          dueDate={extensionRow.dueDate}
          onConfirm={handleRequestExtension}
          onClose={() => setExtensionRow(null)}
        />
      ) : null}
    </MainLayout>
  );
}

export default SupplierDashboardPage;
