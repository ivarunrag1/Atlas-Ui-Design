import { useState } from 'react';
import {
  LayoutGrid,
  Rows3,
  Search,
  Plus,
  Ship,
  Container,
  Package,
  AlertTriangle,
  CheckSquare,
  StickyNote,
  MessageSquarePlus,
  Send,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { deals as seedDeals, stages, stageColor, type DealSummary, type Stage } from '../data/deals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { KanbanBoard, KanbanCard } from './record/KanbanBoard';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

type ViewMode = 'kanban' | 'list';
type SortKey = 'updated' | 'value' | 'company';

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'updated', label: 'Last updated' },
  { key: 'value', label: 'Deal value' },
  { key: 'company', label: 'Company A–Z' },
];

const numVal = (s: string) => Number(s.replace(/[^0-9.]/g, '')) || 0;
const ageMin = (s: string) => {
  if (/just now/i.test(s)) return 0;
  const m = s.match(/(\d+)\s*([hd])/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  return Number(m[1]) * (m[2] === 'h' ? 60 : 1440);
};
function sortDeals(xs: DealSummary[], by: SortKey) {
  const arr = [...xs];
  if (by === 'value') arr.sort((a, b) => numVal(b.value) - numVal(a.value));
  else if (by === 'company') arr.sort((a, b) => a.company.localeCompare(b.company));
  else arr.sort((a, b) => ageMin(a.updated) - ageMin(b.updated));
  return arr;
}

function TradeLane({ origin, destination }: { origin: string; destination: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted">
      <Ship size={13} className="shrink-0 text-faint" />
      {origin} → {destination}
    </span>
  );
}

function StageDot({ stage }: { stage: Stage }) {
  return <span className="size-2 shrink-0 rounded-full" style={{ background: stageColor[stage] }} />;
}

/* ── Kanban card (deal variant of the shared KanbanCard) ───────────────────── */

function DealKanbanCard({
  deal,
  onOpen,
  dragging,
  onAddComment,
}: {
  deal: DealSummary;
  onOpen: (d: DealSummary) => void;
  dragging: boolean;
  onAddComment: (id: string) => void;
}) {
  const [commenting, setCommenting] = useState(false);
  const [text, setText] = useState('');
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const submit = () => {
    if (!text.trim()) return;
    onAddComment(deal.id);
    setText('');
    setCommenting(false);
  };

  return (
    <KanbanCard accent={stageColor[deal.stage]} dragging={dragging} onClick={() => onOpen(deal)}>
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-[14px] font-semibold text-ink">{deal.company}</span>
        {deal.alert && <AlertTriangle size={14} className="mt-0.5 shrink-0 text-danger" />}
      </div>
      <div className="mt-0.5 truncate text-[12px] text-muted">{deal.contact}</div>
      <div className="mt-1 text-[12px]">
        <TradeLane origin={deal.origin} destination={deal.destination} />
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
        {deal.mode === 'LCL' ? (
          <Package size={13} className="shrink-0 text-faint" />
        ) : (
          <Container size={13} className="shrink-0 text-faint" />
        )}
        <span className="font-medium text-ink">{deal.mode}</span>
        <span className="truncate">
          {deal.mode === 'LCL' ? deal.load : `${deal.teu} · ${deal.equipment}`}
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[14px] font-bold text-ink">{deal.value}</span>
        <span className="text-[10px] text-faint">{deal.updated}</span>
      </div>

      {/* Quick actions */}
      <div className="mt-2.5 flex items-center gap-3 border-t border-line pt-2 text-[10px] text-faint" onClick={stop}>
        <span className="inline-flex items-center gap-1" title={`${deal.tasks} tasks`}>
          <CheckSquare size={13} /> {deal.tasks}
        </span>
        <span className="inline-flex items-center gap-1" title={`${deal.notes} notes`}>
          <StickyNote size={13} /> {deal.notes}
        </span>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setCommenting((v) => !v)}
          className="ml-auto h-6 gap-1 px-1.5 text-[10px] text-faint"
          title="Add comment"
        >
          <MessageSquarePlus size={13} /> {deal.comments > 0 ? deal.comments : 'Comment'}
        </Button>
      </div>

      {commenting && (
        <div className="mt-2 flex items-center gap-1.5" onClick={stop}>
          <Input
            size="xs"
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') setCommenting(false);
            }}
            placeholder="Add a comment…"
            className="flex-1"
          />
          <Button size="icon-xs" onClick={submit} aria-label="Post comment">
            <Send size={13} />
          </Button>
        </div>
      )}
    </KanbanCard>
  );
}

