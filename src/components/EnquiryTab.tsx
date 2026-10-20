import { Fragment, useEffect, useRef, useState } from 'react';
import {
  Check,
  Search,
  ListChecks,
  Receipt,
  FileText,
  SendHorizontal,
  Sparkles,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  Plus,
  Ship,
  User,
  type LucideIcon,
} from 'lucide-react';
import { deal } from '../data/deal';
import { EmailThread, type QuoteDraft } from './EmailThread';
import { QuoteDraftStep, addDaysIso } from './QuoteDraftStep';
import { QuoteSentSummary } from './QuoteSentSummary';
import { PriceHeader, RateResultCard, type PricingLevel } from './RateResultCard';
import { CommonChargesCard, type ChargeOps } from './RateDetails';
import { RecapRow, SearchResults, StickyHeader, type SearchRecap } from './SearchResults';
import { rateCards, allInOf, chargeBreakdown, type LegCharges, type RateCard, type SearchLine } from '../data/rates';
import {
  addCharge,
  extractCommon,
  removeCharge,
  replaceCharge,
  restoreCommon,
  runChargeCommand,
  type CommonExtraction,
} from '../data/chargeEdits';
import { useAgent } from '@/lib/agent-context';
import { useStuck } from '@/lib/use-stuck';
import { LaneFields, type Leg } from './LocationField';
import { LoadDetails, type Load } from './LoadDetails';
import { contacts, type ContactSummary } from '../data/contacts';
import { ChipCombobox } from '@/components/ui/combobox';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { GroupedMultiSelect, type MultiSelectGroup } from '@/components/ui/multi-select';
import { doorLocations, portByCode } from '../data/locations';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/* ── The enquiry run (would come from the agent run in production) ─────────── */

type StepStatus = 'done' | 'current' | 'pending';

const steps: { label: string; icon: LucideIcon; sub: string; detail: string; status: StepStatus }[] = [
  { label: 'Search rates', icon: Search, sub: 'Query live carrier rates', detail: 'Parameters Atlas used to query carrier rates', status: 'done' },
  { label: 'Select results', icon: ListChecks, sub: 'Shortlist rate cards', detail: 'Pick one or more carriers to carry into the quote', status: 'done' },
  { label: 'Finalize pricing', icon: Receipt, sub: 'Edit charges · add margin', detail: 'Selected rates from step 2 — edit buy/sell amounts in the tables, or ask Atlas', status: 'done' },
  { label: 'Draft quote', icon: FileText, sub: 'Generate the quote PDF', detail: 'Generated Quote #Q-0142.pdf', status: 'done' },
  { label: 'Send quote', icon: SendHorizontal, sub: 'Email the customer', detail: 'Quote sent — track the response and record the next action', status: 'done' },
];


/* Step-1 option lists (would come from the rate platform in production). */
const platformGroups: MultiSelectGroup[] = [
  {
    label: 'Platform rates',
    options: [
      { value: 'contract', label: 'Contract rates', icon: <Layers size={13} className="text-muted" /> },
      { value: 'spot', label: 'Spot rates', icon: <Layers size={13} className="text-muted" /> },
      { value: 'tariff', label: 'Tariff rates', icon: <Layers size={13} className="text-muted" /> },
    ],
  },
];

const onlineCarrierGroups: MultiSelectGroup[] = [
  {
    label: 'Carrier instant quotes',
    options: [
      { value: 'maersk', label: 'Maersk Spot', icon: <Ship size={13} className="text-muted" /> },
      { value: 'msc', label: 'MSC Instant Quote', icon: <Ship size={13} className="text-muted" /> },
      { value: 'cma', label: 'CMA CGM SpotOn', icon: <Ship size={13} className="text-muted" /> },
      { value: 'hapag', label: 'Hapag-Lloyd Quick Quotes', icon: <Ship size={13} className="text-muted" /> },
      { value: 'one', label: 'ONE Quote', icon: <Ship size={13} className="text-muted" /> },
    ],
  },
];

const valueAddedServiceGroups: MultiSelectGroup[] = [
  {
    label: 'Customs',
    options: [
      { value: 'export-customs', label: 'Export customs clearance' },
      { value: 'import-customs', label: 'Import customs clearance' },
    ],
  },
  {
    label: 'Cargo protection',
    options: [
      { value: 'insurance', label: 'Cargo insurance' },
      { value: 'fumigation', label: 'Fumigation' },
      { value: 'survey', label: 'Inspection / survey' },
    ],
  },
  {
    label: 'Handling & documents',
    options: [
      { value: 'warehousing', label: 'Warehousing' },
      { value: 'lashing', label: 'Lashing & choking' },
      { value: 'coo', label: 'Certificate of origin' },
    ],
  },
];

const salesPeople = ['Varun Reddy', 'Aisha Khan', 'Daniel Brooks', 'Mei Lin', 'Rohan Iyer'];

