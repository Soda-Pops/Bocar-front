import type { ReactNode } from 'react';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { resolveHomeRouteForRole } from '@/features/auth/services/roleRouting';
import type { AppRole } from '@/features/auth/types';
import UnauthorizedPage from '@/pages/auth/UnauthorizedPage';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/industrializacion/DashboardPage';
import SuperUserDashboardPage from '@/pages/industrializacion/SuperUserDashboardPage';
import RfqFormPage from '@/pages/industrializacion/RfqFormPage';
import SupplierDashboardPage from '@/pages/proveedor/DashboardPage';
import QuotationFormPage from '@/pages/proveedor/QuotationFormPage';
import PurchasingBenchmarkPage from '@/pages/purchasing/BenchmarkPage';
import PurchasingAdminDashboardPage from '@/pages/purchasing/AdminDashboardPage';
import PurchasingDashboardPage from '@/pages/purchasing/DashboardPage';
import SupplierSelectionPage from '@/pages/purchasing/SupplierSelectionPage';
import PurchasingUnlockRequestsPage from '@/pages/purchasing/UnlockRequestsPage';
import RfqDetailPage from '@/pages/rfq/RfqDetailPage';

function LoginRoute() {
  const auth = useAuth();

  if (auth.status === 'authenticated') {
    return <Navigate to={resolveHomeRouteForRole(auth.user.role, auth.user.isAdmin)} replace />;
  }

  return <LoginPage />;
}

function Protected({ children, allowedRoles, requireAdmin }: { children: ReactNode; allowedRoles?: AppRole[]; requireAdmin?: boolean }) {
  return <ProtectedRoute allowedRoles={allowedRoles} requireAdmin={requireAdmin}>{children}</ProtectedRoute>;
}

const appRouter = createBrowserRouter([
  {
    path: ROUTES.AUTH.LOGIN,
    element: <LoginRoute />,
  },
  {
    path: ROUTES.AUTH.UNAUTHORIZED,
    element: <UnauthorizedPage />,
  },

  // Industrialization
  {
    path: ROUTES.INDUSTRIALIZATION.DASHBOARD,
    element: (
      <Protected allowedRoles={['industrializacion']}>
        <DashboardPage />
      </Protected>
    ),
  },
  {
    path: ROUTES.INDUSTRIALIZATION.ADMIN_DASHBOARD,
    element: (
      <Protected allowedRoles={['industrializacion']}>
        <SuperUserDashboardPage />
      </Protected>
    ),
  },
  {
    path: ROUTES.INDUSTRIALIZATION.RFQ_CREATE,
    element: (
      <Protected allowedRoles={['industrializacion']}>
        <RfqFormPage />
      </Protected>
    ),
  },
  {
    path: ROUTES.INDUSTRIALIZATION.RFQ_EDIT,
    element: (
      <Protected allowedRoles={['industrializacion']}>
        <RfqFormPage />
      </Protected>
    ),
  },
  {
    path: ROUTES.INDUSTRIALIZATION.RFQ_DETAIL,
    element: (
      <Protected allowedRoles={['industrializacion']}>
        <RfqDetailPage />
      </Protected>
    ),
  },

  // Purchasing
  {
    path: ROUTES.PURCHASING.RFQ_CREATE,
    element: (
      <Protected allowedRoles={['compras']} requireAdmin>
        <RfqFormPage areaLabel="Purchasing · Create RFQ" />
      </Protected>
    ),
  },
  {
    path: ROUTES.PURCHASING.DASHBOARD,
    element: (
      <Protected allowedRoles={['compras']}>
        <PurchasingDashboardPage />
      </Protected>
    ),
  },
  {
    path: ROUTES.PURCHASING.RFQ_DETAIL,
    element: (
      <Protected allowedRoles={['compras']}>
        <RfqDetailPage />
      </Protected>
    ),
  },
  {
    path: ROUTES.PURCHASING.RFQ_DETAIL_FULL,
    element: (
      <Protected allowedRoles={['compras']}>
        <RfqFormPage forcedMode="view" />
      </Protected>
    ),
  },
  {
    path: ROUTES.PURCHASING.RFQ_ASSIGN_SUPPLIERS,
    element: (
      <Protected allowedRoles={['compras']}>
        <SupplierSelectionPage />
      </Protected>
    ),
  },
  {
    path: ROUTES.PURCHASING.ADMIN_DASHBOARD,
    element: (
      <Protected allowedRoles={['compras']}>
        <PurchasingAdminDashboardPage />
      </Protected>
    ),
  },
  {
    path: ROUTES.PURCHASING.ADMIN_UNLOCK_REQUESTS,
    element: (
      <Protected allowedRoles={['compras']}>
        <PurchasingUnlockRequestsPage />
      </Protected>
    ),
  },
  {
    path: ROUTES.PURCHASING.BENCHMARK,
    element: (
      <Protected allowedRoles={['compras']}>
        <PurchasingBenchmarkPage />
      </Protected>
    ),
  },

  // Supplier
  {
    path: ROUTES.SUPPLIER.DASHBOARD,
    element: (
      <Protected allowedRoles={['proveedor']}>
        <SupplierDashboardPage />
      </Protected>
    ),
  },
  {
    path: ROUTES.SUPPLIER.RFQ_DETAIL,
    element: (
      <Protected allowedRoles={['proveedor']}>
        <RfqDetailPage />
      </Protected>
    ),
  },
  {
    path: ROUTES.SUPPLIER.QUOTATION_CREATE,
    element: (
      <Protected allowedRoles={['proveedor']}>
        <QuotationFormPage />
      </Protected>
    ),
  },
  {
    path: ROUTES.SUPPLIER.QUOTATION_DETAIL,
    element: (
      <Protected allowedRoles={['proveedor']}>
        <RfqDetailPage />
      </Protected>
    ),
  },

  {
    path: '*',
    element: <Navigate to={ROUTES.AUTH.LOGIN} replace />,
  },
]);

export function Router() {
  return <RouterProvider router={appRouter} />;
}
