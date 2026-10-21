import {
  ArrowLeftRight,
  ArrowRight,
  ArrowRightLeft,
  Briefcase,
  CalendarPlus,
  Check,
  Container,
  Hash,
  Mail,
  MapPin,
  Package,
  Phone,
  Route,
  Ship,
  Truck,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import { laneCoverage, servedLanes, type LeadSummary } from '../data/leads';
import { Button } from '@/components/ui/button';
import { InfoPane, InfoHeader, InfoSection, FactList, FactRow } from '@/components/ui/info-pane';
import { Hint } from '@/components/ui/tooltip';
import { FitBadge, StatusPill } from './lead/parts';
import { cn } from '@/lib/utils';

/**
 * Lead left pane — a variant of the record pane (same InfoPane parts as Contacts):
 * the 10-second verdict (fit, lanes, volume), contact, qualification and record.
 */
export function LeadInfoPane({
  lead,
  onConvert,
  onOpenDeal,
}: {
  lead: LeadSummary;
  onConvert: () => void;
  onOpenDeal: (dealId: string) => void;
}) {
  const coverage = laneCoverage(lead);
  const converted = lead.convertedTo;

  return (
    <InfoPane storageKey="atlas.leadInfoPane">
      <InfoHeader title={lead.company}>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusPill status={lead.status} />
          <Hint label="Match fit" value={lead.matchReason}>
            <span className="flex">
              <FitBadge fit={lead.matchFit} />
            </span>
          </Hint>
        </div>
        <p className="mt-2 text-[12px] leading-snug text-muted">{lead.matchReason}</p>
        {converted ? (
          <>
            <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => onOpenDeal(converted.dealId)}>
              Open deal {converted.dealId} <ArrowRight size={14} />
            </Button>
            <p className="mt-1.5 text-center text-[10px] text-faint">
              Converted · contact {converted.contactId} · company {converted.organizationId}
            </p>
          </>
        ) : (
          <Button size="sm" className="mt-3 w-full" disabled={lead.status === 'Unqualified'} onClick={onConvert}>
            <ArrowRightLeft size={14} /> Convert to deal
          </Button>
        )}
      </InfoHeader>

      {/* Lead fit — freight facts that decide whether it's worth chasing */}
      <InfoSection title="Lead fit">
        <FactList>
          <FactRow icon={Users} label="Similar to">
            {lead.similarTo}
          </FactRow>
          <FactRow icon={ArrowLeftRight} label="Trade direction">
            {lead.tradeDirection}
          </FactRow>
          <FactRow icon={Package} label="Primary product" title={lead.primaryProduct}>
            {lead.primaryProduct}
          </FactRow>
          <FactRow icon={Hash} label="HS code">
            {lead.primaryHs}
          </FactRow>
          <FactRow icon={Ship} label="Matching shipments" title="Shipments matching the search · last 12 months">
            {lead.matchedShipments.toLocaleString('en-US')}
          </FactRow>
          <FactRow icon={Container} label="Est. TEU / month" title="Estimated from average monthly weight — always an estimate">
            {lead.estTeuPerMonth}
          </FactRow>
          <div>
            <FactRow icon={Route} label="Lane coverage" title="Share of their trade on lanes we serve">
              <span className={cn(coverage >= 0.6 ? 'text-success' : coverage > 0 ? 'text-warm' : 'text-faint')}>
                {Math.round(coverage * 100)}%
              </span>
            </FactRow>
            {/* Lanes as a sub-list: lanes we serve highlighted, others muted */}
            <ul className="mt-1.5 space-y-1 border-l border-line pl-3 ml-[6px]">
              {lead.tradeLanes.map((t) => {
                const served = servedLanes.has(t.name);
                return (
                  <li key={t.name} className="flex items-center justify-between gap-3 text-[12px]">
                    <span
                      className={cn('flex min-w-0 items-center gap-1', served ? 'font-medium text-success' : 'text-faint')}
                      title={served ? 'Lane we serve' : 'Not in our network'}
                    >
                      {served && <Check size={11} className="shrink-0" />}
                      <span className="truncate">{t.name}</span>
                    </span>
                    <span className={cn('shrink-0 tabular-nums', served ? 'text-ink' : 'text-faint')}>{Math.round(t.share * 100)}%</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </FactList>
      </InfoSection>

      <InfoSection title="Contact">
        <div className="space-y-2 text-[12px]">
          <div className="flex items-center gap-2 text-ink">
            <User size={13} className="shrink-0 text-muted" />
            {lead.contactName} <span className="text-faint">· {lead.contactRole}</span>
          </div>
          <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-ink hover:underline">
            <Mail size={13} className="shrink-0 text-muted" />
            <span className="truncate">{lead.email}</span>
          </a>
          <div className="flex items-center gap-2 text-ink">
            <Phone size={13} className="shrink-0 text-muted" />
            {lead.phone}
          </div>
          <div className="flex items-center gap-2 text-ink">
            <MapPin size={13} className="shrink-0 text-muted" />
            {lead.location}
          </div>
        </div>
      </InfoSection>

      <InfoSection title="Qualification">
        <FactList>
          <FactRow icon={Truck} label="Est. monthly shipments">
            {lead.estimatedMonthlyShipments}
          </FactRow>
          <FactRow icon={Package} label="Main commodities" title={lead.mainCommodities}>
            {lead.mainCommodities}
          </FactRow>
          <FactRow icon={Ship} label="Preferred carrier" title={lead.preferredCarrier}>
            {lead.preferredCarrier}
          </FactRow>
          <FactRow icon={Container} label="Mode · movement">
            {lead.mode} · {lead.movement}
          </FactRow>
          {lead.unqualifiedReason && (
            <FactRow icon={XCircle} label="Unqualified reason">
              <span className="text-danger">{lead.unqualifiedReason}</span>
            </FactRow>
          )}
        </FactList>
      </InfoSection>

      <InfoSection title="Record">
        <FactList>
          <FactRow icon={User} label="Owner">
            {lead.owner}
          </FactRow>
          <FactRow icon={Briefcase} label="Source">
            {lead.source}
          </FactRow>
          <FactRow icon={CalendarPlus} label="Created">
            {lead.created}
          </FactRow>
          <FactRow icon={Hash} label="Lead ID">
            <span className="text-muted">{lead.id}</span>
          </FactRow>
        </FactList>
      </InfoSection>
    </InfoPane>
  );
}
