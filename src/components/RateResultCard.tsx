import { useRef, useState } from 'react';
import {
  AlertTriangle,
  Anchor,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Copy,
  Leaf,
  MapPin,
  Package,
  Sailboat,
  Ship,
  Sparkles,
  TrainFront,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { type LegCharges, type InlandLeg, type InlandMode, type InlandPoint, type PortCall, type RateCard, type RateRoute, type SearchLine, type Co2Level } from '../data/rates';
import { RateDetails, type ChargeOps } from './RateDetails';
import { cardGrid, priceCols } from './rateGrid';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckboxBox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Hint } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type PricingLevel = 'buy' | 'sell' | 'both';

const money = (n: number) => n.toLocaleString('en-US');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const stop = (e: React.SyntheticEvent) => e.stopPropagation();

/* ── Top bar ───────────────────────────────────────────────────────────────── */

function Divider() {
  return <span aria-hidden className="h-4 w-px shrink-0 bg-line" />;
}

/** Carrier logo — the image on a white tile when available, otherwise a code tile. */
export function CarrierLogo({ rate }: { rate: RateCard }) {
  return rate.logoUrl ? (
    <span className="grid h-6 w-16 shrink-0 place-items-center overflow-hidden rounded-[6px] bg-white px-1">
      <img src={rate.logoUrl} alt={rate.carrier} className="max-h-full max-w-full object-contain" />
    </span>
  ) : (
    <span className="grid h-6 w-16 shrink-0 place-items-center rounded-[6px] border border-line text-[10px] tracking-wide text-ink">
      {rate.carrierCode}
    </span>
  );
}

/** CO₂ rating colour — low emissions good (green), high bad (red). */
const co2Tone: Record<Co2Level, string> = {
  Low: 'border-success/50 text-success',
  Medium: 'border-warm/60 text-warm',
  High: 'border-danger/50 text-danger',
};

/** Rate IDs are shown cut to 10 characters (full ID on hover / copy). */
const shortId = (id: string) => (id.length > 10 ? `${id.slice(0, 10)}…` : id);

function TopBar({
  rate,
  selected,
  copyAction,
  extra,
  readOnly = false,
}: {
  rate: RateCard;
  selected: boolean;
  /** Summary mode — no selection checkbox. */
  readOnly?: boolean;
  copyAction: React.ReactNode;
  /** Extra actions on the right, before the CO₂ pill. */
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-1.5 pr-2 pl-3">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-muted">
        {!readOnly && (
          <Hint label="Selection" value={selected ? 'Selected for the quote' : 'Not selected — click to add'}>
            <span className="flex">
              <CheckboxBox checked={selected} tone="atlas" />
            </span>
          </Hint>
        )}
        <Hint label="Carrier" value={rate.carrier}>
          <span className="flex">
            <CarrierLogo rate={rate} />
          </span>
        </Hint>
        <span className="flex shrink-0 items-center gap-0.5">
          <Hint label="Rate ID" value={rate.rateId}>
            <span className="text-ink">{shortId(rate.rateId)}</span>
          </Hint>
          {copyAction}
        </span>
        <Divider />
        <Hint label="Services" value={rate.services.join(' | ')}>
          <span className="min-w-0 max-w-56 truncate">{rate.services.join(' | ')}</span>
        </Hint>
        <Divider />
        <Hint label="Rates by (forwarder / agent)" value={`${rate.agent} · via ${rate.provider}`}>
          <span className="flex shrink-0 items-center gap-1">
            <CircleDollarSign size={12} className="text-faint" />
            {rate.agent}
          </span>
        </Hint>
        <Divider />
        <Hint label="Commodity" value={rate.hazardous ? `${rate.commodity} · Hazardous (DG)` : rate.commodity}>
          <span className={cn('flex shrink-0 items-center gap-1', rate.hazardous && 'text-danger')}>
            {rate.hazardous ? <AlertTriangle size={12} /> : <Package size={12} className="text-faint" />}
            {rate.commodity}
          </span>
        </Hint>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {extra}
        <Hint label="CO₂ emissions" value={`${rate.co2.tonnes} t CO₂e · ${rate.co2.level}`}>
          <span className={cn('inline-flex h-5 items-center gap-1 rounded-full border px-2 text-[10px]', co2Tone[rate.co2.level])}>
            <Leaf size={10} />
            CO₂ {rate.co2.tonnes} t
          </span>
        </Hint>
      </div>
    </div>
  );
}

