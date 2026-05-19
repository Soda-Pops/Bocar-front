import type { RfqTipo } from '@/features/analytics/types';

import { moldDefinition } from './definitions/moldDefinition';
import { trimmingDefinition } from './definitions/trimmingDefinition';
import { RfqWorkspaceShell } from './shell/RfqWorkspaceShell';

type RfqWorkspaceProps = {
  mode: 'create' | 'edit';
  onBack: () => void;
  rfqId?: string;
  tipo: RfqTipo;
};

export function RfqWorkspace({ mode, onBack, rfqId, tipo }: RfqWorkspaceProps) {
  if (tipo === 'Trimming') {
    return (
      <RfqWorkspaceShell
        definition={trimmingDefinition}
        mode={mode}
        onBack={onBack}
        rfqId={rfqId}
        tipo={tipo}
      />
    );
  }

  return (
    <RfqWorkspaceShell
      definition={moldDefinition}
      mode={mode}
      onBack={onBack}
      rfqId={rfqId}
      tipo={tipo}
    />
  );
}
