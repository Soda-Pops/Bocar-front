import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { PurchasingStatusBadge } from '@/features/purchasing/components/PurchasingStatusBadge';
import { purchasingRfqRows } from '@/features/purchasing/services/purchasingRfqService';
import { purchasingUser } from '@/features/purchasing/services/purchasingDashboardService';
import { MainLayout } from '@/layouts/MainLayout';
import { Header } from '@/layouts/components/Header';

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

function BenchmarkPage() {
  const navigate = useNavigate();
  const { rfqId } = useParams();
  const rfq = useMemo(
    () => purchasingRfqRows.find((row) => row.id === rfqId) ?? purchasingRfqRows[0],
    [rfqId],
  );

  return (
    <MainLayout header={<Header areaLabel="Compras" user={purchasingUser} />}>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-6 pb-8 pt-8 sm:px-8 lg:px-12 xl:px-14">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="m-0 text-[30px] font-semibold tracking-[-0.03em] text-[var(--bocar-text)] lg:text-[26px]">
              Benchmark RFQ
            </h1>
            <p className="m-0 mt-2 text-[14px] text-[var(--bocar-blue-70)]">
              Vista inicial para el comparativo de proveedores de {rfq.id}.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(ROUTES.PURCHASING.RFQ_LIST)}
            className="inline-flex items-center gap-2 self-start rounded-full border border-transparent px-0 py-2 text-[14px] font-semibold text-[var(--bocar-blue-100)] transition hover:text-[var(--bocar-blue-90)] focus:outline-none"
          >
            <BackArrowIcon />
            Regresar
          </button>
        </section>

        <section className="mt-5 rounded-[14px] border border-[var(--bocar-border)] bg-white p-5 shadow-[0_12px_28px_rgba(0,46,93,0.06)]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[15px] font-semibold text-[var(--bocar-blue-100)]">{rfq.id}</span>
            <PurchasingStatusBadge status={rfq.status} />
          </div>
          <h2 className="m-0 mt-4 text-[22px] font-semibold text-[var(--bocar-text)]">{rfq.project}</h2>
          <p className="m-0 mt-2 text-[14px] text-[var(--bocar-blue-70)]">
            {rfq.material} · {rfq.region} · {rfq.machineType}
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-[12px] border border-[rgba(217,222,229,0.84)] bg-[var(--bocar-bg)] p-4">
              <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
                Deadline
              </p>
              <p className="m-0 mt-2 text-[16px] font-semibold text-[var(--bocar-text)]">{rfq.deadline}</p>
            </div>
            <div className="rounded-[12px] border border-[rgba(217,222,229,0.84)] bg-[var(--bocar-bg)] p-4">
              <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
                Responsable
              </p>
              <p className="m-0 mt-2 text-[16px] font-semibold text-[var(--bocar-text)]">{rfq.owner}</p>
            </div>
            <div className="rounded-[12px] border border-[rgba(217,222,229,0.84)] bg-[var(--bocar-bg)] p-4">
              <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
                Progreso
              </p>
              <p className="m-0 mt-2 text-[16px] font-semibold text-[var(--bocar-text)]">
                {rfq.supplierProgress?.label ?? 'Sin cotizaciones'}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[12px] border border-dashed border-[var(--bocar-border)] bg-[var(--bocar-bg)] px-4 py-8 text-center">
            <p className="m-0 text-[14px] font-medium text-[var(--bocar-text)]">
              Esta vista deja listo el entry point para el comparativo; el detalle completo del benchmark sigue pendiente en el backlog.
            </p>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

export default BenchmarkPage;
