import { sectionStyles } from '@/features/rfq/constants';
import type { Section, SectionKey, SummaryCard } from '@/features/rfq/types';
import { getSectionSummary } from '@/shared/utils/dashboard';
import { RfqTable } from '@/features/rfq/components/RfqList/RfqTable';

// No se usa en las pantallas activas por ahora; reservado para integracion futura.

type RfqTabbedTableProps = {
  sections: Section[];
  activeTab: SectionKey;
  onTabChange: (key: SectionKey) => void;
  summaryCards: SummaryCard[];
};

// Main content area: tab navigation + contextual header + data table.
export function RfqTabbedTable({
  sections,
  activeTab,
  onTabChange,
  summaryCards,
}: RfqTabbedTableProps) {
  const activeSection = sections.find((section) => section.key === activeTab) ?? sections[0];
  const activeSummary = getSectionSummary(summaryCards, activeSection.key);
  const sectionStyle = sectionStyles[activeSection.key];

  return (
    <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.14)]">
      <div className="border-b border-slate-200 px-6 pt-4">
        <div className="flex flex-wrap gap-4">
          {sections.map((section) => {
            const isActive = section.key === activeTab;
            const style = sectionStyles[section.key];

            return (
              <button
                key={section.key}
                type="button"
                onClick={() => onTabChange(section.key)}
                className={[
                  'inline-flex items-center gap-3 border-b-2 px-0 pb-4 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-[#1d5db4] text-[#1d5db4]'
                    : 'border-transparent text-slate-500 hover:text-slate-700',
                ].join(' ')}
              >
                <span>{section.title}</span>
                <span
                  className={[
                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                    isActive ? 'bg-slate-100 text-slate-500' : style.badge,
                  ].join(' ')}
                >
                  {section.rows.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6">
        <div className="mb-5 flex items-start justify-between gap-6">
          <div>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${sectionStyle.badge}`}>
              {activeSection.title}
            </span>
            <h2 className="mt-5 text-[18px] font-semibold text-slate-900">
              {activeSummary?.label ?? activeSection.title}
            </h2>
          </div>
          <div className={`rounded-[20px] px-4 py-4 ${sectionStyle.soft}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Registros visibles
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{activeSection.rows.length}</p>
          </div>
        </div>

        <RfqTable section={activeSection} />
      </div>
    </div>
  );
}
