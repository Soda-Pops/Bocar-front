import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import * as authService from '@/features/auth/services/authService';
import { mapUserDtoToAuthenticatedUser } from '@/features/auth/services/userMapper';
import { AuthContext, type AuthContextValue, type AuthStatus } from '@/features/auth/state/authContext';
import type { AuthenticatedUser } from '@/features/auth/types';
import { configureHttpClient } from '@/shared/http/httpClient';

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthStatus>({ status: 'initializing' });

  const setAuthenticated = useCallback((user: AuthenticatedUser) => {
    setState({ status: 'authenticated', user });
  }, []);

  const setAnonymous = useCallback(() => {
    setState({ status: 'anonymous' });
  }, []);

  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      await authService.refreshSession();
      return true;
    } catch {
      setAnonymous();
      return false;
    }
  }, [setAnonymous]);

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
      try {
        const dto = await authService.fetchCurrentUser();
        if (!cancelled) {
          setAuthenticated(mapUserDtoToAuthenticatedUser(dto));
        }
      } catch {
        if (!cancelled) {
          setState({ status: 'anonymous' });
        }
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setAuthenticated]);

  const login = useCallback<AuthContextValue['login']>(
    async (credentials) => {
      const response = await authService.login(credentials);
      const user = mapUserDtoToAuthenticatedUser(response.user);
      setAuthenticated(user);
      return user;
    },
    [setAuthenticated],
  );

  const logout = useCallback<AuthContextValue['logout']>(async () => {
    try {
      await authService.logout();
    } catch {
      // si la red falla, igual cerramos sesion local — las cookies expiraran solas
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
