import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { extractApiError } from '@/shared/utils/extractApiError';

import { ROUTES } from '@/app/config/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { AppRole } from '@/features/auth/types';
import type { RfqTipo } from '@/features/analytics/types';
import { RfqActionBar } from '@/features/rfq/components/RfqDetail/RfqActionBar';
import { RfqStatusBanner } from '@/features/rfq/components/RfqDetail/RfqStatusBanner';
import { RfqStatusHeader } from '@/features/rfq/components/RfqDetail/RfqStatusHeader';
import { SupplierAssignmentPanel } from '@/features/rfq/components/RfqDetail/SupplierAssignmentPanel';
import { AiCostPredictionPanel } from '@/features/rfq/components/RfqDetail/AiCostPredictionPanel';
import { EditRequestModal } from '@/features/rfq/components/RfqDetail/EditRequestModal';
import { ConfirmEditModal } from '@/features/rfq/components/RfqDetail/ConfirmEditModal';
import { RfqEditRequestsPanel } from '@/features/rfq/components/RfqDetail/RfqEditRequestsPanel';
import { useRfqDetail } from '@/features/rfq/hooks/useRfqDetail';
import { useAiPrediction } from '@/features/rfq/hooks/useAiPrediction';
import { useAssignSuppliers } from '@/features/purchasing/hooks/useAssignSuppliers';
import { useProveedores } from '@/features/purchasing/hooks/useProveedores';
import {
  closeRfq,
  deleteRfq,
  extendRfqDeadline,
  logicalDeleteRfq,
  requestEdit,
  sendRfqToCom,
  approveEditRequest,
  rejectEditRequest,
  getPendingEditRequestId,
} from '@/features/rfq/services/rfqLifecycleService';
import { CloseRfqModal } from '@/features/rfq/components/RfqDetail/CloseRfqModal';
import { ExtendDeadlineModal } from '@/features/rfq/components/RfqDetail/ExtendDeadlineModal';
import { BenchmarkComparativaChart } from '@/features/rfq/components/RfqDetail/BenchmarkComparativaChart';
import type { RfqUploadedFile } from '@/features/rfq/services/rfqDetailService';
import type { RfqActionKey, RfqBannerConfig, UserRole } from '@/features/rfq/state/rfqStateMachine';
import { parseId } from '@/shared/utils/rfqId';

type RfqDetailWorkspaceProps = {
  backHref?: string;
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

function DownloadIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16">
      <path d="M8 2.5v7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M5.25 7.25 8 10l2.75-2.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M3 12.75h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

async function downloadFile(file: RfqUploadedFile): Promise<void> {
  try {
    const response = await fetch(file.url, { credentials: 'include' });
    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(file.url, '_blank', 'noopener,noreferrer');
  }
}

function UploadedFilesList({ files }: { files: RfqUploadedFile[] }) {
  if (files.length === 0) {
    return (
      <p className="m-0 mt-3 rounded-[8px] border border-dashed border-[var(--bocar-border)] px-4 py-3 text-[13px] text-[var(--bocar-blue-50)]">
        No files uploaded.
      </p>
    );
  }

  return (
    <div className="mt-3 grid gap-3">
      {files.map((file) => (
        <div
          key={`${file.id ?? file.name}-${file.url}`}
          className="flex min-h-11 items-center justify-between gap-4 rounded-[8px] border border-transparent bg-[var(--bocar-blue-100)] px-5 py-2 text-white transition hover:border-[var(--bocar-blue-30)] hover:bg-[var(--bocar-blue-70)]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <DocumentIcon />
            <span className="truncate text-[13px] font-medium">{file.name}</span>
          </div>
          <button
            aria-label={`Download ${file.name}`}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[6px] border border-white/35 bg-white/10 px-3 text-[11px] font-semibold uppercase text-white transition hover:border-white hover:bg-white hover:text-[var(--bocar-blue-100)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bocar-blue-100)]"
            type="button"
            onClick={() => void downloadFile(file)}
          >
            <DownloadIcon />
            Download
          </button>
        </div>
      ))}
    </div>
  );
}

