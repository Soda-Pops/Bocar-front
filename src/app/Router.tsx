import { ROUTES } from '@/app/config/routes';
import DashboardPage from '@/pages/industrializacion/DashboardPage';
import RfqFormPage from '@/pages/industrializacion/RfqFormPage';
import LoginPage from '@/pages/auth/LoginPage';
import PurchasingBenchmarkPage from '@/pages/purchasing/BenchmarkPage';
import PurchasingDashboardPage from '@/pages/purchasing/DashboardPage';
import PurchasingRfqListPage from '@/pages/purchasing/RfqListPage';
import SupplierSelectionPage from '@/pages/purchasing/SupplierSelectionPage';
import PurchasingUnlockRequestsPage from '@/pages/purchasing/UnlockRequestsPage';
import RfqDetailPage from '@/pages/rfq/RfqDetailPage';
import { Navigate, RouterProvider, createBrowserRouter, useLocation } from 'react-router-dom';

function resolvePreviewScreen(search: string) {
  const params = new URLSearchParams(search);
  return params.get('screen');
}

function LoginRoute() {
  const { search } = useLocation();
  const previewScreen = resolvePreviewScreen(search);

  if (previewScreen === 'industrializacion-dashboard') {
    return <Navigate to={ROUTES.INDUSTRIALIZATION.DASHBOARD} replace />;
  }

  return <LoginPage />;
}

function FallbackRoute() {
  const { search } = useLocation();
  const previewScreen = resolvePreviewScreen(search);

  if (previewScreen === 'industrializacion-dashboard') {
    return <Navigate to={ROUTES.INDUSTRIALIZATION.DASHBOARD} replace />;
  }

  return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
}

const appRouter = createBrowserRouter([
  // Programada: login y redireccion de preview.
  {
    path: ROUTES.AUTH.LOGIN,
    element: <LoginRoute />,
  },
  // Programada: dashboard principal de Industrializacion.
  {
    path: ROUTES.INDUSTRIALIZATION.DASHBOARD,
    element: <DashboardPage />,
  },
  // Programada: dashboard operativo principal de Compras.
  {
    path: ROUTES.PURCHASING.DASHBOARD,
    element: <PurchasingDashboardPage />,
  },
  // Programada: listado operativo de RFQs de Compras.
  {
    path: ROUTES.PURCHASING.RFQ_LIST,
    element: <PurchasingRfqListPage />,
  },
  // Programada: creacion de RFQ en Industrializacion.
  {
    path: ROUTES.INDUSTRIALIZATION.RFQ_CREATE,
    element: <RfqFormPage />,
  },
  // Programada: edicion de RFQ en Industrializacion.
  {
    path: ROUTES.INDUSTRIALIZATION.RFQ_EDIT,
    element: <RfqFormPage />,
  },
  // Programada: detalle de RFQ en Industrializacion.
  {
    path: ROUTES.INDUSTRIALIZATION.RFQ_DETAIL,
    element: <RfqDetailPage />,
  },
  // Programada: seleccion de proveedores desde Compras.
  {
    path: ROUTES.PURCHASING.RFQ_ASSIGN_SUPPLIERS,
    element: <SupplierSelectionPage />,
  },
  // Programada: bandeja de desbloqueos para Compras admin.
  {
    path: ROUTES.PURCHASING.ADMIN_UNLOCK_REQUESTS,
    element: <PurchasingUnlockRequestsPage />,
  },
  // Programada: punto inicial del benchmark de Compras.
  {
    path: ROUTES.PURCHASING.BENCHMARK,
    element: <PurchasingBenchmarkPage />,
  },
  // Programada: detalle de RFQ en Compras con pantalla compartida.
  {
    path: ROUTES.PURCHASING.RFQ_DETAIL,
    element: <RfqDetailPage />,
  },
  // Programada: detalle de RFQ para Proveedor con pantalla compartida.
  {
    path: ROUTES.SUPPLIER.RFQ_DETAIL,
    element: <RfqDetailPage />,
  },
  // Programada: detalle de cotizacion para Proveedor con pantalla compartida.
  {
    path: ROUTES.SUPPLIER.QUOTATION_DETAIL,
    element: <RfqDetailPage />,
  },
  // No programada: ROUTES.SUPPLIER.RFQ_LIST necesita pantalla de listado de RFQs del Proveedor.
  // No programada: ROUTES.SUPPLIER.QUOTATION_LIST necesita pantalla de listado de cotizaciones.
  // Programada: fallback para rutas no reconocidas.
  {
    path: '*',
    element: <FallbackRoute />,
  },
]);

export function Router() {
  return <RouterProvider router={appRouter} />;
}
