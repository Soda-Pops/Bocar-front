import type { RfqStatus } from '@/features/rfq/state/rfqStateMachine';
import type { BackendRfqStatusDto } from '@/features/rfq/services/rfqDtos';

export function parseProgreso(progreso?: string): { quoted: number; total: number } {
  if (!progreso || progreso === 'Sin proveedores asignados') return { quoted: 0, total: 0 };
  if (progreso === 'Completo') return { quoted: 1, total: 1 };
  const match = progreso.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return { quoted: 0, total: 0 };
  return { quoted: Number(match[1]), total: Number(match[2]) };
}

export function mapBackendStatus(input: {
  status: BackendRfqStatusDto;
  complete: boolean;
  hasPendingEditRequest?: boolean;
  progreso?: string;
  deadlineExpired?: boolean;
  logicalDelete?: boolean;
  allAssignmentsClosed?: boolean;
  hasReceivedQuote?: boolean;
}): RfqStatus {
  if (input.logicalDelete) return 'CANCELLED';
  if (input.complete) return 'CLOSED';

  switch (input.status) {
    case 'En_Ind':
      return 'DRAFT';
    case 'En_Com':
      return input.hasPendingEditRequest ? 'PENDING_EDIT_REQUEST' : 'PENDING';
    case 'En_Pro': {
      const { quoted } = parseProgreso(input.progreso);
      if (input.hasReceivedQuote || quoted > 0) return 'BENCHMARK_READY';
      if (input.deadlineExpired) return 'EXPIRED';
      if (input.allAssignmentsClosed) return 'EXPIRED';
      return 'QUOTING';
    }
  }
}
