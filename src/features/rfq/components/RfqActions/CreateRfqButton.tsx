import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { Button } from '@/shared/components/ui/Button';

export function CreateRfqButton() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-end">
      <Button
        className="h-12 rounded-[12px] bg-[var(--bocar-blue-100)] px-8 text-[15px] font-medium shadow-[0_12px_24px_rgba(0,46,93,0.18)] hover:bg-[#0b3b6b] lg:h-9 lg:min-w-[170px] lg:px-7 lg:text-[13px]"
        onClick={() => navigate(ROUTES.INDUSTRIALIZATION.RFQ_CREATE)}
      >
        Crear RFQ
      </Button>
    </div>
  );
}
