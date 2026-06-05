import type { ZodType } from 'zod';

import { env } from '@/app/config/env';
import { HttpError, NetworkError, ResponseParseError, UnauthorizedError } from '@/shared/http/errors';

type HttpHandlers = {
  refresh?: () => Promise<boolean>;
  onUnauthorized?: () => void;
};

let handlers: HttpHandlers = {};
let inFlightRefresh: Promise<boolean> | null = null;

export function configureHttpClient(next: HttpHandlers): void {
  handlers = next;
}

type RequestOptions<T> = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  auth?: boolean;
  schema?: ZodType<T>;
};

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${env.apiBaseUrl}${suffix}`;
}

async function runRefresh(): Promise<boolean> {
  if (!handlers.refresh) {
    return false;
  }
  if (!inFlightRefresh) {
    inFlightRefresh = handlers
      .refresh()
      .catch(() => false)
      .finally(() => {
        inFlightRefresh = null;
      });
  }
  return inFlightRefresh;
}

async function readBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (response.status === 204) {
    return null;
  }
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  try {
    const text = await response.text();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

async function executeRequest(url: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers ?? {});
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  try {
    return await fetch(url, { ...init, headers, credentials: 'include' });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') {
      throw cause;
    }
    throw new NetworkError(cause);
  }
}

export async function request<T = unknown>(
  path: string,
  options: RequestOptions<T> = {},
): Promise<T> {
  const { method = 'GET', body, headers, signal, auth = true, schema } = options;
  const url = buildUrl(path);
  const init: RequestInit = {
    method,
    headers,
    signal,
  };
  if (body !== undefined) {
    init.body =
      typeof body === 'string' || (typeof FormData !== 'undefined' && body instanceof FormData)
        ? (body as BodyInit)
        : JSON.stringify(body);
  }

  let response = await executeRequest(url, init);

  if (response.status === 401 && auth) {
    const refreshed = await runRefresh();
    if (refreshed) {
      response = await executeRequest(url, init);
    }
    if (response.status === 401) {
      handlers.onUnauthorized?.();
      throw new UnauthorizedError(await readBody(response));
    }
  }

  const responseBody = await readBody(response);

  if (!response.ok) {
    throw new HttpError(response.status, responseBody);
  }

  if (!schema) {
    return responseBody as T;
  }

  const parsed = schema.safeParse(responseBody);
  if (!parsed.success) {
    throw new ResponseParseError(parsed.error.issues);
  }
  return parsed.data;
}

export const http = {
  get: <T>(path: string, options?: Omit<RequestOptions<T>, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions<T>, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions<T>, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions<T>, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions<T>, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
