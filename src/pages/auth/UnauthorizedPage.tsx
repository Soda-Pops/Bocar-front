import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { resolveHomeRouteForRole } from '@/features/auth/services/roleRouting';

function UnauthorizedPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  function handleGoHome() {
    if (auth.status === 'authenticated') {
      navigate(resolveHomeRouteForRole(auth.user.role), { replace: true });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bocar-bg)]">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <span className="text-[64px] font-extrabold leading-none text-[var(--bocar-blue-100,#002E5D)] opacity-20 select-none">
          401
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-[22px] font-bold text-[var(--bocar-blue-100,#002E5D)]">
            Acceso no autorizado
          </h1>
          <p className="text-[13px] leading-relaxed text-[var(--bocar-blue-70,#6f88a8)]">
            No tienes permisos para ver esta sección. Si crees que esto es un error, contacta al
            administrador del sistema.
          </p>
        </div>
        {auth.status === 'authenticated' && (
          <button
            type="button"
            onClick={handleGoHome}
            className="rounded-lg bg-[var(--bocar-blue-100,#002E5D)] px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-80"
          >
            Volver a mi área
          </button>
        )}
      </div>
    </div>
  );
}

export default UnauthorizedPage;
