import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

// ─── Style helpers ────────────────────────────────────────────────────────────

export function inputBaseClasses(hasError: boolean) {
  return [
    'w-full rounded-[10px] border bg-white px-3.5 py-2.5 text-[14px] text-[var(--bocar-text)] outline-none transition placeholder:text-[var(--bocar-blue-30)] disabled:bg-[#f5f7fa] disabled:cursor-not-allowed disabled:text-[var(--bocar-blue-30)]',
    hasError
      ? 'border-[rgba(170,0,15,0.34)] bg-[#fff8f8] focus:border-[var(--bocar-error)] focus:shadow-[0_0_0_3px_rgba(170,0,15,0.08)]'
      : 'border-[rgba(217,222,229,0.92)] focus:border-[var(--bocar-blue-70)] focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)]',
  ].join(' ');
}

export function getFeedbackClasses(tone: 'neutral' | 'success' | 'error') {
  if (tone === 'success')
    return 'border-[rgba(141,198,63,0.24)] bg-[rgba(141,198,63,0.12)] text-[var(--bocar-blue-100)]';
  if (tone === 'error')
    return 'border-[rgba(170,0,15,0.22)] bg-[rgba(170,0,15,0.08)] text-[var(--bocar-error)]';
  return 'border-[rgba(31,58,97,0.16)] bg-[rgba(31,58,97,0.05)] text-[var(--bocar-blue-90)]';
}

// ─── Icons ────────────────────────────────────────────────────────────────────

export function BackArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M10.5 3.5L6 8L10.5 12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path d="M6.5 8H13.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

