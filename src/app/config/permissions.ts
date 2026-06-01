// Not used by active screens yet; reserved for future integration.
export const ROLE_PERMISSIONS = {
  industrializacion: ['rfq:create', 'rfq:view'],
  compras: ['rfq:view', 'supplier:view'],
  proveedor: ['quotation:create', 'quotation:view'],
} as const;

export type AppRole = keyof typeof ROLE_PERMISSIONS;
export type AppPermission = (typeof ROLE_PERMISSIONS)[AppRole][number];
