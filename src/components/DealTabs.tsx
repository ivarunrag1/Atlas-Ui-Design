import { useState } from 'react';
import { LayoutDashboard, Tag, Sparkles, Mail, Files, MessageSquare, type LucideIcon } from 'lucide-react';
import { messages, documents, comments, type Activity } from '../data/deal';
import { type DealSummary } from '../data/deals';
import { OverviewTab } from './OverviewTab';
import { AttributesTab } from './AttributesTab';
import { EnquiryTab } from './EnquiryTab';
import { EmailThread } from './EmailThread';
import { DocumentsTab } from './DocumentsTab';
import { CommentsTab } from './CommentsTab';

type TabKey = 'overview' | 'attributes' | 'enquiry' | 'emails' | 'documents' | 'comments';

export function DealTabs({ deal, activityLog }: { deal: DealSummary; activityLog: Activity[] }) {
  const [active, setActive] = useState<TabKey>('overview');

  const tabs: { key: TabKey; label: string; icon: LucideIcon; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'attributes', label: 'Attributes', icon: Tag },
    { key: 'enquiry', label: 'Enquiry', icon: Sparkles, count: 5 },
    { key: 'emails', label: 'Emails', icon: Mail, count: messages.filter((m) => m.status !== 'draft-pending').length },
    { key: 'documents', label: 'Documents', icon: Files, count: documents.length },
    { key: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
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
              {count !== undefined && (
                <span
                  className={`rounded-full border px-1.5 text-[10px] font-semibold ${
                    on ? 'border-line-strong text-ink' : 'border-line text-faint'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {active === 'overview' && <OverviewTab deal={deal} log={activityLog} />}
        {active === 'attributes' && <AttributesTab deal={deal} />}
        {active === 'enquiry' && <EnquiryTab />}
        {active === 'emails' && <EmailThread />}
        {active === 'documents' && <DocumentsTab />}
        {active === 'comments' && <CommentsTab />}
      </div>
    </section>
  );
}