function Kanban({
  columns,
  onOpen,
  onMove,
  onAdd,
  onAddComment,
}: {
  columns: { stage: Stage; deals: DealSummary[] }[];
  onOpen: (d: DealSummary) => void;
  onMove: (id: string, stage: Stage) => void;
  onAdd: (stage: Stage) => void;
  onAddComment: (id: string) => void;
}) {
  return (
    <KanbanBoard
      noun="deal"
      columns={columns.map(({ stage, deals }) => ({ key: stage, label: stage, color: stageColor[stage], items: deals }))}
      onMove={(id, key) => onMove(id, key as Stage)}
      onAdd={(key) => onAdd(key as Stage)}
      renderCard={(d, { dragging }) => <DealKanbanCard deal={d} onOpen={onOpen} dragging={dragging} onAddComment={onAddComment} />}
    />
  );
}

/* ── List ──────────────────────────────────────────────────────────────────── */

const listCols = 'grid-cols-[1.5fr_1fr_1.1fr_1fr_0.8fr_0.7fr]';

function List({ rows, onOpen }: { rows: DealSummary[]; onOpen: (d: DealSummary) => void }) {
  return (
    <div className="h-full overflow-y-auto px-5 py-4">
      <Card className="overflow-hidden">
        <div className={`grid ${listCols} gap-4 border-b border-line bg-subtle/40 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-faint`}>
          <span>Company</span>
          <span>Contact</span>
          <span>Trade lane</span>
          <span>Stage</span>
          <span className="text-right">Deal value</span>
          <span className="text-right">Updated</span>
        </div>
        {rows.map((d) => (
          <button
            key={d.id}
            onClick={() => onOpen(d)}
            className={`grid ${listCols} w-full items-center gap-4 border-b border-line px-4 py-3 text-left text-[14px] transition-colors last:border-0 hover:bg-subtle/40`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate font-semibold text-ink">{d.company}</span>
              {d.alert && <AlertTriangle size={13} className="shrink-0 text-danger" />}
            </span>
            <span className="truncate text-muted">{d.contact}</span>
            <span className="truncate">
              <TradeLane origin={d.origin} destination={d.destination} />
            </span>
            <span className="flex items-center gap-1.5 text-muted">
              <StageDot stage={d.stage} />
              {d.stage}
            </span>
            <span className="text-right font-bold text-ink">{d.value}</span>
            <span className="text-right text-[12px] text-faint">{d.updated}</span>
          </button>
        ))}
        {rows.length === 0 && (
          <div className="grid place-items-center py-10 text-[14px] text-faint">No deals match your filters</div>
        )}
      </Card>
    </div>
  );
}

/* ── View ──────────────────────────────────────────────────────────────────── */

export function DealsView({ onOpenDeal }: { onOpenDeal: (d: DealSummary) => void }) {
  const [mode, setMode] = useState<ViewMode>('kanban');
  const [items, setItems] = useState<DealSummary[]>(seedDeals);

  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('updated');
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [filterStages, setFilterStages] = useState<Set<Stage>>(new Set());

  const move = (id: string, stage: Stage) =>
    setItems((xs) => xs.map((d) => (d.id === id ? { ...d, stage, updated: 'just now' } : d)));
  const addComment = (id: string) =>
    setItems((xs) => xs.map((d) => (d.id === id ? { ...d, comments: d.comments + 1 } : d)));
  const addDeal = (stage: Stage) =>
    setItems((xs) => [
      {
        id: `AT-NEW-${Date.now() % 100000}`,
        company: 'New deal',
        contact: '—',
        contactRole: '—',
        contactEmail: '—',
        origin: '—',
        destination: '—',
        teu: '—',
        equipment: '—',
        mode: 'FCL',
        owner: 'Varun Reddy',
        value: '$0',
        stage,
        updated: 'just now',
        tasks: 0,
        notes: 0,
        comments: 0,
        nextInteraction: { when: '—', detail: 'Not scheduled' },
        lastInteraction: { when: '—', detail: 'No activity yet' },
        nextTask: { when: '—', detail: 'No task' },
      },
      ...xs,
    ]);

  const toggleStage = (s: Stage) =>
    setFilterStages((prev) => {
      const n = new Set(prev);
      n.has(s) ? n.delete(s) : n.add(s);
      return n;
    });
  const clearFilters = () => {
    setAlertsOnly(false);
    setFilterStages(new Set());
  };
  const activeFilters = (alertsOnly ? 1 : 0) + filterStages.size;

  const q = query.trim().toLowerCase();
  const matches = (d: DealSummary) => {
    if (q && !(d.company.toLowerCase().includes(q) || d.contact.toLowerCase().includes(q) || `${d.origin} ${d.destination}`.toLowerCase().includes(q)))
      return false;
    if (alertsOnly && !d.alert) return false;
    return true;
  };

  const visibleStages = filterStages.size ? stages.filter((s) => filterStages.has(s)) : stages;
  const columns = visibleStages.map((stage) => ({
    stage,
    deals: sortDeals(items.filter((d) => d.stage === stage && matches(d)), sortBy),
  }));
  const rows = sortDeals(
    items.filter((d) => matches(d) && (filterStages.size === 0 || filterStages.has(d.stage))),
    sortBy,
  );

  const sortLabel = sortOptions.find((o) => o.key === sortBy)!.label;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-6 py-3">
        <div className="flex items-baseline gap-2">
          <h1 className="t-page text-ink">Pipeline</h1>
          <span className="text-[14px] text-faint">{rows.length} deals</span>
        </div>

        <div className="flex items-center gap-2">
          <Input
            size="sm"
            start={<Search size={14} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search deals…"
            className="w-48"
          />

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown size={14} className="text-muted" />
                {sortLabel}
                <ChevronDown size={14} className="text-faint" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
                {sortOptions.map((o) => (
                  <DropdownMenuRadioItem key={o.key} value={o.key}>
                    {o.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal size={14} className="text-muted" />
                Filter
                {activeFilters > 0 && (
                  <span className="grid size-4 place-items-center rounded-full bg-ink text-[10px] font-bold text-canvas">
                    {activeFilters}
                  </span>
                )}
                <ChevronDown size={14} className="text-faint" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuCheckboxItem checked={alertsOnly} onCheckedChange={setAlertsOnly}>
                Alerts only
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Stage</DropdownMenuLabel>
              {stages.map((s) => (
                <DropdownMenuCheckboxItem key={s} checked={filterStages.has(s)} onCheckedChange={() => toggleStage(s)}>
                  <StageDot stage={s} />
                  {s}
                </DropdownMenuCheckboxItem>
              ))}
              {activeFilters > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={clearFilters} className="font-medium text-muted">
                    Clear all filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Kanban / List toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border border-line p-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMode('kanban')}
              className={`rounded-[6px] ${mode === 'kanban' ? 'bg-subtle text-ink' : ''}`}
            >
              <LayoutGrid size={14} /> Kanban
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMode('list')}
              className={`rounded-[6px] ${mode === 'list' ? 'bg-subtle text-ink' : ''}`}
            >
              <Rows3 size={14} /> List
            </Button>
          </div>

          <Button>
            <Plus size={15} /> New deal
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="min-h-0 flex-1 bg-surface">
        {mode === 'kanban' ? (
          <Kanban columns={columns} onOpen={onOpenDeal} onMove={move} onAdd={addDeal} onAddComment={addComment} />
        ) : (
          <List rows={rows} onOpen={onOpenDeal} />
        )}
      </div>
    </div>
  );
}
