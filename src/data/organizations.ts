/*
 * CRM Organization records (mock). Fields follow the spec workbook:
 * - Frappe default fields (organization_name, website, industry, …)
 * - Atlas custom fields: Freightify sync · company profile · relationship · freight profile · AI summary
 * - Trade data (TradeMo): a separate, read-only collection linked by provider company id
 * Rows marked red ("not required") in the workbook are left out; none exist for CRM Organization.
 * `history` is not stored: the real app calculates it from the company's deals.
 */
import { leads, tradeProfiles, type ShareRow, type TradeDirection, type TradeProfile } from './leads';

export type AccountStage = 'Prospect' | 'Customer' | 'Dormant' | 'Lost';
export type CompanyType = 'Shipper' | 'Consignee' | 'Agent' | 'Other';
export type BusinessType = 'Import' | 'Export' | 'Import & Export' | 'Cross Trade' | 'Domestic';
export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export const accountStages: AccountStage[] = ['Prospect', 'Customer', 'Dormant', 'Lost'];
export const accountStageColor: Record<AccountStage, string> = {
  Prospect: 'var(--color-stage-blue)',
  Customer: 'var(--color-stage-green)',
  Dormant: 'var(--color-stage-amber)',
  Lost: 'var(--color-stage-slate)',
};

/** TradeMo trade profile for a company — read-only, never written into CRM fields. */
export interface OrgTrade {
  provider: 'trademo';
  providerCompanyId: string;
  period: string;
  asOf: string;
  direction: TradeDirection;
  primaryHs: string;
  primaryProduct: string;
  mainLane: string;
  totalShipments: number;
  /** USD; -1 = not disclosed. */
  totalValue: number;
  partners: number;
  estTeuPerMonth: number;
  profiles: TradeProfile[];
  /** Trading partners that already exist in Atlas ("their supplier is our customer"). */
  partnersInAtlas: string[];
}

/** Our history with the company per lane — calculated from its deals. */
export interface LaneHistory {
  lane: string;
  quotes: number;
  won: number;
  /** Last quoted rate per TEU (USD). */
  lastRate?: number;
}

export interface Organization {
  id: string;
  // Frappe defaults
  name: string;
  website?: string;
  industry?: string;
  territory?: string;
  noOfEmployees?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
  annualRevenue?: string;
  creditDays?: number;
  address?: string;
  createdBy: string;
  created: string;

  // Atlas · Freightify sync
  freightifyCompanyId?: string;
  freightifySyncStatus: SyncStatus;
  // Atlas · company profile
  companyType: CompanyType;
  estimatedMonthlyShipments?: number;
  mainCommodities?: string;
  typicalModes?: string;
  linkedinUrl?: string;
  email?: string;
  phone?: string;
  mobileNo?: string;
  state?: string;
  country: string;
  businessType: BusinessType;
  // Atlas · relationship
  accountStage: AccountStage;
  customerSince?: string;
  lastBookingDate?: string;
  contractRenewalDate?: string;
  // Atlas · freight profile (what the customer told us)
  /** One lane per line, e.g. "India → Germany, FCL". */
  tradeLanes?: string;
  monthlyTeu?: number;
  cargoTypes?: string;
  preferredCarriers?: string;
  // Atlas · AI summary
  aiSummary?: string;
  aiSummaryAt?: string;

  /** Email / web domain — used to match leads on convert. */
  domain: string;
  /** TradeMo provider company id — dedupe key for trade data. */
  tradeMoId?: string;
  trade?: OrgTrade;
  /** Date of the latest enquiry (drives the Dormant rule). */
  lastEnquiryDate?: string;
  history?: { bookedTeuPerMonth: number; revenueYtd: number; marginYtd: number; lanes: LaneHistory[] };
}

/* ── Trade data mock builder ───────────────────────────────────────────────── */

const shares = (rows: [string, number][]): ShareRow[] => rows.map(([name, share]) => ({ name, share }));

