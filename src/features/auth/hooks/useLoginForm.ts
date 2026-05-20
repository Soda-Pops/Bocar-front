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
    return 'Correo o contraseña incorrectos.';
  }
  if (error instanceof HttpError) {
    if (error.status === 400) {
      return 'Los datos enviados no son validos.';
    }
    if (error.status >= 500) {
      return 'El servidor no esta disponible. Intenta de nuevo en unos minutos.';
    }
    return 'No pudimos iniciar sesion. Intenta de nuevo.';
  }
  if (error instanceof NetworkError) {
    return 'No se pudo conectar con el servidor. Revisa tu conexion.';
  }
  return 'Ocurrio un error inesperado. Intenta de nuevo.';
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
