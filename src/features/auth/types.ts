export type AccessMode = 'internal' | 'supplier';
export type PreviewVariant = 'default' | 'error' | 'expired';

export const APP_ROLES = ['industrializacion', 'compras', 'proveedor'] as const;
export type AppRole = (typeof APP_ROLES)[number];

export type AuthenticatedUser = {
  id: string | null;
  email: string | null;
  role: AppRole;
  isAdmin: boolean;
};
