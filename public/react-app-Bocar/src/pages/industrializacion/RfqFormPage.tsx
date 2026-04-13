import { useNavigate, useParams } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { dashboardUser } from '@/features/analytics/services/analyticsService';
import { RfqWorkspace } from '@/features/rfq/components/RfqForm/RfqWorkspace';
import { MainLayout } from '@/layouts/MainLayout';
import { Header } from '@/layouts/components/Header';

function RfqFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  return (
    <MainLayout
      header={<Header areaLabel={isEditMode ? 'Editar RFQ' : 'Crear RFQ'} user={dashboardUser} />}
    >
      <RfqWorkspace
        mode={isEditMode ? 'edit' : 'create'}
        rfqId={id}
        onBack={() => navigate(ROUTES.INDUSTRIALIZATION.DASHBOARD)}
      />
    </MainLayout>
  );
}

export default RfqFormPage;
