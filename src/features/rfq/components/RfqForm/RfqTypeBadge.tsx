import type { RfqTipo } from '@/features/analytics/types';

type RfqTypeBadgeProps = {
  tipo: RfqTipo;
  className?: string;
};

const TIPO_STYLES: Record<RfqTipo, { container: string; dot: string }> = {
  Trimming: {
    container: 'bg-[rgba(0,46,93,0.08)] text-[var(--bocar-blue-100)]',
    dot: 'bg-[var(--bocar-blue-100)]',
  },
  Mold: {
    container: 'bg-[rgba(141,198,63,0.16)] text-[var(--bocar-done)]',
    dot: 'bg-[var(--bocar-done)]',
  },
};

export function RfqTypeBadge({ tipo, className = '' }: RfqTypeBadgeProps) {
  const styles = TIPO_STYLES[tipo];

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]',
        styles.container,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {tipo}
    </span>
  );
}
