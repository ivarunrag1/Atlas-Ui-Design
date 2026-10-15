import { useState } from 'react';
import { PanelRightClose, SendHorizontal } from 'lucide-react';
import { agentChat, type Activity, type ChatMessage } from '../data/deal';
import { Avatar } from './ui';
import { ActivityItem } from './activity';

/** Builds the agent's (simulated) reply as an activity-style trace. */
function buildReply(now: number): Activity {
  return {
    id: `tr${now}`,
    type: 'chat',
    actor: 'atlas',
    title: 'Reviewed your request',
    detail: 'Queued the action and logged each step to the activity tab.',
    timestamp: 'Just now',
    steps: [
      { label: 'Parsed request', detail: 'Understood the intent', status: 'done' },
      { label: 'Checked deal context', detail: 'Quote #Q-0142 · INNSA → DEHAM', status: 'done' },
      { label: 'Queued action', detail: 'Will run and report back here', status: 'current' },
    ],
  };
}

export function AgentChat({
  open,
  onClose,
  onRecord,
}: {
  open: boolean;
  onClose: () => void;
  onRecord: (a: Activity) => void;
}) {
  const [chat, setChat] = useState<ChatMessage[]>(agentChat);
  const [input, setInput] = useState('');

  function send() {
    const text = input.trim();
    if (!text) return;
    const now = Date.now();
    setChat((c) => [...c, { id: `u${now}`, from: 'you', timestamp: 'Just now', body: text }]);
    setInput('');
    // Simulated agent response — rendered activity-style, and recorded to the
    // mid-section activity log. Replace with a real agent call.
    setTimeout(() => {
      const reply = buildReply(now);
      setChat((c) => [...c, { id: `k${now}`, from: 'atlas', timestamp: 'Just now', trace: reply }]);
      onRecord(reply);
    }, 700);
  }

  if (!open) return null;

  return (
    <aside className="flex w-[420px] shrink-0 flex-col border-l border-line bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2">
          <Avatar initials="A" actor="atlas" size={30} />
          <div>
            <h2 className="text-[16px] font-semibold leading-tight text-ink">Ask Atlas</h2>
            <p className="flex items-center gap-1 text-[12px] text-faint">
              <span className="size-1.5 rounded-full bg-success" /> Online · AI sales assistant
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close agent chat"
          className="grid size-8 place-items-center rounded-lg text-muted hover:bg-subtle"
        >
          <PanelRightClose size={18} />
        </button>
      </div>

      {/* Conversation */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
        {chat.map((m) =>
          m.from === 'you' ? (
            <div key={m.id} className="flex flex-row-reverse gap-2">
              <div className="max-w-[82%] rounded-xl border border-line bg-subtle px-3 py-2 text-[14px] leading-snug text-ink">
                <p>{m.body}</p>
                <div className="mt-1 text-[10px] text-faint">{m.timestamp}</div>
              </div>
            </div>
          ) : m.trace ? (
            // Agent response — shown the same way as an activity entry.
            <div key={m.id} className="rounded-xl border border-line bg-subtle/40 p-3">
              <ActivityItem item={m.trace} />
            </div>
          ) : (
            <div key={m.id} className="flex gap-2">
              <Avatar initials="A" actor="atlas" size={28} />
              <div className="max-w-[82%] rounded-xl border border-line bg-subtle px-3 py-2 text-[14px] leading-snug text-ink">
                <p>{m.body}</p>
                <div className="mt-1 text-[10px] text-faint">{m.timestamp}</div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-line p-3">
        <div className="flex items-end gap-2 rounded-xl border border-line bg-canvas p-2 focus-within:border-line-strong">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Message Atlas…  (↵ to send)"
            className="max-h-28 min-h-[24px] flex-1 resize-none bg-transparent px-2 py-1 text-[14px] text-ink outline-none placeholder:text-faint"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            aria-label="Send message"
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink text-canvas hover:bg-ink/90 disabled:opacity-30"
          >
            <SendHorizontal size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
