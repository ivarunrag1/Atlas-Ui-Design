import { useMemo, useState } from 'react';
import {
  AlarmClock,
  ArrowDownRight,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  Inbox,
  ListTodo,
  MessageSquareReply,
  Percent,
  Send,
  Sparkles,
  Target,
  Timer,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import type { DealSummary } from '../data/deals';
import { stageColor, stages } from '../data/deals';
import type { DealFieldValues } from '../data/dealFields';
import type { LeadSummary } from '../data/leads';
import type { Organization } from '../data/organizations';
import {
  buckets,
  DATA_START,
  daysIn,
  inRange,
  OTHER_REPS_OPEN_PIPELINE,
  OTHER_REPS_STAGE_COUNTS,
  presetRange,
  previousRange,
  series,
  summarize,
  TODAY_ISO,
  type Range,
  type RangePreset,
  type Scope,
  type Summary,
} from '../data/dashboard';
import { dealValueOf } from '../data/dealFields';
import { daysFromToday, fmtDate, TODAY } from '@/lib/dates';
import { useAgent } from '@/lib/agent-context';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Hint } from '@/components/ui/tooltip';
import { LineChart, Sparkline, StageBars } from './dashboard/charts';
import { AgentAvatar, AiAgentTag } from './AgentAvatar';
import type { AgentId } from '../data/agents';
import { buildPriorities, type Agent, type Level, type Priority } from './dashboard/priorities';
import { cn } from '@/lib/utils';

const ME = 'Varun Reddy';

