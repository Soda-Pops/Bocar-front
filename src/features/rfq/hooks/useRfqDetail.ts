import { useSearchParams } from 'react-router-dom';

import type { RfqTipo } from '@/features/analytics/types';
import type { RfqDetail } from '@/features/rfq/services/rfqDetailService';
import { getRfqDetail } from '@/features/rfq/services/rfqLifecycleService';
import { detalleAsignacion } from '@/features/supplier/services/asignacionesService';
import type { RfqBannerConfig, RfqStatus, UserRole } from '@/features/rfq/state/rfqStateMachine';
import { resolveAllowedActions, resolveIsAccessible } from '@/features/rfq/state/rfqStateMachine';
import type { RfqStatusMeta } from '@/features/rfq/state/rfqStatusMeta';
import { rfqStatusMeta } from '@/features/rfq/state/rfqStatusMeta';
import type { RfqActionDescriptor } from '@/features/rfq/state/rfqStateMachine';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useResource } from '@/shared/hooks/useResource';
import { parseId } from '@/shared/utils/rfqId';

type UseRfqDetailResult = {
  rfq: RfqDetail | null;
  allowedActions: RfqActionDescriptor[];
  statusMeta: RfqStatusMeta | null;
  banner: RfqBannerConfig | null;
  isAccessible: boolean;
  role: UserRole;
  isCreator: boolean;
  isLoading: boolean;
  error: Error | null;
};

function resolveBanner(
  rfq: RfqDetail,
  role: UserRole,
  isCreator: boolean,
): RfqBannerConfig | null {
  const isPurchasing = role === 'compras' || role === 'compras_admin';

  switch (rfq.status) {
    case 'DRAFT':
      return {
        tone: 'neutral',
        message: 'Private draft. Only you can view and edit this RFQ.',
        icon: 'info',
      };

    case 'PENDING':
      return null;

    case 'PENDING_EDIT_REQUEST':
      if (isCreator) {
        return {
          tone: 'warning',
          message: 'Your edit request is being reviewed by Purchasing.',
          icon: 'clock',
        };
      }
      if (isPurchasing && rfq.editRequest) {
        return {
          tone: 'warning',
          message: `There is a pending edit request with the following reason: «${rfq.editRequest.reason}». Supplier assignment is blocked until it is resolved.`,
          icon: 'alert',
        };
      }
      return {
        tone: 'warning',
        message: 'There is a pending edit request awaiting resolution. Assignment is blocked.',
        icon: 'alert',
      };

    case 'QUOTING':
      return {
        tone: 'info',
        message:
          'RFQ sent to suppliers. Cancellation from this point forward follows the special protocol: all suppliers will be notified and a replacement RFQ will be generated.',
        icon: 'info',
      };

    case 'PARTIALLY_QUOTED':
      return {
        tone: 'warning',
        message:
          rfq.quotedCount !== undefined && rfq.totalSuppliers !== undefined
            ? `${rfq.quotedCount} of ${rfq.totalSuppliers} quotations received. Some suppliers still have an open deadline.`
            : 'Some quotations have been received. Some suppliers still have an open deadline.',
        icon: 'clock',
      };

    case 'ANSWERED':
      return {
        tone: 'success',
        message: 'You have already submitted your quotation for this RFQ. No further action is required.',
        icon: 'check',
      };

    case 'BENCHMARK_READY':
      return {
        tone: 'success',
        message: 'Benchmark ready for analysis and closure.',
        icon: 'check',
      };

    case 'EXPIRED':
      return {
        tone: 'danger',
        message: 'Deadline expired. Close the RFQ or extend the deadline to open a new cycle.',
        icon: 'alert',
      };

    case 'CLOSED':
      return {
        tone: 'neutral',
        message:
          rfq.closedAt && rfq.closedBy
            ? `RFQ closed on ${rfq.closedAt} by ${rfq.closedBy}. Read-only.`
            : 'RFQ closed. Read-only.',
        icon: 'lock',
      };

    case 'CANCELLED':
      return rfq.cancellation
        ? {
            tone: 'danger',
            message: `RFQ cancelled on ${rfq.cancellation.cancelledAt} by ${rfq.cancellation.cancelledBy}. Reason: «${rfq.cancellation.reason}». This RFQ is no longer visible to standard users or suppliers.`,
            icon: 'alert',
          }
        : {
            tone: 'danger',
            message: 'RFQ cancelled. It is not visible to standard users or suppliers.',
            icon: 'alert',
          };

    default:
      return null;
  }
}

