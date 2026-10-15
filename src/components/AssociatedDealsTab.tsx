import { Ship } from 'lucide-react';
import { deals, stageColor, type DealSummary } from '../data/deals';
import type { ContactSummary } from '../data/contacts';

export function AssociatedDealsTab({
  contact,
  onOpenDeal,
}: {
  contact: ContactSummary;
  onOpenDeal: (d: DealSummary) => void;
}) {
  const list = deals.filter((d) => d.contactEmail === contact.email);

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="border-b border-line px-5 py-3">
        <h2 className="text-[16px] font-semibold text-ink">Associated deals</h2>
        <p className="text-[12px] text-faint">{list.length} deals linked to {contact.name}</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
        {list.map((d) => (
          <button
            key={d.id}
            onClick={() => onOpenDeal(d)}
            className="flex w-full items-center justify-between gap-4 rounded-lg border border-line bg-canvas px-4 py-3 text-left transition-colors hover:border-line-strong"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-[14px] font-semibold text-ink">{d.company}</span>
                <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
                  <span className="size-2 rounded-full" style={{ background: stageColor[d.stage] }} />
                  {d.stage}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
                <Ship size={13} className="shrink-0 text-faint" />
                {d.origin} → {d.destination}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[14px] font-bold text-ink">{d.value}</div>
              <div className="text-[10px] text-faint">{d.updated}</div>
            </div>
          </button>
        ))}
        {list.length === 0 && (
          <div className="grid place-items-center py-10 text-[14px] text-faint">No associated deals</div>
        )}
      </div>
    </div>
  );
}
