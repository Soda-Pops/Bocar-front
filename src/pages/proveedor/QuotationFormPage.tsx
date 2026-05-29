import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import type { RfqTipo } from '@/features/analytics/types';
import { RfqWorkspace } from '@/features/rfq/components/RfqForm/RfqWorkspace';

const VALID_TIPOS: RfqTipo[] = ['Mold', 'Trimming'];

function parseRfqTipo(value: string | null): RfqTipo | null {
  if (value && (VALID_TIPOS as string[]).includes(value)) {
    return value as RfqTipo;
  }
  return null;
}

function QuotationFormPage() {
  const navigate = useNavigate();
  const { rfqId } = useParams();
  const [searchParams] = useSearchParams();
  const tipo = parseRfqTipo(searchParams.get('tipo'));

  if (!tipo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[14px] text-[var(--bocar-blue-70)]">Tipo de RFQ no válido.</p>
      </div>
    );
  }

  return (
    <RfqWorkspace
      mode="create"
      tipo={tipo}
      rfqId={rfqId}
      onBack={() => navigate(-1)}
    />
  );
}

export default QuotationFormPage;
