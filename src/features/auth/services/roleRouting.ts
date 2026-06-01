import { ROUTES } from '@/app/config/routes';
import type { AppRole } from '@/features/auth/types';

export function resolveHomeRouteForRole(role: AppRole, isAdmin = false): string {
  if (role === 'industrializacion' && isAdmin) return ROUTES.INDUSTRIALIZATION.ADMIN_DASHBOARD;
  if (role === 'compras' && isAdmin) return ROUTES.PURCHASING.ADMIN_DASHBOARD;
  if (role === 'compras') return ROUTES.PURCHASING.DASHBOARD;
  if (role === 'proveedor') return ROUTES.SUPPLIER.DASHBOARD;
  return ROUTES.INDUSTRIALIZATION.DASHBOARD;
}
