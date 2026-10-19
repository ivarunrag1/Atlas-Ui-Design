import { useState } from 'react';
import { PanelRightClose, Sparkles, X } from 'lucide-react';
import { agentChat, type Activity, type ChatMessage } from '../data/deal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ui/ai/conversation';
import { Message, MessageAvatar, MessageContent, MessageMeta } from '@/components/ui/ai/message';
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ui/ai/prompt-input';
import { Suggestion, Suggestions } from '@/components/ui/ai/suggestion';
import { ActivityItem } from './activity';
import { useAgent, type AgentScope } from '@/lib/agent-context';

/** Reply when the panel is scoped (e.g. to a rate's charges) — acts, then reports. */
function buildScopedReply(now: number, scope: AgentScope, result: string | null): Activity {
  return result
    ? {
        id: `tr${now}`,
        type: 'chat',
        actor: 'atlas',
        title: 'Updated charges',
        detail: result,
        timestamp: 'Just now',
        steps: [
          { label: 'Parsed request', detail: 'Understood the change', status: 'done' },
          { label: 'Matched charges', detail: scope.label, status: 'done' },
          { label: 'Recalculated totals', detail: 'Unit, equipment and shipment totals updated', status: 'done' },
        ],
      }
    : {
        id: `tr${now}`,
        type: 'chat',
        actor: 'atlas',
        title: "Couldn't map that to a charge",
        detail: `Try one of: ${(scope.suggestions ?? []).join(' · ')}`,
        timestamp: 'Just now',
      };
}

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
  const { scope, clearScope } = useAgent();

  function send(override?: string) {
    const text = (override ?? input).trim();
    if (!text) return;
    const now = Date.now();
    setChat((c) => [...c, { id: `u${now}`, from: 'you', timestamp: 'Just now', body: text }]);
    setInput('');
    // Simulated agent response — rendered activity-style, and recorded to the
    // mid-section activity log. When scoped, Atlas acts on the scope (e.g. edits
    // charges). Replace with a real agent call.
    const acted = scope?.handle ? scope.handle(text) : undefined;
    setTimeout(() => {
      const reply = scope?.handle ? buildScopedReply(now, scope, acted ?? null) : buildReply(now);
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
          <MessageAvatar name="Atlas" fallback={<Sparkles size={14} />} className="size-8 border-atlas/40 text-atlas" />
          <div>
            <h2 className="text-[16px] font-semibold leading-tight text-ink">Ask Atlas</h2>
            <p className="flex items-center gap-1 text-[12px] text-faint">
              <span className="size-1.5 rounded-full bg-success" /> Online · AI sales assistant
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close agent chat">
          <PanelRightClose size={18} />
        </Button>
      </div>

      {/* Conversation */}
      <Conversation>
        <ConversationContent>
          {chat.map((m) =>
            m.from === 'you' ? (
              <Message key={m.id} from="user">
                <MessageContent>
                  <p>{m.body}</p>
                  <MessageMeta>{m.timestamp}</MessageMeta>
                </MessageContent>
              </Message>
            ) : m.trace ? (
              // Agent response — shown the same way as an activity entry.
              <Message key={m.id} from="assistant">
                <MessageContent>
                  <ActivityItem item={m.trace} stacked />
                </MessageContent>
              </Message>
            ) : (
              <Message key={m.id} from="assistant">
                <MessageAvatar name="Atlas" fallback={<Sparkles size={12} />} className="border-atlas/40 text-atlas" />
                <MessageContent>
                  <p>{m.body}</p>
                  <MessageMeta>{m.timestamp}</MessageMeta>
                </MessageContent>
              </Message>
            ),
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Composer — with the current scope (set by an "Ask Atlas" button) above it */}
      <div className="space-y-2 border-t border-line p-3">
        {scope && (
          <div className="space-y-2 rounded-lg border border-atlas/40 bg-atlas/10 p-2">
            <div className="flex items-start gap-2">
              <Badge variant="atlas" className="mt-px">
                <Sparkles /> Context
              </Badge>
              <span className="min-w-0 flex-1 text-[12px] leading-tight">
                <span className="block truncate text-ink">{scope.label}</span>
                {scope.hint && <span className="block text-[10px] text-muted">{scope.hint}</span>}
              </span>
              <Button variant="ghost" size="icon-xs" onClick={clearScope} aria-label="Clear context" className="size-5 text-muted">
                <X size={12} />
              </Button>
            </div>
            {scope.suggestions && (
              <Suggestions>
                {scope.suggestions.map((s) => (
                  <Suggestion key={s} suggestion={s} onClick={send} />
                ))}
              </Suggestions>
            )}
          </div>
        )}
        <PromptInput onSubmit={() => send()}>
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={scope ? 'Ask Atlas to change these charges…' : 'Message Atlas…'}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              <span className="px-1 text-[10px] text-faint">↵ to send · ⇧↵ new line</span>
            </PromptInputTools>
            <PromptInputSubmit disabled={!input.trim()} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </aside>
  );
}
