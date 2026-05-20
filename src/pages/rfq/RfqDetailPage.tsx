import { useLocation, useParams } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { RfqDetailWorkspace } from '@/features/rfq/components/RfqDetail/RfqDetailWorkspace';
import { MainLayout } from '@/layouts/MainLayout';
import { Header } from '@/layouts/components/Header';

function RfqDetailPage() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const isPurchasingRoute = pathname.startsWith('/compras');
  const backHref = isPurchasingRoute ? ROUTES.PURCHASING.RFQ_LIST : ROUTES.INDUSTRIALIZATION.DASHBOARD;
  return (
    <MainLayout header={<Header areaLabel="Detalle RFQ" />}>
      <RfqDetailWorkspace backHref={backHref} referenceId={id} />
    </MainLayout>
  );
}

export default RfqDetailPage;
