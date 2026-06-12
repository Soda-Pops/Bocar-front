import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { extractApiError } from '@/shared/utils/extractApiError';

type CloseRfqFormData = {
  closure_reason: string;
};

type CloseRfqModalProps = {
  rfqId: string;
  onConfirm: (data: CloseRfqFormData) => Promise<void>;
  onClose: () => void;
};

export function CloseRfqModal({ rfqId, onConfirm, onClose }: CloseRfqModalProps) {
  const [closureReason, setClosureReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    reasonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function handleConfirm() {
    if (!closureReason.trim()) {
      setError('Closure reason is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm({ closure_reason: closureReason.trim() });
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
      aria-labelledby="close-rfq-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[460px] overflow-hidden rounded-[10px] border border-[var(--bocar-border)] bg-white shadow-[0_16px_40px_rgba(0,46,93,0.18)]">

        {/* Header */}
        <div className="border-b border-[var(--bocar-border)] px-7 py-5">
          <h2
            id="close-rfq-title"
            className="m-0 text-[15px] font-semibold text-[var(--bocar-text)]"
          >
            Formally Close RFQ
          </h2>
          <p className="mt-0.5 text-[12px] text-[var(--bocar-blue-50)]">RFQ {rfqId}</p>
        </div>

        {/* Body */}
        <div className="grid gap-5 px-7 py-6">
          <p className="m-0 text-[13px] leading-[1.6] text-[var(--bocar-blue-70)]">
            Provide the closure reason for this RFQ. This action is irreversible.
          </p>

          {/* Motivo de cierre */}
          <div className="grid gap-1.5">
            <label
              htmlFor="close-rfq-reason"
              className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--bocar-blue-50)]"
            >
              Closure Reason
            </label>
            <textarea
              id="close-rfq-reason"
              ref={reasonRef}
              value={closureReason}
              onChange={(e) => setClosureReason(e.target.value)}
              disabled={isSubmitting}
              rows={4}
              maxLength={1000}
              placeholder="E.g. Best technical and commercial compliance."
              className="w-full resize-none rounded-[6px] border border-[var(--bocar-border)] px-3 py-2 text-[13px] text-[var(--bocar-text)] placeholder:text-[var(--bocar-blue-30)] focus:border-[var(--bocar-blue-70)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-[6px] border border-[rgba(170,0,15,0.24)] bg-[rgba(170,0,15,0.07)] px-4 py-3 text-[12px] text-[var(--bocar-error)]"
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
            className="rounded-[6px] border border-[var(--bocar-blue-100)] bg-[var(--bocar-blue-100)] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[var(--bocar-blue-90)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Closing...' : 'Close RFQ'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
