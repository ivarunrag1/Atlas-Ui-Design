import { Mail, Tag, Trash2 } from 'lucide-react';
import { mainLaneOf, type Organization } from '../data/organizations';
import type { ContactSummary } from '../data/contacts';
import type { DealSummary } from '../data/deals';
import { fmtDate } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { RecordListView, type RecordColumn } from './record/RecordListView';
import { LaneText, RenewalText, StagePill, SyncText } from './company/parts';

/** Companies list — a configuration of the shared RecordListView (list only). */
export function CompaniesView({
  organizations,
  contacts,
  deals,
  onOpenCompany,
}: {
  organizations: Organization[];
  contacts: ContactSummary[];
  deals: DealSummary[];
  onOpenCompany: (o: Organization) => void;
}) {
  const openDeals = (o: Organization) => deals.filter((d) => d.company === o.name && d.stage !== 'Won').length;
  const people = (o: Organization) => contacts.filter((c) => c.organizationId === o.id).length;

  const cols: RecordColumn<Organization>[] = [
    { key: 'name', label: 'Company', flex: 1.4, render: (o) => <span className="truncate font-semibold text-ink">{o.name}</span> },
    { key: 'accountStage', label: 'Account stage', flex: 0.9, render: (o) => <StagePill stage={o.accountStage} /> },
    { key: 'companyType', label: 'Company type', flex: 0.8, render: (o) => <span className="truncate text-muted">{o.companyType}</span> },
    { key: 'businessType', label: 'Business type', flex: 0.9, render: (o) => <span className="truncate text-muted">{o.businessType}</span> },
    { key: 'country', label: 'Country', flex: 0.9, render: (o) => <span className="truncate text-muted">{o.country}</span> },
    {
      key: 'mainLane',
      label: 'Main lane',
      flex: 1.3,
      render: (o) => (mainLaneOf(o) === '—' ? <span className="text-faint">—</span> : <LaneText lane={mainLaneOf(o)} className="text-[14px]" />),
    },
    {
      key: 'monthlyTeu',
      label: 'Monthly TEU',
      flex: 0.7,
      render: (o) => (
        <span className="text-ink tabular-nums" title="What the customer told us">
          {o.monthlyTeu ?? '—'}
        </span>
      ),
    },
    {
      key: 'estTeu',
      label: 'Est. TEU (trade data)',
      flex: 0.9,
      render: (o) => <span className="text-muted tabular-nums">{o.trade ? `≈ ${o.trade.estTeuPerMonth}` : '—'}</span>,
    },
    { key: 'lastBooking', label: 'Last booking', flex: 0.9, render: (o) => <span className="text-[12px] text-faint">{fmtDate(o.lastBookingDate)}</span> },
    { key: 'renewal', label: 'Contract renewal', flex: 0.9, render: (o) => <span className="text-[12px]"><RenewalText iso={o.contractRenewalDate} short /></span> },
    { key: 'contacts', label: 'Contacts', flex: 0.6, render: (o) => <span className="text-ink tabular-nums">{people(o)}</span> },
    { key: 'openDeals', label: 'Open deals', flex: 0.6, render: (o) => <span className="font-semibold text-ink tabular-nums">{openDeals(o)}</span> },
    { key: 'industry', label: 'Industry', flex: 1, render: (o) => <span className="truncate text-muted">{o.industry ?? '—'}</span> },
    { key: 'sync', label: 'Freightify sync', flex: 0.8, render: (o) => <span className="text-[12px]"><SyncText status={o.freightifySyncStatus} /></span> },
    { key: 'created', label: 'Created', flex: 0.8, render: (o) => <span className="text-[12px] text-faint">{fmtDate(o.created)}</span> },
  ];

  return (
    <RecordListView
      title="Companies"
      noun="companies"
      rows={organizations}
      columns={cols}
      defaultColumns={['name', 'accountStage', 'businessType', 'country', 'mainLane', 'monthlyTeu', 'lastBooking', 'renewal', 'openDeals']}
      searchText={(o) => `${o.name} ${o.country} ${o.industry ?? ''} ${o.mainCommodities ?? ''} ${o.tradeLanes ?? ''} ${o.trade?.mainLane ?? ''}`}
      onOpen={onOpenCompany}
      rowLabel={(o) => o.name}
      newLabel="New company"
      selectionActions={
        <>
          <Button variant="secondary" size="xs" className="gap-1.5 text-[12px]">
            <Mail size={13} /> Email
          </Button>
          <Button variant="secondary" size="xs" className="gap-1.5 text-[12px]">
            <Tag size={13} /> Change stage
          </Button>
          <Button variant="destructive" size="xs" className="gap-1.5 text-[12px]">
            <Trash2 size={13} /> Delete
          </Button>
        </>
      }
    />
  );
}
