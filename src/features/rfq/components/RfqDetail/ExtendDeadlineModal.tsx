import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { extractApiError } from '@/shared/utils/extractApiError';

type ExtendDeadlineFormData = {
  due_date: string;
};

type ExtendDeadlineModalProps = {
  rfqId: string;
  onConfirm: (data: ExtendDeadlineFormData) => Promise<void>;
  onClose: () => void;
};

function getTomorrowValue() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function ExtendDeadlineModal({ rfqId, onConfirm, onClose }: ExtendDeadlineModalProps) {
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const minDate = getTomorrowValue();

  useEffect(() => {
    dateRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function handleConfirm() {
    if (!dueDate) {
      setError('Selecciona una nueva fecha límite.');
      return;
    }

    if (dueDate < minDate) {
      setError('La nueva fecha límite debe ser futura.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm({ due_date: dueDate });
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
      aria-labelledby="extend-deadline-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[430px] overflow-hidden rounded-[10px] border border-[var(--bocar-border)] bg-white shadow-[0_16px_40px_rgba(0,46,93,0.18)]">
        <div className="border-b border-[var(--bocar-border)] px-7 py-5">
          <h2
            id="extend-deadline-title"
            className="m-0 text-[15px] font-semibold text-[var(--bocar-text)]"
          >
            Extender deadline
          </h2>
          <p className="mt-0.5 text-[12px] text-[var(--bocar-blue-50)]">RFQ {rfqId}</p>
        </div>

        <div className="grid gap-5 px-7 py-6">
          <p className="m-0 text-[13px] leading-[1.6] text-[var(--bocar-blue-70)]">
            Define una nueva fecha límite para reabrir el ciclo de cotización de este RFQ.
          </p>

          <div className="grid gap-1.5">
            <label
              htmlFor="extend-deadline-date"
              className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--bocar-blue-50)]"
            >
              Nueva fecha límite
            </label>
            <input
              id="extend-deadline-date"
              ref={dateRef}
              type="date"
              min={minDate}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
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
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => { void handleConfirm(); }}
            className="rounded-[6px] border border-[var(--bocar-blue-100)] bg-[var(--bocar-blue-100)] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[var(--bocar-blue-90)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Extendiendo...' : 'Extender deadline'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
