/*
 * Contact records for the Contacts list + detail view. Fields follow the spec workbook:
 * Frappe defaults (full_name, email_id, phone, mobile_no, designation, department,
 * company_name, status, is_primary_contact) plus the 12 Atlas custom fields.
 * Rows marked red ("not required") are left out: middle_name, Google Contacts sync
 * fields, phone_nos (Contact Numbers) and unsubscribed.
 */

export type ContactRole = 'Sales person' | 'Admin' | 'Shipper';
export type ContactStatus = 'Passive' | 'Open' | 'Replied';

export interface ContactSummary {
  id: string;
  /** full_name */
  name: string;
  /** company_name (plain text, as in Frappe) */
  company: string;
  /** designation */
  role: string;
  email: string;
  phone: string;
  location: string;
  lastDealDate: string;
  dealsCount: number;
  /** contact_owner — the rep responsible (reassignable). */
  owner: string;
  tags: string[];
  created: string;
  tasks: number;
  notes: number;
  files: number;

  // Frappe defaults
  mobileNo?: string;
  department?: string;
  status?: ContactStatus;
  isPrimary?: boolean;
  /** CRM Organization this contact is linked to (Dynamic Link). */
  organizationId?: string;

  // Atlas custom fields
  freightifyContactId?: string;
  freightifySyncStatus?: 'PENDING' | 'SYNCED' | 'FAILED';
  contactRole?: ContactRole;
  /** Comma-separated: FCL, LCL, Air, FTL, LTL. */
  modesHandled?: string;
  /** Free text, e.g. "Asia imports only". */
  lanesHandled?: string;
  /** ISO datetime — latest email, call, meeting or note. */
  lastEngagedAt?: string;
  enrichedAt?: string;
  zoominfoId?: string;
  aiSummary?: string;
  aiSummaryAt?: string;

  /** ZoomInfo data (Research tab) — read-only. */
  enrichment?: { title: string; seniority: string; department: string; linkedin?: string; tenure?: string };
  /** Calculated from the contact's deals and emails. */
  track?: { quotesReceived: number; quotesAccepted: number; avgReplyHours: number };
}

