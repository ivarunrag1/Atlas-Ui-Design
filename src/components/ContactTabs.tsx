import { Briefcase, Mail, ListTodo, StickyNote, Files } from 'lucide-react';
import { messages, documents, comments } from '../data/deal';
import type { ContactSummary } from '../data/contacts';
import type { DealSummary } from '../data/deals';
import { RecordTabs } from './record/RecordTabs';
import { AssociatedDealsTab } from './AssociatedDealsTab';
import { EmailThread } from './EmailThread';
import { TasksTab } from './TasksTab';
import { CommentsTab } from './CommentsTab';
import { DocumentsTab } from './DocumentsTab';

/** Contact record tabs — a configuration of the shared RecordTabs. */
export function ContactTabs({
  contact,
  onOpenDeal,
}: {
  contact: ContactSummary;
  onOpenDeal: (d: DealSummary) => void;
}) {
  return (
    <RecordTabs
      tabs={[
        {
          key: 'deals',
          label: 'Associated deals',
          icon: Briefcase,
          count: contact.dealsCount,
          content: <AssociatedDealsTab contact={contact} onOpenDeal={onOpenDeal} />,
        },
        {
          key: 'emails',
          label: 'Emails',
          icon: Mail,
          count: messages.filter((m) => m.status !== 'draft-pending').length,
          content: <EmailThread />,
        },
        { key: 'tasks', label: 'Tasks', icon: ListTodo, count: contact.tasks, content: <TasksTab forName={contact.name} /> },
        { key: 'notes', label: 'Notes', icon: StickyNote, count: comments.length, content: <CommentsTab /> },
        { key: 'files', label: 'Files', icon: Files, count: documents.length, content: <DocumentsTab /> },
      ]}
    />
  );
}
