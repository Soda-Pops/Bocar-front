import { ActionMenu } from '@/shared/components/ui/ActionMenu';
import type { RfqActionDescriptor, RfqActionKey } from '@/features/rfq/state/rfqStateMachine';

type RfqActionBarProps = {
  actions: RfqActionDescriptor[];
  onAction: (key: RfqActionKey) => void;
};

function getButtonClass(tone: RfqActionDescriptor['tone'], disabled: boolean) {
  const base =
    'inline-flex h-10 items-center gap-2 rounded-[8px] px-5 text-[13px] font-semibold transition focus:outline-none';

  if (disabled) {
    return [base, 'cursor-not-allowed opacity-50 border border-[var(--bocar-border)] bg-white text-[var(--bocar-blue-50)]'].join(' ');
  }

  if (tone === 'primary') {
    return [
      base,
      'bg-[var(--bocar-blue-100)] text-white hover:bg-[#0b3b6b] focus:shadow-[0_0_0_3px_rgba(0,46,93,0.14)]',
    ].join(' ');
  }

  if (tone === 'secondary') {
    return [
      base,
      'border border-[var(--bocar-blue-100)] bg-white text-[var(--bocar-blue-100)] hover:bg-[rgba(0,46,93,0.05)] focus:shadow-[0_0_0_3px_rgba(0,46,93,0.1)]',
    ].join(' ');
  }

  if (tone === 'warning') {
    return [
      base,
      'border border-[rgba(200,184,0,0.5)] bg-[rgba(255,242,0,0.18)] text-[#7a6e00] hover:bg-[rgba(255,242,0,0.28)] focus:shadow-[0_0_0_3px_rgba(200,184,0,0.14)]',
    ].join(' ');
  }

  // destructive → goes to overflow menu, but handle it if somehow inline
  return [
    base,
    'border border-[rgba(170,0,15,0.3)] bg-white text-[var(--bocar-error)] hover:bg-[rgba(170,0,15,0.06)] focus:shadow-[0_0_0_3px_rgba(170,0,15,0.1)]',
  ].join(' ');
}

export function RfqActionBar({ actions, onAction }: RfqActionBarProps) {
  // Destructive actions always go to overflow menu; others render inline
  const inlineActions = actions.filter((a) => a.tone !== 'destructive');
  const overflowActions = actions.filter((a) => a.tone === 'destructive');

  if (actions.length === 0) return null;

  const menuItems = overflowActions.map((a) => ({
    key: a.key,
    label: a.label,
    tone: 'danger' as const,
    disabled: a.disabled,
    onSelect: () => onAction(a.key),
  }));

  return (
    <div className="flex flex-wrap items-center gap-3">
      {inlineActions.map((action) => (
        <button
          key={action.key}
          type="button"
          disabled={action.disabled}
          title={action.disabled ? action.disabledReason : undefined}
          aria-disabled={action.disabled}
          onClick={() => !action.disabled && onAction(action.key)}
          className={getButtonClass(action.tone, action.disabled ?? false)}
        >
          {action.label}
        </button>
      ))}

      {menuItems.length > 0 ? (
        <ActionMenu actions={menuItems} buttonLabel="Más acciones" />
      ) : null}
    </div>
  );
}
