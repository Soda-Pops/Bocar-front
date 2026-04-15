type FilterSelectProps = {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
};

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 text-[var(--bocar-blue-30)]" viewBox="0 0 16 16" fill="none">
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FilterSelect({ label, onChange, options, value }: FilterSelectProps) {
  return (
    <label className="relative min-w-0">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className="h-12 w-full appearance-none rounded-[10px] border border-[var(--bocar-border)] bg-white px-4 pr-10 text-[14px] text-[var(--bocar-text)] shadow-[0_6px_14px_rgba(0,46,93,0.03)] outline-none transition focus:border-[var(--bocar-blue-70)] focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)] lg:h-9 lg:text-[13px]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
        <ChevronDownIcon />
      </span>
    </label>
  );
}
