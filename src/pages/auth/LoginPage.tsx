import logoBocar from '@/assets/images/Logo-Bocar.png';
import { LoginForm } from '@/features/auth';
import { AuthLayout } from '@/layouts/AuthLayout';

const benefits = [
  'Plataforma central para RFQs',
  'Seguimiento en tiempo real',
  'Control de procesos y proveedores',
];

function TopRightRings() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute -right-[92px] -top-[68px] h-[402px] w-[402px] opacity-100"
      viewBox="0 0 402 402"
      fill="none"
    >
      {[94, 118, 142, 166].map((radius) => (
        <circle key={radius} cx="201" cy="201" r={radius} stroke="rgba(140, 164, 195, 0.22)" strokeWidth="1" />
      ))}
    </svg>
  );
}

function BottomLeftRings() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-[255px] -left-[208px] h-[522px] w-[522px] opacity-100"
      viewBox="0 0 522 522"
      fill="none"
    >
      {[124, 164, 204, 244].map((radius) => (
        <circle key={radius} cx="261" cy="261" r={radius} stroke="rgba(140, 164, 195, 0.2)" strokeWidth="1" />
      ))}
    </svg>
  );
}

function LoginPage() {
  return (
    <AuthLayout
      leftPanel={
        <section
          className="relative overflow-hidden bg-[#002E5D] px-[50px] pb-10 pt-[52px] text-white"
          data-testid="login-left-panel"
        >
          <TopRightRings />
          <BottomLeftRings />

          <img alt="Bocar" className="block h-auto w-[178px] brightness-0 invert" src={logoBocar} />

          <div className="relative mt-[86px] max-w-[430px]">
            <h1 className="m-0 flex flex-col text-[58px] font-extrabold leading-[0.9] tracking-[-0.045em]">
              <span>ACCESO AL</span>
              <span className="text-[#7f95b2]">SISTEMA</span>
            </h1>
            <p className="mt-[18px] max-w-[420px] text-[12px] leading-[1.45] text-[#7f95b2]">
              Gestión centralizada de compras y proyectos de industrialización.
            </p>
          </div>

          <ul
            aria-label="Beneficios de la plataforma"
            className="relative mt-[84px] grid gap-[28px] p-0 text-[13px] text-[#e8eef6]"
          >
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-[12px]">
                <span aria-hidden="true" className="h-[9px] w-[9px] rounded-full bg-[#6f88a8]" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </section>
      }
      rightPanel={
        <section className="login-right-panel flex items-center justify-center bg-[#f6f5f2] px-5 py-8 sm:px-8 sm:py-12 lg:px-8 lg:py-8 [background:radial-gradient(circle_at_center,rgba(255,255,255,0.62),rgba(245,244,242,0)_58%),#f6f5f2]">
          <LoginForm />
        </section>
      }
    />
  );
}

export default LoginPage;