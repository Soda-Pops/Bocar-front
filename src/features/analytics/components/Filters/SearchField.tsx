type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 text-[var(--bocar-blue-30)]" viewBox="0 0 16 16" fill="none">
      <path
        d="M7 12.5C10.0376 12.5 12.5 10.0376 12.5 7C12.5 3.96243 10.0376 1.5 7 1.5C3.96243 1.5 1.5 3.96243 1.5 7C1.5 10.0376 3.96243 12.5 7 12.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function SearchField({ value, onChange }: SearchFieldProps) {
  return (
    <label className="relative min-w-0 lg:w-[172px] lg:flex-none">
      <span className="sr-only">Search RFQ</span>
      <input
        aria-label="Search RFQ"
        className="h-12 w-full rounded-[10px] border border-[var(--bocar-border)] bg-white pl-10 pr-4 text-[14px] text-[var(--bocar-text)] shadow-[0_6px_14px_rgba(0,46,93,0.03)] outline-none transition placeholder:text-[var(--bocar-blue-30)] focus:border-[var(--bocar-blue-70)] focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)] lg:h-9 lg:text-[13px]"
        placeholder="Search..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
        <SearchIcon />
      </span>
    </label>
  );
}
