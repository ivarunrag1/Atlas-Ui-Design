import { useState } from 'react';
import { CheckCircle2, Globe, Info, LifeBuoy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Notice, Spinner } from './parts';
import { engineUrl, type EngineKind } from './model';

/** Typing this password simulates a failed login (CN-08 / IU-05). */
export const WRONG_PASSWORD = 'wrong';

type Stage = 'form' | 'checking' | 'failed' | 'ready';

/**
 * Connect Freight Engine — a one-time sign-in for everyone (D2).
 * New engine: no domain shown; credentials come from the activation / login email.
 * Existing engine: pre-loaded domain; signing in with the same email as Atlas links the
 * existing account and syncs its records (D7). Atlas keeps a token, never the password.
 */
export function FreightEngineDialog({
  open,
  onOpenChange,
  kind,
  domain,
  email,
  isAdmin,
  reconnect,
  onConnected,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: EngineKind;
  domain: string;
  email: string;
  isAdmin: boolean;
  /** Token expired — same form, different heading. */
  reconnect?: boolean;
  onConnected: (synced?: { rates: number; customers: number }) => void;
}) {
  // Mounted only while open, so every open starts fresh.
  const [stage, setStage] = useState<Stage>('form');
  const [user, setUser] = useState(email);
  const [pw, setPw] = useState('');

  const synced = kind === 'existing' ? { rates: 128, customers: 36 } : undefined;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pw) return;
    setStage('checking');
    setTimeout(() => setStage(pw === WRONG_PASSWORD ? 'failed' : 'ready'), 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(480px,94vw)]">
        <DialogHeader>
          <DialogTitle>{reconnect ? 'Reconnect Freight Engine' : 'Connect Freight Engine'}</DialogTitle>
          <DialogDescription>
            {reconnect
              ? 'Your session expired. Sign in again so Max can keep fetching rates.'
              : kind === 'new'
                ? 'Sign in once with the login from your Freight Engine email.'
                : 'Sign in with your existing Freight Engine account.'}
          </DialogDescription>
        </DialogHeader>

        {stage === 'ready' ? (
          <>
            <DialogBody className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 size={36} className="text-success" />
              <p className="t-subhead text-ink">Freight Engine ready</p>
              <p className="max-w-[340px] text-muted">
                {synced
                  ? `Linked to your existing account. ${synced.rates} rates and ${synced.customers} customers synced. Max can now fetch rates and draft quotes.`
                  : 'Max can now fetch Freight Engine rates and draft quotes for your inquiries.'}
              </p>
            </DialogBody>
            <DialogFooter>
              <Button
                onClick={() => {
                  onConnected(synced);
                  onOpenChange(false);
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={submit}>
            <DialogBody className="flex flex-col gap-4">
              {kind === 'existing' && (
                <div className="flex items-center gap-2 rounded-lg border border-line bg-subtle/40 px-3 py-2">
                  <Globe size={14} className="shrink-0 text-faint" />
                  <span className="t-desc text-faint">Domain</span>
                  <span className="truncate text-ink">{engineUrl(domain || 'acme')}</span>
                </div>
              )}
              <Field
                label="Username"
                description={
                  kind === 'existing' && (
                    <span className="flex items-start gap-1.5 text-muted">
                      <Info size={12} className="mt-0.5 shrink-0" />
                      Use the same email as your Atlas account to sync your existing records.
                    </span>
                  )
                }
              >
                <Input type="email" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" />
              </Field>
              <Field
                label="Password"
                description={kind === 'new' && !reconnect ? 'From the “Your Freight Engine login” section of your email.' : undefined}
              >
                <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" autoFocus />
              </Field>
              {stage === 'failed' && (
                <Notice tone="danger" icon={LifeBuoy} title="Freight Engine login failed">
                  {isAdmin ? (
                    <>
                      Check the password and try again. Still stuck? The Freightify help desk can reset it:{' '}
                      <a href="mailto:helpdesk@freightify.com" className="text-brand hover:underline">
                        helpdesk@freightify.com
                      </a>
                    </>
                  ) : (
                    'Contact your Admin. The Atlas help desk will reset your Freight Engine password.'
                  )}
                </Notice>
              )}
              <p className="t-desc text-faint">Atlas keeps a secure access token, never your password.</p>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!user || !pw || stage === 'checking'}>
                {stage === 'checking' ? (
                  <>
                    <Spinner size={14} /> Signing in…
                  </>
                ) : stage === 'failed' ? (
                  <>
                    <RefreshCw /> Try again
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
