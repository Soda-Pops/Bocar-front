import { useMiPerfil } from '@/features/supplier/hooks/useMiPerfil';

function StarRating({ rating }: { rating: number }) {
  const clamped = Math.min(5, Math.max(0, rating));
  const full = Math.floor(clamped);
  const partial = clamped - full;
  const empty = 5 - full - (partial > 0 ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <svg key={`f${i}`} className="h-4 w-4 text-[#f5a623]" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {partial > 0 && (
        <svg className="h-4 w-4" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="partial-star">
              <stop offset={`${partial * 100}%`} stopColor="#f5a623" />
              <stop offset={`${partial * 100}%`} stopColor="#d1d5db" />
            </linearGradient>
          </defs>
          <path
            fill="url(#partial-star)"
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <svg key={`e${i}`} className="h-4 w-4 text-[#d1d5db]" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1.5 text-[13px] font-semibold text-[var(--bocar-blue-100)]">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--bocar-border)] last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--bocar-blue-70)]">
        {label}
      </span>
      <span className="text-[13px] font-medium text-[var(--bocar-text)] text-right">
        {value}
      </span>
    </div>
  );
}

export function SupplierProfileCard() {
  const perfil = useMiPerfil();

  return (
    <div className="flex h-full flex-col rounded-[12px] border border-[var(--bocar-border)] bg-white px-6 py-5 shadow-[0_8px_18px_rgba(0,46,93,0.04)]">
      {/* Header */}
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--bocar-blue-70)] mb-4">
        Supplier Profile
      </p>

      {perfil.state.status === 'loading' && (
        <div className="flex flex-1 flex-col justify-center gap-3 animate-pulse">
          {[80, 60, 70, 50].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded-full bg-[var(--bocar-border)]"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      )}

      {perfil.state.status === 'error' && (
        <p className="text-[13px] text-[var(--bocar-error)]">
          Could not load profile.
        </p>
      )}

      {perfil.state.status === 'success' && (() => {
        const d = perfil.state.data;
        return (
          <div className="flex flex-1 flex-col justify-between">
            {/* Company name */}
            <div className="mb-4">
              <p className="text-[22px] font-bold leading-tight text-[var(--bocar-blue-100)] truncate">
                {d.company_name}
              </p>
            </div>

            {/* Data rows */}
            <div className="flex-1">
              <Row label="Continent" value={d.continent_name} />
              {d.country_name && <Row label="Country" value={d.country_name} />}
              <div className="flex items-center justify-between gap-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--bocar-blue-70)]">
                  Rating
                </span>
                <StarRating rating={d.rating} />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
