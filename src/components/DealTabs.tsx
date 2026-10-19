import { LayoutDashboard, Tag, Sparkles, Mail, Files, MessageSquare, type LucideIcon } from 'lucide-react';
import { messages, documents, comments, type Activity } from '../data/deal';
import { type DealSummary } from '../data/deals';
import { Tabs, TabsList, TabsContent, TabTrigger } from '@/components/ui/tabs';
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

  return (
    <Tabs defaultValue="overview" className="flex-1 overflow-hidden bg-surface">
      <TabsList>
        {tabs.map(({ key, label, icon, count }) => (
          <TabTrigger key={key} value={key} icon={icon} label={label} count={count} />
        ))}
      </TabsList>

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
