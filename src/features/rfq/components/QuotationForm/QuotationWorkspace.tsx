import { useMemo } from 'react';

import type { RfqTipo } from '@/features/analytics/types';

import { buildMoldQuotationDefinition } from './definitions/moldQuotationDefinition';
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
  const trimmingDef = useMemo(() => buildTrimmingQuotationDefinition(rfqId), [rfqId]);
  const moldDef = useMemo(() => buildMoldQuotationDefinition(rfqId), [rfqId]);

  if (tipo === 'Mold') {
    return (
      <QuotationWorkspaceShell
        definition={moldDef}
        mode={mode}
        quotationId={quotationId}
        rfqId={rfqId}
        tipo={tipo}
        onBack={onBack}
      />
    );
  }

  return (
    <QuotationWorkspaceShell
      definition={trimmingDef}
      mode={mode}
      quotationId={quotationId}
      rfqId={rfqId}
      tipo={tipo}
      onBack={onBack}
    />
  );
}
