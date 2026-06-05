import type { RfqActionDescriptor, RfqActionKey } from '@/features/rfq/state/rfqStateMachine';

type RfqActionBarProps = {
  actions: RfqActionDescriptor[];
  onAction: (key: RfqActionKey) => void;
  disabled?: boolean;
};

function ActionIcon({ icon }: { icon: RfqActionDescriptor['icon'] }) {
  switch (icon) {
    case 'edit':
      return (
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10.5 2.5l3 3-7.5 7.5H3v-3l7.5-7.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case 'send':
      return (
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M13.5 2.5L2 6.5l4.5 2 2 4.5 5-10.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M6.5 8.5l2.5-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'trash':
      return (
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 4.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M6 4.5V3h4v1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 4.5l.6 8h4.8l.6-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'check':
      return (
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'x':
      return (
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'clock':
      return (
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 5V8.5L10.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

const TONE_STYLES: Record<RfqActionDescriptor['tone'], string> = {
  primary:
    'bg-[var(--bocar-blue-100)] text-white border-[var(--bocar-blue-100)] hover:bg-[var(--bocar-blue-90)] hover:border-[var(--bocar-blue-90)]',
  secondary:
    'bg-white text-[var(--bocar-blue-100)] border-[var(--bocar-blue-100)] hover:bg-[rgba(0,46,93,0.06)]',
  destructive:
    'bg-white text-[var(--bocar-error)] border-[rgba(170,0,15,0.45)] hover:bg-[rgba(170,0,15,0.06)]',
  warning:
    'bg-white text-[#7a4f00] border-[rgba(200,140,0,0.5)] hover:bg-[rgba(200,140,0,0.07)]',
};

export function RfqActionBar({ actions, onAction, disabled = false }: RfqActionBarProps) {
  if (actions.length === 0) return null;

  const mainActions = actions.filter((a) => a.tone !== 'destructive');
  const destructiveActions = actions.filter((a) => a.tone === 'destructive');

  const renderBtn = (a: RfqActionDescriptor) => (
    <button
      key={a.key}
      type="button"
      disabled={disabled || a.disabled}
      onClick={() => onAction(a.key)}
      title={a.disabled ? a.disabledReason : undefined}
      className={[
        'inline-flex items-center rounded-[6px] border px-4 py-2 text-[13px] font-semibold transition',
        'disabled:cursor-not-allowed disabled:opacity-50',
        TONE_STYLES[a.tone],
      ].join(' ')}
    >
      {a.label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {mainActions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {mainActions.map(renderBtn)}
        </div>
      )}
      {destructiveActions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {destructiveActions.map(renderBtn)}
        </div>
      )}
    </div>
  );
}
