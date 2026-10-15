import { useState } from 'react';
import {
  FileText,
  Eye,
  Sparkles,
  Pencil,
  Send,
  Pause,
  ChevronDown,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { messages, deal, type Message } from '../data/deal';
import { Avatar, Chip } from './ui';

/** A single message — collapsible, with received/sent differentiation. */
function MessageRow({ message, defaultOpen = false }: { message: Message; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const incoming = message.from.actor === 'customer';

  return (
    <article className={incoming ? 'bg-surface' : 'bg-subtle/30'}>
      <div className="flex items-start gap-3 px-5 py-3">
        <Avatar initials={message.from.initials} actor={message.from.actor} />
        <div className="min-w-0 flex-1">
          <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 text-left">
            <span className="shrink-0 text-[14px] font-semibold text-ink">{message.from.name}</span>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                incoming ? 'border-line text-muted' : 'border-line text-faint'
              }`}
            >
              {incoming ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
              {incoming ? 'Received' : 'Sent'}
            </span>
            <span className="ml-auto shrink-0 text-[12px] text-faint">{message.timestamp}</span>
            <ChevronDown
              size={14}
              className={`shrink-0 text-faint transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>
          <div className="text-[12px] text-faint">to {message.to}</div>

          {open ? (
            <>
              <div className="mt-2 space-y-2 text-[14px] leading-relaxed text-ink/90">
                {message.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              {message.attachments?.map((att) => (
                <div
                  key={att.label}
                  className="mt-3 flex w-fit items-center gap-2 rounded-lg border border-line bg-subtle px-3 py-2"
                >
                  <div className="grid size-8 place-items-center rounded-md border border-line text-muted">
                    <FileText size={16} />
                  </div>
                  <div className="leading-tight">
                    <div className="text-[14px] font-semibold text-ink">{att.label}</div>
                    <div className="text-[12px] text-faint">{att.meta}</div>
                  </div>
                </div>
              ))}

              {message.receipt && (
                <div className="mt-2 flex items-center gap-1 text-[12px] font-medium text-success">
                  <Eye size={13} />
                  {message.receipt}
                </div>
              )}
            </>
          ) : (
            <p className="mt-1 truncate text-[13px] text-muted">{message.body[0]}</p>
          )}
        </div>
      </div>
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
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="mt-2 w-full resize-none rounded-lg border border-line bg-canvas p-3 text-[14px] leading-relaxed text-ink outline-none focus:border-line-strong"
            />
          ) : (
            <p className="mt-2 whitespace-pre-line rounded-lg bg-subtle p-3 text-[14px] italic leading-relaxed text-ink/90">
              {text}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setEditing((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-[14px] font-medium text-ink hover:bg-subtle"
            >
              <Pencil size={14} />
              {editing ? 'Done editing' : 'Preview & edit'}
            </button>
            <button className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[14px] font-semibold text-canvas hover:bg-ink/90">
              <Send size={14} />
              Send now
            </button>
            <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[14px] font-medium text-muted hover:bg-subtle">
              <Pause size={14} />
              Pause
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function EmailThread() {
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
        <button className="flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] font-medium text-muted hover:bg-subtle">
          Oldest first
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Conversation — collapsible rows, draft always open */}
      <div className="flex flex-1 flex-col divide-y divide-line overflow-y-auto">
        {messages.map((m) =>
          m.status === 'draft-pending' ? (
            <DraftRow key={m.id} message={m} />
          ) : (
            <MessageRow key={m.id} message={m} defaultOpen={m.id === lastOpenId} />
          ),
        )}
      </div>

      {/* Reply affordance */}
      <div className="border-t border-line px-5 py-3">
        <button className="flex w-full items-center gap-2 rounded-lg border border-line bg-subtle px-3 py-2.5 text-[14px] text-faint hover:bg-surface">
          <span className="size-6 rounded-full border border-line-strong" />
          Write a reply to Marcus…
        </button>
      </div>
    </div>
  );
}
