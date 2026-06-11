import type { ReactNode } from 'react';
import type { FieldErrors, FieldPath, FieldValues, Resolver, UseFormSetFocus } from 'react-hook-form';

export type SectionType = 'readonly' | 'hybrid' | 'supplier';
export type NavItem = { key: string; label: string };
export type NavGroup = { key: string; label: string; items: readonly NavItem[] };
export type PageMeta = {
  navLabel: string;
  subtitle: string;
  title: string;
  sectionType?: SectionType;
};
export type FeedbackTone = 'neutral' | 'success' | 'error';

export type RfqWorkspaceDefinition<TValues extends FieldValues> = {
  resolver: Resolver<TValues>;
  draftResolver: Resolver<TValues>;
  submitResolver: Resolver<TValues>;
  getCreateDefaultValues: () => TValues;
  getEditDefaultValues: (rfqId?: string) => TValues;
  pages: readonly string[];
  navGroups: readonly NavGroup[];
  pageMeta: Record<string, PageMeta>;
  requiredFieldsByPage: Partial<Record<string, readonly FieldPath<TValues>[]>>;
  draftRequiredFieldsByPage: Partial<Record<string, readonly FieldPath<TValues>[]>>;
  submitRequiredFieldsByPage: Partial<Record<string, readonly FieldPath<TValues>[]>>;
  renderPage: (page: string, readOnly?: boolean) => ReactNode;
  getCompletedMap: (values: TValues) => Partial<Record<string, boolean>>;
  getPageErrorMap: (errors: FieldErrors<TValues>) => Partial<Record<string, boolean>>;
  getDraftPageErrorMap: (errors: FieldErrors<TValues>) => Partial<Record<string, boolean>>;
  getSubmitPageErrorMap: (errors: FieldErrors<TValues>) => Partial<Record<string, boolean>>;
  onInvalidSubmit?: (
    errors: FieldErrors<TValues>,
    ctx: { setCurrentPage: (p: string) => void; setFocus: UseFormSetFocus<TValues> }
  ) => void;
  onInvalidDraft?: (
    errors: FieldErrors<TValues>,
    ctx: { setCurrentPage: (p: string) => void; setFocus: UseFormSetFocus<TValues> }
  ) => void;
};
