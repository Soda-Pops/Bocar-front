import { statusValues, type SectionKey, type StatusValue, type SummaryCard } from '@/features/rfq/types';

// No se usa en las pantallas activas por ahora; reservado para integracion futura.

export { statusValues };

export function isStatusValue(value: string): value is StatusValue {
  return statusValues.includes(value as StatusValue);
}

// Keeps selection lookups in one place so components stay focused on rendering.
export function getSectionSummary(summaryCards: SummaryCard[], key: SectionKey) {
  return summaryCards.find((card) => card.key === key);
}
