import { useNavigate, useParams } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { QuotationWorkspace } from '@/features/rfq/components/QuotationForm/QuotationWorkspace';

function QuotationFormPage() {
  const navigate = useNavigate();
  const { rfqId } = useParams();
  const handleBack = () =>
    navigate(ROUTES.SUPPLIER.RFQ_DETAIL.replace(':id', rfqId ?? ''));

  return (
    <QuotationWorkspace
      mode="create"
      rfqId={rfqId ?? 'RFQ-001'}
      tipo="Trimming"
      onBack={handleBack}
    />
  );
}

export default QuotationFormPage;
