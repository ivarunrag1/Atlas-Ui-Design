import { ArrowLeftRight, Mail, Ship, Trash2, User, UserPlus } from 'lucide-react';
import { laneCoverage, leadStatusColor, leadStatuses, type LeadStatus, type LeadSummary } from '../data/leads';
import { Button } from '@/components/ui/button';
import { RecordListView, type RecordColumn } from './record/RecordListView';
import { KanbanBoard, KanbanCard } from './record/KanbanBoard';
import { FitBadge, StatusPill } from './lead/parts';

const pct = (n: number) => `${Math.round(n * 100)}%`;

const LEAD_COLS: RecordColumn<LeadSummary>[] = [
  { key: 'company', label: 'Company', flex: 1.4, render: (l) => <span className="truncate font-semibold text-ink">{l.company}</span> },
  { key: 'contact', label: 'Contact', flex: 1.1, render: (l) => <span className="truncate text-muted">{l.contactName}</span> },
  { key: 'status', label: 'Status', flex: 1, render: (l) => <StatusPill status={l.status} /> },
  { key: 'fit', label: 'Match fit', flex: 0.8, render: (l) => <FitBadge fit={l.matchFit} /> },
  { key: 'lane', label: 'Main lane', flex: 1.5, render: (l) => <span className="truncate text-muted">{l.tradeLanes[0]?.name ?? '—'}</span> },
  {
    key: 'teu',
    label: 'Est. TEU / mo',
    flex: 0.8,
    render: (l) => <span className="text-ink tabular-nums">{l.estTeuPerMonth}</span>,
  },
  {
    key: 'shipments',
    label: 'Matching shipments',
    flex: 0.9,
    render: (l) => <span className="text-muted tabular-nums">{l.matchedShipments.toLocaleString('en-US')}</span>,
  },
  {
    key: 'coverage',
    label: 'Lane coverage',
    flex: 0.9,
    render: (l) => {
      const c = laneCoverage(l);
      return <span className={c >= 0.6 ? 'text-success' : c > 0 ? 'text-warm' : 'text-faint'}>{pct(c)}</span>;
    },
  },
  { key: 'direction', label: 'Trade direction', flex: 0.9, render: (l) => <span className="text-muted">{l.tradeDirection}</span> },
  { key: 'product', label: 'Primary product', flex: 1.1, render: (l) => <span className="truncate text-muted">{l.primaryProduct}</span> },
  { key: 'owner', label: 'Owner', flex: 1, render: (l) => <span className="truncate text-muted">{l.owner}</span> },
  { key: 'source', label: 'Source', flex: 0.9, render: (l) => <span className="text-[12px] text-faint">{l.source}</span> },
  { key: 'created', label: 'Created', flex: 0.9, render: (l) => <span className="text-[12px] text-faint">{l.created}</span> },
];

/** Lead card — variant of the shared KanbanCard: company, est. TEU, main lane, owner, trade direction. */
function LeadKanbanCard({ lead, color, dragging, onOpen }: { lead: LeadSummary; color: string; dragging: boolean; onOpen: () => void }) {
  return (
    <KanbanCard accent={color} dragging={dragging} onClick={onOpen}>
      <div className="truncate text-[14px] font-semibold text-ink">{lead.company}</div>
      <div className="mt-1.5 space-y-1 text-[12px] text-muted">
        <div className="flex items-center gap-1.5" title="Main lane">
          <Ship size={13} className="shrink-0 text-faint" />
          <span className="truncate">{lead.tradeLanes[0]?.name ?? '—'}</span>
        </div>
        <div className="flex items-center gap-1.5" title="Trade direction">
          <ArrowLeftRight size={13} className="shrink-0 text-faint" />
          {lead.tradeDirection}
        </div>
      </div>
      <div className="mt-2.5 flex items-end justify-between gap-2">
        <span className="flex items-baseline gap-1">
          <span className="text-[14px] font-bold text-ink tabular-nums">{lead.estTeuPerMonth}</span>
          <span className="text-[10px] text-faint">est. TEU / mo</span>
        </span>
        <span className="flex min-w-0 items-center gap-1 text-[10px] text-faint" title="Owner">
          <User size={11} className="shrink-0" />
          <span className="truncate">{lead.owner}</span>
        </span>
      </div>
    </KanbanCard>
  );
}

/** Leads list — a configuration of the shared RecordListView (List | Kanban) with freight-specific columns. */
export function LeadsView({
  items,
  setItems,
  onOpenLead,
}: {
  /** Leads live in App so conversion can mark them Qualified. */
  items: LeadSummary[];
  setItems: React.Dispatch<React.SetStateAction<LeadSummary[]>>;
  onOpenLead: (l: LeadSummary) => void;
}) {
  const moveLead = (id: string, status: LeadStatus) => setItems((xs) => xs.map((l) => (l.id === id ? { ...l, status } : l)));

  return (
    <RecordListView
      title="Leads"
      noun="leads"
      rows={items}
      defaultView="board"
      board={(rows) => (
        <KanbanBoard
          noun="lead"
          columns={leadStatuses.map((status) => ({
            key: status,
            label: status,
            color: leadStatusColor[status],
            items: rows.filter((l) => l.status === status),
          }))}
          onMove={(id, key) => moveLead(id, key as LeadStatus)}
          renderCard={(l, { dragging, color }) => (
            <LeadKanbanCard lead={l} color={color} dragging={dragging} onOpen={() => onOpenLead(l)} />
          )}
        />
      )}
      columns={LEAD_COLS}
      defaultColumns={['company', 'contact', 'status', 'fit', 'lane', 'teu', 'shipments', 'coverage', 'owner']}
      searchText={(l) => `${l.company} ${l.contactName} ${l.email} ${l.primaryProduct} ${l.tradeLanes.map((t) => t.name).join(' ')}`}
      onOpen={onOpenLead}
      rowLabel={(l) => l.company}
      newLabel="New lead"
      selectionActions={
        <>
          <Button variant="secondary" size="xs" className="gap-1.5 text-[12px]">
            <Mail size={13} /> Email
          </Button>
          <Button variant="secondary" size="xs" className="gap-1.5 text-[12px]">
            <UserPlus size={13} /> Assign owner
          </Button>
          <Button variant="destructive" size="xs" className="gap-1.5 text-[12px]">
            <Trash2 size={13} /> Delete
          </Button>
        </>
      }
    />
  );
}
