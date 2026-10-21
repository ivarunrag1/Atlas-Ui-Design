import {
  CalendarRange,
  Database,
  ExternalLink,
  Handshake,
  LayoutDashboard,
  ListTodo,
  Mail,
  Route,
  Search,
  ShieldAlert,
  Sparkles,
  StickyNote,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { messages, comments } from '../data/deal';
import {
  laneCoverage,
  peakMonths,
  servedLanes,
  tradeProfiles,
  usdOrUndisclosed,
  walletEstimate,
  type LeadSummary,
  type ShareRow,
} from '../data/leads';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionLabel } from '@/components/ui/field';
import { RecordTabs } from './record/RecordTabs';
import { AttributeRow, AttributeSection } from './record/AttributeList';
import { EmailThread } from './EmailThread';
import { TasksTab } from './TasksTab';
import { CommentsTab } from './CommentsTab';
import { FitBadge, SeasonalityChart, ShareBars } from './lead/parts';
import { cn } from '@/lib/utils';

const money = (n: number) => `$${n.toLocaleString('en-US')}`;

/** Tab body wrapper — header line + scrolling content, like the other record tabs. */
function TabBody({ title, description, children }: { title: string; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="border-b border-line px-5 py-3">
        <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
        {description && <p className="text-[12px] text-faint">{description}</p>}
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'success' | 'warm' | 'faint' }) {
  return (
    <Card className="flex flex-col gap-1.5 p-3">
      <SectionLabel as="div">{label}</SectionLabel>
      <span
        className={cn(
          'text-[18px] leading-none tabular-nums',
          tone === 'success' ? 'text-success' : tone === 'warm' ? 'text-warm' : tone === 'faint' ? 'text-faint' : 'text-ink',
        )}
      >
        {value}
      </span>
      {sub && <span className="text-[12px] text-muted">{sub}</span>}
    </Card>
  );
}

/** A freight signal: icon + headline + detail. */
function Signal({ icon: Icon, title, detail, tone = 'neutral' }: { icon: LucideIcon; title: string; detail: string; tone?: 'good' | 'watch' | 'neutral' }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span
        className={cn(
          'grid size-7 shrink-0 place-items-center rounded-lg border',
          tone === 'good' ? 'border-success/40 text-success' : tone === 'watch' ? 'border-warm/50 text-warm' : 'border-line text-muted',
        )}
      >
        <Icon size={14} />
      </span>
      <div className="min-w-0">
        <div className="text-[14px] text-ink">{title}</div>
        <div className="text-[12px] text-muted">{detail}</div>
      </div>
    </div>
  );
}

const handling: Record<string, string> = {
  Reefer: 'Reefer cargo — check reefer allocation and plugs at origin before pitching.',
  DG: 'Dangerous goods — DG documentation and carrier DG acceptance on the lane are a must.',
  OOG: 'Out of gauge — flat-rack / open-top equipment and project handling needed.',
};

/* ── Overview: why this lead ───────────────────────────────────────────────── */

