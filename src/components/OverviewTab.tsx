import { useState } from 'react';
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
  type LucideIcon,
} from 'lucide-react';
import { stages, stageColor, type DealSummary, type Stage } from '../data/deals';
import { deal as demo, type Activity } from '../data/deal';
import { ActivityTimeline } from './activity';
import { Button } from '@/components/ui/button';
import { Card, CardIcon } from '@/components/ui/card';
import { SectionLabel } from '@/components/ui/field';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';

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
    <Card className="flex flex-col gap-2 p-3">
      <SectionLabel as="div" className="flex items-center gap-1.5">
        <Icon size={13} /> {label}
      </SectionLabel>
      <div className="text-[14px] font-semibold text-ink">{children}</div>
      {sub && <div className="text-[12px] text-muted">{sub}</div>}
    </Card>
  );
}

/** Deal-stage card — horizontal segmented bar; segments colour-coded, current highlighted. */
function StageCard({ stage }: { stage: Stage }) {
  const idx = stages.indexOf(stage);
  return (
    <Card className="flex flex-col gap-2 p-3">
      <SectionLabel as="div" className="flex items-center gap-1.5">
        <Milestone size={13} /> Deal stage
      </SectionLabel>
      <div className="text-[14px] font-semibold text-ink">{stage}</div>
      <div className="flex items-center gap-1">
        {stages.map((s, i) => (
          <span
            key={s}
            title={s}
            className="h-1.5 flex-1 rounded-full"
            style={{ background: stageColor[s], opacity: i === idx ? 1 : 0.2 }}
          />
        ))}
      </div>
    </Card>
  );
}

export function OverviewTab({ deal, log }: { deal: DealSummary; log: Activity[] }) {
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskDone, setTaskDone] = useState(false);

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
          <Card asChild interactive className={urgent ? 'border-danger/40' : undefined}>
            <button onClick={() => setTaskOpen(true)} className="flex flex-col gap-2 p-3">
              <SectionLabel as="div" className="flex items-center gap-1.5">
                {taskDone ? <CircleCheck size={13} /> : <ListTodo size={13} />} Next due task
              </SectionLabel>
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
          </Card>
        </div>

        {/* Recent activity */}
        <section>
          <SectionLabel as="h3" className="mb-2">
            Recent activity
          </SectionLabel>
          <ActivityTimeline log={log} />
        </section>

        {/* Linked records */}
        <section>
          <SectionLabel as="h3" className="mb-2">
            Linked records
          </SectionLabel>
          <div className="space-y-2">
            <Card asChild interactive>
              <button className="flex w-full items-center gap-3 px-4 py-3">
                <CardIcon>
                  <FileText size={16} />
                </CardIcon>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-ink">Quote #{demo.linked.quote.id}</span>
                  <span className="block text-[12px] text-faint">{demo.linked.quote.meta}</span>
                </span>
              </button>
            </Card>
            <Card asChild interactive>
              <button className="flex w-full items-center gap-3 px-4 py-3">
                <CardIcon>
                  <Mail size={16} />
                </CardIcon>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-ink">{demo.linked.thread.subject}</span>
                  <span className="block text-[12px] text-faint">{demo.linked.thread.meta}</span>
                </span>
              </button>
            </Card>
          </div>
        </section>
      </div>

      {/* Task popup */}
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Task</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div>
              <SectionLabel as="div">Task</SectionLabel>
              <div className={`mt-1 text-[16px] font-semibold ${taskDone ? 'text-success line-through' : 'text-ink'}`}>
                {deal.nextTask.detail}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <SectionLabel as="div">Due</SectionLabel>
                <div className={`mt-1 flex items-center gap-1 text-[14px] ${urgent ? 'font-medium text-danger' : 'text-ink'}`}>
                  {urgent && <AlertTriangle size={13} />}
                  {deal.nextTask.when}
                </div>
              </div>
              <div>
                <SectionLabel as="div">Owner</SectionLabel>
                <div className="mt-1 text-[14px] text-ink">{deal.owner}</div>
              </div>
              <div className="col-span-2">
                <SectionLabel as="div">Deal</SectionLabel>
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
          </DialogBody>

          <DialogFooter>
            {taskDone ? (
              <Button variant="outline" onClick={() => setTaskDone(false)} className="text-muted">
                Reopen task
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setTaskDone(true);
                  setTaskOpen(false);
                }}
              >
                <Check size={15} /> Mark as complete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
