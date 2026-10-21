import { Check } from 'lucide-react';
import { leadStatusColor, MONTHS, servedLanes, type LeadStatus, type MatchFit, type ShareRow } from '../../data/leads';
import { Hint } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/* Small freight-specific pieces shared by the lead list, pane and tabs. */

export function StatusPill({ status }: { status: LeadStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-[12px] font-medium text-muted">
      <span className="size-2 rounded-full" style={{ background: leadStatusColor[status] }} />
      {status}
    </span>
  );
}

const fitTone: Record<MatchFit, string> = {
  Strong: 'border-success/50 text-success',
  Good: 'border-warm/60 text-warm',
  Weak: 'border-line text-faint',
};

/** Match fit (SDR agent judgement) — outlined, colour + text. */
export function FitBadge({ fit }: { fit: MatchFit }) {
  return <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium', fitTone[fit])}>{fit} fit</span>;
}

/** A trade lane — green with a check when it's on a lane we serve. */
export function LaneChip({ lane, share }: { lane: string; share?: number }) {
  const served = servedLanes.has(lane);
  return (
    <Hint label={served ? 'Lane we serve' : 'Not in our network'} value={share !== undefined ? `${lane} · ${Math.round(share * 100)}% of trade` : lane}>
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]',
          served ? 'border-success/50 bg-success/10 text-success' : 'border-line text-muted',
        )}
      >
        {served && <Check size={10} />}
        {lane}
        {share !== undefined && <span className="text-faint">{Math.round(share * 100)}%</span>}
      </span>
    </Hint>
  );
}

/**
 * Share bars — one row per item with a thin bar for its share of trade. Bars use one
 * hue (magnitude, not identity); lanes we serve can be marked with `served`.
 */
export function ShareBars({ rows, served }: { rows: ShareRow[]; served?: (name: string) => boolean }) {
  return (
    <div className="space-y-2">
      {rows.map((r, i) => {
        const pct = Math.round(r.share * 100);
        const isServed = served?.(r.name);
        return (
          <div key={`${r.name}-${i}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,40%)_2.5rem] items-center gap-3 text-[12px]">
            <span className="flex min-w-0 items-center gap-1.5 text-ink">
              {isServed !== undefined && (
                <span className={cn('grid size-3.5 shrink-0 place-items-center rounded-full', isServed ? 'bg-success/20 text-success' : 'bg-subtle')}>
                  {isServed && <Check size={9} strokeWidth={3} />}
                </span>
              )}
              <span className="truncate" title={r.name}>
                {r.name}
              </span>
              {r.direction && <span className="shrink-0 text-[10px] text-faint">{r.direction}</span>}
            </span>
            <span className="h-1.5 overflow-hidden rounded-full bg-subtle">
              <span className="block h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
            </span>
            <span className="text-right text-muted tabular-nums">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Monthly shipments (last 12 months) — a single-series column chart: one hue, thin
 * bars with 4px rounded tops and 2px gaps, baseline-anchored; peak months stronger.
 * Each bar has a hover tooltip; the title names the series (no legend).
 */
export function SeasonalityChart({ values, peaks }: { values: number[]; peaks: string[] }) {
  const max = Math.max(...values, 1);
  return (
    <figure className="space-y-2">
      <div className="flex h-28 items-end gap-0.5 border-b border-line" role="img" aria-label={`Shipments per month: ${MONTHS.map((m, i) => `${m} ${values[i]}`).join(', ')}`}>
        {values.map((v, i) => (
          <Hint key={MONTHS[i]} label={`${MONTHS[i]} · shipments`} value={String(v)}>
            {/* Hit target is the full column; the visible bar is its height. */}
            <span className="flex h-full flex-1 cursor-default items-end">
              <span
                className={cn('w-full rounded-t-[4px]', peaks.includes(MONTHS[i]) ? 'bg-brand' : 'bg-brand/45')}
                style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
              />
            </span>
          </Hint>
        ))}
      </div>
      <div className="flex gap-0.5 text-[10px] text-faint">
        {MONTHS.map((m) => (
          <span key={m} className="flex-1 text-center">
            {m}
          </span>
        ))}
      </div>
    </figure>
  );
}
