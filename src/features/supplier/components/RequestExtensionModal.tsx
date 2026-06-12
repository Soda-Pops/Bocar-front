import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { extractApiError } from '@/shared/utils/extractApiError';

export type RequestExtensionFormData = {
  motivo: string;
  nueva_fecha: string;
};

type RequestExtensionModalProps = {
  rfqId: string;
  /** Fecha límite actual (ISO). La nueva fecha debe ser posterior a esta. */
  dueDate: string;
  onConfirm: (data: RequestExtensionFormData) => Promise<void>;
  onClose: () => void;
};

/** Día siguiente al due_date actual (mínimo permitido por el backend). */
function getMinDateValue(dueDate: string): string {
  const base = new Date(dueDate);
  if (Number.isNaN(base.getTime())) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  }
  base.setDate(base.getDate() + 1);
  return base.toISOString().slice(0, 10);
}

export function RequestExtensionModal({ rfqId, dueDate, onConfirm, onClose }: RequestExtensionModalProps) {
  const [motivo, setMotivo] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const motivoRef = useRef<HTMLTextAreaElement>(null);
  const minDate = getMinDateValue(dueDate);

  useEffect(() => {
    motivoRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function handleConfirm() {
    if (!motivo.trim()) {
      setError('Explain why you need more time.');
      return;
    }
    if (!nuevaFecha) {
      setError('Select a proposed deadline.');
      return;
    }
    if (nuevaFecha < minDate) {
      setError('The proposed deadline must be after the current one.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm({ motivo: motivo.trim(), nueva_fecha: nuevaFecha });
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
      aria-labelledby="request-extension-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[440px] overflow-hidden rounded-[10px] border border-[var(--bocar-border)] bg-white shadow-[0_16px_40px_rgba(0,46,93,0.18)]">
        <div className="border-b border-[var(--bocar-border)] px-7 py-5">
          <h2
            id="request-extension-title"
            className="m-0 text-[15px] font-semibold text-[var(--bocar-text)]"
          >
            Request Extension
          </h2>
          <p className="mt-0.5 text-[12px] text-[var(--bocar-blue-50)]">RFQ {rfqId}</p>
        </div>

        <div className="grid gap-5 px-7 py-6">
          <p className="m-0 text-[13px] leading-[1.6] text-[var(--bocar-blue-70)]">
            This assignment is past its deadline. Ask Purchasing for more time to submit your quotation.
          </p>

          <div className="grid gap-1.5">
            <label
              htmlFor="request-extension-reason"
              className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--bocar-blue-50)]"
            >
              Reason
            </label>
            <textarea
              id="request-extension-reason"
              ref={motivoRef}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              placeholder="e.g. Delay in raw material import."
              className="resize-none rounded-[6px] border border-[var(--bocar-border)] px-3 py-2 text-[13px] text-[var(--bocar-text)] focus:border-[var(--bocar-blue-70)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid gap-1.5">
            <label
              htmlFor="request-extension-date"
              className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--bocar-blue-50)]"
            >
              Proposed Deadline
            </label>
            <input
              id="request-extension-date"
              type="date"
              min={minDate}
              value={nuevaFecha}
              onChange={(e) => setNuevaFecha(e.target.value)}
              disabled={isSubmitting}
              className="h-10 rounded-[6px] border border-[var(--bocar-border)] px-3 text-[13px] text-[var(--bocar-text)] focus:border-[var(--bocar-blue-70)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
            {isSubmitting ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
