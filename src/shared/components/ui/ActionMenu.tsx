import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  dark?: boolean;
  align?: 'left' | 'right';
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

export function ActionMenu({ actions, buttonLabel = 'Open actions', dark = false, align = 'right' }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left?: number; right?: number }>({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  function openMenu() {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      if (align === 'left') {
        setMenuStyle({ top: rect.bottom + 8, left: rect.left });
      } else {
        setMenuStyle({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      }
    }
    setIsOpen(true);
  }

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    function handleScroll() {
      setIsOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  return (
    <div>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={buttonLabel}
        onClick={openMenu}
        className={dark
          ? 'inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--bocar-blue-100)] bg-[var(--bocar-blue-100)] text-white transition hover:bg-[#0b3b6b] focus:outline-none focus:shadow-[0_0_0_3px_rgba(31,58,97,0.18)]'
          : 'inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[rgba(217,222,229,0.9)] bg-white text-[var(--bocar-blue-90)] transition hover:border-[var(--bocar-blue-30)] hover:bg-[var(--bocar-bg)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)]'
        }
      >
        <MenuIcon />
      </button>

      {isOpen ? createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ position: 'fixed', top: menuStyle.top, left: menuStyle.left, right: menuStyle.right }}
          className="z-[9999] min-w-[184px] overflow-hidden rounded-[12px] border border-[rgba(217,222,229,0.9)] bg-white p-1.5 shadow-[0_14px_34px_rgba(0,46,93,0.14)]"
        >
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              role="menuitem"
              disabled={action.disabled}
              onClick={() => {
                if (action.disabled) return;
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
        </div>,
        document.body
      ) : null}
    </div>
  );
}
