
type DashboardMetricCardProps<TMetricKey extends string> = {
  isActive: boolean;
  metric: {
    key: TMetricKey;
    label: string;
    value: string;
    valueColor: string;
  };
  onSelect: (key: TMetricKey) => void;
};

export function DashboardMetricCard<TMetricKey extends string>({
  isActive,
  metric,
  onSelect,
}: DashboardMetricCardProps<TMetricKey>) {
  return (
    <button
      type="button"
      onClick={() => onSelect(metric.key)}
      className={[
        'relative flex min-h-[96px] h-full w-full flex-col rounded-[12px] border bg-white px-5 py-4 text-left transition lg:min-h-[74px] lg:px-4 lg:py-3',
        isActive
          ? 'border-[var(--bocar-blue-100)] shadow-[0_12px_28px_rgba(0,46,93,0.08)]'
          : 'border-[var(--bocar-border)] shadow-[0_8px_18px_rgba(0,46,93,0.04)] hover:border-[var(--bocar-blue-30)]',
      ].join(' ')}
    >
      <span className="relative z-10 text-[12px] font-medium uppercase tracking-[0.035em] text-[var(--bocar-text)] lg:text-[11px]">
        {metric.label}
      </span>
      <span
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[58px] font-light leading-none lg:text-[48px]"
        style={{ color: metric.valueColor }}
      >
        {metric.value}
      </span>
    </button>
  );
}
