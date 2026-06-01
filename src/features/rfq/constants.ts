import type { Section, SectionKey, SectionStyle, SummaryCard } from '@/features/rfq/types';

// Not used by active screens yet; reserved for future integration.

// Centralized dashboard content so future API wiring only replaces this module.
export const menuItems = [
  'CREATE RFQs',
  'DRAFTS',
  'AWAITING AUTHORIZATION',
  'ACTIVE',
  'HISTORICAL',
] as const;

export const sectionDescriptions: Record<SectionKey, string> = {
  borradores: 'RFQs ready for editing and preparation before submission.',
  revision: 'Requests pending authorization with a focus on rapid decisions.',
  activas: 'Open processes with operational tracking and visible dates.',
  historicas: 'Closed requests for audit, reference, and traceability.',
};

export const sectionStyles: Record<SectionKey, SectionStyle> = {
  borradores: {
    badge: 'bg-slate-100 text-slate-700',
    dot: 'bg-slate-500',
    soft: 'bg-slate-50',
  },
  revision: {
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    soft: 'bg-amber-50',
  },
  activas: {
    badge: 'bg-yellow-100 text-yellow-700',
    dot: 'bg-yellow-500',
    soft: 'bg-yellow-50',
  },
  historicas: {
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    soft: 'bg-emerald-50',
  },
};

export const summaryCards: SummaryCard[] = [
  { label: 'DRAFT RFQs', value: '2', key: 'borradores' },
  { label: 'RFQs UNDER REVIEW', value: '2', key: 'revision' },
  { label: 'ACTIVE RFQs', value: '3', key: 'activas' },
  { label: 'PAST RFQs', value: '10', key: 'historicas' },
];

export const sections: Section[] = [
  {
    title: 'DRAFTS',
    key: 'borradores',
    headers: ['ID', 'MATERIAL', 'CREATED BY', 'ACTION'],
    rows: [
      ['RFQ-004', 'Steel', 'Luis Gomez', 'Edit'],
      ['RFQ-003', 'Aluminum', 'Valeria Perez', 'Edit'],
    ],
  },
  {
    title: 'AWAITING AUTHORIZATION',
    key: 'revision',
    headers: ['ID', 'REQUESTER', 'STATUS', 'ACTION'],
    rows: [
      ['RFQ-002', 'Ana Perez', 'Review', 'View'],
      ['RFQ-001', 'Juan Ruiz', 'Review', 'View'],
    ],
  },
  {
    title: 'ACTIVE',
    key: 'activas',
    headers: ['ID', 'MATERIAL', 'STATUS', 'DATE', 'ACTION'],
    rows: [
      ['RFQ-004', 'Plastic', 'Pending', '16/04/2026', 'View'],
      ['RFQ-003', 'Aluminum', 'Pending', '14/04/2026', 'View'],
    ],
  },
  {
    title: 'HISTORICAL',
    key: 'historicas',
    headers: ['ID', 'SUPPLIER', 'STATUS', 'DATE', 'ACTION'],
    rows: [
      ['RFQ-002', 'Magna', 'Done', '15/03/2026', 'View'],
      ['RFQ-001', 'Bosch', 'Done', '12/03/2026', 'View'],
    ],
  },
];
