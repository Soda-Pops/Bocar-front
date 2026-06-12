import { HttpError, NetworkError } from '@/shared/http/errors';

export function extractApiError(err: unknown): string {
  if (err instanceof HttpError) {
    const body = err.body;
    if (body && typeof body === 'object') {
      const b = body as Record<string, unknown>;
      if (b.code === 'rfq_incompleto') {
        return 'This RFQ has missing fields. Open it for editing and complete them before submitting to Purchasing.';
      }
      if (typeof b.detail === 'string' && b.detail) return b.detail;
      if (typeof b.message === 'string' && b.message) return b.message;
      if (typeof b.error === 'string' && b.error) return b.error;
    }
    if (err.status >= 500) return 'The server is not available. Please try again in a few moments.';
    if (err.status === 404) return 'The requested resource was not found.';
    if (err.status === 403) return 'You do not have permission to perform this action.';
    return 'The operation could not be completed. Please try again.';
  }
  if (err instanceof NetworkError) return err.message;
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
}
