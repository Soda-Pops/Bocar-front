import { HttpError, NetworkError } from '@/shared/http/errors';

export function extractApiError(err: unknown): string {
  if (err instanceof HttpError) {
    const body = err.body;
    if (body && typeof body === 'object') {
      const b = body as Record<string, unknown>;
      if (b.code === 'rfq_incompleto') {
        return 'Este RFQ tiene campos faltantes. Ábrelo en edición y complétalos antes de enviarlo a Comercialización.';
      }
      if (typeof b.detail === 'string' && b.detail) return b.detail;
      if (typeof b.message === 'string' && b.message) return b.message;
      if (typeof b.error === 'string' && b.error) return b.error;
    }
    if (err.status >= 500) return 'El servidor no está disponible. Intenta de nuevo en unos momentos.';
    if (err.status === 404) return 'El recurso solicitado no fue encontrado.';
    if (err.status === 403) return 'No tienes permisos para realizar esta acción.';
    return 'No se pudo completar la operación. Intenta de nuevo.';
  }
  if (err instanceof NetworkError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Ocurrió un error inesperado.';
}
