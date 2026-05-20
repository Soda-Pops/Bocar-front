import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';

import * as authService from '@/features/auth/services/authService';
import { isJwtExpired } from '@/features/auth/services/jwt';
import { mapAccessTokenToUser } from '@/features/auth/services/userMapper';
import { AuthContext, type AuthContextValue, type AuthStatus } from '@/features/auth/state/authContext';
import type { AuthenticatedUser } from '@/features/auth/types';
import { configureHttpClient } from '@/shared/http/httpClient';
import { tokenStorage } from '@/shared/http/tokenStorage';

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthStatus>({ status: 'initializing' });
  const stateRef = useRef(state);
  stateRef.current = state;

  const setAuthenticated = useCallback((user: AuthenticatedUser) => {
    setState({ status: 'authenticated', user });
  }, []);

  const setAnonymous = useCallback(() => {
    tokenStorage.clear();
    setState({ status: 'anonymous' });
  }, []);

  const refresh = useCallback(async (): Promise<string | null> => {
    const refreshToken = tokenStorage.getRefresh();
    if (!refreshToken) {
      return null;
    }
    try {
      const pair = await authService.refreshAccessToken(refreshToken);
      tokenStorage.setPair(pair);
      setAuthenticated(mapAccessTokenToUser(pair.access));
      return pair.access;
    } catch {
      setAnonymous();
      return null;
    }
  }, [setAnonymous, setAuthenticated]);

  useEffect(() => {
    configureHttpClient({
      refresh,
      onUnauthorized: setAnonymous,
    });
    return () => configureHttpClient({});
  }, [refresh, setAnonymous]);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const pair = tokenStorage.getPair();
      if (!pair) {
        if (!cancelled) {
          setState({ status: 'anonymous' });
        }
        return;
      }
      try {
        if (!isJwtExpired(pair.access)) {
          if (!cancelled) {
            setAuthenticated(mapAccessTokenToUser(pair.access));
          }
          return;
        }
        const newAccess = await refresh();
        if (cancelled) {
          return;
        }
        if (!newAccess) {
          setState({ status: 'anonymous' });
        }
      } catch {
        if (!cancelled) {
          setAnonymous();
        }
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [refresh, setAuthenticated]);

  const login = useCallback<AuthContextValue['login']>(
    async (credentials) => {
      const pair = await authService.login(credentials);
      tokenStorage.setPair(pair);
      const user = mapAccessTokenToUser(pair.access);
      setAuthenticated(user);
      return user;
    },
    [setAuthenticated],
  );

  const logout = useCallback<AuthContextValue['logout']>(async () => {
    const refreshToken = tokenStorage.getRefresh();
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch {
        // si falla el blacklist remoto igual cerramos sesion local
      }
    }
    setAnonymous();
  }, [setAnonymous]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
    }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
