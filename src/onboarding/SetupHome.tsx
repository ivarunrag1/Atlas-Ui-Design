import { AlertTriangle, ArrowRight, ChevronDown, Inbox, ListChecks, Mail, PartyPopper, Ship, Sparkles, Users } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { AgentAvatar } from '@/components/AgentAvatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { cn } from '@/lib/utils';
import { Notice, StatusBadge, StepMarker } from './parts';
import { TeammateCard } from './TeammatesScreen';
import { buildSteps, PIPELINE, pipelineColor, syncCounts, TEAMMATES, type OnboardingState, type Step, type StepKey } from './model';
import { useState } from 'react';

/**
 * Home — the landing page after onboarding, with the setup panel (3.2 / 3.3). Separate
 * from the CRM Dashboard (analytics). One flat list (D9). Expanded after
 * "Skip for now" or with unfinished steps; minimizes to a chip; an action-needed banner
 * shows even when minimized; a completion state shows once, then the panel is dismissed.
 * Below: AI teammates with live readiness, and the inquiry kanban where first value lands.
 */
export function SetupHome({
  state,
  onOpenStep,
  onSkipStep,
  onPanel,
  onCompletionSeen,
  onNavigate,
}: {
  state: OnboardingState;
  onOpenStep: (k: StepKey) => void;
  onSkipStep: (k: StepKey) => void;
  onPanel: (p: OnboardingState['panel']) => void;
  onCompletionSeen: () => void;
  /** Sidebar nav — other sections open the CRM app. */
  onNavigate: (label: string) => void;
}) {
  const steps = buildSteps(state);
  const done = steps.filter((s) => s.status === 'done').length;
  const broken = steps.filter((s) => s.status === 'action-needed');
  const allDone = done === steps.length;
  const first = state.me.name.split(' ')[0];
  const admin = state.journey === 'admin';

  return (
    <div className="flex h-full bg-canvas text-ink">
      <Sidebar active="Home" onNavigate={onNavigate} />
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 py-6 sm:px-8">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="t-desc text-faint">
                {state.workspace.company} · {state.me.role}
              </p>
              <h1 className="t-page mt-0.5">Good morning, {first}</h1>
            </div>
          </header>

          {/* Action-needed banner — shown even when the panel is minimized or dismissed */}
          {broken.map((s) => (
            <Notice
              key={s.key}
              tone="danger"
              icon={AlertTriangle}
              title={s.key === 'mailbox' ? 'Reconnect your mailbox' : 'Reconnect Freight Engine'}
              action={
                <Button size="sm" onClick={() => onOpenStep(s.key)}>
                  Reconnect
                </Button>
              }
            >
              {s.detail}
            </Notice>
          ))}

          {state.panel === 'open' && (!allDone || !state.setup.completionSeen) && (
            <SetupPanel
              steps={steps}
              done={done}
              allDone={allDone}
              onOpenStep={onOpenStep}
              onSkipStep={onSkipStep}
              onMinimize={() => onPanel('minimized')}
              onFinish={onCompletionSeen}
            />
          )}

          <section aria-labelledby="teammates-h" className="flex flex-col gap-3">
            <h2 id="teammates-h" className="t-subhead">
              Your AI teammates
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {TEAMMATES.map((t) => (
                <TeammateCard key={t.id} t={t} setup={state.setup} compact onOpenStep={onOpenStep} />
              ))}
            </div>
          </section>

          <InquiryBoard state={state} admin={admin} onOpenStep={onOpenStep} />
        </div>
      </main>

      {state.panel === 'minimized' && !(allDone && state.setup.completionSeen) && (
        <button
          type="button"
          onClick={() => onPanel('open')}
          className="fixed right-5 bottom-5 z-40 flex items-center gap-2 rounded-full border border-line-strong bg-surface py-2 pr-4 pl-3 shadow-xl transition-colors hover:bg-subtle"
        >
          <ProgressRing value={done / steps.length} />
          <span className="font-medium">
            Setup: {done} of {steps.length}
          </span>
          {broken.length > 0 && <span className="size-2 rounded-full bg-danger" aria-label="Action needed" />}
        </button>
      )}
    </div>
  );
}

