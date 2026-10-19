import { useState } from 'react';
import {
  CalendarClock,
  Check,
  CircleCheck,
  Clock,
  FileText,
  Layers,
  Mail,
  Percent,
  Phone,
  Ship,
  ThumbsDown,
  Trophy,
  Undo2,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { allInOf, type LegCharges, type RateCard, type SearchLine } from '../data/rates';
import { PriceHeader, RateResultCard, type PricingLevel } from './RateResultCard';
import { addDaysIso } from './QuoteDraftStep';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, SectionLabel } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const money = (n: number) => n.toLocaleString('en-US');
const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const daysBetween = (a: string, b: string) =>
  Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86_400_000);

/* ── Pieces ────────────────────────────────────────────────────────────────── */

function Stat({ icon: Icon, label, value, sub, tone }: { icon: LucideIcon; label: string; value: string; sub?: string; tone?: 'success' }) {
  return (
    <Card className="flex flex-col gap-1.5 p-3">
      <SectionLabel as="div" className="flex items-center gap-1.5">
        <Icon size={12} /> {label}
      </SectionLabel>
      <span className={cn('text-[18px] leading-none tabular-nums', tone === 'success' ? 'text-success' : 'text-ink')}>{value}</span>
      {sub && <span className="text-[12px] text-muted">{sub}</span>}
    </Card>
  );
}

/* ── Next action ───────────────────────────────────────────────────────────── */

type Outcome = { kind: 'won' } | { kind: 'lost'; reason: string; note: string } | { kind: 'follow'; date: string; channel: string; byAtlas: boolean };

const LOST_REASONS = ['Price too high', 'Transit time too long', 'Chose a competitor', 'No longer shipping', 'Other'];

function NextAction({ today }: { today: string }) {
  const [mode, setMode] = useState<'won' | 'lost' | 'follow'>('follow');
  const [reason, setReason] = useState(LOST_REASONS[0]);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(addDaysIso(today, 3));
  const [channel, setChannel] = useState<'Email' | 'Call'>('Email');
  const [byAtlas, setByAtlas] = useState(true);
  const [done, setDone] = useState<Outcome | null>(null);

  if (done) {
    const view =
      done.kind === 'won'
        ? { icon: Trophy, tone: 'text-success border-success/40 bg-success/10', title: 'Marked as won', sub: 'Deal moved to Won — booking can start.' }
        : done.kind === 'lost'
          ? { icon: ThumbsDown, tone: 'text-danger border-danger/40 bg-danger/10', title: 'Marked as lost', sub: `Reason: ${done.reason}${done.note ? ` — ${done.note}` : ''}` }
          : {
              icon: CalendarClock,
              tone: 'text-atlas border-atlas/40 bg-atlas/10',
              title: `Follow-up ${done.channel.toLowerCase()} on ${fmtDate(done.date)}`,
              sub: done.byAtlas ? 'Atlas will send it automatically and log the reply.' : 'Added to your tasks.',
            };
    return (
      <Card className="flex h-full flex-col gap-3 p-4">
        <SectionLabel as="div">Next action</SectionLabel>
        <div className={cn('flex items-start gap-3 rounded-lg border p-3', view.tone)}>
          <view.icon size={18} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-[14px] text-ink">{view.title}</div>
            <div className="text-[12px] text-muted">{view.sub}</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setDone(null)} className="self-start text-muted">
          <Undo2 size={14} /> Undo
        </Button>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <SectionLabel as="div">Next action</SectionLabel>
      <SegmentedControl
        stretch
        aria-label="Next action"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'won', label: 'Won' },
          { value: 'lost', label: 'Lost' },
          { value: 'follow', label: 'Follow up' },
        ]}
      />

      {mode === 'won' && (
        <div className="flex flex-1 flex-col gap-3">
          <p className="text-[12px] text-muted">The customer accepted — move the deal to Won and start the booking.</p>
          <Button onClick={() => setDone({ kind: 'won' })} className="mt-auto bg-success text-canvas hover:bg-success/90">
            <Trophy size={14} /> Mark as won
          </Button>
        </div>
      )}

      {mode === 'lost' && (
        <div className="flex flex-1 flex-col gap-3">
          <Field label="Reason">
            <Select size="sm" value={reason} onChange={(e) => setReason(e.target.value)} options={LOST_REASONS} />
          </Field>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note (e.g. competitor price)…" className="text-[12px]" />
          <Button
            variant="outline"
            onClick={() => setDone({ kind: 'lost', reason, note })}
            className="mt-auto border-danger/40 bg-danger/10 text-danger hover:bg-danger/15"
          >
            <ThumbsDown size={14} /> Mark as lost
          </Button>
        </div>
      )}

      {mode === 'follow' && (
        <div className="flex flex-1 flex-col gap-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
            <Field label="Follow up on">
              <Input size="sm" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <SegmentedControl
              aria-label="Channel"
              value={channel}
              onChange={setChannel}
              options={[
                { value: 'Email', label: 'Email' },
                { value: 'Call', label: 'Call' },
              ]}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-muted">
            <Switch checked={byAtlas} onCheckedChange={setByAtlas} aria-label="Let Atlas send the follow-up" />
            Let Atlas {channel === 'Email' ? 'send the follow-up email' : 'remind me and prep the call'}
          </label>
          <Button onClick={() => setDone({ kind: 'follow', date, channel, byAtlas })} className="mt-auto bg-atlas text-canvas hover:bg-atlas/90">
            {channel === 'Email' ? <Mail size={14} /> : <Phone size={14} />} Schedule follow-up
          </Button>
        </div>
      )}
    </Card>
  );
}

