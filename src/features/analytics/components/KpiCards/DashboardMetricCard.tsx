
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
        'flex min-h-[96px] flex-col justify-between rounded-[12px] border bg-white px-5 py-4 text-left transition lg:min-h-[74px] lg:px-4 lg:py-2.5',
        isActive
          ? 'border-[var(--bocar-blue-100)] shadow-[0_12px_28px_rgba(0,46,93,0.08)]'
          : 'border-[var(--bocar-border)] shadow-[0_8px_18px_rgba(0,46,93,0.04)] hover:border-[var(--bocar-blue-30)]',
      ].join(' ')}
    >
      <span className="text-[12px] font-medium uppercase tracking-[0.035em] text-[var(--bocar-text)] lg:text-[11px]">
        {metric.label}
      </span>
      <span
        className="self-center text-[52px] font-light leading-none tracking-[-0.05em] lg:text-[38px]"
        style={{ color: metric.valueColor }}
      >
        {metric.value}
      </span>
    </button>
  );
}
