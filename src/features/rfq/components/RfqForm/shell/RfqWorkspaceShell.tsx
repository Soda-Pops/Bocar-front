import { useEffect, useRef, useState, type BaseSyntheticEvent } from 'react';
import {
  FormProvider,
  type DefaultValues,
  type FieldErrors,
  type FieldPath,
  type FieldValues,
  type SubmitErrorHandler,
  useForm,
} from 'react-hook-form';

import type { RfqTipo } from '@/features/analytics/types';
import { Header } from '@/layouts/components/Header';
import { Button } from '@/shared/components/ui/Button';
import { extractApiError } from '@/shared/utils/extractApiError';

import { BackArrowIcon, ChevronDownIcon, getFeedbackClasses } from './primitives';
import type { FeedbackTone, NavGroup, RfqWorkspaceDefinition } from './types';

// ─── Sidebar components ───────────────────────────────────────────────────────

function WorkspaceSidebar({
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

function WorkspaceSidebarMobile({
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

type RfqWorkspaceShellProps<TValues extends FieldValues> = {
  definition: RfqWorkspaceDefinition<TValues>;
  initialValues?: TValues;
  mode: 'create' | 'edit' | 'view';
  onBack: () => void;
  onCreatedDashboard?: () => void;
  onSaveDraft?: (values: TValues) => Promise<{ created?: boolean; detail?: string; id?: number } | void>;
  onSubmit?: (values: TValues) => Promise<{ created?: boolean; submitted?: boolean; id?: number } | void>;
  rfqId?: string;
  tipo: RfqTipo;
  areaPrefix?: string;
};

export function RfqWorkspaceShell<TValues extends FieldValues>({
  definition,
  initialValues,
  mode,
  onBack,
  onCreatedDashboard,
  onSaveDraft,
  onSubmit,
  rfqId,
  tipo,
  areaPrefix,
}: RfqWorkspaceShellProps<TValues>) {
  const readOnly = mode === 'view';
  const [currentPage, setCurrentPage] = useState<string>(definition.pages[0] ?? 'basic');
  const [feedback, setFeedback] = useState<{ text: string; tone: FeedbackTone }>(() =>
    getInitialFeedback(mode, rfqId)
  );
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [lastAttemptMode, setLastAttemptMode] = useState<'draft' | 'submit'>('draft');
  const [actionPending, setActionPending] = useState(false);
  const [createdSuccessfully, setCreatedSuccessfully] = useState(false);
  const [visiblePageErrors, setVisiblePageErrors] = useState<Partial<Record<string, boolean>>>({});
  const actionPendingRef = useRef(false);
  const currentPageRef = useRef<string>(definition.pages[0] ?? 'basic');
  const skipNextEmptyPageErrorSyncRef = useRef(false);

  const defaults =
    initialValues ??
    (mode === 'create' ? definition.getCreateDefaultValues() : definition.getEditDefaultValues(rfqId));

  const form = useForm<TValues>({
    defaultValues: defaults as DefaultValues<TValues>,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: definition.draftResolver,
  });

  const {
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    reset,
    setError,
    setFocus,
    trigger,
  } = form;

  useEffect(() => {
    reset(
      (initialValues ??
        (mode === 'create'
        ? definition.getCreateDefaultValues()
        : definition.getEditDefaultValues(rfqId))) as DefaultValues<TValues>
    );
    setCurrentPage(definition.pages[0] ?? 'basic');
    setFeedback(getInitialFeedback(mode, rfqId));
    setAttemptedSubmit(false);
    setActionPending(false);
    actionPendingRef.current = false;
    setCreatedSuccessfully(false);
    setVisiblePageErrors({});
  }, [mode, reset, rfqId, tipo, definition, initialValues]);

  currentPageRef.current = currentPage;

  const currentIndex = definition.pages.indexOf(currentPage);
  const getActivePageErrorMap =
    lastAttemptMode === 'submit' ? definition.getSubmitPageErrorMap : definition.getDraftPageErrorMap;
  const pageErrors = getActivePageErrorMap(errors);
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
      setFeedback(getInitialFeedback(mode, rfqId));
    }
  }, [errors, attemptedSubmit, mode, rfqId, pageErrorSignature]);

  const meta = definition.pageMeta[currentPage];
  const headerTitle = mode === 'view' ? 'RFQ DETAIL' : mode === 'edit' ? 'EDIT RFQ' : 'CREATE RFQ';

  async function goNext() {
    const nextPage = definition.pages[currentIndex + 1];
    if (!nextPage) return;

    // Read-only navigation: jump straight to the next page without validation.
    if (readOnly) {
      setCurrentPage(nextPage);
      return;
    }

    const requiredFields = definition.draftRequiredFieldsByPage[currentPage] ?? [];

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

  async function handleValidSaveDraft(values: TValues) {
    setLastAttemptMode('draft');
    setAttemptedSubmit(false);
    setVisiblePageErrors({});
    setCreatedSuccessfully(false);

    if (!onSaveDraft) {
      setFeedback({
        text:
          mode === 'edit'
            ? `${(rfqId ?? 'RFQ-021').toUpperCase()} was saved as an editable draft.`
            : 'Draft saved.',
        tone: 'success',
      });
      return;
    }

    try {
      const result = await onSaveDraft(values);
      if (result?.created) {
        setCreatedSuccessfully(true);
      }
      setFeedback({
        text:
          result?.detail ??
          (mode === 'edit'
            ? `${(rfqId ?? 'RFQ-021').toUpperCase()} was saved in Industrialization.`
            : 'RFQ saved as draft in Industrialization.'),
        tone: 'success',
      });
    } catch (error) {
      setFeedback({
        text: extractApiError(error),
        tone: 'error',
      });
    }
  }

  async function handleValidSubmit(values: TValues) {
    setLastAttemptMode('submit');
    setAttemptedSubmit(false);
    setVisiblePageErrors({});
    setCreatedSuccessfully(false);
    if (onSubmit) {
      try {
        const result = await onSubmit(values);
        if (result?.created || result?.submitted) {
          setCreatedSuccessfully(true);
          setFeedback({
            text: result.submitted
              ? 'RFQ submitted to Commercialization successfully.'
              : 'RFQ created successfully. The draft is now available in the Industrialization dashboard.',
            tone: 'success',
          });
          return;
        }
      } catch (error) {
        setFeedback({
          text: extractApiError(error),
          tone: 'error',
        });
        return;
      }
    }
    setFeedback({
      text:
        mode === 'edit'
          ? `${(rfqId ?? 'RFQ-021').toUpperCase()} was updated and is ready to continue the workflow.`
          : 'The RFQ was captured in the new workflow and is ready for internal review.',
      tone: 'success',
    });
  }

  const handleInvalidSubmit = (
    fieldErrors: FieldErrors<TValues>,
    validationMode: 'draft' | 'submit' = 'submit',
  ) => {
    setLastAttemptMode(validationMode);
    setAttemptedSubmit(true);
    setFeedback({
      text: 'This section has required fields that are not complete.',
      tone: 'error',
    });
    const errorMap =
      validationMode === 'submit'
        ? definition.getSubmitPageErrorMap(fieldErrors)
        : definition.getDraftPageErrorMap(fieldErrors);
    skipNextEmptyPageErrorSyncRef.current = true;
    setVisiblePageErrors(errorMap);
    const firstErrorPage = definition.pages.find((p) => errorMap[p]);
    if (firstErrorPage) setCurrentPage(firstErrorPage);
    if (validationMode === 'submit') {
      definition.onInvalidSubmit?.(fieldErrors, { setCurrentPage, setFocus });
    } else {
      definition.onInvalidDraft?.(fieldErrors, { setCurrentPage, setFocus });
    }
  };

  const handleInvalidDraft: SubmitErrorHandler<TValues> = (fieldErrors) => {
    handleInvalidSubmit(fieldErrors, 'draft');
  };

  function applyResolverErrors(fieldErrors: FieldErrors<TValues>) {
    function walk(target: unknown, prefix = '') {
      if (!target || typeof target !== 'object') return;
      const record = target as Record<string, unknown>;
      if ('type' in record || 'message' in record) {
        setError(prefix as FieldPath<TValues>, {
          type: typeof record.type === 'string' ? record.type : 'manual',
          message: typeof record.message === 'string' ? record.message : 'This field is required.',
        });
        return;
      }
      Object.entries(record).forEach(([key, value]) => {
        walk(value, prefix ? `${prefix}.${key}` : key);
      });
    }

    walk(fieldErrors);
  }

  function unlockAction() {
    actionPendingRef.current = false;
    setActionPending(false);
  }

  function submitOnce(validHandler: (values: TValues) => Promise<void>, validationMode: 'draft' | 'submit') {
    return (event?: BaseSyntheticEvent) => {
      if (actionPendingRef.current) {
        event?.preventDefault();
        return;
      }

      actionPendingRef.current = true;
      setActionPending(true);
      void handleSubmit(
        async (values) => {
          try {
            if (validationMode === 'submit') {
              const result = await definition.submitResolver(getValues(), undefined, {
                criteriaMode: 'firstError',
                fields: {},
                names: undefined,
                shouldUseNativeValidation: false,
              });
              if (Object.keys(result.errors).length > 0) {
                applyResolverErrors(result.errors);
                handleInvalidSubmit(result.errors, 'submit');
                return;
              }
            }
            await validHandler(values);
          } finally {
            unlockAction();
          }
        },
        (fieldErrors) => {
          try {
            if (validationMode === 'draft') {
              handleInvalidDraft(fieldErrors);
            } else {
              handleInvalidSubmit(fieldErrors, 'submit');
            }
          } finally {
            unlockAction();
          }
        },
      )(event);
    };
  }

  const progressPercent = ((currentIndex + 1) / definition.pages.length) * 100;
  const showFeedback = readOnly || feedback.tone === 'success' || feedback.tone === 'error';
  const disableWorkspace = readOnly || createdSuccessfully;
  const disableActions = isSubmitting || actionPending;

  return (
    <FormProvider {...form}>
      <div className="flex min-h-screen flex-col bg-[#f5f7fa]">
        <Header areaLabel={`${areaPrefix ?? (readOnly ? 'Purchasing' : 'Industrialization')} · ${headerTitle} · ${tipo}`} />

        <div className="flex min-h-0 flex-1">
          <WorkspaceSidebar
            current={currentPage}
            navGroups={definition.navGroups}
            onSelect={setCurrentPage}
            pageErrors={attemptedSubmit ? visiblePageErrors : {}}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <WorkspaceSidebarMobile
              current={currentPage}
              navGroups={definition.navGroups}
              onSelect={setCurrentPage}
            />

            <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-12 lg:py-10">
              <div className="mx-auto w-full max-w-[960px]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="m-0 text-[28px] font-bold tracking-[-0.02em] text-[var(--bocar-text)] sm:text-[30px]">
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
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span>{feedback.text}</span>
                      {createdSuccessfully ? (
                        <button
                          className="inline-flex h-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--bocar-blue-100)] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0b3b6b]"
                          type="button"
                          onClick={onCreatedDashboard ?? onBack}
                        >
                          Back to dashboard
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <form
                  className="mt-8"
                  noValidate
                  onSubmit={submitOnce(handleValidSubmit, 'submit')}
                >
                  <fieldset disabled={disableWorkspace} className="m-0 min-w-0 border-0 p-0">
                    {definition.renderPage(currentPage, readOnly)}
                  </fieldset>

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
                      {!disableWorkspace ? (
                        <button
                          className="inline-flex h-11 min-w-[180px] items-center justify-center rounded-[10px] border border-[#d9dee5] bg-white px-5 text-[13px] font-semibold text-[var(--bocar-blue-100)] transition hover:border-[var(--bocar-blue-70)] hover:bg-[rgba(245,247,250,0.8)] disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={disableActions}
                          type="button"
                          onClick={submitOnce(handleValidSaveDraft, 'draft')}
                        >
                          {disableActions ? 'Saving...' : 'Save Draft'}
                        </button>
                      ) : null}

                      {currentIndex === definition.pages.length - 1 ? (
                        disableWorkspace ? null : (
                          <Button
                            className="h-11 min-w-[180px] rounded-[10px] bg-[var(--bocar-blue-100)] px-5 text-[13px] font-semibold text-white hover:bg-[#0b3b6b] disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={disableActions}
                            type="submit"
                          >
                            {disableActions ? 'Submitting...' : 'Submit RFQ'}
                          </Button>
                        )
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

function getInitialFeedback(mode: 'create' | 'edit' | 'view', rfqId?: string) {
  if (mode === 'view') {
    return {
      text: `You are viewing ${(rfqId ?? 'RFQ-021').toUpperCase()} in read-only mode. Navigate through the sidebar sections to review all data.`,
      tone: 'neutral' as const,
    };
  }
  if (mode === 'edit') {
    return {
      text: `You are editing ${(rfqId ?? 'RFQ-021').toUpperCase()} with the new multi-screen workspace.`,
      tone: 'neutral' as const,
    };
  }
  return {
    text: 'Complete the sidebar sections and submit the RFQ when all required fields are complete.',
    tone: 'neutral' as const,
  };
}