const baseContacts: ContactSummary[] = [
  { id: 'AT-CON-0142', name: 'Marcus Reed', company: 'Orbit Manufacturing', role: 'Procurement Lead', email: 'marcus.reed@orbitmfg.com', phone: '+1 312 555 0142', location: 'Chicago · US', lastDealDate: '13 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Decision maker', 'Shipper'], created: '05 Oct 2026', tasks: 2, notes: 3, files: 4 },
  { id: 'AT-CON-0138', name: 'Lena Fischer', company: 'Nordwind Logistics', role: 'Logistics Manager', email: 'lena.fischer@nordwind.com', phone: '+49 40 555 0138', location: 'Hamburg · DE', lastDealDate: '12 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Forwarder'], created: '02 Oct 2026', tasks: 1, notes: 2, files: 3 },
  { id: 'AT-CON-0151', name: 'Kenji Sato', company: 'Takara Industries', role: 'Supply Chain Head', email: 'kenji.sato@takara-ind.jp', phone: '+81 45 555 0151', location: 'Yokohama · JP', lastDealDate: '09 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Shipper'], created: '28 Sep 2026', tasks: 3, notes: 1, files: 2 },
  { id: 'AT-CON-0155', name: 'Priya Menon', company: 'Vellore Textiles', role: 'Export Manager', email: 'priya.menon@velloretex.in', phone: '+91 44 555 0155', location: 'Chennai · IN', lastDealDate: '12 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Exporter'], created: '10 Oct 2026', tasks: 1, notes: 0, files: 1 },
  { id: 'AT-CON-0129', name: 'Mateo Rojas', company: 'Andes Copper Co', role: 'Procurement Dir', email: 'mateo.rojas@andescopper.cl', phone: '+56 32 555 0129', location: 'Valparaíso · CL', lastDealDate: '08 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Decision maker'], created: '20 Sep 2026', tasks: 0, notes: 2, files: 5 },
  { id: 'AT-CON-0133', name: 'Erik Lindqvist', company: 'Baltic Steel', role: 'Logistics Lead', email: 'erik.lindqvist@balticsteel.se', phone: '+46 31 555 0133', location: 'Gothenburg · SE', lastDealDate: '12 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Shipper'], created: '24 Sep 2026', tasks: 4, notes: 1, files: 2 },
  { id: 'AT-CON-0160', name: 'Omar Hassan', company: 'Cairo Agro Exports', role: 'Trade Manager', email: 'omar.hassan@cairoagro.eg', phone: '+20 3 555 0160', location: 'Alexandria · EG', lastDealDate: '11 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Exporter'], created: '08 Oct 2026', tasks: 1, notes: 1, files: 1 },
  { id: 'AT-CON-0147', name: 'Tran Minh', company: 'Saigon Furniture', role: 'Export Lead', email: 'tran.minh@saigonfurn.vn', phone: '+84 28 555 0147', location: 'Ho Chi Minh · VN', lastDealDate: '12 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Exporter'], created: '06 Oct 2026', tasks: 2, notes: 0, files: 1 },
  { id: 'AT-CON-0162', name: 'Hana Ono', company: 'Pacific Greens', role: 'Ops Manager', email: 'hana.ono@pacificgreens.nz', phone: '+64 9 555 0162', location: 'Auckland · NZ', lastDealDate: '08 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Shipper'], created: '30 Sep 2026', tasks: 0, notes: 1, files: 0 },
  { id: 'AT-CON-0118', name: 'Aino Virtanen', company: 'Helsinki Pharma', role: 'Supply Chain Mgr', email: 'aino.virtanen@helsinkipharma.fi', phone: '+358 9 555 0118', location: 'Helsinki · FI', lastDealDate: '05 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Decision maker'], created: '12 Sep 2026', tasks: 0, notes: 4, files: 3 },
  { id: 'AT-CON-0144', name: 'Fatou Diop', company: 'Dakar Minerals', role: 'Procurement Head', email: 'fatou.diop@dakarminerals.sn', phone: '+221 33 555 0144', location: 'Dakar · SN', lastDealDate: '12 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Decision maker'], created: '01 Oct 2026', tasks: 3, notes: 2, files: 4 },
  { id: 'AT-CON-0158', name: 'Claire Dubois', company: 'Lyon Automotive', role: 'Logistics Manager', email: 'claire.dubois@lyonauto.fr', phone: '+33 4 555 0158', location: 'Lyon · FR', lastDealDate: '12 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Shipper'], created: '09 Oct 2026', tasks: 1, notes: 1, files: 1 },
  { id: 'AT-CON-0126', name: 'Ingrid Hansen', company: 'Oslo Seafood', role: 'Export Manager', email: 'ingrid.hansen@osloseafood.no', phone: '+47 22 555 0126', location: 'Oslo · NO', lastDealDate: '11 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Exporter'], created: '26 Sep 2026', tasks: 2, notes: 2, files: 2 },
  { id: 'AT-CON-0109', name: 'Rahul Kapoor', company: 'Mumbai Spices', role: 'Trade Lead', email: 'rahul.kapoor@mumbaispices.in', phone: '+91 22 555 0109', location: 'Mumbai · IN', lastDealDate: '04 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Exporter'], created: '15 Sep 2026', tasks: 0, notes: 1, files: 1 },
  { id: 'AT-CON-0170', name: 'Dana Kim', company: 'Orbit Manufacturing', role: 'Air Freight Coordinator', email: 'dana.kim@orbitmfg.com', phone: '+1 312 555 0170', location: 'Chicago · US', lastDealDate: '—', dealsCount: 0, owner: 'Varun Reddy', tags: ['Air'], created: '14 Aug 2026', tasks: 1, notes: 1, files: 0 },
  { id: 'AT-CON-0171', name: 'Yuki Tanaka', company: 'Takara Industries', role: 'Logistics Specialist', email: 'yuki.tanaka@takara-ind.jp', phone: '+81 45 555 0171', location: 'Yokohama · JP', lastDealDate: '—', dealsCount: 0, owner: 'Varun Reddy', tags: ['Operations'], created: '02 Sep 2026', tasks: 0, notes: 0, files: 0 },
];

type Extra = Omit<Partial<ContactSummary>, 'id'>;
const SUMMARY_AT = '20 Oct 2026, 09:20';

