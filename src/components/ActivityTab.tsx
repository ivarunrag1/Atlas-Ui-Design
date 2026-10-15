import type { Activity } from '../data/deal';
import { ActivityTimeline } from './activity';

export function ActivityTab({ log }: { log: Activity[] }) {
  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div>
          <h2 className="text-[16px] font-semibold text-ink">Activity</h2>
          <p className="text-[12px] text-faint">Everything Atlas did on this deal</p>
        </div>
        <span className="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-semibold text-faint">
          {log.length} events
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <ActivityTimeline log={log} />
      </div>
    </div>
  );
}
