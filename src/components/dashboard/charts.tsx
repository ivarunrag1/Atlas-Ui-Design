import { useState } from 'react';
import { cn } from '@/lib/utils';

/*
 * Small SVG charts for the dashboard. Thin 2px lines, recessive grid, one y-axis,
 * legend with direct labels, and a crosshair + tooltip on hover. Series colours come
 * from the validated stage tokens; text stays in text tokens.
 */

export interface Series {
  key: string;
  label: string;
  color: string;
  values: number[];
}

const H = 180;

/** Line chart — one count axis, up to three series, crosshair tooltip. */
export function LineChart({
  series,
  labels,
  format = (n) => n.toLocaleString('en-US'),
  height = H,
}: {
  series: Series[];
  labels: string[];
  format?: (n: number) => string;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const n = labels.length;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const niceMax = (() => {
    const p = 10 ** Math.floor(Math.log10(max));
    return Math.ceil(max / p) * p;
  })();
  const x = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 100 - (v / niceMax) * 100;
  const ticks = [0, 0.5, 1].map((t) => t * niceMax);
  const step = Math.max(1, Math.ceil(n / 6));

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  return (
    <figure className="space-y-3">
      {/* Legend with direct labels */}
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
            {s.label}
            <span className="text-ink tabular-nums">{format(s.values.reduce((a, b) => a + b, 0))}</span>
          </span>
        ))}
      </figcaption>

      <div className="flex gap-2">
        {/* Y axis */}
        <div className="relative w-10 shrink-0 text-right text-[10px] text-faint tabular-nums" style={{ height }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${y(t)}%` }}>
              {format(t)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div
            className="relative cursor-crosshair"
            style={{ height }}
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
            role="img"
            aria-label={series.map((s) => `${s.label}: ${s.values.map((v, i) => `${labels[i]} ${format(v)}`).join(', ')}`).join('. ')}
          >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
              {ticks.map((t) => (
                <line key={t} x1="0" x2="100" y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray={t ? '3 3' : undefined} />
              ))}
              {series.map((s) => (
                <polyline
                  key={s.key}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
                />
              ))}
              {hover !== null && <line x1={x(hover)} x2={x(hover)} y1="0" y2="100" stroke="var(--color-line-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />}
            </svg>

            {/* Hover markers (HTML so they stay round) + tooltip */}
            {hover !== null &&
              series.map((s) => (
                <span
                  key={s.key}
                  className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface"
                  style={{ left: `${x(hover)}%`, top: `${y(s.values[hover])}%`, background: s.color }}
                />
              ))}
            {hover !== null && (
              <div
                className={cn(
                  'pointer-events-none absolute top-0 z-10 min-w-36 rounded-[6px] border border-line bg-surface px-2.5 py-2 text-[12px] shadow-lg',
                  x(hover) > 60 ? '-translate-x-[calc(100%+10px)]' : 'translate-x-[10px]',
                )}
                style={{ left: `${x(hover)}%` }}
              >
                <div className="mb-1 text-faint">{labels[hover]}</div>
                {series.map((s) => (
                  <div key={s.key} className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-muted">
                      <span className="size-2 rounded-full" style={{ background: s.color }} />
                      {s.label}
                    </span>
                    <span className="text-ink tabular-nums">{format(s.values[hover])}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* X axis */}
          <div className="relative mt-1.5 h-4 text-[10px] text-faint">
            {labels.map((l, i) =>
              i % step === 0 || i === n - 1 ? (
                <span
                  key={l + i}
                  className={cn('absolute whitespace-nowrap', i === 0 ? '' : i === n - 1 ? '-translate-x-full' : '-translate-x-1/2')}
                  style={{ left: `${x(i)}%` }}
                >
                  {l}
                </span>
              ) : null,
            )}
          </div>
        </div>
      </div>
    </figure>
  );
}

/** Sparkline — a single series trend for agent cards (no axes; the card names it). */
export function Sparkline({ values, color, label }: { values: number[]; color: string; label: string }) {
  const max = Math.max(1, ...values);
  const n = values.length;
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-full" role="img" aria-label={`${label}: ${values.join(', ')}`}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        points={values.map((v, i) => `${n <= 1 ? 50 : (i / (n - 1)) * 100},${28 - (v / max) * 26}`).join(' ')}
      />
    </svg>
  );
}

/** Horizontal bars with labels and counts — deals per stage. Each bar wears its stage colour. */
export function StageBars({ rows }: { rows: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[8.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-[12px]" title={`${r.label}: ${r.value} deals`}>
          <span className="flex items-center gap-1.5 text-muted">
            <span className="size-2 shrink-0 rounded-full" style={{ background: r.color }} />
            <span className="truncate">{r.label}</span>
          </span>
          <span className="h-2 overflow-hidden rounded-full bg-subtle">
            <span className="block h-full rounded-r-[4px]" style={{ width: `${(r.value / max) * 100}%`, background: r.color }} />
          </span>
          <span className="text-right text-ink tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
