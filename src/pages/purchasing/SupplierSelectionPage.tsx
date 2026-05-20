import { useParams } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { RfqDetailWorkspace } from '@/features/rfq/components/RfqDetail/RfqDetailWorkspace';
import { MainLayout } from '@/layouts/MainLayout';
import { Header } from '@/layouts/components/Header';

function SupplierSelectionPage() {
  const { id } = useParams();

  return (
    <MainLayout header={<Header areaLabel="Selección Proveedores" />}>
      <RfqDetailWorkspace
        backHref={ROUTES.PURCHASING.RFQ_LIST}
        mode="assign"
        referenceId={id}
      />
    </MainLayout>
  );
}

export default SupplierSelectionPage;
