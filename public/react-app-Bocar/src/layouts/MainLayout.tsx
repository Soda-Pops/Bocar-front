import type { ReactNode } from 'react';

type MainLayoutProps = {
  children: ReactNode;
  header?: ReactNode;
  sidebar?: ReactNode;
};

export function MainLayout({ children, header, sidebar }: MainLayoutProps) {
  if (sidebar) {
    return (
      <div className="min-h-screen bg-[var(--bocar-bg)] text-[var(--bocar-text)]">
        <div className="flex min-h-screen">
          {sidebar}
          <div className="flex min-w-0 flex-1 flex-col">
            {header}
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bocar-bg)] text-[var(--bocar-text)]">
      {header}
      <main>{children}</main>
    </div>
  );
}
