export const RfqStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PENDING_EDIT_REQUEST: 'PENDING_EDIT_REQUEST',
  QUOTING: 'QUOTING',
  PARTIALLY_QUOTED: 'PARTIALLY_QUOTED',
  ANSWERED: 'ANSWERED',
  BENCHMARK_READY: 'BENCHMARK_READY',
  EXPIRED: 'EXPIRED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;

export type RfqStatus = (typeof RfqStatus)[keyof typeof RfqStatus];

export type UserRole =
  | 'industrializacion'
  | 'industrializacion_admin'
  | 'compras'
  | 'compras_admin'
  | 'proveedor';

export type RfqActionKey =
  | 'edit_draft'
  | 'submit_draft'
  | 'delete_draft'
  | 'open_rfq'
  | 'request_edit'
  | 'view_full_detail'
  | 'assign_suppliers'
  | 'approve_edit_request'
  | 'reject_edit_request'
  | 'close_rfq'
  | 'extend_deadline'
  | 'cancel_early'
  | 'cancel_late'
  | 'create_quotation';

export type RfqActionDescriptor = {
  key: RfqActionKey;
  label: string;
  tone: 'primary' | 'secondary' | 'destructive' | 'warning';
  icon?: 'edit' | 'send' | 'trash' | 'check' | 'x' | 'block' | 'clock' | 'arrow-right';
  requiresConfirmation: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onlyCreator?: boolean;
};

export type RfqBannerConfig = {
  tone: 'neutral' | 'info' | 'warning' | 'danger' | 'success';
  message: string;
  icon?: 'info' | 'clock' | 'alert' | 'check' | 'lock';
};

const A: Record<RfqActionKey, RfqActionDescriptor> = {
  edit_draft: {
    key: 'edit_draft',
    label: 'Edit RFQ',
    tone: 'primary',
    icon: 'edit',
    requiresConfirmation: false,
    onlyCreator: true,
  },
  submit_draft: {
    key: 'submit_draft',
    label: 'Submit RFQ',
    tone: 'secondary',
    icon: 'send',
    requiresConfirmation: true,
    onlyCreator: true,
  },
  delete_draft: {
    key: 'delete_draft',
    label: 'Delete draft',
    tone: 'destructive',
    icon: 'trash',
    requiresConfirmation: true,
    onlyCreator: true,
  },
  request_edit: {
    key: 'request_edit',
    label: 'Request edit',
    tone: 'secondary',
    icon: 'edit',
    requiresConfirmation: true,
    onlyCreator: true,
  },
  open_rfq: {
    key: 'open_rfq',
    label: 'Open RFQ',
    tone: 'secondary',
    icon: 'arrow-right',
    requiresConfirmation: false,
  },
  view_full_detail: {
    key: 'view_full_detail',
    label: 'View full details',
    tone: 'secondary',
    icon: 'arrow-right',
    requiresConfirmation: false,
  },
  assign_suppliers: {
    key: 'assign_suppliers',
    label: 'Assign suppliers',
    tone: 'primary',
    requiresConfirmation: false,
  },
  approve_edit_request: {
    key: 'approve_edit_request',
    label: 'Approve request',
    tone: 'primary',
    icon: 'check',
    requiresConfirmation: true,
  },
  reject_edit_request: {
    key: 'reject_edit_request',
    label: 'Reject request',
    tone: 'secondary',
    icon: 'x',
    requiresConfirmation: true,
  },
  close_rfq: {
    key: 'close_rfq',
    label: 'Close RFQ',
    tone: 'secondary',
    requiresConfirmation: true,
  },
  extend_deadline: {
    key: 'extend_deadline',
    label: 'Extend deadline',
    tone: 'secondary',
    icon: 'clock',
    requiresConfirmation: true,
  },
  cancel_early: {
    key: 'cancel_early',
    label: 'Cancel',
    tone: 'destructive',
    icon: 'trash',
    requiresConfirmation: true,
  },
  cancel_late: {
    key: 'cancel_late',
    label: 'Cancel (special protocol)',
    tone: 'destructive',
    icon: 'trash',
    requiresConfirmation: true,
  },
  create_quotation: {
    key: 'create_quotation',
    label: 'Create quotation',
    tone: 'primary',
    requiresConfirmation: false,
  },
};

