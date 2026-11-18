import { useState } from 'react';
import { ArrowLeft, Inbox, KeyRound, Mail, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { engineUrl, workspaceUrl, type Journey, type Workspace } from './model';

interface Email {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  time: string;
  body: React.ReactNode;
}

/**
 * Mock inbox — stands in for the user's real mail client so the emails the flow sends
 * (activation, invite, Freight Engine login) can be read and clicked. Email bodies use
 * the always-white "paper" tokens, like a real HTML email.
 */
export function InboxScreen({
  journey,
  workspace,
  me,
  invitedBy,
  engineEmail,
  onOpenLink,
}: {
  journey: Journey;
  workspace: Workspace;
  me: { name: string; email: string };
  invitedBy: string;
  /** Show the Freight Engine login email — a new Freight Engine user was created (D2 / D8). */
  engineEmail: boolean;
  onOpenLink: () => void;
}) {
  const first = me.name.split(' ')[0];
  const url = workspaceUrl(workspace.slug);
  const company = workspace.company;

  const emails: Email[] = [];
  if (journey === 'admin') {
    emails.push({
      id: 'activate',
      from: 'Atlas',
      fromEmail: 'no-reply@freightify.ai',
      subject: 'Activate your ATLAS workspace',
      preview: `Hi ${first}, your workspace ${url} is ready. Set a password to activate it.`,
      time: 'Just now',
      body: (
        <>
          <P>Hi {first},</P>
          <P>
            Your Atlas workspace for <b>{company}</b> is ready at <b>{url}</b>. Set a password to activate your account. You’ll then meet your AI
            teammates.
          </P>
          <CTA onClick={onOpenLink}>Activate workspace</CTA>
          <Small>This link works once and expires in 48 hours.</Small>
          {workspace.engine === 'new' ? (
            <EngineCreds email={me.email} />
          ) : (
            <Box>
              <b>Freight Engine</b> · {engineUrl(workspace.engineDomain || 'your-domain')} is saved as <i>Awaiting connection</i>. Sign in with your
              existing Freight Engine account from the setup checklist to connect it.
            </Box>
          )}
        </>
      ),
    });
  } else {
    emails.push({
      id: 'invite',
      from: 'Atlas',
      fromEmail: 'no-reply@freightify.ai',
      subject: `${invitedBy} invited you to join ${company} on ATLAS`,
      preview: `Join ${url} and meet your AI teammates. This invite expires in 48 hours.`,
      time: 'Just now',
      body: (
        <>
          <P>Hi {first},</P>
          <P>
            <b>{invitedBy}</b> invited you to join <b>{company}</b> on Atlas as a <b>Sales Rep</b>. Atlas reads inquiries from your mailbox, fetches
            Freight Engine rates and drafts quotes for you.
          </P>
          <CTA onClick={onOpenLink}>Accept invite</CTA>
          <Small>Workspace: {url} · This invite works once and expires in 48 hours.</Small>
        </>
      ),
    });
    if (engineEmail)
      emails.push({
        id: 'engine',
        from: 'Freight Engine',
        fromEmail: 'no-reply@freightengine.com',
        subject: 'Your Freight Engine login',
        preview: 'A Freight Engine user has been created for you. Here are your login details.',
        time: 'Just now',
        body: (
          <>
            <P>Hi {first},</P>
            <P>
              A Freight Engine user has been created for you in <b>{company}</b>, so Max can fetch rates and draft quotes for your inquiries.
            </P>
            <EngineCreds email={me.email} heading={false} />
          </>
        ),
      });
  }

  const [openId, setOpenId] = useState(emails[0].id);
  const [mobileReading, setMobileReading] = useState(false);
  const open = emails.find((e) => e.id === openId) ?? emails[0];

  return (
    <div className="flex h-full flex-col bg-canvas text-ink">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
        <span className="grid size-8 place-items-center rounded-lg border border-line text-muted">
          <Mail size={16} />
        </span>
        <div className="min-w-0">
          <p className="font-medium">Mail</p>
          <p className="t-desc truncate text-faint">{me.email} · prototype inbox</p>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <nav className={cn('w-full shrink-0 overflow-auto border-r border-line bg-surface md:w-[340px]', mobileReading && 'hidden md:block')}>
          <p className="flex items-center gap-2 px-4 pt-4 pb-2 text-[12px] font-medium text-muted">
            <Inbox size={14} /> Inbox <span className="text-faint">{emails.length}</span>
          </p>
          <ul>
            {emails.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(e.id);
                    setMobileReading(true);
                  }}
                  className={cn(
                    'flex w-full flex-col gap-0.5 border-b border-line px-4 py-3 text-left transition-colors hover:bg-subtle',
                    e.id === open.id && 'bg-subtle',
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">{e.from}</span>
                    <span className="t-desc shrink-0 text-faint">{e.time}</span>
                  </span>
                  <span className="truncate text-ink">{e.subject}</span>
                  <span className="t-desc line-clamp-2 text-faint">{e.preview}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <section className={cn('min-w-0 flex-1 overflow-auto p-4 sm:p-8', !mobileReading && 'hidden md:block')}>
          <button type="button" onClick={() => setMobileReading(false)} className="t-desc mb-3 flex items-center gap-1 text-muted md:hidden">
            <ArrowLeft size={14} /> Inbox
          </button>
          <h1 className="t-subhead">{open.subject}</h1>
          <p className="t-desc mt-1 text-faint">
            {open.from} &lt;{open.fromEmail}&gt; · to {me.email}
          </p>
          <article className="mt-5 max-w-[600px] rounded-xl border border-paper-line bg-paper p-6 text-[14px] leading-relaxed text-paper-ink sm:p-8">
            <p className="mb-5 flex items-center gap-2 font-bold">
              <span className="grid size-7 place-items-center rounded-md bg-paper-ink text-[13px] text-paper">{open.from[0]}</span>
              {open.from}
            </p>
            {open.body}
          </article>
        </section>
      </div>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3">{children}</p>;
}
function Small({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-[12px] text-paper-faint">{children}</p>;
}
function Box({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 rounded-lg border border-paper-line px-4 py-3 text-[13px]">{children}</div>;
}
function CTA({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="my-3 inline-flex h-10 items-center rounded-lg bg-paper-ink px-5 font-semibold text-paper transition-opacity hover:opacity-90"
    >
      {children}
    </button>
  );
}

/** Default Freight Engine login — the user signs in with these once (D2); Atlas then stores a token, never the password. */
function EngineCreds({ email, heading = true }: { email: string; heading?: boolean }) {
  return (
    <div className="mt-4 rounded-lg border border-paper-line px-4 py-3 text-[13px]">
      {heading && (
        <p className="mb-2 flex items-center gap-1.5 font-semibold">
          <KeyRound size={14} /> Your Freight Engine login
        </p>
      )}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-paper-faint">Username</dt>
        <dd className="font-mono">{email}</dd>
        <dt className="text-paper-faint">Password</dt>
        <dd className="font-mono">Fe-7kQ2-mX9p</dd>
      </dl>
      <p className="mt-2 flex items-start gap-1.5 text-[12px] text-paper-faint">
        <Paperclip size={12} className="mt-0.5 shrink-0" />
        Use these in your Atlas setup checklist under “Connect Freight Engine”. You’ll be asked to change the password the first time you sign in to
        Freight Engine.
      </p>
    </div>
  );
}
