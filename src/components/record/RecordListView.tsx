import { useState } from 'react';
import { Search, Plus, GripVertical, Columns3, ChevronDown, X, LayoutGrid, Rows3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

/** A list column: label, relative width (fr) and how to render a row's cell. */
export interface RecordColumn<T> {
  key: string;
  label: string;
  flex: number;
  render: (row: T) => React.ReactNode;
}

/**
 * RecordListView — the shared list page for CRM records (Contacts, Leads, …).
 * Title + count, search, add/remove + drag-to-reorder columns, row selection with a
 * bulk-action bar, and a "New …" button; optional board view (List | Kanban). Each record
 * type is a configuration of it.
 */
export function RecordListView<T extends { id: string }>({
  title,
  noun,
  rows: allRows,
  columns,
  defaultColumns,
  searchText,
  onOpen,
  rowLabel,
  newLabel,
  selectionActions,
  toolbar,
  board,
  defaultView = 'list',
}: {
  title: string;
  /** Plural noun for counts / empty state, e.g. "contacts". */
  noun: string;
  rows: T[];
  columns: RecordColumn<T>[];
  /** Column keys shown initially, in order. */
  defaultColumns: string[];
  /** Text the search box matches against (lower-cased by the view). */
  searchText: (row: T) => string;
  onOpen: (row: T) => void;
  /** Accessible name for a row's checkbox. */
  rowLabel: (row: T) => string;
  newLabel: string;
  /** Bulk actions shown when rows are selected. */
  selectionActions?: React.ReactNode;
  /** Extra controls in the top bar (e.g. filters), before Columns. */
  toolbar?: React.ReactNode;
  /** Optional board view of the (searched) rows — adds a List | Kanban toggle. */
  board?: (rows: T[]) => React.ReactNode;
  defaultView?: 'list' | 'board';
}) {
  const [view, setView] = useState<'list' | 'board'>(board ? defaultView : 'list');
  const [query, setQuery] = useState('');
  const [activeKeys, setActiveKeys] = useState<string[]>(defaultColumns);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragCol, setDragCol] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  const colDef = (k: string) => columns.find((c) => c.key === k)!;
  const q = query.trim().toLowerCase();
  const rows = allRows.filter((r) => !q || searchText(r).toLowerCase().includes(q));

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = rows.some((r) => selected.has(r.id)) && !allSelected;

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const toggleColumn = (k: string) =>
    setActiveKeys((keys) => (keys.includes(k) ? keys.filter((x) => x !== k) : [...keys, k]));

  const reorder = (target: string) =>
    setActiveKeys((keys) => {
      if (!dragCol || dragCol === target) return keys;
      const without = keys.filter((k) => k !== dragCol);
      without.splice(without.indexOf(target), 0, dragCol);
      return without;
    });

  const tmpl = `2.25rem ${activeKeys.map((k) => `${colDef(k).flex}fr`).join(' ')}`;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-6 py-3">
        <div className="flex items-baseline gap-2">
          <h1 className="t-page text-ink">{title}</h1>
          <span className="text-[12px] text-faint">
            {rows.length} {noun}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            size="sm"
            start={<Search size={14} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${noun}…`}
            className="w-48"
          />
          {toolbar}

          {/* Columns — add / remove (list view only) */}
          {view === 'list' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns3 size={14} className="text-muted" />
                  Columns
                  <ChevronDown size={14} className="text-faint" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-80 w-52">
                <DropdownMenuLabel>Add / remove columns</DropdownMenuLabel>
                {columns.map((c) => (
                  <DropdownMenuCheckboxItem key={c.key} checked={activeKeys.includes(c.key)} onCheckedChange={() => toggleColumn(c.key)}>
                    {c.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Kanban / List toggle — same as the Pipeline */}
          {board && (
            <div className="flex items-center gap-0.5 rounded-lg border border-line p-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView('board')}
                aria-pressed={view === 'board'}
                className={`rounded-[6px] ${view === 'board' ? 'bg-subtle text-ink' : ''}`}
              >
                <LayoutGrid size={14} /> Kanban
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView('list')}
                aria-pressed={view === 'list'}
                className={`rounded-[6px] ${view === 'list' ? 'bg-subtle text-ink' : ''}`}
              >
                <Rows3 size={14} /> List
              </Button>
            </div>
          )}

          <Button>
            <Plus size={15} /> {newLabel}
          </Button>
        </div>
      </header>

      {/* Board view */}
      {view === 'board' && board && <div className="min-h-0 flex-1 bg-surface">{board(rows)}</div>}

      {/* Selection toolbar */}
      {view === 'list' && selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-line bg-subtle/60 px-6 py-2">
          <span className="text-[14px] font-medium text-ink">{selected.size} selected</span>
          <div className="flex items-center gap-1.5">{selectionActions}</div>
          <Button variant="ghost" size="xs" onClick={() => setSelected(new Set())} className="ml-auto gap-1 text-[12px] text-muted">
            <X size={13} /> Clear
          </Button>
        </div>
      )}

      {/* Table */}
      {view === 'list' && (
        <div className="min-h-0 flex-1 overflow-auto bg-surface px-5 py-4">
          <Card className="min-w-[760px] overflow-hidden">
            {/* Header row */}
            <div className="grid items-center gap-4 border-b border-line bg-subtle/40 px-4 py-2.5" style={{ gridTemplateColumns: tmpl }}>
              <Checkbox checked={allSelected} indeterminate={someSelected} onCheckedChange={toggleAll} aria-label="Select all" />
              {activeKeys.map((k) => {
                const showLine = !!dragCol && dragCol !== k && overCol === k;
                return (
                  <button
                    key={k}
                    draggable
                    onDragStart={() => setDragCol(k)}
                    onDragEnd={() => {
                      setDragCol(null);
                      setOverCol(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (overCol !== k) setOverCol(k);
                    }}
                    onDrop={() => {
                      reorder(k);
                      setDragCol(null);
                      setOverCol(null);
                    }}
                    className={`relative flex cursor-grab items-center gap-1 text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-faint active:cursor-grabbing ${
                      dragCol === k ? 'opacity-40' : ''
                    }`}
                    title="Drag to reorder"
                  >
                    {showLine && <span className="absolute top-[-4px] bottom-[-4px] -left-2 w-0.5 rounded bg-ink" />}
                    <GripVertical size={12} className="shrink-0 opacity-50" />
                    {colDef(k).label}
                  </button>
                );
              })}
            </div>

            {/* Rows */}
            {rows.map((r) => {
              const sel = selected.has(r.id);
              return (
                <div
                  key={r.id}
                  onClick={() => onOpen(r)}
                  style={{ gridTemplateColumns: tmpl }}
                  className={`grid cursor-pointer items-center gap-4 border-b border-line px-4 py-3 text-[14px] transition-colors last:border-0 ${
                    sel ? 'bg-subtle/50' : 'hover:bg-subtle/30'
                  }`}
                >
                  <Checkbox checked={sel} onCheckedChange={() => toggleRow(r.id)} aria-label={`Select ${rowLabel(r)}`} />
                  {activeKeys.map((k) => (
                    <span key={k} className="flex min-w-0 items-center">
                      {colDef(k).render(r)}
                    </span>
                  ))}
                </div>
              );
            })}
            {rows.length === 0 && <div className="grid place-items-center py-10 text-[14px] text-faint">No {noun} match your search</div>}
          </Card>
        </div>
      )}
    </div>
  );
}
