import { useState } from 'react';
import { CalendarDays, Check, Eye, Forward, Mail, Send, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Spinner } from './parts';

type Provider = 'Gmail' | 'Outlook';
type Stage = 'provider' | 'explain' | 'consent' | 'connecting';

/**
 * Connect mailbox + calendar — one step (D4). Provider → plain-words screen on what
 * Atlas reads and sends → the provider's consent screen (mock) → connected.
 * Cancelling at any point changes nothing (CN-02). Unticking calendar leaves the step
 * In progress (CN-04).
 */
export function ConnectMailboxDialog({
  open,
  onOpenChange,
  email,
  reconnect,
  onConnected,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  email: string;
  /** Reconnect after the provider revoked access — skips straight to consent. */
  reconnect?: Provider;
  onConnected: (r: { provider: Provider; mail: boolean; calendar: boolean }) => void;
}) {
  // Mounted only while open, so every open starts fresh.
  const [stage, setStage] = useState<Stage>(reconnect ? 'consent' : 'provider');
  const [provider, setProvider] = useState<Provider>(reconnect ?? 'Gmail');
  const [scopes, setScopes] = useState({ mail: true, calendar: true });

  const allow = () => {
    setStage('connecting');
    setTimeout(() => {
      onConnected({ provider, ...scopes });
      onOpenChange(false);
    }, 900);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(520px,94vw)]">
        <DialogHeader>
          <DialogTitle>{reconnect ? `Reconnect ${reconnect}` : 'Connect mailbox and calendar'}</DialogTitle>
          <DialogDescription>
            {stage === 'provider' && 'Use the mailbox you receive inquiries in. A forwarded company mailbox works too.'}
            {stage === 'explain' && 'In plain words: what Atlas can and can’t do.'}
            {(stage === 'consent' || stage === 'connecting') && `Signing in to ${provider} (prototype)`}
          </DialogDescription>
        </DialogHeader>

        {stage === 'provider' && (
          <>
            <DialogBody className="flex flex-col gap-3">
              {(['Gmail', 'Outlook'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  aria-pressed={provider === p}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                    provider === p ? 'border-line-strong bg-subtle' : 'border-line hover:bg-subtle',
                  )}
                >
                  <span className="grid size-9 place-items-center rounded-lg border border-line font-bold text-ink">{p[0]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink">{p === 'Gmail' ? 'Google Workspace / Gmail' : 'Microsoft 365 / Outlook'}</span>
                    <span className="t-desc block text-faint">Mailbox and calendar from the same account</span>
                  </span>
                  <span
                    className={cn(
                      'grid size-4 place-items-center rounded-full border',
                      provider === p ? 'border-ink bg-ink text-canvas' : 'border-line-strong',
                    )}
                  >
                    {provider === p && <Check size={10} strokeWidth={3} />}
                  </span>
                </button>
              ))}
              <p className="t-desc flex items-start gap-1.5 text-faint">
                <Forward size={12} className="mt-0.5 shrink-0" />
                Using a shared address like quotes@? Forward it to your own mailbox on your mail server. Atlas treats it as your mailbox, and the
                original sender stays the customer.
              </p>
            </DialogBody>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => setStage('explain')}>Continue</Button>
            </DialogFooter>
          </>
        )}

        {stage === 'explain' && (
          <>
            <DialogBody className="flex flex-col gap-4">
              <Explain icon={Eye} title="Atlas reads">
                Emails from the last 7 days, once, to create your customers and contacts. Then new emails as they arrive, to find inquiries.
              </Explain>
              <Explain icon={Send} title="Atlas sends">
                Quotes and follow-ups from your address. While you’re setting up, nothing is sent without a preview you can stop.
              </Explain>
              <Explain icon={CalendarDays} title="Calendar">
                Maya checks your free time and adds follow-up reminders. It doesn’t change meetings other people created.
              </Explain>
              <Explain icon={ShieldCheck} title="Atlas never">
                Deletes emails, reads other people’s mailboxes, or shares your email outside your workspace.
              </Explain>
            </DialogBody>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStage('provider')}>
                Back
              </Button>
              <Button onClick={() => setStage('consent')}>Continue to {provider}</Button>
            </DialogFooter>
          </>
        )}

        {(stage === 'consent' || stage === 'connecting') && (
          <>
            <DialogBody>
              {/* Mock provider consent page — paper surface, like the real OAuth window */}
              <div className="rounded-lg border border-paper-line bg-paper p-5 text-paper-ink">
                <p className="text-[12px] text-paper-faint">{provider === 'Gmail' ? 'Sign in with Google' : 'Microsoft account'}</p>
                <p className="mt-1 text-[16px] font-semibold">Atlas wants to access your account</p>
                <p className="mt-1 text-[12px] text-paper-faint">{email}</p>
                <ul className="mt-4 flex flex-col gap-2">
                  <Scope
                    icon={Mail}
                    label="Read, compose and send email"
                    checked={scopes.mail}
                    onChange={(v) => setScopes((s) => ({ ...s, mail: v }))}
                  />
                  <Scope
                    icon={CalendarDays}
                    label="See and edit your calendar events"
                    checked={scopes.calendar}
                    onChange={(v) => setScopes((s) => ({ ...s, calendar: v }))}
                  />
                </ul>
                {!scopes.mail && (
                  <p className="mt-3 text-[12px] text-[#b42318]">Without mailbox access, Max, Rhea and Maya can’t read your inquiries.</p>
                )}
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={stage === 'connecting'}>
                Cancel
              </Button>
              <Button onClick={allow} disabled={stage === 'connecting' || (!scopes.mail && !scopes.calendar)}>
                {stage === 'connecting' ? (
                  <>
                    <Spinner size={14} /> Connecting…
                  </>
                ) : (
                  'Allow'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Explain({ icon: Icon, title, children }: { icon: typeof Eye; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line text-muted">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="font-medium text-ink">{title}</p>
        <p className="t-desc text-muted">{children}</p>
      </div>
    </div>
  );
}

function Scope({ icon: Icon, label, checked, onChange }: { icon: typeof Mail; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <li>
      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-paper-line px-3 py-2 text-[13px]">
        <Icon size={15} className="shrink-0 text-paper-faint" />
        <span className="flex-1">{label}</span>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[#1d232b]" />
      </label>
    </li>
  );
}