const VALID_ROLES: UserRole[] = [
  'industrializacion',
  'industrializacion_admin',
  'compras',
  'compras_admin',
  'proveedor',
];

const VALID_STATUSES: RfqStatus[] = [
  'DRAFT',
  'PENDING',
  'PENDING_EDIT_REQUEST',
  'QUOTING',
  'PARTIALLY_QUOTED',
  'ANSWERED',
  'BENCHMARK_READY',
  'EXPIRED',
  'CLOSED',
  'CANCELLED',
];

function isValidRole(value: string | null): value is UserRole {
  return VALID_ROLES.includes(value as UserRole);
}

function isValidStatus(value: string | null): value is RfqStatus {
  return VALID_STATUSES.includes(value as RfqStatus);
}

export function useRfqDetail(
  rfqId: string,
  defaultRole: UserRole,
  defaultIsCreator: boolean,
  source: 'rfq' | 'assignment' = 'rfq',
): UseRfqDetailResult {
  const [searchParams] = useSearchParams();
  const auth = useAuth();

  let role = defaultRole;
  let isCreator = defaultIsCreator;
  const tipo = parseTipo(searchParams.get('tipo'));

  // Status hint: the originating list (e.g. the Purchasing dashboard) tells the detail
  // which status to render. With no backend yet, this is the mock's source of truth.
  const paramStatus = searchParams.get('status');
  const statusOverride: RfqStatus | null = isValidStatus(paramStatus) ? paramStatus : null;

  // DEV-only query param overrides for QA and Playwright validation
  if (import.meta.env.DEV) {
    const paramRole = searchParams.get('role');
    const paramCreator = searchParams.get('creator');

    if (isValidRole(paramRole)) role = paramRole;
    if (paramCreator !== null) isCreator = paramCreator !== 'false';
  }

  const { state } = useResource(
    (signal) =>
      source === 'assignment'
        ? detalleAsignacion(tipo, parseId(rfqId), signal)
        : getRfqDetail(tipo, parseId(rfqId), signal),
    [tipo, rfqId, source],
  );

  if (state.status === 'loading' || state.status === 'idle') {
    return {
      rfq: null,
      allowedActions: [],
      statusMeta: null,
      banner: null,
      isAccessible: true,
      role,
      isCreator,
      isLoading: true,
      error: null,
    };
  }

  if (state.status === 'error') {
    return {
      rfq: null,
      allowedActions: [],
      statusMeta: null,
      banner: null,
      isAccessible: true,
      role,
      isCreator,
      isLoading: false,
      error: state.error,
    };
  }

  const rfq: RfqDetail = statusOverride ? { ...state.data, status: statusOverride } : state.data;
  if (auth.status === 'authenticated') {
    isCreator = rfq.createdById === String(auth.user.id);
  }

  const isAccessible = resolveIsAccessible(rfq.status, role, isCreator);

  // isAssignedSupplier: in mock data, all suppliers are treated as assigned to QUOTING/PARTIALLY_QUOTED
  const isAssignedSupplier = role === 'proveedor';

  const allowedActions = resolveAllowedActions({
    status: rfq.status,
    role,
    isCreator,
    isAssignedSupplier,
  });

  const banner = resolveBanner(rfq, role, isCreator);
  const statusMeta = rfqStatusMeta[rfq.status];

  return {
    rfq,
    allowedActions,
    statusMeta,
    banner,
    isAccessible,
    role,
    isCreator,
    isLoading: false,
    error: null,
  };
}

function parseTipo(value: string | null): RfqTipo {
  return value === 'Trimming' || value === 'trimming' ? 'Trimming' : 'Mold';
}
