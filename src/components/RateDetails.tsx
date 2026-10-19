import { Fragment, useState } from 'react';
import {
  Anchor,
  ArrowRightLeft,
  Layers,
  MessageSquare,
  MessageSquarePlus,
  Plus,
  Sailboat,
  Ship,
  TrainFront,
  Trash2,
  Truck,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import {
  allInOf,
  CURRENCIES,
  chargeBreakdown,
  fx,
  transitMin,
  unitSum,
  type ChargeLine,
  type LegCharges,
  type LegKey,
  type RateCard,
  type SearchLine,
} from '../data/rates';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hint } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const money = (n: number) => n.toLocaleString('en-US');

const legIcon: Record<LegCharges['mode'], LucideIcon> = {
  truck: Truck,
  rail: TrainFront,
  barge: Sailboat,
  port: Anchor,
  ocean: Ship,
};

/** Edit operations on a rate's charges (step 3). Charges are addressed by leg + id. */
export interface ChargeOps {
  replace: (legKey: LegKey, chargeId: string, next: ChargeLine) => void;
  add: (legKey: LegKey, charge: ChargeLine) => void;
  remove: (legKey: LegKey, chargeId: string) => void;
}

type Kind = 'buy' | 'sell';
const other = (k: Kind): Kind => (k === 'buy' ? 'sell' : 'buy');

/** Inline field — looks like plain text until hovered / focused. */
const inlineField =
  'h-6 w-full rounded-[4px] border border-transparent bg-transparent px-1 text-ink outline-none hover:border-line focus:border-line-strong focus:bg-canvas';

function AmountInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <input
      type="number"
      min={0}
      aria-label={label}
      value={value}
      onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      onClick={(e) => e.stopPropagation()}
      className={cn(inlineField, 'text-right tabular-nums')}
    />
  );
}

function InlineSelect<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      onClick={(e) => e.stopPropagation()}
      className={cn(inlineField, 'cursor-pointer text-muted')}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/** Small icon button for a charge row's actions. */
function RowAction({
  label,
  onClick,
  danger,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Hint label="Charge" value={label}>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={cn('size-6 rounded-[6px]', danger ? 'hover:text-danger' : 'hover:text-ink', active && 'text-atlas')}
      >
        {children}
      </Button>
    </Hint>
  );
}

const BASES = ['Per container', 'Per B/L'] as const;
const CALCS = ['Fixed', 'Per unit', '% of freight'] as const;

/** Switch a charge between per-container and per-B/L, carrying the amount across. */
function withBasis(c: ChargeLine, basis: ChargeLine['basis'], types: string[]): ChargeLine {
  if (basis === c.basis) return c;
  if (basis === 'Per B/L') {
    const first = Object.values(c.perUnit ?? {})[0] ?? { buy: 0, sell: 0 };
    return { ...c, basis, perUnit: undefined, perBl: { ...first } };
  }
  const amt = c.perBl ?? { buy: 0, sell: 0 };
  return { ...c, basis, perBl: undefined, perUnit: Object.fromEntries(types.map((t) => [t, { ...amt }])) };
}

/** Copy one level's amounts onto the other (buy → sell or sell → buy). */
function copyLevel(c: ChargeLine, from: Kind): ChargeLine {
  const to = other(from);
  if (c.perBl) return { ...c, perBl: { ...c.perBl, [to]: c.perBl[from] } };
  return {
    ...c,
    perUnit: Object.fromEntries(Object.entries(c.perUnit ?? {}).map(([t, a]) => [t, { ...a, [to]: a[from] }])),
  };
}

/** A blank per-container charge for a leg (zero for every searched equipment type). */
function newCharge(legKey: LegKey, types: string[]): ChargeLine {
  return {
    id: `${legKey}-new-${Date.now()}`,
    label: 'New charge',
    basis: 'Per container',
    calc: 'Per unit',
    perUnit: Object.fromEntries(types.map((t) => [t, { buy: 0, sell: 0 }])),
  };
}

