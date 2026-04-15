type DashboardHeaderProps = {
  title?: string;
};

export function DashboardHeader({ title = 'Dashboard' }: DashboardHeaderProps) {
  return (
    <section>
      <h1 className="m-0 text-[42px] font-semibold uppercase tracking-[-0.04em] text-[var(--bocar-text)] sm:text-[48px] lg:text-[22px]">
        {title}
      </h1>
    </section>
  );
}
