import logoBocar from '@/assets/images/Logo-Bocar.png';

type HeaderProps = {
  areaLabel: string;
  variant?: 'light' | 'dark';
  user: {
    initials: string;
    name: string;
    department: string;
  };
};

export function Header({ areaLabel, variant = 'light', user }: HeaderProps) {
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

      <div className="flex items-center gap-3">
        <div
          className={[
            'flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold',
            isDark ? 'bg-white text-[var(--bocar-blue-100)]' : 'bg-[var(--bocar-blue-100)] text-white',
          ].join(' ')}
        >
          {user.initials}
        </div>
        <div className="hidden min-w-0 sm:block">
          <p
            className={[
              'm-0 truncate text-[14px] font-semibold',
              isDark ? 'text-white' : 'text-[var(--bocar-text)]',
            ].join(' ')}
          >
            {user.name}
          </p>
          <p
            className={[
              'mt-0.5 truncate text-[12px]',
              isDark ? 'text-[rgba(255,255,255,0.7)]' : 'text-[var(--bocar-blue-70)]',
            ].join(' ')}
          >
            {user.department}
          </p>
        </div>
      </div>
    </header>
  );
}
