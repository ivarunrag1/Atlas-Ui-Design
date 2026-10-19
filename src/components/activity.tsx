import { useState } from 'react';
import {
  AlertTriangle,
  Send,
  FileEdit,
  ArrowRightLeft,
  UserPlus,
  Sparkles,
  ChevronDown,
  Check,
  ListChecks,
  MessageSquare,
  StickyNote,
  Phone,
  Pencil,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Activity, ActivityStep, ActivityType, Actor } from '../data/deal';
import { Avatar, actorStyle } from './ui';

const actorInitial: Record<Actor, string> = { atlas: 'A', system: 'S', you: 'V', customer: 'M' };

export const typeIcon: Record<ActivityType, LucideIcon> = {
  flag: AlertTriangle,
  sent: Send,
  draft: FileEdit,
  stage: ArrowRightLeft,
  convert: ArrowRightLeft,
  capture: UserPlus,
  chat: MessageSquare,
  note: StickyNote,
  call: Phone,
  edit: Pencil,
};

function dotColor(_type: ActivityType, _actor: Actor) {
  // Neutral icon dot regardless of actor/type.
  return 'text-muted border-line';
}

/** The agent's sub-steps for an action, shown as a connected mini-stepper. */
export function StepList({ steps }: { steps: ActivityStep[] }) {
  return (
    <ol className="mt-2 rounded-lg border border-line bg-subtle/60 p-3">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={i} className="relative flex gap-2.5 pb-3 last:pb-0">
            {!last && <span className="absolute left-[7px] top-4 bottom-0 w-px bg-atlas/25" />}
            <span
              className={`z-10 mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border bg-transparent ${
                s.status === 'done'
                  ? 'border-atlas/50 text-atlas'
                  : s.status === 'current'
                    ? 'border-atlas text-atlas'
                    : 'border-line-strong text-faint'
              }`}
            >
              {s.status === 'done' && <Check size={9} strokeWidth={3} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-bold text-faint">{i + 1}</span>
                <span className="text-[12px] font-semibold leading-snug text-ink">{s.label}</span>
              </div>
              {s.detail && <p className="text-[10px] leading-snug text-muted">{s.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * One activity entry. Used both in the mid-section Activity tab (with the
 * timeline `connector`) and inline in the agent chat (standalone).
 */
export function ActivityItem({
  item,
  connector = false,
  pending = false,
  compact = false,
  stacked = false,
}: {
  item: Activity;
  connector?: boolean;
  pending?: boolean;
  /** Timeline mode — show only event title, actor and timestamp (no detail/steps). */
  compact?: boolean;
  /** Chat mode — icon + title on one line, everything else full-width below it. */
  stacked?: boolean;
}) {
  const Icon = typeIcon[item.type];
  const [open, setOpen] = useState(true); // steps visible by default

  // Timeline (Overview) — one-line feed: avatar · who · action · timestamp.
  if (compact) {
    return (
      <div className="flex items-center gap-2 py-1">
        <Avatar initials={actorInitial[item.actor]} actor={item.actor} size={18} />
        <span className="min-w-0 flex-1 truncate text-[14px]">
          <span className="font-medium text-ink">{actorStyle[item.actor].label}</span>{' '}
          <span className="text-muted">{item.title}</span>
        </span>
        {pending && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-atlas/40 px-1.5 text-[10px] font-semibold text-atlas">
            <Sparkles size={10} /> in 2h
          </span>
        )}
        <span className="ml-1 shrink-0 text-[12px] text-faint">{item.timestamp}</span>
      </div>
    );
  }

  // Agent chat — header line (icon + summary), then detail / meta / steps underneath.
  if (stacked) {
    return (
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line text-muted">
            <Icon size={13} />
          </span>
          <span className="min-w-0 flex-1 text-[14px] font-semibold leading-snug text-ink">{item.title}</span>
          {pending && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-atlas/40 px-2 py-0.5 text-[10px] font-semibold text-atlas">
              <Sparkles size={10} /> in 2h
            </span>
          )}
        </div>
        {item.detail && <p className="mt-1.5 text-[12px] leading-snug text-muted">{item.detail}</p>}
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted">
          <Avatar initials={actorInitial[item.actor]} actor={item.actor} size={16} />
          <span className="font-medium">{actorStyle[item.actor].label}</span>
          <span className="text-faint">·</span>
          <span className="text-faint">{item.timestamp}</span>
        </div>
        {item.steps && (
          <>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setOpen((v) => !v)}
              className="mt-1.5 -ml-2 h-6 gap-1 text-[10px] font-semibold"
            >
              <ListChecks size={13} />
              {item.steps.length} agent steps
              <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </Button>
            {open && <StepList steps={item.steps} />}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex gap-3">
      {connector && <span className="absolute left-[15px] top-8 bottom-[-14px] w-px bg-line" />}
      <span
        className={`z-10 grid size-8 shrink-0 place-items-center rounded-full ${dotColor(item.type, item.actor)}`}
      >
        <Icon size={15} />
      </span>
      <div className={`min-w-0 flex-1 ${connector ? 'pb-4' : ''}`}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[14px] font-semibold leading-snug text-ink">{item.title}</span>
          {pending && (
            <span className="inline-flex items-center gap-1 rounded-full border border-atlas/40 px-2 py-0.5 text-[10px] font-semibold text-atlas">
              <Sparkles size={10} /> in 2h
            </span>
          )}
        </div>
        {!compact && item.detail && (
          <p className="mt-0.5 text-[12px] leading-snug text-muted">{item.detail}</p>
        )}
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted">
          <Avatar initials={actorInitial[item.actor]} actor={item.actor} size={16} />
          <span className="font-medium">{actorStyle[item.actor].label}</span>
          <span className="text-faint">·</span>
          <span className="text-faint">{item.timestamp}</span>
        </div>

        {!compact && item.steps && (
          <>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setOpen((v) => !v)}
              className="mt-1.5 -ml-2 h-6 gap-1 text-[10px] font-semibold"
            >
              <ListChecks size={13} />
              {item.steps.length} agent steps
              <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </Button>
            {open && <StepList steps={item.steps} />}
          </>
        )}
      </div>
    </div>
  );
}

/** The full activity audit timeline (connected). */
export function ActivityTimeline({ log }: { log: Activity[] }) {
  return (
    <div className="flex flex-col">
      {log.map((item, i) => (
        <ActivityItem
          key={item.id}
          item={item}
          connector={i < log.length - 1}
          pending={item.type === 'draft' && item.id === 'a1'}
          compact
        />
      ))}
    </div>
  );
}
