import { useMemo } from 'react';

import type { RfqTipo } from '@/features/analytics/types';

import { buildTrimmingQuotationDefinition } from './definitions/trimmingQuotationDefinition';
import { QuotationWorkspaceShell } from './shell/QuotationWorkspaceShell';

type QuotationWorkspaceProps = {
  mode: 'create' | 'edit';
  onBack: () => void;
  quotationId?: string;
  rfqId: string;
  tipo: RfqTipo;
};

export function QuotationWorkspace({
  mode,
  onBack,
  quotationId,
  rfqId,
  tipo,
}: QuotationWorkspaceProps) {
  const definition = useMemo(
    () => buildTrimmingQuotationDefinition(rfqId),
    [rfqId]
  );

  // Por ahora solo el flujo de Trimming está implementado para el proveedor.
  // El parámetro `tipo` queda listo para futuras variantes (Mold, etc.).
  if (tipo !== 'Trimming') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="m-0 text-[18px] font-semibold text-[var(--bocar-blue-100)]">
          Cotización no disponible
        </h1>
        <p className="m-0 max-w-md text-[13px] leading-[1.55] text-[var(--bocar-blue-70)]">
          El formulario de cotización para RFQ tipo "{tipo}" aún no está habilitado.
          Por el momento solo está disponible Trimming.
        </p>
        <button
          className="mt-2 rounded-[10px] border border-[#d9dee5] bg-white px-4 py-2 text-[13px] font-semibold text-[var(--bocar-blue-100)] transition hover:border-[var(--bocar-blue-70)]"
          type="button"
          onClick={onBack}
        >
          ← Regresar
        </button>
      </div>
    );
  }

  return (
    <QuotationWorkspaceShell
      definition={definition}
      mode={mode}
      quotationId={quotationId}
      rfqId={rfqId}
      tipo={tipo}
      onBack={onBack}
    />
  );
}
