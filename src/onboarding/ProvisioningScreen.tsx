import { useEffect, useState } from 'react';
import { Check, Inbox, LifeBuoy, MailCheck, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AuthHeading, AuthShell, Notice, Spinner } from './parts';
import { engineUrl, workspaceUrl, type Workspace } from './model';

type Phase = 'pending' | 'running' | 'retrying' | 'done' | 'failed';

/**
 * A2 — Provisioning status. Four steps update live; each retries by itself. If a step
 * still fails, the user gets "we'll email you" — never a half-built account without a
 * message (AC3). On success it turns into "Check your inbox" (A2b).
 */
export function ProvisioningScreen({
  workspace,
  fails,
  onOpenInbox,
}: {
  workspace: Workspace;
  /** Prototype switch — step 2 keeps failing after retries. */
  fails: boolean;
  onOpenInbox: () => void;
}) {
  const steps = [
    { title: `Reserving ${workspaceUrl(workspace.slug)}`, detail: 'Your permanent workspace ID is created too, so the URL can change later.' },
    { title: 'Creating your Atlas workspace', detail: 'Admin user, 3 default roles, your pipeline and AI teammate defaults.' },
    workspace.engine === 'new'
      ? { title: 'Creating your Freight Engine', detail: 'With you as its first user. Your login details come by email.' }
      : {
          title: `Saving ${engineUrl(workspace.engineDomain || 'your-domain')}`,
          detail: 'Status: Awaiting connection. Nothing is read until you sign in to Freight Engine.',
        },
    { title: 'Sending your activation email', detail: `To ${workspace.email}` },
  ];

  const [phases, setPhases] = useState<Phase[]>(() => steps.map((_, i) => (i === 0 ? 'running' : 'pending')));
  const [attempt, setAttempt] = useState(1);

  // Drive the mock timeline: each step runs ~1.1s; step 2 retries when `fails`.
  useEffect(() => {
    const i = phases.findIndex((p) => p === 'running' || p === 'retrying');
    if (i < 0) return;
    const t = setTimeout(() => {
      const next = [...phases];
      if (fails && i === 1) {
        if (attempt < 3) {
          setAttempt(attempt + 1);
          next[i] = 'retrying';
        } else next[i] = 'failed';
      } else {
        next[i] = 'done';
        if (i + 1 < next.length) next[i + 1] = 'running';
      }
      setPhases(next);
    }, 1100);
    return () => clearTimeout(t);
  }, [phases, fails, attempt]);

  const failed = phases.includes('failed');
  const done = phases.every((p) => p === 'done');

  if (done)
    return (
      <AuthShell>
        <span className="mb-5 grid size-11 place-items-center rounded-xl border border-success/40 bg-success-subtle text-success">
          <MailCheck size={20} />
        </span>
        <AuthHeading title="Check your inbox">
          Your workspace is ready. We sent an activation link to <span className="text-ink">{workspace.email}</span>. It works once and expires in 48
          hours.
        </AuthHeading>
        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={onOpenInbox} className="w-full">
            <Inbox /> Open inbox
          </Button>
          <p className="t-desc text-center text-faint">
            Didn’t get it? Check spam, or{' '}
            <button type="button" className="text-brand hover:underline">
              resend the email
            </button>
            .
          </p>
        </div>
      </AuthShell>
    );

  return (
    <AuthShell>
      <AuthHeading title={failed ? 'We’re finishing your setup' : 'Setting up your workspace'}>
        {failed
          ? 'One step is taking longer than usual. We’ll email you at ' + workspace.email + ' as soon as it’s ready. You can close this page.'
          : 'This takes less than a minute. You can close this page. We’ll email you when it’s ready.'}
      </AuthHeading>

      <ol className="flex flex-col" aria-live="polite">
        {steps.map((s, i) => {
          const p = phases[i];
          return (
            <li key={s.title} className="relative flex gap-3 pb-5 last:pb-0">
              {i < steps.length - 1 && <span className="absolute top-7 bottom-1 left-[11px] w-px bg-line" aria-hidden />}
              <PhaseMarker phase={p} />
              <div className="min-w-0 pt-0.5">
                <p className={cn('font-medium', p === 'pending' ? 'text-faint' : p === 'failed' ? 'text-warm' : 'text-ink')}>{s.title}</p>
                <p className="t-desc text-faint">
                  {p === 'retrying'
                    ? `Taking longer than usual. Retrying (attempt ${attempt} of 3)…`
                    : p === 'failed'
                      ? 'Our team is finishing this step.'
                      : s.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {failed && (
        <Notice tone="warm" icon={LifeBuoy} title="Nothing for you to do" className="mt-6">
          The Freightify help desk has been alerted and will finish the setup. Questions?{' '}
          <a href="mailto:helpdesk@freightify.com" className="text-brand hover:underline">
            helpdesk@freightify.com
          </a>
        </Notice>
      )}
    </AuthShell>
  );
}

function PhaseMarker({ phase }: { phase: Phase }) {
  if (phase === 'done')
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-full border border-success/50 bg-surface text-success">
        <Check size={13} strokeWidth={3} />
      </span>
    );
  if (phase === 'running')
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-full border border-brand/50 bg-surface text-brand">
        <Spinner size={12} />
      </span>
    );
  if (phase === 'retrying' || phase === 'failed')
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-full border border-warm/50 bg-surface text-warm">
        <RotateCw size={12} className={phase === 'retrying' ? 'animate-spin motion-reduce:animate-none' : ''} />
      </span>
    );
  return <span className="size-6 shrink-0 rounded-full border border-line bg-surface" />;
}