const currencies = ['USD', 'EUR', 'INR', 'GBP', 'AED', 'SGD', 'CNY'];

const incoterms = [
  'EXW — Ex Works',
  'FCA — Free Carrier',
  'FAS — Free Alongside Ship',
  'FOB — Free On Board',
  'CFR — Cost and Freight',
  'CIF — Cost, Insurance and Freight',
  'CPT — Carriage Paid To',
  'CIP — Carriage and Insurance Paid To',
  'DAP — Delivered At Place',
  'DPU — Delivered at Place Unloaded',
  'DDP — Delivered Duty Paid',
];


function Reasoning({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex gap-2 rounded-lg border border-atlas/30 bg-atlas-bg/20 p-3">
      <Sparkles size={14} className="mt-0.5 shrink-0 text-atlas" />
      <p className="text-[12px] leading-relaxed text-muted">{children}</p>
    </div>
  );
}

/* ── Step 1 — the search-parameter form ────────────────────────────────────── */

interface SearchParams {
  origin: Leg;
  destination: Leg;
  /** Service provider — rate sources searched. */
  platforms: string[];
  onlineCarriers: string[];
  cutoff: string; // yyyy-mm-dd
  incoterm: string;
  customer: ContactSummary | null;
  valueAddedServices: string[];
  salesPerson: string;
  currency: string;
  /** Rates to show: buy, sell or both. */
  pricingLevel: 'buy' | 'sell' | 'both';
  load: Load;
}

