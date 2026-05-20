import { ROUTES } from '@/app/config/routes';
import type { AppRole } from '@/features/auth/types';

export function resolveHomeRouteForRole(role: AppRole): string {
  if (role === 'compras') return ROUTES.PURCHASING.DASHBOARD;
  if (role === 'proveedor') return ROUTES.SUPPLIER.DASHBOARD;
  return ROUTES.INDUSTRIALIZATION.DASHBOARD;
}
