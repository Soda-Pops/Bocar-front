import { sectionStyles } from '@/features/rfq/constants';
import type { SectionKey, SummaryCard } from '@/features/rfq/types';

// No se usa en las pantallas activas por ahora; reservado para integracion futura.

type RfqSummaryCardsProps = {
  cards: SummaryCard[];
  activeTab: SectionKey;
  onSelect: (key: SectionKey) => void;
};

// KPI cards drive the same active section as the tab bar.
export function RfqSummaryCards({ cards, activeTab, onSelect }: RfqSummaryCardsProps) {
  return (
    <>
      {cards.map((card) => {
        const style = sectionStyles[card.key];
        const isActive = activeTab === card.key;

        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelect(card.key)}
            className={[
              'h-[122px] w-[200px] rounded-[18px] border bg-white px-5 py-4 text-left shadow-[0_12px_28px_rgba(15,23,42,0.15)] transition-all',
              isActive
                ? 'border-[#1d5db4] ring-1 ring-[#1d5db4]'
                : 'border-transparent hover:border-slate-200',
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[14px] font-medium uppercase leading-5 text-black">
                {card.label}
              </p>
              <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
            </div>
            <p className="mt-5 text-center text-[54px] font-semibold leading-none tracking-tight text-[#1d5db4]">
              {card.value}
            </p>
          </button>
        );
      })}
    </>
  );
}
