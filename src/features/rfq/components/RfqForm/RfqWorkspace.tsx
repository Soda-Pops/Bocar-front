import type { RfqTipo } from '@/features/analytics/types';

import { moldDefinition } from './definitions/moldDefinition';
import { trimmingDefinition } from './definitions/trimmingDefinition';
import { RfqWorkspaceShell } from './shell/RfqWorkspaceShell';

type RfqWorkspaceProps = {
  mode: 'create' | 'edit' | 'view';
  onBack: () => void;
  rfqId?: string;
  tipo: RfqTipo;
  areaPrefix?: string;
};

export function RfqWorkspace({ mode, onBack, rfqId, tipo, areaPrefix }: RfqWorkspaceProps) {
  if (tipo === 'Trimming') {
    return (
      <RfqWorkspaceShell
        definition={trimmingDefinition}
        mode={mode}
        onBack={onBack}
        rfqId={rfqId}
        tipo={tipo}
        areaPrefix={areaPrefix}
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
      areaPrefix={areaPrefix}
    />
  );
}
