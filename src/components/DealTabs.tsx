import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Tag,
  Sparkles,
  Mail,
  Files,
  MessageSquare,
  Maximize2,
  Minimize2,
  type LucideIcon,
} from 'lucide-react';
import { messages, documents, comments, type Activity } from '../data/deal';
import { type DealSummary } from '../data/deals';
import { Tabs, TabsList, TabsContent, TabTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Hint } from '@/components/ui/tooltip';
import { useFocusMode } from '@/lib/focus-context';
import { OverviewTab } from './OverviewTab';
import { AttributesTab } from './AttributesTab';
import { EnquiryTab } from './EnquiryTab';
import { EmailThread } from './EmailThread';
import { DocumentsTab } from './DocumentsTab';
import { CommentsTab } from './CommentsTab';

type TabKey = 'overview' | 'attributes' | 'enquiry' | 'emails' | 'documents' | 'comments';

export function DealTabs({ deal, activityLog }: { deal: DealSummary; activityLog: Activity[] }) {
  const tabs: { key: TabKey; label: string; icon: LucideIcon; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'attributes', label: 'Attributes', icon: Tag },
    { key: 'enquiry', label: 'Enquiry', icon: Sparkles, count: 5 },
    { key: 'emails', label: 'Emails', icon: Mail, count: messages.filter((m) => m.status !== 'draft-pending').length },
    { key: 'documents', label: 'Documents', icon: Files, count: documents.length },
    { key: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
  ];

  const [tab, setTab] = useState<TabKey>('overview');
  const { focus, setFocus, setExpandable } = useFocusMode();
  // Expand applies to every tab while the deal tabs are showing — it stays on until collapsed.
  useEffect(() => {
    setExpandable(true);
    return () => setExpandable(false);
  }, [setExpandable]);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="flex-1 overflow-hidden bg-surface">
      {/* Tab bar — Expand (common to all tabs) sits at its right end */}
      <div className="flex shrink-0 items-center gap-2 border-b border-line pr-3">
        <TabsList className="min-w-0 flex-1 border-b-0">
          {tabs.map(({ key, label, icon, count }) => (
            <TabTrigger key={key} value={key} icon={icon} label={label} count={count} />
          ))}
        </TabsList>
        <Hint
          label={focus ? 'Collapse' : 'Expand'}
          value={
            focus
              ? 'Show the sidebar, deal pane and chat again (Esc)'
              : 'Hide the sidebar, deal pane and chat for more room — stays on across tabs until you collapse'
          }
        >
          <Button
            variant={focus ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setFocus(!focus)}
            aria-pressed={focus}
            className={focus ? 'border-atlas/50 text-atlas' : 'text-muted'}
          >
            {focus ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {focus ? 'Collapse' : 'Expand'}
          </Button>
        </Hint>
      </div>

      <TabsContent value="overview">
        <OverviewTab deal={deal} log={activityLog} />
      </TabsContent>
      <TabsContent value="attributes">
        <AttributesTab deal={deal} />
      </TabsContent>
      <TabsContent value="enquiry">
        <EnquiryTab />
      </TabsContent>
      <TabsContent value="emails">
        <EmailThread />
      </TabsContent>
      <TabsContent value="documents">
        <DocumentsTab />
      </TabsContent>
      <TabsContent value="comments">
        <CommentsTab />
      </TabsContent>
    </Tabs>
  );
}
