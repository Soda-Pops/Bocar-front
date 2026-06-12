export type SupplierRfqStatus = 'PENDING' | 'QUOTED' | 'DONE';

// Tabs y métricas comparten las mismas 3 categorías (mapeo 1:1):
//  - pending:    asignada sin borrador todavía.
//  - quoted:     borrador guardado, aún no enviado.
//  - historical: respuesta enviada (is_answered=True).
export type SupplierTab = 'pending' | 'quoted' | 'historical';

export type SupplierMetricKey = SupplierTab;

export type SupplierRfqRow = {
  id: string;
  desc?: string;
  assignmentId?: number;
  status: SupplierRfqStatus;
  tipo: string;
  deadline: string;
  /** Fecha límite cruda (ISO) usada como mínimo al solicitar una extensión. */
  dueDate: string;
  /** True cuando la asignación está vencida (due_date < hoy). Habilita "Request extension". */
  expired: boolean;
};

export type SupplierMetric = {
  key: SupplierMetricKey;
  label: string;
  value: string;
  valueColor: string;
};
