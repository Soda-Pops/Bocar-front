import { useLocation, useParams } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { RfqDetailWorkspace } from '@/features/rfq/components/RfqDetail/RfqDetailWorkspace';
import { MainLayout } from '@/layouts/MainLayout';
import { Header } from '@/layouts/components/Header';

function RfqDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const isPurchasingRoute = location.pathname.startsWith('/compras');
  const isSupplierRoute = location.pathname.startsWith('/proveedor');
  const fromAdmin = (location.state as { fromAdmin?: boolean } | null)?.fromAdmin === true;
  const backHref = isSupplierRoute
    ? ROUTES.SUPPLIER.DASHBOARD
    : fromAdmin && isPurchasingRoute
      ? ROUTES.PURCHASING.ADMIN_DASHBOARD
      : fromAdmin && !isPurchasingRoute
        ? ROUTES.INDUSTRIALIZATION.ADMIN_DASHBOARD
        : isPurchasingRoute
          ? ROUTES.PURCHASING.DASHBOARD
          : ROUTES.INDUSTRIALIZATION.DASHBOARD;
  return (
    <MainLayout header={<Header areaLabel="RFQ Detail" />}>
      <RfqDetailWorkspace backHref={backHref} referenceId={id} />
    </MainLayout>
  );
}

export default RfqDetailPage;
