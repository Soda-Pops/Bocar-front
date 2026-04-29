import { useNavigate, useParams } from 'react-router-dom';

import { RfqWorkspace } from '@/features/rfq/components/RfqForm/RfqWorkspace';

function RfqFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  return (
    <RfqWorkspace
      mode={isEditMode ? 'edit' : 'create'}
      rfqId={id}
      onBack={() => navigate(-1)}
    />
  );
}

export default RfqFormPage;