function getScoreToneClass(tone: 'success' | 'warning' | 'danger') {
  if (tone === 'success') return 'bg-[var(--bocar-done)]';
  if (tone === 'warning') return 'bg-[var(--bocar-review)]';
  return 'bg-[var(--bocar-error)]';
}

function resolveDefaultRole(pathname: string, fromAdmin: boolean): UserRole {
  if (pathname.startsWith('/compras')) return 'compras_admin';
  if (pathname.startsWith('/proveedor')) return 'proveedor';
  if (fromAdmin) return 'industrializacion_admin';
  return 'industrializacion';
}

function resolveSessionRole(role: AppRole, isAdmin: boolean): UserRole {
  if (role === 'industrializacion') return isAdmin ? 'industrializacion_admin' : 'industrializacion';
  if (role === 'compras') return isAdmin ? 'compras_admin' : 'compras';
  return 'proveedor';
}

function parseTipo(value: string | null): RfqTipo {
  return value === 'Trimming' || value === 'trimming' ? 'Trimming' : 'Mold';
}

export function RfqDetailWorkspace({
  backHref = '/industrializacion/dashboard',
  referenceId = 'RFQ-004',
}: RfqDetailWorkspaceProps) {
  const routerLocation = useLocation();
  const { pathname } = routerLocation;
  const isSupplierPath = pathname.startsWith('/proveedor');
  const navigate = useNavigate();
  const auth = useAuth();
  const [showAssignment, setShowAssignment] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<RfqBannerConfig | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [showEditRequestModal, setShowEditRequestModal] = useState(false);
  const [confirmEditVariant, setConfirmEditVariant] = useState<'approve' | 'reject' | null>(null);
  const [showCloseRfqModal, setShowCloseRfqModal] = useState(false);
  const [showExtendDeadlineModal, setShowExtendDeadlineModal] = useState(false);
  const assignmentRef = useRef<HTMLDivElement>(null);
  const assignSuppliers = useAssignSuppliers();
  const proveedores = useProveedores();

  const routeState = routerLocation.state as { fromAdmin?: boolean; scrollTo?: string } | null;
  const fromAdmin = routeState?.fromAdmin === true;
  const searchParams = new URLSearchParams(routerLocation.search);
  const tipo = parseTipo(searchParams.get('tipo'));
  const shouldOpenAssignment =
    routerLocation.hash === '#assign-suppliers' ||
    searchParams.get('scrollTo') === 'assign-suppliers' ||
    routeState?.scrollTo === 'assign-suppliers';
  const defaultRole =
    auth.status === 'authenticated'
      ? resolveSessionRole(auth.user.role, auth.user.isAdmin)
      : resolveDefaultRole(pathname, fromAdmin);
  const defaultIsCreator =
    defaultRole === 'industrializacion' || defaultRole === 'industrializacion_admin';

  const { rfq, allowedActions, statusMeta, banner, isAccessible, role, isLoading, error } = useRfqDetail(
    referenceId,
    defaultRole,
    defaultIsCreator,
    isSupplierPath ? 'assignment' : 'rfq',
  );
  const isPurchasingRole = role === 'compras' || role === 'compras_admin';
  const showAiPrediction =
    isPurchasingRole &&
    Boolean(rfq?.predictionInput) &&
    (rfq?.status === 'PENDING' || rfq?.status === 'QUOTING');
  const aiPrediction = useAiPrediction(rfq, showAiPrediction);
  const canAssignSuppliers = allowedActions.some(
    (action) => action.key === 'assign_suppliers' && !action.disabled,
  );
  const isAssignmentVisible = showAssignment && canAssignSuppliers;

  useEffect(() => {
    if (shouldOpenAssignment && canAssignSuppliers) {
      setShowAssignment(true);
    }
  }, [canAssignSuppliers, shouldOpenAssignment]);

  useEffect(() => {
    if (!shouldOpenAssignment || !isAssignmentVisible || isLoading || error || !rfq || !isAccessible) {
      return;
    }

    const frameId = window.requestAnimationFrame(() =>
      assignmentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );

    return () => window.cancelAnimationFrame(frameId);
  }, [error, isAccessible, isAssignmentVisible, isLoading, rfq, shouldOpenAssignment]);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[1304px] flex-col px-6 py-10 sm:px-8 xl:px-0">
        <div className="rounded-[8px] border border-[var(--bocar-border)] bg-white px-6 py-8 text-[14px] text-[var(--bocar-blue-70)]">
          Loading RFQ detail...
        </div>
      </div>
    );
  }

  if (error || !rfq || !statusMeta) {
    return (
      <div className="mx-auto flex w-full max-w-[1304px] flex-col px-6 py-10 sm:px-8 xl:px-0">
        <div className="rounded-[8px] border border-[rgba(170,0,15,0.22)] bg-[rgba(170,0,15,0.08)] px-6 py-8 text-[14px] text-[var(--bocar-error)]">
          {error?.message ?? 'The RFQ detail could not be loaded.'}
        </div>
      </div>
    );
  }

  if (!isAccessible) {
    return (
      <div className="mx-auto flex w-full max-w-[1304px] flex-col px-6 py-10 sm:px-8 xl:px-0">
        <div className="rounded-[8px] border border-[rgba(170,0,15,0.22)] bg-[rgba(170,0,15,0.08)] px-6 py-8 text-[14px] text-[var(--bocar-error)]">
          This RFQ is not available for your role or access profile.
        </div>
      </div>
    );
  }


  function handleAction(key: RfqActionKey) {
    const rfqId = rfq!.id;
    switch (key) {
      case 'view_full_detail':
        if (pathname.startsWith('/industrializacion')) {
          navigate(`/industrializacion/rfq/${rfqId}/editar?view=true&tipo=${tipo}`, {
            state: { fromAdmin: true },
          });
        } else if (isSupplierPath) {
          navigate(`${ROUTES.SUPPLIER.RFQ_DETAIL_FULL.replace(':id', referenceId)}?tipo=${tipo}`);
        } else {
          navigate(`${ROUTES.PURCHASING.RFQ_DETAIL_FULL.replace(':id', rfqId)}?tipo=${tipo}`, {
            state: { fromAdmin: true },
          });
        }
        break;
      case 'assign_suppliers':
        setShowAssignment(true);
        window.requestAnimationFrame(() =>
          assignmentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        );
        break;
      case 'open_rfq':
        navigate(`/industrializacion/rfq/${rfqId}/editar?view=true&tipo=${tipo}`);
        break;
      case 'edit_draft':
        navigate(`/industrializacion/rfq/${rfqId}/editar?tipo=${tipo}`);
        break;
      case 'submit_draft': {
        setIsMutating(true);
        setFeedbackBanner(null);
        sendRfqToCom(tipo, parseId(rfqId))
          .then(() => {
            setFeedbackBanner({
              tone: 'success',
              icon: 'check',
              message: 'RFQ submitted to Purchasing successfully. Redirecting...',
            });
            setTimeout(() => navigate(backHref), 2500);
          })
          .catch((err: unknown) => {
            setFeedbackBanner({
              tone: 'danger',
              icon: 'alert',
              message: extractApiError(err),
            });
          })
          .finally(() => setIsMutating(false));
        break;
      }
      case 'delete_draft': {
        setIsMutating(true);
        setFeedbackBanner(null);
        deleteRfq(tipo, parseId(rfqId))
          .then(() => {
            setFeedbackBanner({
              tone: 'success',
              icon: 'check',
              message: 'Draft deleted successfully. Redirecting...',
            });
            setTimeout(() => navigate(backHref), 2500);
          })
          .catch((err: unknown) => {
            setFeedbackBanner({
              tone: 'danger',
              icon: 'alert',
              message: extractApiError(err),
            });
          })
          .finally(() => setIsMutating(false));
        break;
      }
      case 'logical_delete_rfq': {
        setIsMutating(true);
        setFeedbackBanner(null);
        logicalDeleteRfq(tipo, parseId(rfqId))
          .then(() => {
            setFeedbackBanner({
              tone: 'success',
              icon: 'check',
              message: 'RFQ eliminado correctamente. Redirigiendo...',
            });
            setTimeout(() => navigate(backHref), 2500);
          })
          .catch((err: unknown) => {
            setFeedbackBanner({
              tone: 'danger',
              icon: 'alert',
              message: extractApiError(err),
            });
          })
          .finally(() => setIsMutating(false));
        break;
      }
      case 'request_edit':
        setShowEditRequestModal(true);
        break;
      case 'approve_edit_request':
        setConfirmEditVariant('approve');
        break;
      case 'reject_edit_request':
        setConfirmEditVariant('reject');
        break;
      case 'close_rfq':
        setShowCloseRfqModal(true);
        break;
      case 'extend_deadline':
        setShowExtendDeadlineModal(true);
        break;
      case 'create_quotation':
        navigate(
          `${ROUTES.SUPPLIER.QUOTATION_CREATE.replace(':rfqId', isSupplierPath ? referenceId : rfqId)}?tipo=${tipo}`,
        );
        break;
      default:
        // DEV-ONLY: no subir a producción
        console.log('[RfqDetail] action triggered:', key, rfqId);
    }
  }

  const assignmentSuppliers =
    proveedores.state.status === 'success' && proveedores.state.data.length > 0
      ? proveedores.state.data
      : rfq.suppliers.length > 0
      ? rfq.suppliers
      : [];

  const isIndustrializacionRole = role === 'industrializacion' || role === 'industrializacion_admin';
  const showEditRequestsPanel =
    isPurchasingRole &&
    (rfq.status === 'PENDING' || rfq.status === 'PENDING_EDIT_REQUEST');
  // La lista de proveedores seleccionados es solo para Compras; ni Industrialización ni
  // Proveedores deben verla.
  const showSuppliers =
    isPurchasingRole &&
    rfq.suppliers.length > 0 &&
    rfq.status !== 'PENDING' &&
    rfq.status !== 'PENDING_EDIT_REQUEST';
  const showBenchmark =
    (rfq.status === 'BENCHMARK_READY' || rfq.status === 'CLOSED') && rfq.benchmark.length > 0;
  const isSuperUser = role === 'industrializacion_admin' || role === 'compras_admin';
  const predictionSuppliers =
    rfq.status === 'QUOTING'
      ? rfq.suppliers
      : proveedores.state.status === 'success'
        ? proveedores.state.data
        : [];
  const aiPredictions =
    aiPrediction.state.status === 'success' ? aiPrediction.state.data.predictions : [];

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
            <RfqActionBar actions={allowedActions} onAction={handleAction} disabled={isMutating} />
          </div>
        ) : null}

        {/* Feedback banner (resultado de submit / delete) */}
        {feedbackBanner ? (
          <div className="border-t border-[rgba(217,222,229,0.48)] px-7 py-4 lg:px-12">
            <RfqStatusBanner config={feedbackBanner} />
          </div>
        ) : null}

        {/* Panel de solicitudes de edición — solo para Compras cuando hay una pendiente */}
        {showEditRequestsPanel ? (
          <RfqEditRequestsPanel
            rfqNumericId={parseId(rfq.id)}
            tipo={tipo}
            onResolved={() => {
              setFeedbackBanner({
                tone: 'success',
                icon: 'check',
                message: 'Request resolved. Redirecting...',
              });
              setTimeout(() => navigate(backHref), 2500);
            }}
          />
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
              <div key={field.code} className={['flex min-h-[96px] flex-col justify-between gap-3 bg-white px-5 py-4', field.code === 'comments' ? 'sm:col-span-2 lg:col-span-4' : ''].join(' ').trim()}>
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
          <UploadedFilesList files={rfq.files} />
        </div>

        {/* Inline supplier assignment (revealed from the action menu) */}
        {isAssignmentVisible ? (
          <div
            ref={assignmentRef}
            className="scroll-mt-6 border-t border-[rgba(217,222,229,0.88)] px-7 py-6 lg:px-12"
          >
            <h2 className="m-0 mb-4 text-[15px] font-semibold text-[var(--bocar-text)]">
              Supplier Assignment
            </h2>
            <SupplierAssignmentPanel
              suppliers={assignmentSuppliers}
              backHref={backHref}
              onSubmit={(input) =>
                assignSuppliers.mutate(tipo, {
                  id_rfq: parseId(rfq.id),
                  ...input,
                })
              }
            />
          </div>
        ) : null}

        {/* Suppliers readonly */}
        {showSuppliers && !isAssignmentVisible ? (
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

        {showAiPrediction ? (
          <AiCostPredictionPanel
            error={aiPrediction.state.status === 'error' ? aiPrediction.state.error : null}
            loading={aiPrediction.state.status === 'loading'}
            onRetry={aiPrediction.retry}
            predictions={aiPredictions}
            suppliers={predictionSuppliers}
          />
        ) : null}

        {/* Benchmark comparison chart — only when the RFQ reached Benchmark ready */}
        {rfq.status === 'BENCHMARK_READY' ? (
          <BenchmarkComparativaChart tipo={tipo} rfqNumericId={parseId(rfq.id)} />
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

      {/* Modal: solicitar edición */}
      {showEditRequestModal ? (
        <EditRequestModal
          rfqId={rfq.id}
          onClose={() => setShowEditRequestModal(false)}
          onConfirm={async (reason) => {
            await requestEdit(tipo, parseId(rfq.id), reason);
            setShowEditRequestModal(false);
            setFeedbackBanner({
              tone: 'success',
              icon: 'check',
              message: 'Edit request submitted. Purchasing will receive your request.',
            });
          }}
        />
      ) : null}

      {/* Modal: cerrar RFQ formalmente */}
      {showCloseRfqModal ? (
        <CloseRfqModal
          rfqId={rfq.id}
          onClose={() => setShowCloseRfqModal(false)}
          onConfirm={async (formData) => {
            await closeRfq(tipo, parseId(rfq.id), formData);
            setShowCloseRfqModal(false);
            setFeedbackBanner({
              tone: 'success',
              icon: 'check',
              message: 'RFQ formally closed. Redirecting...',
            });
            setTimeout(() => navigate(backHref), 2500);
          }}
        />
      ) : null}

      {/* Modal: extender deadline de RFQ expirado */}
      {showExtendDeadlineModal ? (
        <ExtendDeadlineModal
          rfqId={rfq.id}
          onClose={() => setShowExtendDeadlineModal(false)}
          onConfirm={async (formData) => {
            await extendRfqDeadline(tipo, parseId(rfq.id), formData);
            setShowExtendDeadlineModal(false);
            setFeedbackBanner({
              tone: 'success',
              icon: 'check',
              message: 'Deadline extendido correctamente. Redirigiendo...',
            });
            setTimeout(() => navigate(backHref), 2500);
          }}
        />
      ) : null}

      {/* Modal: aprobar o rechazar solicitud de edición */}
      {confirmEditVariant ? (
        <ConfirmEditModal
          variant={confirmEditVariant}
          rfqId={rfq.id}
          onClose={() => setConfirmEditVariant(null)}
          onConfirm={async () => {
            const editRequestId = await getPendingEditRequestId(tipo, parseId(rfq.id));
            if (confirmEditVariant === 'approve') {
              await approveEditRequest(tipo, editRequestId);
            } else {
              await rejectEditRequest(tipo, editRequestId);
            }
            setConfirmEditVariant(null);
            setFeedbackBanner({
              tone: 'success',
              icon: 'check',
              message:
                confirmEditVariant === 'approve'
                  ? 'Request approved. The RFQ has returned to Industrialization.'
                  : 'Request rejected. The RFQ remains in Purchasing.',
            });
            setTimeout(() => navigate(backHref), 2500);
          }}
        />
      ) : null}
    </div>
  );
}
