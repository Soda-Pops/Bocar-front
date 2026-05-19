import type { ReactNode } from 'react';
import type { FieldErrors, FieldPath, FieldValues, Resolver, UseFormSetFocus } from 'react-hook-form';

export type NavItem = { key: string; label: string };
export type NavGroup = { key: string; label: string; items: readonly NavItem[] };
export type PageMeta = { navLabel: string; subtitle: string; title: string };
export type FeedbackTone = 'neutral' | 'success' | 'error';

export type RfqWorkspaceDefinition<TValues extends FieldValues> = {
  resolver: Resolver<TValues>;
  getCreateDefaultValues: () => TValues;
  getEditDefaultValues: (rfqId?: string) => TValues;
  pages: readonly string[];
  navGroups: readonly NavGroup[];
  pageMeta: Record<string, PageMeta>;
  requiredFieldsByPage: Partial<Record<string, readonly FieldPath<TValues>[]>>;
  renderPage: (page: string) => ReactNode;
  getCompletedMap: (values: TValues) => Partial<Record<string, boolean>>;
  getPageErrorMap: (errors: FieldErrors<TValues>) => Partial<Record<string, boolean>>;
  onInvalidSubmit?: (
    errors: FieldErrors<TValues>,
    ctx: { setCurrentPage: (p: string) => void; setFocus: UseFormSetFocus<TValues> }
  ) => void;
};
