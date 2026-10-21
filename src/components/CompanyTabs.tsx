import {
  Briefcase,
  CalendarClock,
  CalendarRange,
  Check,
  Compass,
  Database,
  Handshake,
  Info,
  LayoutDashboard,
  ListTodo,
  Mail,
  Route,
  Sparkles,
  StickyNote,
  Ticket,
  TrendingDown,
  Users,
} from 'lucide-react';
import { messages, comments } from '../data/deal';
import { peakMonths, servedLanes } from '../data/leads';
import { statedLanes, winRate, type Organization } from '../data/organizations';
import type { ContactSummary } from '../data/contacts';
import type { DealSummary } from '../data/deals';
import { daysFromToday, fmtDate } from '@/lib/dates';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hint } from '@/components/ui/tooltip';
import { RecordTabs } from './record/RecordTabs';
import { AttributeRow, AttributeSection } from './record/AttributeList';
import { EmptyNote, Signal, Stat, TabBody } from './record/RecordParts';
import { TradeProfileView } from './record/TradeProfileView';
import { AssociatedDealsTab } from './AssociatedDealsTab';
import { EmailThread } from './EmailThread';
import { TasksTab } from './TasksTab';
import { CommentsTab } from './CommentsTab';
import { dormantIn, EngagedText, LaneText, money, RenewalText, splitList, StagePill, SyncText } from './company/parts';
import { cn } from '@/lib/utils';

const pct = (n: number) => `${Math.round(n * 100)}%`;

/* ── Overview ──────────────────────────────────────────────────────────────── */

/**
 * Share of wallet — stated vs observed vs booked monthly TEU. One hue (magnitude);
 * the booked bar is solid, the reference bars lighter. Values are labelled.
 */
function WalletCard({ org }: { org: Organization }) {
  const rows = [
    org.trade && { label: 'Trade data estimate', value: org.trade.estTeuPerMonth, note: 'TradeMo · estimated from shipment weight' },
    org.monthlyTeu !== undefined && { label: 'They told us', value: org.monthlyTeu, note: 'Monthly TEU on the company record' },
    org.history && { label: 'Booked with us', value: org.history.bookedTeuPerMonth, note: 'Calculated from won deals', solid: true },
  ].filter(Boolean) as { label: string; value: number; note: string; solid?: boolean }[];
  if (rows.length < 2 || !org.history) return null;

  const max = Math.max(...rows.map((r) => r.value), 1);
  const potential = org.trade?.estTeuPerMonth ?? org.monthlyTeu ?? 0;
  const share = potential ? org.history.bookedTeuPerMonth / potential : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share of wallet</CardTitle>
        <CardDescription>
          We carry about {pct(share)} of their {org.trade ? 'estimated' : 'stated'} monthly ocean volume
        </CardDescription>
      </CardHeader>
      <div className="space-y-2.5 px-4 py-3">
        {rows.map((r) => (
          <Hint key={r.label} label={r.label} value={`${r.value} TEU / month · ${r.note}`}>
            <div className="grid cursor-default grid-cols-[9rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-[12px]">
              <span className="text-muted">{r.label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-subtle">
                <span className={cn('block h-full rounded-full', r.solid ? 'bg-brand' : 'bg-brand/40')} style={{ width: `${(r.value / max) * 100}%` }} />
              </span>
              <span className="text-right text-ink tabular-nums">{r.value} TEU</span>
            </div>
          </Hint>
        ))}
      </div>
    </Card>
  );
}

