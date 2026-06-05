import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FormProvider,
  type DefaultValues,
  type FieldValues,
  type SubmitErrorHandler,
  useForm,
} from 'react-hook-form';

import type { RfqTipo } from '@/features/analytics/types';
import { Header } from '@/layouts/components/Header';
import { Button } from '@/shared/components/ui/Button';

import {
  BackArrowIcon,
  ChevronDownIcon,
  getFeedbackClasses,
} from '../../RfqForm/shell/primitives';
import type {
  FeedbackTone,
  NavGroup,
  RfqWorkspaceDefinition,
} from '../../RfqForm/shell/types';

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function QuotationSidebar({
  current,
  navGroups,
  onSelect,
  pageErrors,
}: {
  current: string;
  navGroups: readonly NavGroup[];
  onSelect: (page: string) => void;
  pageErrors: Partial<Record<string, boolean>>;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navGroups.map((g) => [g.key, true]))
  );

  return (
    <aside className="hidden lg:flex lg:w-[232px] lg:shrink-0 lg:flex-col lg:border-r lg:border-[#d9dee5] lg:bg-white">
      <nav className="flex-1 overflow-y-auto border-t border-[#d9dee5] px-2 pb-8 pt-2">
        {navGroups.map((group) => {
          const isGroupOpen = expanded[group.key] ?? true;

          return (
            <div key={group.key} className="mb-2">
              <button
                aria-expanded={isGroupOpen}
                className="flex w-full items-center justify-between px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.02em] text-[var(--bocar-text)] transition hover:text-[var(--bocar-blue-100)]"
                type="button"
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [group.key]: !prev[group.key] }))
                }
              >
                <span>{group.label}</span>
                <ChevronDownIcon rotated={isGroupOpen} />
              </button>

              {isGroupOpen ? (
                <div className="flex flex-col">
                  {group.items.map((item) => {
                    const isActive = current === item.key;
                    const hasError = Boolean(pageErrors[item.key]);

                    return (
                      <button
                        key={item.key}
                        className={[
                          'flex items-center justify-between px-6 py-2 text-left text-[12px] font-medium tracking-[0.04em] transition',
                          isActive
                            ? 'bg-[rgba(0,46,93,0.08)] text-[var(--bocar-blue-100)]'
                            : 'text-[var(--bocar-blue-50)] hover:bg-[rgba(0,46,93,0.04)] hover:text-[var(--bocar-blue-100)]',
                        ].join(' ')}
                        type="button"
                        onClick={() => onSelect(item.key)}
                      >
                        <span>{item.label}</span>
                        {hasError ? (
                          <span className="h-2 w-2 rounded-full bg-[var(--bocar-error)]" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function QuotationSidebarMobile({
  current,
  navGroups,
  onSelect,
}: {
  current: string;
  navGroups: readonly NavGroup[];
  onSelect: (page: string) => void;
}) {
  const allItems = navGroups.flatMap((g) => g.items);

  return (
    <div className="border-b border-[#d9dee5] bg-white px-4 py-3 lg:hidden">
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bocar-blue-50)]">
        Section
      </label>
      <select
        className="w-full rounded-[10px] border border-[#d9dee5] bg-white px-3 py-2 text-[13px] font-medium text-[var(--bocar-text)] outline-none focus:border-[var(--bocar-blue-70)]"
        value={current}
        onChange={(e) => onSelect(e.target.value)}
      >
        {navGroups.map((group) => (
          <optgroup key={group.key} label={group.label}>
            {group.items.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </optgroup>
        ))}
        {!allItems.some((item) => item.key === current) ? (
          <option value={current}>{current}</option>
        ) : null}
      </select>
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

type QuotationWorkspaceShellProps<TValues extends FieldValues> = {
  definition: RfqWorkspaceDefinition<TValues>;
  mode: 'create' | 'edit';
  onSaveDraft?: (values: TValues) => Promise<void>;
  onSubmit?: (values: TValues) => Promise<{ rfqCompleted?: boolean } | void>;
  onBack: () => void;
  quotationId?: string;
  rfqId: string;
  tipo: RfqTipo;
};

export function QuotationWorkspaceShell<TValues extends FieldValues>({
  definition,
  mode,
  onSaveDraft,
  onSubmit,
  onBack,
  quotationId,
  rfqId,
  tipo,
}: QuotationWorkspaceShellProps<TValues>) {
  const [currentPage, setCurrentPage] = useState<string>(definition.pages[0] ?? 'basic');
  const [feedback, setFeedback] = useState<{ text: string; tone: FeedbackTone }>(() =>
    getInitialFeedback(mode, rfqId, quotationId)
  );
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [visiblePageErrors, setVisiblePageErrors] = useState<Partial<Record<string, boolean>>>({});
  const currentPageRef = useRef<string>(definition.pages[0] ?? 'basic');
  const skipNextEmptyPageErrorSyncRef = useRef(false);

  const defaults = useMemo(
    () =>
      mode === 'edit'
        ? definition.getEditDefaultValues(quotationId ?? rfqId)
        : definition.getCreateDefaultValues(),
    [mode, definition, quotationId, rfqId]
  );

  const form = useForm<TValues>({
    defaultValues: defaults as DefaultValues<TValues>,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: definition.resolver,
  });

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setFocus,
    trigger,
  } = form;

  useEffect(() => {
    reset(
      (mode === 'edit'
        ? definition.getEditDefaultValues(quotationId ?? rfqId)
        : definition.getCreateDefaultValues()) as DefaultValues<TValues>
    );
    setCurrentPage(definition.pages[0] ?? 'basic');
    setFeedback(getInitialFeedback(mode, rfqId, quotationId));
    setAttemptedSubmit(false);
    setVisiblePageErrors({});
  }, [mode, reset, rfqId, quotationId, tipo, definition]);

  currentPageRef.current = currentPage;

  const currentIndex = definition.pages.indexOf(currentPage);
  const pageErrors = definition.getPageErrorMap(errors);
  const pageErrorSignature = definition.pages.map((page) => (pageErrors[page] ? '1' : '0')).join('|');

  useEffect(() => {
    if (!attemptedSubmit) return;

    const hasLivePageErrors = definition.pages.some((page) => pageErrors[page]);
    if (hasLivePageErrors) {
      skipNextEmptyPageErrorSyncRef.current = false;
      setVisiblePageErrors(pageErrors);
      return;
    }

    if (skipNextEmptyPageErrorSyncRef.current) {
      skipNextEmptyPageErrorSyncRef.current = false;
      return;
    }

    setVisiblePageErrors(pageErrors);
    if (Object.keys(errors).length === 0) {
      setAttemptedSubmit(false);
      setVisiblePageErrors({});
      setFeedback(getInitialFeedback(mode, rfqId, quotationId));
    }
  }, [errors, attemptedSubmit, mode, rfqId, quotationId, pageErrorSignature]);

  const meta = definition.pageMeta[currentPage];
  const headerTitle = mode === 'edit' ? 'EDIT QUOTATION' : 'CREATE QUOTATION';

  async function goNext() {
    const nextPage = definition.pages[currentIndex + 1];
    if (!nextPage) return;

    const requiredFields = definition.requiredFieldsByPage[currentPage] ?? [];

    if (requiredFields.length > 0) {
      const pageAtCallTime = currentPage;
      const isValid = await trigger(requiredFields, { shouldFocus: true });

      if (currentPageRef.current !== pageAtCallTime) return;

      if (!isValid) {
        setAttemptedSubmit(true);
        setVisiblePageErrors((prev) => ({ ...prev, [pageAtCallTime]: true }));
        setFeedback({
          text: 'This section has required fields that are not complete.',
          tone: 'error',
        });
        return;
      }
    }

    setCurrentPage(nextPage);
    setFeedback({
      text: `Continue with ${definition.pageMeta[nextPage]?.navLabel ?? nextPage}. Your progress is saved as a local draft.`,
      tone: 'neutral',
    });
  }

  function goPrevious() {
    const prev = definition.pages[currentIndex - 1];
    if (prev) setCurrentPage(prev);
  }

  async function handleSaveDraft() {
    if (onSaveDraft) {
      try {
        await onSaveDraft(form.getValues());
      } catch (error) {
        setFeedback({
          text: error instanceof Error ? error.message : 'The draft could not be saved.',
          tone: 'error',
        });
        return;
      }
    }
    setFeedback({
      text:
        mode === 'edit'
          ? `${(quotationId ?? 'COT-001').toUpperCase()} was saved as an editable draft.`
          : `Quotation draft saved for ${rfqId.toUpperCase()}.`,
      tone: 'success',
    });
  }

  async function handleValidSubmit(values: TValues) {
    setAttemptedSubmit(false);
    setVisiblePageErrors({});
    let rfqCompleted = false;
    if (onSubmit) {
      try {
        const result = await onSubmit(values);
        rfqCompleted = Boolean(result && 'rfqCompleted' in result && result.rfqCompleted);
      } catch (error) {
        setFeedback({
          text: error instanceof Error ? error.message : 'The quotation could not be submitted.',
          tone: 'error',
        });
        return;
      }
    }
    setFeedback({
      text:
        rfqCompleted
          ? 'Quotation submitted. RFQ closed.'
          : 
        mode === 'edit'
          ? `${(quotationId ?? 'COT-001').toUpperCase()} was updated and submitted to Purchasing.`
          : `Your quotation for ${rfqId.toUpperCase()} was submitted to Purchasing for review.`,
      tone: 'success',
    });
  }

  const handleInvalidSubmit: SubmitErrorHandler<TValues> = (fieldErrors) => {
    setAttemptedSubmit(true);
    setFeedback({
      text: 'This section has required fields that are not complete.',
      tone: 'error',
    });
    const errorMap = definition.getPageErrorMap(fieldErrors);
    skipNextEmptyPageErrorSyncRef.current = true;
    setVisiblePageErrors(errorMap);
    const firstErrorPage = definition.pages.find((p) => errorMap[p]);
    if (firstErrorPage) setCurrentPage(firstErrorPage);
    definition.onInvalidSubmit?.(fieldErrors, { setCurrentPage, setFocus });
  };

  const progressPercent = ((currentIndex + 1) / definition.pages.length) * 100;
  const currentPageHasError = attemptedSubmit && Boolean(visiblePageErrors[currentPage]);
  const showFeedback = feedback.tone === 'success' || (feedback.tone === 'error' && currentPageHasError);

  return (
    <FormProvider {...form}>
      <div className="flex min-h-screen flex-col bg-[#f5f7fa]">
        <Header areaLabel={`Supplier · ${headerTitle} · ${tipo}`} />

        <div className="flex min-h-0 flex-1">
          <QuotationSidebar
            current={currentPage}
            navGroups={definition.navGroups}
            onSelect={setCurrentPage}
            pageErrors={attemptedSubmit ? visiblePageErrors : {}}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <QuotationSidebarMobile
              current={currentPage}
              navGroups={definition.navGroups}
              onSelect={setCurrentPage}
            />

            <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-12 lg:py-10">
              <div className="mx-auto w-full max-w-[960px]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
                      <span>Assigned RFQ</span>
                      <span
                        aria-hidden="true"
                        className="inline-block h-1 w-1 rounded-full bg-[var(--bocar-blue-30)]"
                      />
                      <span className="text-[var(--bocar-blue-100)]">{rfqId.toUpperCase()}</span>
                    </div>
                    <h1 className="m-0 mt-2 text-[28px] font-bold tracking-[-0.02em] text-[var(--bocar-text)] sm:text-[30px]">
                      {headerTitle}
                    </h1>
                    <p className="mt-2 mb-0 text-[13px] font-medium text-[var(--bocar-blue-50)]">
                      Page {currentIndex + 1} of {definition.pages.length} · {meta?.navLabel ?? currentPage}
                    </p>
                  </div>

                  <button
                    className="inline-flex shrink-0 items-center gap-2 py-2 text-[13px] font-semibold text-[var(--bocar-blue-100)] transition hover:text-[var(--bocar-blue-90)]"
                    type="button"
                    onClick={onBack}
                  >
                    <BackArrowIcon />
                    Back
                  </button>
                </div>

                <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#e5e9ef]">
                  <div
                    className="h-full rounded-full bg-[var(--bocar-blue-100)] transition-[width] duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {showFeedback ? (
                  <div
                    className={`mt-5 rounded-[12px] border px-4 py-3 text-[13px] leading-[1.55] ${getFeedbackClasses(feedback.tone)}`}
                    role={feedback.tone === 'error' ? 'alert' : 'status'}
                  >
                    {feedback.text}
                  </div>
                ) : null}

                <form
                  className="mt-8"
                  noValidate
                  onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
                >
                  {definition.renderPage(currentPage)}

                  <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {currentIndex === 0 ? (
                      <div className="hidden sm:block" />
                    ) : (
                      <button
                        className="inline-flex items-center justify-center rounded-[10px] border border-[#d9dee5] bg-white px-4 py-2.5 text-[13px] font-semibold text-[var(--bocar-blue-70)] transition hover:border-[var(--bocar-blue-70)] hover:text-[var(--bocar-blue-100)]"
                        type="button"
                        onClick={goPrevious}
                      >
                        ← Previous
                      </button>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        className="inline-flex h-11 min-w-[180px] items-center justify-center rounded-[10px] border border-[#d9dee5] bg-white px-5 text-[13px] font-semibold text-[var(--bocar-blue-100)] transition hover:border-[var(--bocar-blue-70)] hover:bg-[rgba(245,247,250,0.8)] disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={isSubmitting}
                        type="button"
                        onClick={handleSaveDraft}
                      >
                        Save Draft
                      </button>

                      {currentIndex === definition.pages.length - 1 ? (
                        <Button
                          className="h-11 min-w-[200px] rounded-[10px] bg-[var(--bocar-blue-100)] px-5 text-[13px] font-semibold text-white hover:bg-[#0b3b6b] disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={isSubmitting}
                          type="submit"
                        >
                          {isSubmitting
                            ? 'Submitting...'
                            : mode === 'edit'
                              ? 'Update Quotation'
                              : 'Submit Quotation'}
                        </Button>
                      ) : (
                        <Button
                          className="h-11 min-w-[180px] rounded-[10px] bg-[var(--bocar-blue-100)] px-5 text-[13px] font-semibold text-white hover:bg-[#0b3b6b]"
                          type="button"
                          onClick={() => {
                            void goNext();
                          }}
                        >
                          Next →
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </main>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}

function getInitialFeedback(mode: 'create' | 'edit', rfqId: string, quotationId?: string) {
  if (mode === 'edit') {
    return {
      text: `You are editing ${(quotationId ?? 'COT-001').toUpperCase()} for RFQ ${rfqId.toUpperCase()}.`,
      tone: 'neutral' as const,
    };
  }
  return {
    text: `Complete the sections marked as "Pending" and "Mixed". The fields inherited from RFQ ${rfqId.toUpperCase()} are not editable.`,
    tone: 'neutral' as const,
  };
}
