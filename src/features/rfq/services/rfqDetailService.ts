import type { RfqStatus } from '@/features/rfq/state/rfqStateMachine';

export type RfqSpecField = {
  code: string;
  label: string;
  value: string;
};

export type RfqUploadedFile = {
  name: string;
};

export type RfqSupplier = {
  name: string;
  category: string;
  contact: string;
  score: string;
  scoreTone: 'success' | 'warning' | 'danger';
  status: string;
};

export type RfqBenchmarkRow = {
  supplier: string;
  price: string;
  time: string;
  quality: string;
  score: string;
  scoreTone: 'success' | 'warning' | 'danger';
};

export type RfqEditRequest = {
  requestedBy: string;
  requestedAt: string;
  reason: string;
};

export type RfqCancellation = {
  cancelledBy: string;
  cancelledAt: string;
  reason: string;
  replacementRfqId?: string;
  isLateCancellation: boolean;
};

export type RfqDetail = {
  id: string;
  title: string;
  material: string;
  client: string;
  createdBy: string;
  createdById: string;
  createdAt: string;
  status: RfqStatus;
  deadline?: string;
  daysRemaining?: number;
  quotedCount?: number;
  totalSuppliers?: number;
  editRequest?: RfqEditRequest;
  cancellation?: RfqCancellation;
  closedAt?: string;
  closedBy?: string;
  specs: RfqSpecField[];
  files: RfqUploadedFile[];
  suppliers: RfqSupplier[];
  benchmark: RfqBenchmarkRow[];
};

const BASE_SPECS: RfqSpecField[] = [
  { code: 'DESC', label: 'Descripcion', value: 'Product / E-PCP Folio' },
  { code: 'CUST', label: 'Cliente', value: 'GM Mexico' },
  { code: 'PPY', label: 'Piezas por año', value: '120,000' },
  { code: 'PT', label: 'Part Technology', value: 'POWERTRAIN' },
];

const BASE_FILES: RfqUploadedFile[] = [
  { name: 'plano_motor.stp' },
  { name: 'cotizacion.ppt' },
  { name: 'especificaciones.pdf' },
];

const BASE_SUPPLIERS: RfqSupplier[] = [
  {
    name: 'PLASTIMEX',
    category: 'Inyeccion Plastica',
    contact: 'Laura Gomez',
    score: '92',
    scoreTone: 'success',
    status: 'Seleccionado',
  },
  {
    name: 'RAMCO',
    category: 'Metalmecanica',
    contact: 'Juan Perez',
    score: '100',
    scoreTone: 'success',
    status: 'Seleccionado',
  },
  {
    name: 'HERTOLAB',
    category: 'Componentes',
    contact: 'Sofia Ruiz',
    score: '72',
    scoreTone: 'warning',
    status: 'Seleccionado',
  },
];

const BASE_BENCHMARK: RfqBenchmarkRow[] = [
  { supplier: 'PLASTIMEX', price: '$1250', time: '4 dias', quality: '4.9', score: '92', scoreTone: 'success' },
  { supplier: 'RAMCO', price: '$1100', time: '7 dias', quality: '3.8', score: '70', scoreTone: 'warning' },
  { supplier: 'HERTOLAB', price: '$1350', time: '7 dias', quality: '4.0', score: '50', scoreTone: 'danger' },
];

