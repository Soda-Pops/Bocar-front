import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { AppRole } from '@/features/auth/types';

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: AppRole[];
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === 'initializing') {
    return <AuthBootstrapScreen />;
  }

  if (auth.status === 'anonymous') {
    return (
      <Navigate
        to={ROUTES.AUTH.LOGIN}
        replace
        state={{ from: { pathname: location.pathname + location.search } }}
      />
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(auth.user.role)) {
    return <Navigate to={ROUTES.AUTH.UNAUTHORIZED} replace />;
  }

  return <>{children}</>;
}

function AuthBootstrapScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bocar-bg)]">
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 text-[13px] text-[var(--bocar-blue-70,#6f88a8)]"
      >
        <span
          aria-hidden="true"
          className="h-3 w-3 animate-pulse rounded-full bg-[var(--bocar-blue-100,#002E5D)]"
        />
        Verificando sesion...
      </div>
    </div>
  );
}
