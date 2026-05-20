import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { AppRole } from '@/features/auth/types';

type UserMenuProps = {
  variant?: 'light' | 'dark';
};

const ROLE_LABELS: Record<AppRole, string> = {
  industrializacion: 'Industrialización',
  compras: 'Compras',
  proveedor: 'Proveedor',
};

function deriveInitials(email: string | null): string {
  const prefix = email?.split('@')[0] ?? '';
  return prefix.slice(0, 2).toUpperCase() || '--';
}

export function UserMenu({ variant = 'light' }: UserMenuProps) {
  const auth = useAuth();
  const navigate = useNavigate();

  const initials = auth.status === 'authenticated' ? deriveInitials(auth.user.email) : '--';
  const name = auth.status === 'authenticated' ? (auth.user.email ?? 'Usuario') : 'Usuario';
  const department =
    auth.status === 'authenticated' ? ROLE_LABELS[auth.user.role] : '';
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const email = auth.status === 'authenticated' ? auth.user.email : null;
  const isDark = variant === 'dark';

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }
    setIsLoggingOut(true);
    try {
      await auth.logout();
      setIsOpen(false);
      navigate(ROUTES.AUTH.LOGIN, { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Abrir menu de usuario"
        onClick={() => setIsOpen((value) => !value)}
        className="flex items-center gap-3 rounded-[10px] px-1 py-1 transition focus:outline-none focus:shadow-[0_0_0_3px_rgba(31,58,97,0.18)]"
      >
        <span
          aria-hidden="true"
          className={[
            'flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold',
            isDark
              ? 'bg-white text-[var(--bocar-blue-100)]'
              : 'bg-[var(--bocar-blue-100)] text-white',
          ].join(' ')}
        >
          {initials}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span
            className={[
              'block truncate text-[14px] font-semibold',
              isDark ? 'text-white' : 'text-[var(--bocar-text)]',
            ].join(' ')}
          >
            {name}
          </span>
          <span
            className={[
              'mt-0.5 block truncate text-[12px]',
              isDark ? 'text-[rgba(255,255,255,0.7)]' : 'text-[var(--bocar-blue-70)]',
            ].join(' ')}
          >
            {department}
          </span>
        </span>
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 min-w-[220px] overflow-hidden rounded-[12px] border border-[rgba(217,222,229,0.9)] bg-white p-1.5 shadow-[0_14px_34px_rgba(0,46,93,0.14)]"
        >
          {email ? (
            <div className="px-3 py-2 text-[12px] text-[var(--bocar-blue-70)]">
              <p className="m-0 truncate font-medium text-[var(--bocar-text)]">{email}</p>
            </div>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center rounded-[10px] px-3 py-2.5 text-left text-[13px] text-[var(--bocar-error,#aa000f)] transition hover:bg-[rgba(170,0,15,0.06)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? 'Cerrando sesion...' : 'Cerrar sesion'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
