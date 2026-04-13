import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  primary?: boolean;
  compact?: boolean;
};

export function Button({
  children,
  primary = false,
  compact = false,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition-colors',
        primary
          ? 'h-11 bg-white px-5 text-sm text-[#0f4c97] shadow-sm hover:bg-slate-100'
          : compact
            ? 'h-8 bg-[#0f4c97] px-4 text-sm text-white shadow-sm hover:bg-[#0a3570]'
            : 'h-10 bg-[#0f4c97] px-5 text-sm text-white shadow-sm hover:bg-[#0a3570]',
        className ?? '',
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