// 9 mock RFQs — one per state for QA
const MOCK_RFQS: RfqDetail[] = [
  {
    id: 'RFQ-001',
    title: 'Molde de inyección para carcasa de motor',
    material: 'Acero',
    client: 'GM Mexico',
    createdBy: 'Ricardo Soto',
    createdById: 'user-ricardo',
    createdAt: '12/04/2026',
    status: 'DRAFT',
    specs: BASE_SPECS,
    files: BASE_FILES,
    suppliers: [],
    benchmark: [],
  },
  {
    id: 'RFQ-002',
    title: 'Componente de transmisión aluminio',
    material: 'Aluminio',
    client: 'Stellantis MX',
    createdBy: 'Ana Mendez',
    createdById: 'user-ana',
    createdAt: '14/04/2026',
    status: 'PENDING',
    deadline: '30/04/2026',
    specs: BASE_SPECS,
    files: BASE_FILES,
    suppliers: [],
    benchmark: [],
  },
  {
    id: 'RFQ-003',
    title: 'Soporte de suspensión delantera',
    material: 'Acero galvanizado',
    client: 'Ford Mexico',
    createdBy: 'Luis Torres',
    createdById: 'user-luis',
    createdAt: '10/04/2026',
    status: 'PENDING_EDIT_REQUEST',
    deadline: '28/04/2026',
    editRequest: {
      requestedBy: 'Luis Torres',
      requestedAt: '20/04/2026',
      reason: 'Error en las dimensiones del plano adjunto. Se requiere corregir cotas antes de cotizar.',
    },
    specs: BASE_SPECS,
    files: BASE_FILES,
    suppliers: [],
    benchmark: [],
  },
  {
    id: 'RFQ-004',
    title: 'Cubierta de motor termoplástico',
    material: 'Plastico ABS',
    client: 'GM Mexico',
    createdBy: 'Valeria Cruz',
    createdById: 'user-valeria',
    createdAt: '05/04/2026',
    status: 'QUOTING',
    deadline: '02/05/2026',
    daysRemaining: 4,
    totalSuppliers: 3,
    quotedCount: 0,
    specs: BASE_SPECS,
    files: BASE_FILES,
    suppliers: BASE_SUPPLIERS,
    benchmark: [],
  },
  {
    id: 'RFQ-005',
    title: 'Tensor de cadena de distribución',
    material: 'Acero',
    client: 'Nissan MX',
    createdBy: 'Carlos Reyes',
    createdById: 'user-carlos',
    createdAt: '01/04/2026',
    status: 'PARTIALLY_QUOTED',
    deadline: '29/04/2026',
    daysRemaining: 1,
    totalSuppliers: 3,
    quotedCount: 2,
    specs: BASE_SPECS,
    files: BASE_FILES,
    suppliers: BASE_SUPPLIERS,
    benchmark: [],
  },
  {
    id: 'RFQ-006',
    title: 'Bracket de fijación de radiador',
    material: 'Aluminio',
    client: 'Toyota MX',
    createdBy: 'Maria Gutierrez',
    createdById: 'user-maria',
    createdAt: '18/03/2026',
    status: 'BENCHMARK_READY',
    deadline: '15/04/2026',
    totalSuppliers: 3,
    quotedCount: 3,
    specs: BASE_SPECS,
    files: BASE_FILES,
    suppliers: BASE_SUPPLIERS,
    benchmark: BASE_BENCHMARK,
  },
  {
    id: 'RFQ-007',
    title: 'Cubierta de caja de cambios',
    material: 'Fundicion zinc',
    client: 'Honda MX',
    createdBy: 'Jorge Peña',
    createdById: 'user-jorge',
    createdAt: '10/03/2026',
    status: 'EXPIRED',
    deadline: '10/04/2026',
    totalSuppliers: 3,
    quotedCount: 1,
    specs: BASE_SPECS,
    files: BASE_FILES,
    suppliers: BASE_SUPPLIERS,
    benchmark: [],
  },
  {
    id: 'RFQ-008',
    title: 'Polea de alternador stamped',
    material: 'Acero inoxidable',
    client: 'Volkswagen MX',
    createdBy: 'Sandra Lara',
    createdById: 'user-sandra',
    createdAt: '01/03/2026',
    status: 'CLOSED',
    closedAt: '15/04/2026',
    closedBy: 'Admin Compras',
    totalSuppliers: 3,
    quotedCount: 4,
    specs: BASE_SPECS,
    files: BASE_FILES,
    suppliers: BASE_SUPPLIERS,
    benchmark: BASE_BENCHMARK,
  },
  {
    id: 'RFQ-009',
    title: 'Palanca de velocidades ensamblada',
    material: 'Plastico PP',
    client: 'Stellantis MX',
    createdBy: 'Roberto Diaz',
    createdById: 'user-roberto',
    createdAt: '20/03/2026',
    status: 'CANCELLED',
    cancellation: {
      cancelledBy: 'Admin Industrialización',
      cancelledAt: '10/04/2026',
      reason: 'Proyecto congelado por decisión del cliente hasta nuevo aviso.',
      isLateCancellation: false,
    },
    specs: BASE_SPECS,
    files: BASE_FILES,
    suppliers: [],
    benchmark: [],
  },
];

const MOCK_MAP: Record<string, RfqDetail> = Object.fromEntries(
  MOCK_RFQS.map((rfq) => [rfq.id.toUpperCase(), rfq]),
);

export function getRfqDetailById(id: string): RfqDetail {
  const normalized = id.toUpperCase();
  return (
    MOCK_MAP[normalized] ?? {
      ...MOCK_RFQS[3],
      id: normalized,
    }
  );
}
