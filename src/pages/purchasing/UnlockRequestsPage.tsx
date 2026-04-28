import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import {
  purchasingUser,
  unlockRequests,
} from '@/features/purchasing/services/purchasingDashboardService';
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

function UnlockRequestsPage() {
  const navigate = useNavigate();

  return (
    <MainLayout header={<Header areaLabel="Compras Admin" user={purchasingUser} />}>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-6 pb-8 pt-8 sm:px-8 lg:px-12 xl:px-14">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="m-0 text-[30px] font-semibold tracking-[-0.03em] text-[var(--bocar-text)] lg:text-[26px]">
              Desbloqueos pendientes
            </h1>
            <p className="m-0 mt-2 text-[14px] text-[var(--bocar-blue-70)]">
              Solicitudes de proveedores para reabrir cotizaciones enviadas.
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

        <section className="mt-5 overflow-hidden rounded-[14px] border border-[var(--bocar-border)] bg-white shadow-[0_12px_28px_rgba(0,46,93,0.06)]">
          <div className="grid gap-3 p-4">
            {unlockRequests.map((request) => (
              <article
                key={request.id}
                className="rounded-[12px] border border-[rgba(217,222,229,0.84)] bg-white px-4 py-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="m-0 text-[13px] font-semibold text-[var(--bocar-blue-100)]">{request.title}</p>
                    <p className="m-0 mt-1 text-[14px] text-[var(--bocar-text)]">{request.subtitle}</p>
                    <p className="m-0 mt-2 text-[13px] text-[var(--bocar-blue-70)]">{request.meta}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.PURCHASING.RFQ_LIST)}
                    className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[var(--bocar-blue-100)] px-4 text-[13px] font-medium text-white transition hover:bg-[#0b3b6b]"
                  >
                    Revisar RFQ
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

export default UnlockRequestsPage;