export function ChevronDownIcon({ rotated = false }: { rotated?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-3 w-3 shrink-0 transition-transform duration-200 ${rotated ? '' : '-rotate-90'}`}
      fill="none"
      viewBox="0 0 12 12"
    >
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

// ─── Layout primitives ────────────────────────────────────────────────────────

export function FieldShell({
  children,
  error,
  hint,
  label,
  required = false,
  span = 1,
}: {
  children: ReactNode;
  error?: string;
  hint?: string;
  label: string;
  required?: boolean;
  span?: 1 | 2;
}) {
  return (
    <div className={span === 2 ? 'md:col-span-2' : undefined}>
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-70)]">
        {label}
        {required ? <span className="ml-1 text-[var(--bocar-error)]">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-2 m-0 text-[12px] leading-[1.45] text-[var(--bocar-error)]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-2 m-0 text-[12px] leading-[1.45] text-[var(--bocar-blue-50)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function SectionCard({
  children,
  subtitle,
  title,
}: {
  children: ReactNode;
  subtitle?: string;
  title: string;
}) {
  return (
    <section className="rounded-[18px] border border-[rgba(217,222,229,0.92)] bg-white shadow-[0_16px_36px_rgba(0,46,93,0.05)]">
      <div className="border-b border-[rgba(217,222,229,0.86)] px-5 py-5 sm:px-6">
        <h2 className="m-0 text-[16px] font-semibold tracking-[0.01em] text-[var(--bocar-text)]">{title}</h2>
        {subtitle ? (
          <p className="mt-2 m-0 text-[13px] leading-[1.55] text-[var(--bocar-blue-50)]">{subtitle}</p>
        ) : null}
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2">{children}</div>;
}

// ─── Form field components ─────────────────────────────────────────────────────

export function TextField({
  hint,
  label,
  name,
  placeholder,
  required = false,
  span = 1,
  type = 'text',
}: {
  hint?: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  span?: 1 | 2;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
}) {
  const { formState, getFieldState, register } = useFormContext();
  const { error } = getFieldState(name, formState);

  return (
    <FieldShell error={error?.message} hint={hint} label={label} required={required} span={span}>
      <input
        aria-invalid={Boolean(error)}
        className={inputBaseClasses(Boolean(error))}
        placeholder={placeholder}
        type={type}
        {...register(name)}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  hint,
  label,
  name,
  placeholder,
  rows = 5,
  span = 2,
}: {
  hint?: string;
  label: string;
  name: string;
  placeholder?: string;
  rows?: TextareaHTMLAttributes<HTMLTextAreaElement>['rows'];
  span?: 1 | 2;
}) {
  const { formState, getFieldState, register } = useFormContext();
  const { error } = getFieldState(name, formState);

  return (
    <FieldShell error={error?.message} hint={hint} label={label} span={span}>
      <textarea
        aria-invalid={Boolean(error)}
        className={`${inputBaseClasses(Boolean(error))} min-h-[112px] resize-y`}
        placeholder={placeholder}
        rows={rows}
        {...register(name)}
      />
    </FieldShell>
  );
}

export function YesNoToggle({ name }: { name: string }) {
  const { control, setValue } = useFormContext();
  const rawValue = useWatch({ control, name });
  const value = typeof rawValue === 'string' ? rawValue : '';

  return (
    <div className="flex gap-1.5">
      <button
        className={[
          'rounded-lg border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition',
          value === 'yes'
            ? 'border-[var(--bocar-blue-100)] bg-[var(--bocar-blue-100)] text-white'
            : 'border-[#d9dee5] bg-white text-[var(--bocar-blue-70)] hover:border-[var(--bocar-blue-70)] hover:text-[var(--bocar-blue-100)]',
        ].join(' ')}
        type="button"
        onClick={() => setValue(name, value === 'yes' ? '' : 'yes', { shouldDirty: true })}
      >
        YES
      </button>
      <button
        className={[
          'rounded-lg border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition',
          value === 'no'
            ? 'border-transparent bg-[rgba(170,0,15,0.85)] text-white'
            : 'border-[#d9dee5] bg-white text-[var(--bocar-blue-70)] hover:border-[var(--bocar-blue-70)] hover:text-[var(--bocar-blue-100)]',
        ].join(' ')}
        type="button"
        onClick={() => setValue(name, value === 'no' ? '' : 'no', { shouldDirty: true })}
      >
        NO
      </button>
    </div>
  );
}

// ─── Consideration table types ────────────────────────────────────────────────

export type ConsiderationItem = {
  id: string;
  label: string;
  noteExample?: string;
  notesAs?: 'input' | 'textarea';
  variant?: 'date';
};

export type ConsiderationGroupConfig = {
  title: string;
  subtitle: string;
  items: readonly ConsiderationItem[];
  col1Header?: string;
  col2Header?: string;
  col3Header?: string;
};

// ─── YesNoDateRow ─────────────────────────────────────────────────────────────

export function YesNoDateRow({
  label,
  name,
  notesName,
}: {
  label: string;
  name: string;
  notesName: string;
}) {
  const { control, register } = useFormContext();
  const rawChecked = useWatch({ control, name });
  const isYes = typeof rawChecked === 'string' && rawChecked === 'yes';

  return (
    <div className="grid gap-3 py-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.55fr)_minmax(0,1.85fr)] md:items-center md:gap-5">
      <div className="text-[13px] font-medium leading-[1.5] text-[var(--bocar-text)]">{label}</div>
      <YesNoToggle name={name} />
      <input
        className={inputBaseClasses(false)}
        disabled={!isYes}
        type="date"
        {...register(notesName)}
      />
    </div>
  );
}

// ─── ConsiderationTogglePage ──────────────────────────────────────────────────

export function ConsiderationTogglePage({ group }: { group: ConsiderationGroupConfig }) {
  const { register } = useFormContext();

  const col1 = group.col1Header ?? 'Entregable / requisito';
  const col2 = group.col2Header ?? 'Aplica';
  const col3 = group.col3Header ?? 'Especificaciones';

  return (
    <SectionCard subtitle={group.subtitle} title={group.title}>
      <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,0.55fr)_minmax(0,1.85fr)] gap-5 border-b border-[rgba(217,222,229,0.86)] pb-3 md:grid">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
          {col1}
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
          {col2}
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
          {col3}
        </div>
      </div>

      <div className="divide-y divide-[rgba(236,240,245,0.9)]">
        {group.items.map((item) =>
          item.variant === 'date' ? (
            <YesNoDateRow
              key={item.id}
              label={item.label}
              name={`considerations.${item.id}.checked`}
              notesName={`considerations.${item.id}.notes`}
            />
          ) : (
            <div
              key={item.id}
              className="grid gap-3 py-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.55fr)_minmax(0,1.85fr)] md:items-center md:gap-5"
            >
              <div className="text-[13px] font-medium leading-[1.5] text-[var(--bocar-text)]">
                {item.label}
              </div>
              <YesNoToggle name={`considerations.${item.id}.checked`} />
              {item.notesAs === 'textarea' ? (
                <textarea
                  className={`${inputBaseClasses(false)} resize-y`}
                  rows={2}
                  {...register(`considerations.${item.id}.notes`)}
                />
              ) : (
                <input
                  className={inputBaseClasses(false)}
                  placeholder={item.noteExample ?? ''}
                  {...register(`considerations.${item.id}.notes`)}
                />
              )}
            </div>
          )
        )}
      </div>
    </SectionCard>
  );
}
