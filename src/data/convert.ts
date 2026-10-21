/*
 * Lead → deal conversion (mirrors Frappe convert_to_deal + the Atlas field spec):
 * creates a CRM Deal (deal.lead = lead), reuses or creates the Contact and the CRM
 * Organization, sets the lead to Qualified. Shipment fields with the same name copy
 * to the deal; optionally the lead's qualification fills empty company fields.
 */
import type { ContactSummary } from './contacts';
import type { DealSummary } from './deals';
import type { LeadSummary } from './leads';
import type { Organization } from './organizations';

export type OrgMatchBasis = 'TradeMo ID' | 'Email domain' | 'Exact name';

export interface OrgMatch {
  org: Organization;
  basis: OrgMatchBasis;
  /** Sure matches link automatically; possible ones need the rep to choose. */
  sure: boolean;
}

const domainOf = (email: string) => email.split('@')[1]?.toLowerCase() ?? '';
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Find the company: TradeMo id (sure) → email domain (possible) → exact name (sure). */
export function matchOrganization(lead: LeadSummary, orgs: Organization[]): OrgMatch | null {
  const byTradeMo = lead.tradeMoId && orgs.find((o) => o.tradeMoId === lead.tradeMoId);
  if (byTradeMo) return { org: byTradeMo, basis: 'TradeMo ID', sure: true };
  const byName = orgs.find((o) => norm(o.name) === norm(lead.company));
  if (byName) return { org: byName, basis: 'Exact name', sure: true };
  const byDomain = orgs.find((o) => o.domain === domainOf(lead.email));
  if (byDomain) return { org: byDomain, basis: 'Email domain', sure: false };
  return null;
}

/** Find the contact by email (Frappe reuses a Contact with the same email). */
export const matchContact = (lead: LeadSummary, contacts: ContactSummary[]) =>
  contacts.find((c) => c.email.toLowerCase() === lead.email.toLowerCase()) ?? null;

/** Freight-profile fields on the company that the lead's qualification can fill. */
export const profileFill = (lead: LeadSummary, org: Organization | null) => {
  const candidates: { key: keyof Organization; label: string; value: string | number }[] = [
    { key: 'estimatedMonthlyShipments', label: 'Estimated monthly shipments', value: lead.estimatedMonthlyShipments },
    { key: 'mainCommodities', label: 'Main commodities', value: lead.mainCommodities },
    { key: 'tradeLanes', label: 'Trade lanes', value: lead.tradeLanes.map((t) => `${t.name}, ${lead.mode}`).join('\n') },
    { key: 'cargoTypes', label: 'Cargo types', value: lead.cargoType },
    { key: 'preferredCarriers', label: 'Preferred carriers', value: lead.preferredCarrier },
    { key: 'typicalModes', label: 'Typical modes', value: lead.mode },
  ];
  return candidates.filter((c) => !org || org[c.key] === undefined || org[c.key] === '');
};

/** UN/LOCODE of the lead's top port on a side ("INNSA · Nhava Sheva" → "INNSA"). */
const portCode = (lead: LeadSummary, direction: 'Export' | 'Import') =>
  lead.ports.find((p) => p.direction === direction)?.name.split(' · ')[0] ?? '—';

export interface ConvertInput {
  lead: LeadSummary;
  /** Existing company to link, or null to create one named `newCompanyName`. */
  linkOrg: Organization | null;
  newCompanyName: string;
  existingContact: ContactSummary | null;
  deal: {
    owner: string;
    mode: LeadSummary['mode'];
    movement: LeadSummary['movement'];
    cargoType: string;
    originCountry: string;
    destinationCountry: string;
  };
  fillProfile: boolean;
}

export interface ConvertResult {
  deal: DealSummary;
  contact: ContactSummary;
  contactCreated: boolean;
  organization: Organization;
  organizationCreated: boolean;
  /** Atlas deal field values carried over from the lead (same-named shipment fields). */
  dealFields: Record<string, string>;
}

/** Build the records a conversion produces (the caller stores them). */
export function convertLead(input: ConvertInput, seq: number): ConvertResult {
  const { lead } = input;
  const today = '21 Oct 2026';
  const orgBase: Organization = input.linkOrg ?? {
    id: `ORG-${String(100 + seq).padStart(4, '0')}`,
    name: input.newCompanyName.trim() || lead.company,
    domain: lead.email.split('@')[1] ?? '',
    tradeMoId: lead.tradeMoId,
    accountStage: 'Prospect',
    country: lead.originCountry,
    companyType: 'Shipper',
    businessType: lead.tradeDirection === 'Both' ? 'Import & Export' : lead.tradeDirection === 'Importer' ? 'Import' : 'Export',
    createdBy: input.deal.owner,
    created: '2026-10-21',
    freightifySyncStatus: 'PENDING',
  };
  const organization: Organization = input.fillProfile
    ? { ...orgBase, ...Object.fromEntries(profileFill(lead, orgBase).map((f) => [f.key, f.value])) }
    : orgBase;

  const contact: ContactSummary = input.existingContact ?? {
    id: `AT-CON-${String(900 + seq)}`,
    name: lead.contactName,
    company: organization.name,
    role: lead.contactRole,
    email: lead.email,
    phone: lead.phone,
    location: lead.location,
    lastDealDate: today,
    dealsCount: 1,
    owner: input.deal.owner,
    tags: ['Converted lead'],
    organizationId: organization.id,
    status: 'Open',
    isPrimary: true,
    contactRole: 'Shipper',
    modesHandled: input.deal.mode,
    lastEngagedAt: '2026-10-21T12:00',
    freightifySyncStatus: 'PENDING',
    created: today,
    tasks: 0,
    notes: 0,
    files: 0,
  };

  const deal: DealSummary = {
    id: `AT-DEAL-${String(300 + seq).padStart(4, '0')}`,
    company: organization.name,
    contact: contact.name,
    contactRole: contact.role,
    contactEmail: contact.email,
    origin: portCode(lead, 'Export'),
    destination: portCode(lead, 'Import'),
    teu: `${lead.estTeuPerMonth} TEU`,
    equipment: input.deal.cargoType === 'Reefer' ? "40'RF" : "40'HC",
    mode: input.deal.mode === 'LCL' ? 'LCL' : 'FCL',
    owner: input.deal.owner,
    value: '$0',
    stage: 'Enquiry received',
    updated: 'just now',
    tasks: 0,
    notes: 0,
    comments: 0,
    nextInteraction: { when: '—', detail: 'Not scheduled' },
    lastInteraction: { when: 'Just now', detail: `Converted from lead ${lead.id}` },
    nextTask: { when: '—', detail: 'Send first quote' },
  };

  const dealFields = {
    mode: input.deal.mode,
    movement: input.deal.movement,
    cargo_type: input.deal.cargoType,
    origin_country: input.deal.originCountry,
    destination_country: input.deal.destinationCountry,
    trade_lanes: lead.tradeLanes[0]?.name ?? '',
    commodity: lead.primaryProduct,
  };

  return {
    deal,
    dealFields,
    contact,
    contactCreated: !input.existingContact,
    organization,
    organizationCreated: !input.linkOrg,
  };
}
