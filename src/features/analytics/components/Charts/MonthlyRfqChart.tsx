import type { ChartPoint } from '@/features/analytics/types';

type MonthlyRfqChartProps = {
  series: ChartPoint[];
  statusText?: string;
};

function buildChartPath(points: string[]) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point}`).join(' ');
}

// Returns a "nice" max and 5 evenly-spaced tick values (top → bottom) with integer steps.
function niceYAxis(rawMax: number): { max: number; ticks: number[] } {
  if (rawMax <= 0) return { max: 4, ticks: [4, 3, 2, 1, 0] };
  const approxStep = Math.max(rawMax / 4, 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(approxStep)));
  const n = approxStep / magnitude;
  const niceStep = n <= 1 ? magnitude : n <= 2 ? 2 * magnitude : n <= 5 ? 5 * magnitude : 10 * magnitude;
  const max = niceStep * 4;
  return { max, ticks: [max, max * 0.75, max * 0.5, max * 0.25, 0] };
}

export function MonthlyRfqChart({ series, statusText }: MonthlyRfqChartProps) {
  const width = 540;
  const height = 140;
  const topPadding = 10;
  const bottomPadding = 22;
  const leftPadding = 36;
  const rightPadding = 20;
  const chartWidth = width - leftPadding - rightPadding;
  const chartHeight = height - topPadding - bottomPadding;
  const safeSeries = series.length > 0 ? series : [{ month: 'Jan', value: 0 }];
  const rawMax = Math.max(...safeSeries.map((p) => p.value), 0);
  const { max: maxValue, ticks } = niceYAxis(rawMax);
  const points = safeSeries.map((point, index) => {
    const step = safeSeries.length > 1 ? chartWidth / (safeSeries.length - 1) : 0;
    const x = leftPadding + step * index;
    const y = topPadding + ((maxValue - point.value) / maxValue) * chartHeight;

    return `${x},${y}`;
  });

  return (
    <section className="rounded-[12px] border border-[var(--bocar-border)] bg-white px-5 py-4 shadow-[0_8px_18px_rgba(0,46,93,0.04)] lg:px-4 lg:py-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-[12px] font-medium uppercase tracking-[0.035em] text-[var(--bocar-text)] lg:text-[10px]">
          RFQs per Month
        </h2>
        {statusText ? (
          <span className="text-[11px] font-medium text-[var(--bocar-blue-50)]">{statusText}</span>
        ) : null}
      </div>

      <svg aria-hidden="true" className="mt-3 h-auto w-full lg:mt-1" viewBox={`0 0 ${width} ${height}`} fill="none">
        {ticks.map((tickValue, index) => {
          const y = topPadding + (chartHeight / 4) * index;

          return (
            <g key={`grid-${index}`}>
              <line
                x1={leftPadding}
                x2={width - rightPadding}
                y1={y}
                y2={y}
                stroke="rgba(167, 177, 194, 0.48)"
                strokeWidth="1"
              />
              <text
                x={leftPadding - 4}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="9"
                fill="rgba(100, 116, 139, 0.8)"
              >
                {tickValue}
              </text>
            </g>
          );
        })}

        {safeSeries.map((_, index) => {
          const [x] = points[index].split(',');

          return (
            <line
              key={`axis-${index}`}
              x1={x}
              x2={x}
              y1={topPadding}
              y2={height - bottomPadding}
              stroke="rgba(167, 177, 194, 0.32)"
              strokeWidth="1"
            />
          );
        })}

        <path d={buildChartPath(points)} stroke="var(--bocar-blue-100)" strokeWidth="2.2" strokeLinecap="round" />

        {points.map((point, index) => {
          const [x, y] = point.split(',').map(Number);

          return (
            <g key={`${safeSeries[index].month}-${point}`}>
              <circle cx={x} cy={y} r="4" fill="var(--bocar-blue-100)" />
              <circle cx={x} cy={y} r="2" fill="white" />
              <text
                x={x}
                y={height - 8}
                textAnchor="middle"
                className="fill-[var(--bocar-text)] text-[10px] font-medium"
              >
                {safeSeries[index].month}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
