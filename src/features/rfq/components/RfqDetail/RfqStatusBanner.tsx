import type { RfqBannerConfig } from '@/features/rfq/state/rfqStateMachine';

type RfqStatusBannerProps = {
  config: RfqBannerConfig;
};

const TONE_CLASSES: Record<
  RfqBannerConfig['tone'],
  { wrapper: string; border: string; icon: string }
> = {
  neutral: {
    wrapper: 'bg-[rgba(174,179,184,0.1)] border-[rgba(174,179,184,0.4)]',
    border: 'bg-[var(--bocar-neutral)]',
    icon: 'text-[var(--bocar-blue-50)]',
  },
  info: {
    wrapper: 'bg-[rgba(0,46,93,0.05)] border-[rgba(0,46,93,0.16)]',
    border: 'bg-[var(--bocar-blue-70)]',
    icon: 'text-[var(--bocar-blue-70)]',
  },
  warning: {
    wrapper: 'bg-[rgba(255,242,0,0.14)] border-[rgba(200,184,0,0.36)]',
    border: 'bg-[#c8b800]',
    icon: 'text-[#7a6e00]',
  },
  danger: {
    wrapper: 'bg-[rgba(170,0,15,0.07)] border-[rgba(170,0,15,0.24)]',
    border: 'bg-[var(--bocar-error)]',
    icon: 'text-[var(--bocar-error)]',
  },
  success: {
    wrapper: 'bg-[rgba(141,198,63,0.1)] border-[rgba(141,198,63,0.32)]',
    border: 'bg-[var(--bocar-done)]',
    icon: 'text-[#3a6310]',
  },
};

function BannerIcon({ icon, className }: { icon: RfqBannerConfig['icon']; className: string }) {
  if (icon === 'alert') {
    return (
      <svg className={['h-4 w-4 shrink-0', className].join(' ')} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2.5L14 13.5H2L8 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M8 6.5V9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="8" cy="11.5" r="0.7" fill="currentColor" />
      </svg>
    );
  }
  if (icon === 'clock') {
    return (
      <svg className={['h-4 w-4 shrink-0', className].join(' ')} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 5V8.5L10.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (icon === 'check') {
    return (
      <svg className={['h-4 w-4 shrink-0', className].join(' ')} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.5 8L7.5 10L10.5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (icon === 'lock') {
    return (
      <svg className={['h-4 w-4 shrink-0', className].join(' ')} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="3.5" y="7.5" width="9" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.5 7.5V5.5A2.5 2.5 0 0110.5 5.5V7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  // Default: info
  return (
    <svg className={['h-4 w-4 shrink-0', className].join(' ')} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 7V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="5.5" r="0.7" fill="currentColor" />
    </svg>
  );
}

export function RfqStatusBanner({ config }: RfqStatusBannerProps) {
  const tones = TONE_CLASSES[config.tone];

  return (
    <div
      role={config.tone === 'danger' || config.tone === 'warning' ? 'alert' : 'status'}
      className={[
        'flex items-start gap-3 rounded-[6px] border px-5 py-3.5 text-[13px] leading-[1.55]',
        tones.wrapper,
      ].join(' ')}
    >
      <span className={['mt-[2px] h-full w-[3px] min-w-[3px] rounded-full', tones.border].join(' ')} aria-hidden="true" />
      <BannerIcon icon={config.icon} className={tones.icon} />
      <p className="m-0 text-[var(--bocar-text)]">{config.message}</p>
    </div>
  );
}
