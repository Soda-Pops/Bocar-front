const ACCESS_KEY = 'bocar.auth.access';
const REFRESH_KEY = 'bocar.auth.refresh';

export type TokenPair = {
  access: string;
  refresh: string;
};

function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage lleno o deshabilitado: la sesion queda en memoria del modulo via getters/setters arriba
  }
}

function safeRemoveItem(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignorar
  }
}

export const tokenStorage = {
  getAccess(): string | null {
    return safeGetItem(ACCESS_KEY);
  },
  getRefresh(): string | null {
    return safeGetItem(REFRESH_KEY);
  },
  getPair(): TokenPair | null {
    const access = safeGetItem(ACCESS_KEY);
    const refresh = safeGetItem(REFRESH_KEY);
    if (!access || !refresh) {
      return null;
    }
    return { access, refresh };
  },
  setPair(pair: TokenPair): void {
    safeSetItem(ACCESS_KEY, pair.access);
    safeSetItem(REFRESH_KEY, pair.refresh);
  },
  setAccess(access: string): void {
    safeSetItem(ACCESS_KEY, access);
  },
  clear(): void {
    safeRemoveItem(ACCESS_KEY);
    safeRemoveItem(REFRESH_KEY);
  },
};
