import { useEffect, useRef } from 'react';

import type { RfqTipo } from '@/features/analytics/types';
import type { MoldFormValues } from '@/features/rfq/components/RfqForm/definitions/moldDefinition';
import type { TrimmingFormValues } from '@/features/rfq/components/RfqForm/definitions/trimmingDefinition';
import {
  createRfq,
  getRfqFormValues,
  sendRfqToCom,
  updateRfq,
} from '@/features/rfq/services/rfqLifecycleService';
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

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'body' in error) {
    const body = (error as { body?: unknown }).body;
    if (typeof body === 'object' && body && 'detail' in body) {
      return String((body as { detail: unknown }).detail);
    }
  }
  if (error instanceof Error) return error.message;
  return 'Unexpected error.';
}

export function RfqWorkspace({
  mode,
  onBack,
  onCreatedDashboard,
  rfqId,
  tipo,
  areaPrefix,
  detailSource = 'rfq',
}: RfqWorkspaceProps) {
  const workingRfqIdRef = useRef<number | null>(rfqId ? parseId(rfqId) : null);
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

  useEffect(() => {
    workingRfqIdRef.current = rfqId ? parseId(rfqId) : null;
  }, [rfqId]);

  useEffect(() => {
    if (mode !== 'edit' || initialValuesResource.state.status !== 'success' || !rfqId) return;
    workingRfqIdRef.current = parseId(rfqId);
  }, [initialValuesResource.state.status, mode, rfqId]);

  async function handleSaveDraft(values: Parameters<typeof createRfq>[1]) {
    const currentId = workingRfqIdRef.current;
    if (currentId) {
      const updated = await updateRfq(tipo, currentId, values, 'draft');
      return { detail: updated.detail };
    }
    const created = await createRfq(tipo, values, 'draft');
    workingRfqIdRef.current = created.id;
    return { created: true, detail: created.detail, id: created.id };
  }

  async function handleSubmit(values: Parameters<typeof createRfq>[1]) {
    const currentId = workingRfqIdRef.current;
    if (currentId) {
      const id = currentId;
      await updateRfq(tipo, id, values, 'submit');
      try {
        await sendRfqToCom(tipo, id);
      } catch (error) {
        throw new Error(
          `RFQ-${String(id).padStart(4, '0')} was saved as a draft, but was not sent to Commercialization. ${getErrorMessage(error)}`,
        );
      }
      return { submitted: true };
    }

    const created = await createRfq(tipo, values, 'submit');
    workingRfqIdRef.current = created.id;
    try {
      await sendRfqToCom(tipo, created.id);
    } catch (error) {
      throw new Error(
        `RFQ-${String(created.id).padStart(4, '0')} was saved as a draft, but was not sent to Commercialization. ${getErrorMessage(error)}`,
      );
    }
    return { created: true, submitted: true, id: created.id };
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
        onSaveDraft={mode === 'view' ? undefined : handleSaveDraft}
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
      onSaveDraft={mode === 'view' ? undefined : handleSaveDraft}
      onSubmit={mode === 'view' ? undefined : handleSubmit}
      rfqId={rfqId}
      tipo={tipo}
      areaPrefix={areaPrefix}
    />
  );
}
