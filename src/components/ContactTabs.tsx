import { useState } from 'react';
import { Briefcase, Mail, ListTodo, StickyNote, Files, type LucideIcon } from 'lucide-react';
import { messages, documents, comments } from '../data/deal';
import type { ContactSummary } from '../data/contacts';
import type { DealSummary } from '../data/deals';
import { AssociatedDealsTab } from './AssociatedDealsTab';
import { EmailThread } from './EmailThread';
import { TasksTab } from './TasksTab';
import { CommentsTab } from './CommentsTab';
import { DocumentsTab } from './DocumentsTab';

type TabKey = 'deals' | 'emails' | 'tasks' | 'notes' | 'files';

export function ContactTabs({
  contact,
  onOpenDeal,
}: {
  contact: ContactSummary;
  onOpenDeal: (d: DealSummary) => void;
}) {
  const [active, setActive] = useState<TabKey>('deals');

  const tabs: { key: TabKey; label: string; icon: LucideIcon; count: number }[] = [
    { key: 'deals', label: 'Associated deals', icon: Briefcase, count: contact.dealsCount },
    { key: 'emails', label: 'Emails', icon: Mail, count: messages.filter((m) => m.status !== 'draft-pending').length },
    { key: 'tasks', label: 'Tasks', icon: ListTodo, count: contact.tasks },
    { key: 'notes', label: 'Notes', icon: StickyNote, count: comments.length },
    { key: 'files', label: 'Files', icon: Files, count: documents.length },
  ];

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
      {/* Tab bar */}
      <div className="flex shrink-0 items-center gap-1 border-b border-line px-3">
        {tabs.map(({ key, label, icon: Icon, count }) => {
          const on = active === key;
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                on ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              <Icon size={16} />
              {label}
              <span
                className={`rounded-full border px-1.5 text-[10px] font-semibold ${
                  on ? 'border-line-strong text-ink' : 'border-line text-faint'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {active === 'deals' && <AssociatedDealsTab contact={contact} onOpenDeal={onOpenDeal} />}
        {active === 'emails' && <EmailThread />}
        {active === 'tasks' && <TasksTab contact={contact} />}
        {active === 'notes' && <CommentsTab />}
        {active === 'files' && <DocumentsTab />}
      </div>
    </section>
  );
}
