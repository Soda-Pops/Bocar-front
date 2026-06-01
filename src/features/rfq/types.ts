// Not used by active screens yet; reserved for future integration.
export type SectionKey = 'borradores' | 'revision' | 'activas' | 'historicas';

export type SummaryCard = {
  label: string;
  value: string;
  key: SectionKey;
};

export type Row = string[];

export type Section = {
  title: string;
  key: SectionKey;
  headers: string[];
  rows: Row[];
};

export const statusValues = ['Review', 'Pending', 'Done'] as const;

export type StatusValue = (typeof statusValues)[number];

export type SectionStyle = {
  badge: string;
  dot: string;
  soft: string;
};
