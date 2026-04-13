import { ROUTES } from '@/app/config/routes';
import DashboardPage from '@/pages/industrializacion/DashboardPage';
import RfqFormPage from '@/pages/industrializacion/RfqFormPage';
import LoginPage from '@/pages/auth/LoginPage';
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
  {
    path: ROUTES.AUTH.LOGIN,
    element: <LoginRoute />,
  },
  {
    path: ROUTES.INDUSTRIALIZATION.DASHBOARD,
    element: <DashboardPage />,
  },
  {
    path: ROUTES.INDUSTRIALIZATION.RFQ_CREATE,
    element: <RfqFormPage />,
  },
  {
    path: ROUTES.INDUSTRIALIZATION.RFQ_EDIT,
    element: <RfqFormPage />,
  },
  {
    path: '*',
    element: <FallbackRoute />,
  },
]);

export function Router() {
  return <RouterProvider router={appRouter} />;
}
