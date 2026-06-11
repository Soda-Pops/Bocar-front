import type { RfqTipo } from '@/features/analytics/types';
import { getRfqDetail } from '@/features/rfq/services/rfqLifecycleService';
import type { AiPredictionInput } from '@/features/rfq/services/iaPredictionService';
import type { RfqStatus } from '@/features/rfq/state/rfqStateMachine';
import { parseId } from '@/shared/utils/rfqId';

export type RfqSpecField = {
  code: string;
  label: string;
  value: string;
};

export type RfqUploadedFile = {
  id?: number;
  name: string;
  url: string;
  uploadedAt?: string;
};

export type RfqSupplier = {
  backendId?: number;
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
  predictionInput?: AiPredictionInput;
};

const BASE_SPECS: RfqSpecField[] = [
  { code: 'DESC', label: 'Description', value: 'Product / E-PCP Folio' },
  { code: 'CUST', label: 'Customer', value: 'GM Mexico' },
  { code: 'PPY', label: 'Parts per year', value: '120,000' },
  { code: 'PT', label: 'Part Technology', value: 'POWERTRAIN' },
];

const BASE_FILES: RfqUploadedFile[] = [
  { name: 'motor_drawing.stp', url: '#' },
  { name: 'quotation.ppt', url: '#' },
  { name: 'specifications.pdf', url: '#' },
];

const BASE_SUPPLIERS: RfqSupplier[] = [
  {
    name: 'PLASTIMEX',
    category: 'Plastic Injection',
    contact: 'Laura Gomez',
    score: '92',
    scoreTone: 'success',
    status: 'Selected',
  },
  {
    name: 'RAMCO',
    category: 'Metal Machining',
    contact: 'Juan Perez',
    score: '100',
    scoreTone: 'success',
    status: 'Selected',
  },
  {
    name: 'HERTOLAB',
    category: 'Components',
    contact: 'Sofia Ruiz',
    score: '72',
    scoreTone: 'warning',
    status: 'Selected',
  },
];

const BASE_BENCHMARK: RfqBenchmarkRow[] = [
  { supplier: 'PLASTIMEX', price: '$1250', time: '4 days', quality: '4.9', score: '92', scoreTone: 'success' },
  { supplier: 'RAMCO', price: '$1100', time: '7 days', quality: '3.8', score: '70', scoreTone: 'warning' },
  { supplier: 'HERTOLAB', price: '$1350', time: '7 days', quality: '4.0', score: '50', scoreTone: 'danger' },
];

// 9 mock RFQs — one per state for QA
const MOCK_RFQS: RfqDetail[] = [
  {
    id: 'RFQ-001',
    title: 'Injection mold for motor housing',
    material: 'Steel',
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
    title: 'Aluminum transmission component',
    material: 'Aluminum',
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
    title: 'Front suspension bracket',
    material: 'Galvanized steel',
    client: 'Ford Mexico',
    createdBy: 'Luis Torres',
    createdById: 'user-luis',
    createdAt: '10/04/2026',
    status: 'PENDING_EDIT_REQUEST',
    deadline: '28/04/2026',
    editRequest: {
      requestedBy: 'Luis Torres',
      requestedAt: '20/04/2026',
      reason: 'Error in the dimensions of the attached drawing. Dimensions must be corrected before quoting.',
    },
    specs: BASE_SPECS,
    files: BASE_FILES,
    suppliers: [],
    benchmark: [],
  },
  {
    id: 'RFQ-004',
    title: 'Thermoplastic engine cover',
    material: 'Plastic ABS',
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
    title: 'Timing chain tensioner',
    material: 'Steel',
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
    title: 'Radiator mounting bracket',
    material: 'Aluminum',
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
    title: 'Gearbox cover',
    material: 'Zinc die casting',
    client: 'Honda MX',
    createdBy: 'Jorge Pena',
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
    title: 'Stamped alternator pulley',
    material: 'Stainless steel',
    client: 'Volkswagen MX',
    createdBy: 'Sandra Lara',
    createdById: 'user-sandra',
    createdAt: '01/03/2026',
    status: 'CLOSED',
    closedAt: '15/04/2026',
    closedBy: 'Admin Purchasing',
    totalSuppliers: 3,
    quotedCount: 4,
    specs: BASE_SPECS,
    files: BASE_FILES,
    suppliers: BASE_SUPPLIERS,
    benchmark: BASE_BENCHMARK,
  },
  {
    id: 'RFQ-009',
    title: 'Assembled gear shift lever',
    material: 'Plastic PP',
    client: 'Stellantis MX',
    createdBy: 'Roberto Diaz',
    createdById: 'user-roberto',
    createdAt: '20/03/2026',
    status: 'CANCELLED',
    cancellation: {
      cancelledBy: 'Admin Industrialization',
      cancelledAt: '10/04/2026',
      reason: 'Project frozen by customer decision until further notice.',
      isLateCancellation: false,
    },
    specs: BASE_SPECS,
    files: BASE_FILES,
    suppliers: [],
    benchmark: [],
  },
  {
    id: 'RFQ-021',
    title: 'Trim die for side sill bracket',
    material: 'Aluminum',
    client: 'GM Mexico',
    createdBy: 'Purchasing Admin',
    createdById: 'user-compras-admin',
    createdAt: '18/06/2024',
    status: 'QUOTING',
    deadline: '20/06/2024',
    daysRemaining: 2,
    totalSuppliers: 3,
    quotedCount: 0,
    specs: [
      { code: 'DESC', label: 'Description', value: 'Trim die quotation package' },
      { code: 'CUST', label: 'Customer', value: 'GM Mexico' },
      { code: 'PPY', label: 'Parts per year', value: '90,000' },
      { code: 'PT', label: 'Part Technology', value: 'TRIMMING' },
    ],
    files: BASE_FILES,
    suppliers: BASE_SUPPLIERS,
    benchmark: [],
  },
  {
    id: 'RFQ-022',
    title: 'Mold for console insert',
    material: 'Plastic PP',
    client: 'Stellantis MX',
    createdBy: 'Purchasing Admin',
    createdById: 'user-compras-admin',
    createdAt: '19/06/2024',
    status: 'QUOTING',
    deadline: '22/06/2024',
    daysRemaining: 4,
    totalSuppliers: 3,
    quotedCount: 0,
    specs: BASE_SPECS,
    files: BASE_FILES,
    suppliers: BASE_SUPPLIERS,
    benchmark: [],
  },
  {
    id: 'RFQ-023',
    title: 'Mold for battery tray cover',
    material: 'Plastic ABS',
    client: 'Ford Mexico',
    createdBy: 'Purchasing Admin',
    createdById: 'user-compras-admin',
    createdAt: '20/06/2024',
    status: 'QUOTING',
    deadline: '28/06/2024',
    daysRemaining: 8,
    totalSuppliers: 3,
    quotedCount: 0,
    specs: BASE_SPECS,
    files: BASE_FILES,
    suppliers: BASE_SUPPLIERS,
    benchmark: [],
  },
];

const MOCK_MAP: Record<string, RfqDetail> = Object.fromEntries(
  MOCK_RFQS.map((rfq) => [rfq.id.toUpperCase(), rfq]),
);

export async function getRfqDetailById(id: string, tipo: RfqTipo = 'Mold'): Promise<RfqDetail> {
  return getRfqDetail(tipo, parseId(id));
}