const money = (n: number) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`);
const pct = (n: number) => `${Math.round(n * 100)}%`;
const hours = (h: number) => (h < 1 ? `${Math.round(h * 60)} min` : `${h.toFixed(1)} h`);

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: '7 days' },
  { value: 'month', label: '30 days' },
  { value: 'quarter', label: '90 days' },
  { value: 'custom', label: 'Custom' },
];

const AGENT_ID: Record<Agent, AgentId> = { Rhea: 'rhea', Max: 'max', Maya: 'maya' };

const AGENT_COLOR: Record<Agent, string> = {
  Rhea: 'var(--color-stage-blue)',
  Max: 'var(--color-stage-violet)',
  Maya: 'var(--color-stage-green)',
};

/* ── Small pieces ──────────────────────────────────────────────────────────── */

function Section({ title, description, action, children }: { title: string; description?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="t-subhead text-ink">{title}</h2>
          {description && <p className="text-[12px] text-faint">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * KPI tile — headline number + change vs the previous period. `better` says which
 * direction is good; rates show the change in points.
 */
function Kpi({
  icon: Icon,
  label,
  value,
  cur,
  prev,
  better = 'up',
  points = false,
  sub,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  cur: number;
  prev: number;
  better?: 'up' | 'down';
  points?: boolean;
  sub?: string;
  hint?: string;
}) {
  const diff = points ? (cur - prev) * 100 : prev ? ((cur - prev) / prev) * 100 : 0;
  const flat = Math.abs(diff) < 0.5;
  const good = flat ? null : (diff > 0) === (better === 'up');
  const Arrow = diff > 0 ? ArrowUpRight : ArrowDownRight;
  const tile = (
    <Card className="flex h-full flex-col gap-1.5 p-3">
      <MetricLabel icon={Icon} label={label} />
      <span className="text-[22px] leading-none text-ink tabular-nums">{value}</span>
      <span className="flex items-center gap-1 text-[12px]">
        {flat ? (
          <span className="text-faint">No change</span>
        ) : (
          <span className={cn('inline-flex items-center gap-0.5 tabular-nums', good ? 'text-success' : 'text-warm')}>
            <Arrow size={13} />
            {Math.abs(diff).toFixed(points ? 1 : 0)}
            {points ? ' pts' : '%'}
          </span>
        )}
        <span className="text-faint">{sub ?? 'vs previous'}</span>
      </span>
    </Card>
  );
  return hint ? (
    <Hint label={label} value={hint}>
      <div className="h-full">{tile}</div>
    </Hint>
  ) : (
    tile
  );
}

/** Metric label with its icon — the visual cue for what the number is. */
function MetricLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="grid size-6 shrink-0 place-items-center rounded-[6px] border border-line text-muted">
        <Icon size={13} />
      </span>
      <SectionLabel>{label}</SectionLabel>
    </span>
  );
}

function TodayTile({ icon: Icon, label, value, sub, tone }: { icon: LucideIcon; label: string; value: number; sub?: string; tone?: 'urgent' }) {
  const hot = tone === 'urgent' && value > 0;
  return (
    <div className="flex flex-col gap-1 rounded-[6px] border border-line px-3 py-2.5">
      <span className="flex items-center gap-1.5 text-[12px] text-faint">
        <Icon size={13} className={hot ? 'text-danger' : 'text-muted'} />
        {label}
      </span>
      <span className={cn('text-[20px] leading-none tabular-nums', hot ? 'text-danger' : 'text-ink')}>{value}</span>
      {sub && <span className="text-[10px] text-faint">{sub}</span>}
    </div>
  );
}

function AgentTag({ agent }: { agent: Agent }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line py-0.5 pr-3 pl-0.5 text-[14px] font-medium text-muted">
      <AgentAvatar agent={AGENT_ID[agent]} size={32} />
      {agent}
      <AiAgentTag />
    </span>
  );
}

function PriorityRow({ p, onOpen }: { p: Priority; onOpen: () => void }) {
  const Icon = p.icon;
  return (
    <button onClick={onOpen} className="group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-subtle/40">
      <span
        className={cn(
          'mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border',
          p.level === 'Urgent' ? 'border-danger/40 text-danger' : 'border-warm/50 text-warm',
        )}
      >
        <Icon size={14} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] text-ink">{p.title}</span>
          <span className={cn('text-[10px] font-semibold tracking-[0.04em] uppercase', p.level === 'Urgent' ? 'text-danger' : 'text-warm')}>{p.level}</span>
        </span>
        <span className="mt-0.5 block text-[12px] text-muted">{p.detail}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <AgentTag agent={p.agent} />
        <ArrowRight size={14} className="text-faint group-hover:text-ink" />
      </span>
    </button>
  );
}

function AgentCard({
  agent,
  role,
  metrics,
  outcome,
  trend,
  trendLabel,
}: {
  agent: Agent;
  role: string;
  metrics: { label: string; value: string }[];
  outcome: string;
  trend: number[];
  trendLabel: string;
}) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2.5">
        <AgentAvatar agent={AGENT_ID[agent]} size={48} />
        <div>
          <div className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
            {agent}
            <AiAgentTag />
          </div>
          <div className="text-[12px] text-faint">{role}</div>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {metrics.map((m) => (
          <div key={m.label}>
            <dt className="text-[10px] text-faint">{m.label}</dt>
            <dd className="text-[16px] text-ink tabular-nums">{m.value}</dd>
          </div>
        ))}
      </dl>
      <div>
        <div className="mb-0.5 text-[10px] text-faint">{trendLabel}</div>
        <Sparkline values={trend} color={AGENT_COLOR[agent]} label={`${agent} · ${trendLabel}`} />
      </div>
      <p className="border-t border-line pt-2.5 text-[12px] text-muted">{outcome}</p>
    </Card>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────── */

/**
 * Dashboard — prioritized actions and today's activity for the signed-in rep, then
 * business KPIs, trends and what each agent contributed, for Mine or Team over any
 * past or custom range (with change vs the previous period of the same length).
 */
export function DashboardView({
  deals,
  fieldsFor,
  organizations,
  leads,
  onOpenDeal,
  onOpenCompany,
  onOpenLead,
}: {
  deals: DealSummary[];
  fieldsFor: (d: DealSummary) => DealFieldValues;
  organizations: Organization[];
  leads: LeadSummary[];
  onOpenDeal: (d: DealSummary) => void;
  onOpenCompany: (o: Organization) => void;
  onOpenLead: (l: LeadSummary) => void;
}) {
  const { askAtlas } = useAgent();
  const [scope, setScope] = useState<Scope>('mine');
  const [preset, setPreset] = useState<RangePreset>('month');
  const [custom, setCustom] = useState<Range>(presetRange('month'));
  const [level, setLevel] = useState<'all' | Level>('all');

  const range: Range = preset === 'custom' ? custom : presetRange(preset);
  const prev = previousRange(range);
  const rows = inRange(series[scope], range);
  const cur = summarize(rows);
  const was = summarize(inRange(series[scope], prev));
  const trend = buckets(rows);

  const myOpen = deals.filter((d) => d.owner === ME && d.stage !== 'Won');
  const openPipeline = myOpen.reduce((a, d) => a + dealValueOf(d), 0) + (scope === 'team' ? OTHER_REPS_OPEN_PIPELINE : 0);
  const stageRows = stages.map((st) => ({
    label: st,
    color: stageColor[st],
    value: deals.filter((d) => d.owner === ME && d.stage === st).length + (scope === 'team' ? OTHER_REPS_STAGE_COUNTS[st] : 0),
  }));

  // Prioritized for you — always the signed-in rep, from live records
  const priorities = useMemo(() => buildPriorities({ deals, fieldsFor, organizations, leads, owner: ME }), [deals, fieldsFor, organizations, leads]);
  const urgent = priorities.filter((p) => p.level === 'Urgent').length;
  const high = priorities.length - urgent;
  const shown = level === 'all' ? priorities : priorities.filter((p) => p.level === level);
  const today = summarize(inRange(series.mine, { from: TODAY_ISO, to: TODAY_ISO }));
  const followupsDue = myOpen.filter((d) => {
    const f = fieldsFor(d).next_followup_at;
    return f && daysFromToday(f) <= 0;
  }).length;
  const repliesWaiting = myOpen.filter((d) => d.alert).length;
  const tasksDue = myOpen.filter((d) => /today/i.test(d.nextTask.when)).length;

  const open = (p: Priority) =>
    p.target.kind === 'deal' ? onOpenDeal(p.target.deal) : p.target.kind === 'company' ? onOpenCompany(p.target.org) : onOpenLead(p.target.lead);

  const rangeLabel =
    preset === 'custom' ? `${fmtDate(range.from)} – ${fmtDate(range.to)}` : preset === 'today' ? 'Today' : `Last ${daysIn(range)} days`;
  const scopeLabel = scope === 'mine' ? 'My metrics' : 'Team';

  const brief = briefLines(cur, was, rangeLabel, priorities[0]);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-6 py-3">
        <div className="flex items-baseline gap-2">
          <h1 className="t-page text-ink">Dashboard</h1>
          <span className="text-[12px] text-faint">
            Good morning, Varun · {TODAY.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </header>

      <div className="flex-1 space-y-8 overflow-y-auto px-6 py-5">
        {/* ── Prioritized for you ── */}
        <Section title="Prioritized for you">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <TodayTile icon={Inbox} label="New enquiries today" value={today.enquiries} sub="received so far" />
            <TodayTile icon={Send} label="Quotes sent today" value={today.quotes} sub={`${today.quotesAuto} by Max`} />
            <TodayTile icon={AlarmClock} label="Follow-ups due" value={followupsDue} sub="today or overdue" tone="urgent" />
            <TodayTile icon={MessageSquareReply} label="Replies waiting" value={repliesWaiting} sub="customers who wrote back" tone="urgent" />
            <TodayTile icon={ListTodo} label="Tasks due today" value={tasksDue} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Card className="flex flex-col overflow-hidden">
              {/* Header: count + Urgent / High filter */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
                <span className="flex items-baseline gap-2">
                  <span className="text-[14px] font-semibold text-ink">Actions</span>
                  <span className="rounded-full border border-line px-1.5 text-[10px] font-semibold text-faint tabular-nums">{shown.length}</span>
                </span>
                <SegmentedControl
                  aria-label="Filter actions"
                  size="xs"
                  value={level}
                  onChange={setLevel}
                  options={[
                    { value: 'all', label: `All · ${priorities.length}` },
                    { value: 'Urgent', label: `Urgent · ${urgent}` },
                    { value: 'High', label: `High · ${high}` },
                  ]}
                />
              </div>
              {/* Scrollable list */}
              <div className="max-h-[360px] divide-y divide-line overflow-y-auto">
                {shown.map((p) => (
                  <PriorityRow key={p.id} p={p} onOpen={() => open(p)} />
                ))}
                {shown.length === 0 && <div className="px-4 py-8 text-center text-[12px] text-faint">Nothing here — you're clear.</div>}
              </div>
            </Card>

            {/* AI brief */}
            <Card className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-atlas" />
                <span className="text-[14px] font-semibold text-ink">AI summary</span>
              </div>
              <ul className="space-y-2 text-[14px] leading-relaxed text-ink/90">
                {brief.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <Button
                variant="secondary"
                size="sm"
                className="mt-auto self-start"
                onClick={() =>
                  askAtlas({
                    label: `Dashboard · ${scopeLabel} · ${rangeLabel}`,
                    hint: 'Ask about these numbers — what changed, why, and what to do next.',
                    suggestions: ['Why did win rate change?', 'Which lanes are losing quotes?', 'What should I do first today?'],
                  })
                }
              >
                <Sparkles size={14} /> Ask Atlas
              </Button>
            </Card>
          </div>
        </Section>

        {/* ── Range + scope (drives everything below) ── */}
        <div className="sticky -top-5 z-10 -mx-6 flex flex-wrap items-center justify-between gap-3 border-y border-line bg-surface px-6 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              aria-label="Whose metrics"
              value={scope}
              onChange={setScope}
              options={[
                { value: 'mine', label: 'My metrics' },
                { value: 'team', label: 'Team' },
              ]}
            />
            <SegmentedControl aria-label="Time range" value={preset} onChange={setPreset} options={PRESETS} />
            {preset === 'custom' && (
              <span className="flex items-center gap-1.5">
                <Input
                  type="date"
                  size="sm"
                  aria-label="From"
                  value={custom.from}
                  min={DATA_START}
                  max={custom.to}
                  onChange={(e) => e.target.value && setCustom((r) => ({ ...r, from: e.target.value }))}
                  className="w-36"
                />
                <span className="text-faint">–</span>
                <Input
                  type="date"
                  size="sm"
                  aria-label="To"
                  value={custom.to}
                  min={custom.from}
                  max={TODAY_ISO}
                  onChange={(e) => e.target.value && setCustom((r) => ({ ...r, to: e.target.value }))}
                  className="w-36"
                />
              </span>
            )}
          </div>
          <span className="flex items-center gap-1.5 text-[12px] text-faint">
            <CalendarDays size={13} />
            {rangeLabel} · compared with {fmtDate(prev.from)} – {fmtDate(prev.to)}
          </span>
        </div>

        {/* ── Business metrics ── */}
        <Section title="Business metrics" description={`${scopeLabel} · ${rangeLabel}`}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Hint label="Open pipeline" value="Value of open deals right now — not tied to the range">
              <div>
                <Card className="flex h-full flex-col gap-1.5 p-3">
                  <MetricLabel icon={Briefcase} label="Open pipeline" />
                  <span className="text-[22px] leading-none text-ink tabular-nums">{money(openPipeline)}</span>
                  <span className="text-[12px] text-faint">{stageRows.slice(0, 5).reduce((a, r) => a + r.value, 0)} open deals · now</span>
                </Card>
              </div>
            </Hint>
            <Kpi icon={Trophy} label="Won" value={money(cur.wonValue)} cur={cur.wonValue} prev={was.wonValue} sub={`${cur.won} deals · vs previous`} />
            <Kpi
              icon={ArrowRightLeft}
              label="Enquiry → quote"
              value={pct(cur.enquiryToQuote)}
              cur={cur.enquiryToQuote}
              prev={was.enquiryToQuote}
              points
              hint={`${cur.quotes} quotes sent from ${cur.enquiries} enquiries`}
            />
            <Kpi icon={Target} label="Win rate" value={pct(cur.winRate)} cur={cur.winRate} prev={was.winRate} points hint={`${cur.won} won of ${cur.quotes} quoted`} />
            <Kpi icon={Timer} label="Time to quote" value={hours(cur.ttqH)} cur={cur.ttqH} prev={was.ttqH} better="down" hint="Median time from enquiry received to first quote sent" />
            <Kpi icon={Percent} label="Margin" value={pct(cur.marginPct)} cur={cur.marginPct} prev={was.marginPct} points hint={`${money(cur.margin)} margin on won deals`} />
          </div>
        </Section>

        {/* ── Trends ── */}
        <Section title="Trends" description={trend.length > 31 ? 'Weekly' : trend.length > 1 ? 'Daily' : undefined}>
          {trend.length < 2 ? (
            <Card className="px-4 py-8 text-center text-[12px] text-faint">Pick a longer range to see trends.</Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Is the pipeline growing?</CardTitle>
                  <CardDescription>Enquiries received, quotes sent and deals won</CardDescription>
                </CardHeader>
                <div className="px-4 py-3">
                  <LineChart
                    labels={trend.map((b) => b.label)}
                    series={[
                      { key: 'enq', label: 'Enquiries', color: 'var(--color-stage-blue)', values: trend.map((b) => summarize(b.rows).enquiries) },
                      { key: 'quo', label: 'Quotes sent', color: 'var(--color-stage-violet)', values: trend.map((b) => summarize(b.rows).quotes) },
                      { key: 'won', label: 'Won', color: 'var(--color-stage-green)', values: trend.map((b) => summarize(b.rows).won) },
                    ]}
                  />
                </div>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Are we quoting faster?</CardTitle>
                  <CardDescription>Median hours from enquiry to first quote · Max vs manual</CardDescription>
                </CardHeader>
                <div className="px-4 py-3">
                  <LineChart
                    labels={trend.map((b) => b.label)}
                    format={(n) => `${+n.toFixed(1)}h`}
                    series={[
                      { key: 'max', label: 'Max (automatic)', color: 'var(--color-stage-violet)', values: trend.map((b) => +summarize(b.rows).ttqAutoH.toFixed(1)) },
                      { key: 'man', label: 'Manual', color: 'var(--color-stage-slate)', values: trend.map((b) => +summarize(b.rows).ttqManualH.toFixed(1)) },
                    ]}
                  />
                </div>
              </Card>
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle>Where are deals sitting?</CardTitle>
                  <CardDescription>Deals per stage right now · {scopeLabel.toLowerCase()}</CardDescription>
                </CardHeader>
                <div className="px-4 py-3">
                  <StageBars rows={stageRows} />
                </div>
              </Card>
            </div>
          )}
        </Section>

        {/* ── Agents ── */}
        <Section title="How the agents helped" description={`${scopeLabel} · ${rangeLabel}`}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <AgentCard
              agent="Rhea"
              role="SDR agent · finds and qualifies leads"
              metrics={[
                { label: 'Leads found', value: String(cur.rheaLeads) },
                { label: 'Became deals', value: String(cur.rheaConverted) },
                { label: 'Strong fit', value: pct(cur.rheaLeads ? cur.rheaStrong / cur.rheaLeads : 0) },
              ]}
              trend={trend.map((b) => summarize(b.rows).rheaLeads)}
              trendLabel="Leads found"
              outcome={`${pct(cur.leadToDeal)} of Rhea's leads became deals (${was.leadToDeal ? `${pct(was.leadToDeal)} before` : 'no earlier data'}).`}
            />
            <AgentCard
              agent="Max"
              role="Sales & quote agent · quotes and follows up"
              metrics={[
                { label: 'Quotes sent', value: String(cur.quotesAuto) },
                { label: 'Share of quotes', value: pct(cur.quotes ? cur.quotesAuto / cur.quotes : 0) },
                { label: 'Follow-ups', value: String(cur.maxFollowups) },
              ]}
              trend={trend.map((b) => summarize(b.rows).quotesAuto)}
              trendLabel="Quotes sent automatically"
              outcome={`Max quotes in ${hours(cur.ttqAutoH)} vs ${hours(cur.ttqManualH)} manually${cur.ttqAutoH ? ` — ${Math.round(cur.ttqManualH / cur.ttqAutoH)}× faster` : ''}.`}
            />
            <AgentCard
              agent="Maya"
              role="CRM agent · keeps records current, raises risks"
              metrics={[
                { label: 'Records updated', value: cur.mayaRecords.toLocaleString('en-US') },
                { label: 'Alerts raised', value: String(cur.mayaAlerts) },
                { label: 'Acted on', value: pct(cur.mayaAlerts ? cur.mayaActed / cur.mayaAlerts : 0) },
              ]}
              trend={trend.map((b) => summarize(b.rows).mayaAlerts)}
              trendLabel="Alerts raised"
              outcome={`${cur.mayaSaved} at-risk deals moved forward after one of Maya's alerts.`}
            />
          </div>
        </Section>
      </div>
    </div>
  );
}

/** The Atlas brief — a few plain sentences built from the same numbers as the cards. */
function briefLines(cur: Summary, was: Summary, rangeLabel: string, top?: Priority) {
  const pts = (a: number, b: number) => {
    const d = Math.round((a - b) * 100);
    return d === 0 ? 'flat' : `${d > 0 ? 'up' : 'down'} ${Math.abs(d)} pts`;
  };
  const lines = [
    `${rangeLabel}: ${cur.enquiries} enquiries, ${cur.quotes} quotes sent (${cur.quotesAuto} by Max) and ${cur.won} deals won worth ${money(cur.wonValue)}.`,
    `Enquiry → quote is ${pct(cur.enquiryToQuote)} (${pts(cur.enquiryToQuote, was.enquiryToQuote)}); win rate ${pct(cur.winRate)} (${pts(cur.winRate, was.winRate)}).`,
    `Rhea turned ${cur.rheaConverted} leads into deals; Maya raised ${cur.mayaAlerts} risks and ${cur.mayaActed} were acted on.`,
  ];
  if (top) lines.push(`Start with: ${top.title}.`);
  return lines;
}
