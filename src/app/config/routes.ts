export const ROUTES = {
  AUTH: {
    // Programada: LoginPage existe actualmente en la ruta raiz.
    LOGIN: '/',
    // Falta por programar: documentada como LoginPage canonica en SCREENS_AND_FLOWS.md.
    LOGIN_CANONICAL: '/login',
    // Falta por programar: cierre del flujo SSO/AD interno.
    CALLBACK: '/auth/callback',
    // Falta por programar: error de permisos por rol o permiso insuficiente.
    UNAUTHORIZED: '/401',
    // Falta por programar: pagina para rutas no encontradas.
    NOT_FOUND: '/404',
    // Falta por programar: pagina de error recuperable de servidor.
    SERVER_ERROR: '/500',
  },
  INDUSTRIALIZATION: {
    // Programada: dashboard principal de Industrializacion.
    DASHBOARD: '/industrializacion/dashboard',
    // Falta por programar: lista completa de RFQs; hoy esta fusionada visualmente con el dashboard.
    RFQ_LIST: '/industrializacion/rfq',
    // Programada: creacion de RFQ.
    RFQ_CREATE: '/industrializacion/rfq/crear',
    // Programada: detalle de RFQ con pantalla compartida.
    RFQ_DETAIL: '/industrializacion/rfq/:id',
    // Programada: edicion de RFQ reutilizando el workspace de creacion.
    RFQ_EDIT: '/industrializacion/rfq/:id/editar',
    // Falta por programar: prediccion de costo estimado.
    PREDICTION: '/industrializacion/prediccion',
    // Falta por programar: analytics/KPIs propios del rol.
    ANALYTICS: '/industrializacion/analytics',
    // Falta por programar: home/bandeja de aprobaciones del Super Usuario de Industrializacion.
    ADMIN_DASHBOARD: '/industrializacion/admin',
    // Falta por programar: gestion de solicitudes de cambio tecnico.
    ADMIN_REQUESTS: '/industrializacion/admin/solicitudes',
  },
  PURCHASING: {
    // Falta por programar: dashboard operativo de Compras.
    DASHBOARD: '/compras/dashboard',
    // Falta por programar: listado de RFQs de Compras.
    RFQ_LIST: '/compras/rfq',
    // Programada: detalle de RFQ con pantalla compartida.
    RFQ_DETAIL: '/compras/rfq/:id',
    // Programada: detalle completo en el workspace del formulario (solo lectura).
    RFQ_DETAIL_FULL: '/compras/rfq/:id/completo',
    // Programada: seleccion/asignacion de proveedores.
    RFQ_ASSIGN_SUPPLIERS: '/compras/rfq/:id/asignar',
    // Falta por programar: benchmark interno de cotizaciones por RFQ.
    BENCHMARK: '/compras/benchmark/:rfqId',
    // Falta por programar: analytics/KPIs de Compras.
    ANALYTICS: '/compras/analytics',
    // Falta por programar: explorador operativo de proveedores para seleccion.
    SUPPLIER_CATALOG: '/compras/proveedores',
    // Falta por programar: home/bandeja admin de Compras.
    ADMIN_DASHBOARD: '/compras/admin',
    // Falta por programar: administracion del catalogo maestro de proveedores.
    ADMIN_SUPPLIERS: '/compras/admin/proveedores',
    // Falta por programar: cola de solicitudes de desbloqueo de cotizacion.
    ADMIN_UNLOCK_REQUESTS: '/compras/admin/desbloqueos',
  },
  SUPPLIER: {
    // Programada: placeholder de bienvenida para el area de proveedor.
    DASHBOARD: '/proveedor/dashboard',
    // Falta por programar: listado de RFQs asignadas al proveedor.
    RFQ_LIST: '/proveedor/rfq',
    // Programada: detalle de RFQ con pantalla compartida.
    RFQ_DETAIL: '/proveedor/rfq/:id',
    // Falta por programar: formulario para enviar cotizacion de una RFQ.
    QUOTATION_CREATE: '/proveedor/rfq/:rfqId/cotizar',
    // Falta por programar: historial/listado de cotizaciones del proveedor.
    QUOTATION_LIST: '/proveedor/cotizaciones',
    // Programada: detalle de cotizacion con pantalla compartida.
    QUOTATION_DETAIL: '/proveedor/cotizaciones/:id',
  },
} as const;

export function buildIndustrializationRfqEditRoute(id: string) {
  return `/industrializacion/rfq/${id}/editar`;
}
