import type { ChartPoint } from '@/features/analytics/types';

type MonthlyRfqChartProps = {
  series: ChartPoint[];
};

function buildChartPath(points: string[]) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point}`).join(' ');
}

export function MonthlyRfqChart({ series }: MonthlyRfqChartProps) {
  const width = 540;
  const height = 140;
  const topPadding = 10;
  const bottomPadding = 22;
  const leftPadding = 24;
  const rightPadding = 20;
  const chartWidth = width - leftPadding - rightPadding;
  const chartHeight = height - topPadding - bottomPadding;
  const maxValue = Math.max(...series.map((point) => point.value)) + 1;
  const points = series.map((point, index) => {
    const x = leftPadding + (chartWidth / (series.length - 1)) * index;
    const y = topPadding + ((maxValue - point.value) / maxValue) * chartHeight;

    return `${x},${y}`;
  });

  return (
    <section className="rounded-[12px] border border-[var(--bocar-border)] bg-white px-5 py-4 shadow-[0_8px_18px_rgba(0,46,93,0.04)] lg:px-4 lg:py-2">
      <h2 className="m-0 text-[12px] font-medium uppercase tracking-[0.035em] text-[var(--bocar-text)] lg:text-[10px]">
        RFQ por mes
      </h2>

      <svg aria-hidden="true" className="mt-3 h-auto w-full lg:mt-1" viewBox={`0 0 ${width} ${height}`} fill="none">
        {Array.from({ length: 5 }).map((_, index) => {
          const y = topPadding + (chartHeight / 4) * index;

          return (
            <line
              key={`grid-${index}`}
              x1={leftPadding}
              x2={width - rightPadding}
              y1={y}
              y2={y}
              stroke="rgba(167, 177, 194, 0.48)"
              strokeWidth="1"
            />
          );
        })}

        {series.map((_, index) => {
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
            <g key={`${series[index].month}-${point}`}>
              <circle cx={x} cy={y} r="4" fill="var(--bocar-blue-100)" />
              <circle cx={x} cy={y} r="2" fill="white" />
              <text
                x={x}
                y={height - 8}
                textAnchor="middle"
                className="fill-[var(--bocar-text)] text-[10px] font-medium"
              >
                {series[index].month}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
