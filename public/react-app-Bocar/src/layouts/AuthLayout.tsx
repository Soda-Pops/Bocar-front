import type { ReactNode } from 'react';

type AuthLayoutProps = {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
};

export function AuthLayout({ leftPanel, rightPanel }: AuthLayoutProps) {
  return (
    <main
      className="login-screen grid min-h-screen bg-white lg:grid-cols-[583px_minmax(0,1fr)]"
      data-testid="login-screen"
    >
      {leftPanel}
      {rightPanel}
    </main>
  );
}
