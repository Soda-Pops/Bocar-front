import { useLocation, useParams } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { dashboardUser } from '@/features/analytics/services/analyticsService';
import { purchasingUser } from '@/features/purchasing/services/purchasingDashboardService';
import { RfqDetailWorkspace } from '@/features/rfq/components/RfqDetail/RfqDetailWorkspace';
import { MainLayout } from '@/layouts/MainLayout';
import { Header } from '@/layouts/components/Header';

function RfqDetailPage() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const isPurchasingRoute = pathname.startsWith('/compras');
  const backHref = isPurchasingRoute
    ? ROUTES.PURCHASING.RFQ_LIST
    : ROUTES.INDUSTRIALIZATION.DASHBOARD;
  const user = isPurchasingRoute ? purchasingUser : dashboardUser;

  return (
    <MainLayout header={<Header areaLabel="Detalle RFQ" user={user} />}>
      <RfqDetailWorkspace backHref={backHref} referenceId={id} />
    </MainLayout>
  );
}

export default RfqDetailPage;
