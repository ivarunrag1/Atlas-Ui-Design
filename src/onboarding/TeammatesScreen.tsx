import { ArrowRight, Lock } from 'lucide-react';
import { AgentAvatar, AiAgentTag } from '@/components/AgentAvatar';
import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Brand, ReadinessTag } from './parts';
import { readiness, TEAMMATES, type Setup, type StepKey, type TeammateInfo } from './model';

/**
 * 3.1 — Meet your AI teammates. First screen after activation for every user. Introduces
 * Max, Rhea and Maya as colleagues, with live readiness. Admins get Rhea's outreach
 * approval; reps see it read-only. Primary: Connect my accounts. Secondary: Skip for now.
 */
export function TeammatesScreen({
  firstName,
  isAdmin,
  setup,
  onApproveOutreach,
  onConnect,
  onSkip,
}: {
  firstName: string;
  isAdmin: boolean;
  setup: Setup;
  onApproveOutreach: (on: boolean) => void;
  onConnect: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex min-h-full flex-col bg-canvas px-4 py-6 text-ink sm:px-10">
      <Brand />
      <div className="mx-auto flex w-full max-w-[1040px] flex-1 flex-col justify-center py-10">
        <p className="t-desc text-faint">Welcome to Atlas, {firstName}</p>
        <h1 className="t-page mt-1">Meet your AI teammates</h1>
        <p className="mt-1.5 max-w-[640px] text-muted">
          They work alongside you, in your mailbox and Freight Engine. Each one starts by itself as soon as it has what it needs. You can review or
          change what they do any time in Settings → AI teammates.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {TEAMMATES.map((t) => (
            <TeammateCard
              key={t.id}
              t={t}
              setup={setup}
              approval={
                t.id === 'rhea' ? (
                  isAdmin ? (
                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
                      <span className="min-w-0">
                        <span className="block text-[12px] text-ink">Allow Rhea to send outreach</span>
                        <span className="t-desc block text-faint">Off by default. Rhea only drafts until you turn this on.</span>
                      </span>
                      <Switch checked={setup.outreachApproved} onCheckedChange={onApproveOutreach} aria-label="Allow Rhea to send outreach" />
                    </label>
                  ) : (
                    <p className="t-desc flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-faint">
                      <Lock size={12} className="shrink-0" /> Outreach is turned on by your Admin.
                    </p>
                  )
                ) : null
              }
            />
          ))}
        </div>

        <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="ghost" size="lg" onClick={onSkip}>
            Skip for now
          </Button>
          <Button size="lg" onClick={onConnect}>
            Connect my accounts <ArrowRight />
          </Button>
        </div>
        <p className="t-desc mt-3 text-right text-faint">Takes about 2 minutes. You can stop any time and pick up from Home.</p>
      </div>
    </div>
  );
}

/** One teammate: portrait, name + AI agent tag, role, what it does, what it needs, live readiness. */
export function TeammateCard({
  t,
  setup,
  approval,
  compact = false,
  onOpenStep,
}: {
  t: TeammateInfo;
  setup: Setup;
  approval?: React.ReactNode;
  compact?: boolean;
  onOpenStep?: (k: StepKey) => void;
}) {
  const r = readiness(t.id, setup);
  const ready = r.tag === 'Ready';
  return (
    <article className={cn('flex flex-col rounded-xl border border-line bg-surface', compact ? 'gap-2 p-3' : 'gap-4 p-5')}>
      <div className="flex items-start gap-3">
        <AgentAvatar agent={t.id} size={compact ? 36 : 56} state={ready ? 'working' : 'paused'} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5">
            <span className={cn('font-semibold text-ink', compact ? 'text-[14px]' : 't-subhead')}>{t.name}</span>
            <AiAgentTag />
          </p>
          <p className="t-desc text-muted">{t.role}</p>
        </div>
      </div>
      {!compact && <p className="text-muted">{t.does}</p>}
      {!compact && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
          <dt>
            <SectionLabel>Needs</SectionLabel>
          </dt>
          <dd className="t-desc text-ink">{t.needs.join(' + ')}</dd>
          <dt>
            <SectionLabel>Starts as</SectionLabel>
          </dt>
          <dd className="t-desc text-ink">{t.startsAs}</dd>
        </dl>
      )}
      <div className={cn('flex flex-wrap items-center gap-2', !compact && 'mt-auto')}>
        <ReadinessTag tag={r.tag} onClick={r.step && onOpenStep ? () => onOpenStep(r.step!) : undefined} />
        {t.id === 'rhea' && r.tag === 'Needs Admin approval' && <span className="t-desc text-faint">Lead finding is on</span>}
      </div>
      {approval}
    </article>
  );
}
