import { useState } from 'react';
import { Lock, Send } from 'lucide-react';
import { comments as seed, type Comment } from '../data/deal';
import { Avatar, Chip, actorStyle } from './ui';
import { Button } from '@/components/ui/button';
import { Composer } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

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
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div>
          <h2 className="text-[16px] font-semibold text-ink">Comments</h2>
          <p className="text-[12px] text-faint">Internal notes — not visible to the customer</p>
        </div>
        <Chip>
          <Lock size={11} />
          Internal
        </Chip>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar initials={c.from.initials} actor={c.from.actor} />
            <Card className="min-w-0 flex-1 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-ink">{c.from.name}</span>
                {c.from.actor === 'atlas' && (
                  <span className={`text-[10px] font-medium ${actorStyle[c.from.actor].fg}`}>
                    AI
                  </span>
                )}
                <span className="ml-auto text-[12px] text-faint">{c.timestamp}</span>
              </div>
              <p className="mt-1 text-[14px] leading-relaxed text-ink/90">{c.body}</p>
            </Card>
          </div>
        ))}
      </div>

      <div className="border-t border-line px-5 py-3">
        <Composer
          value={draft}
          onChange={setDraft}
          onSubmit={addComment}
          submitOn="mod-enter"
          placeholder="Add an internal note…  (⌘↵ to post)"
          action={
            <Button size="sm" onClick={addComment} disabled={!draft.trim()}>
              <Send size={14} />
              Post
            </Button>
          }
        />
      </div>
    </div>
  );
}
