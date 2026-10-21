import { Ship } from 'lucide-react';
import { stageColor, stages, type DealSummary } from '../data/deals';
import { Card } from '@/components/ui/card';

/** Deals linked to a record (contact or company), with a stage strip on top. */
export function AssociatedDealsTab({
  deals: list,
  title = 'Associated deals',
  forName,
  onOpenDeal,
}: {
  deals: DealSummary[];
  title?: string;
  forName: string;
  onOpenDeal: (d: DealSummary) => void;
}) {

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="border-b border-line px-5 py-3">
        <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
        <p className="text-[12px] text-faint">
          {list.length} deal{list.length === 1 ? '' : 's'} linked to {forName}
        </p>
      </div>

      {/* Stage strip — where this record's deals sit in the pipeline */}
      {list.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-line px-5 py-2.5 text-[12px] text-muted">
          {stages.map((st) => {
            const n = list.filter((d) => d.stage === st).length;
            return (
              <span key={st} className={n ? 'inline-flex items-center gap-1.5' : 'inline-flex items-center gap-1.5 opacity-40'}>
                <span className="size-2 rounded-full" style={{ background: stageColor[st] }} />
                {st} <span className="text-ink tabular-nums">{n}</span>
              </span>
            );
          })}
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
        {list.map((d) => (
          <Card key={d.id} asChild interactive>
            <button
              onClick={() => onOpenDeal(d)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[14px] font-semibold text-ink">{d.id}</span>
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
                    <span className="size-2 rounded-full" style={{ background: stageColor[d.stage] }} />
                    {d.stage}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
                  <Ship size={13} className="shrink-0 text-faint" />
                  {d.origin} → {d.destination} · {d.teu} · {d.mode} · {d.contact}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[14px] font-bold text-ink">{d.value}</div>
                <div className="text-[10px] text-faint">{d.updated}</div>
              </div>
            </button>
          </Card>
        ))}
        {list.length === 0 && (
          <div className="grid place-items-center py-10 text-[14px] text-faint">No associated deals</div>
        )}
      </div>
    </div>
  );
}
