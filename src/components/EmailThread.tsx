import { useState } from 'react';
import {
  FileText,
  Eye,
  Sparkles,
  Pencil,
  Send,
  Pause,
  Check,
  ChevronDown,
  ArrowDownLeft,
  ArrowUpRight,
  Reply,
  X,
} from 'lucide-react';
import { messages, deal, type Message } from '../data/deal';
import { Avatar, Chip } from './ui';
import { Button } from '@/components/ui/button';
import { Card, CardIcon } from '@/components/ui/card';
import { Input, inputVariants } from '@/components/ui/input';
import { RecipientInput } from '@/components/ui/recipient-input';
import { RichTextEditor, textToHtml } from '@/components/ui/rich-text-editor';
import { cn } from '@/lib/utils';

/**
 * A single message — collapsed to one line (avatar · sender · received/sent · preview ·
 * time) to keep the thread compact; expands to recipients, body and attachments.
 */
function MessageRow({ message, defaultOpen = false }: { message: Message; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const incoming = message.from.actor === 'customer';
  const Dir = incoming ? ArrowDownLeft : ArrowUpRight;

  return (
    <article className={incoming ? 'bg-surface' : 'bg-subtle/30'}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-subtle/40"
      >
        <Avatar initials={message.from.initials} actor={message.from.actor} size={22} />
        <span className="max-w-32 shrink-0 truncate text-[12px] font-semibold text-ink">{message.from.name}</span>
        <Dir size={12} className={incoming ? 'shrink-0 text-muted' : 'shrink-0 text-faint'} aria-label={incoming ? 'Received' : 'Sent'} />
        <span className={cn('min-w-0 flex-1 truncate text-[12px] text-muted', open && 'invisible')}>{message.body[0]}</span>
        <span className="shrink-0 text-[10px] text-faint">{message.timestamp}</span>
        <ChevronDown size={13} className={cn('shrink-0 text-faint transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="px-4 pb-3 pl-[46px]">
          <div className="text-[10px] text-faint">
            {incoming ? 'Received' : 'Sent'} · to {message.to}
          </div>
          <div className="mt-1.5 space-y-2 text-[14px] leading-relaxed text-ink/90">
            {message.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {message.attachments?.map((att) => (
            <Card key={att.label} className="mt-2 flex w-fit items-center gap-3 px-3 py-1.5">
              <CardIcon className="size-7">
                <FileText size={14} />
              </CardIcon>
              <div className="leading-tight">
                <div className="text-[12px] font-semibold text-ink">{att.label}</div>
                <div className="text-[10px] text-faint">{att.meta}</div>
              </div>
            </Card>
          ))}

          {message.receipt && (
            <div className="mt-2 flex items-center gap-1 text-[12px] font-medium text-success">
              <Eye size={13} />
              {message.receipt}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* ── Email composer (shared: follow-up draft, quote draft, reply) ─────────────── */

/** A composed email — recipients, subject and a rich-text (HTML) body. */
export interface EmailDraft {
  to: string[];
  cc: string[];
  subject: string;
  html: string;
}

const emailBodyCls =
  'text-[14px] leading-relaxed text-ink/90 [&_a]:text-brand [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5';

/** One "Label  value" line of the email header (read mode). */
function HeaderLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-[12px]">
      <span className="w-12 shrink-0 text-faint">{label}</span>
      <span className="min-w-0 flex-1 text-ink">{children}</span>
    </div>
  );
}

/** Label column for the composer rows. */
function ComposerRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-2">
      <span className="w-12 shrink-0 pt-1.5 text-[12px] text-faint">{label}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}

function AttachmentChip({ attachment }: { attachment: { label: string; meta: string } }) {
  return (
    <Card className="flex w-fit items-center gap-3 px-3 py-1.5">
      <CardIcon className="size-7">
        <FileText size={14} />
      </CardIcon>
      <div className="leading-tight">
        <div className="text-[12px] font-semibold text-ink">{attachment.label}</div>
        <div className="text-[10px] text-faint">{attachment.meta}</div>
      </div>
    </Card>
  );
}

/** Traditional email composer: To · Cc · Subject · rich-text body (+ attachment). */
function EmailComposer({
  value,
  onChange,
  attachment,
  autoFocus,
}: {
  value: EmailDraft;
  onChange: (next: EmailDraft) => void;
  attachment?: { label: string; meta: string };
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-2">
      <ComposerRow label="To">
        <RecipientInput aria-label="To" value={value.to} onChange={(to) => onChange({ ...value, to })} placeholder="Add recipients…" />
      </ComposerRow>
      <ComposerRow label="Cc">
        <RecipientInput aria-label="Cc" value={value.cc} onChange={(cc) => onChange({ ...value, cc })} placeholder="Add Cc…" />
      </ComposerRow>
      <ComposerRow label="Subject">
        <Input size="sm" autoFocus={autoFocus} value={value.subject} onChange={(e) => onChange({ ...value, subject: e.target.value })} />
      </ComposerRow>
      <RichTextEditor aria-label="Email body" value={value.html} onChange={(html) => onChange({ ...value, html })} placeholder="Write your email…" />
      {attachment && <AttachmentChip attachment={attachment} />}
    </div>
  );
}

/** Read mode of a composed email: header lines + formatted body (+ attachment). */
function EmailReadView({ value, attachment }: { value: EmailDraft; attachment?: { label: string; meta: string } }) {
  return (
    <div className="space-y-2">
      <div className="space-y-0.5">
        <HeaderLine label="To">{value.to.join(', ') || '—'}</HeaderLine>
        {value.cc.length > 0 && <HeaderLine label="Cc">{value.cc.join(', ')}</HeaderLine>}
        <HeaderLine label="Subject">{value.subject}</HeaderLine>
      </div>
      {/* Our own draft / editor HTML. */}
      <div className={cn('rounded-lg bg-subtle p-3', emailBodyCls)} dangerouslySetInnerHTML={{ __html: value.html }} />
      {attachment && <AttachmentChip attachment={attachment} />}
    </div>
  );
}

/** "Name <email>" / "email" → email. */
const emailOf = (s: string) => s.match(/<([^>]+)>/)?.[1] ?? s.trim();
/** Rich-text HTML → plain paragraphs (for a sent message's body). */
const htmlToParagraphs = (html: string) => {
  const div = document.createElement('div');
  div.innerHTML = html.replace(/<\/(p|li|div)>/gi, '\n\n').replace(/<br\s*\/?>/gi, '\n');
  return (div.textContent ?? '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
};
const replySubject = (s: string) => (/^re:/i.test(s) ? s : `Re: ${s}`);

/* ── Atlas's staged follow-up ──────────────────────────────────────────────── */

/** The agent's staged follow-up — always open; "Preview & edit" opens the full composer. */
function DraftRow({ message }: { message: Message }) {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState<EmailDraft>(() => ({
    to: [emailOf(message.to)],
    cc: [],
    subject: replySubject(deal.linked.thread.subject),
    html: textToHtml(message.body.join('\n\n')),
  }));

  return (
    <article className="border-l-2 border-l-atlas/50 bg-atlas-bg/15 px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles size={14} className="text-atlas" />
        <span className="text-[12px] font-semibold text-atlas">Atlas drafted a follow-up</span>
        <Chip tone="atlas">Draft · sends in 2h</Chip>
        <span className="ml-auto text-[10px] text-faint">Auto mode</span>
      </div>

      {editing ? <EmailComposer value={email} onChange={setEmail} /> : <EmailReadView value={email} />}

      <div className="mt-3 flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setEditing((v) => !v)}>
          {editing ? <Check size={14} /> : <Pencil size={14} />}
          {editing ? 'Done editing' : 'Preview & edit'}
        </Button>
        <Button size="sm" disabled={email.to.length === 0}>
          <Send size={14} />
          Send now
        </Button>
        <Button variant="ghost" size="sm">
          <Pause size={14} />
          Pause
        </Button>
      </div>
    </article>
  );
}

/* ── Quote email drafted by Atlas (step 4) ─────────────────────────────────── */

/** A quote email drafted by Atlas (step 4) — ready to send, with the quote PDF attached. */
export interface QuoteDraft {
  to: string[];
  cc?: string[];
  subject: string;
  /** Plain text, paragraphs separated by blank lines (shown as rich text). */
  body: string;
  attachment: { label: string; meta: string };
}

function QuoteDraftRow({ draft, onSend }: { draft: QuoteDraft; onSend?: () => void }) {
  const [editing, setEditing] = useState(false);
  // Until edited, follow the latest draft (e.g. new validity dates); then keep the user's copy.
  const [edited, setEdited] = useState<EmailDraft | null>(null);
  const email: EmailDraft = edited ?? {
    to: draft.to,
    cc: draft.cc ?? [],
    subject: draft.subject,
    html: textToHtml(draft.body),
  };

  return (
    <article className="border-l-2 border-l-atlas/50 bg-atlas-bg/15 px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles size={14} className="text-atlas" />
        <span className="text-[12px] font-semibold text-atlas">Atlas drafted the quote email</span>
        <Chip tone="success">Ready to send</Chip>
      </div>

      {editing ? (
        <EmailComposer value={email} onChange={setEdited} attachment={draft.attachment} />
      ) : (
        <EmailReadView value={email} attachment={draft.attachment} />
      )}

      <div className="mt-3 flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setEditing((v) => !v)}>
          {editing ? <Check size={14} /> : <Pencil size={14} />}
          {editing ? 'Done editing' : 'Edit email'}
        </Button>
        <Button size="sm" onClick={onSend} disabled={email.to.length === 0}>
          <Send size={14} />
          Send quote
        </Button>
      </div>
    </article>
  );
}

/* ── Reply ─────────────────────────────────────────────────────────────────── */

/** Bottom of the thread: a reply prompt that opens the full composer; Send appends to the thread. */
function ReplyBox({ onSend }: { onSend: (email: EmailDraft) => void }) {
  const blank = (): EmailDraft => ({
    to: [deal.contact.email],
    cc: [],
    subject: replySubject(deal.linked.thread.subject),
    html: '',
  });
  const [email, setEmail] = useState<EmailDraft | null>(null);
  const firstName = deal.contact.name.split(' ')[0];

  if (!email) {
    return (
      <div className="border-t border-line px-4 py-3">
        {/* Looks like an input; opens the reply composer. */}
        <button
          type="button"
          onClick={() => setEmail(blank())}
          className={cn(inputVariants(), 'flex h-10 cursor-text items-center gap-2 text-left text-faint hover:border-line-strong')}
        >
          <Reply size={14} className="shrink-0" />
          Write a reply to {firstName}…
        </button>
      </div>
    );
  }

  const hasBody = htmlToParagraphs(email.html).length > 0;
  return (
    <div className="max-h-[70%] overflow-y-auto border-t border-line bg-subtle/30 px-4 py-3">
      <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-ink">
        <Reply size={14} className="text-muted" /> Reply
      </div>
      <EmailComposer value={email} onChange={setEmail} />
      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          disabled={email.to.length === 0 || !hasBody}
          onClick={() => {
            onSend(email);
            setEmail(null);
          }}
        >
          <Send size={14} /> Send
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setEmail(null)} className="text-muted">
          <X size={14} /> Discard
        </Button>
      </div>
    </div>
  );
}

/* ── Thread ────────────────────────────────────────────────────────────────── */

/**
 * The deal's email thread. With `quoteDraft` (step 4) the pending follow-up is replaced
 * by Atlas's ready-to-send quote email; `onSendQuote` wires its Send button. Replies are
 * composed in the traditional layout and appended to the thread when sent.
 */
export function EmailThread({ quoteDraft, onSendQuote }: { quoteDraft?: QuoteDraft; onSendQuote?: () => void } = {}) {
  const [sent, setSent] = useState<Message[]>([]);
  const thread = [...messages.filter((m) => m.status !== 'draft-pending'), ...sent];
  const lastOpenId = thread[thread.length - 1]?.id;
  const pendingDraft = messages.find((m) => m.status === 'draft-pending');

  const sendReply = (email: EmailDraft) =>
    setSent((prev) => [
      ...prev,
      {
        id: `reply-${prev.length + 1}`,
        from: { name: 'Varun Reddy', initials: 'V', actor: 'you' },
        to: [...email.to, ...email.cc].join(', '),
        timestamp: 'Just now',
        body: htmlToParagraphs(email.html),
        status: 'sent',
      },
    ]);

  return (
    <div className="flex h-full min-w-0 flex-col bg-surface">
      {/* Thread header */}
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div>
          <h2 className="text-[16px] font-semibold text-ink">{deal.linked.thread.subject}</h2>
          <p className="text-[12px] text-faint">
            {thread.length} messages · {deal.contact.email}
          </p>
        </div>
        <Button variant="secondary" size="sm" className="gap-1 text-[12px] text-muted">
          Oldest first
          <ChevronDown size={14} />
        </Button>
      </div>

      {/* Conversation — collapsible rows; drafts always open */}
      <div className="flex min-h-0 flex-1 flex-col divide-y divide-line overflow-y-auto">
        {thread.map((m) => (
          <MessageRow key={m.id} message={m} defaultOpen={m.id === lastOpenId} />
        ))}
        {quoteDraft ? (
          <QuoteDraftRow draft={quoteDraft} onSend={onSendQuote} />
        ) : (
          pendingDraft && <DraftRow message={pendingDraft} />
        )}
      </div>

      <ReplyBox onSend={sendReply} />
    </div>
  );
}
