export const ROUTES = {
  AUTH: {
    LOGIN: '/',
  },
  INDUSTRIALIZATION: {
    DASHBOARD: '/industrializacion/dashboard',
    RFQ_CREATE: '/industrializacion/rfq/crear',
    RFQ_EDIT: '/industrializacion/rfq/:id/editar',
  },
} as const;

export function buildIndustrializationRfqEditRoute(id: string) {
  return `/industrializacion/rfq/${id}/editar`;
}
