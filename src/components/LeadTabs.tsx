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
} from '../data/leads';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RecordTabs } from './record/RecordTabs';
import { Chips, Signal, Stat, TabBody } from './record/RecordParts';
import { TradeProfileView } from './record/TradeProfileView';
import { AttributeRow, AttributeSection } from './record/AttributeList';
import { EmailThread } from './EmailThread';
import { TasksTab } from './TasksTab';
import { CommentsTab } from './CommentsTab';
import { FitBadge } from './lead/parts';

const money = (n: number) => `$${n.toLocaleString('en-US')}`;

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

function TradeProfileTab({ lead }: { lead: LeadSummary }) {
  return (
    <TabBody
      title="Trade profile"
      description={
        <span className="flex items-center gap-1.5">
          <Database size={12} /> TradeMo · trade period {lead.tradePeriod} · data as of {lead.tradeAsOf}
        </span>
      }
    >
      <TradeProfileView profiles={tradeProfiles(lead)} />
    </TabBody>
  );
}

/* ── Match details (SDR search) ────────────────────────────────────────────── */

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
