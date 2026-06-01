import { useRef, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { RfqActionBar } from '@/features/rfq/components/RfqDetail/RfqActionBar';
import { RfqStatusBanner } from '@/features/rfq/components/RfqDetail/RfqStatusBanner';
import { RfqStatusHeader } from '@/features/rfq/components/RfqDetail/RfqStatusHeader';
import { SupplierAssignmentPanel } from '@/features/rfq/components/RfqDetail/SupplierAssignmentPanel';
import { useRfqDetail } from '@/features/rfq/hooks/useRfqDetail';
import type { RfqActionKey, UserRole } from '@/features/rfq/state/rfqStateMachine';

type RfqDetailWorkspaceProps = {
  backHref?: string;
  mode?: 'readonly' | 'assign';
  referenceId?: string;
};

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

function DocumentIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
      <path d="M4.75 2.5h4.1l2.4 2.45v8.55h-6.5v-11Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M8.75 2.75V5.2h2.35" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.25" />
    </svg>
  );
}

function getScoreToneClass(tone: 'success' | 'warning' | 'danger') {
  if (tone === 'success') return 'bg-[var(--bocar-done)]';
  if (tone === 'warning') return 'bg-[var(--bocar-review)]';
  return 'bg-[var(--bocar-error)]';
}

function resolveDefaultRole(pathname: string): UserRole {
  if (pathname.startsWith('/compras')) return 'compras_admin';
  if (pathname.startsWith('/proveedor')) return 'proveedor';
  return 'industrializacion';
}

