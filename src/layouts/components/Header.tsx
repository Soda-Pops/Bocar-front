import logoBocar from '@/assets/images/Logo-Bocar.png';
import { UserMenu } from '@/layouts/components/UserMenu';

type HeaderProps = {
  areaLabel: string;
  variant?: 'light' | 'dark';
};

export function Header({ areaLabel, variant = 'light' }: HeaderProps) {
  const isDark = variant === 'dark';

  return (
    <header
      className={[
        'flex h-[72px] items-center justify-between border-b px-6 lg:px-10',
        isDark
          ? 'border-[rgba(255,255,255,0.12)] bg-[var(--bocar-blue-100)]'
          : 'border-[#d9dee5] bg-white',
      ].join(' ')}
    >
      <div className="flex items-center gap-4 lg:gap-5">
        <img
          alt="Bocar"
          className={['h-9 w-auto lg:h-10', isDark ? 'brightness-0 invert' : ''].join(' ')}
          src={logoBocar}
        />
        <span
          aria-hidden="true"
          className={[
            'hidden h-8 w-px lg:block',
            isDark ? 'bg-[rgba(255,255,255,0.25)]' : 'bg-[#d9dee5]',
          ].join(' ')}
        />
        <span
          className={[
            'text-[15px] font-medium',
            isDark ? 'text-white' : 'text-[var(--bocar-text)]',
          ].join(' ')}
        >
          {areaLabel}
        </span>
      </div>

      <UserMenu variant={variant} />
    </header>
  );
}
