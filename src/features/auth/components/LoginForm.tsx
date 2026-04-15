export function LoginForm() {
  return (
    <div className="flex w-full max-w-[430px] flex-col rounded-[2px] bg-white px-6 pb-8 pt-10 shadow-[0_24px_42px_rgba(21,38,63,0.16)] sm:px-9 sm:pb-12 sm:pt-16 lg:h-[min(628px,calc(100svh-64px))] lg:max-w-[456px] lg:px-[44px] lg:pb-[42px] lg:pt-[66px]">
      <h2 className="m-0 text-center text-[24px] font-extrabold tracking-[-0.02em] text-[#002E5D] sm:text-[26px]">
        INICIAR SESIÓN
      </h2>

      <form className="mt-10 flex h-full flex-col gap-5" onSubmit={(event) => event.preventDefault()}>
        <FormField
          label="Correo electronico"
          name="email"
          placeholder="usuario"
          type="email"
        />
        <FormField
          label="Contraseña"
          name="password"
          placeholder="contraseña"
          type="password"
        />
        <button
          className="mt-2 h-11 rounded-[4px] bg-[#002E5D] text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#002E5D] focus:outline-none focus:shadow-[0_0_0_3px_rgba(22,61,114,0.18)]"
          type="submit"
        >
          ENTRAR
        </button>
      </form>
    </div>
  );
}

type FormFieldProps = {
  label: string;
  name: string;
  placeholder: string;
  type: 'email' | 'password';
};

function FormField({ label, name, placeholder, type }: FormFieldProps) {
  return (
    <label className="grid gap-2">
      <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f88a8]">
        {label}
      </span>
      <input
        aria-label={label}
        autoComplete={type === 'email' ? 'email' : 'current-password'}
        className="h-11 w-full rounded-[4px] border border-[#d9e1ec] bg-white px-4 text-sm text-[#002E5D] outline-none placeholder:text-[#c2cbdb] focus:border-[#002E5D] focus:shadow-[0_0_0_2px_rgba(22,61,114,0.25)]"
        name={name}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}