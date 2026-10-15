import { useState } from 'react';
import {
  Check,
  Search,
  ListChecks,
  Receipt,
  FileText,
  SendHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Mail,
  Plus,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { deal } from '../data/deal';
import { EmailThread } from './EmailThread';

/* ── The enquiry run (would come from the agent run in production) ─────────── */

type StepStatus = 'done' | 'current' | 'pending';

const steps: { label: string; icon: LucideIcon; sub: string; detail: string; status: StepStatus }[] = [
  { label: 'Search rates', icon: Search, sub: 'Query live carrier rates', detail: 'Parameters Atlas used to query carrier rates', status: 'done' },
  { label: 'Select results', icon: ListChecks, sub: 'Shortlist rate cards', detail: 'Pick one or more carriers to carry into the quote', status: 'done' },
  { label: 'Finalize pricing', icon: Receipt, sub: 'Edit charges · add margin', detail: 'All selected options — adjust charges and margin on the left', status: 'done' },
  { label: 'Draft quote', icon: FileText, sub: 'Generate the quote PDF', detail: 'Generated Quote #Q-0142.pdf', status: 'done' },
  { label: 'Send quote', icon: SendHorizontal, sub: 'Email the customer', detail: 'Auto-sent after the preview window closed', status: 'done' },
];

interface RateCard {
  carrier: string;
  service: string;
  route: string;
  transit: string;
  validUntil: string;
  /** Carrier-specific ocean portion, split per equipment type. */
  equipment: { type: string; qty: number; subtotal: number }[];
}

const route = 'INNSA → DEHAM · Nhava Sheva → Hamburg';

const rateCards: RateCard[] = [
  { carrier: 'Maersk', service: 'FAK', route, transit: '28 days', validUntil: '31 Dec 2026', equipment: [{ type: "40'HC", qty: 9, subtotal: 82800 }] },
  { carrier: 'MSC', service: 'FAK', route, transit: '31 days', validUntil: '31 Dec 2026', equipment: [{ type: "40'HC", qty: 9, subtotal: 81000 }] },
  { carrier: 'CMA CGM', service: 'FAK', route, transit: '30 days', validUntil: '28 Dec 2026', equipment: [{ type: "40'HC", qty: 9, subtotal: 84300 }] },
  { carrier: 'Hapag-Lloyd', service: 'FAK', route, transit: '29 days', validUntil: '31 Dec 2026', equipment: [{ type: "40'HC", qty: 9, subtotal: 84900 }] },
  { carrier: 'ONE', service: 'FAK', route, transit: '33 days', validUntil: '24 Dec 2026', equipment: [{ type: "40'HC", qty: 9, subtotal: 80600 }] },
];

interface Charge {
  id: string;
  label: string;
  value: number;
}

const initialCharges: Charge[] = [
  { id: 'baf', label: 'Bunker / currency adj (BAF/CAF)', value: 3300 },
  { id: 'thco', label: 'THC — origin (INNSA)', value: 4050 },
  { id: 'thcd', label: 'THC — destination (DEHAM)', value: 5400 },
  { id: 'doc', label: 'Documentation & B/L', value: 450 },
];

const usd = (n: number) => `$${n.toLocaleString('en-US')}`;

const oceanOf = (c: RateCard) => c.equipment.reduce((a, e) => a + e.subtotal, 0);
const costOf = (c: RateCard, charges: Charge[]) => oceanOf(c) + charges.reduce((a, ch) => a + ch.value, 0);
const sellOf = (c: RateCard, charges: Charge[], margin: number) =>
  Math.round(costOf(c, charges) * (1 + margin / 100));

const carriers = ['All carriers', 'Maersk', 'MSC', 'CMA CGM', 'Hapag-Lloyd', 'ONE'];
const equipmentTypes = ["40'HC ×9", "40'HC ×1", "40'GP", "20'GP", "40'RF"];

/* ── Form primitives ───────────────────────────────────────────────────────── */

const labelCls = 't-label text-muted';
const inputCls =
  'rounded-lg border border-line bg-canvas px-3 py-2 text-[14px] text-ink outline-none focus:border-line-strong';

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className={labelCls}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={labelCls}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

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
  origin: string;
  destination: string;
  carrier: string;
  equipment: string;
  mode: string;
  sailing: string;
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
  const set = (k: keyof SearchParams) => (v: string) => onChange({ ...params, [k]: v });
  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField label="Origin" value={params.origin} onChange={set('origin')} />
        <TextField label="Destination" value={params.destination} onChange={set('destination')} />
        <SelectField label="Carrier" value={params.carrier} onChange={set('carrier')} options={carriers} />
        <SelectField label="Equipment type" value={params.equipment} onChange={set('equipment')} options={equipmentTypes} />
        <SelectField label="Mode" value={params.mode} onChange={set('mode')} options={['FCL', 'LCL']} />
        <TextField label="Target sailing" value={params.sailing} onChange={set('sailing')} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={onSearch}
          className="flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[14px] font-semibold text-canvas hover:bg-ink/90"
        >
          <Search size={15} />
          Search rates
        </button>
        <span className="text-[12px] text-faint">Queries live carrier APIs for matching rates</span>
      </div>
      <Reasoning>
        Atlas ran this search across carriers and returned <strong className="text-ink">12 rates</strong> for the lane
        and equipment. Adjust any parameter and re-run to refresh the shortlist.
      </Reasoning>
    </div>
  );
}

