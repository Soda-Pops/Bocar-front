import { useLocation, useParams } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { RfqDetailWorkspace } from '@/features/rfq/components/RfqDetail/RfqDetailWorkspace';
import { MainLayout } from '@/layouts/MainLayout';
import { Header } from '@/layouts/components/Header';

function SupplierSelectionPage() {
  const { id } = useParams();
  const location = useLocation();
  const fromAdmin = (location.state as { fromAdmin?: boolean } | null)?.fromAdmin === true;
  const backHref = fromAdmin ? ROUTES.PURCHASING.ADMIN_DASHBOARD : ROUTES.PURCHASING.DASHBOARD;

  return (
    <MainLayout header={<Header areaLabel="Supplier Selection" />}>
      <RfqDetailWorkspace
        backHref={backHref}
        mode="assign"
        referenceId={id}
      />
    </MainLayout>
  );
}

export default SupplierSelectionPage;
