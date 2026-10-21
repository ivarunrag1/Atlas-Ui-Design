import {
  AlertTriangle,
  ArrowLeftRight,
  Banknote,
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  Container,
  Database,
  Globe,
  Hash,
  Inbox,
  Link2,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Route,
  Ship,
  Truck,
  Users,
} from 'lucide-react';
import { statedLanes, type Organization } from '../data/organizations';
import { usdOrUndisclosed } from '../data/leads';
import { fmtDate, relDays } from '@/lib/dates';
import { InfoPane, InfoHeader, InfoSection, FactList, FactRow } from '@/components/ui/info-pane';
import { Hint } from '@/components/ui/tooltip';
import { dormantIn, LaneText, RenewalText, StagePill, SyncText } from './company/parts';

/**
 * Company left pane — a variant of the record pane (same InfoPane parts as Leads and
 * Contacts): relationship timing, TradeMo trade facts, what the customer told us, and
 * how to reach them.
 */
export function CompanyInfoPane({ org }: { org: Organization }) {
  const lanes = statedLanes(org);
  const dormant = dormantIn(org);
  const t = org.trade;

  return (
    <InfoPane storageKey="atlas.companyInfoPane">
      <InfoHeader title={org.name}>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StagePill stage={org.accountStage} />
          <span className="text-[12px] text-muted">
            {org.companyType} · {org.businessType}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3 text-[12px] text-muted">
          {org.website && (
            <a href={`https://${org.website}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-ink">
              <Globe size={13} /> {org.website}
            </a>
          )}
          {org.linkedinUrl && (
            <Hint label="LinkedIn" value={org.linkedinUrl}>
              <a href={`https://${org.linkedinUrl}`} target="_blank" rel="noreferrer" aria-label="LinkedIn page" className="inline-flex hover:text-ink">
                <Link2 size={13} />
              </a>
            </Hint>
          )}
        </div>
        {dormant !== null && (
          <p className="mt-3 flex items-start gap-1.5 rounded-[6px] border border-warm/40 px-2.5 py-2 text-[12px] text-warm">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            No enquiry since {fmtDate(org.lastEnquiryDate)}. Turns Dormant in {dormant} days.
          </p>
        )}
      </InfoHeader>

      {/* Relationship — timing is what a forwarder sells on */}
      <InfoSection title="Relationship">
        <FactList>
          <FactRow icon={CalendarCheck} label="Customer since">
            {fmtDate(org.customerSince)}
          </FactRow>
          <FactRow icon={Ship} label="Last booking" title="Closed date of the latest Won deal">
            {org.lastBookingDate ? `${fmtDate(org.lastBookingDate)} · ${relDays(org.lastBookingDate)}` : '—'}
          </FactRow>
          <FactRow icon={CalendarClock} label="Contract renewal" title="When their rate contract / tender with their current forwarder comes up">
            <RenewalText iso={org.contractRenewalDate} />
          </FactRow>
          <FactRow icon={Inbox} label="Last enquiry">
            {org.lastEnquiryDate ? relDays(org.lastEnquiryDate) : '—'}
          </FactRow>
          <FactRow icon={Banknote} label="Credit days">
            {org.creditDays ?? '—'}
          </FactRow>
        </FactList>
      </InfoSection>

      {/* Trade data (TradeMo) — read-only, from the global shipper database */}
      {t && (
        <InfoSection
          title="Trade data"
          action={
            <span className="inline-flex items-center gap-1 text-[10px] text-faint">
              <Database size={11} /> TradeMo · as of {t.asOf}
            </span>
          }
        >
          <FactList>
            <FactRow icon={ArrowLeftRight} label="Trade direction">
              {t.direction}
            </FactRow>
            <FactRow icon={Package} label="Primary product" title={t.primaryProduct}>
              {t.primaryProduct}
            </FactRow>
            <FactRow icon={Hash} label="Primary HS code" title={t.primaryHs}>
              {t.primaryHs}
            </FactRow>
            <FactRow icon={Route} label="Main trade lane">
              <LaneText lane={t.mainLane} />
            </FactRow>
            <FactRow icon={Ship} label="Shipments (12 mo)">
              {t.totalShipments.toLocaleString('en-US')}
            </FactRow>
            <FactRow icon={Banknote} label="Shipment value (12 mo)">
              <span className={t.totalValue < 0 ? 'text-faint' : undefined}>{usdOrUndisclosed(t.totalValue)}</span>
            </FactRow>
            <FactRow icon={Users} label="Trading partners">
              {t.partners}
            </FactRow>
          </FactList>
        </InfoSection>
      )}

      {/* Freight profile — what the customer told us (never overwritten by trade data) */}
      <InfoSection title="Freight profile">
        <FactList>
          <div>
            <FactRow icon={Route} label="Trade lanes" title="What the customer told us">
              <span className="text-faint">{lanes.length || '—'}</span>
            </FactRow>
            {lanes.length > 0 && (
              <ul className="mt-1.5 ml-[6px] space-y-1 border-l border-line pl-3">
                {lanes.map((l) => (
                  <li key={l.lane} className="flex items-center justify-between gap-3 text-[12px]">
                    <LaneText lane={l.lane} />
                    {l.mode && <span className="shrink-0 text-faint">{l.mode}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <FactRow icon={Container} label="Monthly TEU" title="As the customer states it — not the trade-data estimate">
            {org.monthlyTeu ?? '—'}
          </FactRow>
          <FactRow icon={Truck} label="Typical modes">
            {org.typicalModes ?? '—'}
          </FactRow>
          <FactRow icon={Package} label="Main commodities" title={org.mainCommodities}>
            {org.mainCommodities ?? '—'}
          </FactRow>
          <FactRow icon={Package} label="Cargo types" title={org.cargoTypes}>
            {org.cargoTypes ?? '—'}
          </FactRow>
          <FactRow icon={Ship} label="Preferred carriers" title={org.preferredCarriers}>
            {org.preferredCarriers ?? '—'}
          </FactRow>
        </FactList>
      </InfoSection>

      <InfoSection title="Company">
        <div className="space-y-2 text-[12px]">
          {org.email && (
            <a href={`mailto:${org.email}`} className="flex items-center gap-2 text-ink hover:underline">
              <Mail size={13} className="shrink-0 text-muted" />
              <span className="truncate">{org.email}</span>
            </a>
          )}
          {org.phone && (
            <div className="flex items-center gap-2 text-ink">
              <Phone size={13} className="shrink-0 text-muted" />
              {org.phone}
            </div>
          )}
          <div className="flex items-center gap-2 text-ink">
            <MapPin size={13} className="shrink-0 text-muted" />
            {[org.state, org.country].filter(Boolean).join(', ')}
          </div>
          {org.industry && (
            <div className="flex items-center gap-2 text-ink">
              <Building2 size={13} className="shrink-0 text-muted" />
              {org.industry}
              {org.noOfEmployees && <span className="text-faint">· {org.noOfEmployees} employees</span>}
            </div>
          )}
        </div>
      </InfoSection>

      <InfoSection title="Record">
        <FactList>
          <FactRow icon={RefreshCw} label="Freightify sync">
            <SyncText status={org.freightifySyncStatus} />
          </FactRow>
          <FactRow icon={CalendarPlus} label="Created">
            {fmtDate(org.created)} · {org.createdBy}
          </FactRow>
          <FactRow icon={Hash} label="Company ID">
            <span className="text-muted">{org.id}</span>
          </FactRow>
        </FactList>
      </InfoSection>
    </InfoPane>
  );
}