/* ── Quote Assistant (left pane on Finalize pricing) ───────────────────────── */

function QuoteAssistant({
  charges,
  setCharges,
  margin,
  setMargin,
}: {
  charges: Charge[];
  setCharges: React.Dispatch<React.SetStateAction<Charge[]>>;
  margin: number;
  setMargin: (m: number) => void;
}) {
  const update = (id: string, patch: Partial<Charge>) =>
    setCharges((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id: string) => setCharges((cs) => cs.filter((c) => c.id !== id));
  const add = () => setCharges((cs) => [...cs, { id: `c${Date.now()}`, label: 'New charge', value: 0 }]);

  return (
    <div className="flex h-full w-[40%] min-w-[340px] shrink-0 flex-col border-r border-line">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="grid size-7 place-items-center rounded-lg border border-atlas/40 text-atlas">
          <Sparkles size={15} />
        </span>
        <div>
          <h3 className="text-[14px] font-semibold text-ink">Quote Assistant</h3>
          <p className="text-[10px] text-faint">Edit charges & add margin — applies to every option</p>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        {/* Margin */}
        <section>
          <div className={labelCls}>Margin</div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-line bg-canvas focus-within:border-line-strong">
              <input
                type="number"
                value={margin}
                onChange={(e) => setMargin(Math.max(0, Number(e.target.value) || 0))}
                className="w-16 bg-transparent px-3 py-2 text-[14px] text-ink outline-none"
              />
              <span className="pr-3 text-[14px] text-faint">%</span>
            </div>
            <div className="flex gap-1">
              {[0, 10, 12, 15].map((m) => (
                <button
                  key={m}
                  onClick={() => setMargin(m)}
                  className={`rounded-md border px-2 py-1 text-[12px] font-medium ${
                    margin === m ? 'border-atlas/50 text-atlas' : 'border-line text-muted hover:bg-subtle'
                  }`}
                >
                  {m}%
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1.5 text-[10px] text-faint">Marked up on the cost price of each selected option.</p>
        </section>

        {/* Charges */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <span className={labelCls}>Charges</span>
            <button
              onClick={add}
              className="flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[12px] font-medium text-ink hover:bg-subtle"
            >
              <Plus size={13} /> Add
            </button>
          </div>
          <div className="space-y-2">
            {charges.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <input
                  value={c.label}
                  onChange={(e) => update(c.id, { label: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-line-strong"
                />
                <div className="flex w-24 items-center rounded-lg border border-line bg-canvas focus-within:border-line-strong">
                  <span className="pl-2 text-[12px] text-faint">$</span>
                  <input
                    type="number"
                    value={c.value}
                    onChange={(e) => update(c.id, { value: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full bg-transparent px-1.5 py-1.5 text-[12px] text-ink outline-none"
                  />
                </div>
                <button
                  onClick={() => remove(c.id)}
                  aria-label="Remove charge"
                  className="grid size-7 shrink-0 place-items-center rounded-md text-faint hover:bg-subtle hover:text-danger"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-faint">
            Charges are added on top of each carrier’s ocean rate. All cargo is FCL — no LCL lines.
          </p>
        </section>
      </div>
    </div>
  );
}

/* ── Steps 2–5 ─────────────────────────────────────────────────────────────── */

function StepBody({
  index,
  selected,
  onToggle,
  charges,
  margin,
}: {
  index: number;
  selected: string[];
  onToggle: (carrier: string) => void;
  charges: Charge[];
  margin: number;
}) {
  const chargesTotal = charges.reduce((a, c) => a + c.value, 0);
  const primary = rateCards.find((r) => selected.includes(r.carrier)) ?? rateCards[0];

  // Step 2 — multi-select rate cards.
  if (index === 1) {
    return (
      <div className="space-y-3">
        <span className="text-[12px] text-faint">
          {selected.length} of {rateCards.length} selected · tap to toggle (multi-select)
        </span>

        {rateCards.map((r) => {
          const on = selected.includes(r.carrier);
          const ocean = oceanOf(r);
          return (
            <button
              key={r.carrier}
              onClick={() => onToggle(r.carrier)}
              aria-pressed={on}
              className={`w-full rounded-xl border p-4 text-left transition-colors ${
                on ? 'border-atlas/50 bg-atlas-bg/15' : 'border-line hover:bg-subtle/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${
                      on ? 'border-atlas bg-atlas/15 text-atlas' : 'border-line-strong text-transparent'
                    }`}
                  >
                    <Check size={13} strokeWidth={3} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-ink">{r.carrier} · {r.service}</span>
                      {r.carrier === 'Maersk' && (
                        <span className="rounded-full border border-atlas/40 px-2 py-0.5 text-[10px] font-semibold text-atlas">
                          Atlas pick
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted">{r.route}</div>
                    <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-[12px]">
                      <span className="text-faint">Transit <span className="font-medium text-ink">{r.transit}</span></span>
                      <span className="text-faint">Valid until <span className="font-medium text-ink">{r.validUntil}</span></span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[16px] font-bold text-ink">{usd(ocean + chargesTotal)}</div>
                  <div className="text-[10px] text-faint">all-in cost</div>
                </div>
              </div>

              {/* Equipment-wise rate split */}
              <div className="mt-3 overflow-hidden rounded-lg border border-line bg-canvas">
                <div className="border-b border-line px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-faint">
                  Equipment-wise rate
                </div>
                {r.equipment.map((e) => (
                  <div key={e.type} className="flex items-center justify-between px-3 py-1.5 text-[12px]">
                    <span className="text-muted">{e.type} × {e.qty}</span>
                    <span className="text-ink">
                      {usd(Math.round(e.subtotal / e.qty))} <span className="text-faint">/unit</span> · {usd(e.subtotal)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-line px-3 py-1.5 text-[12px]">
                  <span className="text-muted">Surcharges (THC · BAF · docs)</span>
                  <span className="text-ink">{usd(chargesTotal)}</span>
                </div>
              </div>
            </button>
          );
        })}

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

  // Step 3 — Finalize pricing: every selected option, cost → margin → sell.
  if (index === 2) {
    const chosen = rateCards.filter((r) => selected.includes(r.carrier));
    if (chosen.length === 0) {
      return <div className="text-[14px] text-muted">No carrier selected — go back to Select results and pick at least one.</div>;
    }
    return (
      <div className="space-y-4">
        {chosen.map((c, i) => {
          const ocean = oceanOf(c);
          const cost = costOf(c, charges);
          const sell = sellOf(c, charges, margin);
          const marginAmt = sell - cost;
          const isPrimary = i === 0;
          return (
            <div
              key={c.carrier}
              className={`overflow-hidden rounded-xl border ${isPrimary ? 'border-atlas/50' : 'border-line'}`}
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-ink">{c.carrier} · {c.service}</span>
                  {isPrimary && (
                    <span className="rounded-full border border-atlas/40 px-2 py-0.5 text-[10px] font-semibold text-atlas">
                      Primary
                    </span>
                  )}
                  <span className="text-[12px] text-faint">· {c.transit} · valid {c.validUntil}</span>
                </div>
                <div className="text-right">
                  <div className="text-[16px] font-bold text-ink">{usd(sell)}</div>
                  <div className="text-[10px] text-faint">sell price</div>
                </div>
              </div>
              <div className="px-4 py-1">
                <div className="flex items-center justify-between py-1.5 text-[14px]">
                  <span className="text-muted">Ocean freight ({c.equipment.map((e) => `${e.type} ×${e.qty}`).join(', ')})</span>
                  <span className="text-ink">{usd(ocean)}</span>
                </div>
                {charges.map((ch) => (
                  <div key={ch.id} className="flex items-center justify-between py-1.5 text-[14px]">
                    <span className="text-muted">{ch.label}</span>
                    <span className="text-ink">{usd(ch.value)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-line py-1.5 text-[14px]">
                  <span className="font-medium text-ink">Cost subtotal</span>
                  <span className="font-medium text-ink">{usd(cost)}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 text-[14px]">
                  <span className="text-muted">Margin ({margin}%)</span>
                  <span className={margin > 0 ? 'text-atlas' : 'text-faint'}>+{usd(marginAmt)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-line bg-subtle/40 px-4 py-2.5">
                <span className="text-[14px] font-semibold text-ink">Sell price · 14-day validity</span>
                <span className="text-[16px] font-bold text-ink">{usd(sell)}</span>
              </div>
            </div>
          );
        })}
        <Reasoning>
          Charges and margin are set in the <strong className="text-ink">Quote Assistant</strong> on the left and apply
          to all {chosen.length > 1 ? `${chosen.length} options` : 'options'}. Current margin:{' '}
          <strong className="text-ink">{margin}%</strong>.
        </Reasoning>
      </div>
    );
  }

  // Step 4 — Draft quote.
  if (index === 3) {
    const sell = sellOf(primary, charges, margin);
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-line p-4">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">
            <FileText size={16} className="text-muted" /> Quote #{deal.linked.quote.id}.pdf
          </div>
          <dl className="mt-3 space-y-2 text-[14px]">
            <div className="flex justify-between"><dt className="text-faint">Prepared for</dt><dd className="text-ink">{deal.contact.name} · {deal.company}</dd></div>
            <div className="flex justify-between"><dt className="text-faint">Carrier</dt><dd className="text-ink">{primary.carrier} · {primary.service}{selected.length > 1 ? ` (+${selected.length - 1} option${selected.length > 2 ? 's' : ''})` : ''}</dd></div>
            <div className="flex justify-between"><dt className="text-faint">Trade lane</dt><dd className="text-ink">{deal.tradeLane.origin} → {deal.tradeLane.destination}</dd></div>
            <div className="flex justify-between"><dt className="text-faint">Valid until</dt><dd className="text-ink">31 Dec 2026</dd></div>
            <div className="flex justify-between"><dt className="text-faint">Total (incl. {margin}% margin)</dt><dd className="font-semibold text-ink">{usd(sell)}</dd></div>
          </dl>
        </div>
        <div className="rounded-lg border border-line p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-faint">Email draft</div>
          <p className="mt-2 text-[14px] leading-relaxed text-ink/90">
            Hi {deal.contact.name}, please find attached our all-in ocean freight quote for{' '}
            {deal.tradeLane.origin} → {deal.tradeLane.destination}, {deal.equipment}. Rate is valid for 14 days and
            includes THC at both ends.
          </p>
        </div>
      </div>
    );
  }

  // Step 5 — Send quote.
  return (
    <div className="rounded-lg border border-line p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">
          <SendHorizontal size={16} className="text-muted" /> {deal.linked.thread.subject}
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-success/40 px-2 py-0.5 text-[10px] font-medium text-success">
          <Check size={11} /> Sent · 4d ago
        </span>
      </div>
      <dl className="mt-3 space-y-2 text-[14px]">
        <div className="flex justify-between"><dt className="text-faint">To</dt><dd className="text-ink">{deal.contact.email}</dd></div>
        <div className="flex justify-between"><dt className="text-faint">Attachment</dt><dd className="text-ink">Quote #{deal.linked.quote.id}.pdf</dd></div>
        <div className="flex justify-between"><dt className="text-faint">Mode</dt><dd className="text-ink">Auto-sent after preview window</dd></div>
      </dl>
      <Reasoning>
        Delivered to the customer. In manual mode, this is the final approval gate before anything leaves your outbox.
      </Reasoning>
    </div>
  );
}

/* ── Tab ───────────────────────────────────────────────────────────────────── */

export function EnquiryTab() {
  const firstOpen = steps.findIndex((s) => s.status !== 'done');
  const [active, setActive] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [emailOpen, setEmailOpen] = useState(true);
  const [selectedCarriers, setSelectedCarriers] = useState<string[]>(['Maersk']);
  const [charges, setCharges] = useState<Charge[]>(initialCharges);
  const [margin, setMargin] = useState(0);
  const [params, setParams] = useState<SearchParams>({
    origin: `${deal.tradeLane.origin} · Nhava Sheva`,
    destination: `${deal.tradeLane.destination} · Hamburg`,
    carrier: 'All carriers',
    equipment: "40'HC ×9",
    mode: 'FCL',
    sailing: 'Early November 2026',
  });

  const toggleCarrier = (c: string) =>
    setSelectedCarriers((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const step = steps[active];
  const StepIcon = step.icon;
  // Left pane: email on steps 1 & 5, Quote Assistant on step 3 (finalize pricing).
  const leftMode: 'email' | 'assistant' | null =
    active === 2 ? 'assistant' : active === 0 || active === 4 ? 'email' : null;

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg border border-atlas/40 text-atlas">
            <Sparkles size={15} />
          </span>
          <div>
            <h2 className="text-[16px] font-semibold text-ink">Enquiry</h2>
            <p className="text-[12px] text-faint">The 5 steps Atlas ran to quote this enquiry · review or step in</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 border-b border-line px-5 py-3">
        {steps.map((m, i) => {
          const done = m.status === 'done';
          const on = i === active;
          const Icon = m.icon;
          return (
            <div key={m.label} className="flex flex-1 items-center gap-1">
              <button
                onClick={() => setActive(i)}
                className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors ${
                  on ? 'border-line-strong bg-subtle' : 'border-transparent hover:bg-subtle/60'
                }`}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full border bg-transparent ${
                    done ? 'border-atlas/50 text-atlas' : on ? 'border-ink text-ink' : 'border-line-strong text-faint'
                  }`}
                >
                  {done ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}
                </span>
                <span className="min-w-0">
                  <span className={`block truncate text-[12px] font-semibold ${on ? 'text-ink' : 'text-muted'}`}>
                    {m.label}
                  </span>
                  <span className="block truncate text-[10px] text-faint">{m.sub}</span>
                </span>
              </button>
              {i < steps.length - 1 && <span className="h-px w-3 shrink-0 bg-line" />}
            </div>
          );
        })}
      </div>

      {/* Two-pane body */}
      <div className="flex min-h-0 flex-1">
        {leftMode === 'assistant' && (
          <QuoteAssistant charges={charges} setCharges={setCharges} margin={margin} setMargin={setMargin} />
        )}

        {leftMode === 'email' &&
          (emailOpen ? (
            <div className="flex w-[38%] min-w-[320px] shrink-0 flex-col border-r border-line">
              <div className="flex items-center justify-between border-b border-line px-4 py-2">
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                  <Mail size={13} /> Email thread
                </span>
                <button
                  onClick={() => setEmailOpen(false)}
                  aria-label="Collapse email thread"
                  className="grid size-7 place-items-center rounded-md text-muted hover:bg-subtle"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <EmailThread />
              </div>
            </div>
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
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="mb-3 flex items-center gap-2">
              <StepIcon size={16} className="text-muted" />
              <h3 className="text-[16px] font-semibold text-ink">
                Step {active + 1} · {step.label}
              </h3>
              {step.status === 'done' && (
                <span className="inline-flex items-center gap-1 rounded-full border border-success/40 px-2 py-0.5 text-[10px] font-medium text-success">
                  <Check size={11} /> Completed
                </span>
              )}
            </div>
            <p className="mb-4 text-[14px] text-muted">{step.detail}</p>
            {active === 0 ? (
              <SearchForm params={params} onChange={setParams} onSearch={() => setActive(1)} />
            ) : (
              <StepBody
                index={active}
                selected={selectedCarriers}
                onToggle={toggleCarrier}
                charges={charges}
                margin={margin}
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer — human-in-the-loop controls */}
      <div className="flex items-center justify-between border-t border-line px-5 py-3">
        <span className="text-[12px] text-faint">Manual mode: approve each step before Atlas continues</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActive((i) => Math.max(0, i - 1))}
            disabled={active === 0}
            className="flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-[14px] font-medium text-ink hover:bg-subtle disabled:opacity-30"
          >
            <ChevronLeft size={15} /> Back
          </button>
          {active < steps.length - 1 ? (
            <button
              onClick={() => setActive((i) => Math.min(steps.length - 1, i + 1))}
              className="flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-[14px] font-semibold text-canvas hover:bg-ink/90"
            >
              Approve & continue <ChevronRight size={15} />
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-success/40 px-3 py-1.5 text-[14px] font-medium text-success">
              <Check size={14} /> Run complete
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
