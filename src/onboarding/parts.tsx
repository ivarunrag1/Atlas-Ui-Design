import { AlertTriangle, Check, CircleDashed, Clock, Loader2, MinusCircle, type LucideIcon } from 'lucide-react';
import { AgentAvatar } from '@/components/AgentAvatar';
import { cn } from '@/lib/utils';
import type { Readiness, StepStatus } from './model';

/** Atlas wordmark — same tile treatment as the app sidebar. */
export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-subtle font-bold text-ink">A</div>
      <span className="text-[17px] font-bold text-ink">Atlas</span>
    </div>
  );
}

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={cn('animate-spin motion-reduce:animate-none', className)} aria-hidden />;
}

/**
 * AuthShell — the logged-out pages (signup, provisioning, set password, sign in).
 * Form column on the left; on wide screens a surface panel on the right introduces
 * the AI teammates so the value is visible before the account exists.
 */
export function AuthShell({ children, aside = true }: { children: React.ReactNode; aside?: boolean }) {
  return (
    <div className="flex min-h-full bg-canvas text-ink">
      <main className="flex min-w-0 flex-1 flex-col px-4 py-6 sm:px-10">
        <Brand />
        <div className="flex flex-1 items-start justify-center py-10 sm:items-center">
          <div className="w-full max-w-[480px]">{children}</div>
        </div>
        <p className="t-desc text-faint">© Freightify · Atlas</p>
      </main>
      {aside && (
        <aside className="hidden w-[40%] max-w-[560px] shrink-0 flex-col justify-center gap-8 border-l border-line bg-surface p-12 lg:flex">
          <div>
            <p className="t-desc text-faint">Your AI sales team</p>
            <h2 className="t-page mt-1 text-ink">Inquiries in. Quotes out.</h2>
            <p className="mt-2 text-muted">
              Atlas reads inquiries from your mailbox, fetches Freight Engine rates and drafts the quote, so your team only reviews and sends.
            </p>
          </div>
          <ul className="flex flex-col gap-4">
            {(
              [
                ['max', 'Max', 'Reads inquiries and drafts quotes with your rates'],
                ['rhea', 'Rhea', 'Finds shippers and buyers worth talking to'],
                ['maya', 'Maya', 'Keeps follow-ups and contacts on track'],
              ] as const
            ).map(([id, name, line]) => (
              <li key={id} className="flex items-center gap-3">
                <AgentAvatar agent={id} size={40} />
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {name} <span className="t-desc text-faint">· AI agent</span>
                  </p>
                  <p className="t-desc text-muted">{line}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}

/** Page heading block used at the top of every auth card. */
export function AuthHeading({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="t-page text-ink">{title}</h1>
      {children && <p className="mt-1.5 text-muted">{children}</p>}
    </div>
  );
}

const STATUS: Record<StepStatus, { label: string; icon: LucideIcon; cls: string }> = {
  'not-started': { label: 'Not started', icon: CircleDashed, cls: 'border-line text-faint' },
  'in-progress': { label: 'In progress', icon: Clock, cls: 'border-warm/40 text-warm' },
  skipped: { label: 'Skipped', icon: MinusCircle, cls: 'border-line-strong text-muted' },
  'action-needed': { label: 'Action needed', icon: AlertTriangle, cls: 'border-danger/40 text-danger' },
  done: { label: 'Done', icon: Check, cls: 'border-success/40 text-success' },
};

/** Status pill — outlined, colour in stroke + text (minimal treatment). */
export function StatusBadge({ status, className }: { status: StepStatus; className?: string }) {
  const s = STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap',
        s.cls,
        className,
      )}
    >
      <s.icon size={11} aria-hidden />
      {s.label}
    </span>
  );
}

/** The round marker at the start of a checklist row. */
export function StepMarker({ status, index }: { status: StepStatus; index: number }) {
  if (status === 'done')
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-full border border-success/50 text-success">
        <Check size={13} strokeWidth={3} aria-hidden />
      </span>
    );
  if (status === 'action-needed')
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-full border border-danger/50 text-danger">
        <AlertTriangle size={12} aria-hidden />
      </span>
    );
  if (status === 'in-progress')
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-full border border-warm/50 text-warm">
        <Spinner size={12} />
      </span>
    );
  return (
    <span
      className={cn(
        'grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-medium',
        status === 'skipped' ? 'border-dashed border-line-strong text-muted' : 'border-line text-faint',
      )}
    >
      {index}
    </span>
  );
}

const READY_CLS: Record<Readiness, string> = {
  Ready: 'border-success/40 text-success',
  'Waiting for email': 'border-line-strong text-muted',
  'Waiting for calendar': 'border-line-strong text-muted',
  'Waiting for Freight Engine': 'border-line-strong text-muted',
  'Needs Admin approval': 'border-warm/40 text-warm',
};

/** Live readiness tag on a teammate card. Clickable when a remaining step unlocks it. */
export function ReadinessTag({ tag, onClick }: { tag: Readiness; onClick?: () => void }) {
  const cls = cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap', READY_CLS[tag]);
  const dot = (
    <span className={cn('size-1.5 rounded-full', tag === 'Ready' ? 'bg-success' : tag === 'Needs Admin approval' ? 'bg-warm' : 'bg-faint')} />
  );
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(cls, 'transition-colors hover:bg-subtle')}>
      {dot}
      {tag}
      <span aria-hidden>→</span>
    </button>
  ) : (
    <span className={cls}>
      {dot}
      {tag}
    </span>
  );
}

/** Inline alert — danger / warm / success / neutral, outlined with a tinted fill. */
export function Notice({
  tone = 'neutral',
  icon: Icon,
  title,
  children,
  action,
  className,
}: {
  tone?: 'neutral' | 'danger' | 'warm' | 'success' | 'atlas';
  icon?: LucideIcon;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: 'border-line bg-subtle/40 text-muted',
    danger: 'border-danger/40 bg-danger-subtle text-danger',
    warm: 'border-warm/40 bg-warm-subtle text-warm',
    success: 'border-success/40 bg-success-subtle text-success',
    atlas: 'border-atlas/40 bg-atlas-bg text-atlas',
  } as const;
  return (
    <div
      role={tone === 'danger' ? 'alert' : undefined}
      className={cn('flex items-start gap-3 rounded-lg border px-3 py-2.5', tones[tone], className)}
    >
      {Icon && <Icon size={16} className="mt-0.5 shrink-0" aria-hidden />}
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn('t-desc', title ? 'mt-0.5 text-muted' : 'text-ink')}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