function OverviewTab({ lead }: { lead: LeadSummary }) {
  const coverage = laneCoverage(lead);
  const wallet = walletEstimate(lead);
  const servedCount = lead.tradeLanes.filter((t) => servedLanes.has(t.name)).length;
  const peaks = peakMonths(lead);

  return (
    <TabBody title="Why this lead" description={`AI summary · generated ${lead.aiSummaryAt}`}>
      <Card className="space-y-2 p-4">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-atlas" />
          <span className="text-[12px] text-atlas">{lead.matchReason}</span>
          <span className="ml-auto">
            <FitBadge fit={lead.matchFit} />
          </span>
        </div>
        <p className="text-[14px] leading-relaxed text-ink/90">{lead.aiSummary}</p>
      </Card>

      <div className="grid grid-cols-2 gap-3 @container lg:grid-cols-4">
        <Stat
          label="Est. freight spend"
          value={wallet ? `≈ ${money(wallet)}` : '—'}
          sub={wallet ? 'per month on lanes we serve' : 'no lanes in our network'}
          tone={wallet ? undefined : 'faint'}
        />
        <Stat label="Est. TEU / month" value={String(lead.estTeuPerMonth)} sub="from avg. monthly weight" />
        <Stat
          label="Lane coverage"
          value={`${Math.round(coverage * 100)}%`}
          sub={`${servedCount} of ${lead.tradeLanes.length} lanes we serve`}
          tone={coverage >= 0.6 ? 'success' : coverage > 0 ? 'warm' : 'faint'}
        />
        <Stat label="Matching shipments" value={lead.matchedShipments.toLocaleString('en-US')} sub="last 12 months" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Signals</CardTitle>
          <CardDescription>What a forwarder should know before reaching out</CardDescription>
        </CardHeader>
        <div className="divide-y divide-line px-4">
          <Signal
            icon={Route}
            tone={coverage >= 0.6 ? 'good' : coverage > 0 ? 'watch' : 'neutral'}
            title={servedCount ? `${servedCount} of ${lead.tradeLanes.length} lanes in our network` : 'No lanes in our network'}
            detail={`${Math.round(coverage * 100)}% of their trade runs on lanes we serve — ${lead.tradeLanes.map((t) => t.name).join(', ')}.`}
          />
          <Signal
            icon={ShieldAlert}
            tone={lead.cargoFlags.length ? 'watch' : 'neutral'}
            title={lead.cargoFlags.length ? `Special handling: ${lead.cargoFlags.join(', ')}` : 'Standard dry cargo'}
            detail={lead.cargoFlags.length ? lead.cargoFlags.map((f) => handling[f]).join(' ') : `${lead.cargoType} · ${lead.mainCommodities}.`}
          />
          <Signal
            icon={CalendarRange}
            tone={peaks.length ? 'watch' : 'neutral'}
            title={peaks.length ? `Peaks in ${peaks.join(', ')}` : 'Steady volume through the year'}
            detail={peaks.length ? 'Quote and secure space a month ahead of the peak.' : 'No strong seasonality in the last 12 months.'}
          />
          <Signal
            icon={Handshake}
            tone={lead.partnersOurCustomers.length ? 'good' : 'neutral'}
            title={lead.partnersOurCustomers.length ? 'Warm path through existing customers' : 'No mutual customers yet'}
            detail={
              lead.partnersOurCustomers.length
                ? `Trades with ${lead.partnersOurCustomers.join(', ')} — already our customers.`
                : 'None of their trading partners book with us today.'
            }
          />
          <Signal icon={Users} title={`Similar to ${lead.similarTo}`} detail="Use as the reference story in the first outreach." />
        </div>
      </Card>
    </TabBody>
  );
}

/* ── Trade profile ─────────────────────────────────────────────────────────── */

function ListCard({ title, rows, served }: { title: string; rows: ShareRow[]; served?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {served && <CardDescription>✓ = lane we serve</CardDescription>}
      </CardHeader>
      <div className="px-4 py-3">
        <ShareBars rows={rows} served={served ? (n) => servedLanes.has(n) : undefined} />
      </div>
    </Card>
  );
}

function TradeProfileTab({ lead }: { lead: LeadSummary }) {
  const profiles = tradeProfiles(lead);
  const [dir, setDir] = useState<'Export' | 'Import'>(profiles[0].direction);
  const p = profiles.find((x) => x.direction === dir) ?? profiles[0];
  const noun = p.direction === 'Export' ? 'Exports' : 'Imports';

  return (
    <TabBody
      title="Trade profile"
      description={
        <span className="flex items-center gap-1.5">
          <Database size={12} /> TradeMo · trade period {lead.tradePeriod} · data as of {lead.tradeAsOf}
        </span>
      }
    >
      {/* Exports and imports are separate data when the company trades both ways */}
      <div className="flex items-center justify-between gap-3">
        {profiles.length > 1 ? (
          <SegmentedControl
            aria-label="Trade direction"
            value={dir}
            onChange={setDir}
            options={profiles.map((x) => ({
              value: x.direction,
              label: `${x.direction === 'Export' ? 'Exports' : 'Imports'} · ${x.shipments.toLocaleString('en-US')}`,
            }))}
          />
        ) : (
          <span className="text-[12px] text-muted">{noun} only</span>
        )}
        <span className="text-[12px] text-faint">Showing {noun.toLowerCase()} · last 12 months</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={`${noun} shipments`} value={p.shipments.toLocaleString('en-US')} sub="12 months" />
        <Stat label={`${noun} value`} value={usdOrUndisclosed(p.value)} tone={p.value < 0 ? 'faint' : undefined} />
        <Stat label="Trading partners" value={String(p.partners)} />
        <Stat label="Est. TEU / month" value={String(p.estTeuPerMonth)} sub="estimate" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{noun} per month</CardTitle>
          <CardDescription>Shipments · last 12 months · darker = peak months</CardDescription>
        </CardHeader>
        <div className="px-4 py-3">
          <SeasonalityChart values={p.monthly} peaks={peakMonths(p.monthly)} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ListCard title="Trade lanes" rows={p.lanes} served />
        <ListCard title="HS codes" rows={p.hsCodes} />
        <ListCard title="Products" rows={p.products} />
        <ListCard title="Ports" rows={p.ports} />
        <ListCard title="Countries" rows={p.countries} />
      </div>
    </TabBody>
  );
}