function mkTrade(t: {
  id: string;
  country: string;
  dir: 'Export' | 'Import';
  partners: [string, number][];
  hs: [string, number][];
  products: [string, number][];
  ports: [string, number][];
  shipments: number;
  value: number;
  partnerCount: number;
  teu: number;
  monthly: number[];
  inAtlas?: string[];
}): OrgTrade {
  const lanes = t.partners.map(([p, s]) => ({ name: t.dir === 'Export' ? `${t.country} → ${p}` : `${p} → ${t.country}`, share: s }));
  return {
    provider: 'trademo',
    providerCompanyId: t.id,
    period: 'Oct 2025 – Sep 2026',
    asOf: '20 Oct 2026',
    direction: t.dir === 'Export' ? 'Exporter' : 'Importer',
    primaryHs: t.hs[0][0],
    primaryProduct: t.products[0][0],
    mainLane: lanes[0].name,
    totalShipments: t.shipments,
    totalValue: t.value,
    partners: t.partnerCount,
    estTeuPerMonth: t.teu,
    partnersInAtlas: t.inAtlas ?? [],
    profiles: [
      {
        direction: t.dir,
        shipments: t.shipments,
        value: t.value,
        partners: t.partnerCount,
        estTeuPerMonth: t.teu,
        monthly: t.monthly,
        lanes,
        hsCodes: shares(t.hs),
        products: shares(t.products),
        ports: shares(t.ports),
        countries: shares(t.partners),
      },
    ],
  };
}

/** Hanseatic's trade data is the same TradeMo profile the lead was found with. */
function tradeFromLead(leadId: string): OrgTrade | undefined {
  const l = leads.find((x) => x.id === leadId);
  if (!l || !l.tradeMoId) return undefined;
  return {
    provider: 'trademo',
    providerCompanyId: l.tradeMoId,
    period: l.tradePeriod,
    asOf: l.tradeAsOf,
    direction: l.tradeDirection,
    primaryHs: l.primaryHs,
    primaryProduct: l.primaryProduct,
    mainLane: l.tradeLanes[0]?.name ?? '—',
    totalShipments: l.totalShipments,
    totalValue: l.totalShipmentValue,
    partners: l.tradingPartners,
    estTeuPerMonth: l.estTeuPerMonth,
    partnersInAtlas: l.partnersOurCustomers,
    profiles: tradeProfiles(l),
  };
}

const base = { createdBy: 'Varun Reddy', freightifySyncStatus: 'SYNCED' as SyncStatus, aiSummaryAt: '20 Oct 2026, 09:14' };

