import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { extractApiError } from '@/shared/utils/extractApiError';

type ConfirmEditModalProps = {
  variant: 'approve' | 'reject';
  rfqId: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
};

const COPY = {
  approve: {
    title: 'Approve Edit Request',
    description:
      'The RFQ will return to Industrialization status and the team will be able to make the requested corrections.',
    confirmLabel: 'Approve',
    confirmStyle:
      'bg-[var(--bocar-blue-100)] border-[var(--bocar-blue-100)] text-white hover:bg-[var(--bocar-blue-90)]',
  },
  reject: {
    title: 'Reject Edit Request',
    description:
      'The RFQ will remain in Purchasing. The edit request will be recorded as rejected.',
    confirmLabel: 'Reject',
    confirmStyle:
      'bg-white border-[rgba(170,0,15,0.5)] text-[var(--bocar-error)] hover:bg-[rgba(170,0,15,0.06)]',
  },
} as const;

export function ConfirmEditModal({ variant, rfqId, onConfirm, onClose }: ConfirmEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[variant];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(extractApiError(err));
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-[rgba(0,0,0,0.38)] px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-edit-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[420px] overflow-hidden rounded-[10px] border border-[var(--bocar-border)] bg-white shadow-[0_16px_40px_rgba(0,46,93,0.18)]">

        {/* Header */}
        <div className="border-b border-[var(--bocar-border)] px-7 py-5">
          <h2
            id="confirm-edit-title"
            className="m-0 text-[15px] font-semibold text-[var(--bocar-text)]"
          >
            {copy.title}
          </h2>
          <p className="mt-0.5 text-[12px] text-[var(--bocar-blue-50)]">RFQ {rfqId}</p>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          <p className="m-0 text-[13px] leading-[1.6] text-[var(--bocar-blue-70)]">
            {copy.description}
          </p>
          <p className="mt-3 text-[13px] leading-[1.6] text-[var(--bocar-text)]">
            Do you confirm this action?
          </p>

          {error ? (
            <div
              role="alert"
              className="mt-4 rounded-[6px] border border-[rgba(170,0,15,0.24)] bg-[rgba(170,0,15,0.07)] px-4 py-3 text-[12px] text-[var(--bocar-error)]"
            >
              {error}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--bocar-border)] bg-[var(--bocar-bg)] px-7 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-[6px] border border-[var(--bocar-border)] bg-white px-4 py-2 text-[13px] font-semibold text-[var(--bocar-blue-70)] transition hover:border-[var(--bocar-blue-70)] hover:text-[var(--bocar-blue-100)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => { void handleConfirm(); }}
            className={[
              'rounded-[6px] border px-4 py-2 text-[13px] font-semibold transition',
              'disabled:cursor-not-allowed disabled:opacity-50',
              copy.confirmStyle,
            ].join(' ')}
          >
            {isSubmitting ? 'Processing...' : copy.confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
