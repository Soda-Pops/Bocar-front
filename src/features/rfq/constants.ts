import type { Section, SectionKey, SectionStyle, SummaryCard } from '@/features/rfq/types';

// No se usa en las pantallas activas por ahora; reservado para integracion futura.

// Centralized dashboard content so future API wiring only replaces this module.
export const menuItems = [
  'CREAR RFQs',
  'BORRADORES',
  'ESPERA DE AUTORIZACIÓN',
  'ACTIVAS',
  'HISTÓRICAS',
] as const;

export const sectionDescriptions: Record<SectionKey, string> = {
  borradores: 'RFQs listas para edición y preparación antes de su envío.',
  revision: 'Solicitudes pendientes de autorización con foco en decisión rápida.',
  activas: 'Procesos abiertos con seguimiento operativo y fecha visible.',
  historicas: 'Consultas cerradas para auditoría, referencia y trazabilidad.',
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
  { label: 'RFQs BORRADORES', value: '2', key: 'borradores' },
  { label: 'RFQs EN REVISIÓN', value: '2', key: 'revision' },
  { label: 'RFQs ACTIVAS', value: '3', key: 'activas' },
  { label: 'RFQs PASADAS', value: '10', key: 'historicas' },
];

export const sections: Section[] = [
  {
    title: 'BORRADORES',
    key: 'borradores',
    headers: ['ID', 'MATERIAL', 'CREADO POR', 'ACCIÓN'],
    rows: [
      ['RFQ-004', 'Acero', 'Luis Gómez', 'Editar'],
      ['RFQ-003', 'Aluminio', 'Valeria Perez', 'Editar'],
    ],
  },
  {
    title: 'ESPERA DE AUTORIZACIÓN',
    key: 'revision',
    headers: ['ID', 'SOLICITANTE', 'ESTADO', 'ACCIÓN'],
    rows: [
      ['RFQ-002', 'Ana Perez', 'Review', 'Ver'],
      ['RFQ-001', 'Juan Ruiz', 'Review', 'Ver'],
    ],
  },
  {
    title: 'ACTIVAS',
    key: 'activas',
    headers: ['ID', 'MATERIAL', 'ESTADO', 'FECHA', 'ACCIÓN'],
    rows: [
      ['RFQ-004', 'Plastico', 'Pending', '16/04/2026', 'Ver'],
      ['RFQ-003', 'Aluminio', 'Pending', '14/04/2026', 'Ver'],
    ],
  },
  {
    title: 'HISTÓRICAS',
    key: 'historicas',
    headers: ['ID', 'PROVEEDOR', 'ESTADO', 'FECHA', 'ACCIÓN'],
    rows: [
      ['RFQ-002', 'Magna', 'Done', '15/03/2026', 'Ver'],
      ['RFQ-001', 'Bosch', 'Done', '12/03/2026', 'Ver'],
    ],
  },
];