export const organizations: Organization[] = [
  {
    ...base,
    id: 'ORG-0001',
    name: 'Orbit Manufacturing',
    website: 'orbitmfg.com',
    industry: 'Industrial machinery',
    territory: 'North America',
    noOfEmployees: '501-1000',
    annualRevenue: '$180M',
    creditDays: 30,
    address: '2200 W Fulton St, Chicago, IL 60612',
    created: '2025-03-02',
    freightifyCompanyId: '7731240012',
    companyType: 'Shipper',
    estimatedMonthlyShipments: 22,
    mainCommodities: 'Machined parts, castings',
    typicalModes: 'FCL, Air',
    linkedinUrl: 'linkedin.com/company/orbit-manufacturing',
    email: 'logistics@orbitmfg.com',
    phone: '+1 312 555 0100',
    state: 'Illinois',
    country: 'United States',
    businessType: 'Import & Export',
    accountStage: 'Customer',
    customerSince: '2025-03-14',
    lastBookingDate: '2026-08-28',
    contractRenewalDate: '2026-12-07',
    tradeLanes: 'India → Germany, FCL\nChina → United States, FCL',
    monthlyTeu: 40,
    cargoTypes: 'General',
    preferredCarriers: 'Maersk, MSC',
    aiSummary:
      'Orbit Manufacturing imports machined parts and castings into the US, mainly from China, India and Vietnam (1,412 shipments in 12 months). They told us 40 TEU a month; trade data estimates about 120, so we carry roughly 15% of their ocean volume. We win most India → Germany quotes (6 of 9) but only 1 of 5 on China → US. Their rate contract renews on 7 Dec — the moment to pitch the China and Vietnam lanes.',
    domain: 'orbitmfg.com',
    tradeMoId: 'TM-55102',
    lastEnquiryDate: '2026-10-13',
    trade: mkTrade({
      id: 'TM-55102',
      country: 'United States',
      dir: 'Import',
      partners: [['China', 0.48], ['India', 0.27], ['Vietnam', 0.25]],
      hs: [['8483.40 · Gearboxes', 0.41], ['7325.99 · Cast iron articles', 0.33], ['8481.80 · Valves', 0.26]],
      products: [['Gear housings', 0.41], ['Castings', 0.33], ['Valve bodies', 0.26]],
      ports: [['USLAX · Los Angeles', 0.52], ['USNYC · New York', 0.31], ['USSAV · Savannah', 0.17]],
      shipments: 1412,
      value: 48_600_000,
      partnerCount: 23,
      teu: 120,
      monthly: [104, 110, 98, 86, 92, 118, 124, 121, 130, 126, 135, 140],
      inAtlas: ['Vellore Textiles'],
    }),
    history: {
      bookedTeuPerMonth: 18,
      revenueYtd: 412_000,
      marginYtd: 49_400,
      lanes: [
        { lane: 'India → Germany', quotes: 9, won: 6, lastRate: 1850 },
        { lane: 'China → United States', quotes: 5, won: 1, lastRate: 2400 },
      ],
    },
  },
  {
    ...base,
    id: 'ORG-0002',
    name: 'Nordwind Logistics',
    website: 'nordwind.com',
    industry: 'Logistics',
    territory: 'Europe',
    noOfEmployees: '51-200',
    creditDays: 45,
    address: 'Am Sandtorkai 41, 20457 Hamburg',
    created: '2024-05-20',
    freightifyCompanyId: '7731240019',
    companyType: 'Agent',
    estimatedMonthlyShipments: 35,
    mainCommodities: 'Consolidated general cargo',
    typicalModes: 'FCL, LCL',
    email: 'ops@nordwind.com',
    phone: '+49 40 555 0100',
    state: 'Hamburg',
    country: 'Germany',
    businessType: 'Cross Trade',
    accountStage: 'Customer',
    customerSince: '2024-06-02',
    lastBookingDate: '2026-09-30',
    contractRenewalDate: '2027-04-01',
    tradeLanes: 'China → United States, FCL',
    monthlyTeu: 60,
    cargoTypes: 'General',
    preferredCarriers: 'ONE, HMM',
    aiSummary:
      'Nordwind Logistics is a Hamburg-based agent buying China → US cross-trade capacity from us since June 2024. No TradeMo profile (agents rarely appear in customs data). 8 of 14 quotes won on China → US; current deal for 24 TEU is in negotiation. Contract renews 1 Apr 2027.',
    domain: 'nordwind.com',
    tradeMoId: 'TM-40871',
    lastEnquiryDate: '2026-10-20',
    history: {
      bookedTeuPerMonth: 34,
      revenueYtd: 688_000,
      marginYtd: 61_900,
      lanes: [{ lane: 'China → United States', quotes: 14, won: 8, lastRate: 2310 }],
    },
  },
  {
    ...base,
    id: 'ORG-0003',
    name: 'Takara Industries',
    website: 'takara-ind.jp',
    industry: 'Precision engineering',
    territory: 'Asia Pacific',
    noOfEmployees: '1000+',
    annualRevenue: '¥42B',
    creditDays: 30,
    address: '3-1 Minatomirai, Nishi-ku, Yokohama',
    created: '2025-11-02',
    freightifyCompanyId: '7731240027',
    companyType: 'Shipper',
    estimatedMonthlyShipments: 14,
    mainCommodities: 'Bearings, gear units',
    typicalModes: 'FCL',
    linkedinUrl: 'linkedin.com/company/takara-industries',
    email: 'export@takara-ind.jp',
    phone: '+81 45 555 0100',
    state: 'Kanagawa',
    country: 'Japan',
    businessType: 'Export',
    accountStage: 'Customer',
    customerSince: '2025-11-20',
    lastBookingDate: '2026-07-15',
    contractRenewalDate: '2027-01-10',
    tradeLanes: 'Japan → Netherlands, FCL',
    monthlyTeu: 12,
    cargoTypes: 'General',
    preferredCarriers: 'ONE',
    aiSummary:
      'Takara Industries exports bearings and gear units from Yokohama to Europe and India. They gave us Japan → Netherlands only (12 TEU/mo); trade data shows Japan → Germany and Japan → India as well, about 30 TEU/mo in total. Renewal on 10 Jan 2027 is inside 90 days.',
    domain: 'takara-ind.jp',
    tradeMoId: 'TM-77310',
    lastEnquiryDate: '2026-10-19',
    trade: mkTrade({
      id: 'TM-77310',
      country: 'Japan',
      dir: 'Export',
      partners: [['Netherlands', 0.44], ['Germany', 0.31], ['India', 0.25]],
      hs: [['8482.10 · Ball bearings', 0.52], ['8483.40 · Gearboxes', 0.48]],
      products: [['Ball bearings', 0.52], ['Gear units', 0.48]],
      ports: [['JPYOK · Yokohama', 0.78], ['JPNGO · Nagoya', 0.22]],
      shipments: 388,
      value: 21_400_000,
      partnerCount: 11,
      teu: 30,
      monthly: [30, 31, 28, 26, 29, 33, 32, 34, 35, 33, 30, 31],
      inAtlas: ['Hanseatic Maschinenbau GmbH'],
    }),
    history: {
      bookedTeuPerMonth: 9,
      revenueYtd: 156_000,
      marginYtd: 17_200,
      lanes: [{ lane: 'Japan → Netherlands', quotes: 6, won: 4, lastRate: 1720 }],
    },
  },
  {
    ...base,
    id: 'ORG-0004',
    name: 'Vellore Textiles',
    website: 'velloretex.in',
    industry: 'Textiles',
    territory: 'South Asia',
    noOfEmployees: '201-500',
    creditDays: 15,
    address: 'SIPCOT Industrial Park, Ranipet, Vellore',
    created: '2026-10-10',
    companyType: 'Shipper',
    freightifySyncStatus: 'PENDING',
    estimatedMonthlyShipments: 8,
    mainCommodities: 'Cotton home textiles',
    typicalModes: 'FCL',
    email: 'exports@velloretex.in',
    phone: '+91 44 555 0100',
    state: 'Tamil Nadu',
    country: 'India',
    businessType: 'Export',
    accountStage: 'Prospect',
    tradeLanes: 'India → United Kingdom, FCL',
    monthlyTeu: 10,
    cargoTypes: 'General',
    aiSummary:
      'Vellore Textiles exports cotton home textiles from Chennai, mainly to the UK (52%), the US and the Netherlands. They mentioned 10 TEU/mo to the UK; trade data estimates 26 TEU/mo across all three lanes, all of which we serve. First enquiry received 12 Oct.',
    domain: 'velloretex.in',
    tradeMoId: 'TM-61177',
    lastEnquiryDate: '2026-10-12',
    trade: mkTrade({
      id: 'TM-61177',
      country: 'India',
      dir: 'Export',
      partners: [['United Kingdom', 0.52], ['United States', 0.3], ['Netherlands', 0.18]],
      hs: [['6302.31 · Cotton bed linen', 0.61], ['6304.92 · Furnishing articles', 0.39]],
      products: [['Bed linen', 0.61], ['Cushion covers', 0.39]],
      ports: [['INMAA · Chennai', 0.84], ['INTUT · Tuticorin', 0.16]],
      shipments: 296,
      value: 9_800_000,
      partnerCount: 14,
      teu: 26,
      monthly: [22, 24, 28, 20, 18, 21, 23, 25, 27, 30, 31, 27],
      inAtlas: ['Orbit Manufacturing'],
    }),
    history: { bookedTeuPerMonth: 0, revenueYtd: 0, marginYtd: 0, lanes: [{ lane: 'India → United Kingdom', quotes: 1, won: 0 }] },
  },
  {
    ...base,
    id: 'ORG-0005',
    name: 'Andes Copper Co',
    website: 'andescopper.cl',
    industry: 'Mining',
    territory: 'Latin America',
    noOfEmployees: '1000+',
    creditDays: 60,
    created: '2026-09-20',
    freightifyCompanyId: '7731240044',
    companyType: 'Shipper',
    estimatedMonthlyShipments: 30,
    mainCommodities: 'Copper cathodes',
    typicalModes: 'FCL',
    email: 'shipping@andescopper.cl',
    phone: '+56 32 555 0100',
    state: 'Valparaíso',
    country: 'Chile',
    businessType: 'Export',
    accountStage: 'Prospect',
    tradeLanes: 'Chile → China, FCL',
    monthlyTeu: 40,
    cargoTypes: 'General',
    preferredCarriers: 'Hapag-Lloyd, MSC',
    aiSummary:
      'Andes Copper exports copper cathodes from Valparaíso, 71% to China. Large volume (about 210 TEU/mo estimated) but Chile → China is not in our network today; the current 40 TEU quote would rely on a partner rate.',
    domain: 'andescopper.cl',
    tradeMoId: 'TM-33020',
    lastEnquiryDate: '2026-10-08',
    trade: mkTrade({
      id: 'TM-33020',
      country: 'Chile',
      dir: 'Export',
      partners: [['China', 0.71], ['Japan', 0.17], ['South Korea', 0.12]],
      hs: [['7403.11 · Copper cathodes', 0.88], ['2603.00 · Copper ores', 0.12]],
      products: [['Copper cathodes', 0.88], ['Copper concentrate', 0.12]],
      ports: [['CLVAP · Valparaíso', 0.66], ['CLSAI · San Antonio', 0.34]],
      shipments: 2210,
      value: -1,
      partnerCount: 9,
      teu: 210,
      monthly: [180, 176, 190, 188, 184, 192, 186, 179, 195, 201, 188, 191],
    }),
    history: { bookedTeuPerMonth: 0, revenueYtd: 0, marginYtd: 0, lanes: [{ lane: 'Chile → China', quotes: 1, won: 0 }] },
  },
  {
    ...base,
    id: 'ORG-0006',
    name: 'Baltic Steel',
    website: 'balticsteel.se',
    industry: 'Steel',
    territory: 'Europe',
    noOfEmployees: '501-1000',
    creditDays: 30,
    created: '2023-08-14',
    freightifyCompanyId: '7731240051',
    companyType: 'Shipper',
    estimatedMonthlyShipments: 18,
    mainCommodities: 'Steel coils, plates',
    typicalModes: 'FCL, Break bulk',
    email: 'logistics@balticsteel.se',
    phone: '+46 31 555 0100',
    state: 'Västra Götaland',
    country: 'Sweden',
    businessType: 'Export',
    accountStage: 'Customer',
    customerSince: '2023-09-01',
    lastBookingDate: '2026-06-18',
    contractRenewalDate: '2027-02-28',
    tradeLanes: 'Sweden → United States, FCL',
    monthlyTeu: 22,
    cargoTypes: 'General, Out of Gauge',
    preferredCarriers: 'Hapag-Lloyd',
    aiSummary:
      'Baltic Steel ships steel coils and plates from Gothenburg to the US East Coast. Customer since 2023; 22 TEU/mo stated. Some plate cargo is out of gauge, needing flat-racks. No TradeMo profile linked yet.',
    domain: 'balticsteel.se',
    lastEnquiryDate: '2026-10-12',
    history: {
      bookedTeuPerMonth: 14,
      revenueYtd: 301_000,
      marginYtd: 33_100,
      lanes: [{ lane: 'Sweden → United States', quotes: 11, won: 7, lastRate: 2050 }],
    },
  },
  {
    ...base,
    id: 'ORG-0007',
    name: 'Cairo Agro Exports',
    website: 'cairoagro.eg',
    industry: 'Agriculture',
    territory: 'MEA',
    noOfEmployees: '51-200',
    created: '2026-10-08',
    companyType: 'Shipper',
    freightifySyncStatus: 'FAILED',
    estimatedMonthlyShipments: 6,
    mainCommodities: 'Citrus, onions',
    typicalModes: 'LCL, FCL',
    email: 'trade@cairoagro.eg',
    phone: '+20 3 555 0100',
    state: 'Alexandria',
    country: 'Egypt',
    businessType: 'Export',
    accountStage: 'Prospect',
    tradeLanes: 'Egypt → Italy, LCL',
    monthlyTeu: 8,
    cargoTypes: 'Perishable, Reefer',
    aiSummary: 'Cairo Agro Exports ships citrus and onions from Alexandria to Italy, mostly reefer LCL. New prospect from 8 Oct; no trade data linked yet.',
    domain: 'cairoagro.eg',
    lastEnquiryDate: '2026-10-11',
  },
  {
    ...base,
    id: 'ORG-0008',
    name: 'Saigon Furniture',
    website: 'saigonfurn.vn',
    industry: 'Furniture',
    territory: 'Asia Pacific',
    noOfEmployees: '201-500',
    creditDays: 30,
    created: '2026-01-28',
    freightifyCompanyId: '7731240068',
    companyType: 'Shipper',
    estimatedMonthlyShipments: 16,
    mainCommodities: 'Wooden furniture',
    typicalModes: 'LCL, FCL',
    email: 'export@saigonfurn.vn',
    phone: '+84 28 555 0100',
    state: 'Ho Chi Minh City',
    country: 'Vietnam',
    businessType: 'Export',
    accountStage: 'Customer',
    customerSince: '2026-02-11',
    lastBookingDate: '2026-09-02',
    contractRenewalDate: '2027-02-11',
    tradeLanes: 'Vietnam → Australia, LCL\nVietnam → United States, FCL',
    monthlyTeu: 14,
    cargoTypes: 'General',
    preferredCarriers: 'Evergreen, ONE',
    aiSummary:
      'Saigon Furniture exports wooden furniture, 58% to the US. Trade data peaks Jul–Sep (US holiday restock). We book their Australia LCL; US FCL quotes have been lost on price twice. Trade data also shows a Germany lane they have not mentioned.',
    domain: 'saigonfurn.vn',
    tradeMoId: 'TM-72990',
    lastEnquiryDate: '2026-10-12',
    trade: mkTrade({
      id: 'TM-72990',
      country: 'Vietnam',
      dir: 'Export',
      partners: [['United States', 0.58], ['Australia', 0.27], ['Germany', 0.15]],
      hs: [['9403.60 · Wooden furniture', 0.74], ['9401.61 · Upholstered seats', 0.26]],
      products: [['Dining tables', 0.44], ['Cabinets', 0.3], ['Chairs', 0.26]],
      ports: [['VNSGN · Ho Chi Minh', 0.69], ['VNCMT · Cai Mep', 0.31]],
      shipments: 512,
      value: 14_300_000,
      partnerCount: 19,
      teu: 38,
      monthly: [34, 30, 26, 22, 25, 31, 33, 36, 38, 46, 49, 47],
    }),
    history: {
      bookedTeuPerMonth: 6,
      revenueYtd: 88_000,
      marginYtd: 11_400,
      lanes: [
        { lane: 'Vietnam → Australia', quotes: 7, won: 5, lastRate: 1180 },
        { lane: 'Vietnam → United States', quotes: 2, won: 0, lastRate: 2650 },
      ],
    },
  },
  {
    ...base,
    id: 'ORG-0009',
    name: 'Pacific Greens',
    website: 'pacificgreens.nz',
    industry: 'Food & beverage',
    territory: 'Asia Pacific',
    noOfEmployees: '11-50',
    created: '2026-09-30',
    companyType: 'Shipper',
    estimatedMonthlyShipments: 5,
    mainCommodities: 'Kiwifruit, avocados',
    typicalModes: 'FCL',
    email: 'ops@pacificgreens.nz',
    phone: '+64 9 555 0100',
    state: 'Auckland',
    country: 'New Zealand',
    businessType: 'Export',
    accountStage: 'Prospect',
    tradeLanes: 'New Zealand → Japan, FCL',
    monthlyTeu: 6,
    cargoTypes: 'Reefer, Perishable',
    aiSummary: 'Pacific Greens exports kiwifruit and avocados to Japan in reefers. Seasonal (Apr–Sep). New prospect, 6 TEU/mo stated.',
    domain: 'pacificgreens.nz',
    lastEnquiryDate: '2026-10-08',
  },
  {
    ...base,
    id: 'ORG-0010',
    name: 'Helsinki Pharma',
    website: 'helsinkipharma.fi',
    industry: 'Pharmaceuticals',
    territory: 'Europe',
    noOfEmployees: '201-500',
    creditDays: 45,
    created: '2026-09-12',
    freightifyCompanyId: '7731240083',
    companyType: 'Shipper',
    estimatedMonthlyShipments: 9,
    mainCommodities: 'Temperature-controlled pharmaceuticals',
    typicalModes: 'FCL, Air',
    email: 'supplychain@helsinkipharma.fi',
    phone: '+358 9 555 0100',
    state: 'Uusimaa',
    country: 'Finland',
    businessType: 'Export',
    accountStage: 'Customer',
    customerSince: '2026-09-18',
    lastBookingDate: '2026-10-05',
    tradeLanes: 'Finland → United States, FCL',
    monthlyTeu: 9,
    cargoTypes: 'Reefer, High Value',
    preferredCarriers: 'Maersk',
    aiSummary: 'Helsinki Pharma became a customer in September after a won reefer deal (9 TEU) to Boston. High-value, temperature-controlled cargo; they also move urgent batches by air.',
    domain: 'helsinkipharma.fi',
    lastEnquiryDate: '2026-10-05',
    history: {
      bookedTeuPerMonth: 9,
      revenueYtd: 95_600,
      marginYtd: 12_100,
      lanes: [{ lane: 'Finland → United States', quotes: 1, won: 1, lastRate: 10_600 }],
    },
  },
  {
    ...base,
    id: 'ORG-0011',
    name: 'Dakar Minerals',
    website: 'dakarminerals.sn',
    industry: 'Mining',
    territory: 'MEA',
    noOfEmployees: '501-1000',
    created: '2026-10-01',
    companyType: 'Shipper',
    estimatedMonthlyShipments: 20,
    mainCommodities: 'Phosphate, zircon sand',
    typicalModes: 'FCL',
    email: 'logistics@dakarminerals.sn',
    phone: '+221 33 555 0100',
    country: 'Senegal',
    businessType: 'Export',
    accountStage: 'Prospect',
    tradeLanes: 'Senegal → China, FCL',
    monthlyTeu: 30,
    cargoTypes: 'General',
    aiSummary: 'Dakar Minerals exports phosphate and zircon sand to China. 30 TEU quote sent; no trade data linked yet.',
    domain: 'dakarminerals.sn',
    lastEnquiryDate: '2026-10-12',
  },
  {
    ...base,
    id: 'ORG-0012',
    name: 'Lyon Automotive',
    website: 'lyonauto.fr',
    industry: 'Automotive',
    territory: 'Europe',
    noOfEmployees: '1000+',
    creditDays: 60,
    created: '2026-10-09',
    companyType: 'Consignee',
    estimatedMonthlyShipments: 12,
    mainCommodities: 'Auto parts',
    typicalModes: 'FCL',
    email: 'logistique@lyonauto.fr',
    phone: '+33 4 555 0100',
    state: 'Auvergne-Rhône-Alpes',
    country: 'France',
    businessType: 'Import & Export',
    accountStage: 'Prospect',
    tradeLanes: 'France → Mexico, FCL',
    monthlyTeu: 16,
    cargoTypes: 'General',
    aiSummary: 'Lyon Automotive moves auto parts from Fos to its Mexican assembly plant. New enquiry for 16 TEU received 12 Oct.',
    domain: 'lyonauto.fr',
    lastEnquiryDate: '2026-10-12',
  },
  {
    ...base,
    id: 'ORG-0013',
    name: 'Oslo Seafood',
    website: 'osloseafood.no',
    industry: 'Seafood',
    territory: 'Europe',
    noOfEmployees: '201-500',
    creditDays: 30,
    created: '2025-04-18',
    freightifyCompanyId: '7731240097',
    companyType: 'Shipper',
    estimatedMonthlyShipments: 10,
    mainCommodities: 'Frozen salmon',
    typicalModes: 'FCL',
    email: 'export@osloseafood.no',
    phone: '+47 22 555 0100',
    state: 'Oslo',
    country: 'Norway',
    businessType: 'Export',
    accountStage: 'Customer',
    customerSince: '2025-05-01',
    lastBookingDate: '2026-09-21',
    contractRenewalDate: '2026-11-15',
    tradeLanes: 'Norway → South Korea, FCL',
    monthlyTeu: 12,
    cargoTypes: 'Reefer, Perishable',
    preferredCarriers: 'Maersk, CMA CGM',
    aiSummary:
      'Oslo Seafood ships frozen salmon to Busan in reefers, 12 TEU/mo. Customer since May 2025. Their rate contract renews on 15 Nov — re-quote now; the current negotiation is the renewal itself.',
    domain: 'osloseafood.no',
    tradeMoId: 'TM-80455',
    lastEnquiryDate: '2026-10-11',
    trade: mkTrade({
      id: 'TM-80455',
      country: 'Norway',
      dir: 'Export',
      partners: [['South Korea', 0.62], ['Japan', 0.24], ['China', 0.14]],
      hs: [['0303.13 · Frozen Atlantic salmon', 0.81], ['0304.81 · Salmon fillets', 0.19]],
      products: [['Frozen salmon', 0.81], ['Salmon fillets', 0.19]],
      ports: [['NOOSL · Oslo', 0.57], ['NOAES · Ålesund', 0.43]],
      shipments: 210,
      value: 31_200_000,
      partnerCount: 7,
      teu: 18,
      monthly: [16, 18, 22, 14, 13, 14, 15, 16, 17, 18, 19, 20],
    }),
    history: {
      bookedTeuPerMonth: 11,
      revenueYtd: 244_000,
      marginYtd: 26_800,
      lanes: [{ lane: 'Norway → South Korea', quotes: 8, won: 6, lastRate: 5100 }],
    },
  },
  {
    ...base,
    id: 'ORG-0016',
    name: 'Mumbai Spices',
    website: 'mumbaispices.in',
    industry: 'Food & beverage',
    territory: 'South Asia',
    noOfEmployees: '51-200',
    creditDays: 15,
    created: '2026-09-15',
    freightifyCompanyId: '7731240102',
    companyType: 'Shipper',
    estimatedMonthlyShipments: 6,
    mainCommodities: 'Whole spices, spice blends',
    typicalModes: 'LCL',
    email: 'trade@mumbaispices.in',
    phone: '+91 22 555 0100',
    state: 'Maharashtra',
    country: 'India',
    businessType: 'Export',
    accountStage: 'Customer',
    customerSince: '2026-10-01',
    lastBookingDate: '2026-10-04',
    tradeLanes: 'India → UAE, LCL',
    monthlyTeu: 7,
    cargoTypes: 'General',
    aiSummary: 'Mumbai Spices became a customer on 1 Oct with a won LCL deal to Jebel Ali (7 TEU). Small, steady exporter; good LCL consolidation fit.',
    domain: 'mumbaispices.in',
    lastEnquiryDate: '2026-10-04',
    history: {
      bookedTeuPerMonth: 7,
      revenueYtd: 33_400,
      marginYtd: 4_300,
      lanes: [{ lane: 'India → UAE', quotes: 1, won: 1, lastRate: 4770 }],
    },
  },
  // Same company as lead "Hanseatic Machinery GmbH" under its legal name — matched by TradeMo id.
  {
    ...base,
    id: 'ORG-0014',
    name: 'Hanseatic Maschinenbau GmbH',
    website: 'hanseatic-maschinen.de',
    industry: 'Industrial machinery',
    territory: 'Europe',
    noOfEmployees: '201-500',
    created: '2026-06-03',
    companyType: 'Shipper',
    typicalModes: 'FCL',
    email: 'versand@hanseatic-maschinen.de',
    phone: '+49 40 555 0190',
    state: 'Hamburg',
    country: 'Germany',
    businessType: 'Import & Export',
    accountStage: 'Prospect',
    aiSummary:
      'Hanseatic Maschinenbau exports CNC machines and gearboxes from Hamburg, 82% to India, and imports castings back. Some machines are out of gauge. Their Japanese supplier Takara Industries is already our customer — a warm introduction.',
    domain: 'hanseatic-maschinen.de',
    tradeMoId: 'TM-90442',
    trade: tradeFromLead('AT-LEAD-0186'),
  },
  // Shares the domain of lead "Mekong Fresh Exports" — possible duplicate, rep decides.
  {
    ...base,
    id: 'ORG-0021',
    name: 'Mekong Fresh Export Co.',
    website: 'mekongfresh.vn',
    industry: 'Seafood',
    territory: 'Asia Pacific',
    noOfEmployees: '51-200',
    created: '2024-02-10',
    companyType: 'Shipper',
    mainCommodities: 'Frozen seafood',
    typicalModes: 'FCL',
    email: 'sales@mekongfresh.vn',
    country: 'Vietnam',
    state: 'Cần Thơ',
    businessType: 'Export',
    accountStage: 'Dormant',
    customerSince: '2024-03-01',
    lastBookingDate: '2025-12-12',
    cargoTypes: 'Reefer, Perishable',
    aiSummary: 'Mekong Fresh Export Co. booked reefer FCL with us in 2024–25; no enquiry since December 2025, so it moved to Dormant. A new lead on the same domain may be the same business.',
    domain: 'mekongfresh.vn',
    lastEnquiryDate: '2025-12-05',
    history: {
      bookedTeuPerMonth: 0,
      revenueYtd: 0,
      marginYtd: 0,
      lanes: [{ lane: 'Vietnam → United States', quotes: 6, won: 4, lastRate: 4200 }],
    },
  },
  {
    ...base,
    id: 'ORG-0030',
    name: 'Rhine Valley Chemicals',
    website: 'rvchem.de',
    industry: 'Chemicals',
    territory: 'Europe',
    noOfEmployees: '501-1000',
    creditDays: 30,
    created: '2024-11-05',
    freightifyCompanyId: '7731240118',
    companyType: 'Shipper',
    estimatedMonthlyShipments: 10,
    mainCommodities: 'Specialty resins (DG class 3)',
    typicalModes: 'FCL',
    email: 'logistik@rvchem.de',
    phone: '+49 621 555 0100',
    state: 'Rheinland-Pfalz',
    country: 'Germany',
    businessType: 'Export',
    accountStage: 'Customer',
    customerSince: '2024-12-02',
    lastBookingDate: '2026-04-22',
    tradeLanes: 'Germany → India, FCL',
    monthlyTeu: 10,
    cargoTypes: 'Hazardous (DG)',
    preferredCarriers: 'Hapag-Lloyd',
    aiSummary:
      'Rhine Valley Chemicals ships DG class 3 resins to India. No enquiry since 10 May 2026 — at 6 months the account turns Dormant. Worth a check-in call.',
    domain: 'rvchem.de',
    lastEnquiryDate: '2026-05-10',
    history: {
      bookedTeuPerMonth: 3,
      revenueYtd: 61_000,
      marginYtd: 8_200,
      lanes: [{ lane: 'Germany → India', quotes: 5, won: 3, lastRate: 2900 }],
    },
  },
];

/* ── Derived helpers ───────────────────────────────────────────────────────── */

/** The rep's stated lanes, parsed ("India → Germany, FCL" → { lane, mode }). */
export const statedLanes = (o: Organization) =>
  (o.tradeLanes ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [lane, mode] = l.split(',').map((s) => s.trim());
      return { lane, mode };
    });

/** Main lane for lists: trade data's main lane, else the first stated lane. */
export const mainLaneOf = (o: Organization) => o.trade?.mainLane ?? statedLanes(o)[0]?.lane ?? '—';

/** Win rate across all quoted lanes (0–1), or null with no quotes. */
export function winRate(o: Organization) {
  const q = o.history?.lanes.reduce((a, l) => a + l.quotes, 0) ?? 0;
  const w = o.history?.lanes.reduce((a, l) => a + l.won, 0) ?? 0;
  return q ? w / q : null;
}

/** A Customer with no enquiry for 6 months turns Dormant (workspace setting). */
export const DORMANT_AFTER_DAYS = 183;
