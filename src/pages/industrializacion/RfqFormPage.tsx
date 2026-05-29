import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import type { RfqTipo } from '@/features/analytics/types';
import { RfqTypeSelectionScreen } from '@/features/rfq/components/RfqForm/RfqTypeSelectionScreen';
import { RfqWorkspace } from '@/features/rfq/components/RfqForm/RfqWorkspace';

const VALID_TIPOS: RfqTipo[] = ['Mold', 'Trimming'];

function parseRfqTipo(value: string | null): RfqTipo | null {
  if (value && (VALID_TIPOS as string[]).includes(value)) {
    return value as RfqTipo;
  }
  return null;
}

function RfqFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(id);
  const tipoFromQuery = parseRfqTipo(searchParams.get('tipo'));
  const [createTipo, setCreateTipo] = useState<RfqTipo | null>(tipoFromQuery);

  const handleBack = () => navigate(-1);

  if (isEditMode) {
    return <RfqWorkspace mode="edit" rfqId={id} tipo="Mold" onBack={handleBack} />;
  }

  if (!createTipo) {
    return <RfqTypeSelectionScreen onBack={handleBack} onSelect={setCreateTipo} />;
  }

  return <RfqWorkspace mode="create" tipo={createTipo} onBack={handleBack} />;
}

export default RfqFormPage;
