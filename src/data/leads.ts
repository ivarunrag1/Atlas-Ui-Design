/*
 * CRM Lead records — mock data in the shape of the field spec workbook:
 * "Atlas custom fields" (CRM Lead qualification / shipment / AI summary) and
 * "Trade data" (TradeMo match details + company trade profile).
 */

export type LeadStatus = 'New' | 'Contacted' | 'In discussion' | 'Nurturing' | 'Qualified' | 'Unqualified';
export type MatchFit = 'Strong' | 'Good' | 'Weak';
export type TradeDirection = 'Importer' | 'Exporter' | 'Both';

/** Lead statuses in board order (CRM Lead Status stage codes). */
export const leadStatuses: LeadStatus[] = ['New', 'Contacted', 'In discussion', 'Nurturing', 'Qualified', 'Unqualified'];

export const leadStatusColor: Record<LeadStatus, string> = {
  New: '#60a5fa',
  Contacted: '#a78bfa',
  'In discussion': '#f59e0b',
  Nurturing: '#2dd4bf',
  Qualified: '#22c55e',
  Unqualified: '#6b7280',
};

/** Country-to-country lanes this forwarder serves (its network) — drives "lane coverage". */
export const servedLanes = new Set([
  'India → Germany',
  'India → United States',
  'India → Netherlands',
  'India → United Kingdom',
  'China → United States',
  'China → India',
  'Vietnam → United States',
  'Vietnam → Germany',
  'Germany → India',
  'United States → India',
  'India → UAE',
  'Japan → Netherlands',
  'Sweden → United States',
  'Finland → United States',
  'Norway → South Korea',
  'Vietnam → Australia',
]);

export interface ShareRow {
  /** e.g. lane "India → Germany", HS "8708.29", product "Auto parts", port "INNSA", country "Germany". */
  name: string;
  /** Share of the company's trade, 0–1. */
  share: number;
  direction?: 'Import' | 'Export';
}

/** Trade data for one direction (TradeMo) — exports or imports. */
export interface TradeProfile {
  direction: 'Export' | 'Import';
  shipments: number;
  /** USD; -1 = not disclosed. */
  value: number;
  partners: number;
  estTeuPerMonth: number;
  /** Shipments per month, last 12 months (oldest first). */
  monthly: number[];
  lanes: ShareRow[];
  hsCodes: ShareRow[];
  products: ShareRow[];
  ports: ShareRow[];
  countries: ShareRow[];
}

export interface LeadSummary {
  id: string;
  company: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  location: string;
  status: LeadStatus;
  owner: string;
  source: 'SDR search' | 'Web form' | 'Referral' | 'Trade show';
  created: string;
  tasks: number;
  notes: number;

  // Qualification (Atlas pack)
  estimatedMonthlyShipments: number;
  mainCommodities: string;
  preferredCarrier: string;
  unqualifiedReason?: string;
  cargoType: string;
  destinationCountry: string;
  originCountry: string;
  mode: 'FCL' | 'LCL' | 'Air' | 'FTL' | 'LTL';
  movement: 'Port-to-Port' | 'Door-to-Port' | 'Port-to-Door' | 'Door-to-Door';

  // AI
  aiSummary: string;
  aiSummaryAt: string;

  /** TradeMo provider company id (dedupe key for the company on convert). */
  tradeMoId?: string;
  /** Set once converted — the deal / contact / company it produced. */
  convertedTo?: { dealId: string; contactId: string; organizationId: string };

  // Match details (SDR search)
  sdrSearchId: string;
  searchRole: 'Buyer' | 'Supplier';
  similarTo: string;
  matchFit: MatchFit;
  matchReason: string;
  matchedHsCodes: string[];
  matchedProducts: string[];
  matchedCountries: string[];
  matchedShipments: number;
  /** USD; -1 = not disclosed. */
  matchedShipmentValue: number;
  matchedPartnerCount: number;
  selectedBy: string;
  selectedAt: string;