/* ── Charges table (one level: buy or sell) ──────────────────────────────── */

const th = 'border-b border-line px-3 py-1.5 text-left text-[10px] font-normal text-faint';
const td = 'border-b border-line px-3 py-1';
const num = 'text-right tabular-nums';

/**
 * Charges for one level (buy or sell) as a real table. Columns: Charge name · Basis ·
 * Calc. type · one per-unit amount per equipment type (+ Actions when editable).
 * Each leg ends with Unit total (whole leg per unit, incl. per-B/L charges) and
 * Equipment total (unit total − per-B/L charges); quantities only in the last row.
 * Editable (`ops`): name / basis / calc / amounts inline, + Add charge per leg, and
 * per-row comment · copy buy↔sell · delete.
 */
function ChargeTable({
  legs,
  lines,
  bls,
  kind,
  currency,
  ops,
}: {
  legs: LegCharges[];
  lines: SearchLine[];
  bls: number;
  kind: Kind;
  currency: string;
  ops?: ChargeOps;
}) {
  const [commenting, setCommenting] = useState<string | null>(null);
  const editable = !!ops;
  const types = lines.map((l) => l.type);
  const all = legs.flatMap((l) => l.charges);
  // Columns: name · basis · calc · amounts… · currency (+ actions when editable).
  const fixed = 3;
  const span = fixed + lines.length + 1 + (editable ? 1 : 0);
  const total = allInOf(legs, lines, bls, currency);
  const profit = total.sell - total.buy;
  const unit = (v: number | undefined) => (v === undefined ? '—' : money(v));
  /** Non-equipment (per-B/L) charges in a set of charges. */
  const blSum = (charges: ChargeLine[]) =>
    charges.reduce((a, c) => a + fx(c.perBl?.[kind] ?? 0, c.currency ?? currency, currency), 0);
  /** Whole-leg amount per unit = equipment charges + non-equipment charges. */
  const unitTotal = (charges: ChargeLine[], t: string) => unitSum(charges, t, kind, currency) + blSum(charges);

  const subtotal = (label: string, values: (type: string, qty: number) => string, strong = false) => (
    <tr className={strong ? 'bg-subtle/40 text-ink' : 'text-muted'}>
      <td className={cn(td, 'pl-8 text-[10px]', strong ? 'text-ink' : 'text-faint')} colSpan={fixed}>
        {label}
      </td>
      {lines.map((l) => (
        <td key={l.type} className={cn(td, num)}>
          {values(l.type, l.qty)}
        </td>
      ))}
      <td className={cn(td, 'text-faint')}>{currency}</td>
      {editable && <td className={td} />}
    </tr>
  );

  return (
    <div className="overflow-x-auto">
      {/* Fixed column widths (name flexes, min 10rem); scrolls sideways when the pane is narrow. */}
      <table
        className="w-full table-fixed border-collapse text-[12px]"
        // Name ≥ 10rem + basis 7.5 + calc 6.5 + 6.5 per equipment + currency 5 (+ 5.5 actions).
        style={{ minWidth: `${10 + 7.5 + 6.5 + lines.length * 6.5 + 5 + (editable ? 5.5 : 0)}rem` }}
      >
        <colgroup>
          <col />
          <col style={{ width: '7.5rem' }} />
          <col style={{ width: '6.5rem' }} />
          {lines.map((l) => (
            <col key={l.type} style={{ width: '6.5rem' }} />
          ))}
          <col style={{ width: '5rem' }} />
          {editable && <col style={{ width: '5.5rem' }} />}
        </colgroup>
        <thead className="bg-subtle/40">
          <tr>
            <th className={th}>Charge name</th>
            <th className={th}>Basis</th>
            <th className={th}>Calc. type</th>
            {lines.map((l) => (
              <th key={l.type} className={cn(th, num)}>
                {l.type} / unit
              </th>
            ))}
            <th className={th}>Currency</th>
            {editable && <th className={cn(th, 'text-center')}>Actions</th>}
          </tr>
        </thead>

        {legs.map((leg) => {
          const Icon = legIcon[leg.mode];
          return (
            <tbody key={leg.key}>
              {/* Leg header — tinted band + accent bar so each leg reads as its own section */}
              <tr className="bg-brand/10">
                <td
                  className="border-y border-l-2 border-y-line-strong border-l-brand px-3 py-1.5 text-[12px] font-medium text-ink"
                  colSpan={span}
                >
                  <span className="flex items-center gap-2">
                    <span className="grid size-5 place-items-center rounded-[4px] bg-brand/20 text-brand">
                      <Icon size={12} />
                    </span>
                    {leg.title}
                  </span>
                </td>
              </tr>

              {leg.charges.map((c) => {
                const set = (next: ChargeLine) => ops?.replace(leg.key, c.id, next);
                const showComment = commenting === c.id;
                return (
                  <Fragment key={c.id}>
                    <tr className="text-muted">
                      <td className={cn(td, 'pl-8', editable && 'py-0.5')}>
                        {editable ? (
                          <input
                            aria-label="Charge name"
                            value={c.label}
                            onChange={(e) => set({ ...c, label: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                            className={inlineField}
                          />
                        ) : (
                          c.label
                        )}
                        {c.comment && !showComment && (
                          <span className="mt-0.5 flex items-center gap-1 px-1 text-[10px] text-faint italic">
                            <MessageSquare size={10} className="shrink-0 not-italic" />
                            {c.comment}
                          </span>
                        )}
                      </td>
                      <td className={cn(td, 'text-faint', editable && 'py-0.5')}>
                        {editable ? (
                          <InlineSelect value={c.basis} options={BASES} label="Basis" onChange={(b) => set(withBasis(c, b, types))} />
                        ) : (
                          c.basis
                        )}
                      </td>
                      <td className={cn(td, 'text-faint', editable && 'py-0.5')}>
                        {editable ? (
                          <InlineSelect value={c.calc} options={CALCS} label="Calc. type" onChange={(v) => set({ ...c, calc: v })} />
                        ) : (
                          c.calc
                        )}
                      </td>
                      {c.perBl ? (
                        // Per-B/L: one amount for the shipment, not per container.
                        <td className={cn(td, num)} colSpan={lines.length}>
                          <span className="inline-flex items-center justify-end gap-1">
                            {editable ? (
                              <span className="w-24">
                                <AmountInput
                                  value={c.perBl[kind]}
                                  label={`${c.label} per B/L (${kind})`}
                                  onChange={(v) => set({ ...c, perBl: { ...c.perBl!, [kind]: v } })}
                                />
                              </span>
                            ) : (
                              money(c.perBl[kind])
                            )}
                            <span className="text-[10px] text-faint">per B/L × {bls}</span>
                          </span>
                        </td>
                      ) : (
                        lines.map((l) => (
                          <td key={l.type} className={cn(td, num, editable && 'py-0.5')}>
                            {editable ? (
                              <AmountInput
                                value={c.perUnit?.[l.type]?.[kind] ?? 0}
                                label={`${c.label} ${l.type} (${kind})`}
                                onChange={(v) =>
                                  set({
                                    ...c,
                                    perUnit: {
                                      ...c.perUnit,
                                      [l.type]: { ...(c.perUnit?.[l.type] ?? { buy: 0, sell: 0 }), [kind]: v },
                                    },
                                  })
                                }
                              />
                            ) : (
                              unit(c.perUnit?.[l.type]?.[kind])
                            )}
                          </td>
                        ))
                      )}
                      <td className={cn(td, 'text-faint', editable && 'py-0.5')}>
                        {editable ? (
                          <InlineSelect
                            value={c.currency ?? currency}
                            options={CURRENCIES}
                            label="Currency"
                            onChange={(v) => set({ ...c, currency: v })}
                          />
                        ) : (
                          (c.currency ?? currency)
                        )}
                      </td>
                      {editable && (
                        <td className={cn(td, 'py-0.5')}>
                          <span className="flex items-center justify-center gap-0.5 text-faint">
                            <RowAction
                              label={c.comment ? 'Edit comment' : 'Add comment'}
                              active={!!c.comment}
                              onClick={() => setCommenting(showComment ? null : c.id)}
                            >
                              <MessageSquarePlus size={13} />
                            </RowAction>
                            <RowAction label={`Copy ${kind} → ${other(kind)}`} onClick={() => set(copyLevel(c, kind))}>
                              <ArrowRightLeft size={13} />
                            </RowAction>
                            <RowAction label="Delete charge" danger onClick={() => ops?.remove(leg.key, c.id)}>
                              <Trash2 size={13} />
                            </RowAction>
                          </span>
                        </td>
                      )}
                    </tr>
                    {editable && showComment && (
                      <tr>
                        <td className={cn(td, 'py-1 pl-8')} colSpan={span}>
                          <span className="flex items-center gap-2">
                            <MessageSquare size={12} className="shrink-0 text-faint" />
                            <input
                              autoFocus
                              aria-label={`Comment on ${c.label}`}
                              placeholder="Add a comment for this charge…"
                              value={c.comment ?? ''}
                              onChange={(e) => set({ ...c, comment: e.target.value || undefined })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') setCommenting(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="h-7 flex-1 rounded-[6px] border border-line bg-canvas px-2 text-[12px] text-ink outline-none focus:border-line-strong"
                            />
                            <Button variant="ghost" size="xs" onClick={() => setCommenting(null)} className="text-[12px]">
                              Done
                            </Button>
                          </span>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {editable && (
                <tr>
                  <td className={cn(td, 'py-0.5 pl-7')} colSpan={span}>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        ops?.add(leg.key, newCharge(leg.key, types));
                      }}
                      className="h-6 text-[12px] text-muted"
                    >
                      <Plus size={12} /> Add charge
                    </Button>
                  </td>
                </tr>
              )}

              {/* Unit total = whole leg; Equipment total = unit total − non-equipment (per-B/L) charges */}
              {subtotal('Unit total', (t) => money(unitTotal(leg.charges, t)))}
              {subtotal('Equipment total', (t) => money(unitSum(leg.charges, t, kind, currency)))}
            </tbody>
          );
        })}

        <tbody>
          {subtotal('Grand total / unit', (t) => money(unitTotal(all, t)), true)}
          {/* Quantities only appear here: equipment charges × qty per type */}
          {subtotal('Grand total × quantity', (t, q) => `${q}× ${money(unitSum(all, t, kind, currency) * q)}`, true)}
        </tbody>

        <tfoot>
          <tr className="bg-subtle/60">
            {/* One fixed-height line (h-8, same as the card's price footer); never wraps. */}
            <td className="h-8 px-3" colSpan={span}>
              <div className="flex items-center justify-between gap-8 whitespace-nowrap tabular-nums">
                <span className="text-[10px] text-faint">Shipment total · incl. per-B/L charges · in {currency}</span>
                <div className="flex items-center gap-10 text-[12px]">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[10px] text-faint">Total buy</span>
                    <span className={kind === 'buy' ? 'text-ink' : 'text-muted'}>
                      {currency} {money(total.buy)}
                    </span>
                  </span>
                  <span className="flex items-baseline gap-2">
                    <span className="text-[10px] text-faint">Total sell</span>
                    <span className={kind === 'sell' ? 'text-ink' : 'text-muted'}>
                      {currency} {money(total.sell)}
                    </span>
                  </span>
                  <span className="flex items-baseline gap-2">
                    <span className="text-[10px] text-faint">Profit margin</span>
                    <span className={profit >= 0 ? 'text-success' : 'text-danger'}>
                      {currency} {money(profit)} · {total.buy ? ((profit / total.buy) * 100).toFixed(1) : '0'}%
                    </span>
                  </span>
                </div>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ── Other tabs ────────────────────────────────────────────────────────────── */

const addDays = (date: string, days: number) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const vessels = ['Aurora', 'Orion', 'Vega', 'Lyra', 'Atlas'];

function Schedules({ rate }: { rate: RateCard }) {
  const { ocean, pol, pod } = rate.route;
  const cols = { gridTemplateColumns: 'minmax(8rem,1fr) minmax(10rem,1.4fr) minmax(8rem,1fr) 6rem minmax(7rem,1fr) minmax(7rem,1fr)' };
  return (
    <div className="overflow-x-auto px-4 py-2 text-[12px]">
      <div className="min-w-max">
        <div className="grid gap-x-3 border-b border-line py-1.5 text-[10px] text-faint" style={cols}>
          <span>Departure ({pol.code})</span>
          <span>Vessel / voyage</span>
          <span>Routing</span>
          <span>Transit</span>
          <span>Arrival ({pod.code})</span>
          <span>Cargo cut-off</span>
        </div>
        {ocean.sailings.map((s, i) => (
          <div key={s} className="grid gap-x-3 border-b border-line py-1.5 text-muted last:border-0" style={cols}>
            <span className="text-ink">{s}</span>
            <span>
              {rate.carrier} {vessels[i % vessels.length]} · {452 + i * 7}W
            </span>
            <span>{ocean.via.length ? `via ${ocean.via.join(', ')}` : 'Direct'}</span>
            <span>{ocean.transit}</span>
            <span>{addDays(s, transitMin(rate))}</span>
            <span>{addDays(s, -2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FreeDaysTab({ rate }: { rate: RateCard }) {
  const { pol, pod } = rate.route;
  const rows = [
    { side: 'Origin', port: pol, days: pol.freeDays },
    { side: 'Destination', port: pod, days: pod.freeDays },
  ];
  const cols = { gridTemplateColumns: 'minmax(10rem,1.5fr) repeat(3, minmax(6rem,1fr))' };
  return (
    <div className="px-4 py-2 text-[12px]">
      <div className="grid gap-x-3 border-b border-line py-1.5 text-[10px] text-faint" style={cols}>
        <span>Port</span>
        <span>Demurrage</span>
        <span>Detention</span>
        <span>Combined</span>
      </div>
      {rows.map(({ side, port, days }) => (
        <div key={side} className="grid gap-x-3 border-b border-line py-1.5 text-muted last:border-0" style={cols}>
          <span>
            <span className="text-ink">{side}</span> · {port.code} {port.name}
          </span>
          <span>{days ? `${days.demurrage} days` : '—'}</span>
          <span>{days ? `${days.detention} days` : '—'}</span>
          <span>{days ? `${days.demurrage + days.detention} days` : '—'}</span>
        </div>
      ))}
    </div>
  );
}

function RemarksTab({ rate, legs }: { rate: RateCard; legs: LegCharges[] }) {
  const inclusions = [...new Set(legs.flatMap((l) => l.charges.map((c) => c.label)))];
  const exclusions = ['Customs clearance & duties', 'Cargo insurance', 'Demurrage / detention beyond free days', 'Inspection & fumigation'];
  const remarks = [
    'Rates subject to equipment and space availability at booking.',
    `Valid for cargo gated-in between ${rate.validFrom} and ${rate.validTo}.`,
    'Surcharges may change with carrier notice (BAF/CAF adjusted monthly).',
    ...(rate.hazardous ? ['DG acceptance subject to carrier approval; DG documentation required.'] : []),
  ];
  const list = (title: string, items: string[]) => (
    <div>
      <div className="mb-1 text-[10px] text-faint">{title}</div>
      <ul className="space-y-0.5 text-muted">
        {items.map((i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-faint">•</span>
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="grid grid-cols-1 gap-4 px-4 py-3 text-[12px] @2xl:grid-cols-3">
      {list('Inclusions', inclusions)}
      {list('Exclusions', exclusions)}
      {list('Remarks', remarks)}
    </div>
  );
}

/* ── Expanded rate details ─────────────────────────────────────────────────── */

const tabCls = 'py-2 text-[12px]';

/**
 * Expanded rate card — tabs for Buy charges, Sell charges, Schedules, Free days and
 * Remarks & inclusions. The charge tables end with shipment totals + profit margin.
 */
export function RateDetails({
  rate,
  lines,
  bls,
  legs: legsProp,
  ops,
}: {
  rate: RateCard;
  lines: SearchLine[];
  bls: number;
  /** Edited charges (step 3); defaults to the rate's own breakdown. */
  legs?: LegCharges[];
  /** When set, the Buy/Sell tables are editable. */
  ops?: ChargeOps;
}) {
  const legs = legsProp ?? chargeBreakdown(rate);

  return (
    <div className="@container">
      <Tabs defaultValue="buy">
        <TabsList className="px-1">
          <TabsTrigger value="buy" className={tabCls}>
            Buy charges
          </TabsTrigger>
          <TabsTrigger value="sell" className={tabCls}>
            Sell charges
          </TabsTrigger>
          <TabsTrigger value="schedules" className={tabCls}>
            Schedules
          </TabsTrigger>
          <TabsTrigger value="freedays" className={tabCls}>
            Free days
          </TabsTrigger>
          <TabsTrigger value="remarks" className={tabCls}>
            Remarks & inclusions
          </TabsTrigger>
        </TabsList>
        <TabsContent value="buy">
          <ChargeTable legs={legs} lines={lines} bls={bls} kind="buy" currency={rate.currency} ops={ops} />
        </TabsContent>
        <TabsContent value="sell">
          <ChargeTable legs={legs} lines={lines} bls={bls} kind="sell" currency={rate.currency} ops={ops} />
        </TabsContent>
        <TabsContent value="schedules">
          <Schedules rate={rate} />
        </TabsContent>
        <TabsContent value="freedays">
          <FreeDaysTab rate={rate} />
        </TabsContent>
        <TabsContent value="remarks">
          <RemarksTab rate={rate} legs={legs} />
        </TabsContent>
      </Tabs>

    </div>
  );
}

/* ── Common charges (step 3, extracted from several rates) ──────────────────── */

/**
 * Charges identical on every selected rate, pulled out of the cards into one table
 * (Buy / Sell tabs, same editable layout). Quoted once alongside each option.
 */
export function CommonChargesCard({
  legs,
  lines,
  bls,
  currency,
  rateCount,
  ops,
  onRestore,
}: {
  legs: LegCharges[];
  lines: SearchLine[];
  bls: number;
  currency: string;
  rateCount: number;
  ops: ChargeOps;
  onRestore: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            <Layers size={14} className="text-atlas" /> Common charges
          </CardTitle>
          <CardDescription>
            Identical on all {rateCount} selected rates — quoted once alongside each option. Card totals exclude these.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onRestore} className="shrink-0">
          <Undo2 size={14} /> Restore to rate cards
        </Button>
      </CardHeader>
      <Tabs defaultValue="sell">
        <TabsList className="px-1">
          <TabsTrigger value="buy" className={tabCls}>
            Buy charges
          </TabsTrigger>
          <TabsTrigger value="sell" className={tabCls}>
            Sell charges
          </TabsTrigger>
        </TabsList>
        <TabsContent value="buy">
          <ChargeTable legs={legs} lines={lines} bls={bls} kind="buy" currency={currency} ops={ops} />
        </TabsContent>
        <TabsContent value="sell">
          <ChargeTable legs={legs} lines={lines} bls={bls} kind="sell" currency={currency} ops={ops} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