export function resolveIsAccessible(
  status: RfqStatus,
  role: UserRole,
  isCreator: boolean,
): boolean {
  const isSuperUser = role === 'industrializacion_admin' || role === 'compras_admin';
  const isSupplier = role === 'proveedor';

  switch (status) {
    case 'DRAFT':
      return isCreator || isSuperUser;
    case 'PENDING':
    case 'PENDING_EDIT_REQUEST':
      return !isSupplier;
    case 'QUOTING':
    case 'PARTIALLY_QUOTED':
    case 'ANSWERED':
    case 'BENCHMARK_READY':
    case 'EXPIRED':
      return true;
    case 'CLOSED':
      return true;
    case 'CANCELLED':
      return isSuperUser;
    default:
      return false;
  }
}

export function resolveAllowedActions(input: {
  status: RfqStatus;
  role: UserRole;
  isCreator: boolean;
  isAssignedSupplier?: boolean;
}): RfqActionDescriptor[] {
  const { status, role, isCreator, isAssignedSupplier = false } = input;
  const isSuperUser = role === 'industrializacion_admin' || role === 'compras_admin';
  const isPurchasing = role === 'compras' || role === 'compras_admin';
  const isPurchasingAdmin = role === 'compras_admin';
  const isIndustrialization = role === 'industrializacion' || role === 'industrializacion_admin';
  const isIndustrializationAdmin = role === 'industrializacion_admin';
  const isSupplier = role === 'proveedor';

  const actions: RfqActionDescriptor[] = [];

  switch (status) {
    case 'DRAFT': {
      // isAccessible already requires isCreator; only called when the viewer is the creator
      actions.push({ ...A.open_rfq });
      actions.push({ ...A.edit_draft });
      actions.push({ ...A.submit_draft });
      actions.push({ ...A.delete_draft });
      if (isIndustrializationAdmin || isPurchasingAdmin) {
        actions.push({ ...A.cancel_early });
      }
      break;
    }

    case 'PENDING': {
      if (isIndustrialization) {
        actions.push({ ...A.open_rfq, label: 'View RFQ' });
      }
      if (isPurchasing) {
        actions.push({ ...A.view_full_detail });
        actions.push({ ...A.assign_suppliers });
      }
      // Only the original creator (Industrialization side) can request edit
      if (isCreator && isIndustrialization) {
        actions.push({ ...A.request_edit });
      }
      if (isSuperUser) {
        actions.push({ ...A.cancel_early });
      }
      break;
    }

    case 'PENDING_EDIT_REQUEST': {
      if (isPurchasing) {
        actions.push({ ...A.approve_edit_request });
        actions.push({ ...A.reject_edit_request });
        // assign_suppliers is blocked while edit request is pending
        actions.push({
          ...A.assign_suppliers,
          disabled: true,
          disabledReason: 'There is a pending edit request awaiting resolution.',
        });
      }
      if (isSuperUser) {
        actions.push({ ...A.cancel_early });
      }
      // Industrialization creator: no CTAs (banner explains status)
      break;
    }

    case 'QUOTING': {
      if (isSupplier && isAssignedSupplier) {
        actions.push({ ...A.create_quotation });
      }
      if (isPurchasing) {
        actions.push({ ...A.assign_suppliers });
      }
      break;
    }

    case 'PARTIALLY_QUOTED': {
      if (isSupplier && isAssignedSupplier) {
        actions.push({ ...A.create_quotation });
      }
      break;
    }

    case 'ANSWERED': {
      // El proveedor ya envió su cotización — vista de solo lectura, sin acciones
      break;
    }

    case 'BENCHMARK_READY': {
      if (isPurchasing) {
        actions.push({ ...A.close_rfq });
      }
      break;
    }

    case 'EXPIRED': {
      if (isPurchasing) {
        // close_rfq is the primary CTA in EXPIRED (no competing primary action)
        actions.push({ ...A.close_rfq, tone: 'primary' });
        if (isPurchasingAdmin) {
          actions.push({ ...A.extend_deadline });
        }
      }
      break;
    }

    case 'CLOSED':
    case 'CANCELLED':
      // Fully readonly — no CTAs
      break;
  }

  return actions;
}
