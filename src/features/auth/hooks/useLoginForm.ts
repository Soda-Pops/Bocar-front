import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  loginFormDefaults,
  loginFormResolver,
  type LoginFormValues,
} from '@/features/auth/components/loginFormSchema';
import { resolveHomeRouteForRole } from '@/features/auth/services/roleRouting';
import { HttpError, NetworkError, UnauthorizedError } from '@/shared/http/errors';

type LocationState = { from?: { pathname: string } };

function getErrorMessage(error: unknown): string {
  if (error instanceof UnauthorizedError) {
    return 'Incorrect email or password.';
  }
  if (error instanceof HttpError) {
    if (error.status === 400) {
      return 'The submitted data is not valid.';
    }
    if (error.status >= 500) {
      return 'The server is unavailable. Please try again in a few minutes.';
    }
    return 'We could not sign you in. Please try again.';
  }
  if (error instanceof NetworkError) {
    return 'Could not connect to the server. Check your internet connection.';
  }
  return 'An unexpected error occurred. Please try again.';
}

export function useLoginForm() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: loginFormResolver,
    defaultValues: loginFormDefaults,
    mode: 'onBlur',
    shouldFocusError: true,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await auth.login(values);
      const state = location.state as LocationState | null;
      const target = state?.from?.pathname ?? resolveHomeRouteForRole(user.role);
      navigate(target, { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  });

  return {
    form,
    onSubmit,
    formError,
    clearFormError: () => setFormError(null),
  };
}
