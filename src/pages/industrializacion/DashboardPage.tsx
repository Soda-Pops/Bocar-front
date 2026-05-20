import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { DashboardHeader } from '@/features/analytics/components/DashboardHeader';
import { FilterSelect } from '@/features/analytics/components/Filters/FilterSelect';
import { SearchField } from '@/features/analytics/components/Filters/SearchField';
import { MonthlyRfqChart } from '@/features/analytics/components/Charts/MonthlyRfqChart';
import { DashboardMetricCard } from '@/features/analytics/components/KpiCards/DashboardMetricCard';
import {
  dashboardMetrics,
  dashboardRowsByTab,
  dashboardTabs,
  getDateOptions,
  getFilteredDashboardRows,
  monthlyRfqSeries,
} from '@/features/analytics/services/analyticsService';
import type { SortOption } from '@/features/analytics/types';
import { CreateRfqButton } from '@/features/rfq/components/RfqActions/CreateRfqButton';
import { MainLayout } from '@/layouts/MainLayout';
import { Header } from '@/layouts/components/Header';
import { ROUTES } from '@/app/config/routes';

const RFQ_TIPO_OPTIONS = ['Trimming', 'Mold'] as const;

const PAGE_SIZE = 4;

function getSortLabel(sortValue: SortOption) {
  if (sortValue === 'material') {
    return 'Material';
  }

  if (sortValue === 'creator') {
    return 'Creador';
  }

  if (sortValue === 'recent') {
    return 'Mas reciente';
  }

  return '';
}

function getNextSortOption(value: string): SortOption {
  if (value === 'Material') {
    return 'material';
  }

  if (value === 'Creador') {
    return 'creator';
  }

  if (value === 'Mas reciente') {
    return 'recent';
  }

  return '';
}

function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'borradores' | 'revision' | 'activas' | 'historicas'>(
    'borradores',
  );
  const [searchValue, setSearchValue] = useState('');
  const [sortValue, setSortValue] = useState<SortOption>('');
  const [tipoValue, setTipoValue] = useState('');
  const [dateValue, setDateValue] = useState('');

  const rows = dashboardRowsByTab[activeTab];
  const dateOptions = useMemo(() => getDateOptions(rows), [rows]);
  const filteredRows = useMemo(
    () => getFilteredDashboardRows(rows, searchValue, '', sortValue, tipoValue, dateValue),
    [rows, searchValue, sortValue, tipoValue, dateValue],
  );
  const visibleRows = filteredRows.slice(0, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const hasRows = visibleRows.length > 0;
  const handleViewRfq = (rfqId: string) => {
    navigate(ROUTES.INDUSTRIALIZATION.RFQ_DETAIL.replace(':id', rfqId));
  };

  return (
    <MainLayout
      header={<Header areaLabel="Industrializacion" />}
    >
      <div
        className="mx-auto flex w-full max-w-[1440px] flex-col px-6 pb-8 pt-8 sm:px-8 lg:px-12 lg:pb-8 lg:pt-8 xl:px-14"
        data-testid="industrialization-dashboard-main"
      >
        <DashboardHeader />

        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(405px,0.9fr)] lg:items-stretch xl:grid-cols-[minmax(0,1fr)_minmax(470px,0.96fr)]">
          <div className="grid gap-3 sm:grid-cols-2 lg:gap-3">
            {dashboardMetrics.map((metric) => (
              <DashboardMetricCard
                key={metric.key}
                isActive={metric.key === activeTab}
                metric={metric}
                onSelect={(key) => setActiveTab(key as typeof activeTab)}
              />
            ))}
          </div>

          <MonthlyRfqChart series={monthlyRfqSeries} />
        </section>

        <section className="mt-8 border-b border-[rgba(217,222,229,0.9)]">
          <nav className="flex justify-between gap-6 overflow-x-auto pb-2.5 lg:gap-7">
            {dashboardTabs.map((tab) => {
              const isActive = tab.key === activeTab;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
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
              label="Tipo"
              options={[...RFQ_TIPO_OPTIONS]}
              value={tipoValue}
              onChange={setTipoValue}
            />
            <FilterSelect
              label="Fecha"
              options={dateOptions}
              value={dateValue}
              onChange={setDateValue}
            />
            <FilterSelect
              label="Ordenar por"
              options={['Mas reciente', 'Material', 'Creador']}
              value={getSortLabel(sortValue)}
              onChange={(nextValue) => setSortValue(getNextSortOption(nextValue))}
            />
          </div>
          <CreateRfqButton />
        </div>

        <section className="mt-6 overflow-hidden rounded-[14px] border border-[var(--bocar-border)] bg-white shadow-[0_12px_28px_rgba(0,46,93,0.06)]">
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
                      <p className="mt-1 text-[13px] text-[var(--bocar-blue-70)]">{row.tipo ?? '—'}</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-9 min-w-[58px] items-center justify-center rounded-[8px] bg-[var(--bocar-blue-100)] px-4 text-[13px] font-medium text-white transition hover:bg-[#0b3b6b]"
                      onClick={() => handleViewRfq(row.id)}
                    >
                      Ver
                    </button>
                  </div>

                  <dl className="mt-4 grid gap-3 text-[13px]">
                    <div className="grid gap-1">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-30)]">
                        Status
                      </dt>
                      <dd className="m-0">{row.status ?? '—'}</dd>
                    </div>
                    <div className="grid gap-1">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-30)]">
                        Fecha
                      </dt>
                      <dd className="m-0">{row.date}</dd>
                    </div>
                    {activeTab !== 'borradores' && (
                      <div className="grid gap-1">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-30)]">
                          Creado por
                        </dt>
                        <dd className="m-0">{row.createdBy}</dd>
                      </div>
                    )}
                  </dl>
                </article>
              ))
            ) : (
              <div className="rounded-[12px] border border-dashed border-[var(--bocar-border)] bg-[var(--bocar-bg)] px-4 py-8 text-center text-[14px] text-[var(--bocar-blue-70)]">
                No hay RFQs que coincidan con los filtros actuales.
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#eef1f5]">
                  {(activeTab === 'borradores'
                    ? ['ID', 'TIPO', 'STATUS', 'FECHA', 'ACCION']
                    : ['ID', 'TIPO', 'STATUS', 'FECHA', 'CREADO POR', 'ACCION']
                  ).map((header) => (
                    <th
                      key={header}
                      className="border-b border-[var(--bocar-border)] px-5 py-4 text-left text-[13px] font-medium text-[var(--bocar-text)] lg:px-4 lg:py-4"
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
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 text-[13px] lg:px-4 lg:py-4">
                        {row.tipo ?? '—'}
                      </td>
                      <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 text-[13px] lg:px-4 lg:py-4">
                        {row.status ?? '—'}
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
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={activeTab === 'borradores' ? 5 : 6}
                      className="px-6 py-12 text-center text-[14px] text-[var(--bocar-blue-70)]"
                    >
                      No hay RFQs que coincidan con los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 px-4 py-4 text-[13px] text-[var(--bocar-blue-30)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-4 lg:py-2 lg:text-[12px]">
            <p className="m-0">
              Mostrando {visibleRows.length} de {filteredRows.length} resultados
            </p>
            <div className="flex items-center gap-4">
              <span className="text-[var(--bocar-blue-70)]">1</span>
              <span>{Math.min(2, totalPages)}</span>
              <span>...</span>
              <span aria-hidden="true">›</span>
              <span aria-hidden="true">»</span>
              <span className="sr-only">Total de paginas {totalPages}</span>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

export default DashboardPage;