/* ── Route (lean: one line per stop, caption per leg) ─────────────────────── */

const inlandIcon: Record<InlandMode, LucideIcon> = { truck: Truck, rail: TrainFront, barge: Sailboat };

/** A stop — code on top, one short detail below. */
function StopView({
  icon: Icon,
  code,
  detail,
  label,
  value,
  codeExtra,
}: {
  icon: LucideIcon;
  code: string;
  detail: string;
  /** Hover label + full value. */
  label: string;
  value: string;
  /** Small element right of the code (e.g. free-days icon) with its own hover. */
  codeExtra?: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 flex-col items-center text-center">
      <span className="flex items-center gap-1">
        <Hint label={label} value={value}>
          <span className="flex items-center gap-1 text-[12px] text-ink">
            <Icon size={11} className="text-faint" />
            {code}
          </span>
        </Hint>
        {codeExtra}
      </span>
      <Hint label={label} value={value}>
        <span className="max-w-20 truncate text-[10px] text-faint">{detail}</span>
      </Hint>
    </div>
  );
}

function InlandStop({ point, label }: { point: InlandPoint; label: string }) {
  return (
    <StopView
      icon={MapPin}
      code={point.door ? point.door.name : point.code}
      detail={point.door ? point.door.code : point.name}
      label={label}
      value={[point.door && `${point.door.name} ${point.door.code}`, point.facility, `${point.code} ${point.name}`]
        .filter(Boolean)
        .join(' · ')}
    />
  );
}

function PortStop({ port, label }: { port: PortCall; label: string }) {
  return (
    <StopView
      icon={Anchor}
      code={port.code}
      detail={port.terminal ?? port.name}
      label={label}
      value={[port.code, port.name, port.terminal].filter(Boolean).join(' · ')}
      codeExtra={port.freeDays && <FreeDays freeDays={port.freeDays} where={port.code} />}
    />
  );
}

/** A leg — thin line with the mode icon, one caption below. */
function LegLine({
  icon: Icon,
  dashed,
  label,
  value,
  children,
  wide,
}: {
  icon: LucideIcon;
  dashed?: boolean;
  /** Hover label + value for the leg's line. */
  label: string;
  value: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={cn('flex min-w-6 flex-col items-center', wide ? 'flex-[2.5]' : 'flex-1')}>
      <Hint label={label} value={value}>
        <div className="relative grid h-4 w-full place-items-center">
          <span aria-hidden className={cn('absolute inset-x-1 top-1/2 border-t border-line-strong', dashed && 'border-dashed')} />
          <span className="relative bg-canvas px-1 text-faint">
            <Icon size={12} />
          </span>
        </div>
      </Hint>
      <span className="flex max-w-full items-center gap-1 truncate text-[10px] text-faint">{children}</span>
    </div>
  );
}

function InlandLegView({ leg, label }: { leg: InlandLeg; label: string }) {
  const value = `${cap(leg.mode)} · ${leg.operator}`;
  return (
    <LegLine icon={inlandIcon[leg.mode]} dashed label={label} value={value}>
      <Hint label={`${label} operator`} value={leg.operator}>
        <span className="truncate">{leg.operator}</span>
      </Hint>
    </LegLine>
  );
}

