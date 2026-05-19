import { useState } from 'react';

import logoBocar from '@/assets/images/Logo-Bocar.png';
import { dashboardUser } from '@/features/analytics/services/analyticsService';
import type { RfqTipo } from '@/features/analytics/types';
import { Button } from '@/shared/components/ui/Button';

type RfqTypeSelectionScreenProps = {
  onSelect: (tipo: RfqTipo) => void;
  onBack: () => void;
};

type TypeOption = {
  tipo: RfqTipo;
  title: string;
  description: string;
};

const TYPE_OPTIONS: readonly TypeOption[] = [
  {
    tipo: 'Trimming',
    title: 'Trimming',
    description: 'RFQ (Request for Quotation) para trimming.',
  },
  {
    tipo: 'Mold',
    title: 'Mold',
    description: 'RFQ (Request for Quotation) para moldes.',
  },
];

function BackArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <path d="M10.5 3.5L6 8L10.5 12.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M6.5 8H13.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" fill="currentColor" r="10" />
      <path
        d="M6 10.5L8.5 13L14 7.5"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TypeCard({
  isSelected,
  onClick,
  option,
}: {
  isSelected: boolean;
  onClick: () => void;
  option: TypeOption;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={[
        'group relative flex min-h-[240px] flex-col justify-between rounded-2xl border bg-white p-8 text-left shadow-[0_8px_24px_rgba(0,46,93,0.06)] transition sm:min-h-[280px] sm:p-10',
        isSelected
          ? 'border-[var(--bocar-blue-100)] ring-2 ring-[rgba(0,46,93,0.18)]'
          : 'border-[#d9dee5] hover:border-[var(--bocar-blue-70)] hover:shadow-[0_12px_28px_rgba(0,46,93,0.1)]',
      ].join(' ')}
      type="button"
      onClick={onClick}
    >
      <div className="flex flex-col gap-4 pr-8">

        <h3 className="m-0 text-[30px] font-semibold tracking-[-0.02em] text-[var(--bocar-text)] sm:text-[34px]">
          {option.title}
        </h3>
        <p className="m-0 max-w-[360px] text-[15px] leading-[1.65] text-[var(--bocar-blue-70)]">
          {option.description}
        </p>
      </div>

      {isSelected ? (
        <span className="absolute right-6 top-6 text-[var(--bocar-blue-100)]">
          <CheckCircleIcon />
        </span>
      ) : null}
    </button>
  );
}

export function RfqTypeSelectionScreen({ onBack, onSelect }: RfqTypeSelectionScreenProps) {
  const [selectedTipo, setSelectedTipo] = useState<RfqTipo | null>(null);

  const handleContinue = () => {
    if (selectedTipo) {
      onSelect(selectedTipo);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7fa]">
      <header className="flex h-[72px] items-center justify-between border-b border-[#d9dee5] bg-white px-6 lg:px-10">
        <div className="flex items-center gap-4 lg:gap-5">
          <img alt="Bocar" className="h-9 w-auto lg:h-10" src={logoBocar} />
          <span aria-hidden="true" className="hidden h-8 w-px bg-[#d9dee5] lg:block" />
          <nav aria-label="breadcrumb" className="flex items-center gap-2 text-[15px]">
            <span className="font-medium text-[var(--bocar-blue-90)]">Industrializacion</span>
            <span aria-hidden="true" className="text-[var(--bocar-blue-30)]">›</span>
            <span className="font-bold text-[var(--bocar-blue-100)]">Crear RFQ</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bocar-blue-100)] text-[14px] font-semibold text-white">
            {dashboardUser.initials}
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="m-0 truncate text-[14px] font-semibold text-[var(--bocar-text)]">
              {dashboardUser.name}
            </p>
            <p className="mt-0.5 truncate text-[12px] text-[var(--bocar-blue-70)]">
              {dashboardUser.department}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-10 lg:px-12 lg:py-14">
        <div className="mx-auto w-full max-w-[1180px]">
          <div className="flex flex-col gap-2">
            <h1 className="m-0 text-[28px] font-bold tracking-[-0.02em] text-[var(--bocar-text)] sm:text-[32px]">
              Selecciona el tipo de RFQ
            </h1>
            <p className="m-0 text-[14px] leading-[1.6] text-[var(--bocar-blue-50)]">
              Paso 1 de 2
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:gap-6 md:grid-cols-2">
            {TYPE_OPTIONS.map((option) => (
              <TypeCard
                key={option.tipo}
                isSelected={selectedTipo === option.tipo}
                option={option}
                onClick={() => setSelectedTipo(option.tipo)}
              />
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-[#f5f7fa] px-6 py-4 lg:px-12">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="inline-flex items-center gap-2 self-start py-2 text-[13px] font-semibold text-[var(--bocar-blue-100)] transition hover:text-[var(--bocar-blue-90)]"
            type="button"
            onClick={onBack}
          >
            <BackArrowIcon />
            Regresar
          </button>

          <Button
            className="h-11 min-w-[180px] rounded-[10px] bg-[var(--bocar-blue-100)] px-6 text-[13px] font-semibold text-white transition hover:bg-[#0b3b6b] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!selectedTipo}
            type="button"
            onClick={handleContinue}
          >
            Continuar →
          </Button>
        </div>
      </footer>
    </div>
  );
}
