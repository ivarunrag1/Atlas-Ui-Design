import { useEffect, useState } from 'react';
import { AlertTriangle, Building2, Check, CircleX, Eye, EyeOff, Inbox, Info, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AuthHeading, AuthShell, Notice, Spinner } from './parts';
import { passwordRules, workspaceUrl, type Journey } from './model';

/* ------------------------------------------------------------------ *
 * Sign in — reached from "already have a workspace" (D6) or the signup link.
 * Forgot password lives here; so does "Send a new activation link" (AC-09).
 * ------------------------------------------------------------------ */
export function SignInScreen({
  email: initialEmail,
  existing,
  onSignIn,
  onCreate,
}: {
  email?: string;
  /** Came here because signup found the email already on Atlas. */
  existing?: boolean;
  onSignIn: () => void;
  onCreate: () => void;
}) {
  const [email, setEmail] = useState(initialEmail ?? '');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState<'reset' | 'activation' | null>(null);
  return (
    <AuthShell>
      <AuthHeading title="Sign in to Atlas">
        New to Atlas?{' '}
        <button type="button" onClick={onCreate} className="text-brand hover:underline">
          Create a workspace
        </button>
      </AuthHeading>
      {existing && (
        <Notice tone="atlas" icon={Building2} title="You already have a workspace" className="mb-5">
          {initialEmail} already belongs to an Atlas workspace, so we didn’t create a new one. Sign in below, or reset your password if you’ve
          forgotten it.
        </Notice>
      )}
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSignIn();
        }}
      >
        <Field label="Work email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>
        <div className="flex flex-col gap-1.5">
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>
          <button type="button" onClick={() => setSent('reset')} className="t-desc self-end text-brand hover:underline">
            Forgot password?
          </button>
        </div>
        {sent && (
          <Notice tone="success" icon={MailCheck}>
            {sent === 'reset'
              ? `If ${email || 'that email'} has an account, we’ve sent a password reset link.`
              : `We’ve sent a new activation link to ${email || 'your email'}. It’s valid for 48 hours.`}
          </Notice>
        )}
        <Button type="submit" size="lg" className="w-full">
          Sign in
        </Button>
        <p className="t-desc text-center text-faint">
          Never activated your account?{' '}
          <button type="button" onClick={() => setSent('activation')} className="text-brand hover:underline">
            Send a new activation link
          </button>
        </p>
      </form>
    </AuthShell>
  );
}

/* ------------------------------------------------------------------ *
 * A3 / B1 — Set password. Opened from the activation or invite email; the link
 * is single-use, valid 48 h, and only works for its own workspace.
 * ------------------------------------------------------------------ */
export function SetPasswordScreen({
  journey,
  email,
  name,
  company,
  slug,
  invitedBy,
  provisioning,
  onDone,
}: {
  journey: Journey;
  email: string;
  name: string;
  company: string;
  slug: string;
  invitedBy?: string;
  /** AC-06: link clicked while provisioning is still running. */
  provisioning?: boolean;
  onDone: () => void;
}) {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [reveal, setReveal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [waiting, setWaiting] = useState(!!provisioning);

  useEffect(() => {
    if (!waiting) return;
    const t = setTimeout(() => setWaiting(false), 2500);
    return () => clearTimeout(t);
  }, [waiting]);

  const rulesOk = passwordRules.every((r) => r.test(pw));
  const match = pw === confirm;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (rulesOk && match) onDone();
  };

  if (waiting)
    return (
      <AuthShell>
        <AuthHeading title="Almost there">We’re still finishing your workspace. This page continues by itself.</AuthHeading>
        <div className="flex items-center gap-3 rounded-lg border border-line p-4">
          <Spinner className="text-brand" />
          <span className="text-muted">Finishing {workspaceUrl(slug)}…</span>
        </div>
      </AuthShell>
    );

  return (
    <AuthShell>
      <AuthHeading title={journey === 'admin' ? 'Activate your workspace' : `Join ${company} on Atlas`}>
        {journey === 'admin'
          ? `Hi ${name.split(' ')[0]}, set a password to finish activating your account.`
          : `${invitedBy} invited you. Set a password to join the workspace.`}
      </AuthHeading>

      <div className="mb-5 flex items-center gap-3 rounded-lg border border-line bg-surface p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line text-muted">
          <Building2 size={16} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{company}</p>
          <p className="t-desc truncate text-faint">{workspaceUrl(slug)}</p>
        </div>
      </div>

      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Email">
          <Input value={email} readOnly disabled />
        </Field>
        <Field label="Password">
          <Input
            type={reveal ? 'text' : 'password'}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="new-password"
            aria-invalid={submitted && !rulesOk}
            end={
              <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                aria-label={reveal ? 'Hide password' : 'Show password'}
                className="text-faint hover:text-ink"
              >
                {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
          />
        </Field>
        <ul className="-mt-2 flex flex-wrap gap-x-4 gap-y-1" aria-label="Password rules">
          {passwordRules.map((r) => {
            const ok = r.test(pw);
            return (
              <li key={r.label} className={cn('t-desc flex items-center gap-1', ok ? 'text-success' : submitted ? 'text-danger' : 'text-faint')}>
                {ok ? <Check size={12} strokeWidth={3} /> : submitted ? <CircleX size={12} /> : <span className="size-3 text-center">·</span>}
                {r.label}
              </li>
            );
          })}
        </ul>
        <Field
          label="Confirm password"
          description={
            submitted &&
            !match && (
              <span className="flex items-center gap-1.5 text-danger">
                <AlertTriangle size={12} /> Passwords don’t match.
              </span>
            )
          }
        >
          <Input type={reveal ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </Field>
        <Button type="submit" size="lg" className="w-full">
          {journey === 'admin' ? 'Activate and continue' : 'Join workspace'}
        </Button>
      </form>
    </AuthShell>
  );
}

/* ------------------------------------------------------------------ *
 * Expired / used / revoked link (AC-03, AC-04, IU-02, IU-03)
 * ------------------------------------------------------------------ */
export function LinkExpiredScreen({
  journey,
  invitedBy,
  email,
  onResend,
  onSignIn,
}: {
  journey: Journey;
  invitedBy?: string;
  email: string;
  onResend: () => void;
  onSignIn: () => void;
}) {
  const [sent, setSent] = useState(false);
  return (
    <AuthShell>
      <span className="mb-5 grid size-11 place-items-center rounded-xl border border-warm/40 bg-warm-subtle text-warm">
        <AlertTriangle size={20} />
      </span>
      <AuthHeading title="This link has expired">
        {journey === 'admin'
          ? 'Activation links work once and expire after 48 hours. Get a new one and we’ll send it to your inbox.'
          : `Invite links work once and expire after 48 hours. Ask ${invitedBy} to resend your invite.`}
      </AuthHeading>
      {journey === 'admin' ? (
        sent ? (
          <div className="flex flex-col gap-3">
            <Notice tone="success" icon={MailCheck}>
              New activation link sent to {email}. The old link no longer works.
            </Notice>
            <Button size="lg" onClick={onResend} className="w-full">
              <Inbox /> Open inbox
            </Button>
          </div>
        ) : (
          <Button size="lg" onClick={() => setSent(true)} className="w-full">
            Send a new activation link
          </Button>
        )
      ) : (
        <Notice icon={Info}>
          Your Admin can resend it from Settings → Users. Already joined?{' '}
          <button type="button" onClick={onSignIn} className="text-brand hover:underline">
            Sign in
          </button>
        </Notice>
      )}
    </AuthShell>
  );
}
