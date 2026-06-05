import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import type { RfqTipo } from '@/features/analytics/types';
import { ROUTES } from '@/app/config/routes';
import { QuotationWorkspace } from '@/features/rfq/components/QuotationForm/QuotationWorkspace';

const VALID_TYPES: RfqTipo[] = ['Mold', 'Trimming'];

function parseRfqTipo(value: string | null): RfqTipo | null {
  if (value && (VALID_TYPES as string[]).includes(value)) {
    return value as RfqTipo;
  }
  return null;
}

function QuotationFormPage() {
  const navigate = useNavigate();
  const { rfqId } = useParams();
  const [searchParams] = useSearchParams();
  const tipo = parseRfqTipo(searchParams.get('tipo'));

  const handleBack = () =>
    navigate(`${ROUTES.SUPPLIER.RFQ_DETAIL.replace(':id', rfqId ?? '')}?tipo=${tipo ?? 'Mold'}`);

  if (!tipo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[14px] text-[var(--bocar-blue-70)]">Invalid RFQ type.</p>
      </div>
    );
  }

  return (
    <QuotationWorkspace
      mode="create"
      rfqId={rfqId ?? 'RFQ-001'}
      tipo={tipo}
      onBack={handleBack}
    />
  );
}

export default QuotationFormPage;