/** Atlas fields per contact (merged onto the base rows). */
const extra: Record<string, Extra> = {
  'AT-CON-0142': {
    organizationId: 'ORG-0001', department: 'Procurement', status: 'Replied', isPrimary: true, mobileNo: '+1 312 555 0942',
    freightifyContactId: '6892921912', freightifySyncStatus: 'SYNCED', contactRole: 'Shipper', modesHandled: 'FCL',
    lanesHandled: 'India → Germany, China → United States', lastEngagedAt: '2026-10-18T16:40', enrichedAt: '2026-10-05T10:02', zoominfoId: 'z31313',
    enrichment: { title: 'Procurement Lead, Ocean Freight', seniority: 'Manager', department: 'Operations · Procurement', linkedin: 'linkedin.com/in/marcusreed', tenure: '4 yrs' },
    track: { quotesReceived: 14, quotesAccepted: 7, avgReplyHours: 6 },
    aiSummary: 'Marcus runs ocean procurement at Orbit and decides FCL awards on India → Germany and China → US. Replies within a working day; price-led on China → US, where we lost 4 of 5 quotes. Prefers a call before a revised quote.',
  },
  'AT-CON-0170': {
    organizationId: 'ORG-0001', department: 'Logistics', status: 'Open', contactRole: 'Shipper', modesHandled: 'Air',
    lanesHandled: 'All inbound air', lastEngagedAt: '2026-09-12T11:05', freightifySyncStatus: 'PENDING',
    track: { quotesReceived: 2, quotesAccepted: 0, avgReplyHours: 30 },
    aiSummary: 'Dana books urgent inbound air for Orbit. Two air quotes sent, none accepted yet; slow to reply.',
  },
  'AT-CON-0138': {
    organizationId: 'ORG-0002', department: 'Operations', status: 'Replied', isPrimary: true, freightifyContactId: '6892921930', freightifySyncStatus: 'SYNCED',
    contactRole: 'Sales person', modesHandled: 'FCL, LCL', lanesHandled: 'Asia → North America', lastEngagedAt: '2026-10-21T07:15',
    enrichedAt: '2026-09-28T09:00', zoominfoId: 'z40022',
    enrichment: { title: 'Logistics Manager', seniority: 'Manager', department: 'Operations', linkedin: 'linkedin.com/in/lenafischer', tenure: '6 yrs' },
    track: { quotesReceived: 22, quotesAccepted: 12, avgReplyHours: 3 },
    aiSummary: 'Lena buys China → US capacity for Nordwind’s own customers. Fast and responsive; negotiates on free time at destination more than base rate.',
  },
  'AT-CON-0151': {
    organizationId: 'ORG-0003', department: 'Supply chain', status: 'Replied', isPrimary: true, freightifyContactId: '6892921944', freightifySyncStatus: 'SYNCED',
    contactRole: 'Shipper', modesHandled: 'FCL', lanesHandled: 'Japan → Europe', lastEngagedAt: '2026-10-20T02:30', enrichedAt: '2026-09-30T08:00', zoominfoId: 'z77001',
    enrichment: { title: 'Head of Supply Chain', seniority: 'Director', department: 'Supply chain', tenure: '9 yrs' },
    track: { quotesReceived: 8, quotesAccepted: 4, avgReplyHours: 14 },
    aiSummary: 'Kenji owns Takara’s European exports and signs the annual rate contract. Reliable volume; expects a renewal proposal by mid-December.',
  },
  'AT-CON-0171': {
    organizationId: 'ORG-0003', department: 'Logistics', status: 'Passive', contactRole: 'Admin', modesHandled: 'FCL',
    lanesHandled: 'Japan → India', lastEngagedAt: '2026-08-04T03:00',
    aiSummary: 'Yuki handles shipping documents for Takara’s India lane. Not yet engaged on rates.',
  },
  'AT-CON-0155': { organizationId: 'ORG-0004', department: 'Exports', status: 'Open', isPrimary: true, contactRole: 'Shipper', modesHandled: 'FCL', lanesHandled: 'India → UK', lastEngagedAt: '2026-10-12T10:20', freightifySyncStatus: 'PENDING', track: { quotesReceived: 1, quotesAccepted: 0, avgReplyHours: 8 } },
  'AT-CON-0129': { organizationId: 'ORG-0005', department: 'Procurement', status: 'Replied', isPrimary: true, contactRole: 'Shipper', modesHandled: 'FCL', lanesHandled: 'Chile → Asia', lastEngagedAt: '2026-10-09T15:00', enrichedAt: '2026-09-21T12:00', zoominfoId: 'z33550', enrichment: { title: 'Procurement Director', seniority: 'Director', department: 'Procurement', tenure: '11 yrs' }, track: { quotesReceived: 1, quotesAccepted: 0, avgReplyHours: 20 } },
  'AT-CON-0133': { organizationId: 'ORG-0006', department: 'Logistics', status: 'Replied', isPrimary: true, contactRole: 'Shipper', modesHandled: 'FCL', lanesHandled: 'Sweden → US East Coast', lastEngagedAt: '2026-10-16T09:45', freightifyContactId: '6892921977', freightifySyncStatus: 'SYNCED', track: { quotesReceived: 11, quotesAccepted: 7, avgReplyHours: 5 } },
  'AT-CON-0160': { organizationId: 'ORG-0007', department: 'Trade', status: 'Open', isPrimary: true, contactRole: 'Shipper', modesHandled: 'LCL, FCL', lanesHandled: 'Egypt → Mediterranean', lastEngagedAt: '2026-10-11T13:10', freightifySyncStatus: 'FAILED' },
  'AT-CON-0147': { organizationId: 'ORG-0008', department: 'Exports', status: 'Replied', isPrimary: true, contactRole: 'Shipper', modesHandled: 'LCL, FCL', lanesHandled: 'Vietnam → Australia, Vietnam → US', lastEngagedAt: '2026-10-13T04:00', freightifyContactId: '6892921988', freightifySyncStatus: 'SYNCED', track: { quotesReceived: 9, quotesAccepted: 5, avgReplyHours: 10 } },
  'AT-CON-0162': { organizationId: 'ORG-0009', department: 'Operations', status: 'Passive', isPrimary: true, contactRole: 'Shipper', modesHandled: 'FCL', lanesHandled: 'NZ → Japan', lastEngagedAt: '2026-09-02T22:00' },
  'AT-CON-0118': { organizationId: 'ORG-0010', department: 'Supply chain', status: 'Replied', isPrimary: true, contactRole: 'Shipper', modesHandled: 'FCL, Air', lanesHandled: 'Finland → US', lastEngagedAt: '2026-10-06T08:30', freightifyContactId: '6892922001', freightifySyncStatus: 'SYNCED', track: { quotesReceived: 1, quotesAccepted: 1, avgReplyHours: 4 } },
  'AT-CON-0144': { organizationId: 'ORG-0011', department: 'Procurement', status: 'Open', isPrimary: true, contactRole: 'Shipper', modesHandled: 'FCL', lanesHandled: 'West Africa → China', lastEngagedAt: '2026-10-12T11:00', track: { quotesReceived: 1, quotesAccepted: 0, avgReplyHours: 12 } },
  'AT-CON-0158': { organizationId: 'ORG-0012', department: 'Logistics', status: 'Open', isPrimary: true, contactRole: 'Admin', modesHandled: 'FCL', lanesHandled: 'France → Mexico', lastEngagedAt: '2026-10-12T14:25' },
  'AT-CON-0126': { organizationId: 'ORG-0013', department: 'Exports', status: 'Replied', isPrimary: true, contactRole: 'Shipper', modesHandled: 'FCL', lanesHandled: 'Norway → Korea, Japan', lastEngagedAt: '2026-10-19T12:00', freightifyContactId: '6892922015', freightifySyncStatus: 'SYNCED', enrichedAt: '2026-06-01T10:00', zoominfoId: 'z80011', enrichment: { title: 'Export Manager, Asia', seniority: 'Manager', department: 'Sales · Export', tenure: '3 yrs' }, track: { quotesReceived: 8, quotesAccepted: 6, avgReplyHours: 7 } },
  'AT-CON-0109': { organizationId: 'ORG-0016', department: 'Trade', status: 'Replied', isPrimary: true, contactRole: 'Shipper', modesHandled: 'LCL', lanesHandled: 'India → Gulf', lastEngagedAt: '2026-10-04T09:00', freightifyContactId: '6892922030', freightifySyncStatus: 'SYNCED', track: { quotesReceived: 1, quotesAccepted: 1, avgReplyHours: 2 } },
};

export const contacts: ContactSummary[] = baseContacts.map((c) => ({
  freightifySyncStatus: 'PENDING',
  aiSummaryAt: SUMMARY_AT,
  ...c,
  ...extra[c.id],
}));
