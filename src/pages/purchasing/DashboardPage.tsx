import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { MonthlyRfqChart } from '@/features/analytics/components/Charts/MonthlyRfqChart';
import { DashboardMetricCard } from '@/features/analytics/components/KpiCards/DashboardMetricCard';
import {
  formatDeadlineLabel,
  getDeadlineUrgencyTone,
  purchasingPriorityMeta,
} from '@/features/purchasing/constants';
import {
  getDashboardCardStatusClass,
  purchasingMetrics,
  purchasingMonthlySeries,
  purchasingQueueRows,
  purchasingUser,
  unlockRequests,
  urgentDeadlines,
} from '@/features/purchasing/services/purchasingDashboardService';
import { MainLayout } from '@/layouts/MainLayout';
import { Header } from '@/layouts/components/Header';

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

function QueueActionButton({ rfqId }: { rfqId: string }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(ROUTES.PURCHASING.RFQ_ASSIGN_SUPPLIERS.replace(':id', rfqId))}
      className="inline-flex h-9 items-center justify-center rounded-[9px] bg-[var(--bocar-blue-100)] px-4 text-[13px] font-medium text-white transition hover:bg-[#0b3b6b] focus:outline-none focus:shadow-[0_0_0_3px_rgba(0,46,93,0.14)]"
    >
      Asignar
    </button>
  );
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
          <h2 className="m-0 text-[15px] font-semibold text-[var(--bocar-text)]">{title}</h2>
          <p className="m-0 mt-1 text-[12px] text-[var(--bocar-blue-70)]">{caption}</p>
        </div>
        {actionHref ? (
          <button
            type="button"
            onClick={() => navigate(actionHref)}
            className="inline-flex h-9 items-center gap-2 rounded-[9px] border border-[rgba(217,222,229,0.92)] bg-white px-3 text-[12px] font-medium text-[var(--bocar-blue-100)] transition hover:bg-[var(--bocar-bg)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)]"
          >
            Ver todo
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
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.href)}
              className={[
                'flex w-full flex-col items-start gap-3 rounded-[12px] border px-4 py-4 text-left transition hover:border-[var(--bocar-blue-30)] hover:bg-[var(--bocar-bg)]',
                typeof item.hoursToDeadline === 'number'
                  ? getDashboardCardStatusClass(item.hoursToDeadline)
                  : 'border-[rgba(217,222,229,0.84)] bg-white',
              ].join(' ')}
            >
              <div className="flex w-full items-start justify-between gap-4">
                <div>
                  <p className="m-0 text-[13px] font-semibold text-[var(--bocar-blue-100)]">{item.title}</p>
                  <p className="m-0 mt-1 text-[13px] text-[var(--bocar-text)]">{item.subtitle}</p>
                </div>
                {typeof item.hoursToDeadline === 'number' ? (
                  <span
                    className={[
                      'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold',
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

              <div className="flex w-full items-center justify-between gap-3">
                <p className="m-0 text-[12px] text-[var(--bocar-blue-70)]">{item.meta}</p>
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--bocar-blue-100)]">
                  {item.actionLabel}
                  <ArrowRightIcon />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DashboardPage() {
  const navigate = useNavigate();

  return (
    <MainLayout header={<Header areaLabel="Compras" user={purchasingUser} />}>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-6 pb-8 pt-8 sm:px-8 lg:px-12 lg:pb-10 lg:pt-8 xl:px-14">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="m-0 text-[34px] font-semibold tracking-[-0.03em] text-[var(--bocar-text)] lg:text-[28px]">
              Dashboard
            </h1>
            <p className="m-0 mt-2 max-w-[720px] text-[14px] text-[var(--bocar-blue-70)]">
              Cola operativa y prioridades de asignacion para el equipo de Compras.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(ROUTES.PURCHASING.RFQ_LIST)}
            className="inline-flex h-11 items-center gap-2 self-start rounded-[10px] border border-[var(--bocar-blue-100)] bg-white px-4 text-[13px] font-medium text-[var(--bocar-blue-100)] transition hover:bg-[var(--bocar-bg)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)]"
          >
            Ver lista RFQ
            <ArrowRightIcon />
          </button>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.92fr)]">
          <div className="grid gap-3 sm:grid-cols-2">
            {purchasingMetrics.map((metric) => (
              <DashboardMetricCard
                key={metric.key}
                isActive={metric.key === 'pending'}
                metric={metric}
                onSelect={() => {
                  navigate(`${ROUTES.PURCHASING.RFQ_LIST}?status=${metric.status}`);
                }}
              />
            ))}
          </div>

          <MonthlyRfqChart series={purchasingMonthlySeries} />
        </section>

        <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_360px]">
          <div className="overflow-hidden rounded-[14px] border border-[var(--bocar-border)] bg-white shadow-[0_12px_28px_rgba(0,46,93,0.06)]">
            <div className="flex flex-col gap-3 border-b border-[rgba(217,222,229,0.84)] px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="m-0 text-[18px] font-semibold text-[var(--bocar-text)]">
                  RFQs por asignar
                </h2>
                <p className="m-0 mt-1 text-[13px] text-[var(--bocar-blue-70)]">
                  Bandeja operativa con foco en deadlines y cobertura de proveedores.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`${ROUTES.PURCHASING.RFQ_LIST}?status=PENDING`)}
                className="inline-flex h-9 items-center gap-2 self-start rounded-[9px] border border-[rgba(217,222,229,0.92)] bg-white px-3 text-[12px] font-medium text-[var(--bocar-blue-100)] transition hover:bg-[var(--bocar-bg)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)]"
              >
                Abrir lista
                <ArrowRightIcon />
              </button>
            </div>

            <div className="grid gap-3 p-4 lg:hidden">
              {purchasingQueueRows.map((row) => {
                const deadlineTone = getDeadlineUrgencyTone(row.hoursToDeadline);
                const priorityClass = purchasingPriorityMeta[row.priority].className;

                return (
                  <article
                    key={`${row.id}-mobile`}
                    className={[
                      'rounded-[12px] border px-4 py-4',
                      getDashboardCardStatusClass(row.hoursToDeadline),
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="m-0 text-[13px] font-semibold text-[var(--bocar-blue-100)]">{row.id}</p>
                        <p className="m-0 mt-1 text-[13px] text-[var(--bocar-text)]">{row.project}</p>
                        <p className="m-0 mt-1 text-[12px] text-[var(--bocar-blue-70)]">{row.material}</p>
                      </div>
                      <span
                        className={[
                          'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                          deadlineTone === 'critical'
                            ? 'border-[rgba(170,0,15,0.16)] bg-[rgba(170,0,15,0.08)] text-[var(--bocar-error)]'
                            : deadlineTone === 'warning'
                              ? 'border-[rgba(255,242,0,0.32)] bg-[rgba(255,242,0,0.18)] text-[var(--bocar-blue-100)]'
                              : 'border-[rgba(217,222,229,0.9)] bg-[var(--bocar-bg)] text-[var(--bocar-blue-90)]',
                        ].join(' ')}
                      >
                        {formatDeadlineLabel(row.hoursToDeadline)}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-3 text-[12px]">
                      <div className="grid gap-1">
                        <dt className="font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
                          Proveedor sugerido
                        </dt>
                        <dd className="m-0">{row.supplierSuggestion}</dd>
                      </div>
                      <div className="grid gap-1">
                        <dt className="font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
                          Responsable
                        </dt>
                        <dd className="m-0">{row.owner}</dd>
                      </div>
                    </dl>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span
                        className={[
                          'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                          priorityClass,
                        ].join(' ')}
                      >
                        {row.priority}
                      </span>
                      <QueueActionButton rfqId={row.id} />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#eef1f5]">
                    {['RFQ', 'MATERIAL / PROYECTO', 'PROVEEDOR SUGERIDO', 'DEADLINE', 'RESPONSABLE', 'ACCION'].map((header) => (
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
                  {purchasingQueueRows.map((row) => {
                    const deadlineTone = getDeadlineUrgencyTone(row.hoursToDeadline);

                    return (
                      <tr key={row.id} className="transition hover:bg-[rgba(245,247,250,0.8)]">
                        <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 align-top text-[13px] font-semibold text-[var(--bocar-blue-100)]">
                          {row.id}
                        </td>
                        <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 align-top">
                          <p className="m-0 text-[13px] font-medium text-[var(--bocar-text)]">{row.project}</p>
                          <p className="m-0 mt-1 text-[12px] text-[var(--bocar-blue-70)]">{row.material}</p>
                        </td>
                        <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 align-top text-[13px] text-[var(--bocar-text)]">
                          <p className="m-0">{row.supplierSuggestion}</p>
                          <p className="m-0 mt-1 text-[12px] text-[var(--bocar-blue-70)]">{row.region}</p>
                        </td>
                        <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 align-top">
                          <div className="flex flex-col gap-2">
                            <span className="text-[13px] text-[var(--bocar-text)]">{row.deadline}</span>
                            <span
                              className={[
                                'inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                                deadlineTone === 'critical'
                                  ? 'border-[rgba(170,0,15,0.16)] bg-[rgba(170,0,15,0.08)] text-[var(--bocar-error)]'
                                  : deadlineTone === 'warning'
                                    ? 'border-[rgba(255,242,0,0.32)] bg-[rgba(255,242,0,0.18)] text-[var(--bocar-blue-100)]'
                                    : 'border-[rgba(217,222,229,0.9)] bg-[var(--bocar-bg)] text-[var(--bocar-blue-90)]',
                              ].join(' ')}
                            >
                              {formatDeadlineLabel(row.hoursToDeadline)}
                            </span>
                          </div>
                        </td>
                        <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 align-top">
                          <p className="m-0 text-[13px] text-[var(--bocar-text)]">{row.owner}</p>
                          <span
                            className={[
                              'mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                              purchasingPriorityMeta[row.priority].className,
                            ].join(' ')}
                          >
                            Prioridad {row.priority}
                          </span>
                        </td>
                        <td className="border-b border-[rgba(217,222,229,0.72)] px-5 py-4 align-top">
                          <QueueActionButton rfqId={row.id} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4">
            <WidgetPanel
              title="Vencimientos proximos"
              caption="RFQs que requieren seguimiento inmediato antes del cierre."
              items={urgentDeadlines}
            />

            {purchasingUser.role === 'compras_admin' ? (
              <WidgetPanel
                title="Desbloqueos pendientes"
                caption="Solicitudes de reapertura recibidas por proveedores."
                items={unlockRequests}
                actionHref={ROUTES.PURCHASING.ADMIN_UNLOCK_REQUESTS}
              />
            ) : null}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

export default DashboardPage;