/* ── Summary ───────────────────────────────────────────────────────────────── */

/**
 * Step 5 — quote sent. Hero (who / when / validity), key figures,
 * next action (won / lost / follow up), the search parameters and the selected rate
 * cards (read-only, expandable) with any extracted common charges.
 */
export function QuoteSentSummary({
  quote,
  searchFacts,
  rates,
  legsFor,
  common,
  lines,
  bls,
  currency,
  pricingLevel,
}: {
  quote: { fileName: string; to: string[]; contact: string; start: string; expiry: string; today: string };
  /** Step-1 search parameters as label / value pairs. */
  searchFacts: { label: string; value: string }[];
  rates: RateCard[];
  legsFor: (r: RateCard) => LegCharges[];
  common: LegCharges[] | null;
  lines: SearchLine[];
  bls: number;
  currency: string;
  pricingLevel: PricingLevel;
}) {
  const commonTotal = common ? allInOf(common, lines, bls, currency) : { buy: 0, sell: 0 };
  const totals = rates.map((r) => {
    const t = allInOf(legsFor(r), lines, bls, currency);
    return { rate: r, buy: t.buy + commonTotal.buy, sell: t.sell + commonTotal.sell };
  });
  const best = [...totals].sort((a, b) => a.sell - b.sell)[0];
  const margin = best ? best.sell - best.buy : 0;
  const daysLeft = daysBetween(quote.today, quote.expiry);

  return (
    <div className="space-y-4">
      {/* Hero */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 bg-gradient-to-r from-success/15 via-success/5 to-transparent px-4 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success/20 text-success">
              <CircleCheck size={22} />
            </span>
            <div className="min-w-0">
              <div className="text-[18px] leading-tight text-ink">
                Quote sent to <span className="font-medium">{quote.contact}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
                <span className="flex items-center gap-1">
                  <FileText size={12} className="text-faint" /> {quote.fileName}
                </span>
                <span className="flex items-center gap-1">
                  <Mail size={12} className="text-faint" /> {quote.to.join(', ')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-faint" /> Sent just now
                </span>
              </div>
            </div>
          </div>
          <span className="rounded-full border border-success/40 px-2.5 py-1 text-[12px] text-success">
            Valid {fmtDate(quote.start)} – {fmtDate(quote.expiry)}
          </span>
        </div>
      </Card>

      {/* Key figures + next action */}
      <div className="@container">
        <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="grid grid-cols-2 gap-3">
            <Stat icon={Wallet} label="Quote value" value={best ? `${currency} ${money(best.sell)}` : '—'} sub={best ? `Lowest all-in · ${best.rate.carrier}` : undefined} />
            <Stat
              icon={Percent}
              label="Profit margin"
              tone="success"
              value={best ? `${currency} ${money(margin)}` : '—'}
              sub={best && best.buy ? `${((margin / best.buy) * 100).toFixed(1)}% on buy` : undefined}
            />
            <Stat icon={CalendarClock} label="Expires in" value={`${Math.max(0, daysLeft)} days`} sub={fmtDate(quote.expiry)} />
            <Stat icon={Ship} label="Carrier options" value={String(rates.length)} sub={rates.map((r) => r.carrier).join(', ')} />
          </div>
          <NextAction today={quote.today} />
        </div>
      </div>

      {/* Search parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Search parameters</CardTitle>
        </CardHeader>
        <dl className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-x-4 gap-y-3 px-4 py-3">
          {searchFacts.map((f) => (
            <div key={f.label} className="min-w-0">
              <SectionLabel as="dt">{f.label}</SectionLabel>
              <dd className="mt-0.5 truncate text-[12px] text-ink" title={f.value}>
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      {/* Selected rate cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel as="h3">Quoted rates</SectionLabel>
          <span className="text-[12px] text-faint">Expand a card for the charges by leg</span>
        </div>
        <PriceHeader currency={currency} lines={lines} left={`${rates.length} rate${rates.length === 1 ? '' : 's'} in this quote`} />
        {totals.map(({ rate }) => (
          <RateResultCard
            key={rate.rateId}
            rate={rate}
            lines={lines}
            pricingLevel={pricingLevel}
            selected
            onToggle={() => {}}
            bls={bls}
            legs={legsFor(rate)}
            readOnly
          />
        ))}
        {common && (
          <Card className="flex items-center justify-between gap-3 px-4 py-2.5">
            <CardDescription className="flex items-center gap-2">
              <Layers size={14} className="text-atlas" /> Common charges quoted once with every option
            </CardDescription>
            <span className="text-[12px] text-muted tabular-nums">
              Buy {currency} {money(commonTotal.buy)} · Sell <span className="text-ink">{currency} {money(commonTotal.sell)}</span>
            </span>
          </Card>
        )}
      </div>

      {totals.length === 0 && (
        <p className="flex items-center gap-2 text-[12px] text-faint">
          <Check size={12} /> No rates were selected for this quote.
        </p>
      )}
    </div>
  );
}
