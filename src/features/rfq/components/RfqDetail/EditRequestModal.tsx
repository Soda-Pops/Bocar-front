import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { extractApiError } from '@/shared/utils/extractApiError';

type EditRequestModalProps = {
  rfqId: string;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
};

export function EditRequestModal({ rfqId, onConfirm, onClose }: EditRequestModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Reason is required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(trimmed);
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
      aria-labelledby="edit-request-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[480px] overflow-hidden rounded-[10px] border border-[var(--bocar-border)] bg-white shadow-[0_16px_40px_rgba(0,46,93,0.18)]">

        {/* Header */}
        <div className="border-b border-[var(--bocar-border)] bg-[var(--bocar-blue-100)] px-7 py-5">
          <h2
            id="edit-request-title"
            className="m-0 text-[15px] font-semibold tracking-[0.01em] text-white"
          >
            Request Edit
          </h2>
          <p className="mt-1 text-[12px] text-white/70">
            RFQ {rfqId}
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-7 py-6">
            <p className="m-0 text-[13px] leading-[1.6] text-[var(--bocar-blue-70)]">
              The RFQ will be returned to Industrialization for the necessary corrections.
              Purchasing will receive your request for review and approval.
            </p>

            <label
              htmlFor="edit-reason"
              className="mt-5 block text-[12px] font-semibold uppercase tracking-[0.07em] text-[var(--bocar-blue-50)]"
            >
              Request Reason <span className="text-[var(--bocar-error)]">*</span>
            </label>
            <textarea
              id="edit-reason"
              ref={textareaRef}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(null); }}
              disabled={isSubmitting}
              rows={4}
              placeholder="Describe the reason for requesting an edit on this RFQ..."
              className={[
                'mt-2 w-full resize-none rounded-[6px] border px-4 py-3 text-[13px] leading-[1.55]',
                'text-[var(--bocar-text)] placeholder-[var(--bocar-blue-30)]',
                'outline-none transition',
                'focus:border-[var(--bocar-blue-70)] focus:ring-2 focus:ring-[rgba(0,46,93,0.12)]',
                'disabled:cursor-not-allowed disabled:opacity-60',
                error
                  ? 'border-[rgba(170,0,15,0.5)] bg-[rgba(170,0,15,0.03)]'
                  : 'border-[var(--bocar-border)] bg-white',
              ].join(' ')}
            />

            {error ? (
              <p
                role="alert"
                className="mt-2 text-[12px] font-medium text-[var(--bocar-error)]"
              >
                {error}
              </p>
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
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="rounded-[6px] border border-[var(--bocar-blue-100)] bg-[var(--bocar-blue-100)] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[var(--bocar-blue-90)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Request Edit'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
