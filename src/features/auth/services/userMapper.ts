import { decodeJwt } from '@/features/auth/services/jwt';
import type { AppRole, AuthenticatedUser } from '@/features/auth/types';
import { APP_ROLES } from '@/features/auth/types';

const ROLE_ALIASES: Record<string, AppRole> = {
  ind: 'industrializacion',
  industrialization: 'industrializacion',
  com: 'compras',
  comercializacion: 'compras',
  purchasing: 'compras',
  pro: 'proveedor',
  supplier: 'proveedor',
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function pickRole(value: string | undefined): AppRole {
  if (!value) {
    throw new Error('El token JWT no contiene el claim "role"');
  }
  const key = normalize(value);
  const role = APP_ROLES.find((r) => r === key) ?? ROLE_ALIASES[key];
  if (!role) {
    throw new Error(`El claim "role" tiene un valor desconocido: "${value}"`);
  }
  return role;
}

export function mapAccessTokenToUser(accessToken: string): AuthenticatedUser {
  const payload = decodeJwt(accessToken);
  const id = payload?.user_id != null ? String(payload.user_id) : null;
  return {
    id,
    email: payload?.email ?? null,
    role: pickRole(payload?.role),
    isAdmin: payload?.is_admin ?? false,
  };
}