/** Ocean leg — “via … · sailing ▾ · transit” on one caption line. */
function OceanLeg({ ocean }: { ocean: RateRoute['ocean'] }) {
  const [sailing, setSailing] = useState(ocean.sailings[0]);
  return (
    <LegLine
      icon={Ship}
      wide
      label="Ocean"
      value={`${ocean.via.length ? `Transhipment via ${ocean.via.join(', ')}` : 'Direct'} · ${ocean.transit}`}
    >
      <Hint label="Routing" value={ocean.via.length ? `Transhipment via ${ocean.via.join(', ')}` : 'Direct service'}>
        <span className="truncate">{ocean.via.length ? `via ${ocean.via.join(', ')}` : 'Direct'}</span>
      </Hint>
      <span>·</span>
      <DropdownMenu>
        <Hint
          label="Departure"
          value={`${sailing}${ocean.sailings.length > 1 ? ` · ${ocean.sailings.length} sailings — click to change` : ''}`}
        >
          <DropdownMenuTrigger asChild onClick={stop}>
            <button type="button" className="flex shrink-0 items-center gap-0.5 hover:text-ink">
              <Calendar size={10} />
              {sailing.slice(0, 6)}
              {ocean.sailings.length > 1 && <span className="text-danger">+{ocean.sailings.length - 1}</span>}
              <ChevronDown size={10} />
            </button>
          </DropdownMenuTrigger>
        </Hint>
        <DropdownMenuContent align="center" onClick={stop}>
          <DropdownMenuLabel>Sailings</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={sailing} onValueChange={setSailing}>
            {ocean.sailings.map((s) => (
              <DropdownMenuRadioItem key={s} value={s}>
                {s}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <span>·</span>
      <Hint label="Transit time" value={ocean.transit}>
        <span className="shrink-0">{ocean.transit.replace(' days', 'd')}</span>
      </Hint>
    </LegLine>
  );
}

/** Free days at a port — calendar icon next to the port code; hover shows the days. */
function FreeDays({ freeDays, where }: { freeDays: { demurrage: number; detention: number }; where: string }) {
  return (
    <Hint
      label={`Free days · ${where}`}
      value={`Demurrage ${freeDays.demurrage} days · Detention ${freeDays.detention} days`}
    >
      <span
        tabIndex={0}
        aria-label={`Free days at ${where}: demurrage ${freeDays.demurrage}, detention ${freeDays.detention}`}
        className="grid size-4 place-items-center rounded-[4px] text-brand outline-none hover:bg-brand/15 focus-visible:bg-brand/15"
      >
        <CalendarDays size={11} />
      </span>
    </Hint>
  );
}

export function RouteRow({ route }: { route: RateRoute }) {
  return (
    // Even 12px padding around the schedule.
    <div className="p-3">
      <div className="flex min-w-0 items-start gap-1">
        {route.origin && (
          <>
            <InlandStop point={route.origin.point} label="Place of receipt" />
            <InlandLegView leg={route.origin.leg} label="Pre-carriage" />
          </>
        )}
        <PortStop port={route.pol} label="Port of loading" />
        <OceanLeg ocean={route.ocean} />
        <PortStop port={route.pod} label="Port of discharge" />
        {route.destination && (
          <>
            <InlandLegView leg={route.destination.leg} label="On-carriage" />
            <InlandStop point={route.destination.point} label="Place of delivery" />
          </>
        )}
      </div>
    </div>
  );
}

/** Narrow cards: only the start and end of the route, every leg's mode on one line. */
function CompactRoute({ route }: { route: RateRoute }) {
  const { origin, pol, ocean, pod, destination } = route;
  const modes: LucideIcon[] = [
    ...(origin ? [inlandIcon[origin.leg.mode]] : []),
    Ship,
    ...(destination ? [inlandIcon[destination.leg.mode]] : []),
  ];
  const full = [
    origin && (origin.point.door?.name ?? origin.point.code),
    pol.code,
    ocean.via.length ? `(via ${ocean.via.join(', ')})` : '(direct)',
    pod.code,
    destination && (destination.point.door?.name ?? destination.point.code),
  ]
    .filter(Boolean)
    .join(' → ');
  const caption = `${ocean.sailings[0].slice(0, 6)} · ${ocean.via.length ? `${ocean.via.length} T/S` : 'Direct'} · ${ocean.transit.replace(' days', 'd')}`;

  return (
    // Even 12px padding around the schedule.
    <div className="p-3">
      <div className="flex min-w-0 items-start gap-1">
        {origin ? (
          <InlandStop point={origin.point} label="Place of receipt" />
        ) : (
          <PortStop port={pol} label="Port of loading" />
        )}
        <div className="flex min-w-6 flex-1 flex-col items-center">
          <Hint label="Route" value={`${full} · ${ocean.transit}`}>
            <div className="relative grid h-4 w-full place-items-center">
              <span aria-hidden className="absolute inset-x-1 top-1/2 border-t border-line-strong" />
              <span className="relative flex items-center gap-1 bg-canvas px-1 text-faint">
                {modes.map((Icon, i) => (
                  <Icon key={i} size={12} />
                ))}
              </span>
            </div>
          </Hint>
          <span className="max-w-full truncate text-[10px] text-faint">{caption}</span>
        </div>
        {destination ? (
          <InlandStop point={destination.point} label="Place of delivery" />
        ) : (
          <PortStop port={pod} label="Port of discharge" />
        )}
      </div>
    </div>
  );
}

/* ── Price table — the focal point of the card ─────────────────────────────── */

/**
 * Common price header — search currency + equipment (qty × type, weight) for all
 * cards. Rendered once above the list, on the same grid as the cards' price rows.
 */
export function PriceHeader({ currency, lines, left }: { currency: string; lines: SearchLine[]; left?: React.ReactNode }) {
  return (
    // Transparent borders mirror the card's 1px border + price-section divider so columns align.
    <div className="grid border-x border-transparent" style={cardGrid(lines.length)}>
      <div className="flex min-w-0 items-end px-3 text-[10px] text-faint">{left}</div>
      <div className="grid items-end gap-2 border-l border-transparent px-3 text-[10px] tabular-nums" style={priceCols(lines.length)}>
        <span className="grid h-5 place-items-center rounded-full border border-brand/60 text-[10px] text-brand">{currency}</span>
        {lines.map((l) => (
          <span key={l.type} className="flex min-w-0 flex-col">
            <span className="truncate text-muted">
              {l.qty}× {l.type}
            </span>
            <span className="truncate text-faint">{money(l.weightKg)} kg</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function PriceTable({
  rate,
  lines,
  level,
  showTotal,
  footer,
}: {
  rate: RateCard;
  lines: SearchLine[];
  level: PricingLevel;
  showTotal?: boolean;
  /** Validity + CTAs, pinned to the bottom of the section. */
  footer: React.ReactNode;
}) {
  const cols = priceCols(lines.length);
  const cell = (v: number | undefined) => (v === undefined ? '—' : money(v));
  // Rows are Buy · Sell; the pricing level picks which one is emphasised.
  const focus = level === 'buy' ? 'buy' : 'sell';
  const freightTotal = (kind: 'buy' | 'sell') =>
    lines.reduce((a, l) => a + (rate.prices[l.type]?.[kind] ?? 0) * l.qty, 0);
  const priceRow = (kind: 'buy' | 'sell') => (
    <div
      className={cn(
        'grid items-baseline gap-2 rounded-[6px]',
        kind === focus ? 'bg-brand/10 py-0.5 text-ink' : 'text-muted',
      )}
      style={cols}
    >
      <span className="text-center text-[10px] text-faint capitalize">{kind}</span>
      {lines.map((l) => {
        const v = rate.prices[l.type]?.[kind];
        return (
          <Hint
            key={l.type}
            label={`${cap(kind)} · ${l.type} (per unit)`}
            value={v === undefined ? 'Not quoted' : `${rate.currency} ${money(v)} × ${l.qty} = ${rate.currency} ${money(v * l.qty)}`}
          >
            <span className={cn('truncate', kind === focus ? 'text-[14px] font-medium' : 'text-[12px]')}>{cell(v)}</span>
          </Hint>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col justify-center gap-0.5 px-3 py-1.5 text-[12px] tabular-nums">
        {/* Equipment + weight live in the sticky PriceHeader above the list */}
        {priceRow('buy')}
        {priceRow('sell')}
        {showTotal && (
          <div className="mt-0.5 flex items-baseline justify-between border-t border-line pt-1 text-[10px] text-faint">
            <span>Freight total</span>
            <span className="flex items-baseline gap-2">
              <span>
                Buy <span className="text-[12px] text-muted">{money(freightTotal('buy'))}</span>
              </span>
              <span>
                Sell <span className="text-[12px] text-ink">{money(freightTotal('sell'))}</span>
              </span>
            </span>
          </div>
        )}
      </div>
      {footer}
    </div>
  );
}

/* ── Icon action ───────────────────────────────────────────────────────────── */

function IconAction({
  label,
  value,
  onClick,
  expanded,
  small,
  children,
}: {
  label: string;
  /** Shown under the label in the hover hint. */
  value: string;
  onClick?: () => void;
  /** Set for disclosure toggles (the accordion). */
  expanded?: boolean;
  /** Inline in text (e.g. next to the rate ID). */
  small?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Hint label={label} value={value}>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={label}
        aria-expanded={expanded}
        onClick={(e) => {
          stop(e);
          onClick?.();
        }}
        className={small ? 'size-5 rounded-[4px]' : 'size-6 rounded-[6px]'}
      >
        {children}
      </Button>
    </Hint>
  );
}

/* ── Card ──────────────────────────────────────────────────────────────────── */

/**
 * Rate result (Figma ATLAS-CRM 345:949, leaner). Left: top bar (carrier, rate ID, services,
 * agent, commodity, CO₂ — customer is in the step's summary line) + one-line route (pre-carriage → POL → ocean → POD →
 * on-carriage). Middle (30%, the focal point): price table per searched equipment, Buy/Sell rows by
 * pricing level, validity strip. Right: action rail. Click the card or checkbox to select.
 */
export function RateResultCard({
  rate,
  lines,
  pricingLevel,
  selected,
  onToggle,
  bls,
  showTotal = false,
  legs,
  chargeOps,
  defaultExpanded = false,
  onAskAtlas,
  readOnly = false,
}: {
  rate: RateCard;
  lines: SearchLine[];
  pricingLevel: PricingLevel;
  selected: boolean;
  onToggle: () => void;
  /** No. of B/Ls from the search — per-B/L charges in the breakdown. */
  bls: number;
  /** Add a freight-total row (Σ qty × unit price) under Buy/Sell. */
  showTotal?: boolean;
  /** Edited charges (step 3) for the expanded tables. */
  legs?: LegCharges[];
  /** Makes the expanded Buy/Sell tables editable (amounts, names, add / delete / comment / copy). */
  chargeOps?: ChargeOps;
  defaultExpanded?: boolean;
  /** Shows an "Ask Atlas" button that opens the agent panel scoped to this rate. */
  onAskAtlas?: () => void;
  /** Summary mode (step 5) — not selectable; details still expand. */
  readOnly?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  // Keep the details mounted once opened so closing can animate (and reopen is instant).
  const [mounted, setMounted] = useState(defaultExpanded);
  const [flash, setFlash] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const open = () => {
    setMounted(true);
    setExpanded(true);
  };
  /**
   * Close. From the bottom bar the card's top may be far above — scroll it back into
   * view (below the sticky header) and flash a ring so it's clear which card closed.
   */
  const close = (fromBottom = false) => {
    setExpanded(false);
    if (!fromBottom) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    cardRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setFlash(true);
    window.setTimeout(() => setFlash(false), 1800);
  };
  const toggle = () => (expanded ? close() : open());

  const copyId = () => {
    navigator.clipboard?.writeText(rate.rateId).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      },
      () => {},
    );
  };

  return (
    <Card
      ref={cardRef}
      {...(readOnly
        ? {}
        : {
            onClick: onToggle,
            'aria-pressed': selected,
            role: 'button',
            tabIndex: 0,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onToggle();
              }
            },
          })}
      interactive={!readOnly}
      className={cn(
        // Route (flexes) | prices (fixed width, see cardGrid).
        // scroll-mt clears the sticky results header when scrolled back to after closing.
        'grid scroll-mt-48 overflow-hidden outline-none transition-[box-shadow,border-color,background-color] duration-700 focus-visible:border-line-strong',
        selected && !readOnly && 'border-atlas/70 ring-1 ring-atlas/50 hover:border-atlas/70',
        // Strong, solid highlight so the just-closed card is unmistakable; fades out via the transition.
        flash && 'border-brand bg-brand/15 shadow-[0_0_0_3px_var(--color-brand),0_0_24px_4px_color-mix(in_oklab,var(--color-brand)_45%,transparent)]',
      )}
      style={cardGrid(lines.length)}
    >
      {/* Left — top bar + route. Its own container: narrow → start/end-only schedule. */}
      <div className="@container/left min-w-0">
        <TopBar
          rate={rate}
          selected={selected}
          readOnly={readOnly}
          extra={
            onAskAtlas && (
              <Hint label="Ask Atlas" value="Edit this rate's charges by chat — e.g. apply a margin or waive a fee">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={(e) => {
                    stop(e);
                    onAskAtlas();
                  }}
                  className="h-6 border-atlas/50 text-[12px] text-atlas hover:bg-atlas/10"
                >
                  <Sparkles size={12} /> Ask Atlas
                </Button>
              </Hint>
            )
          }
          copyAction={
            <IconAction label={copied ? 'Copied' : 'Copy rate ID'} value={rate.rateId} onClick={copyId} small>
              <Copy size={11} className={copied ? 'text-success' : undefined} />
            </IconAction>
          }
        />
        <div className="hidden @2xl/left:block">
          <RouteRow route={rate.route} />
        </div>
        <div className="@2xl/left:hidden">
          <CompactRoute route={rate.route} />
        </div>
      </div>

      {/* Price table — 30% */}
      <div className="min-w-0 border-l border-line">
        <PriceTable
          rate={rate}
          lines={lines}
          level={pricingLevel}
          showTotal={showTotal}
          footer={
            <div className="flex h-8 items-center justify-between gap-2 border-t border-line pr-1.5 pl-3">
              <Hint label="Validity" value={`${rate.validFrom} – ${rate.validTo}`}>
                <span className="truncate text-[10px] text-faint">
                  Valid <span className="text-muted">{rate.validFrom}</span> – <span className="text-muted">{rate.validTo}</span>
                </span>
              </Hint>
              <span className="flex shrink-0 items-center gap-0.5 text-muted">
                <IconAction
                  label="Rate details"
                  value={expanded ? 'Click to hide' : 'Charges, schedules, free days & remarks'}
                  onClick={toggle}
                  expanded={expanded}
                >
                  <ChevronDown size={14} className={cn('transition-transform', expanded && 'rotate-180')} />
                </IconAction>
              </span>
            </div>
          }
        />
      </div>


      {/* Expanded — tabs: buy / sell charges, schedules, free days, remarks; totals footer */}
      {/* Height animates via grid rows 0fr ↔ 1fr; hidden content is inert while closed. */}
      <div
        className={cn(
          'col-span-full grid cursor-default transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
        onClick={stop}
        inert={!expanded}
        aria-hidden={!expanded}
      >
        <div className="min-h-0 overflow-hidden">
          {mounted && (
            <div className="border-t border-line">
              <RateDetails rate={rate} lines={lines} bls={bls} legs={legs} ops={chargeOps} />
              {/* Close from the bottom — returns to this card's top */}
              <button
                type="button"
                onClick={() => close(true)}
                className="flex h-8 w-full items-center justify-center gap-1.5 border-t border-line text-[12px] text-muted transition-colors hover:bg-subtle hover:text-ink"
              >
                <ChevronUp size={14} /> Collapse rate details
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
