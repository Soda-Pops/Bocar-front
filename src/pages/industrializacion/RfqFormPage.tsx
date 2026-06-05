import { useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import type { RfqTipo } from '@/features/analytics/types';
import { RfqTypeSelectionScreen } from '@/features/rfq/components/RfqForm/RfqTypeSelectionScreen';
import { RfqWorkspace } from '@/features/rfq/components/RfqForm/RfqWorkspace';

const VALID_TYPES: RfqTipo[] = ['Mold', 'Trimming'];

function parseRfqTipo(value: string | null): RfqTipo | null {
  if (value && (VALID_TYPES as string[]).includes(value)) {
    return value as RfqTipo;
  }
  return null;
}

type RfqFormPageProps = {
  forcedMode?: 'view';
  areaLabel?: string;
};

function RfqFormPage({ forcedMode, areaLabel }: RfqFormPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isViewMode = forcedMode === 'view' || searchParams.get('view') === 'true';
  const isEditMode = Boolean(id) && !isViewMode;
  const tipoFromQuery = parseRfqTipo(searchParams.get('tipo'));
  const [createTipo, setCreateTipo] = useState<RfqTipo | null>(tipoFromQuery);

  // Tipo is not part of the RFQ detail mock; allow an explicit ?tipo override, default Mold.
  const tipo: RfqTipo = tipoFromQuery ?? 'Mold';

  const handleBack = () => navigate(-1);

  if (isViewMode) {
    return (
      <RfqWorkspace
        mode="view"
        rfqId={id}
        tipo={tipo}
        onBack={handleBack}
        detailSource={location.pathname.startsWith('/proveedor') ? 'assignment' : 'rfq'}
      />
    );
  }

  if (isEditMode) {
    return <RfqWorkspace mode="edit" rfqId={id} tipo={tipo} onBack={handleBack} />;
  }

  const areaPrefix = areaLabel ? areaLabel.split(' · ')[0] : undefined;

  if (!createTipo) {
    return <RfqTypeSelectionScreen onBack={handleBack} onSelect={setCreateTipo} areaLabel={areaLabel} />;
  }

  return (
    <RfqWorkspace
      mode="create"
      tipo={createTipo}
      onBack={() => setCreateTipo(null)}
      onCreatedDashboard={() => navigate(ROUTES.INDUSTRIALIZATION.DASHBOARD)}
      areaPrefix={areaPrefix}
    />
  );
}

export default RfqFormPage;
