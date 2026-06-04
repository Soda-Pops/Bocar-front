import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { resolveHomeRouteForRole } from '@/features/auth/services/roleRouting';

function UnauthorizedPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  function handleGoHome() {
    if (auth.status === 'authenticated') {
      navigate(resolveHomeRouteForRole(auth.user.role, auth.user.isAdmin), { replace: true });
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
            Unauthorized access
          </h1>
          <p className="text-[13px] leading-relaxed text-[var(--bocar-blue-70,#6f88a8)]">
            You do not have permission to view this section. If you believe this is an error, contact the
            system administrator.
          </p>
        </div>
        {auth.status === 'authenticated' && (
          <button
            type="button"
            onClick={handleGoHome}
            className="rounded-lg bg-[var(--bocar-blue-100,#002E5D)] px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-80"
          >
            Return to my area
          </button>
        )}
      </div>
    </div>
  );
}

export default UnauthorizedPage;