function SetupPanel({
  steps,
  done,
  allDone,
  onOpenStep,
  onSkipStep,
  onMinimize,
  onFinish,
}: {
  steps: Step[];
  done: number;
  allDone: boolean;
  onOpenStep: (k: StepKey) => void;
  onSkipStep: (k: StepKey) => void;
  onMinimize: () => void;
  onFinish: () => void;
}) {
  const next = steps.find((s) => s.status !== 'done' && !s.auto);

  if (allDone)
    return (
      <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <span className="grid size-12 place-items-center rounded-full border border-success/40 bg-success-subtle text-success">
          <PartyPopper size={22} />
        </span>
        <p className="t-subhead">You’re all set</p>
        <p className="max-w-[460px] text-muted">Max, Rhea and Maya are working on your inbox. You can review setup any time in Settings.</p>
        <Button onClick={onFinish}>Go to Home</Button>
      </Card>
    );

  return (
    <Card>
      <CardHeader className="flex-wrap py-3">
        <div className="flex min-w-0 items-center gap-3">
          <ListChecks size={18} className="shrink-0 text-muted" />
          <div className="min-w-0">
            <CardTitle className="t-subhead">Finish setting up Atlas</CardTitle>
            <CardDescription>Skipped steps stay here until they’re done. Progress saves by itself.</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {next && (
            <Button size="sm" onClick={() => onOpenStep(next.key)}>
              Continue setup <ArrowRight />
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={onMinimize} aria-label="Minimize setup">
            <ChevronDown size={16} />
          </Button>
        </div>
      </CardHeader>
      <div className="flex items-center gap-3 px-4 pt-3">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={done}
          aria-label="Setup progress"
        >
          <div className="h-full rounded-full bg-success transition-[width] duration-500" style={{ width: `${(done / steps.length) * 100}%` }} />
        </div>
        <span className="t-desc shrink-0 text-muted">
          {done} of {steps.length} done
        </span>
      </div>
      <ol className="flex flex-col px-2 py-2">
        {steps.map((s, i) => (
          <StepRow
            key={s.key}
            step={s}
            index={i + 1}
            isNext={s.key === next?.key}
            onOpen={() => onOpenStep(s.key)}
            onSkip={() => onSkipStep(s.key)}
          />
        ))}
      </ol>
    </Card>
  );
}

const ACTION: Record<StepKey, (s: Step) => string | null> = {
  activated: () => null,
  teammates: (s) => (s.status === 'done' ? null : 'Meet them'),
  mailbox: (s) =>
    s.status === 'done' ? null : s.status === 'action-needed' ? 'Reconnect' : s.status === 'in-progress' ? 'Finish connecting' : 'Connect',
  sync: () => null,
  engine: (s) => (s.status === 'done' ? null : s.status === 'action-needed' ? 'Reconnect' : 'Sign in'),
  invite: (s) => (s.status === 'done' ? 'Manage invites' : 'Invite'),
};

function StepRow({ step: s, index, isNext, onOpen, onSkip }: { step: Step; index: number; isNext: boolean; onOpen: () => void; onSkip: () => void }) {
  const action = ACTION[s.key](s);
  const remaining = s.status !== 'done';
  return (
    <li className={cn('flex flex-wrap items-start gap-3 rounded-lg px-2 py-2.5 sm:flex-nowrap', isNext && 'bg-subtle/50')}>
      <StepMarker status={s.status} index={index} />
      <div className="min-w-0 flex-1">
        <p className={cn('flex flex-wrap items-center gap-2', s.status === 'done' ? 'text-muted' : 'text-ink')}>
          <span className="font-medium">{s.title}</span>
          <StatusBadge status={s.status} />
          {s.auto && <span className="t-small text-faint">Automatic</span>}
        </p>
        {s.detail && <p className={cn('t-desc mt-0.5', s.status === 'action-needed' ? 'text-danger' : 'text-faint')}>{s.detail}</p>}
        {remaining && !s.detail && <p className="t-desc mt-0.5 text-faint">Unlocks: {s.unlocks}</p>}
        {remaining && s.detail && s.status !== 'action-needed' && <p className="t-desc text-faint">Unlocks: {s.unlocks}</p>}
      </div>
      <div className="ml-9 flex shrink-0 items-center gap-1 sm:ml-0">
        {remaining && s.skippable && s.status !== 'skipped' && s.status !== 'action-needed' && (
          <Button variant="ghost" size="xs" onClick={onSkip}>
            Skip
          </Button>
        )}
        {action && (
          <Button variant={isNext || s.status === 'action-needed' ? 'default' : 'outline'} size="xs" onClick={onOpen}>
            {action}
          </Button>
        )}
      </div>
    </li>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 8;
  const c = 2 * Math.PI * r;
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden className="-rotate-90">
      <circle cx="10" cy="10" r={r} fill="none" stroke="var(--color-line)" strokeWidth="3" />
      <circle
        cx="10"
        cy="10"
        r={r}
        fill="none"
        stroke="var(--color-success)"
        strokeWidth="3"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value)}
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Inquiry kanban — fixed spec stages (D11). First value: the first real
 * inquiry arrives from the mailbox and Max drafts a quote with Freight Engine rates.
 * ------------------------------------------------------------------ */
function InquiryBoard({ state, admin, onOpenStep }: { state: OnboardingState; admin: boolean; onOpenStep: (k: StepKey) => void }) {
  const [scope, setScope] = useState<'mine' | 'team'>('mine');
  const s = state.setup;
  const mail = s.mailbox.mail && !s.mailbox.revoked;
  const synced = s.sync.state === 'done';
  const engine = s.engine.connected && !s.engine.expired;
  const counts = syncCounts(s.sync.progress);
  const firstStage = synced ? (engine ? 'Quoting' : 'Enquiry Received') : null;

  return (
    <section aria-labelledby="board-h" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="board-h" className="t-subhead">
            {scope === 'mine' ? 'My inquiries' : 'Team inquiries'}
          </h2>
          <p className="t-desc text-faint">
            {!mail
              ? 'Inquiries from your mailbox land here.'
              : !synced
                ? `Syncing the last 7 days · ${counts.emails} emails read · ${counts.companies} companies · ${counts.contacts} contacts`
                : `${syncCounts(100).companies} companies and ${syncCounts(100).contacts} contacts created from the last 7 days`}
          </p>
        </div>
        {admin && (
          <SegmentedControl
            value={scope}
            onChange={setScope}
            options={[
              { value: 'mine', label: 'My inquiries' },
              { value: 'team', label: 'Team view' },
            ]}
            aria-label="Inquiry scope"
          />
        )}
      </div>

      {synced && engine && (
        <Notice tone="atlas" icon={Sparkles} title="Your first inquiry is quoted">
          Max read an inquiry from Orbit Manufacturing in your mailbox, fetched Freight Engine rates and drafted the quote. Review it and send.
        </Notice>
      )}

      {!mail ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong px-6 py-10 text-center">
          <Inbox size={22} className="text-faint" />
          <p className="max-w-[420px] text-muted">
            Connect your mailbox and Max starts picking up inquiries. Your first one usually appears within minutes.
          </p>
          <Button size="sm" onClick={() => onOpenStep('mailbox')}>
            <Mail /> Connect mailbox
          </Button>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {PIPELINE.map((stage) => (
            <div key={stage} className="flex w-[220px] shrink-0 flex-col rounded-xl border border-line bg-surface">
              <div className="flex items-center gap-2 border-b border-line px-3 py-2">
                <span className="size-2 rounded-full" style={{ background: pipelineColor[stage] }} />
                <span className="text-[12px] font-medium">{stage}</span>
                <span className="t-desc ml-auto text-faint">{stage === firstStage ? 1 : 0}</span>
              </div>
              <div className="flex min-h-[132px] flex-col gap-2 p-2">
                {stage === firstStage && <FirstInquiry engine={engine} onConnect={() => onOpenStep('engine')} />}
                {stage === 'Enquiry Received' && !synced && (
                  <div className="flex flex-col gap-2 p-1">
                    <div className="h-14 animate-pulse rounded-lg bg-subtle motion-reduce:animate-none" />
                    <p className="t-desc text-faint">Looking for inquiries…</p>
                  </div>
                )}
                {scope === 'team' && stage === 'Enquiry Received' && (
                  <p className="t-desc flex items-start gap-1.5 p-1 text-faint">
                    <Users size={12} className="mt-0.5 shrink-0" /> Teammates’ inquiries show here once they connect their mailboxes.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FirstInquiry({ engine, onConnect }: { engine: boolean; onConnect: () => void }) {
  return (
    <article
      className="flex flex-col gap-2 rounded-lg border border-line border-l-2 bg-canvas p-2.5"
      style={{ borderLeftColor: engine ? pipelineColor.Quoting : pipelineColor['Enquiry Received'] }}
    >
      <div className="min-w-0">
        <p className="truncate font-medium">Orbit Manufacturing</p>
        <p className="t-desc truncate text-faint">Anita Shah · from your mailbox · 4m ago</p>
      </div>
      <p className="t-desc flex items-center gap-1.5 text-muted">
        <Ship size={12} className="shrink-0" /> INNSA → DEHAM · 9 × 40′HC
      </p>
      {engine ? (
        <p className="t-desc flex items-center gap-1.5 text-atlas">
          <AgentAvatar agent="max" size={16} /> Quote drafted · USD 96,000
        </p>
      ) : (
        <button type="button" onClick={onConnect} className="t-desc flex items-center gap-1.5 text-left text-muted hover:text-ink">
          <AgentAvatar agent="max" size={16} state="paused" /> Waiting for Freight Engine to fetch rates →
        </button>
      )}
    </article>
  );
}