function SearchForm({
  params,
  onChange,
  onSearch,
}: {
  params: SearchParams;
  onChange: (p: SearchParams) => void;
  onSearch: () => void;
}) {
  const set =
    (k: 'cutoff' | 'incoterm') => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...params, [k]: e.target.value });
  return (
    <div>
      {/* Top row — mode (drives the lane + load details) on the left, cut-off date on the right. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="t-subhead text-ink">Mode</span>
          <SegmentedControl
            aria-label="Shipment mode"
            value={params.load.mode}
            onChange={(mode) => onChange({ ...params, load: { ...params.load, mode } })}
            options={[
              { value: 'FCL', label: 'FCL' },
              { value: 'LCL', label: 'LCL' },
            ]}
          />
        </div>
        <label className="flex items-center gap-3">
          <span className="t-subhead text-ink">Cut-off date</span>
          <Input size="sm" type="date" value={params.cutoff} onChange={set('cutoff')} className="w-40" />
        </label>
      </div>
      <LaneFields
        origin={params.origin}
        destination={params.destination}
        onChange={(origin, destination) => onChange({ ...params, origin, destination })}
      />
      {/* Container queries: columns follow the step pane's width, not the window's. */}
      <div className="@container mt-4 space-y-4">
        {/* Left half: service provider (stacked) · right half: load details. */}
        <div className="grid grid-cols-1 items-start gap-4 @2xl:grid-cols-2">
          <Card className="@container">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="t-subhead text-ink">Service provider</span>
                <span className="text-[12px] text-faint">
                  {params.platforms.length} platform{params.platforms.length === 1 ? '' : 's'} ·{' '}
                  {params.onlineCarriers.length} carrier{params.onlineCarriers.length === 1 ? '' : 's'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Platform">
                <GroupedMultiSelect
                  aria-label="Platform"
                  value={params.platforms}
                  onChange={(platforms) => onChange({ ...params, platforms })}
                  groups={platformGroups}
                  placeholder="Choose platform rates…"
                  allLabel="All platforms"
                />
              </Field>
              <Field label="Online carriers">
                <GroupedMultiSelect
                  aria-label="Online carriers"
                  value={params.onlineCarriers}
                  onChange={(onlineCarriers) => onChange({ ...params, onlineCarriers })}
                  groups={onlineCarrierGroups}
                  placeholder="Choose online carriers…"
                  allLabel="All carriers"
                />
              </Field>
            </CardContent>
          </Card>
          <LoadDetails load={params.load} onChange={(load) => onChange({ ...params, load })} />
        </div>

        <div className="grid grid-cols-1 gap-3 @lg:grid-cols-2">
          <Field label="Incoterm">
            <Select value={params.incoterm} onChange={set('incoterm')} options={incoterms} />
          </Field>
          <Field label="Pricing level">
            <SegmentedControl
              stretch
              aria-label="Pricing level"
              value={params.pricingLevel}
              onChange={(pricingLevel) => onChange({ ...params, pricingLevel })}
              options={[
                { value: 'buy', label: 'Buy' },
                { value: 'sell', label: 'Sell' },
                { value: 'both', label: 'Both' },
              ]}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 @lg:grid-cols-2">
          <Field label="Customer / Contact">
            <ChipCombobox
              aria-label="Customer or contact"
              value={params.customer}
              onChange={(customer) => onChange({ ...params, customer })}
              options={contacts}
              getKey={(c) => c.id}
              matches={(c, q) => `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(q)}
              renderItem={(c) => (
                <>
                  <User size={13} className="shrink-0 text-muted" />
                  <span className="truncate font-medium text-ink">{c.name}</span>
                  <span className="truncate text-faint">{c.company}</span>
                </>
              )}
              placeholder="Search customer or contact…"
              emptyText="No contacts match"
            />
          </Field>
          <Field label="Value added services">
            <GroupedMultiSelect
              aria-label="Value added services"
              value={params.valueAddedServices}
              onChange={(valueAddedServices) => onChange({ ...params, valueAddedServices })}
              groups={valueAddedServiceGroups}
              placeholder="None"
              allLabel="All services"
            />
          </Field>
        </div>
      </div>

      {/* Action bar — sales person + currency sit with the search as key context for the rates. */}
      <div className="@container mt-5 border-t border-line pt-4">
        <div className="flex flex-wrap items-end justify-end gap-3">
          <Field label="Sales person" className="w-full @md:w-52">
            <Select
              value={params.salesPerson}
              onChange={(e) => onChange({ ...params, salesPerson: e.target.value })}
              options={salesPeople}
            />
          </Field>
          <Field label="Search currency" className="w-full @md:w-32">
            <Select
              value={params.currency}
              onChange={(e) => onChange({ ...params, currency: e.target.value })}
              options={currencies}
            />
          </Field>
          <Button onClick={onSearch} title="Queries platform rates and online carriers" className="@max-md:w-full">
            <Search size={15} />
            Search rates
          </Button>
        </div>
      </div>
      <Reasoning>
        Atlas ran this search across carriers and returned <strong className="text-ink">12 rates</strong> for the lane
        and equipment. Adjust any parameter and re-run to refresh the shortlist.
      </Reasoning>
    </div>
  );
}

/* ── Step 3 footer ─────────────────────────────────────────────────────────── */

/** Pinned to the bottom of the step pane (outside the scroller): summary + the two quote actions. */
function QuoteFooter({
  count,
  sells,
  currency,
  withCommon,
  onDraftQuote,
  onNewQuote,
}: {
  count: number;
  /** All-in sell per selected rate. */
  sells: number[];
  currency: string;
  withCommon: boolean;
  /** Review a draft first (step 4). */
  onDraftQuote: () => void;
  /** Create the quote and go to send (step 5). */
  onNewQuote: () => void;
}) {
  const fmt = (n: number) => n.toLocaleString('en-US');
  const lo = Math.min(...sells);
  const hi = Math.max(...sells);
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line-strong bg-subtle px-5 py-3 shadow-[0_-6px_12px_-8px_rgba(0,0,0,0.6)]">
      <span className="text-[12px] text-muted">
        <span className="text-ink">
          {count} rate{count === 1 ? '' : 's'}
        </span>
        {count > 0 && (
          <>
            {' '}
            · all-in sell {currency} {lo === hi ? fmt(lo) : `${fmt(lo)} – ${fmt(hi)}`}
            {withCommon && <span className="text-faint"> · incl. common charges</span>}
          </>
        )}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onDraftQuote} disabled={count === 0}>
          <FileText size={14} /> Create draft quote
        </Button>
        <Button onClick={onNewQuote} disabled={count === 0} className="bg-success text-canvas hover:bg-success/90">
          <Plus size={14} /> Create new quote
        </Button>
      </div>
    </div>
  );
}

/** Step 4 footer — quote summary + Send quote, pinned to the bottom of the page. */
function SendFooter({ summary, valid, onSend }: { summary: React.ReactNode; valid: boolean; onSend: () => void }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line-strong bg-subtle px-5 py-3 shadow-[0_-6px_12px_-8px_rgba(0,0,0,0.6)]">
      <span className="text-[12px] text-muted">{summary}</span>
      <Button onClick={onSend} disabled={!valid} className="bg-success text-canvas hover:bg-success/90">
        <SendHorizontal size={14} /> Send quote
      </Button>
    </div>
  );
}

/* ── Steps 2–5 ─────────────────────────────────────────────────────────────── */

function StepBody({
  index,
  selected,
  onToggle,
  lines,
  pricingLevel,
  recap,
  onClearSelection,
  onViewSearch,
  onCreateQuote,
  legsFor,
  effective,
  chargeOpsFor,
  onAskAtlas,
  common,
  canExtractCommon,
  onExtractCommon,
  onRestoreCommon,
  commonOps,
  quote,
  sent,
}: {
  index: number;
  selected: string[];
  onToggle: (carrier: string) => void;
  /** Searched equipment (step 1 load) — drives the price columns and ocean cost. */
  lines: SearchLine[];
  pricingLevel: PricingLevel;
  /** Search recap for the results header (lane, date, cargo, currency…). */
  recap: SearchRecap;
  onClearSelection: () => void;
  onViewSearch: () => void;
  onCreateQuote: () => void;
  /** Current (possibly edited) charges for a rate. */
  legsFor: (r: RateCard) => LegCharges[];
  /** Rate with its ocean-freight prices taken from the edited charges. */
  effective: (r: RateCard) => RateCard;
  chargeOpsFor: (rateId: string) => ChargeOps;
  /** Open the agent panel scoped to one rate, or to all selected rates (null). */
  onAskAtlas: (r: RateCard | null) => void;
  /** Extracted common charges (step 3), or null. */
  common: CommonExtraction | null;
  /** Whether the selected rates share any identical charge (enables Extract). */
  canExtractCommon: boolean;
  onExtractCommon: () => void;
  onRestoreCommon: () => void;
  commonOps: ChargeOps;
  /** Step 5 — what was sent and the search behind it. */
  sent: {
    quote: { fileName: string; to: string[]; contact: string; start: string; expiry: string; today: string };
    searchFacts: { label: string; value: string }[];
  };
  /** Step 4 — draft quote: PDF file name + validity dates. */
  quote: { fileName: string; start: string; expiry: string; onStart: (v: string) => void; onExpiry: (v: string) => void };
}) {
  // Step 3's sticky header condenses once scrolled (step 2 handles its own in SearchResults).
  const [sentinelRef, stuck] = useStuck();

  // Step 2 — multi-select rate cards.
  if (index === 1) {
    return (
      <div className="space-y-3">
        <SearchResults
          rates={rateCards}
          recap={recap}
          lines={lines}
          pricingLevel={pricingLevel}
          selected={selected}
          onToggle={onToggle}
          onClearSelection={onClearSelection}
          onViewSearch={onViewSearch}
          onCreateQuote={onCreateQuote}
        />

        <Reasoning>
          {selected.length === 0 ? (
            <>No carrier selected — pick at least one to include in the quote.</>
          ) : selected.length === 1 && selected[0] === 'Maersk' ? (
            <>
              Atlas picked <strong className="text-ink">Maersk · FAK</strong> — best balance of transit time and price.
              Select more carriers to compare them in Finalize pricing.
            </>
          ) : (
            <>
              You’ve shortlisted <strong className="text-ink">{selected.length} carriers</strong> — all are carried into
              Finalize pricing to compare side by side.
            </>
          )}
        </Reasoning>
      </div>
    );
  }

  // Step 3 — Finalize pricing: the selected rate cards, expanded with editable charges.
  if (index === 2) {
    const chosen = rateCards.filter((r) => selected.includes(r.carrier));
    if (chosen.length === 0) {
      return <div className="text-[14px] text-muted">No carrier selected — go back to Select results and pick at least one.</div>;
    }
    return (
      <div className="space-y-4">
        {/* Pinned search recap + equipment columns, aligned with the cards' prices; condenses once scrolled */}
        <div ref={sentinelRef} aria-hidden className="h-px" />
        <StickyHeader>
          <RecapRow recap={recap} lines={lines} onViewSearch={onViewSearch} compact={stuck} />
          <div className="px-5 py-1.5">
            <PriceHeader
              currency={recap.currency}
              lines={lines}
              left={`${chosen.length} selected rate${chosen.length === 1 ? '' : 's'} · Carrier · schedule`}
            />
          </div>
        </StickyHeader>

        {chosen.map((r) => (
          <RateResultCard
            key={r.rateId}
            rate={effective(r)}
            lines={lines}
            pricingLevel={pricingLevel}
            selected
            onToggle={() => onToggle(r.carrier)}
            bls={recap.bls}
            legs={legsFor(r)}
            chargeOps={chargeOpsFor(r.rateId)}
            defaultExpanded
            onAskAtlas={() => onAskAtlas(r)}
          />
        ))}

        {/* Always visible below the cards; disabled (with a reason) when it can't apply. */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-line px-3 py-2">
          <span className="text-[12px] text-faint">
            {common
              ? 'Common charges are shown below — restore them from that table.'
              : chosen.length < 2
                ? 'Select two or more rates to extract the charges they share.'
                : canExtractCommon
                  ? 'Pull charges that are identical on every selected rate into one table.'
                  : 'No charge is identical across the selected rates.'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onExtractCommon}
            disabled={!canExtractCommon}
            className="border-atlas/50 text-atlas hover:bg-atlas/10"
          >
            {common ? <Check size={14} /> : <Layers size={14} />}
            {common ? 'Common charges extracted' : 'Extract common charges'}
          </Button>
        </div>

        {common && (
          <CommonChargesCard
            legs={common.legs}
            lines={lines}
            bls={recap.bls}
            currency={recap.currency}
            rateCount={Object.keys(Object.values(common.origin)[0] ?? {}).length}
            ops={commonOps}
            onRestore={onRestoreCommon}
          />
        )}

      </div>
    );
  }

  // Step 4 — Draft quote: PDF preview, PDF configuration, validity (email draft is in the left pane).
  if (index === 3) {
    return (
      <QuoteDraftStep
        fileName={quote.fileName}
        start={quote.start}
        expiry={quote.expiry}
        onStart={quote.onStart}
        onExpiry={quote.onExpiry}
      />
    );
  }

  // Step 5 — Quote sent: summary, search parameters, quoted rates and next action.
  return (
    <QuoteSentSummary
      quote={sent.quote}
      searchFacts={sent.searchFacts}
      rates={rateCards.filter((r) => selected.includes(r.carrier)).map(effective)}
      legsFor={legsFor}
      common={common?.legs ?? null}
      lines={lines}
      bls={recap.bls}
      currency={recap.currency}
      pricingLevel={pricingLevel}
    />
  );
}

/* ── Resizable left pane ───────────────────────────────────────────────────── */

/** Left pane bounds, as % of the tab width. Min = 2 of the stepper's 5 columns. */
const LEFT_MIN = 40;
const LEFT_MAX = 70;
const clampLeft = (pct: number) => Math.min(LEFT_MAX, Math.max(LEFT_MIN, pct));

/** Left pane with a drag handle on its right edge (arrow keys also resize). */
function ResizablePane({
  width,
  onResize,
  children,
}: {
  width: number;
  onResize: (pct: number) => void;
  children: React.ReactNode;
}) {
  const paneRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e: React.PointerEvent) => {
    const container = paneRef.current?.parentElement;
    if (!container) return;
    e.preventDefault();
    const { left, width: total } = container.getBoundingClientRect();
    setDragging(true);
    const onMove = (ev: PointerEvent) => onResize(clampLeft(((ev.clientX - left) / total) * 100));
    const onUp = () => {
      setDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div ref={paneRef} className="relative flex shrink-0 flex-col border-r border-line" style={{ width: `${width}%` }}>
      {children}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize left pane"
        aria-valuenow={Math.round(width)}
        aria-valuemin={LEFT_MIN}
        aria-valuemax={LEFT_MAX}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onDoubleClick={() => onResize(LEFT_MIN)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') onResize(clampLeft(width - 2));
          if (e.key === 'ArrowRight') onResize(clampLeft(width + 2));
        }}
        className="group absolute inset-y-0 -right-1.5 z-10 w-3 cursor-col-resize outline-none"
      >
        <span
          className={cn(
            'absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors group-hover:bg-line-strong group-focus-visible:bg-line-strong',
            dragging && 'bg-ink group-hover:bg-ink',
          )}
        />
      </div>
      {/* Keeps the cursor + stops text selection across the page while dragging. */}
      {dragging && <div className="fixed inset-0 z-50 cursor-col-resize select-none" />}
    </div>
  );
}

/* ── Tab ───────────────────────────────────────────────────────────────────── */

export function EnquiryTab() {
  const firstOpen = steps.findIndex((s) => s.status !== 'done');
  const [active, setActive] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [emailOpen, setEmailOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState(LEFT_MIN);
  const [selectedCarriers, setSelectedCarriers] = useState<string[]>(['Maersk']);
  // Step 3 edits — per rate, the (edited) leg charges. Ref keeps Atlas handlers on the latest copy.
  const [edited, setEdited] = useState<Record<string, LegCharges[]>>({});
  const editedRef = useRef(edited);
  useEffect(() => {
    editedRef.current = edited;
  }, [edited]);
  const { askAtlas } = useAgent();
  const [params, setParams] = useState<SearchParams>({
    origin: {
      mode: 'door',
      door: doorLocations[0],
      port: portByCode(deal.tradeLane.origin),
      nearby: [],
      localCharges: true,
    },
    destination: { mode: 'cy', door: null, port: portByCode(deal.tradeLane.destination), nearby: [], localCharges: false },
    customer: contacts.find((c) => c.email === deal.contact.email) ?? null,
    valueAddedServices: ['export-customs', 'insurance'],
    salesPerson: 'Varun Reddy',
    currency: 'USD',
    platforms: ['contract'],
    onlineCarriers: ['maersk', 'hapag'],
    cutoff: '2026-11-02',
    incoterm: 'FCA — Free Carrier',
    pricingLevel: 'sell',
    load: {
      mode: 'FCL',
      // Sample with all four equipment types (the max) to show multi-column pricing.
      containers: [
        { id: 'cl1', type: "20'GP", qty: 2, weightKg: 18000 },
        { id: 'cl2', type: "40'GP", qty: 3, weightKg: 24000 },
        { id: 'cl3', type: "40'HC", qty: 9, weightKg: 22000 },
        { id: 'cl4', type: "45'HC", qty: 1, weightKg: 26000 },
      ],
      lcl: {
        method: 'total',
        total: { packages: 0, volumeCbm: 0, weightKg: 0 },
        units: [{ id: 'u1', qty: 1, l: 120, w: 100, h: 100, weightKg: 0 }],
        pallets: [{ id: 'p1', type: 'Euro 120×80', qty: 1, h: 150, weightKg: 0 }],
      },
      cargoType: 'General cargo',
      billsOfLading: 1,
    },
  });

  const legsFor = (r: RateCard) => edited[r.rateId] ?? chargeBreakdown(r);
  /** Card prices follow the edited ocean-freight line. */
  const effective = (r: RateCard): RateCard => {
    const of = legsFor(r).find((l) => l.key === 'ocean')?.charges.find((c) => c.id === 'ocean-0')?.perUnit; // first ocean line = ocean freight
    return of ? { ...r, prices: of } : r;
  };
  // Step 4 — quote validity (start today, 14 days by default).
  const [quoteStart, setQuoteStart] = useState(() => addDaysIso(new Date().toISOString().slice(0, 10), 0));
  const [quoteExpiry, setQuoteExpiry] = useState(() => addDaysIso(new Date().toISOString().slice(0, 10), 14));
  const quoteFile = `Quote #${deal.linked.quote.id}.pdf`;
  const fmtDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const quoteSells = () => {
    const commonSell = common
      ? allInOf(common.legs, params.load.containers, params.load.billsOfLading, params.currency).sell
      : 0;
    return chosenRates.map(
      (r) => allInOf(legsFor(r), params.load.containers, params.load.billsOfLading, params.currency).sell + commonSell,
    );
  };

  // Common charges pulled out of several rates (step 3).
  const [common, setCommon] = useState<CommonExtraction | null>(null);
  const chosenRates = rateCards.filter((r) => selectedCarriers.includes(r.carrier));
  const types = params.load.containers.map((l) => l.type);
  const legsByRate = () => Object.fromEntries(chosenRates.map((r) => [r.rateId, legsFor(r)]));
  const canExtractCommon = chosenRates.length > 1 && !common && extractCommon(legsByRate(), types) !== null;
  const onExtractCommon = () => {
    const res = extractCommon(legsByRate(), types);
    if (!res) return;
    setEdited((prev) => ({ ...prev, ...res.byRate }));
    setCommon(res.extraction);
  };
  const onRestoreCommon = () => {
    if (!common) return;
    const ids = Object.keys(Object.values(common.origin)[0] ?? {});
    const byRate = Object.fromEntries(
      ids.map((id) => [id, edited[id] ?? chargeBreakdown(rateCards.find((r) => r.rateId === id)!)]),
    );
    setEdited((prev) => ({ ...prev, ...restoreCommon(byRate, common) }));
    setCommon(null);
  };
  // Atlas's quote email for step 4 (built from the selected rates + validity).
  const quoteDraft: QuoteDraft | undefined = (() => {
    if (!chosenRates.length) return undefined;
    const sells = quoteSells();
    const cheapest = Math.min(...sells).toLocaleString('en-US');
    const equipment = params.load.containers.map((l) => `${l.qty}× ${l.type}`).join(', ');
    const pol = params.origin.port?.code ?? deal.tradeLane.origin;
    const pod = params.destination.port?.code ?? deal.tradeLane.destination;
    return {
      to: [params.customer?.email ?? deal.contact.email],
      cc: [],
      subject: `Quote ${deal.linked.quote.id} · ${pol} → ${pod}`,
      body: [
        `Hi ${(params.customer?.name ?? deal.contact.name).split(' ')[0]},`,
        `Thank you for the enquiry. Please find attached our quote for ${pol} → ${pod} (${equipment}), with ${chosenRates.length} carrier option${chosenRates.length === 1 ? '' : 's'} — all-in from ${params.currency} ${cheapest}.`,
        `The quote is valid from ${fmtDate(quoteStart)} to ${fmtDate(quoteExpiry)} and includes the charges listed per leg in the attachment.`,
        'Happy to walk through the options or hold space on your preferred sailing.',
        'Best regards,\nVarun',
      ].join('\n\n'),
      attachment: { label: quoteFile, meta: `PDF · ${chosenRates.length} option${chosenRates.length === 1 ? '' : 's'}` },
    };
  })();

  // Step 5 — search parameters as readable label / value pairs.
  const optionLabels = (groups: MultiSelectGroup[], values: string[]) => {
    const all = groups.flatMap((g) => g.options);
    return values.map((v) => all.find((o) => o.value === v)?.label ?? v).join(', ') || '—';
  };
  const legText = (leg: Leg) =>
    leg.mode === 'door'
      ? `${leg.door ? `${leg.door.name} ${leg.door.pincode}` : 'Door'} → ${leg.port?.code ?? '—'}`
      : `${leg.port ? `${leg.port.name} (${leg.port.code})` : '—'} · CY`;
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const sent = {
    quote: {
      fileName: quoteFile,
      to: quoteDraft?.to ?? [deal.contact.email],
      contact: params.customer?.name ?? deal.contact.name,
      start: quoteStart,
      expiry: quoteExpiry,
      today,
    },
    searchFacts: [
      { label: 'Customer', value: params.customer ? `${params.customer.name} · ${params.customer.company}` : '—' },
      { label: 'Mode', value: params.load.mode },
      { label: 'Origin', value: legText(params.origin) },
      { label: 'Destination', value: legText(params.destination) },
      { label: 'Equipment', value: params.load.containers.map((l) => `${l.qty}× ${l.type}`).join(', ') },
      { label: 'Cargo type', value: params.load.cargoType },
      { label: 'Incoterm', value: params.incoterm.split(' — ')[0] },
      { label: 'Cut-off date', value: fmtDate(params.cutoff) },
      { label: 'No. of B/Ls', value: String(params.load.billsOfLading) },
      { label: 'Platform', value: optionLabels(platformGroups, params.platforms) },
      { label: 'Online carriers', value: optionLabels(onlineCarrierGroups, params.onlineCarriers) },
      { label: 'Value added services', value: optionLabels(valueAddedServiceGroups, params.valueAddedServices) },
      { label: 'Pricing level', value: params.pricingLevel === 'both' ? 'Buy & sell' : params.pricingLevel === 'buy' ? 'Buy' : 'Sell' },
      { label: 'Sales person', value: params.salesPerson },
      { label: 'Currency', value: params.currency },
    ],
  };

  const commonOps: ChargeOps = {
    replace: (legKey, id, next) => setCommon((c) => c && { ...c, legs: replaceCharge(c.legs, legKey, id, next) }),
    add: (legKey, charge) => setCommon((c) => c && { ...c, legs: addCharge(c.legs, legKey, charge) }),
    remove: (legKey, id) => setCommon((c) => c && { ...c, legs: removeCharge(c.legs, legKey, id) }),
  };

  /** Edit operations for one rate's charges — each applies to its (edited) copy. */
  const chargeOpsFor = (rateId: string): ChargeOps => {
    const r = rateCards.find((x) => x.rateId === rateId)!;
    const mutate = (fn: (legs: LegCharges[]) => LegCharges[]) =>
      setEdited((prev) => ({ ...prev, [rateId]: fn(prev[rateId] ?? chargeBreakdown(r)) }));
    return {
      replace: (legKey, id, next) => mutate((l) => replaceCharge(l, legKey, id, next)),
      add: (legKey, charge) => mutate((l) => addCharge(l, legKey, charge)),
      remove: (legKey, id) => mutate((l) => removeCharge(l, legKey, id)),
    };
  };
  /** Scope the agent panel to one rate (or every selected rate) and open it. */
  const askAtlasFor = (target: RateCard | null) => {
    const targets = target ? [target] : rateCards.filter((r) => selectedCarriers.includes(r.carrier));
    askAtlas({
      label: target ? `Editing ${target.carrier} · ${target.rateId}` : `Editing ${targets.length} selected rates`,
      hint: 'I can change sell (or buy) charges and recalculate the totals.',
      suggestions: ['Apply 12% margin', 'Add 150 to destination THC', 'Waive seal fee', 'Reduce ocean freight by 200'],
      handle: (text) => {
        let summary: string | null = null;
        const next = { ...editedRef.current };
        for (const r of targets) {
          const res = runChargeCommand(next[r.rateId] ?? chargeBreakdown(r), text);
          if (res) {
            next[r.rateId] = res.legs;
            summary = res.summary;
          }
        }
        if (!summary) return null;
        setEdited(next);
        return targets.length > 1 ? `${summary} (${targets.length} rates)` : summary;
      },
    });
  };

  const toggleCarrier = (c: string) =>
    setSelectedCarriers((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  // Left pane: email on steps 1, 4 (with Atlas's quote draft) & 5.
  const leftMode: 'email' | null = active === 0 || active === 3 || active === 4 ? 'email' : null;

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Stepper — equal-width bordered steps; connectors sit in the gaps between them. */}
      {/* Stepper + step actions — the stepper doubles as the step title (no separate heading). Expand lives in the tab bar. */}
      <div className="flex items-center gap-3 border-b border-line px-5 py-3">
        <ol className="flex min-w-0 flex-1 items-center">
          {steps.map((m, i) => {
            const done = m.status === 'done';
            const on = i === active;
            const Icon = m.icon;
            return (
              <Fragment key={m.label}>
                <li className="min-w-0 flex-1 basis-0">
                  <button
                    onClick={() => setActive(i)}
                    aria-current={on ? 'step' : undefined}
                    className={cn(
                      'flex w-full min-w-0 items-center justify-center gap-2 rounded-lg border px-3 py-2 transition-colors',
                      on ? 'border-line-strong bg-subtle' : 'border-line hover:border-line-strong hover:bg-subtle/60',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-6 shrink-0 place-items-center rounded-full border',
                        done ? 'border-atlas/50 text-atlas' : on ? 'border-ink text-ink' : 'border-line-strong text-faint',
                      )}
                    >
                      {done ? <Check size={13} strokeWidth={3} /> : <Icon size={13} />}
                    </span>
                    <span className={cn('truncate text-[12px] font-semibold', on ? 'text-ink' : 'text-muted')}>
                      {m.label}
                    </span>
                  </button>
                </li>
                {/* Connector — fills the gap between two step borders, never overlapping them. */}
                {i < steps.length - 1 && (
                  <li aria-hidden className={cn('mx-1.5 h-px w-6 shrink-0', done ? 'bg-atlas/50' : 'bg-line')} />
                )}
              </Fragment>
            );
          })}
        </ol>
        <div className="flex shrink-0 items-center gap-2">
          {/* Step 3 — opens the agent panel scoped to every selected rate. */}
          {active === 2 && (
            <Button size="sm" onClick={() => askAtlasFor(null)} className="bg-atlas text-canvas hover:bg-atlas/90">
              <Sparkles size={14} /> Edit with Atlas
            </Button>
          )}
        </div>
      </div>

      {/* Two-pane body */}
      <div className="flex min-h-0 flex-1">
        {leftMode === 'email' &&
          (emailOpen ? (
            <ResizablePane width={leftWidth} onResize={setLeftWidth}>
              <div className="flex items-center justify-between border-b border-line px-4 py-2">
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                  <Mail size={13} /> Email thread
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setEmailOpen(false)}
                  aria-label="Collapse email thread"
                >
                  <PanelLeftClose size={16} />
                </Button>
              </div>
              <div className="min-h-0 flex-1">
                <EmailThread
                  quoteDraft={active === 3 ? quoteDraft : undefined}
                  onSendQuote={() => setActive(4)}
                />
              </div>
            </ResizablePane>
          ) : (
            <button
              onClick={() => setEmailOpen(true)}
              aria-label="Expand email thread"
              className="flex w-11 shrink-0 flex-col items-center gap-3 border-r border-line py-3 text-muted hover:bg-subtle"
            >
              <span className="grid size-7 place-items-center rounded-md">
                <PanelLeftOpen size={16} />
              </span>
              <Mail size={16} />
              <span className="text-[10px] font-semibold tracking-wide [writing-mode:vertical-rl]">
                Email thread
              </span>
            </button>
          ))}

        <div className="flex min-h-0 flex-1 flex-col">
          {/* No top padding on the scroller (a spacer scrolls away instead) so sticky headers sit flush at the top. */}
          <div className="flex-1 overflow-y-auto px-5 pb-5">
            <div aria-hidden className="h-4" />
            {active === 0 ? (
              <SearchForm params={params} onChange={setParams} onSearch={() => setActive(1)} />
            ) : (
              <StepBody
                index={active}
                selected={selectedCarriers}
                onToggle={toggleCarrier}
                legsFor={legsFor}
                effective={effective}
                chargeOpsFor={chargeOpsFor}
                common={common}
                canExtractCommon={canExtractCommon}
                onExtractCommon={onExtractCommon}
                onRestoreCommon={onRestoreCommon}
                commonOps={commonOps}
                quote={{ fileName: quoteFile, start: quoteStart, expiry: quoteExpiry, onStart: setQuoteStart, onExpiry: setQuoteExpiry }}
                sent={sent}
                onAskAtlas={askAtlasFor}
                lines={params.load.containers}
                pricingLevel={params.pricingLevel}
                recap={{
                  mode: params.load.mode,
                  pol: params.origin.port,
                  pod: params.destination.port,
                  cutoff: params.cutoff,
                  cargoType: params.load.cargoType,
                  customer: params.customer?.company,
                  bls: params.load.billsOfLading,
                  currency: params.currency,
                }}
                onClearSelection={() => setSelectedCarriers([])}
                onViewSearch={() => setActive(0)}
                onCreateQuote={() => setActive(2)}
              />
            )}
          </div>

          {/* Step 3 footer — outside the scroller, so it always sits at the bottom of the page */}
          {active === 2 && (
            <QuoteFooter
              count={chosenRates.length}
              sells={quoteSells()}
              currency={params.currency}
              withCommon={!!common}
              onDraftQuote={() => setActive(3)}
              onNewQuote={() => setActive(4)}
            />
          )}

          {/* Step 4 footer — send the quote */}
          {active === 3 && (
            <SendFooter
              valid={chosenRates.length > 0 && quoteExpiry > quoteStart}
              summary={
                <>
                  <span className="text-ink">{quoteFile}</span> · {chosenRates.length} option
                  {chosenRates.length === 1 ? '' : 's'} · valid {fmtDate(quoteStart)} – {fmtDate(quoteExpiry)}
                </>
              }
              onSend={() => setActive(4)}
            />
          )}
        </div>
      </div>

    </div>
  );
}