export function RfqDetailWorkspace({
  backHref = '/industrializacion/dashboard',
  mode = 'readonly',
  referenceId = 'RFQ-004',
}: RfqDetailWorkspaceProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [showAssignment, setShowAssignment] = useState(false);
  const assignmentRef = useRef<HTMLDivElement>(null);

  const defaultRole = resolveDefaultRole(pathname);
  const defaultIsCreator = defaultRole === 'industrializacion';

  const { rfq, allowedActions, statusMeta, banner, isAccessible, role } = useRfqDetail(
    referenceId,
    defaultRole,
    defaultIsCreator,
  );

  if (!isAccessible) {
    return (
      <Navigate
        to={backHref}
        replace
        state={{ toast: 'This RFQ is not available for your role or access profile.' }}
      />
    );
  }

  function handleAction(key: RfqActionKey) {
    const rfqId = rfq.id;
    switch (key) {
      case 'view_full_detail':
        navigate(ROUTES.PURCHASING.RFQ_DETAIL_FULL.replace(':id', rfqId));
        break;
      case 'assign_suppliers':
        // Reveal the supplier assignment section inline and focus it.
        setShowAssignment(true);
        window.requestAnimationFrame(() =>
          assignmentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        );
        break;
      case 'view_benchmark':
        navigate(ROUTES.PURCHASING.BENCHMARK.replace(':rfqId', rfqId));
        break;
      case 'edit_draft':
        navigate(`/industrializacion/rfq/${rfqId}/editar`);
        break;
      default:
        console.log('[RfqDetail] action triggered:', key, rfqId);
    }
  }

  const assignmentSuppliers =
    rfq.suppliers.length > 0
      ? rfq.suppliers
      : ([
          { name: 'PLASTIMEX', category: 'Plastic Injection', contact: 'Laura Gomez', score: '92', scoreTone: 'success', status: 'Available' },
          { name: 'RAMCO', category: 'Metal Machining', contact: 'Juan Perez', score: '100', scoreTone: 'success', status: 'Available' },
          { name: 'HERTOLAB', category: 'Components', contact: 'Sofia Ruiz', score: '72', scoreTone: 'warning', status: 'Available' },
        ] as typeof rfq.suppliers);

  // ─── ASSIGN MODE (SupplierSelectionPage) ──────────────────────────────────
  if (mode === 'assign') {
    return (
      <div className="mx-auto flex w-full max-w-[1304px] flex-col px-6 pb-10 pt-6 sm:px-8 lg:px-8 lg:pt-7 xl:px-0">
        <div className="flex items-center justify-between gap-4">
          <h1 className="m-0 text-[24px] font-semibold tracking-[0.02em] text-[var(--bocar-text)] lg:text-[22px]">
            SUPPLIER SELECTION
          </h1>
          <a
            className="inline-flex items-center gap-2 self-start rounded-full border border-transparent px-0 py-2 text-[14px] font-semibold text-[var(--bocar-blue-100)] no-underline transition hover:text-[var(--bocar-blue-90)]"
            href={backHref}
          >
            <BackArrowIcon />
            Back
          </a>
        </div>

        <section className="mt-6 overflow-hidden rounded-[6px] border border-[var(--bocar-border)] bg-white">
          {/* RFQ summary (assign mode) */}
          <div className="border-b border-[rgba(217,222,229,0.88)] px-7 py-4 lg:px-12">
            <h2 className="m-0 text-[15px] font-semibold text-[var(--bocar-text)]">RFQ Summary</h2>
          </div>
          <div className="px-7 py-8 lg:px-12">
            <div className="grid min-h-[86px] items-center gap-6 bg-[var(--bocar-bg)] px-8 py-4 md:grid-cols-[1fr_auto_1fr_1.2fr] lg:px-12">
              <div className="grid grid-cols-[94px_minmax(0,1fr)] gap-3 text-[12px] leading-[1.35]">
                <div className="text-right font-semibold uppercase text-[var(--bocar-blue-30)]">
                  <p className="m-0">ID</p>
                  <p className="m-0">Created By</p>
                  <p className="m-0">Material</p>
                </div>
                <div className="font-medium text-[var(--bocar-text)]">
                  <p className="m-0">{rfq.id.toUpperCase()}</p>
                  <p className="m-0">{rfq.createdBy}</p>
                  <p className="m-0">{rfq.material}</p>
                </div>
              </div>
              <span className="hidden h-14 w-px bg-[var(--bocar-blue-70)] md:block" />
              <div className="grid grid-cols-[132px_minmax(0,1fr)] gap-3 text-[12px] leading-[1.35]">
                <div className="text-right font-semibold uppercase text-[var(--bocar-blue-30)]">
                  <p className="m-0">Description</p>
                  <p className="m-0">Created At</p>
                  <p className="m-0">Status</p>
                </div>
                <div className="font-medium text-[var(--bocar-text)]">
                  <p className="m-0">{rfq.title}</p>
                  <p className="m-0">{rfq.createdAt}</p>
                  <span className="mt-1 inline-flex rounded-[4px] bg-[var(--bocar-done)] px-4 py-1 text-[10px] font-semibold text-[var(--bocar-text)]">
                    {statusMeta.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="border-t border-[rgba(217,222,229,0.58)] px-7 py-6 lg:px-12">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="m-0 text-[16px] font-semibold text-[var(--bocar-text)]">RFQ Specifications</h2>
              <span className="rounded-[4px] bg-[var(--bocar-bg)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
                Readonly
              </span>
            </div>
            <dl className="mt-4 grid gap-px overflow-hidden rounded-[6px] border border-[var(--bocar-border)] bg-[var(--bocar-border)] sm:grid-cols-2 lg:grid-cols-4">
              {rfq.specs.map((field) => (
                <div key={field.code} className="flex min-h-[96px] flex-col justify-between gap-3 bg-white px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-[4px] bg-[var(--bocar-blue-100)] px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                      {field.code}
                    </span>
                    <dt className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">{field.label}</dt>
                  </div>
                  <dd className="m-0 text-[15px] font-semibold leading-[1.25] text-[var(--bocar-text)]">{field.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Files */}
          <div className="border-t border-[rgba(217,222,229,0.58)] px-7 py-6 lg:px-12">
            <h2 className="m-0 text-[16px] font-semibold text-[var(--bocar-text)]">Uploaded Files</h2>
            <div className="mt-3 grid gap-3">
              {rfq.files.map((file) => (
                <div key={file.name} className="flex min-h-10 items-center justify-between rounded-[8px] bg-[var(--bocar-blue-100)] px-6 text-white">
                  <div className="flex min-w-0 items-center gap-3">
                    <DocumentIcon />
                    <span className="truncate text-[13px] font-medium">{file.name}</span>
                  </div>
                  <button className="rounded-[4px] px-2 py-1 text-[12px] font-semibold uppercase text-white transition hover:bg-white/10 focus:outline-none" type="button">
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Supplier assignment panel */}
          <SupplierAssignmentPanel suppliers={rfq.suppliers.length > 0 ? rfq.suppliers : [
            { name: 'PLASTIMEX', category: 'Plastic Injection', contact: 'Laura Gomez', score: '92', scoreTone: 'success', status: 'Available' },
            { name: 'RAMCO', category: 'Metal Machining', contact: 'Juan Perez', score: '100', scoreTone: 'success', status: 'Available' },
            { name: 'HERTOLAB', category: 'Components', contact: 'Sofia Ruiz', score: '72', scoreTone: 'warning', status: 'Available' },
          ]} backHref={backHref} />
        </section>
      </div>
    );
  }

  // ─── READONLY MODE (RfqDetailPage) ────────────────────────────────────────
  const showSuppliers =
    rfq.suppliers.length > 0 && rfq.status !== 'PENDING' && rfq.status !== 'PENDING_EDIT_REQUEST';
  const showBenchmark =
    (rfq.status === 'BENCHMARK_READY' || rfq.status === 'CLOSED') && rfq.benchmark.length > 0;
  const isSuperUser = role === 'industrializacion_admin' || role === 'compras_admin';

  return (
    <div className="mx-auto flex w-full max-w-[1304px] flex-col px-6 pb-10 pt-6 sm:px-8 lg:pt-8 xl:px-0">
      {/* Back link — outside the white card */}
      <div className="mb-4 flex justify-end">
        <a
          href={backHref}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--bocar-blue-100)] no-underline transition hover:text-[var(--bocar-blue-70)] focus:outline-none"
        >
          <BackArrowIcon />
          Back
        </a>
      </div>

      {/* Single unified card — all sections share the same white surface */}
      <section className="rounded-[6px] border border-[var(--bocar-border)] bg-white">

        {/* Header: title, badge, meta */}
        <RfqStatusHeader rfq={rfq} status={rfq.status} statusMeta={statusMeta} />

        {/* Contextual banner */}
        {banner ? (
          <div className="border-t border-[rgba(217,222,229,0.48)] px-7 py-4 lg:px-12">
            <RfqStatusBanner config={banner} />
          </div>
        ) : null}

        {/* Action bar */}
        {allowedActions.length > 0 ? (
          <div className="border-t border-[rgba(217,222,229,0.48)] px-7 py-4 lg:px-12">
            <RfqActionBar actions={allowedActions} onAction={handleAction} />
          </div>
        ) : null}

        {/* Specs */}
        <div className="border-t border-[rgba(217,222,229,0.88)] px-7 py-6 lg:px-12">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="m-0 text-[15px] font-semibold text-[var(--bocar-text)]">Specifications</h2>
            <span className="rounded-[4px] bg-[var(--bocar-bg)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
              Read only
            </span>
          </div>
          <dl className="mt-4 grid gap-px overflow-hidden rounded-[6px] border border-[var(--bocar-border)] bg-[var(--bocar-border)] sm:grid-cols-2 lg:grid-cols-4">
            {rfq.specs.map((field) => (
              <div key={field.code} className="flex min-h-[96px] flex-col justify-between gap-3 bg-white px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-[4px] bg-[var(--bocar-blue-100)] px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                    {field.code}
                  </span>
                  <dt className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">{field.label}</dt>
                </div>
                <dd className="m-0 text-[15px] font-semibold leading-[1.25] text-[var(--bocar-text)]">{field.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Files */}
        <div className="border-t border-[rgba(217,222,229,0.88)] px-7 py-6 lg:px-12">
          <h2 className="m-0 text-[15px] font-semibold text-[var(--bocar-text)]">Uploaded Files</h2>
          <div className="mt-4 grid gap-3">
            {rfq.files.map((file) => (
              <div key={file.name} className="flex min-h-10 items-center justify-between rounded-[8px] bg-[var(--bocar-blue-100)] px-6 text-white">
                <div className="flex min-w-0 items-center gap-3">
                  <DocumentIcon />
                  <span className="truncate text-[13px] font-medium">{file.name}</span>
                </div>
                <button className="rounded-[4px] px-2 py-1 text-[12px] font-semibold uppercase text-white transition hover:bg-white/10 focus:outline-none" type="button">
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Inline supplier assignment (revealed from the action menu) */}
        {showAssignment ? (
          <div
            ref={assignmentRef}
            className="scroll-mt-6 border-t border-[rgba(217,222,229,0.88)] px-7 py-6 lg:px-12"
          >
            <h2 className="m-0 mb-4 text-[15px] font-semibold text-[var(--bocar-text)]">
              Supplier Assignment
            </h2>
            <SupplierAssignmentPanel suppliers={assignmentSuppliers} backHref={backHref} />
          </div>
        ) : null}

        {/* Suppliers readonly */}
        {showSuppliers && !showAssignment ? (
          <div className="border-t border-[rgba(217,222,229,0.88)] px-7 py-6 lg:px-12">
            <h2 className="m-0 text-[15px] font-semibold text-[var(--bocar-text)]">Selected Suppliers</h2>
            {/* Mobile */}
            <div className="mt-4 grid gap-3 sm:hidden">
              {rfq.suppliers.map((s) => (
                <article key={`${s.name}-mob`} className="rounded-[6px] border border-[var(--bocar-border)] bg-[var(--bocar-bg)] px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="m-0 text-[12px] font-semibold text-[var(--bocar-text)]">{s.name}</p>
                      <p className="mt-1 text-[12px] text-[var(--bocar-blue-70)]">{s.category}</p>
                      <p className="mt-3 text-[12px] text-[var(--bocar-text)]">Contact: {s.contact}</p>
                    </div>
                    <span className="rounded-[4px] bg-[var(--bocar-neutral)] px-2 py-1 text-[10px] font-medium text-[var(--bocar-text)]">
                      {s.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
            {/* Desktop */}
            <div className="mt-4 hidden overflow-x-auto sm:block">
              <table className="w-full max-w-[1040px] border-separate border-spacing-0 overflow-hidden rounded-[6px] border border-[var(--bocar-border)] text-left">
                <thead>
                  <tr className="bg-[var(--bocar-bg)]">
                    {['Supplier', 'Category', 'Contact', 'Status'].map((h) => (
                      <th key={h} className="px-6 py-3 text-[12px] font-semibold text-[var(--bocar-text)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rfq.suppliers.map((s) => (
                    <tr key={s.name} className="border-t border-[rgba(217,222,229,0.72)]">
                      <td className="px-6 py-3.5 text-[12px] font-medium text-[var(--bocar-text)]">{s.name}</td>
                      <td className="px-6 py-3.5 text-[12px] text-[var(--bocar-text)]">{s.category}</td>
                      <td className="px-6 py-3.5 text-[12px] text-[var(--bocar-text)]">{s.contact}</td>
                      <td className="px-6 py-3.5">
                        <span className="rounded-[4px] bg-[var(--bocar-neutral)] px-2 py-1 text-[10px] font-medium text-[var(--bocar-text)]">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Benchmark */}
        {showBenchmark ? (
          <div className="border-t border-[rgba(217,222,229,0.88)] px-7 py-6 lg:px-12">
            <h2 className="m-0 text-[15px] font-semibold text-[var(--bocar-text)]">Supplier Benchmark</h2>
            {/* Mobile */}
            <div className="mt-4 grid gap-3 sm:hidden">
              {rfq.benchmark.map((row) => (
                <article key={`${row.supplier}-bmob`} className="rounded-[6px] border border-[var(--bocar-border)] bg-[var(--bocar-bg)] px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="m-0 text-[12px] font-semibold text-[var(--bocar-text)]">{row.supplier}</p>
                      <p className="mt-1 text-[12px] text-[var(--bocar-blue-70)]">
                        {row.price} · {row.time} · Quality {row.quality}
                      </p>
                    </div>
                    <div className="flex min-w-[82px] items-center justify-end gap-2">
                      <span className={['h-1 w-10 rounded-full', getScoreToneClass(row.scoreTone)].join(' ')} />
                      <span className="text-[12px] font-medium text-[var(--bocar-text)]">{row.score}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {/* Desktop */}
            <div className="mt-4 hidden overflow-x-auto sm:block">
              <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-[6px] border border-[var(--bocar-border)] text-left">
                <thead>
                  <tr className="bg-[var(--bocar-bg)]">
                    {['Supplier', 'Price', 'Lead Time', 'Quality', 'Score'].map((h) => (
                      <th key={h} className="px-6 py-3 text-[12px] font-semibold text-[var(--bocar-text)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rfq.benchmark.map((row) => (
                    <tr key={row.supplier} className="border-t border-[rgba(217,222,229,0.72)]">
                      <td className="px-6 py-3.5 text-[12px] font-medium text-[var(--bocar-text)]">{row.supplier}</td>
                      <td className="px-6 py-3.5 text-[12px] text-[var(--bocar-text)]">{row.price}</td>
                      <td className="px-6 py-3.5 text-[12px] text-[var(--bocar-text)]">{row.time}</td>
                      <td className="px-6 py-3.5 text-[12px] text-[var(--bocar-text)]">{row.quality}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex min-w-[110px] items-center gap-5">
                          <span className={['h-1 w-[72px] rounded-full', getScoreToneClass(row.scoreTone)].join(' ')} />
                          <span className="text-[12px] font-medium text-[var(--bocar-text)]">{row.score}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Cancellation detail — super users only, CANCELLED state */}
        {rfq.status === 'CANCELLED' && rfq.cancellation && isSuperUser ? (
          <div className="border-t border-[rgba(170,0,15,0.2)] bg-[rgba(170,0,15,0.05)] px-7 py-5 lg:px-12">
            <h2 className="m-0 text-[14px] font-semibold uppercase tracking-[0.06em] text-[var(--bocar-error)]">
              Cancellation Reason
            </h2>
            <p className="m-0 mt-2 text-[13px] leading-[1.6] text-[var(--bocar-text)]">
              {rfq.cancellation.reason}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-[12px] text-[var(--bocar-blue-70)]">
              <span>
                <span className="font-semibold text-[var(--bocar-blue-50)] uppercase tracking-[0.06em] mr-1.5">Cancelled by</span>
                {rfq.cancellation.cancelledBy}
              </span>
              <span>
                <span className="font-semibold text-[var(--bocar-blue-50)] uppercase tracking-[0.06em] mr-1.5">Date</span>
                {rfq.cancellation.cancelledAt}
              </span>
              {rfq.cancellation.replacementRfqId ? (
                <span>
                  <span className="font-semibold text-[var(--bocar-blue-50)] uppercase tracking-[0.06em] mr-1.5">Replacement RFQ</span>
                  {rfq.cancellation.replacementRfqId}
                </span>
              ) : null}
              <span className="inline-flex items-center rounded-[4px] border border-[rgba(170,0,15,0.24)] bg-[rgba(170,0,15,0.08)] px-2 py-0.5 text-[10px] font-semibold text-[var(--bocar-error)]">
                {rfq.cancellation.isLateCancellation ? 'Late cancellation (special protocol)' : 'Early cancellation'}
              </span>
            </div>
          </div>
        ) : null}

      </section>
    </div>
  );
}
