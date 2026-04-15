import logoBocar from '@/assets/images/Logo-Bocar.png';

type HeaderProps = {
  areaLabel: string;
  user: {
    initials: string;
    name: string;
    department: string;
  };
};

export function Header({ areaLabel, user }: HeaderProps) {
  return (
    <header className="border-b border-[rgba(217,222,229,0.72)] bg-white shadow-[0_16px_40px_rgba(0,46,93,0.08)]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-6 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-3 xl:px-14">
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <img alt="Bocar" className="h-auto w-[152px]" src={logoBocar} />
          <span className="hidden h-11 w-px bg-[var(--bocar-blue-30)]/70 sm:block" />
          <span className="text-[18px] font-medium text-[var(--bocar-text)]">{areaLabel}</span>
        </div>

        <div className="flex items-center gap-4 self-start lg:self-auto">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bocar-blue-100)] text-[16px] font-medium text-white">
            {user.initials}
          </div>
          <div className="min-w-0">
            <p className="m-0 truncate text-[15px] font-semibold text-[var(--bocar-text)]">{user.name}</p>
            <p className="mt-1 truncate text-[13px] text-[var(--bocar-blue-70)]">{user.department}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
