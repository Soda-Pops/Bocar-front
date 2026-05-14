import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { RfqTipo } from '@/features/analytics/types';
import { RfqTypeSelectionScreen } from '@/features/rfq/components/RfqForm/RfqTypeSelectionScreen';
import { RfqWorkspace } from '@/features/rfq/components/RfqForm/RfqWorkspace';

function RfqFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [createTipo, setCreateTipo] = useState<RfqTipo | null>(null);

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
