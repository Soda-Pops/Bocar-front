import { useMemo, useState } from 'react';
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
  eliminatedRows,
  getDashboardCardStatusClass,
  getFilteredDashboardRows,
  historicalRows,
  purchasingAdminUser,
  purchasingMonthlySeries,
  purchasingQueueRows,
  superuserPurchasingMetrics,
  unlockRequests,
  urgentDeadlines,
} from '@/features/purchasing/services/purchasingDashboardService';
import type { PurchasingDashboardRow, PurchasingRfqStatus } from '@/features/purchasing/types';
import { MainLayout } from '@/layouts/MainLayout';
import { Header } from '@/layouts/components/Header';
import { ActionMenu } from '@/shared/components/ui/ActionMenu';

const PAGE_SIZE = 6;

type AdminTab = 'pending' | 'eliminated' | 'historical';

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
        En cotización
      </span>
    );
  }
  if (status === 'EXPIRED') {
    return (
      <span className="inline-flex items-center rounded-full border border-[rgba(170,0,15,0.22)] bg-[rgba(170,0,15,0.08)] px-3 py-1 text-[11px] font-semibold tracking-[0.01em] text-[var(--bocar-error)]">
        Vencidas
      </span>
    );
  }
  if (status === 'CANCELLED') {
    return (
      <span className="inline-flex items-center rounded-full border border-[rgba(174,179,184,0.4)] bg-[rgba(174,179,184,0.15)] px-3 py-1 text-[11px] font-semibold tracking-[0.01em] text-[var(--bocar-blue-70)]">
        Eliminada
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
    label: 'Ver detalle',
    onSelect: () => navigate(ROUTES.PURCHASING.RFQ_DETAIL.replace(':id', row.id)),
  };

  if (row.status === 'PENDING') {
    return [
      {
        key: 'assign' as const,
        label: 'Asignar',
        onSelect: () =>
          navigate(ROUTES.PURCHASING.RFQ_ASSIGN_SUPPLIERS.replace(':id', row.id)),
      },
      detailAction,
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
            Ver todo
            <ArrowRightIcon />
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3">
        {items.length === 0 ? (
          <p className="m-0 text-[13px] text-[var(--bocar-blue-50)]">Sin solicitudes pendientes.</p>
        ) : (
          items.map((item) => {
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
          })
        )}
      </div>
    </section>
  );
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');
  const [activeStatusFilter, setActiveStatusFilter] = useState<PurchasingRfqStatus | ''>('');
  const [searchValue, setSearchValue] = useState('');
  const [tipoValue, setTipoValue] = useState('');
  const [deadlineValue, setDeadlineValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const sourceRows =
    activeTab === 'pending'
      ? purchasingQueueRows
      : activeTab === 'eliminated'
        ? eliminatedRows
        : historicalRows;

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
      setActiveStatusFilter((prev) => (prev === metric.status ? '' : metric.status));
      setCurrentPage(1);
    } else if (metric.status === 'CANCELLED') {
      handleTabChange('eliminated');
    } else {
      navigate(`${ROUTES.PURCHASING.RFQ_LIST}?status=${metric.status}`);
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
    { key: 'pending', label: 'RFQs por asignar' },
    { key: 'eliminated', label: 'RFQs Eliminadas' },
    { key: 'historical', label: 'Históricas' },
  ];

  return (
    <MainLayout
      header={
        <Header
          areaLabel="Comercialización . Superusuario"
          variant="dark"
          user={purchasingAdminUser}
        />
      }
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-6 pb-8 pt-8 sm:px-8 lg:px-12 lg:pb-10 lg:pt-8 xl:px-14">

        {/* Dashboard title */}
        <DashboardHeader />

        {/* KPI cards + chart */}
        <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(400px,0.9fr)]">
          <div className="grid gap-3 sm:grid-cols-3">
            {superuserPurchasingMetrics.map((metric) => (
              <DashboardMetricCard
                key={metric.key}
                isActive={activeStatusFilter !== '' && metric.status === activeStatusFilter}
                metric={metric}
                onSelect={handleMetricSelect}
              />
            ))}
          </div>
          <MonthlyRfqChart series={purchasingMonthlySeries} />
        </section>

        {/* Tabs */}
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

        {/* Filter bar */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <SearchField
            value={searchValue}
            onChange={handleFilterChange(setSearchValue)}
          />
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <FilterSelect
              label="Tipo de RFQ"
              options={machineTypeOptions}
              value={tipoValue}
              onChange={handleFilterChange(setTipoValue)}
            />
            <FilterSelect
              label="Deadline"
              options={deadlineOptions}
              value={deadlineValue}
              onChange={handleFilterChange(setDeadlineValue)}
            />
            <button
              type="button"
              className="ml-auto inline-flex h-9 items-center gap-2 rounded-[10px] bg-[var(--bocar-blue-100)] px-5 text-[13px] font-medium text-white transition hover:bg-[#0b3b6b] focus:outline-none focus:shadow-[0_0_0_3px_rgba(0,46,93,0.2)]"
            >
              Crear RFQ
            </button>
          </div>
        </div>

        {/* Table card */}
        <section className="mt-5 overflow-hidden rounded-[14px] border border-[var(--bocar-border)] bg-white shadow-[0_12px_28px_rgba(0,46,93,0.06)]">

          {/* Mobile cards */}
          <div className="grid gap-3 p-4 lg:hidden">
            {visibleRows.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-[var(--bocar-border)] bg-[var(--bocar-bg)] px-4 py-8 text-center">
                <p className="m-0 text-[14px] font-medium text-[var(--bocar-text)]">
                  No hay RFQs que coincidan con los filtros actuales.
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
                      <dt className="font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-50)]">Creado por</dt>
                      <dd className="m-0 text-[var(--bocar-text)]">{row.owner}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-50)]">Fecha</dt>
                      <dd className="m-0 text-[var(--bocar-text)]">{row.createdAt}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-50)]">Progreso</dt>
                      <dd className="m-0 text-[var(--bocar-text)]">
                        {row.supplierProgress?.label ?? 'Sin cotizaciones'}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1100px] border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#eef1f5]">
                  {[
                    'ID',
                    'STATUS',
                    'TIPO',
                    'DEADLINE',
                    'FECHA DE CREACIÓN',
                    'CREADO POR',
                    'PROGRESO DE PROVEEDORES',
                    'ACCIONES',
                  ].map((header) => (
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
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <p className="m-0 text-[14px] font-medium text-[var(--bocar-text)]">
                        No hay RFQs que coincidan con los filtros actuales.
                      </p>
                    </td>
                  </tr>
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
                        {row.supplierProgress?.label ?? 'Sin cotizaciones'}
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

          {/* Pagination */}
          <div className="flex flex-col gap-3 px-5 py-4 text-[13px] text-[var(--bocar-blue-70)] sm:flex-row sm:items-center sm:justify-between">
            <p className="m-0">
              Mostrando {visibleRows.length} de {filteredRows.length} resultados
            </p>
            {totalPages > 1 ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[rgba(217,222,229,0.92)] bg-white text-[var(--bocar-blue-90)] transition hover:bg-[var(--bocar-bg)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                    <path d="M9 2.5L5 7L9 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={[
                      'inline-flex h-8 min-w-[32px] items-center justify-center rounded-[8px] border px-2.5 text-[12px] transition',
                      page === safePage
                        ? 'border-[var(--bocar-blue-100)] bg-[var(--bocar-blue-100)] font-semibold text-white'
                        : 'border-[rgba(217,222,229,0.92)] bg-white text-[var(--bocar-blue-90)] hover:bg-[var(--bocar-bg)]',
                    ].join(' ')}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[rgba(217,222,229,0.92)] bg-white text-[var(--bocar-blue-90)] transition hover:bg-[var(--bocar-bg)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                    <path d="M5 2.5L9 7L5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            ) : null}
          </div>
        </section>

        {/* Bottom panels */}
        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          <WidgetPanel
            title="VENCIMIENTOS PROXIMOS"
            caption="RFQs que requieren un seguimiento inmediato antes del cierre."
            items={urgentDeadlines}
          />
          <WidgetPanel
            title="DESBLOQUEOS PENDIENTES"
            caption="Solicitudes de reapertura recibidas por proveedores."
            actionHref={ROUTES.PURCHASING.ADMIN_UNLOCK_REQUESTS}
            items={unlockRequests}
          />
        </section>

      </div>
    </MainLayout>
  );
}

export default AdminDashboardPage;
