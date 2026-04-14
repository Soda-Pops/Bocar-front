export const ROUTES = {
  AUTH: {
    LOGIN: '/',
  },
  INDUSTRIALIZATION: {
    DASHBOARD: '/industrializacion/dashboard',
    RFQ_CREATE: '/industrializacion/rfq/crear',
    RFQ_DETAIL: '/industrializacion/rfq/:id',
    RFQ_EDIT: '/industrializacion/rfq/:id/editar',
  },
  PURCHASING: {
    RFQ_LIST: '/compras/rfq',
    RFQ_DETAIL: '/compras/rfq/:id',
    RFQ_ASSIGN_SUPPLIERS: '/compras/rfq/:id/asignar',
  },
  SUPPLIER: {
    RFQ_LIST: '/proveedor/rfq',
    RFQ_DETAIL: '/proveedor/rfq/:id',
    QUOTATION_LIST: '/proveedor/cotizaciones',
    QUOTATION_DETAIL: '/proveedor/cotizaciones/:id',
  },
} as const;

export function buildIndustrializationRfqEditRoute(id: string) {
  return `/industrializacion/rfq/${id}/editar`;
}
