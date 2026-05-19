import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FormProvider,
  type DefaultValues,
  type FieldValues,
  type SubmitErrorHandler,
  useForm,
  useWatch,
} from 'react-hook-form';

import logoBocar from '@/assets/images/Logo-Bocar.png';
import { dashboardUser } from '@/features/analytics/services/analyticsService';
import type { RfqTipo } from '@/features/analytics/types';
import { Button } from '@/shared/components/ui/Button';

import { BackArrowIcon, ChevronDownIcon, getFeedbackClasses } from './primitives';
import type { FeedbackTone, NavGroup, RfqWorkspaceDefinition } from './types';

// ─── Sidebar components ───────────────────────────────────────────────────────

function WorkspaceSidebar({
  completed,
  current,
  navGroups,
  onSelect,
  pageErrors,
}: {
  completed: Partial<Record<string, boolean>>;
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
                    const isDone = Boolean(completed[item.key]);

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
                        ) : isDone ? (
                          <span className="text-[12px] font-semibold text-[var(--bocar-done)]">●</span>
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
        Sección
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
  mode: 'create' | 'edit';
  onBack: () => void;
  rfqId?: string;
  tipo: RfqTipo;
};

export function RfqWorkspaceShell<TValues extends FieldValues>({
  definition,
  mode,
  onBack,
  rfqId,
  tipo,
}: RfqWorkspaceShellProps<TValues>) {
  const [currentPage, setCurrentPage] = useState<string>(definition.pages[0] ?? 'basic');
  const [feedback, setFeedback] = useState<{ text: string; tone: FeedbackTone }>(() =>
    getInitialFeedback(mode, rfqId)
  );
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const currentPageRef = useRef<string>(definition.pages[0] ?? 'basic');

  const defaults =
    mode === 'edit' ? definition.getEditDefaultValues(rfqId) : definition.getCreateDefaultValues();

  const form = useForm<TValues>({
    defaultValues: defaults as DefaultValues<TValues>,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: definition.resolver,
  });

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setFocus,
    trigger,
  } = form;

  const values = useWatch({ control });

  useEffect(() => {
    reset(
      (mode === 'edit'
        ? definition.getEditDefaultValues(rfqId)
        : definition.getCreateDefaultValues()) as DefaultValues<TValues>
    );
    setCurrentPage(definition.pages[0] ?? 'basic');
    setFeedback(getInitialFeedback(mode, rfqId));
    setAttemptedSubmit(false);
  }, [mode, reset, rfqId, tipo, definition]);

  currentPageRef.current = currentPage;

  const currentIndex = definition.pages.indexOf(currentPage);
  const completed = useMemo(
    () => definition.getCompletedMap(values as TValues),
    [values, definition]
  );
  const pageErrors = useMemo(() => definition.getPageErrorMap(errors), [errors, definition]);
  const meta = definition.pageMeta[currentPage];
  const headerTitle = mode === 'edit' ? 'EDITAR RFQ' : 'CREAR RFQ';

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
        setFeedback({
          text: 'Corrige los campos obligatorios marcados antes de avanzar al siguiente bloque.',
          tone: 'error',
        });
        return;
      }
    }

    setCurrentPage(nextPage);
    setFeedback({
      text: `Continua con ${definition.pageMeta[nextPage]?.navLabel ?? nextPage}. Tu progreso queda guardado como borrador local.`,
      tone: 'neutral',
    });
  }

  function goPrevious() {
    const prev = definition.pages[currentIndex - 1];
    if (prev) setCurrentPage(prev);
  }

  function handleSaveDraft() {
    setFeedback({
      text:
        mode === 'edit'
          ? `${(rfqId ?? 'RFQ-021').toUpperCase()} quedo guardada como borrador editable.`
          : 'Borrador guardado.',
      tone: 'success',
    });
  }

  async function handleValidSubmit() {
    setAttemptedSubmit(true);
    setFeedback({
      text:
        mode === 'edit'
          ? `${(rfqId ?? 'RFQ-021').toUpperCase()} quedo actualizada y lista para continuar el flujo.`
          : 'La RFQ quedo capturada en el nuevo flujo y esta lista para revision interna.',
      tone: 'success',
    });
  }

  const handleInvalidSubmit: SubmitErrorHandler<TValues> = (fieldErrors) => {
    setAttemptedSubmit(true);
    setFeedback({
      text: 'Revisa los campos marcados. El sidebar te indica en que bloque sigue habiendo informacion obligatoria pendiente.',
      tone: 'error',
    });
    definition.onInvalidSubmit?.(fieldErrors, { setCurrentPage, setFocus });
  };

  const progressPercent = ((currentIndex + 1) / definition.pages.length) * 100;
  const showFeedback = feedback.tone !== 'neutral' || attemptedSubmit;

  return (
    <FormProvider {...form}>
      <div className="flex min-h-screen flex-col bg-[#f5f7fa]">
        <header className="flex h-[72px] items-center justify-between border-b border-[#d9dee5] bg-white px-6 lg:px-10">
          <div className="flex items-center gap-3 lg:gap-5">
            <img alt="Bocar" className="h-9 w-auto lg:h-10" src={logoBocar} />
            <span aria-hidden="true" className="hidden h-8 w-px bg-[#d9dee5] lg:block" />
            <nav aria-label="breadcrumb" className="hidden items-center gap-2 text-[15px] sm:flex">
              <span className="font-medium text-[var(--bocar-blue-90)]">Industrializacion</span>
              <span aria-hidden="true" className="text-[var(--bocar-blue-30)]">›</span>
              <span className="font-medium text-[var(--bocar-blue-90)]">Crear RFQ</span>
              <span aria-hidden="true" className="text-[var(--bocar-blue-30)]">›</span>
              <span className="font-bold uppercase tracking-[0.04em] text-[var(--bocar-blue-100)]">
                {tipo}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bocar-blue-100)] text-[14px] font-semibold text-white">
              {dashboardUser.initials}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="m-0 truncate text-[14px] font-semibold text-[var(--bocar-text)]">
                {dashboardUser.name}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-[var(--bocar-blue-70)]">
                {dashboardUser.department}
              </p>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <WorkspaceSidebar
            completed={completed}
            current={currentPage}
            navGroups={definition.navGroups}
            onSelect={setCurrentPage}
            pageErrors={attemptedSubmit ? pageErrors : {}}
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
                      Página {currentIndex + 1} de {definition.pages.length} · {meta?.navLabel ?? currentPage}
                    </p>
                  </div>

                  <button
                    className="inline-flex shrink-0 items-center gap-2 py-2 text-[13px] font-semibold text-[var(--bocar-blue-100)] transition hover:text-[var(--bocar-blue-90)]"
                    type="button"
                    onClick={onBack}
                  >
                    <BackArrowIcon />
                    Regresar
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
                        ← Anterior
                      </button>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        className="inline-flex h-11 min-w-[180px] items-center justify-center rounded-[10px] border border-[#d9dee5] bg-white px-5 text-[13px] font-semibold text-[var(--bocar-blue-100)] transition hover:border-[var(--bocar-blue-70)] hover:bg-[rgba(245,247,250,0.8)] disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={isSubmitting}
                        type="button"
                        onClick={handleSaveDraft}
                      >
                        Guardar Borrador
                      </button>

                      {currentIndex === definition.pages.length - 1 ? (
                        <Button
                          className="h-11 min-w-[180px] rounded-[10px] bg-[var(--bocar-blue-100)] px-5 text-[13px] font-semibold text-white hover:bg-[#0b3b6b] disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={isSubmitting}
                          type="submit"
                        >
                          {isSubmitting ? 'Enviando...' : mode === 'edit' ? 'Actualizar RFQ' : 'Enviar RFQ'}
                        </Button>
                      ) : (
                        <Button
                          className="h-11 min-w-[180px] rounded-[10px] bg-[var(--bocar-blue-100)] px-5 text-[13px] font-semibold text-white hover:bg-[#0b3b6b]"
                          type="button"
                          onClick={() => {
                            void goNext();
                          }}
                        >
                          Siguiente →
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

function getInitialFeedback(mode: 'create' | 'edit', rfqId?: string) {
  if (mode === 'edit') {
    return {
      text: `Estas ajustando ${(rfqId ?? 'RFQ-021').toUpperCase()} con el nuevo workspace multipantalla.`,
      tone: 'neutral' as const,
    };
  }
  return {
    text: 'Completa las secciones del sidebar y envia la RFQ cuando ya no tengas campos obligatorios pendientes.',
    tone: 'neutral' as const,
  };
}
