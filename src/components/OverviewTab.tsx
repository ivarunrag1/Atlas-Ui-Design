import { useEffect, useState } from 'react';
import {
  FileText,
  Mail,
  Milestone,
  DollarSign,
  User,
  CalendarClock,
  History,
  ListTodo,
  CircleCheck,
  Calendar,
  AlertTriangle,
  Check,
  X,
  type LucideIcon,
} from 'lucide-react';
import { stages, stageColor, type DealSummary, type Stage } from '../data/deals';
import { deal as demo, type Activity } from '../data/deal';
import { ActivityTimeline } from './activity';

/** Generic quick-stat card — 12px padding, 8px gaps, icon on the label. */
function Stat({
  icon: Icon,
  label,
  sub,
  children,
}: {
  icon: LucideIcon;
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-canvas p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.04em] text-faint">
        <Icon size={13} /> {label}
      </div>
      <div className="text-[14px] font-semibold text-ink">{children}</div>
      {sub && <div className="text-[12px] text-muted">{sub}</div>}
    </div>
  );
}

/** Deal-stage card — horizontal segmented bar; segments colour-coded, current highlighted. */
function StageCard({ stage }: { stage: Stage }) {
  const idx = stages.indexOf(stage);
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-canvas p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.04em] text-faint">
        <Milestone size={13} /> Deal stage
      </div>
      <div className="text-[14px] font-semibold text-ink">{stage}</div>
      <div className="flex items-center gap-1">
        {stages.map((s, i) => (
          <span
            key={s}
            title={s}
            className="h-1.5 flex-1 rounded-full"
            style={{ background: stageColor[s], opacity: i === idx ? 1 : 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}

export function OverviewTab({ deal, log }: { deal: DealSummary; log: Activity[] }) {
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskDone, setTaskDone] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setTaskOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Mark the task urgent when it's due today or past deadline.
  const dueWhen = deal.nextTask.when.toLowerCase();
  const urgent = !taskDone && (dueWhen.includes('overdue') || dueWhen.includes('today'));

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <StageCard stage={deal.stage} />
          <Stat icon={DollarSign} label="Deal value">
            {deal.value}
          </Stat>
          <Stat icon={User} label="Deal owner">
            {deal.owner}
          </Stat>
          <Stat icon={CalendarClock} label="Next interaction" sub={deal.nextInteraction.detail}>
            {deal.nextInteraction.when}
          </Stat>
          <Stat icon={History} label="Last interaction" sub={deal.lastInteraction.detail}>
            {deal.lastInteraction.when}
          </Stat>

          {/* Next due task — description + due date; marked if due today/overdue; opens a popup */}
          <button
            onClick={() => setTaskOpen(true)}
            className={`flex flex-col gap-2 rounded-lg border bg-canvas p-3 text-left transition-colors hover:border-line-strong ${
              urgent ? 'border-danger/40' : 'border-line'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.04em] text-faint">
              {taskDone ? <CircleCheck size={13} /> : <ListTodo size={13} />} Next due task
            </div>
            <div className={`text-[14px] font-semibold ${taskDone ? 'text-success line-through' : 'text-ink'}`}>
              {deal.nextTask.detail}
            </div>
            {taskDone ? (
              <div className="flex items-center gap-1 text-[12px] font-medium text-success">
                <CircleCheck size={12} /> Completed
              </div>
            ) : (
              <div
                className={`flex items-center gap-1 text-[12px] ${
                  urgent ? 'font-medium text-danger' : 'text-muted'
                }`}
              >
                {urgent ? <AlertTriangle size={12} /> : <Calendar size={12} />}
                {deal.nextTask.when}
              </div>
            )}
          </button>
        </div>

        {/* Recent activity */}
        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-faint">Recent activity</h3>
          <ActivityTimeline log={log} />
        </section>

        {/* Linked records */}
        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-faint">Linked records</h3>
          <div className="space-y-2">
            <button className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5 text-left hover:bg-subtle">
              <span className="grid size-8 place-items-center rounded-md border border-line text-muted">
                <FileText size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-ink">Quote #{demo.linked.quote.id}</span>
                <span className="block text-[12px] text-faint">{demo.linked.quote.meta}</span>
              </span>
            </button>
            <button className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5 text-left hover:bg-subtle">
              <span className="grid size-8 place-items-center rounded-md border border-line text-muted">
                <Mail size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-ink">{demo.linked.thread.subject}</span>
                <span className="block text-[12px] text-faint">{demo.linked.thread.meta}</span>
              </span>
            </button>
          </div>
        </section>
      </div>

      {/* Task popup */}
      {taskOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/60 p-6" onClick={() => setTaskOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="m-auto w-[min(440px,94vw)] overflow-hidden rounded-xl border border-line bg-surface"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="t-popup text-ink">Task</h2>
              <button
                onClick={() => setTaskOpen(false)}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-lg text-muted hover:bg-subtle"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.04em] text-faint">Task</div>
                <div
                  className={`mt-1 text-[16px] font-semibold ${taskDone ? 'text-success line-through' : 'text-ink'}`}
                >
                  {deal.nextTask.detail}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.04em] text-faint">Due</div>
                  <div
                    className={`mt-1 flex items-center gap-1 text-[14px] ${
                      urgent ? 'font-medium text-danger' : 'text-ink'
                    }`}
                  >
                    {urgent && <AlertTriangle size={13} />}
                    {deal.nextTask.when}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.04em] text-faint">Owner</div>
                  <div className="mt-1 text-[14px] text-ink">{deal.owner}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] font-medium uppercase tracking-[0.04em] text-faint">Deal</div>
                  <div className="mt-1 text-[14px] text-ink">
                    {deal.company} · {deal.contact}
                  </div>
                </div>
              </div>
              {taskDone && (
                <div className="flex items-center gap-1.5 text-[12px] text-success">
                  <CircleCheck size={14} /> Marked complete
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
              {taskDone ? (
                <button
                  onClick={() => setTaskDone(false)}
                  className="rounded-lg border border-line px-3 py-1.5 text-[14px] font-medium text-muted hover:bg-subtle"
                >
                  Reopen task
                </button>
              ) : (
                <button
                  onClick={() => {
                    setTaskDone(true);
                    setTaskOpen(false);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[14px] font-semibold text-canvas hover:bg-ink/90"
                >
                  <Check size={15} /> Mark as complete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
