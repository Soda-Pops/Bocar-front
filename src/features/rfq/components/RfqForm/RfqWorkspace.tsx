import type { RfqTipo } from '@/features/analytics/types';
import type { MoldFormValues } from '@/features/rfq/components/RfqForm/definitions/moldDefinition';
import type { TrimmingFormValues } from '@/features/rfq/components/RfqForm/definitions/trimmingDefinition';
import { createRfq, getRfqFormValues, updateRfq } from '@/features/rfq/services/rfqLifecycleService';
import { detalleAsignacionFormValues } from '@/features/supplier/services/asignacionesService';
import { useResource } from '@/shared/hooks/useResource';
import { parseId } from '@/shared/utils/rfqId';

import { moldDefinition } from './definitions/moldDefinition';
import { trimmingDefinition } from './definitions/trimmingDefinition';
import { RfqWorkspaceShell } from './shell/RfqWorkspaceShell';

type RfqWorkspaceProps = {
  mode: 'create' | 'edit' | 'view';
  onBack: () => void;
  onCreatedDashboard?: () => void;
  rfqId?: string;
  tipo: RfqTipo;
  areaPrefix?: string;
  detailSource?: 'rfq' | 'assignment';
};

export function RfqWorkspace({
  mode,
  onBack,
  onCreatedDashboard,
  rfqId,
  tipo,
  areaPrefix,
  detailSource = 'rfq',
}: RfqWorkspaceProps) {
  const shouldLoadInitialValues = Boolean(rfqId) && (mode === 'view' || mode === 'edit');
  const initialValuesResource = useResource(
    (signal) =>
      shouldLoadInitialValues && rfqId
        ? detailSource === 'assignment'
          ? detalleAsignacionFormValues(tipo, parseId(rfqId), signal)
          : getRfqFormValues(tipo, parseId(rfqId), signal)
        : Promise.resolve(null),
    [shouldLoadInitialValues, rfqId, tipo, detailSource],
  );

  async function handleSubmit(values: Parameters<typeof createRfq>[1]) {
    if (mode === 'edit' && rfqId) {
      await updateRfq(tipo, parseId(rfqId), values);
      onBack();
      return;
    }
    await createRfq(tipo, values);
    return { created: true };
  }

  if (shouldLoadInitialValues && initialValuesResource.state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-6 text-[14px] text-[var(--bocar-blue-70)]">
        Loading RFQ full detail...
      </div>
    );
  }

  if (shouldLoadInitialValues && initialValuesResource.state.status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-6 text-[14px] text-[var(--bocar-error)]">
        {initialValuesResource.state.error.message}
      </div>
    );
  }

  const initialValues = initialValuesResource.state.status === 'success' ? initialValuesResource.state.data : null;

  if (tipo === 'Trimming') {
    return (
      <RfqWorkspaceShell
        definition={trimmingDefinition}
        initialValues={initialValues ? (initialValues as TrimmingFormValues) : undefined}
        mode={mode}
        onBack={onBack}
        onCreatedDashboard={onCreatedDashboard}
        onSubmit={mode === 'view' ? undefined : handleSubmit}
        rfqId={rfqId}
        tipo={tipo}
        areaPrefix={areaPrefix}
      />
    );
  }

  return (
    <RfqWorkspaceShell
      definition={moldDefinition}
      initialValues={initialValues ? (initialValues as MoldFormValues) : undefined}
      mode={mode}
      onBack={onBack}
      onCreatedDashboard={onCreatedDashboard}
      onSubmit={mode === 'view' ? undefined : handleSubmit}
      rfqId={rfqId}
      tipo={tipo}
      areaPrefix={areaPrefix}
    />
  );
}
