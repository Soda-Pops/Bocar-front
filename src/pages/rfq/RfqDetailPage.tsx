import { useParams } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { resolveHomeRouteForRole } from '@/features/auth/services/roleRouting';
import { RfqDetailWorkspace } from '@/features/rfq/components/RfqDetail/RfqDetailWorkspace';
import { MainLayout } from '@/layouts/MainLayout';
import { Header } from '@/layouts/components/Header';

function RfqDetailPage() {
  const { id } = useParams();
  const auth = useAuth();
  const backHref =
    auth.status === 'authenticated'
      ? resolveHomeRouteForRole(auth.user.role, auth.user.isAdmin)
      : ROUTES.AUTH.LOGIN;

  return (
    <MainLayout header={<Header areaLabel="RFQ Detail" />}>
      <RfqDetailWorkspace backHref={backHref} referenceId={id} />
    </MainLayout>
  );
}

export default RfqDetailPage;
