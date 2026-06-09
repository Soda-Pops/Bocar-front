import type { FieldErrors, FieldPath, FieldValues, UseFormSetFocus } from 'react-hook-form';

/**
 * Generic helpers that derive page-level error state and invalid-submit
 * navigation from a definition's `requiredFieldsByPage` map.
 *
 * `requiredFieldsByPage` is the single source of truth for required fields:
 * to make a new field required, add its rule to the Zod schema AND its path
 * to `requiredFieldsByPage` under the page that renders it. Sidebar error
 * dots, error-page navigation, and focus-on-error all derive from it — no
 * other place needs to change.
 */

type RequiredFieldsByPage<TValues extends FieldValues> = Partial<
  Record<string, readonly FieldPath<TValues>[]>
>;

function getAtPath(target: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (acc === null || acc === undefined || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[segment];
  }, target);
}

export function hasErrorAtPath<TValues extends FieldValues>(
  errors: FieldErrors<TValues>,
  path: FieldPath<TValues>,
): boolean {
  return getAtPath(errors, path) !== undefined;
}

/** Marks each page that has at least one required field currently in error. */
export function buildPageErrorMap<TValues extends FieldValues>(
  requiredFieldsByPage: RequiredFieldsByPage<TValues>,
  errors: FieldErrors<TValues>,
): Partial<Record<string, boolean>> {
  const map: Partial<Record<string, boolean>> = {};
  for (const [page, fields] of Object.entries(requiredFieldsByPage)) {
    if (fields?.some((field) => hasErrorAtPath(errors, field))) map[page] = true;
  }
  return map;
}

/**
 * Navigates to the first page (in page order) containing a required field in
 * error and tries to focus that field. Focus is best-effort: paths that do not
 * correspond to a registered input (e.g. yes/no toggles) are skipped silently.
 */
export function goToFirstRequiredError<TValues extends FieldValues>(
  pages: readonly string[],
  requiredFieldsByPage: RequiredFieldsByPage<TValues>,
  fieldErrors: FieldErrors<TValues>,
  ctx: { setCurrentPage: (page: string) => void; setFocus: UseFormSetFocus<TValues> },
): void {
  for (const page of pages) {
    const fields = requiredFieldsByPage[page] ?? [];
    const firstError = fields.find((field) => hasErrorAtPath(fieldErrors, field));
    if (firstError) {
      ctx.setCurrentPage(page);
      try {
        ctx.setFocus(firstError);
      } catch {
        // Not a focusable registered input (e.g. YesNoToggle); navigation is enough.
      }
      return;
    }
  }
}
