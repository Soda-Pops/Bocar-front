import { useState } from 'react';
import type { RfqSupplier } from '@/features/rfq/services/rfqDetailService';
import { extractApiError } from '@/shared/utils/extractApiError';

type SupplierAssignmentPanelProps = {
  suppliers: RfqSupplier[];
  backHref: string;
  onSubmit?: (input: { proveedores: number[]; due_date: string }) => Promise<void>;
};

type Feedback = {
  tone: 'neutral' | 'success' | 'error';
  text: string;
};

function getScoreToneClass(tone: RfqSupplier['scoreTone']) {
  if (tone === 'success') return 'bg-[var(--bocar-done)]';
  if (tone === 'warning') return 'bg-[var(--bocar-review)]';
  return 'bg-[var(--bocar-error)]';
}

function getRowStateClass(isInvalid: boolean) {
  return isInvalid
    ? 'border-t border-[rgba(170,0,15,0.2)] bg-[rgba(170,0,15,0.045)]'
    : 'border-t border-[rgba(217,222,229,0.72)]';
}

export function SupplierAssignmentPanel({ suppliers, backHref, onSubmit }: SupplierAssignmentPanelProps) {
  const [selectedNames, setSelectedNames] = useState<string[]>(() =>
    suppliers.map((s) => s.name),
  );
  const [deadlines, setDeadlines] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  function isSelected(name: string) {
    return selectedNames.includes(name);
  }

  function toggle(name: string) {
    setSelectedNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
    setFeedback(null);
  }

  function handleDeadline(name: string, value: string) {
    setDeadlines((prev) => ({ ...prev, [name]: value }));
    setFeedback(null);
  }

  async function handleSend() {
    setShowValidation(true);
    if (selectedNames.length === 0) {
      setFeedback({ tone: 'error', text: 'Select at least one supplier before submitting.' });
      return;
    }
    const missingDeadline = selectedNames.some((n) => !deadlines[n]);
    if (missingDeadline) {
      setFeedback({ tone: 'error', text: 'Each selected supplier requires a deadline.' });
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const pastDeadline = selectedNames.some((n) => deadlines[n] <= today);
    if (pastDeadline) {
      setFeedback({ tone: 'error', text: 'Deadlines must be in the future (from tomorrow onwards).' });
      return;
    }
    if (onSubmit) {
      const proveedores = suppliers
        .filter((supplier) => selectedNames.includes(supplier.name))
        .map((supplier) => supplier.backendId)
        .filter((id): id is number => typeof id === 'number');
      const dueDate = deadlines[selectedNames[0]];
      if (proveedores.length === 0 || !dueDate) {
        setFeedback({ tone: 'error', text: 'The selected suppliers are missing backend IDs.' });
        return;
      }
      try {
        await onSubmit({ proveedores, due_date: dueDate });
      } catch (error) {
        setFeedback({
          tone: 'error',
          text: extractApiError(error),
        });
        return;
      }
    }
    setFeedback({ tone: 'success', text: 'Suppliers selected successfully.' });
  }

  return (
    <section>
      <div className="border-t border-[rgba(217,222,229,0.58)] px-7 py-6 lg:px-12">
        <h2 className="m-0 text-[16px] font-semibold text-[var(--bocar-text)]">Select Suppliers</h2>

        {feedback ? (
          <div
            role={feedback.tone === 'error' ? 'alert' : 'status'}
            className={[
              'mt-4 rounded-[8px] border px-4 py-3 text-[13px] leading-[1.45]',
              feedback.tone === 'success'
                ? 'border-[rgba(141,198,63,0.32)] bg-[rgba(141,198,63,0.12)] text-[var(--bocar-blue-100)]'
                : feedback.tone === 'error'
                  ? 'border-[rgba(170,0,15,0.22)] bg-[rgba(170,0,15,0.08)] text-[var(--bocar-error)]'
                  : 'border-[rgba(31,58,97,0.14)] bg-[rgba(31,58,97,0.05)] text-[var(--bocar-blue-90)]',
            ].join(' ')}
          >
            {feedback.text}
          </div>
        ) : null}

        {/* Mobile cards */}
        <div className="mt-4 grid gap-3 sm:hidden">
          {suppliers.map((supplier) => {
            const selected = isSelected(supplier.name);
            const isInvalid = showValidation && selected && !deadlines[supplier.name];
            return (
              <article
                key={`${supplier.name}-mobile`}
                className={[
                  'rounded-[6px] border bg-white px-4 py-3',
                  isInvalid ? 'border-[rgba(170,0,15,0.42)]' : 'border-[var(--bocar-border)]',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-4">
                  <label className="flex min-w-0 items-start gap-3">
                    <input
                      checked={selected}
                      className="mt-0.5 h-4 w-4 rounded border-[var(--bocar-border)] accent-[var(--bocar-blue-100)]"
                      onChange={() => toggle(supplier.name)}
                      type="checkbox"
                    />
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold text-[var(--bocar-text)]">{supplier.name}</span>
                      <span className="mt-1 block text-[12px] text-[var(--bocar-blue-70)]">{supplier.category}</span>
                    </span>
                  </label>
                  <div className="flex min-w-[82px] items-center justify-end gap-2">
                    <span className={['h-1 w-10 rounded-full', getScoreToneClass(supplier.scoreTone)].join(' ')} />
                    <span className="text-[12px] font-medium text-[var(--bocar-text)]">{supplier.score}</span>
                  </div>
                </div>
                <div className="mt-3 grid gap-2">
                  <p className="m-0 text-[12px] text-[var(--bocar-text)]">Contact: {supplier.contact}</p>
                  <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
                    Deadline
                    <input
                      aria-label={`Deadline ${supplier.name}`}
                      className="h-10 rounded-[6px] border border-[var(--bocar-border)] px-3 text-[12px] font-normal tracking-normal text-[var(--bocar-text)] outline-none transition focus:border-[var(--bocar-blue-70)] focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)]"
                      disabled={!selected}
                      min={new Date(Date.now() + 864e5).toISOString().slice(0, 10)}
                      onChange={(e) => handleDeadline(supplier.name, e.target.value)}
                      type="date"
                      value={deadlines[supplier.name] ?? ''}
                    />
                  </label>
                </div>
              </article>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="mt-4 hidden overflow-x-auto sm:block">
          <table className="w-full max-w-[1040px] border-separate border-spacing-0 overflow-hidden rounded-[6px] border border-[var(--bocar-border)] text-left">
            <thead>
              <tr className="bg-[var(--bocar-bg)]">
                {['Supplier', 'Category', 'Contact', 'Deadline', 'Score'].map((h) => (
                  <th key={h} className="px-6 py-3 text-[12px] font-semibold text-[var(--bocar-text)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => {
                const selected = isSelected(supplier.name);
                const isInvalid = showValidation && selected && !deadlines[supplier.name];
                return (
                  <tr key={supplier.name} className={getRowStateClass(isInvalid)}>
                    <td className="px-6 py-3.5 text-[12px] font-medium text-[var(--bocar-text)]">
                      <label className="inline-flex items-center gap-3">
                        <input
                          checked={selected}
                          className="h-4 w-4 rounded border-[var(--bocar-border)] accent-[var(--bocar-blue-100)]"
                          onChange={() => toggle(supplier.name)}
                          type="checkbox"
                        />
                        {supplier.name}
                      </label>
                    </td>
                    <td className="px-6 py-3.5 text-[12px] text-[var(--bocar-text)]">{supplier.category}</td>
                    <td className="px-6 py-3.5 text-[12px] text-[var(--bocar-text)]">{supplier.contact}</td>
                    <td className="px-6 py-3.5">
                      <input
                        aria-label={`Deadline ${supplier.name}`}
                        className={[
                          'h-8 w-[150px] rounded-[6px] border bg-white px-3 text-[12px] text-[var(--bocar-text)] outline-none transition disabled:bg-[var(--bocar-bg)] disabled:text-[var(--bocar-blue-30)]',
                          isInvalid
                            ? 'border-[rgba(170,0,15,0.52)] focus:border-[var(--bocar-error)] focus:shadow-[0_0_0_3px_rgba(170,0,15,0.1)]'
                            : 'border-[var(--bocar-border)] focus:border-[var(--bocar-blue-70)] focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)]',
                        ].join(' ')}
                        disabled={!selected}
                        min={new Date(Date.now() + 864e5).toISOString().slice(0, 10)}
                        onChange={(e) => handleDeadline(supplier.name, e.target.value)}
                        type="date"
                        value={deadlines[supplier.name] ?? ''}
                      />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex min-w-[110px] items-center gap-5">
                        <span className={['h-1 w-[72px] rounded-full', getScoreToneClass(supplier.scoreTone)].join(' ')} />
                        <span className="text-[12px] font-medium text-[var(--bocar-text)]">{supplier.score}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-[88px]">
          <button
            onClick={() => window.location.assign(backHref)}
            className="h-10 min-w-[220px] rounded-[8px] bg-[var(--bocar-blue-30)] px-8 text-[13px] font-semibold text-white transition hover:bg-[var(--bocar-blue-50)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(167,177,194,0.28)]"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              void handleSend();
            }}
            className="h-10 min-w-[220px] rounded-[8px] bg-[var(--bocar-blue-100)] px-8 text-[13px] font-semibold text-white transition hover:bg-[#0b3b6b] focus:outline-none focus:shadow-[0_0_0_3px_rgba(0,46,93,0.14)]"
            type="button"
          >
            Submit Suppliers
          </button>
        </div>
      </div>
    </section>
  );
}
