import { useEffect, useRef, useState } from 'react';

type ActionMenuItem = {
  key: string;
  label: string;
  disabled?: boolean;
  onSelect: () => void;
  tone?: 'default' | 'danger';
};

type ActionMenuProps = {
  actions: ActionMenuItem[];
  buttonLabel?: string;
};

function MenuIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <circle cx="3.25" cy="8" r="1.1" fill="currentColor" />
      <circle cx="8" cy="8" r="1.1" fill="currentColor" />
      <circle cx="12.75" cy="8" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function ActionMenu({ actions, buttonLabel = 'Abrir acciones' }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={buttonLabel}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[rgba(217,222,229,0.9)] bg-white text-[var(--bocar-blue-90)] transition hover:border-[var(--bocar-blue-30)] hover:bg-[var(--bocar-bg)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)]"
      >
        <MenuIcon />
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 min-w-[184px] overflow-hidden rounded-[12px] border border-[rgba(217,222,229,0.9)] bg-white p-1.5 shadow-[0_14px_34px_rgba(0,46,93,0.14)]"
        >
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              role="menuitem"
              disabled={action.disabled}
              onClick={() => {
                if (action.disabled) {
                  return;
                }

                setIsOpen(false);
                action.onSelect();
              }}
              className={[
                'flex w-full items-center rounded-[10px] px-3 py-2.5 text-left text-[13px] transition',
                action.disabled
                  ? 'cursor-not-allowed text-[var(--bocar-blue-30)]'
                  : action.tone === 'danger'
                    ? 'text-[var(--bocar-error)] hover:bg-[rgba(170,0,15,0.06)]'
                    : 'text-[var(--bocar-text)] hover:bg-[var(--bocar-bg)]',
              ].join(' ')}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
