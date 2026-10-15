import { useState } from 'react';
import { Lock, Send } from 'lucide-react';
import { comments as seed, type Comment } from '../data/deal';
import { Avatar, actorStyle } from './ui';

export function CommentsTab() {
  const [comments, setComments] = useState<Comment[]>(seed);
  const [draft, setDraft] = useState('');

  function addComment() {
    const text = draft.trim();
    if (!text) return;
    setComments((prev) => [
      ...prev,
      {
        id: `c${prev.length + 1}`,
        from: { name: 'Varun Reddy', initials: 'V', actor: 'you' },
        body: text,
        timestamp: 'Just now',
        internal: true,
      },
    ]);
    setDraft('');
  }

  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex items-center justify-between border-b border-line bg-surface px-5 py-3">
        <div>
          <h2 className="text-[16px] font-semibold text-ink">Comments</h2>
          <p className="text-[12px] text-faint">Internal notes — not visible to the customer</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-subtle px-2 py-1 text-[10px] font-medium text-muted">
          <Lock size={12} />
          Internal
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar initials={c.from.initials} actor={c.from.actor} />
            <div className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink">{c.from.name}</span>
                {c.from.actor === 'atlas' && (
                  <span className={`text-[10px] font-medium ${actorStyle[c.from.actor].fg}`}>
                    AI
                  </span>
                )}
                <span className="ml-auto text-[12px] text-faint">{c.timestamp}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-ink/90">{c.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-line bg-surface px-5 py-3">
        <div className="flex items-end gap-2 rounded-xl border border-line bg-surface p-2 focus-within:border-line-strong">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addComment();
            }}
            rows={1}
            placeholder="Add an internal note…  (⌘↵ to post)"
            className="max-h-28 min-h-[24px] flex-1 resize-none bg-transparent px-2 py-1 text-sm text-ink outline-none placeholder:text-faint"
          />
          <button
            onClick={addComment}
            disabled={!draft.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[14px] font-semibold text-canvas hover:bg-ink/90 disabled:opacity-30"
          >
            <Send size={14} />
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
