export { LoginForm } from '@/features/auth/components/LoginForm';
export { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
export { AuthProvider } from '@/features/auth/state/AuthProvider';
export { useAuth } from '@/features/auth/hooks/useAuth';
export { resolveHomeRouteForRole } from '@/features/auth/services/roleRouting';
export type { AccessMode, AppRole, AuthenticatedUser, PreviewVariant } from '@/features/auth/types';
