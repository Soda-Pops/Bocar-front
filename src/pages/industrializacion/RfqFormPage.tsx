import { useNavigate, useParams } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { RfqWorkspace } from '@/features/rfq/components/RfqForm/RfqWorkspace';

function RfqFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  return (
    <RfqWorkspace
      mode={isEditMode ? 'edit' : 'create'}
      rfqId={id}
      onBack={() => navigate(ROUTES.INDUSTRIALIZATION.DASHBOARD)}
    />
  );
}

export default RfqFormPage;
