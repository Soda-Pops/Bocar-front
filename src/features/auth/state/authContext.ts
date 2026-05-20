import { createContext } from 'react';

import type { AuthenticatedUser } from '@/features/auth/types';

export type AuthStatus =
  | { status: 'initializing' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: AuthenticatedUser };

export type AuthContextValue = AuthStatus & {
  login: (credentials: { email: string; password: string }) => Promise<AuthenticatedUser>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
