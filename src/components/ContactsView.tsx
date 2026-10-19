import { useState } from 'react';
import {
  Search,
  Plus,
  Phone,
  GripVertical,
  Columns3,
  ChevronDown,
  X,
  Mail,
  Tag,
  Trash2,
} from 'lucide-react';
import { contacts, type ContactSummary } from '../data/contacts';
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

type ColKey =
  | 'name'
  | 'company'
  | 'role'
  | 'email'
  | 'phone'
  | 'location'
  | 'lastDealDate'
  | 'dealsCount'
  | 'owner'
  | 'created'
  | 'tags';

interface ColDef {
  key: ColKey;
  label: string;
  flex: number;
  render: (c: ContactSummary) => React.ReactNode;
}

const ALL_COLS: ColDef[] = [
  { key: 'name', label: 'Contact', flex: 1.2, render: (c) => <span className="truncate font-semibold text-ink">{c.name}</span> },
  { key: 'company', label: 'Company', flex: 1.1, render: (c) => <span className="truncate text-muted">{c.company}</span> },
  { key: 'role', label: 'Role', flex: 1, render: (c) => <span className="truncate text-muted">{c.role}</span> },
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
  { key: 'owner', label: 'Owner', flex: 1, render: (c) => <span className="truncate text-muted">{c.owner}</span> },
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

const colDef = (k: ColKey) => ALL_COLS.find((c) => c.key === k)!;

export function ContactsView({ onOpenContact }: { onOpenContact: (c: ContactSummary) => void }) {
  const [query, setQuery] = useState('');
  const [activeKeys, setActiveKeys] = useState<ColKey[]>([
    'name',
    'company',
    'role',
    'email',
    'phone',
    'lastDealDate',
    'dealsCount',
  ]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragCol, setDragCol] = useState<ColKey | null>(null);
  const [overCol, setOverCol] = useState<ColKey | null>(null);

  const q = query.trim().toLowerCase();
  const rows = contacts.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
  );

  const allSelected = rows.length > 0 && rows.every((c) => selected.has(c.id));
  const someSelected = rows.some((c) => selected.has(c.id)) && !allSelected;

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((c) => c.id)));
  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleColumn = (k: ColKey) =>
    setActiveKeys((keys) => (keys.includes(k) ? keys.filter((x) => x !== k) : [...keys, k]));

  const reorder = (target: ColKey) =>
    setActiveKeys((keys) => {
      if (!dragCol || dragCol === target) return keys;
      const without = keys.filter((k) => k !== dragCol);
      const idx = without.indexOf(target);
      without.splice(idx, 0, dragCol);
      return without;
    });

  const tmpl = `2.25rem ${activeKeys.map((k) => `${colDef(k).flex}fr`).join(' ')}`;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-6 py-3">
        <div className="flex items-baseline gap-2">
          <h1 className="t-page text-ink">Contacts</h1>
          <span className="text-[12px] text-faint">{rows.length} contacts</span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            size="sm"
            start={<Search size={14} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts…"
            className="w-48"
          />

          {/* Columns — add / remove */}
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
              {ALL_COLS.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.key}
                  checked={activeKeys.includes(c.key)}
                  onCheckedChange={() => toggleColumn(c.key)}
                >
                  {c.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button>
            <Plus size={15} /> New contact
          </Button>
        </div>
      </header>

      {/* Selection toolbar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-line bg-subtle/60 px-6 py-2">
          <span className="text-[14px] font-medium text-ink">{selected.size} selected</span>
          <div className="flex items-center gap-1.5">
            <Button variant="secondary" size="xs" className="gap-1.5 text-[12px]">
              <Mail size={13} /> Email
            </Button>
            <Button variant="secondary" size="xs" className="gap-1.5 text-[12px]">
              <Tag size={13} /> Add tag
            </Button>
            <Button variant="destructive" size="xs" className="gap-1.5 text-[12px]">
              <Trash2 size={13} /> Delete
            </Button>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setSelected(new Set())}
            className="ml-auto gap-1 text-[12px] text-muted"
          >
            <X size={13} /> Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-auto bg-surface px-5 py-4">
        <Card className="min-w-[760px] overflow-hidden">
          {/* Header row */}
          <div
            className="grid items-center gap-4 border-b border-line bg-subtle/40 px-4 py-2.5"
            style={{ gridTemplateColumns: tmpl }}
          >
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
                  {showLine && <span className="absolute -left-2 top-[-4px] bottom-[-4px] w-0.5 rounded bg-ink" />}
                  <GripVertical size={12} className="shrink-0 opacity-50" />
                  {colDef(k).label}
                </button>
              );
            })}
          </div>

          {/* Rows */}
          {rows.map((c) => {
            const sel = selected.has(c.id);
            return (
              <div
                key={c.id}
                onClick={() => onOpenContact(c)}
                style={{ gridTemplateColumns: tmpl }}
                className={`grid cursor-pointer items-center gap-4 border-b border-line px-4 py-3 text-[14px] transition-colors last:border-0 ${
                  sel ? 'bg-subtle/50' : 'hover:bg-subtle/30'
                }`}
              >
                <Checkbox checked={sel} onCheckedChange={() => toggleRow(c.id)} aria-label={`Select ${c.name}`} />
                {activeKeys.map((k) => (
                  <span key={k} className="flex min-w-0 items-center">
                    {colDef(k).render(c)}
                  </span>
                ))}
              </div>
            );
          })}
          {rows.length === 0 && (
            <div className="grid place-items-center py-10 text-[14px] text-faint">No contacts match your search</div>
          )}
        </Card>
      </div>
    </div>
  );
}
