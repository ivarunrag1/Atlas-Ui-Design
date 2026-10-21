import { Phone, Mail, Tag, Trash2 } from 'lucide-react';
import { type ContactSummary } from '../data/contacts';
import { Button } from '@/components/ui/button';
import { EngagedText } from './company/parts';
import { RecordListView, type RecordColumn } from './record/RecordListView';

const ALL_COLS: RecordColumn<ContactSummary>[] = [
  { key: 'name', label: 'Contact', flex: 1.2, render: (c) => <span className="truncate font-semibold text-ink">{c.name}</span> },
  { key: 'company', label: 'Company', flex: 1.1, render: (c) => <span className="truncate text-muted">{c.company}</span> },
  { key: 'role', label: 'Designation', flex: 1, render: (c) => <span className="truncate text-muted">{c.role}</span> },
  { key: 'contactRole', label: 'Contact role', flex: 0.8, render: (c) => <span className="truncate text-muted">{c.contactRole ?? '—'}</span> },
  { key: 'modesHandled', label: 'Modes handled', flex: 0.8, render: (c) => <span className="truncate text-ink">{c.modesHandled ?? '—'}</span> },
  {
    key: 'lanesHandled',
    label: 'Lanes handled',
    flex: 1.2,
    render: (c) => (
      <span className="truncate text-muted" title={c.lanesHandled}>
        {c.lanesHandled ?? '—'}
      </span>
    ),
  },
  { key: 'lastEngaged', label: 'Last engaged', flex: 0.8, render: (c) => <span className="text-[12px]"><EngagedText iso={c.lastEngagedAt} /></span> },
  { key: 'status', label: 'Status', flex: 0.6, render: (c) => <span className="text-[12px] text-muted">{c.status ?? '—'}</span> },
  { key: 'department', label: 'Department', flex: 0.9, render: (c) => <span className="truncate text-muted">{c.department ?? '—'}</span> },
  {
    key: 'email',
    label: 'Email',
    flex: 1.5,
    render: (c) => (
      <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()} className="truncate text-ink hover:underline" title={c.email}>
        {c.email}
      </a>
    ),
  },
  {
    key: 'phone',
    label: 'Phone',
    flex: 1,
    render: (c) => (
      <span className="inline-flex min-w-0 items-center gap-1.5 text-muted">
        <Phone size={12} className="shrink-0 text-faint" />
        <span className="truncate">{c.phone}</span>
      </span>
    ),
  },
  { key: 'location', label: 'Location', flex: 1, render: (c) => <span className="truncate text-muted">{c.location}</span> },
  { key: 'lastDealDate', label: 'Last deal', flex: 0.9, render: (c) => <span className="text-[12px] text-faint">{c.lastDealDate}</span> },
  { key: 'dealsCount', label: 'Deals', flex: 0.6, render: (c) => <span className="font-semibold text-ink">{c.dealsCount}</span> },
  { key: 'owner', label: 'Contact owner', flex: 1, render: (c) => <span className="truncate text-muted">{c.owner}</span> },
  { key: 'created', label: 'Created', flex: 0.9, render: (c) => <span className="text-[12px] text-faint">{c.created}</span> },
  {
    key: 'tags',
    label: 'Tags',
    flex: 1.2,
    render: (c) => (
      <span className="flex min-w-0 flex-wrap gap-1">
        {c.tags.map((t) => (
          <span key={t} className="rounded-full border border-line px-1.5 text-[10px] font-medium text-muted">
            {t}
          </span>
        ))}
      </span>
    ),
  },
];

/** Contacts list — a configuration of the shared RecordListView. */
export function ContactsView({ contacts, onOpenContact }: { contacts: ContactSummary[]; onOpenContact: (c: ContactSummary) => void }) {
  return (
    <RecordListView
      title="Contacts"
      noun="contacts"
      rows={contacts}
      columns={ALL_COLS}
      defaultColumns={['name', 'company', 'contactRole', 'email', 'phone', 'modesHandled', 'lastEngaged', 'dealsCount', 'owner']}
      searchText={(c) => `${c.name} ${c.company} ${c.email} ${c.modesHandled ?? ''} ${c.lanesHandled ?? ''}`}
      onOpen={onOpenContact}
      rowLabel={(c) => c.name}
      newLabel="New contact"
      selectionActions={
        <>
          <Button variant="secondary" size="xs" className="gap-1.5 text-[12px]">
            <Mail size={13} /> Email
          </Button>
          <Button variant="secondary" size="xs" className="gap-1.5 text-[12px]">
            <Tag size={13} /> Add tag
          </Button>
          <Button variant="destructive" size="xs" className="gap-1.5 text-[12px]">
            <Trash2 size={13} /> Delete
          </Button>
        </>
      }
    />
  );
}
