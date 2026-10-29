import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpDown,
  BookmarkCheck,
  Box,
  Calendar,
  ChevronDown,
  CircleCheck,
  Eye,
  LayoutList,
  ListFilter,
  Package,
  Plus,
  Sparkles,
  Users,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { allInOf, chargeBreakdown, transitMin, type RateCard, type SearchLine } from '../data/rates';
import type { Port } from '../data/locations';
import { PriceHeader, RateResultCard, type PricingLevel } from './RateResultCard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { scrollToTop, useStuck } from '@/lib/use-stuck';

/* ── Search recap (row 1) ──────────────────────────────────────────────────── */

export interface SearchRecap {
  mode: 'FCL' | 'LCL';
  pol: Port | null;
  pod: Port | null;
  /** yyyy-mm-dd */
  cutoff: string;
  cargoType: string;
  customer?: string;
  bls: number;
  currency: string;
}

const fmtDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

function PortHead({ port }: { port: Port | null }) {
  return (
    <span className="flex min-w-0 flex-col leading-tight">
      <span className="truncate text-[14px] text-ink">{port?.name ?? '—'}</span>
      <span className="text-[10px] text-faint">{port?.code ?? ''}</span>
    </span>
  );
}

function RecapChip({ icon: Icon, children, title }: { icon: LucideIcon; children: React.ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex h-7 max-w-56 shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 text-[12px] text-muted"
    >
      <Icon size={13} className="shrink-0 text-faint" />
      <span className="truncate">{children}</span>
    </span>
  );
}

/** Row 1 of the results header — mode, POL → POD, search chips and "View Search". */
export function RecapRow({
  recap,
  lines,
  onViewSearch,
  compact = false,
  extra,
}: {
  recap: SearchRecap;
  lines: SearchLine[];
  onViewSearch: () => void;
  /** Condensed single line (header stuck while scrolling). */
  compact?: boolean;
  /** Extra actions on the right of the condensed line. */
  extra?: React.ReactNode;
}) {
  const equipment = lines.map((l) => `${l.qty}x ${l.type}`).join(', ');
  if (compact) {
    return (
      <div className="flex items-center gap-3 border-b border-line px-5 py-1.5 text-[12px]">
        <span className="shrink-0 rounded-[4px] bg-atlas/80 px-1.5 text-[10px] font-medium text-canvas">{recap.mode}</span>
        <span className="flex shrink-0 items-center gap-1 text-ink">
          {recap.pol?.code ?? '—'} <ArrowRight size={11} className="text-faint" /> {recap.pod?.code ?? '—'}
        </span>
        <span className="min-w-0 truncate text-muted">
          {equipment}
          {recap.customer && <span className="text-faint"> · {recap.customer}</span>}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-2">
          {extra}
          <Button variant="ghost" size="xs" onClick={onViewSearch} className="h-6 text-[12px] text-atlas hover:bg-atlas/10">
            <Eye size={12} /> View Search
          </Button>
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <span className="rounded-[6px] bg-atlas/80 px-2 py-0.5 text-[12px] font-medium text-canvas">{recap.mode}</span>
        <PortHead port={recap.pol} />
        <ArrowRight size={14} className="shrink-0 text-faint" />
        <PortHead port={recap.pod} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <RecapChip icon={Calendar} title="Cut-off date">
          {fmtDate(recap.cutoff)}
        </RecapChip>
        <RecapChip icon={Box} title={`Equipment: ${equipment}`}>
          {equipment}
        </RecapChip>
        <RecapChip icon={Package} title="Cargo type">
          {recap.cargoType}
        </RecapChip>
        {recap.customer && (
          <RecapChip icon={Users} title="Customer">
            {recap.customer}
          </RecapChip>
        )}
        <Button variant="outline" size="sm" onClick={onViewSearch} className="border-atlas/50 text-atlas hover:bg-atlas/10">
          <Eye size={14} /> View Search
        </Button>
      </div>
    </div>
  );
}

/**
 * Pinned header shell shared by step 2 (results) and step 3 (selected rates):
 * subtle band, strong borders, soft shadow; sticks flush to the top of the step pane.
 */
export function StickyHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 -mx-5 border-y border-line-strong bg-subtle shadow-[0_6px_12px_-8px_var(--color-shadow)]">
      {children}
    </div>
  );
}

/* ── Sorting / filtering ───────────────────────────────────────────────────── */

type SortKey = 'price' | 'transit' | 'etd' | 'co2' | 'validity';
const sortLabels: Record<SortKey, string> = {
  price: 'Price (low → high)',
  transit: 'Transit time',
  etd: 'Departure date',
  co2: 'CO₂ emissions',
  validity: 'Validity (longest)',
};
const quickSorts: { key: SortKey; label: string }[] = [
  { key: 'price', label: 'Cheapest' },
  { key: 'transit', label: 'Fastest' },
  { key: 'etd', label: 'Earliest departure' },
  { key: 'co2', label: 'Greenest' },
];

