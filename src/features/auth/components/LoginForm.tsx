import { useId } from 'react';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';

import { useLoginForm } from '@/features/auth/hooks/useLoginForm';

export function LoginForm() {
  const { form, onSubmit, formError } = useLoginForm();
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <div className="flex w-full max-w-[430px] flex-col rounded-[2px] bg-white px-6 pb-8 pt-10 shadow-[0_24px_42px_rgba(21,38,63,0.16)] sm:px-9 sm:pb-12 sm:pt-16 lg:h-[min(628px,calc(100svh-64px))] lg:max-w-[456px] lg:px-[44px] lg:pb-[42px] lg:pt-[66px]">
      <h2 className="m-0 text-center text-[24px] font-extrabold tracking-[-0.02em] text-[#002E5D] sm:text-[26px]">
        INICIAR SESIÓN
      </h2>

      <form className="mt-10 flex h-full flex-col gap-5" onSubmit={onSubmit} noValidate>
        <FormField
          label="Correo electronico"
          placeholder="usuario"
          type="email"
          autoComplete="email"
          register={register('email')}
          error={errors.email}
        />
        <FormField
          label="Contraseña"
          placeholder="contraseña"
          type="password"
          autoComplete="current-password"
          register={register('password')}
          error={errors.password}
        />

        {formError ? (
          <p
            role="alert"
            className="rounded-[4px] border border-[rgba(170,0,15,0.25)] bg-[rgba(170,0,15,0.06)] px-3 py-2 text-[13px] text-[var(--bocar-error,#aa000f)]"
          >
            {formError}
          </p>
        ) : null}

        <button
          className="mt-2 inline-flex h-11 items-center justify-center rounded-[4px] bg-[#002E5D] text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#002E5D] focus:outline-none focus:shadow-[0_0_0_3px_rgba(22,61,114,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'INGRESANDO...' : 'ENTRAR'}
        </button>
      </form>
    </div>
  );
}

type FormFieldProps = {
  label: string;
  placeholder: string;
  type: 'email' | 'password';
  autoComplete: 'email' | 'current-password';
  register: UseFormRegisterReturn;
  error?: FieldError | undefined;
};

function FormField({ label, placeholder, type, autoComplete, register, error }: FormFieldProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;

  return (
    <div className="grid gap-2">
      <label
        htmlFor={inputId}
        className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f88a8]"
      >
        {label}
      </label>
      <input
        id={inputId}
        autoComplete={autoComplete}
        className="h-11 w-full rounded-[4px] border border-[#d9e1ec] bg-white px-4 text-sm text-[#002E5D] outline-none placeholder:text-[#c2cbdb] focus:border-[#002E5D] focus:shadow-[0_0_0_2px_rgba(22,61,114,0.25)] aria-[invalid=true]:border-[var(--bocar-error,#aa000f)]"
        placeholder={placeholder}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...register}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-[12px] text-[var(--bocar-error,#aa000f)]">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