function OverviewTab({ org }: { org: Organization }) {
  const h = org.history;
  const wr = winRate(org);
  const stated = statedLanes(org).map((l) => l.lane);
  const tradeLanes = org.trade?.profiles.flatMap((p) => p.lanes) ?? [];
  const hidden = [...new Set(tradeLanes.filter((l) => !stated.includes(l.name)).map((l) => l.name))];
  const hiddenServed = hidden.filter((l) => servedLanes.has(l));
  const unservedStated = stated.filter((l) => !servedLanes.has(l));
  const lostLanes = (h?.lanes ?? []).filter((l) => l.quotes >= 2 && l.won / l.quotes < 0.35);
  const peaks = org.trade?.profiles[0] ? peakMonths(org.trade.profiles[0].monthly) : [];
  const renewalDays = org.contractRenewalDate ? daysFromToday(org.contractRenewalDate) : null;
  const dormant = dormantIn(org);

  return (
    <TabBody title="Overview" description={org.aiSummaryAt ? `AI summary · generated ${org.aiSummaryAt}` : undefined}>
      {org.aiSummary && (
        <Card className="space-y-2 p-4">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-atlas" />
            <span className="text-[12px] text-atlas">AI summary</span>
          </div>
          <p className="text-[14px] leading-relaxed text-ink/90">{org.aiSummary}</p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Booked TEU / month" value={h ? String(h.bookedTeuPerMonth) : '—'} sub="calculated from won deals" tone={h?.bookedTeuPerMonth ? undefined : 'faint'} />
        <Stat
          label="Win rate"
          value={wr === null ? '—' : pct(wr)}
          sub={h ? `${h.lanes.reduce((a, l) => a + l.won, 0)} of ${h.lanes.reduce((a, l) => a + l.quotes, 0)} quotes won` : 'no quotes yet'}
          tone={wr === null ? 'faint' : wr >= 0.5 ? 'success' : 'warm'}
        />
        <Stat label="Revenue YTD" value={h?.revenueYtd ? money(h.revenueYtd) : '—'} tone={h?.revenueYtd ? undefined : 'faint'} />
        <Stat label="Margin YTD" value={h?.marginYtd ? money(h.marginYtd) : '—'} sub={h?.revenueYtd ? `${pct(h.marginYtd / h.revenueYtd)} of revenue` : undefined} tone={h?.marginYtd ? undefined : 'faint'} />
      </div>

      <WalletCard org={org} />

      <Card>
        <CardHeader>
          <CardTitle>Signals</CardTitle>
          <CardDescription>Where the next shipment can come from</CardDescription>
        </CardHeader>
        <div className="divide-y divide-line px-4">
          {renewalDays !== null && renewalDays >= 0 && (
            <Signal
              icon={CalendarClock}
              tone={renewalDays <= 90 ? 'watch' : 'neutral'}
              title={`Contract renews ${fmtDate(org.contractRenewalDate)} (in ${renewalDays} days)`}
              detail={renewalDays <= 90 ? 'They re-tender with their current forwarder — send a renewal proposal before then.' : 'Not in the renewal window yet.'}
            />
          )}
          {dormant !== null && (
            <Signal icon={TrendingDown} tone="watch" title={`Turns Dormant in ${dormant} days`} detail={`No enquiry since ${fmtDate(org.lastEnquiryDate)}. A check-in call usually surfaces the next shipment.`} />
          )}
          {hidden.length > 0 && (
            <Signal
              icon={Compass}
              tone={hiddenServed.length ? 'good' : 'neutral'}
              title={`${hidden.length} lane${hidden.length === 1 ? '' : 's'} in trade data they haven't mentioned`}
              detail={`${hidden.join(', ')}.${hiddenServed.length ? ` We serve ${hiddenServed.join(', ')} — ask for these.` : ''}`}
            />
          )}
          {lostLanes.length > 0 && (
            <Signal
              icon={TrendingDown}
              tone="watch"
              title={`Losing on ${lostLanes.map((l) => l.lane).join(', ')}`}
              detail={lostLanes.map((l) => `${l.won} of ${l.quotes} won${l.lastRate ? `, last rate $${l.lastRate.toLocaleString('en-US')}/TEU` : ''}`).join('; ') + '. Check the buy rate before re-quoting.'}
            />
          )}
          {unservedStated.length > 0 && (
            <Signal icon={Route} title={`Not in our network: ${unservedStated.join(', ')}`} detail="Quote through a partner, or focus on the lanes we serve." />
          )}
          {peaks.length > 0 && (
            <Signal icon={CalendarRange} tone="watch" title={`Peaks in ${peaks.join(', ')}`} detail="Quote and secure space a month ahead of the peak." />
          )}
          {org.trade && org.trade.partnersInAtlas.length > 0 && (
            <Signal icon={Handshake} tone="good" title="Trades with our customers" detail={`${org.trade.partnersInAtlas.join(', ')} — already in Atlas. Use as the reference.`} />
          )}
          {!org.trade && <Signal icon={Database} title="No trade data linked" detail="Link a TradeMo profile to see lanes, volume and seasonality." />}
        </div>
      </Card>
    </TabBody>
  );
}

/* ── General ───────────────────────────────────────────────────────────────── */

const v = (x?: string | number) => (x === undefined || x === '' ? <span className="text-faint">—</span> : x);

function GeneralTab({ org }: { org: Organization }) {
  return (
    <TabBody title="General" description="Company details, address and relationship">
      <AttributeSection title="Company details">
        <AttributeRow label="Organization name">{org.name}</AttributeRow>
        <AttributeRow label="Company type">{org.companyType}</AttributeRow>
        <AttributeRow label="Business type" hint="How they trade">
          {org.businessType}
        </AttributeRow>
        <AttributeRow label="Industry">{v(org.industry)}</AttributeRow>
        <AttributeRow label="No. of employees">{v(org.noOfEmployees)}</AttributeRow>
        <AttributeRow label="Annual revenue">{v(org.annualRevenue)}</AttributeRow>
        <AttributeRow label="Website">{v(org.website)}</AttributeRow>
        <AttributeRow label="LinkedIn">{v(org.linkedinUrl)}</AttributeRow>
        <AttributeRow label="Territory">{v(org.territory)}</AttributeRow>
        <AttributeRow label="Credit days">{v(org.creditDays)}</AttributeRow>
      </AttributeSection>

      <AttributeSection title="Contact" description="General company lines">
        <AttributeRow label="Email">{v(org.email)}</AttributeRow>
        <AttributeRow label="Phone">{v(org.phone)}</AttributeRow>
        <AttributeRow label="Mobile">{v(org.mobileNo)}</AttributeRow>
      </AttributeSection>

      <AttributeSection title="Address">
        <AttributeRow label="Address">{v(org.address)}</AttributeRow>
        <AttributeRow label="State" hint="Copied from the linked Address so lists can filter by it">
          {v(org.state)}
        </AttributeRow>
        <AttributeRow label="Country">{org.country}</AttributeRow>
      </AttributeSection>

      <AttributeSection title="Relationship">
        <AttributeRow label="Account stage">
          <StagePill stage={org.accountStage} />
        </AttributeRow>
        <AttributeRow label="Customer since" lockedBy="System" hint="Set once, when the first deal reaches Quote sent">
          {fmtDate(org.customerSince)}
        </AttributeRow>
        <AttributeRow label="Last booking" lockedBy="Calculated" hint="Closed date of the latest Won deal">
          {fmtDate(org.lastBookingDate)}
        </AttributeRow>
        <AttributeRow label="Contract renewal date">
          <RenewalText iso={org.contractRenewalDate} />
        </AttributeRow>
      </AttributeSection>

      <AttributeSection title="Freightify sync">
        <AttributeRow label="Freightify company" lockedBy="Freightify">
          {v(org.freightifyCompanyId)}
        </AttributeRow>
        <AttributeRow label="Freightify sync" lockedBy="Freightify">
          <SyncText status={org.freightifySyncStatus} />
        </AttributeRow>
      </AttributeSection>
    </TabBody>
  );
}

/* ── Freight profile ───────────────────────────────────────────────────────── */

interface LaneRow {
  lane: string;
  stated?: string;
  tradeShare?: number;
  quotes?: number;
  won?: number;
  lastRate?: number;
}

/** One row per lane: what they told us, what trade data shows, and our history on it. */
function laneRows(org: Organization): LaneRow[] {
  const rows = new Map<string, LaneRow>();
  const get = (lane: string) => rows.get(lane) ?? rows.set(lane, { lane }).get(lane)!;
  statedLanes(org).forEach((l) => (get(l.lane).stated = l.mode ?? 'Yes'));
  org.trade?.profiles.forEach((p) => p.lanes.forEach((l) => (get(l.name).tradeShare = (get(l.name).tradeShare ?? 0) + l.share)));
  org.history?.lanes.forEach((l) => Object.assign(get(l.lane), { quotes: l.quotes, won: l.won, lastRate: l.lastRate }));
  return [...rows.values()].sort((a, b) => Number(!!b.stated) - Number(!!a.stated) || (b.tradeShare ?? 0) - (a.tradeShare ?? 0));
}

const LANE_GRID = 'grid grid-cols-[minmax(0,1.6fr)_5rem_6rem_5rem_6rem_6rem] items-center gap-3';

function FreightProfileTab({ org }: { org: Organization }) {
  const rows = laneRows(org);
  return (
    <TabBody title="Freight profile" description="What the customer told us, next to what trade data shows">
      <AttributeSection title="Stated profile" description="From the customer — trade data never writes here">
        <AttributeRow label="Trade lanes">
          {statedLanes(org).length ? (
            <span className="flex flex-col gap-0.5">
              {statedLanes(org).map((l) => (
                <span key={l.lane} className="flex items-center gap-2">
                  <LaneText lane={l.lane} className="text-[14px]" />
                  {l.mode && <span className="text-[12px] text-faint">{l.mode}</span>}
                </span>
              ))}
            </span>
          ) : (
            v()
          )}
        </AttributeRow>
        <AttributeRow label="Monthly TEU" hint="As the customer states it — not the trade-data estimate">
          {v(org.monthlyTeu)}
        </AttributeRow>
        <AttributeRow label="Estimated monthly shipments">{v(org.estimatedMonthlyShipments)}</AttributeRow>
        <AttributeRow label="Main commodities">{v(org.mainCommodities)}</AttributeRow>
        <AttributeRow label="Typical modes">{v(org.typicalModes)}</AttributeRow>
        <AttributeRow label="Cargo types">{v(org.cargoTypes)}</AttributeRow>
        <AttributeRow label="Preferred carriers">{v(org.preferredCarriers)}</AttributeRow>
      </AttributeSection>

      <Card>
        <CardHeader>
          <CardTitle>Lanes</CardTitle>
          <CardDescription>Stated, observed and quoted — our history is calculated from deals</CardDescription>
        </CardHeader>
        {rows.length ? (
          <div className="overflow-x-auto">
            <div className="min-w-[640px] text-[12px]">
              <div className={cn(LANE_GRID, 'border-b border-line px-4 py-2 text-[10px] font-semibold tracking-[0.04em] text-faint uppercase')}>
                <span>Lane</span>
                <span>Told us</span>
                <span className="text-right">Trade data</span>
                <span className="text-center">We serve</span>
                <span className="text-right">Won / quoted</span>
                <span className="text-right">Last rate</span>
              </div>
              {rows.map((r) => (
                <div key={r.lane} className={cn(LANE_GRID, 'border-b border-line px-4 py-2 last:border-0')}>
                  <LaneText lane={r.lane} className="text-[14px]" />
                  <span className={r.stated ? 'text-ink' : 'text-faint'}>{r.stated ?? 'No'}</span>
                  <span className="text-right text-ink tabular-nums">{r.tradeShare !== undefined ? pct(r.tradeShare) : <span className="text-faint">—</span>}</span>
                  <span className="flex justify-center">
                    {servedLanes.has(r.lane) ? <Check size={14} className="text-success" aria-label="Yes" /> : <span className="text-faint">No</span>}
                  </span>
                  <span className="text-right tabular-nums">
                    {r.quotes ? (
                      <span className={r.won! / r.quotes >= 0.5 ? 'text-success' : 'text-warm'}>
                        {r.won} / {r.quotes}
                      </span>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </span>
                  <span className="text-right text-ink tabular-nums">{r.lastRate ? `$${r.lastRate.toLocaleString('en-US')}` : <span className="text-faint">—</span>}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <EmptyNote>No lanes yet — add what the customer ships, or link trade data.</EmptyNote>
          </div>
        )}
      </Card>

      <div className="flex items-baseline justify-between gap-3 pt-2">
        <h3 className="text-[16px] font-semibold text-ink">Trade data</h3>
        {org.trade && (
          <span className="flex items-center gap-1.5 text-[12px] text-faint">
            <Database size={12} /> TradeMo {org.trade.providerCompanyId} · {org.trade.period} · as of {org.trade.asOf}
          </span>
        )}
      </div>
      {org.trade && org.trade.profiles.length ? (
        <>
          <TradeProfileView profiles={org.trade.profiles} />
          {org.trade.partnersInAtlas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Trading partners in Atlas</CardTitle>
                <CardDescription>Their supplier or buyer is already our customer — a warm introduction</CardDescription>
              </CardHeader>
              <div className="flex flex-wrap gap-2 px-4 py-3">
                {org.trade.partnersInAtlas.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1.5 rounded-full border border-success/40 px-2.5 py-1 text-[12px] text-success">
                    <Handshake size={12} /> {p}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        <EmptyNote>No TradeMo profile linked to this company.</EmptyNote>
      )}
    </TabBody>
  );
}

/* ── Contacts: who handles what ────────────────────────────────────────────── */

function ContactsTab({ org, contacts, onOpenContact }: { org: Organization; contacts: ContactSummary[]; onOpenContact: (c: ContactSummary) => void }) {
  const modes = splitList(org.typicalModes);
  const handles = (c: ContactSummary, m: string) => splitList(c.modesHandled).some((x) => x.toLowerCase() === m.toLowerCase());

  return (
    <TabBody title="Contacts" description={`${contacts.length} people at ${org.name}`}>
      {modes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Who handles what</CardTitle>
            <CardDescription>Their typical modes, matched to the modes each contact handles</CardDescription>
          </CardHeader>
          <div className="divide-y divide-line px-4">
            {modes.map((m) => {
              const who = contacts.filter((c) => handles(c, m));
              return (
                <div key={m} className="flex items-center justify-between gap-3 py-2 text-[14px]">
                  <span className="text-muted">{m}</span>
                  {who.length ? (
                    <span className="truncate text-ink">{who.map((c) => c.name).join(', ')}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-warm">
                      <Info size={13} /> Nobody yet
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {contacts.length ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {contacts.map((c) => (
            <Card key={c.id} asChild interactive>
              <button onClick={() => onOpenContact(c)} className="flex w-full flex-col gap-2 p-4 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[14px] font-semibold text-ink">{c.name}</span>
                      {c.isPrimary && <span className="rounded-full border border-line px-1.5 text-[10px] text-faint">Primary</span>}
                    </div>
                    <div className="truncate text-[12px] text-muted">
                      {c.role}
                      {c.contactRole && ` · ${c.contactRole}`}
                    </div>
                  </div>
                  <span className="shrink-0 text-[12px]">
                    <EngagedText iso={c.lastEngagedAt} />
                  </span>
                </div>
                <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-[12px]">
                  <span className="text-faint">Modes</span>
                  <span className="truncate text-ink">{c.modesHandled ?? '—'}</span>
                  <span className="text-faint">Lanes</span>
                  <span className="truncate text-ink" title={c.lanesHandled}>
                    {c.lanesHandled ?? '—'}
                  </span>
                </div>
              </button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyNote>No contacts linked to this company yet.</EmptyNote>
      )}
    </TabBody>
  );
}

/* ── Tabs ──────────────────────────────────────────────────────────────────── */

/** Company record tabs — a variant of the shared RecordTabs with freight tabs. */
export function CompanyTabs({
  org,
  deals,
  contacts,
  onOpenDeal,
  onOpenContact,
}: {
  org: Organization;
  deals: DealSummary[];
  contacts: ContactSummary[];
  onOpenDeal: (d: DealSummary) => void;
  onOpenContact: (c: ContactSummary) => void;
}) {
  const orgDeals = deals.filter((d) => d.company === org.name);
  const people = contacts.filter((c) => c.organizationId === org.id);

  return (
    <RecordTabs
      tabs={[
        { key: 'overview', label: 'Overview', icon: LayoutDashboard, content: <OverviewTab org={org} /> },
        { key: 'general', label: 'General', icon: Ticket, content: <GeneralTab org={org} /> },
        { key: 'freight', label: 'Freight profile', icon: Route, content: <FreightProfileTab org={org} /> },
        {
          key: 'deals',
          label: 'Deals',
          icon: Briefcase,
          count: orgDeals.length,
          content: <AssociatedDealsTab deals={orgDeals} title="Deals" forName={org.name} onOpenDeal={onOpenDeal} />,
        },
        { key: 'contacts', label: 'Contacts', icon: Users, count: people.length, content: <ContactsTab org={org} contacts={people} onOpenContact={onOpenContact} /> },
        {
          key: 'emails',
          label: 'Emails',
          icon: Mail,
          count: messages.filter((m) => m.status !== 'draft-pending').length,
          content: <EmailThread />,
        },
        { key: 'tasks', label: 'Tasks', icon: ListTodo, content: <TasksTab forName={org.name} /> },
        { key: 'notes', label: 'Notes', icon: StickyNote, count: comments.length, content: <CommentsTab /> },
      ]}
    />
  );
}