type Tab = 'all' | 'ai' | 'selected';
type FilterKey = 'direct' | 'noDg' | 'lowCo2';
const filterLabels: Record<FilterKey, string> = {
  direct: 'Direct services only',
  noDg: 'Hide hazardous (DG) rates',
  lowCo2: 'Low CO₂ only',
};

const time = (d: string) => new Date(d).getTime() || 0;

/* ── Small pieces ──────────────────────────────────────────────────────────── */

function TabButton({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex h-7 items-center gap-1.5 rounded-[6px] px-2.5 text-[12px] transition-colors',
        active ? 'bg-atlas/15 text-atlas' : 'text-muted hover:text-ink',
      )}
    >
      <Icon size={13} />
      {label}
      <span
        className={cn('rounded-[4px] px-1 text-[10px]', active ? 'bg-atlas/25 text-atlas' : 'bg-subtle text-faint')}
      >
        {count}
      </span>
    </button>
  );
}

/* ── Component ─────────────────────────────────────────────────────────────── */

/**
 * Step 2 search results — sticky header (search recap · toolbar · selection bar ·
 * aligned price columns) over the rate cards. Tabs, sort, filters and the
 * freight-total switch all act on the list below.
 */
export function SearchResults({
  rates,
  recap,
  lines,
  pricingLevel,
  selected,
  onToggle,
  onClearSelection,
  onViewSearch,
  onCreateQuote,
}: {
  rates: RateCard[];
  recap: SearchRecap;
  lines: SearchLine[];
  pricingLevel: PricingLevel;
  /** Selected carriers. */
  selected: string[];
  onToggle: (carrier: string) => void;
  onClearSelection: () => void;
  /** Back to the search form (step 1). */
  onViewSearch: () => void;
  /** Continue with the selected rates (to Finalize pricing). */
  onCreateQuote: () => void;
}) {
  const [tab, setTab] = useState<Tab>('all');
  const [showTotal, setShowTotal] = useState(false);
  // Condense the sticky header once it's stuck (scrolled past the top).
  const [sentinelRef, stuck, sentinel] = useStuck();
  const [sortBy, setSortBy] = useState<SortKey | ''>('');
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set());

  // Atlas suggestions: cheapest all-in, fastest and lowest-CO₂ rate.
  const allIn = (r: RateCard) => allInOf(chargeBreakdown(r), lines, recap.bls).sell;
  const pick = (score: (r: RateCard) => number) => [...rates].sort((a, b) => score(a) - score(b))[0]?.rateId;
  // Why each rate was suggested (a rate can win more than one).
  const aiReasons = new Map<string, string[]>();
  (
    [
      [pick(allIn), 'Cheapest'],
      [pick(transitMin), 'Fastest'],
      [pick((r) => r.co2.tonnes), 'Lowest CO₂'],
    ] as const
  ).forEach(([id, reason]) => {
    if (id) aiReasons.set(id, [...(aiReasons.get(id) ?? []), reason]);
  });
  const aiIds = new Set(aiReasons.keys());

  const score: Record<SortKey, (r: RateCard) => number> = {
    price: allIn,
    transit: transitMin,
    etd: (r) => time(r.route.ocean.sailings[0]),
    co2: (r) => r.co2.tonnes,
    validity: (r) => -time(r.validTo),
  };

  const passes = (r: RateCard) =>
    (!filters.has('direct') || r.route.ocean.via.length === 0) &&
    (!filters.has('noDg') || !r.hazardous) &&
    (!filters.has('lowCo2') || r.co2.level === 'Low');

  const inTab = (r: RateCard) =>
    tab === 'all' ? true : tab === 'ai' ? aiIds.has(r.rateId) : selected.includes(r.carrier);
  let list = rates.filter((r) => inTab(r) && passes(r));
  if (sortBy) list = [...list].sort((a, b) => score[sortBy](a) - score[sortBy](b));

  const toggleFilter = (k: FilterKey) =>
    setFilters((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  return (
    // 16px between rate cards (and below the sticky header).
    <div className="space-y-4">
      <div ref={sentinelRef} aria-hidden className="h-px" />
      {/* Sticky header — full at the top, condensed to one line once scrolled */}
      <StickyHeader>
        <RecapRow
          recap={recap}
          lines={lines}
          onViewSearch={onViewSearch}
          compact={stuck}
          extra={
            stuck && (
              <>
                {selected.length > 0 && (
                  <>
                    <span className="text-muted">
                      <span className="text-ink">{selected.length}</span> selected
                    </span>
                    <Button size="xs" onClick={onCreateQuote} className="h-6 bg-success text-[12px] text-canvas hover:bg-success/90">
                      <Zap size={12} /> Create New Quote
                    </Button>
                  </>
                )}
                <Button variant="outline" size="xs" onClick={() => scrollToTop(sentinel)} className="h-6 text-[12px] text-muted">
                  <ListFilter size={12} /> Sort & filter
                </Button>
              </>
            )
          }
        />

        {/* Row 2 — toolbar (hidden while condensed) */}
        {!stuck && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-b border-line px-5 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="border-atlas/50 text-atlas hover:bg-atlas/10">
                <Sparkles size={14} /> Filter With AI
              </Button>
              <Button size="sm" className="bg-atlas text-canvas hover:bg-atlas/90">
                <Plus size={14} /> Add New Rate
              </Button>

              <label className="flex cursor-pointer items-center gap-2 px-1 text-[12px] text-muted">
                <Switch checked={showTotal} onCheckedChange={setShowTotal} aria-label="Show freight total" />
                Show Freight Total
              </label>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-muted">
                    <ArrowUpDown size={14} /> Quick Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
                    {quickSorts.map((q) => (
                      <DropdownMenuRadioItem key={q.key} value={q.key}>
                        {q.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-44 justify-between font-normal text-muted">
                    <span className="truncate">{sortBy ? sortLabels[sortBy] : 'Sort by'}</span>
                    <ChevronDown size={14} className="text-faint" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
                    {(Object.keys(sortLabels) as SortKey[]).map((k) => (
                      <DropdownMenuRadioItem key={k} value={k}>
                        {sortLabels[k]}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-atlas/50 text-atlas hover:bg-atlas/10">
                    <ListFilter size={14} /> Filters
                    {filters.size > 0 && (
                      <span className="grid size-4 place-items-center rounded-full bg-atlas text-[10px] text-canvas">{filters.size}</span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60">
                  <DropdownMenuLabel>Show</DropdownMenuLabel>
                  {(Object.keys(filterLabels) as FilterKey[]).map((k) => (
                    <DropdownMenuCheckboxItem key={k} checked={filters.has(k)} onCheckedChange={() => toggleFilter(k)}>
                      {filterLabels[k]}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Row 3 — selection bar (only with a selection; hidden while condensed) */}
        {!stuck && selected.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-atlas/5 px-5 py-2">
            <span className="flex items-center gap-2 text-[14px] text-ink">
              <span className="grid size-5 place-items-center rounded-full bg-ink text-[10px] font-medium text-canvas">
                {selected.length}
              </span>
              Rate card{selected.length === 1 ? '' : 's'} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearSelection}
                className="border-danger/40 bg-danger/10 text-danger hover:bg-danger/15"
              >
                <X size={14} /> Clear All
              </Button>
              <Button variant="outline" size="sm" className="border-success/50 text-success hover:bg-success/10">
                <CircleCheck size={14} /> Update Selection
              </Button>
              <Button size="sm" onClick={onCreateQuote} className="bg-success text-canvas hover:bg-success/90">
                <Zap size={14} /> Create New Quote
              </Button>
            </div>
          </div>
        )}

        {/* Price columns — aligned with every card's price section */}
        <div className="px-5 py-1.5">
          <PriceHeader
            currency={recap.currency}
            lines={lines}
            left={
              <div role="tablist" aria-label="Result sets" className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-line p-0.5 [&>*]:shrink-0">
                <TabButton icon={LayoutList} label="All Results" count={rates.length} active={tab === 'all'} onClick={() => setTab('all')} />
                <TabButton icon={Sparkles} label="AI Suggested" count={aiIds.size} active={tab === 'ai'} onClick={() => setTab('ai')} />
                <TabButton
                  icon={BookmarkCheck}
                  label="Already Selected"
                  count={selected.length}
                  active={tab === 'selected'}
                  onClick={() => setTab('selected')}
                />
              </div>
            }
          />
        </div>
      </StickyHeader>

      {list.map((r) => {
        const isSelected = selected.includes(r.carrier);
        const reasons = aiReasons.get(r.rateId);
        // Tags only in All Results — inside the other tabs every card would carry the same one.
        const showTags = tab === 'all' && (reasons || isSelected);
        return (
          <div key={r.rateId}>
            {showTags && (
              <div className="flex gap-1 pl-3">
                {reasons && (
                  <span className="flex h-5 items-center gap-1 rounded-t-[6px] border border-b-0 border-atlas/50 bg-atlas/15 px-2 text-[10px] text-atlas">
                    <Sparkles size={10} /> AI Suggested · {reasons.join(' · ')}
                  </span>
                )}
                {isSelected && (
                  <span className="flex h-5 items-center gap-1 rounded-t-[6px] border border-b-0 border-success/50 bg-success/15 px-2 text-[10px] text-success">
                    <BookmarkCheck size={10} /> Already Selected
                  </span>
                )}
              </div>
            )}
            <RateResultCard
              rate={r}
              lines={lines}
              pricingLevel={pricingLevel}
              selected={isSelected}
              onToggle={() => onToggle(r.carrier)}
              bls={recap.bls}
              showTotal={showTotal}
            />
          </div>
        );
      })}
      {list.length === 0 && (
        <div className="grid place-items-center rounded-xl border border-dashed border-line py-10 text-[14px] text-faint">
          No rates match — change the tab or clear filters.
        </div>
      )}
    </div>
  );
}