  // Company trade profile (TradeMo)
  tradeDirection: TradeDirection;
  primaryProduct: string;
  primaryHs: string;
  totalShipments: number;
  totalShipmentValue: number;
  tradingPartners: number;
  estTeuPerMonth: number;
  tradeLanes: ShareRow[];
  hsCodes: ShareRow[];
  products: ShareRow[];
  ports: ShareRow[];
  countries: ShareRow[];
  /** Shipments per month, last 12 months (oldest first, ending Sep 2026). */
  monthlyShipments: number[];
  /** Handling flags implied by HS codes (DG, Reefer, OOG). */
  cargoFlags: string[];
  /** Their trading partners that are already our customers (warm paths). */
  partnersOurCustomers: string[];
  /** Avg. ocean rate per TEU on their main lanes (our rate cards) — for the wallet estimate. */
  avgRatePerTeu: number;
  tradePeriod: string;
  tradeAsOf: string;
  /** Separate export / import data when the company trades both ways. */
  profiles?: TradeProfile[];
}

export const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

export const leads: LeadSummary[] = [
  {
    id: 'AT-LEAD-0211',
    tradeMoId: 'TM-61830',
    company: 'Sundaram Auto Components',
    contactName: 'Arjun Mehta',
    contactRole: 'Head of Logistics',
    email: 'arjun.mehta@sundaramauto.in',
    phone: '+91 22 5550 0211',
    location: 'Pune · IN',
    status: 'In discussion',
    owner: 'Varun Reddy',
    source: 'SDR search',
    created: '14 Oct 2026',
    tasks: 2,
    notes: 1,
    estimatedMonthlyShipments: 38,
    mainCommodities: 'Auto parts, brake assemblies',
    preferredCarrier: 'Maersk, Hapag-Lloyd',
    cargoType: 'FAK',
    originCountry: 'India',
    destinationCountry: 'Germany',
    mode: 'FCL',
    movement: 'Door-to-Port',
    aiSummary:
      'Mid-size Indian exporter of auto components shipping ~38 FCL a month, mostly Nhava Sheva → Hamburg and Rotterdam. Volume is steady with a pre-Christmas peak in Sep–Nov. Uses Maersk and Hapag-Lloyd today; no single forwarder dominates their bills of lading. Two of their German buyers already book with us, which gives a credible intro. Good fit for a door-to-port FCL programme ex-Pune.',
    aiSummaryAt: '20 Oct 2026, 17:23',
    sdrSearchId: 'SDR-689237',
    searchRole: 'Supplier',
    similarTo: 'Orbit Manufacturing',
    matchFit: 'Strong',
    matchReason: 'Exports auto parts IN → DE on our core lane, like Orbit Manufacturing',
    matchedHsCodes: ['8708.29', '8708.30', '8714.10'],
    matchedProducts: ['Brake assemblies', 'Auto body parts'],
    matchedCountries: ['Germany', 'Netherlands', 'United States'],
    matchedShipments: 412,
    matchedShipmentValue: 18_400_000,
    matchedPartnerCount: 23,
    selectedBy: 'Varun Reddy',
    selectedAt: '14 Oct 2026, 11:05',
    tradeDirection: 'Exporter',
    primaryProduct: 'Brake assemblies',
    primaryHs: '8708.30',
    totalShipments: 456,
    totalShipmentValue: 21_300_000,
    tradingPartners: 27,
    estTeuPerMonth: 64,
    tradeLanes: [
      { name: 'India → Germany', share: 0.52, direction: 'Export' },
      { name: 'India → Netherlands', share: 0.21, direction: 'Export' },
      { name: 'India → United States', share: 0.17, direction: 'Export' },
      { name: 'India → Poland', share: 0.1, direction: 'Export' },
    ],
    hsCodes: [
      { name: '8708.30 · Brakes & parts', share: 0.46, direction: 'Export' },
      { name: '8708.29 · Body parts', share: 0.31, direction: 'Export' },
      { name: '8714.10 · Motorcycle parts', share: 0.15, direction: 'Export' },
      { name: '7318.15 · Bolts', share: 0.08, direction: 'Export' },
    ],
    products: [
      { name: 'Brake assemblies', share: 0.44 },
      { name: 'Auto body parts', share: 0.3 },
      { name: 'Two-wheeler spares', share: 0.16 },
      { name: 'Fasteners', share: 0.1 },
    ],
    ports: [
      { name: 'INNSA · Nhava Sheva', share: 0.71, direction: 'Export' },
      { name: 'INMUN · Mundra', share: 0.29, direction: 'Export' },
      { name: 'DEHAM · Hamburg', share: 0.48, direction: 'Import' },
      { name: 'NLRTM · Rotterdam', share: 0.22, direction: 'Import' },
    ],
    countries: [
      { name: 'Germany', share: 0.52, direction: 'Export' },
      { name: 'Netherlands', share: 0.21, direction: 'Export' },
      { name: 'United States', share: 0.17, direction: 'Export' },
      { name: 'Poland', share: 0.1, direction: 'Export' },
    ],
    monthlyShipments: [42, 47, 44, 31, 29, 33, 35, 34, 36, 38, 45, 52],
    cargoFlags: [],
    partnersOurCustomers: ['Orbit Manufacturing', 'Nordwind Logistics'],
    avgRatePerTeu: 1420,
    tradePeriod: 'Oct 2025 – Sep 2026',
    tradeAsOf: '20 Oct 2026',
  },
  {
    id: 'AT-LEAD-0207',
    tradeMoId: 'TM-72215',
    company: 'Mekong Fresh Exports',
    contactName: 'Linh Tran',
    contactRole: 'Export Manager',
    email: 'linh.tran@mekongfresh.vn',
    phone: '+84 28 5550 0207',
    location: 'Ho Chi Minh · VN',
    status: 'Contacted',
    owner: 'Varun Reddy',
    source: 'SDR search',
    created: '11 Oct 2026',
    tasks: 1,
    notes: 2,
    estimatedMonthlyShipments: 22,
    mainCommodities: 'Frozen seafood, dragon fruit',
    preferredCarrier: 'ONE, Evergreen',
    cargoType: 'Reefer',
    originCountry: 'Vietnam',
    destinationCountry: 'United States',
    mode: 'FCL',
    movement: 'Port-to-Port',
    aiSummary:
      'Vietnamese perishables exporter (frozen seafood and fresh fruit) shipping ~22 reefer FCL a month to the US West Coast and Europe. Strong seasonality around Lunar New Year and Q3 harvest. Needs reefer equipment and plugs at origin — check our reefer allocation on VN → US before pitching. No existing customers among their buyers.',
    aiSummaryAt: '20 Oct 2026, 09:02',
    sdrSearchId: 'SDR-691231',
    searchRole: 'Supplier',
    similarTo: 'Pacific Greens',
    matchFit: 'Good',
    matchReason: 'Reefer exporter VN → US; overlaps our transpacific lanes',
    matchedHsCodes: ['0306.17', '0810.90'],
    matchedProducts: ['Frozen shrimp', 'Dragon fruit'],
    matchedCountries: ['United States', 'Germany'],
    matchedShipments: 248,
    matchedShipmentValue: -1,
    matchedPartnerCount: 14,
    selectedBy: 'Varun Reddy',
    selectedAt: '11 Oct 2026, 16:40',
    tradeDirection: 'Exporter',
    primaryProduct: 'Frozen shrimp',
    primaryHs: '0306.17',
    totalShipments: 263,
    totalShipmentValue: -1,
    tradingPartners: 16,
    estTeuPerMonth: 38,
    tradeLanes: [
      { name: 'Vietnam → United States', share: 0.58, direction: 'Export' },
      { name: 'Vietnam → Germany', share: 0.24, direction: 'Export' },
      { name: 'Vietnam → Japan', share: 0.18, direction: 'Export' },
    ],
    hsCodes: [
      { name: '0306.17 · Frozen shrimp', share: 0.62, direction: 'Export' },
      { name: '0810.90 · Fresh fruit', share: 0.38, direction: 'Export' },
    ],
    products: [
      { name: 'Frozen shrimp', share: 0.62 },
      { name: 'Dragon fruit', share: 0.38 },
    ],
    ports: [
      { name: 'VNSGN · Ho Chi Minh', share: 0.81, direction: 'Export' },
      { name: 'USLAX · Los Angeles', share: 0.47, direction: 'Import' },
      { name: 'DEHAM · Hamburg', share: 0.24, direction: 'Import' },
    ],
    countries: [
      { name: 'United States', share: 0.58, direction: 'Export' },
      { name: 'Germany', share: 0.24, direction: 'Export' },
      { name: 'Japan', share: 0.18, direction: 'Export' },
    ],
    monthlyShipments: [18, 21, 26, 29, 16, 14, 17, 19, 22, 27, 30, 24],
    cargoFlags: ['Reefer'],
    partnersOurCustomers: [],
    avgRatePerTeu: 2650,
    tradePeriod: 'Oct 2025 – Sep 2026',
    tradeAsOf: '20 Oct 2026',
  },
  {
    id: 'AT-LEAD-0198',
    tradeMoId: 'TM-58004',
    company: 'Gujarat Chem Industries',
    contactName: 'Neha Shah',
    contactRole: 'Supply Chain Manager',
    email: 'neha.shah@gujchem.in',
    phone: '+91 79 5550 0198',
    location: 'Ahmedabad · IN',
    status: 'New',
    owner: 'Aisha Khan',
    source: 'SDR search',
    created: '09 Oct 2026',
    tasks: 0,
    notes: 0,
    estimatedMonthlyShipments: 15,
    mainCommodities: 'Industrial solvents, resins',
    preferredCarrier: 'CMA CGM',
    cargoType: 'Hazardous',
    originCountry: 'India',
    destinationCountry: 'United States',
    mode: 'FCL',
    movement: 'Door-to-Port',
    aiSummary:
      'Specialty chemicals exporter from Gujarat, ~15 FCL a month, mostly DG Class 3 solvents to the US Gulf and Europe. DG handling and documentation are a must; carriers with DG acceptance on INMUN → USHOU matter more than price. Lane IN → US is in our network; IN → BE is not.',
    aiSummaryAt: '19 Oct 2026, 14:11',
    sdrSearchId: 'SDR-690011',
    searchRole: 'Supplier',
    similarTo: 'Baltic Steel',
    matchFit: 'Good',
    matchReason: 'DG exporter on IN → US; needs a forwarder strong on DG documentation',
    matchedHsCodes: ['2902.30', '3907.30'],
    matchedProducts: ['Toluene', 'Epoxy resins'],
    matchedCountries: ['United States', 'Belgium'],
    matchedShipments: 168,
    matchedShipmentValue: 9_100_000,
    matchedPartnerCount: 9,
    selectedBy: 'Aisha Khan',
    selectedAt: '09 Oct 2026, 10:12',
    tradeDirection: 'Exporter',
    primaryProduct: 'Toluene',
    primaryHs: '2902.30',
    totalShipments: 181,
    totalShipmentValue: 9_800_000,
    tradingPartners: 11,
    estTeuPerMonth: 21,
    tradeLanes: [
      { name: 'India → United States', share: 0.61, direction: 'Export' },
      { name: 'India → Belgium', share: 0.39, direction: 'Export' },
    ],
    hsCodes: [
      { name: '2902.30 · Toluene', share: 0.55, direction: 'Export' },
      { name: '3907.30 · Epoxy resins', share: 0.45, direction: 'Export' },
    ],
    products: [
      { name: 'Toluene', share: 0.55 },
      { name: 'Epoxy resins', share: 0.45 },
    ],
    ports: [
      { name: 'INMUN · Mundra', share: 0.88, direction: 'Export' },
      { name: 'USHOU · Houston', share: 0.61, direction: 'Import' },
      { name: 'BEANR · Antwerp', share: 0.39, direction: 'Import' },
    ],
    countries: [
      { name: 'United States', share: 0.61, direction: 'Export' },
      { name: 'Belgium', share: 0.39, direction: 'Export' },
    ],
    monthlyShipments: [14, 15, 13, 16, 15, 14, 16, 17, 15, 14, 16, 16],
    cargoFlags: ['DG'],
    partnersOurCustomers: [],
    avgRatePerTeu: 1950,
    tradePeriod: 'Oct 2025 – Sep 2026',
    tradeAsOf: '20 Oct 2026',
  },
  {
    id: 'AT-LEAD-0186',
    tradeMoId: 'TM-90442',
    company: 'Hanseatic Machinery GmbH',
    contactName: 'Jonas Becker',
    contactRole: 'Procurement Director',
    email: 'jonas.becker@hanseatic-maschinen.de',
    phone: '+49 40 5550 0186',
    location: 'Hamburg · DE',
    status: 'Qualified',
    owner: 'Varun Reddy',
    source: 'Referral',
    created: '02 Oct 2026',
    tasks: 3,
    notes: 4,
    estimatedMonthlyShipments: 9,
    mainCommodities: 'Industrial machinery, spare parts',
    preferredCarrier: 'Hapag-Lloyd',
    cargoType: 'Out of gauge',
    originCountry: 'Germany',
    destinationCountry: 'India',
    mode: 'FCL',
    movement: 'Port-to-Door',
    aiSummary:
      'German machinery importer into India with project cargo and spares, ~9 shipments a month incl. flat-rack and open-top units. High value per shipment; needs OOG handling and door delivery in Pune and Chennai. Referred by Nordwind Logistics.',
    aiSummaryAt: '18 Oct 2026, 08:45',
    sdrSearchId: '—',
    searchRole: 'Buyer',
    similarTo: 'Takara Industries',
    matchFit: 'Strong',
    matchReason: 'Referral — machinery DE → IN with OOG on our Germany ↔ India lane',
    matchedHsCodes: ['8479.89', '8483.40'],
    matchedProducts: ['CNC machines', 'Gearboxes'],
    matchedCountries: ['India'],
    matchedShipments: 104,
    matchedShipmentValue: 38_600_000,
    matchedPartnerCount: 6,
    selectedBy: 'Varun Reddy',
    selectedAt: '02 Oct 2026, 15:30',
    tradeDirection: 'Both',
    primaryProduct: 'CNC machines',
    primaryHs: '8479.89',
    totalShipments: 131,
    totalShipmentValue: 44_900_000,
    tradingPartners: 8,
    estTeuPerMonth: 17,
    tradeLanes: [
      { name: 'Germany → India', share: 0.74, direction: 'Export' },
      { name: 'India → Germany', share: 0.26, direction: 'Import' },
    ],
    hsCodes: [
      { name: '8479.89 · Machines n.e.s.', share: 0.58, direction: 'Export' },
      { name: '8483.40 · Gearboxes', share: 0.42, direction: 'Export' },
    ],
    products: [
      { name: 'CNC machines', share: 0.58 },
      { name: 'Gearboxes', share: 0.42 },
    ],
    ports: [
      { name: 'DEHAM · Hamburg', share: 0.9, direction: 'Export' },
      { name: 'INNSA · Nhava Sheva', share: 0.64, direction: 'Import' },
      { name: 'INMAA · Chennai', share: 0.36, direction: 'Import' },
    ],
    countries: [
      { name: 'India', share: 0.74, direction: 'Export' },
      { name: 'India', share: 0.26, direction: 'Import' },
    ],
    monthlyShipments: [10, 11, 9, 7, 8, 12, 11, 10, 13, 12, 14, 14],
    cargoFlags: ['OOG'],
    partnersOurCustomers: ['Takara Industries'],
    avgRatePerTeu: 1760,
    tradePeriod: 'Oct 2025 – Sep 2026',
    tradeAsOf: '20 Oct 2026',
    profiles: [
      {
        direction: 'Export',
        shipments: 97,
        value: 33_200_000,
        partners: 6,
        estTeuPerMonth: 13,
        monthly: [8, 8, 7, 5, 6, 9, 8, 7, 10, 9, 10, 10],
        lanes: [
          { name: 'Germany → India', share: 0.82 },
          { name: 'Germany → Vietnam', share: 0.18 },
        ],
        hsCodes: [
          { name: '8479.89 · Machines n.e.s.', share: 0.58 },
          { name: '8483.40 · Gearboxes', share: 0.42 },
        ],
        products: [
          { name: 'CNC machines', share: 0.58 },
          { name: 'Gearboxes', share: 0.42 },
        ],
        ports: [
          { name: 'DEHAM · Hamburg (loading)', share: 0.9 },
          { name: 'INNSA · Nhava Sheva (discharge)', share: 0.56 },
          { name: 'INMAA · Chennai (discharge)', share: 0.26 },
        ],
        countries: [
          { name: 'India', share: 0.82 },
          { name: 'Vietnam', share: 0.18 },
        ],
      },
      {
        direction: 'Import',
        shipments: 34,
        value: 11_700_000,
        partners: 2,
        estTeuPerMonth: 4,
        monthly: [2, 3, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4],
        lanes: [{ name: 'India → Germany', share: 1 }],
        hsCodes: [
          { name: '8483.90 · Gear parts', share: 0.7 },
          { name: '7326.90 · Steel castings', share: 0.3 },
        ],
        products: [
          { name: 'Gear parts', share: 0.7 },
          { name: 'Steel castings', share: 0.3 },
        ],
        ports: [
          { name: 'INNSA · Nhava Sheva (loading)', share: 0.8 },
          { name: 'DEHAM · Hamburg (discharge)', share: 1 },
        ],
        countries: [{ name: 'India', share: 1 }],
      },
    ],
  },
  {
    id: 'AT-LEAD-0179',
    tradeMoId: 'TM-33019',
    company: 'Andean Copper Traders',
    contactName: 'Camila Rojas',
    contactRole: 'Logistics Coordinator',
    email: 'camila.rojas@andeancopper.cl',
    phone: '+56 32 5550 0179',
    location: 'Valparaíso · CL',
    status: 'Unqualified',
    owner: 'Aisha Khan',
    source: 'Trade show',
    created: '28 Sep 2026',
    tasks: 0,
    notes: 1,
    estimatedMonthlyShipments: 6,
    mainCommodities: 'Copper cathodes',
    preferredCarrier: 'MSC',
    unqualifiedReason: 'Lanes Not Served',
    cargoType: 'FAK',
    originCountry: 'Chile',
    destinationCountry: 'China',
    mode: 'FCL',
    movement: 'Port-to-Port',
    aiSummary:
      'Chilean copper trader shipping cathodes CL → CN. Lanes are outside our network and volumes are small; marked unqualified (Lanes Not Served). Revisit only if we open South America west coast.',
    aiSummaryAt: '30 Sep 2026, 12:00',
    sdrSearchId: '—',
    searchRole: 'Supplier',
    similarTo: '—',
    matchFit: 'Weak',
    matchReason: 'Trade-show contact; lanes not in our network',
    matchedHsCodes: ['7403.11'],
    matchedProducts: ['Copper cathodes'],
    matchedCountries: ['China'],
    matchedShipments: 70,
    matchedShipmentValue: 52_000_000,
    matchedPartnerCount: 3,
    selectedBy: 'Aisha Khan',
    selectedAt: '28 Sep 2026, 18:20',
    tradeDirection: 'Exporter',
    primaryProduct: 'Copper cathodes',
    primaryHs: '7403.11',
    totalShipments: 72,
    totalShipmentValue: 53_100_000,
    tradingPartners: 3,
    estTeuPerMonth: 12,
    tradeLanes: [{ name: 'Chile → China', share: 1, direction: 'Export' }],
    hsCodes: [{ name: '7403.11 · Copper cathodes', share: 1, direction: 'Export' }],
    products: [{ name: 'Copper cathodes', share: 1 }],
    ports: [
      { name: 'CLVAP · Valparaíso', share: 1, direction: 'Export' },
      { name: 'CNSHA · Shanghai', share: 1, direction: 'Import' },
    ],
    countries: [{ name: 'China', share: 1, direction: 'Export' }],
    monthlyShipments: [6, 6, 5, 7, 6, 6, 5, 6, 7, 6, 6, 6],
    cargoFlags: [],
    partnersOurCustomers: [],
    avgRatePerTeu: 0,
    tradePeriod: 'Oct 2025 – Sep 2026',
    tradeAsOf: '20 Oct 2026',
  },
];

