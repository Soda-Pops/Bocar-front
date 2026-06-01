import { useParams } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { RfqDetailWorkspace } from '@/features/rfq/components/RfqDetail/RfqDetailWorkspace';
import { MainLayout } from '@/layouts/MainLayout';
import { Header } from '@/layouts/components/Header';

function SupplierSelectionPage() {
  const { id } = useParams();

  return (
    <MainLayout header={<Header areaLabel="Supplier Selection" />}>
      <RfqDetailWorkspace
        backHref={ROUTES.PURCHASING.DASHBOARD}
        mode="assign"
        referenceId={id}
      />
    </MainLayout>
  );
}

export default SupplierSelectionPage;
