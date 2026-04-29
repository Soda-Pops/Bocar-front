import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { FilterSelect } from '@/features/analytics/components/Filters/FilterSelect';
import { SearchField } from '@/features/analytics/components/Filters/SearchField';
import {
  formatDeadlineLabel,
  getDeadlineUrgencyTone,
  purchasingPriorityMeta,
  purchasingStatusOptions,
} from '@/features/purchasing/constants';
import { PurchasingStatusBadge } from '@/features/purchasing/components/PurchasingStatusBadge';
import {
  getActionsByStatus,
  getFilteredPurchasingRfqRows,
  purchasingRfqFilterOptions,
  purchasingRfqRows,
} from '@/features/purchasing/services/purchasingRfqService';
import { purchasingUser } from '@/features/purchasing/services/purchasingDashboardService';
import type { PurchasingRfqStatus } from '@/features/purchasing/types';
import { MainLayout } from '@/layouts/MainLayout';
import { Header } from '@/layouts/components/Header';
import { ActionMenu } from '@/shared/components/ui/ActionMenu';

const PAGE_SIZE = 6;

function BackArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <path
        d="M10.5 3.5L6 8L10.5 12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path d="M6.5 8H13.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function resolveStatusParam(statusValue: string | null): PurchasingRfqStatus | '' {
  if (!statusValue) {
    return '';
  }

  const statusOption = purchasingStatusOptions.find((option) => option.value === statusValue);
  return statusOption ? statusOption.value : '';
}

function PaginationButton({
  isActive,
  onClick,
  page,
}: {
  isActive: boolean;
  onClick: () => void;
  page: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex h-9 min-w-[36px] items-center justify-center rounded-[9px] border px-3 text-[13px] transition',
        isActive
          ? 'border-[var(--bocar-blue-100)] bg-[var(--bocar-blue-100)] text-white'
          : 'border-[rgba(217,222,229,0.92)] bg-white text-[var(--bocar-blue-90)] hover:bg-[var(--bocar-bg)]',
      ].join(' ')}
    >
      {page}
    </button>
  );
}

function RfqListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState('');
  const [statusValue, setStatusValue] = useState<PurchasingRfqStatus | ''>(() =>
    resolveStatusParam(searchParams.get('status')),
  );
  const [priorityValue, setPriorityValue] = useState('');
  const [regionValue, setRegionValue] = useState('');
  const [machineTypeValue, setMachineTypeValue] = useState('');
  const [deadlineRangeValue, setDeadlineRangeValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const nextStatus = resolveStatusParam(searchParams.get('status'));
    setStatusValue((currentValue) => (currentValue === nextStatus ? currentValue : nextStatus));
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, statusValue, priorityValue, regionValue, machineTypeValue, deadlineRangeValue]);

  const filteredRows = useMemo(
    () =>
      getFilteredPurchasingRfqRows(purchasingRfqRows, {
        searchValue,
        statusValue,
        priorityValue: priorityValue as never,
        regionValue,
        machineTypeValue: machineTypeValue as never,
        deadlineRangeValue: deadlineRangeValue as never,
      }),
    [deadlineRangeValue, machineTypeValue, priorityValue, regionValue, searchValue, statusValue],
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const visibleRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasRows = visibleRows.length > 0;

  function updateStatusFilter(nextStatus: PurchasingRfqStatus | '') {
    setStatusValue(nextStatus);
    const nextParams = new URLSearchParams(searchParams);

    if (nextStatus) {
      nextParams.set('status', nextStatus);
    } else {
      nextParams.delete('status');
    }

    setSearchParams(nextParams, { replace: true });
  }

  return (
    <MainLayout header={<Header areaLabel="Compras" user={purchasingUser} />}>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-6 pb-8 pt-8 sm:px-8 lg:px-12 lg:pb-10 lg:pt-8 xl:px-14">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="m-0 text-[34px] font-semibold tracking-[-0.03em] text-[var(--bocar-text)] lg:text-[28px]">
              Lista RFQ
            </h1>
            <p className="m-0 mt-2 max-w-[760px] text-[14px] text-[var(--bocar-blue-70)]">
              Seguimiento operativo de RFQs de Compras con filtros por estado, prioridad y deadline.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(ROUTES.PURCHASING.DASHBOARD)}
            className="inline-flex items-center gap-2 self-start rounded-full border border-transparent px-0 py-2 text-[14px] font-semibold text-[var(--bocar-blue-100)] transition hover:text-[var(--bocar-blue-90)] focus:outline-none"
          >
            <BackArrowIcon />
            Regresar
          </button>
        </section>

        <section className="mt-5 rounded-[14px] border border-[var(--bocar-border)] bg-white p-4 shadow-[0_10px_24px_rgba(0,46,93,0.05)] sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[220px_repeat(5,minmax(0,1fr))]">
            <SearchField value={searchValue} onChange={setSearchValue} />
            <FilterSelect
              label="Estado"
              options={purchasingRfqFilterOptions.statuses}
              value={statusValue}
              onChange={(nextValue) => updateStatusFilter(nextValue as PurchasingRfqStatus | '')}
            />
            <FilterSelect
              label="Prioridad"
              options={purchasingRfqFilterOptions.priorities}
              value={priorityValue}
              onChange={setPriorityValue}
            />
            <FilterSelect
              label="Region"
              options={purchasingRfqFilterOptions.regions}
              value={regionValue}
              onChange={setRegionValue}
            />
            <FilterSelect
              label="Tipo de maquina"
              options={purchasingRfqFilterOptions.machineTypes}
              value={machineTypeValue}
              onChange={setMachineTypeValue}
            />
            <FilterSelect
              label="Deadline"
              options={purchasingRfqFilterOptions.deadlineRanges}
              value={deadlineRangeValue}
              onChange={setDeadlineRangeValue}
            />
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[14px] border border-[var(--bocar-border)] bg-white shadow-[0_12px_28px_rgba(0,46,93,0.06)]">
          <div className="grid gap-3 p-4 lg:hidden">
            {hasRows ? (
              visibleRows.map((row) => {
                const deadlineTone = getDeadlineUrgencyTone(row.hoursToDeadline);

                return (
                  <article
                    key={`${row.id}-mobile`}
                    className={[
                      'rounded-[12px] border px-4 py-4',
                      deadlineTone === 'critical'
                        ? 'border-[rgba(170,0,15,0.18)] bg-[rgba(170,0,15,0.04)]'
                        : deadlineTone === 'warning'
                          ? 'border-[rgba(255,242,0,0.26)] bg-[rgba(255,242,0,0.1)]'
                          : 'border-[rgba(217,222,229,0.84)] bg-white',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="m-0 text-[13px] font-semibold text-[var(--bocar-blue-100)]">{row.id}</p>
                        <p className="m-0 mt-1 text-[13px] text-[var(--bocar-text)]">{row.project}</p>
                        <p className="m-0 mt-1 text-[12px] text-[var(--bocar-blue-70)]">
                          {row.material} · {row.region}
                        </p>
                      </div>
                      <ActionMenu
                        actions={getActionsByStatus(row, purchasingUser.role).map((action) => ({
                          key: action.key,
                          label: action.label,
                          disabled: action.disabled,
                          tone: action.tone,
                          onSelect: () => {
                            if (action.href) {
                              navigate(action.href);
                            }
                          },
                        }))}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <PurchasingStatusBadge status={row.status} />
                      <span
                        className={[
                          'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                          purchasingPriorityMeta[row.priority].className,
                        ].join(' ')}
                      >
                        {row.priority}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-3 text-[12px]">
                      <div className="grid gap-1">
                        <dt className="font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
                          Deadline
                        </dt>
                        <dd className="m-0">
                          {row.deadline}
                          {deadlineTone !== 'neutral' ? (
                            <span
                              className={[
                                'ml-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                                deadlineTone === 'critical'
                                  ? 'border-[rgba(170,0,15,0.16)] bg-[rgba(170,0,15,0.08)] text-[var(--bocar-error)]'
                                  : 'border-[rgba(255,242,0,0.32)] bg-[rgba(255,242,0,0.18)] text-[var(--bocar-blue-100)]',
                              ].join(' ')}
                            >
                              {formatDeadlineLabel(row.hoursToDeadline)}
                            </span>
                          ) : null}
                        </dd>
                      </div>
                      <div className="grid gap-1">
                        <dt className="font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
                          Progreso proveedores
                        </dt>
                        <dd className="m-0 text-[var(--bocar-text)]">{row.supplierProgress?.label ?? 'Sin cotizaciones'}</dd>
                      </div>
                      <div className="grid gap-1">
                        <dt className="font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
                          Responsable
                        </dt>
                        <dd className="m-0">{row.owner}</dd>
                      </div>
                    </dl>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[12px] border border-dashed border-[var(--bocar-border)] bg-[var(--bocar-bg)] px-4 py-8 text-center">
                <p className="m-0 text-[14px] font-medium text-[var(--bocar-text)]">
                  No hay RFQs que coincidan con los filtros actuales.
                </p>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.PURCHASING.DASHBOARD)}
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-[10px] bg-[var(--bocar-blue-100)] px-4 text-[13px] font-medium text-white transition hover:bg-[#0b3b6b]"
                >
                  Ir al dashboard
                </button>
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1180px] border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#eef1f5]">
                  {['RFQ', 'MATERIAL / PROYECTO', 'REGION', 'DEADLINE', 'PROGRESO PROVEEDORES', 'ESTADO', 'RESPONSABLE', 'ACCIONES'].map((header) => (
                    <th
                      key={header}
                      className="border-b border-[var(--bocar-border)] px-5 py-4 text-left text-[12px] font-semibold text-[var(--bocar-text)]"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hasRows ? (
                  visibleRows.map((row) => {
                    const deadlineTone = getDeadlineUrgencyTone(row.hoursToDeadline);

                    return (
                      <tr key={row.id} className="transition hover:bg-[rgba(245,247,250,0.82)]">
                        <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 align-top text-[13px] font-semibold text-[var(--bocar-blue-100)]">
                          {row.id}
                        </td>
                        <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 align-top">
                          <p className="m-0 text-[13px] font-medium text-[var(--bocar-text)]">{row.project}</p>
                          <p className="m-0 mt-1 text-[12px] text-[var(--bocar-blue-70)]">{row.material}</p>
                        </td>
                        <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 align-top text-[13px] text-[var(--bocar-text)]">
                          {row.region}
                          <p className="m-0 mt-1 text-[12px] text-[var(--bocar-blue-70)]">{row.machineType}</p>
                        </td>
                        <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 align-top">
                          <div className="flex flex-col gap-2">
                            <span className="text-[13px] text-[var(--bocar-text)]">{row.deadline}</span>
                            {deadlineTone !== 'neutral' ? (
                              <span
                                className={[
                                  'inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                                  deadlineTone === 'critical'
                                    ? 'border-[rgba(170,0,15,0.16)] bg-[rgba(170,0,15,0.08)] text-[var(--bocar-error)]'
                                    : 'border-[rgba(255,242,0,0.32)] bg-[rgba(255,242,0,0.18)] text-[var(--bocar-blue-100)]',
                                ].join(' ')}
                              >
                                {formatDeadlineLabel(row.hoursToDeadline)}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 align-top text-[13px] text-[var(--bocar-text)]">
                          {row.supplierProgress?.label ?? 'Sin cotizaciones'}
                        </td>
                        <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 align-top">
                          <div className="flex flex-col items-start gap-2">
                            <PurchasingStatusBadge status={row.status} />
                            <span
                              className={[
                                'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                                purchasingPriorityMeta[row.priority].className,
                              ].join(' ')}
                            >
                              {row.priority}
                            </span>
                          </div>
                        </td>
                        <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 align-top text-[13px] text-[var(--bocar-text)]">
                          {row.owner}
                        </td>
                        <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 align-top">
                          <ActionMenu
                            actions={getActionsByStatus(row, purchasingUser.role).map((action) => ({
                              key: action.key,
                              label: action.label,
                              disabled: action.disabled,
                              tone: action.tone,
                              onSelect: () => {
                                if (action.href) {
                                  navigate(action.href);
                                }
                              },
                            }))}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <p className="m-0 text-[14px] font-medium text-[var(--bocar-text)]">
                        No hay RFQs que coincidan con los filtros actuales.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate(ROUTES.PURCHASING.DASHBOARD)}
                        className="mt-4 inline-flex h-10 items-center justify-center rounded-[10px] bg-[var(--bocar-blue-100)] px-4 text-[13px] font-medium text-white transition hover:bg-[#0b3b6b]"
                      >
                        Ir al dashboard
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 px-4 py-4 text-[13px] text-[var(--bocar-blue-70)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="m-0">
              Mostrando {visibleRows.length} de {filteredRows.length} RFQs
            </p>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <PaginationButton
                  key={page}
                  page={page}
                  isActive={page === safePage}
                  onClick={() => setCurrentPage(page)}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

export default RfqListPage;
