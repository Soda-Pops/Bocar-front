
// Posibles errores relacionados con las solicitudes HTTP

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringifyErrorValue(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    const items = value.flatMap((item) => {
      const text = stringifyErrorValue(item);
      return text ? [text] : [];
    });
    return items.length > 0 ? items.join(', ') : null;
  }

  if (isRecord(value)) {
    return formatValidationErrors(value);
  }

  return null;
}

function formatValidationErrors(body: Record<string, unknown>, prefix = ''): string | null {
  const messages = Object.entries(body).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (isRecord(value)) {
      const nested = formatValidationErrors(value, path);
      return nested ? [nested] : [];
    }

    const text = stringifyErrorValue(value);
    return text ? [`${path}: ${text}`] : [];
  });

  return messages.length > 0 ? messages.join(' ') : null;
}

export function getApiErrorMessage(body: unknown): string | null {
  if (typeof body === 'string') return body.trim() || null;

  if (!isRecord(body)) return null;

  const detail = stringifyErrorValue(body.detail);
  if (detail) return detail;

  const message = stringifyErrorValue(body.message);
  if (message) return message;

  const error = stringifyErrorValue(body.error);
  if (error) return error;

  return formatValidationErrors(body);
}

function getDefaultHttpMessage(status: number): string {
  if (status >= 500) return 'El servidor no está disponible. Intenta de nuevo en unos momentos.';
  if (status === 404) return 'El recurso solicitado no fue encontrado.';
  if (status === 403) return 'No tienes permisos para realizar esta acción.';
  if (status === 401) return 'No autorizado';
  if (status === 400) return 'La solicitud no es válida. Revisa los datos e intenta de nuevo.';
  return 'No se pudo completar la operación. Intenta de nuevo.';
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? getApiErrorMessage(body) ?? getDefaultHttpMessage(status));
    this.name = 'HttpError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(body: unknown) {
    super(401, body, 'No autorizado');
    this.name = 'UnauthorizedError';
  }
}

export class NetworkError extends Error {
  public readonly originalError: unknown;
  constructor(originalError: unknown) {
    super('No se pudo conectar con el servidor');
    this.name = 'NetworkError';
    this.originalError = originalError;
  }
}

export class ResponseParseError extends Error {
  constructor(public readonly issues: unknown) {
    super('La respuesta del servidor no coincide con el formato esperado');
    this.name = 'ResponseParseError';
  }
}
