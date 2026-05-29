import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import type { SectionType } from './types';

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
  sectionType,
  subtitle,
  title,
}: {
  children: ReactNode;
  sectionType?: SectionType;
  subtitle?: string;
  title: string;
}) {
  return (
    <section className="rounded-[18px] border border-[rgba(217,222,229,0.92)] bg-white shadow-[0_16px_36px_rgba(0,46,93,0.05)]">
      <div className="border-b border-[rgba(217,222,229,0.86)] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 className="m-0 text-[16px] font-semibold tracking-[0.01em] text-[var(--bocar-text)]">{title}</h2>
            {subtitle ? (
              <p className="mt-2 m-0 text-[13px] leading-[1.55] text-[var(--bocar-blue-50)]">{subtitle}</p>
            ) : null}
          </div>
          {sectionType ? <SectionTypeBadge type={sectionType} /> : null}
        </div>
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
  const { formState, getFieldState, register, trigger } = useFormContext();
  const { error } = getFieldState(name, formState);
  const { onBlur, onChange, ...rest } = register(name);

  return (
    <FieldShell error={error?.message} hint={hint} label={label} required={required} span={span}>
      <input
        aria-invalid={Boolean(error)}
        className={inputBaseClasses(Boolean(error))}
        placeholder={placeholder}
        type={type}
        {...rest}
        onChange={async (e) => {
          await onChange(e);
          if (error) void trigger(name);
        }}
        onBlur={async (e) => {
          await onBlur(e);
          if (error) void trigger(name);
        }}
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
  const { formState, getFieldState, register, trigger } = useFormContext();
  const { error } = getFieldState(name, formState);
  const { onChange, ...rest } = register(name);

  return (
    <FieldShell error={error?.message} hint={hint} label={label} span={span}>
      <textarea
        aria-invalid={Boolean(error)}
        className={`${inputBaseClasses(Boolean(error))} min-h-[112px] resize-y`}
        placeholder={placeholder}
        rows={rows}
        {...rest}
        onChange={async (e) => {
          await onChange(e);
          if (error) void trigger(name);
        }}
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
        onClick={() =>
          setValue(name, value === 'yes' ? '' : 'yes', {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          })
        }
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
        onClick={() =>
          setValue(name, value === 'no' ? '' : 'no', {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          })
        }
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
  const { control, formState, getFieldState, register, trigger } = useFormContext();
  const rawChecked = useWatch({ control, name });
  const isYes = typeof rawChecked === 'string' && rawChecked === 'yes';
  const checkedError = getFieldState(name, formState).error?.message;
  const notesError = getFieldState(notesName, formState).error?.message;
  const error = checkedError ?? notesError;
  const { onChange, ...notesRegister } = register(notesName);

  return (
    <div className="py-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.55fr)_minmax(0,1.85fr)] md:items-center md:gap-5">
        <div className="text-[13px] font-medium leading-[1.5] text-[var(--bocar-text)]">{label}</div>
        <YesNoToggle name={name} />
        <input
          aria-invalid={Boolean(notesError)}
          className={inputBaseClasses(Boolean(notesError))}
          disabled={!isYes}
          type="date"
          {...notesRegister}
          onChange={async (e) => {
            await onChange(e);
            if (notesError) void trigger(notesName);
          }}
        />
      </div>
      {error ? (
        <p className="m-0 mt-2 text-[12px] leading-[1.45] text-[var(--bocar-error)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

// ─── ConsiderationTogglePage ──────────────────────────────────────────────────

// ─── Section type badge ───────────────────────────────────────────────────────

const SECTION_TYPE_META: Record<
  SectionType,
  { label: string; classes: string; dotClass: string }
> = {
  readonly: {
    label: 'Del RFQ · Solo lectura',
    classes:
      'border-[rgba(217,222,229,0.92)] bg-[#f5f7fa] text-[var(--bocar-blue-70)]',
    dotClass: 'bg-[var(--bocar-blue-30)]',
  },
  hybrid: {
    label: 'Mixta · Tú + RFQ',
    classes:
      'border-[rgba(176,135,0,0.32)] bg-[rgba(255,242,0,0.18)] text-[#7A6300]',
    dotClass: 'bg-[#C49B00]',
  },
  supplier: {
    label: 'Por completar',
    classes:
      'border-[rgba(0,46,93,0.18)] bg-[rgba(0,46,93,0.08)] text-[var(--bocar-blue-100)]',
    dotClass: 'bg-[var(--bocar-blue-100)]',
  },
};

export function SectionTypeBadge({ type }: { type: SectionType }) {
  const meta = SECTION_TYPE_META[type];
  return (
    <span
      className={[
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]',
        meta.classes,
      ].join(' ')}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </span>
  );
}

export function SidebarSectionDot({ type }: { type: SectionType }) {
  const meta = SECTION_TYPE_META[type];
  const title =
    type === 'readonly'
      ? 'Solo lectura'
      : type === 'hybrid'
        ? 'Mixta'
        : 'Por completar';
  return (
    <span
      aria-label={title}
      className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`}
      title={title}
    />
  );
}

// ─── Read-only field display ──────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3 w-3 shrink-0 text-[var(--bocar-blue-50)]"
      fill="none"
      viewBox="0 0 12 12"
    >
      <path
        d="M3 5.5V4a3 3 0 016 0v1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
      <rect
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
        width="7"
        x="2.5"
        y="5.5"
      />
    </svg>
  );
}

export function ReadOnlyField({
  hint,
  label,
  span = 1,
  value,
}: {
  hint?: string;
  label: string;
  span?: 1 | 2;
  value: ReactNode;
}) {
  const isEmpty =
    value === '' || value === null || value === undefined;
  const displayValue = isEmpty ? '—' : value;

  return (
    <div className={span === 2 ? 'md:col-span-2' : undefined}>
      <div className="mb-2 flex items-center gap-1.5">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-70)]">
          {label}
        </label>
        <LockIcon />
      </div>
      <div className="flex min-h-[42px] items-center rounded-[10px] border border-[rgba(217,222,229,0.92)] bg-[#f5f7fa] px-3.5 py-2.5 text-[14px] font-medium text-[var(--bocar-text)]">
        <span className={isEmpty ? 'text-[var(--bocar-blue-30)]' : ''}>{displayValue}</span>
      </div>
      {hint ? (
        <p className="mt-2 m-0 text-[12px] leading-[1.45] text-[var(--bocar-blue-50)]">{hint}</p>
      ) : null}
    </div>
  );
}

// ─── Subgroup separator (for hybrid sections) ─────────────────────────────────

export function HybridSubgroup({
  children,
  hint,
  title,
  tone = 'readonly',
}: {
  children: ReactNode;
  hint?: string;
  title: string;
  tone?: SectionType;
}) {
  const accent =
    tone === 'supplier'
      ? 'border-[var(--bocar-blue-100)]'
      : tone === 'hybrid'
        ? 'border-[#C49B00]'
        : 'border-[var(--bocar-blue-30)]';

  return (
    <div className="space-y-4">
      <div className={`flex items-baseline justify-between gap-3 border-l-[3px] ${accent} pl-3`}>
        <h3 className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-90)]">
          {title}
        </h3>
        {hint ? (
          <span className="text-[11px] font-medium text-[var(--bocar-blue-50)]">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

// ─── Section type info banner ─────────────────────────────────────────────────

export function SectionTypeLegend() {
  return (
    <div className="rounded-[12px] border border-[rgba(217,222,229,0.92)] bg-white p-4 shadow-[0_8px_24px_rgba(0,46,93,0.04)]">
      <p className="m-0 mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-70)]">
        Tipos de sección
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        {(['readonly', 'hybrid', 'supplier'] as const).map((t) => (
          <div key={t} className="flex items-start gap-3">
            <SectionTypeBadge type={t} />
            <p className="m-0 text-[12px] leading-[1.5] text-[var(--bocar-blue-70)]">
              {t === 'readonly'
                ? 'Datos cargados por Industrialización. No los puedes editar.'
                : t === 'hybrid'
                  ? 'Combina datos heredados del RFQ con campos que tú debes completar.'
                  : 'Información que debes capturar como proveedor para tu cotización.'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConsiderationTogglePage({ group }: { group: ConsiderationGroupConfig }) {
  const { formState, getFieldState, register, trigger } = useFormContext();

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
          ) : (() => {
            const checkedName = `considerations.${item.id}.checked`;
            const notesName = `considerations.${item.id}.notes`;
            const checkedError = getFieldState(checkedName, formState).error?.message;
            const notesError = getFieldState(notesName, formState).error?.message;
            const error = checkedError ?? notesError;
            const { onChange, ...notesRegister } = register(notesName);

            return (
              <div key={item.id} className="py-4">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.55fr)_minmax(0,1.85fr)] md:items-center md:gap-5">
                  <div className="text-[13px] font-medium leading-[1.5] text-[var(--bocar-text)]">
                    {item.label}
                  </div>
                  <YesNoToggle name={checkedName} />
                  {item.notesAs === 'textarea' ? (
                    <textarea
                      aria-invalid={Boolean(notesError)}
                      className={`${inputBaseClasses(Boolean(notesError))} resize-y`}
                      rows={2}
                      {...notesRegister}
                      onChange={async (e) => {
                        await onChange(e);
                        if (notesError) void trigger(notesName);
                      }}
                    />
                  ) : (
                    <input
                      aria-invalid={Boolean(notesError)}
                      className={inputBaseClasses(Boolean(notesError))}
                      placeholder={item.noteExample ?? ''}
                      {...notesRegister}
                      onChange={async (e) => {
                        await onChange(e);
                        if (notesError) void trigger(notesName);
                      }}
                    />
                  )}
                </div>
                {error ? (
                  <p className="m-0 mt-2 text-[12px] leading-[1.45] text-[var(--bocar-error)]" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
            );
          })()
        )}
      </div>
    </SectionCard>
  );
}
