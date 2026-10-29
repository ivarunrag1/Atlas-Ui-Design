import { Briefcase, Building2, Clock, Files, LayoutDashboard, ListTodo, Mail, ScanSearch, Sparkles, StickyNote, Target } from 'lucide-react';
import { messages, documents, comments } from '../data/deal';
import type { ContactSummary } from '../data/contacts';
import type { DealSummary } from '../data/deals';
import type { Organization } from '../data/organizations';
import { daysFromToday, fmtDate } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RecordTabs } from './record/RecordTabs';
import { AttributeRow, AttributeSection } from './record/AttributeList';
import { EmptyNote, Signal, Stat, TabBody } from './record/RecordParts';
import { AssociatedDealsTab } from './AssociatedDealsTab';
import { EmailThread } from './EmailThread';
import { TasksTab } from './TasksTab';
import { CommentsTab } from './CommentsTab';
import { DocumentsTab } from './DocumentsTab';
import { splitList } from './company/parts';

const pct = (n: number) => `${Math.round(n * 100)}%`;

/* ── Overview ──────────────────────────────────────────────────────────────── */

function OverviewTab({ contact, org }: { contact: ContactSummary; org?: Organization }) {
  const t = contact.track;
  const acceptance = t && t.quotesReceived ? t.quotesAccepted / t.quotesReceived : null;
  const idle = contact.lastEngagedAt ? -daysFromToday(contact.lastEngagedAt) : null;
  const companyModes = splitList(org?.typicalModes);
  const mine = splitList(contact.modesHandled).map((m) => m.toLowerCase());
  const otherModes = companyModes.filter((m) => !mine.includes(m.toLowerCase()));

  return (
    <TabBody title="Overview" description={contact.aiSummary ? `AI summary · generated ${contact.aiSummaryAt}` : undefined}>
      {contact.aiSummary ? (
        <Card className="space-y-2 p-4">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-atlas" />
            <span className="text-[12px] text-atlas">AI summary</span>
          </div>
          <p className="text-[14px] leading-relaxed text-ink/90">{contact.aiSummary}</p>
        </Card>
      ) : (
        <EmptyNote>No AI summary yet — it's generated once there is activity with this contact.</EmptyNote>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Quotes received" value={t ? String(t.quotesReceived) : '—'} sub="calculated from deals" tone={t ? undefined : 'faint'} />
        <Stat label="Quotes accepted" value={t ? String(t.quotesAccepted) : '—'} tone={t ? undefined : 'faint'} />
        <Stat
          label="Acceptance rate"
          value={acceptance === null ? '—' : pct(acceptance)}
          tone={acceptance === null ? 'faint' : acceptance >= 0.5 ? 'success' : 'warm'}
        />
        <Stat label="Avg. reply time" value={t ? `${t.avgReplyHours} h` : '—'} sub="to our emails" tone={t ? undefined : 'faint'} />
      </div>

      <AttributeSection title="Freight responsibility" description="What to send this person">
        <AttributeRow label="Contact role">{contact.contactRole ?? '—'}</AttributeRow>
        <AttributeRow label="Modes handled" hint="FCL, LCL, Air, FTL, LTL">
          {contact.modesHandled ?? '—'}
        </AttributeRow>
        <AttributeRow label="Lanes handled">{contact.lanesHandled ?? '—'}</AttributeRow>
      </AttributeSection>

      {org?.trade && (
        <AttributeSection title="Company trade" description={`Read from ${org.name} · TradeMo · as of ${org.trade.asOf}`}>
          <AttributeRow label="Trade direction" lockedBy="TradeMo">
            {org.trade.direction}
          </AttributeRow>
          <AttributeRow label="Primary product" lockedBy="TradeMo">
            {org.trade.primaryProduct}
          </AttributeRow>
          <AttributeRow label="Shipments (12 mo)" lockedBy="TradeMo">
            {org.trade.totalShipments.toLocaleString('en-US')}
          </AttributeRow>
        </AttributeSection>
      )}

      {/* Research (ZoomInfo) — read-only, refreshed on re-enrich */}
      {contact.enrichment ? (
        <AttributeSection title="Research" description={`ZoomInfo · enriched on ${fmtDate(contact.enrichedAt)}`}>
          <AttributeRow label="Title" lockedBy="ZoomInfo">
            {contact.enrichment.title}
          </AttributeRow>
          <AttributeRow label="Seniority" lockedBy="ZoomInfo">
            {contact.enrichment.seniority}
          </AttributeRow>
          <AttributeRow label="Department" lockedBy="ZoomInfo">
            {contact.enrichment.department}
          </AttributeRow>
          <AttributeRow label="Time in role" lockedBy="ZoomInfo">
            {contact.enrichment.tenure ?? '—'}
          </AttributeRow>
          <AttributeRow label="LinkedIn" lockedBy="ZoomInfo">
            {contact.enrichment.linkedin ?? '—'}
          </AttributeRow>
        </AttributeSection>
      ) : (
        <Card className="flex items-center justify-between gap-4 p-4">
          <div className="flex min-w-0 items-start gap-3">
            <ScanSearch size={16} className="mt-0.5 shrink-0 text-muted" />
            <div className="min-w-0">
              <div className="text-[14px] text-ink">Not enriched yet</div>
              <div className="text-[12px] text-faint">Pull title, seniority and LinkedIn from ZoomInfo. Uses one credit; skipped if this person was enriched before.</div>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="shrink-0">
            <ScanSearch size={14} /> Enrich
          </Button>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Signals</CardTitle>
          <CardDescription>How to work with this person</CardDescription>
        </CardHeader>
        <div className="divide-y divide-line px-4">
          <Signal
            icon={Clock}
            tone={idle === null ? 'neutral' : idle <= 14 ? 'good' : 'watch'}
            title={idle === null ? 'Never engaged' : idle <= 14 ? 'Recently engaged' : `No contact for ${idle} days`}
            detail={idle !== null && idle > 14 ? 'Send an update before the relationship cools — a rate or schedule change is a natural reason.' : 'Keep the cadence going.'}
          />
          {contact.modesHandled && (
            <Signal icon={Target} title={`Send them ${contact.modesHandled} quotes`} detail={contact.lanesHandled ? `Handles ${contact.lanesHandled}.` : 'Lanes not recorded yet.'} />
          )}
          {otherModes.length > 0 && org && (
            <Signal
              icon={Building2}
              title={`${org.name} also ships ${otherModes.join(', ')}`}
              detail="Someone else handles these — see the company's Contacts tab for who, or ask this contact for an introduction."
            />
          )}
        </div>
      </Card>
    </TabBody>
  );
}

/* ── Tabs ──────────────────────────────────────────────────────────────────── */

/** Contact record tabs — a configuration of the shared RecordTabs. */
export function ContactTabs({
  contact,
  org,
  deals,
  onOpenDeal,
}: {
  contact: ContactSummary;
  org?: Organization;
  deals: DealSummary[];
  onOpenDeal: (d: DealSummary) => void;
}) {
  const myDeals = deals.filter((d) => d.contactEmail === contact.email);
  return (
    <RecordTabs
      tabs={[
        { key: 'overview', label: 'Overview', icon: LayoutDashboard, content: <OverviewTab contact={contact} org={org} /> },
        {
          key: 'deals',
          label: 'Associated deals',
          icon: Briefcase,
          count: myDeals.length,
          content: <AssociatedDealsTab deals={myDeals} forName={contact.name} onOpenDeal={onOpenDeal} />,
        },
        {
          key: 'emails',
          label: 'Emails',
          icon: Mail,
          count: messages.filter((m) => m.status !== 'draft-pending').length,
          content: <EmailThread />,
        },
        { key: 'tasks', label: 'Tasks', icon: ListTodo, count: contact.tasks, content: <TasksTab forName={contact.name} /> },
        { key: 'notes', label: 'Notes', icon: StickyNote, count: comments.length, content: <CommentsTab /> },
        { key: 'files', label: 'Files', icon: Files, count: documents.length, content: <DocumentsTab /> },
      ]}
    />
  );
}

