import { Briefcase, Mail, ListTodo, StickyNote, Files, type LucideIcon } from 'lucide-react';
import { messages, documents, comments } from '../data/deal';
import type { ContactSummary } from '../data/contacts';
import type { DealSummary } from '../data/deals';
import { Tabs, TabsList, TabsContent, TabTrigger } from '@/components/ui/tabs';
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
  const tabs: { key: TabKey; label: string; icon: LucideIcon; count: number }[] = [
    { key: 'deals', label: 'Associated deals', icon: Briefcase, count: contact.dealsCount },
    { key: 'emails', label: 'Emails', icon: Mail, count: messages.filter((m) => m.status !== 'draft-pending').length },
    { key: 'tasks', label: 'Tasks', icon: ListTodo, count: contact.tasks },
    { key: 'notes', label: 'Notes', icon: StickyNote, count: comments.length },
    { key: 'files', label: 'Files', icon: Files, count: documents.length },
  ];

  return (
    <Tabs defaultValue="deals" className="flex-1 overflow-hidden bg-surface">
      <TabsList>
        {tabs.map(({ key, label, icon, count }) => (
          <TabTrigger key={key} value={key} icon={icon} label={label} count={count} />
        ))}
      </TabsList>

      <TabsContent value="deals">
        <AssociatedDealsTab contact={contact} onOpenDeal={onOpenDeal} />
      </TabsContent>
      <TabsContent value="emails">
        <EmailThread />
      </TabsContent>
      <TabsContent value="tasks">
        <TasksTab contact={contact} />
      </TabsContent>
      <TabsContent value="notes">
        <CommentsTab />
      </TabsContent>
      <TabsContent value="files">
        <DocumentsTab />
      </TabsContent>
    </Tabs>
  );
}