/**
 * Trade profiles by direction. Companies trading both ways carry `profiles`; otherwise
 * one profile is derived from the summary fields (Importer → Import, else Export).
 */
export const tradeProfiles = (l: LeadSummary): TradeProfile[] =>
  l.profiles ?? [
    {
      direction: l.tradeDirection === 'Importer' ? 'Import' : 'Export',
      shipments: l.totalShipments,
      value: l.totalShipmentValue,
      partners: l.tradingPartners,
      estTeuPerMonth: l.estTeuPerMonth,
      monthly: l.monthlyShipments,
      lanes: l.tradeLanes,
      hsCodes: l.hsCodes,
      products: l.products,
      ports: l.ports,
      countries: l.countries,
    },
  ];

/** Share of the lead's trade on lanes we serve (0–1). */
export const laneCoverage = (l: LeadSummary) =>
  l.tradeLanes.reduce((a, t) => a + (servedLanes.has(t.name) ? t.share : 0), 0);

/** Est. monthly freight spend on lanes we serve (USD) — est. TEU × our avg rate × coverage. */
export const walletEstimate = (l: LeadSummary) => Math.round(l.estTeuPerMonth * l.avgRatePerTeu * laneCoverage(l));

/** Peak months (≥ 110% of the 12-month average) — for a lead or any monthly series. */
export const peakMonths = (l: LeadSummary | number[]) => {
  const series = Array.isArray(l) ? l : l.monthlyShipments;
  const avg = series.reduce((a, n) => a + n, 0) / series.length;
  return MONTHS.filter((_, i) => series[i] >= avg * 1.1);
};

/** USD, with -1 → "Not disclosed" (per the spec). */
export const usdOrUndisclosed = (n: number) =>
  n < 0 ? 'Not disclosed' : n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${n.toLocaleString('en-US')}`;