/* ── Match details (SDR search) ────────────────────────────────────────────── */

function Chips({ items }: { items: string[] }) {
  return (
    <>
      {items.map((i) => (
        <span key={i} className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">
          {i}
        </span>
      ))}
    </>
  );
}

function MatchDetailsTab({ lead }: { lead: LeadSummary }) {
  const noSearch = lead.sdrSearchId === '—';
  return (
    <TabBody title="Match details" description="What the SDR search matched this company on — read-only">
      <AttributeSection title="Search" description="Where this lead came from">
        <AttributeRow label="SDR search" lockedBy="SDR agent">
          {noSearch ? (
            '—'
          ) : (
            <Button variant="link" size="xs" className="h-auto p-0 text-[14px] text-brand">
              {lead.sdrSearchId} <ExternalLink size={12} />
            </Button>
          )}
        </AttributeRow>
        <AttributeRow label="Searched for" lockedBy="SDR agent">
          {lead.searchRole}
        </AttributeRow>
        <AttributeRow label="Source" lockedBy="Rep">
          {lead.source}
        </AttributeRow>
        <AttributeRow label="Selected by / on" lockedBy="Rep">
          {lead.selectedBy} · {lead.selectedAt}
        </AttributeRow>
      </AttributeSection>

      <AttributeSection title="Match" description="The SDR agent's judgement">
        <AttributeRow label="Match fit" lockedBy="SDR agent">
          <FitBadge fit={lead.matchFit} />
        </AttributeRow>
        <AttributeRow label="Match reason" lockedBy="SDR agent">
          <span className="block truncate" title={lead.matchReason}>
            {lead.matchReason}
          </span>
        </AttributeRow>
        <AttributeRow label="Similar to" lockedBy="SDR agent">
          {lead.similarTo}
        </AttributeRow>
      </AttributeSection>

      <AttributeSection title="What matched" description="Trade data that met the search">
        <AttributeRow label="Matched HS codes" lockedBy="TradeMo">
          <span className="flex flex-wrap gap-1">
            <Chips items={lead.matchedHsCodes} />
          </span>
        </AttributeRow>
        {lead.matchedProducts.length > 0 && (
          <AttributeRow label="Matched products" lockedBy="TradeMo">
            <span className="flex flex-wrap gap-1">
              <Chips items={lead.matchedProducts} />
            </span>
          </AttributeRow>
        )}
        <AttributeRow label="Trade countries" lockedBy="TradeMo">
          <span className="flex flex-wrap gap-1">
            <Chips items={lead.matchedCountries} />
          </span>
        </AttributeRow>
        <AttributeRow label="Trade lanes" lockedBy="TradeMo">
          {lead.tradeLanes.map((t) => t.name).join(', ')}
        </AttributeRow>
      </AttributeSection>

      <AttributeSection title="Volume in scope" description="Matching trade only — not the company total">
        <AttributeRow label="Matching shipments" lockedBy="TradeMo">
          {lead.matchedShipments.toLocaleString('en-US')}
        </AttributeRow>
        <AttributeRow label="Matching shipment value" lockedBy="TradeMo">
          <span className={lead.matchedShipmentValue < 0 ? 'text-faint' : undefined}>{usdOrUndisclosed(lead.matchedShipmentValue)}</span>
        </AttributeRow>
        <AttributeRow label="Trading partners (in scope)" lockedBy="TradeMo">
          {lead.matchedPartnerCount}
        </AttributeRow>
      </AttributeSection>
    </TabBody>
  );
}

/* ── Tabs ──────────────────────────────────────────────────────────────────── */

/** Lead record tabs — a variant of the shared RecordTabs (same as Contacts) with freight tabs. */
export function LeadTabs({ lead }: { lead: LeadSummary }) {
  return (
    <RecordTabs
      tabs={[
        { key: 'overview', label: 'Overview', icon: LayoutDashboard, content: <OverviewTab lead={lead} /> },
        { key: 'trade', label: 'Trade profile', icon: Database, content: <TradeProfileTab lead={lead} /> },
        { key: 'match', label: 'Match details', icon: Search, content: <MatchDetailsTab lead={lead} /> },
        {
          key: 'emails',
          label: 'Emails',
          icon: Mail,
          count: messages.filter((m) => m.status !== 'draft-pending').length,
          content: <EmailThread />,
        },
        { key: 'tasks', label: 'Tasks', icon: ListTodo, count: lead.tasks, content: <TasksTab forName={lead.contactName} /> },
        { key: 'notes', label: 'Notes', icon: StickyNote, count: comments.length, content: <CommentsTab /> },
      ]}
    />
  );
}
