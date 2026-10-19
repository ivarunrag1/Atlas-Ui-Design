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
} from 'lucide-react';
import { messages, deal, type Message } from '../data/deal';
import { Avatar, Chip } from './ui';
import { Button } from '@/components/ui/button';
import { Card, CardIcon } from '@/components/ui/card';
import { Input, inputVariants } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

/** The agent's staged follow-up — always fully open. */
function DraftRow({ message }: { message: Message }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(message.body.join('\n\n'));

  return (
    <article className="border-l-2 border-l-atlas/50 bg-atlas-bg/15 px-5 py-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles size={15} className="text-atlas" />
        <span className="text-[14px] font-semibold text-atlas">Atlas drafted a follow-up</span>
        <Chip tone="atlas">Draft · sends in 2h</Chip>
        <span className="ml-auto text-[12px] text-faint">Auto mode</span>
      </div>

      <div className="flex items-start gap-3">
        <Avatar initials={message.from.initials} actor="atlas" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[12px] text-faint">
            To <span className="font-medium text-ink">{message.to}</span>
          </div>
          {editing ? (
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="mt-2 p-3" />
          ) : (
            <p className="mt-2 whitespace-pre-line rounded-lg bg-subtle p-3 text-[14px] italic leading-relaxed text-ink/90">
              {text}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <Button variant="secondary" onClick={() => setEditing((v) => !v)}>
              <Pencil size={14} />
              {editing ? 'Done editing' : 'Preview & edit'}
            </Button>
            <Button>
              <Send size={14} />
              Send now
            </Button>
            <Button variant="ghost">
              <Pause size={14} />
              Pause
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

/** A quote email drafted by Atlas (step 4) — ready to send, with the quote PDF attached. */
export interface QuoteDraft {
  to: string[];
  cc?: string[];
  subject: string;
  /** Plain text, paragraphs separated by blank lines (shown as rich text). */
  body: string;
  attachment: { label: string; meta: string };
}

/** One "Label  value" line of the email header (read mode). */
function HeaderLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-[12px]">
      <span className="w-12 shrink-0 text-faint">{label}</span>
      <span className="min-w-0 flex-1 text-ink">{children}</span>
    </div>
  );
}

/** Label column for the composer rows (edit mode). */
function ComposerRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-2">
      <span className="w-12 shrink-0 pt-1.5 text-[12px] text-faint">{label}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}

function QuoteDraftRow({ draft, onSend }: { draft: QuoteDraft; onSend?: () => void }) {
  const [editing, setEditing] = useState(false);
  // Until edited, follow the latest draft (e.g. new validity dates); then keep the user's copy.
  const [to, setTo] = useState<string[] | null>(null);
  const [cc, setCc] = useState<string[] | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const cur = {
    to: to ?? draft.to,
    cc: cc ?? draft.cc ?? [],
    subject: subject ?? draft.subject,
    html: html ?? textToHtml(draft.body),
  };

  const attachment = (
    <Card className="flex w-fit items-center gap-3 px-3 py-1.5">
      <CardIcon className="size-7">
        <FileText size={14} />
      </CardIcon>
      <div className="leading-tight">
        <div className="text-[12px] font-semibold text-ink">{draft.attachment.label}</div>
        <div className="text-[10px] text-faint">{draft.attachment.meta}</div>
      </div>
    </Card>
  );

  return (
    <article className="border-l-2 border-l-atlas/50 bg-atlas-bg/15 px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles size={14} className="text-atlas" />
        <span className="text-[12px] font-semibold text-atlas">Atlas drafted the quote email</span>
        <Chip tone="success">Ready to send</Chip>
      </div>

      {editing ? (
        // Composer — To / Cc / Subject + rich text body
        <div className="space-y-2">
          <ComposerRow label="To">
            <RecipientInput aria-label="To" value={cur.to} onChange={setTo} placeholder="Add recipients…" />
          </ComposerRow>
          <ComposerRow label="Cc">
            <RecipientInput aria-label="Cc" value={cur.cc} onChange={setCc} placeholder="Add Cc…" />
          </ComposerRow>
          <ComposerRow label="Subject">
            <Input size="sm" value={cur.subject} onChange={(e) => setSubject(e.target.value)} />
          </ComposerRow>
          <RichTextEditor aria-label="Email body" value={cur.html} onChange={setHtml} placeholder="Write the email…" />
          {attachment}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="space-y-0.5">
            <HeaderLine label="To">{cur.to.join(', ')}</HeaderLine>
            {cur.cc.length > 0 && <HeaderLine label="Cc">{cur.cc.join(', ')}</HeaderLine>}
            <HeaderLine label="Subject">{cur.subject}</HeaderLine>
          </div>
          <div
            className="rounded-lg bg-subtle p-3 text-[14px] leading-relaxed text-ink/90 [&_a]:text-brand [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5"
            // Our own draft / editor HTML.
            dangerouslySetInnerHTML={{ __html: cur.html }}
          />
          {attachment}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setEditing((v) => !v)}>
          {editing ? <Check size={14} /> : <Pencil size={14} />}
          {editing ? 'Done editing' : 'Edit email'}
        </Button>
        <Button size="sm" onClick={onSend} disabled={cur.to.length === 0}>
          <Send size={14} />
          Send quote
        </Button>
      </div>
    </article>
  );
}

/**
 * The deal's email thread. With `quoteDraft` (step 4) the pending follow-up is replaced
 * by Atlas's ready-to-send quote email; `onSendQuote` wires its Send button.
 */
export function EmailThread({ quoteDraft, onSendQuote }: { quoteDraft?: QuoteDraft; onSendQuote?: () => void } = {}) {
  const nonDraft = messages.filter((m) => m.status !== 'draft-pending');
  const lastOpenId = nonDraft[nonDraft.length - 1]?.id;

  return (
    <div className="flex h-full min-w-0 flex-col bg-surface">
      {/* Thread header */}
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div>
          <h2 className="text-[16px] font-semibold text-ink">{deal.linked.thread.subject}</h2>
          <p className="text-[12px] text-faint">
            {deal.linked.thread.meta} · {deal.contact.email}
          </p>
        </div>
        <Button variant="secondary" size="sm" className="gap-1 text-[12px] text-muted">
          Oldest first
          <ChevronDown size={14} />
        </Button>
      </div>

      {/* Conversation — collapsible rows, draft always open */}
      <div className="flex flex-1 flex-col divide-y divide-line overflow-y-auto">
        {messages.map((m) =>
          m.status === 'draft-pending' ? (
            quoteDraft ? null : <DraftRow key={m.id} message={m} />
          ) : (
            <MessageRow key={m.id} message={m} defaultOpen={m.id === lastOpenId} />
          ),
        )}
        {quoteDraft && <QuoteDraftRow draft={quoteDraft} onSend={onSendQuote} />}
      </div>

      {/* Reply affordance */}
      <div className="border-t border-line px-5 py-3">
        {/* Looks like an input; opens the reply composer. */}
        <button className={cn(inputVariants(), 'flex h-10 cursor-text items-center gap-2 text-left text-faint hover:border-line-strong')}>
          <span className="size-6 rounded-full border border-line-strong" />
          Write a reply to Marcus…
        </button>
      </div>
    </div>
  );
}
