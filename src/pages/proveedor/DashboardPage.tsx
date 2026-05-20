import { MainLayout } from '@/layouts/MainLayout';
import { Header } from '@/layouts/components/Header';

function SupplierDashboardPage() {
  return (
    <MainLayout header={<Header areaLabel="Proveedor" />}>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bocar-blue-100,#002E5D)] opacity-10"
        />
        <h1 className="text-[22px] font-bold text-[var(--bocar-blue-100,#002E5D)]">
          Área de Proveedor
        </h1>
        <p className="max-w-sm text-[13px] leading-relaxed text-[var(--bocar-blue-70,#6f88a8)]">
          Esta sección estará disponible próximamente. Aquí podrás consultar las RFQs asignadas y
          enviar tus cotizaciones.
        </p>
      </div>
    </MainLayout>
  );
}

export default SupplierDashboardPage;
