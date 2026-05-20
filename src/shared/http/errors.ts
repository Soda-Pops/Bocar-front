
// Posibles errores relacionados con las solicitudes HTTP
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `HTTP ${status}`);
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
