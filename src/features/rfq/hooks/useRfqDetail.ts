import { useSearchParams } from 'react-router-dom';

import { getRfqDetailById } from '@/features/rfq/services/rfqDetailService';
import type { RfqDetail } from '@/features/rfq/services/rfqDetailService';
import type { RfqBannerConfig, RfqStatus, UserRole } from '@/features/rfq/state/rfqStateMachine';
import { resolveAllowedActions, resolveIsAccessible } from '@/features/rfq/state/rfqStateMachine';
import type { RfqStatusMeta } from '@/features/rfq/state/rfqStatusMeta';
import { rfqStatusMeta } from '@/features/rfq/state/rfqStatusMeta';
import type { RfqActionDescriptor } from '@/features/rfq/state/rfqStateMachine';

type UseRfqDetailResult = {
  rfq: RfqDetail;
  allowedActions: RfqActionDescriptor[];
  statusMeta: RfqStatusMeta;
  banner: RfqBannerConfig | null;
  isAccessible: boolean;
  role: UserRole;
  isCreator: boolean;
};

function resolveBanner(
  rfq: RfqDetail,
  role: UserRole,
  isCreator: boolean,
): RfqBannerConfig | null {
  const isCompras = role === 'compras' || role === 'compras_admin';

  switch (rfq.status) {
    case 'DRAFT':
      return {
        tone: 'neutral',
        message: 'Borrador privado. Solo tú puedes ver y editar esta RFQ.',
        icon: 'info',
      };

    case 'PENDING':
      return null;

    case 'PENDING_EDIT_REQUEST':
      if (isCreator) {
        return {
          tone: 'warning',
          message: 'Tu solicitud de edición está siendo revisada por Compras.',
          icon: 'clock',
        };
      }
      if (isCompras && rfq.editRequest) {
        return {
          tone: 'warning',
          message: `Hay una solicitud de edición pendiente con motivo: «${rfq.editRequest.reason}». La asignación de proveedores está bloqueada hasta que sea resuelta.`,
          icon: 'alert',
        };
      }
      return {
        tone: 'warning',
        message: 'Hay una solicitud de edición pendiente de resolución. La asignación está bloqueada.',
        icon: 'alert',
      };

    case 'QUOTING':
      return {
        tone: 'info',
        message:
          'RFQ enviada a proveedores. La cancelación a partir de este punto aplica protocolo especial: se notificará a todos los proveedores y se generará una RFQ de reemplazo.',
        icon: 'info',
      };

    case 'PARTIALLY_QUOTED':
      return {
        tone: 'warning',
        message:
          rfq.quotedCount !== undefined && rfq.totalSuppliers !== undefined
            ? `${rfq.quotedCount} de ${rfq.totalSuppliers} cotizaciones recibidas. Aún hay proveedores con plazo abierto.`
            : 'Algunas cotizaciones recibidas. Aún hay proveedores con plazo abierto.',
        icon: 'clock',
      };

    case 'BENCHMARK_READY':
      return {
        tone: 'success',
        message: 'Benchmark listo para análisis y cierre.',
        icon: 'check',
      };

    case 'EXPIRED':
      return {
        tone: 'danger',
        message: 'Plazo vencido. Cierra la RFQ o extiende el plazo para abrir un nuevo ciclo.',
        icon: 'alert',
      };

    case 'CLOSED':
      return {
        tone: 'neutral',
        message:
          rfq.closedAt && rfq.closedBy
            ? `RFQ cerrada el ${rfq.closedAt} por ${rfq.closedBy}. Solo lectura.`
            : 'RFQ cerrada. Solo lectura.',
        icon: 'lock',
      };

    case 'CANCELLED':
      return rfq.cancellation
        ? {
            tone: 'danger',
            message: `RFQ cancelada el ${rfq.cancellation.cancelledAt} por ${rfq.cancellation.cancelledBy}. Motivo: «${rfq.cancellation.reason}». Esta RFQ ya no es visible para usuarios base ni proveedores.`,
            icon: 'alert',
          }
        : {
            tone: 'danger',
            message: 'RFQ cancelada. No es visible para usuarios base ni proveedores.',
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
): UseRfqDetailResult {
  const [searchParams] = useSearchParams();

  // DEV-only query param overrides for QA and Playwright validation
  let role = defaultRole;
  let isCreator = defaultIsCreator;
  let statusOverride: RfqStatus | null = null;

  if (import.meta.env.DEV) {
    const paramRole = searchParams.get('role');
    const paramCreator = searchParams.get('creator');
    const paramStatus = searchParams.get('status');

    if (isValidRole(paramRole)) role = paramRole;
    if (paramCreator !== null) isCreator = paramCreator !== 'false';
    if (isValidStatus(paramStatus)) statusOverride = paramStatus;
  }

  const rfqRaw = getRfqDetailById(rfqId);
  const rfq: RfqDetail = statusOverride ? { ...rfqRaw, status: statusOverride } : rfqRaw;

  const isAccessible = resolveIsAccessible(rfq.status, role, isCreator);

  // isAssignedSupplier: in mock, all proveedores are treated as assigned to QUOTING/PARTIALLY_QUOTED
  const isAssignedSupplier = role === 'proveedor';

  const allowedActions = resolveAllowedActions({
    status: rfq.status,
    role,
    isCreator,
    isAssignedSupplier,
  });

  const banner = resolveBanner(rfq, role, isCreator);
  const statusMeta = rfqStatusMeta[rfq.status];

  return { rfq, allowedActions, statusMeta, banner, isAccessible, role, isCreator };
}
