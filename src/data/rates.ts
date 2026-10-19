/* Mock rate search results for step 2 (would come back from the platform + carrier APIs). */
import ooclLogo from '../assets/carriers/oocl.png';

export type InlandMode = 'truck' | 'rail' | 'barge';

/** Inland origin / destination (place of receipt / delivery). */
export interface InlandPoint {
  code: string;
  name: string;
  /** ICD / CFS the cargo is handled at. */
  facility?: string;
  /** Door address for pickup / delivery. */
  door?: { name: string; code: string };
}

/** Pre- or on-carriage leg between an inland point and the port. */
export interface InlandLeg {
  mode: InlandMode;
  operator: string;
}

export interface PortCall {
  code: string;
  name: string;
  terminal?: string;
  /** Free days at this port (origin side for the POL). */
  freeDays?: { demurrage: number; detention: number };
}

export interface RateRoute {
  /** Pre-carriage — omitted when the rate starts at the port (CY). */
  origin?: { point: InlandPoint; leg: InlandLeg };
  pol: PortCall;
  ocean: {
    /** Transhipment ports; empty = direct. */
    via: string[];
    /** Available sailings (departure dates); first is the default. */
    sailings: string[];
    transit: string;
  };
  pod: PortCall & { freeDays: { demurrage: number; detention: number } };
  /** On-carriage — omitted when the rate ends at the port (CY). */
  destination?: { point: InlandPoint; leg: InlandLeg };
}

/** CO₂ emission rating of the routing (relative to the lane). */
export type Co2Level = 'Low' | 'Medium' | 'High';

export interface Co2 {
  /** Well-to-wake CO₂e for the shipment, tonnes. */
  tonnes: number;
  level: Co2Level;
}

export interface RateCard {
  /** Rate reference on the platform / carrier system. */
  rateId: string;
  carrier: string;
  /** Short code for the logo tile when no `logoUrl` is available. */
  carrierCode: string;
  logoUrl?: string;
  /** Carrier service / product names on this routing. */
  services: string[];
  /** Customer the rate is filed for. */
  customer: string;
  /** Where the rate comes from (platform rate type or online carrier). */
  provider: string;
  /** Forwarder or agent the rate is from. */
  agent: string;
  commodity: string;
  hazardous: boolean;
  co2: Co2;
  currency: string;
  validFrom: string;
  validTo: string;
  route: RateRoute;
  /** Per-unit ocean price by container type. */
  prices: Record<string, { buy: number; sell: number }>;
}

/* Shared route pieces for the INNSA → DEHAM lane. */
const bhiwandiPickup = {
  point: { code: 'INNSA', name: 'Nhava Sheva', facility: 'ICD Dronagiri', door: { name: 'Bhiwandi', code: '421302' } },
};
const pol: PortCall = { code: 'INNSA', name: 'Port of Nhava Sheva', terminal: 'JNPCT', freeDays: { demurrage: 5, detention: 7 } };
const pod = (terminal: string, demurrage = 7, detention = 7) => ({
  code: 'DEHAM',
  name: 'Port of Hamburg',
  terminal,
  freeDays: { demurrage, detention },
});

const baseRates: RateCard[] = [
  {
    rateId: 'MSK-FAK-2611-0418',
    carrier: 'Maersk',
    carrierCode: 'MSK',
    services: ['ME11', 'Maersk Spot'],
    customer: 'Orbit Manufacturing',
    provider: 'Maersk Spot',
    agent: 'XYZ Forwarder',
    commodity: 'FAK | General cargo',
    hazardous: false,
    co2: { tonnes: 18.6, level: 'Medium' },
    currency: 'USD',
    validFrom: '01 Nov 2026',
    validTo: '31 Dec 2026',
    route: {
      origin: { ...bhiwandiPickup, leg: { mode: 'truck', operator: 'Maersk Haulage' } },
      pol,
      ocean: { via: ['LKCMB'], sailings: ['04 Nov 2026', '11 Nov 2026', '18 Nov 2026'], transit: '26–28 days' },
      pod: pod('CTA Altenwerder'),
    },
    prices: {
      "20'GP": { buy: 4800, sell: 5400 },
      "40'GP": { buy: 8600, sell: 9600 },
      "40'HC": { buy: 9200, sell: 10300 },
      "45'HC": { buy: 9900, sell: 11000 },
    },
  },
  {
    rateId: 'MSC-FAK-2611-1172',
    carrier: 'MSC',
    carrierCode: 'MSC',
    services: ['Himalaya Express'],
    customer: 'Orbit Manufacturing',
    provider: 'Contract rates',
    agent: 'Bluewave Logistics',
    commodity: 'FAK | General cargo',
    hazardous: false,
    co2: { tonnes: 21.9, level: 'High' },
    currency: 'USD',
    validFrom: '01 Nov 2026',
    validTo: '31 Dec 2026',
    route: {
      origin: { ...bhiwandiPickup, leg: { mode: 'rail', operator: 'CONCOR Rail' } },
      pol,
      ocean: { via: ['OMSLL', 'ESALG'], sailings: ['05 Nov 2026', '12 Nov 2026'], transit: '29–31 days' },
      pod: pod('Eurogate', 5, 5),
    },
    prices: {
      "20'GP": { buy: 4650, sell: 5250 },
      "40'GP": { buy: 8400, sell: 9400 },
      "40'HC": { buy: 9000, sell: 10100 },
    },
  },
  {
    rateId: 'CMA-DG3-2611-0087',
    carrier: 'CMA CGM',
    carrierCode: 'CMA',
    services: ['EPIC', 'SpotOn'],
    customer: 'Orbit Manufacturing',
    provider: 'CMA CGM SpotOn',
    agent: 'Nordsee Agency',
    commodity: 'Chemicals | DG Class 3',
    hazardous: true,
    co2: { tonnes: 19.4, level: 'Medium' },
    currency: 'USD',
    validFrom: '01 Nov 2026',
    validTo: '28 Dec 2026',
    route: {
      origin: { ...bhiwandiPickup, leg: { mode: 'truck', operator: 'CEVA Trucking' } },
      pol,
      ocean: { via: ['AEJEA'], sailings: ['06 Nov 2026'], transit: '28–30 days' },
      pod: pod('CTB Burchardkai'),
    },
    prices: {
      "20'GP": { buy: 5100, sell: 5800 },
      "40'GP": { buy: 8900, sell: 9900 },
      "40'HC": { buy: 9367, sell: 10500 },
      "45'HC": { buy: 10100, sell: 11300 },
    },
  },
  {
    rateId: 'HLC-FAK-2611-0563',
    carrier: 'Hapag-Lloyd',
    carrierCode: 'HLC',
    services: ['IOS', 'Quick Quotes'],
    customer: 'Orbit Manufacturing',
    provider: 'Hapag-Lloyd Quick Quotes',
    agent: 'Atlas Freight Partners',
    commodity: 'FAK | General cargo',
    hazardous: false,
    co2: { tonnes: 15.2, level: 'Low' },
    currency: 'USD',
    validFrom: '01 Nov 2026',
    validTo: '31 Dec 2026',
    route: {
      origin: { ...bhiwandiPickup, leg: { mode: 'truck', operator: 'HL Inland' } },
      pol,
      ocean: { via: [], sailings: ['04 Nov 2026', '14 Nov 2026'], transit: '27–28 days' },
      pod: pod('CTA Altenwerder', 10, 7),
      destination: {
        point: { code: 'DEAGB', name: 'Augsburg', facility: 'Terminal Augsburg', door: { name: 'Augsburg', code: '86153' } },
        leg: { mode: 'rail', operator: 'TFG Transfracht' },
      },
    },
    prices: {
      "20'GP": { buy: 5000, sell: 5600 },
      "40'GP": { buy: 8800, sell: 9800 },
      "40'HC": { buy: 9433, sell: 10600 },
      "45'HC": { buy: 10200, sell: 11400 },
    },
  },
  {
    rateId: '12345XYZ',
    carrier: 'OOCL',
    carrierCode: 'OOCL',
    logoUrl: ooclLogo,
    services: ['Barge', 'Super Fast Express', 'Feeder'],
    customer: 'Orbit Manufacturing',
    provider: 'Spot rates',
    agent: 'Pacific Link Agents',
    commodity: 'FAK | Rice',
    hazardous: false,
    co2: { tonnes: 17.8, level: 'Medium' },
    currency: 'USD',
    validFrom: '01 Nov 2026',
    validTo: '24 Dec 2026',
    route: {
      origin: { ...bhiwandiPickup, leg: { mode: 'rail', operator: 'APL Rail' } },
      pol,
      ocean: { via: ['LKCMB', 'NLRTM'], sailings: ['07 Nov 2026', '14 Nov 2026', '21 Nov 2026'], transit: '21–23 days' },
      pod: pod('CTT Tollerort'),
    },
    prices: {
      "20'GP": { buy: 4500, sell: 5100 },
      "40'GP": { buy: 8300, sell: 9300 },
      "40'HC": { buy: 8956, sell: 10000 },
      "45'HC": { buy: 9700, sell: 10800 },
    },
  },
];

/** Builds an extra mock rate on the INNSA → DEHAM lane (more results to scroll). */
const extraRate = (
  carrier: string,
  carrierCode: string,
  agent: string,
  provider: string,
  opts: {
    seq: string;
    services: string[];
    pre: InlandLeg;
    via: string[];
    sailings: string[];
    transit: string;
    terminal: string;
    co2: Co2;
    validTo: string;
    base: number; // 40'HC buy
    hazardous?: boolean;
    no45?: boolean;
    onCarriage?: { point: InlandPoint; leg: InlandLeg };
  },
): RateCard => {
  const p = (buy: number) => ({ buy, sell: Math.round((buy * 1.115) / 10) * 10 });
  const b = opts.base;
  return {
    rateId: `${carrierCode}-${opts.hazardous ? 'DG3' : 'FAK'}-2611-${opts.seq}`,
    carrier,
    carrierCode,
    services: opts.services,
    customer: 'Orbit Manufacturing',
    provider,
    agent,
    commodity: opts.hazardous ? 'Chemicals | DG Class 3' : 'FAK | General cargo',
    hazardous: !!opts.hazardous,
    co2: opts.co2,
    currency: 'USD',
    validFrom: '01 Nov 2026',
    validTo: opts.validTo,
    route: {
      origin: { ...bhiwandiPickup, leg: opts.pre },
      pol,
      ocean: { via: opts.via, sailings: opts.sailings, transit: opts.transit },
      pod: pod(opts.terminal),
      ...(opts.onCarriage ? { destination: opts.onCarriage } : {}),
    },
    prices: {
      "20'GP": p(Math.round(b * 0.52)),
      "40'GP": p(Math.round(b * 0.935)),
      "40'HC": p(b),
      ...(opts.no45 ? {} : { "45'HC": p(Math.round(b * 1.075)) }),
    },
  };
};

const moreRates: RateCard[] = [
  extraRate('ONE', 'ONE', 'Bluewave Logistics', 'ONE Quote', {
    seq: '0931', services: ['EC5', 'ONE Quote'], pre: { mode: 'truck', operator: 'ONE Inland' },
    via: ['LKCMB', 'NLRTM'], sailings: ['07 Nov 2026', '14 Nov 2026'], transit: '31–33 days',
    terminal: 'CTB Burchardkai', co2: { tonnes: 22.4, level: 'High' }, validTo: '24 Dec 2026', base: 8850,
  }),
  extraRate('Evergreen', 'EGL', 'XYZ Forwarder', 'Contract rates', {
    seq: '0274', services: ['CEM'], pre: { mode: 'rail', operator: 'CONCOR Rail' },
    via: ['MYPKG'], sailings: ['08 Nov 2026', '15 Nov 2026', '22 Nov 2026'], transit: '30–32 days',
    terminal: 'Eurogate', co2: { tonnes: 19.9, level: 'Medium' }, validTo: '15 Dec 2026', base: 8700,
  }),
  extraRate('COSCO', 'COS', 'Pacific Link Agents', 'Spot rates', {
    seq: '1408', services: ['AEU3', 'SynCon'], pre: { mode: 'truck', operator: 'Gati Haulage' },
    via: ['CNSHA', 'SGSIN'], sailings: ['05 Nov 2026'], transit: '34–36 days',
    terminal: 'CTT Tollerort', co2: { tonnes: 24.1, level: 'High' }, validTo: '30 Nov 2026', base: 8400,
  }),
  extraRate('Yang Ming', 'YML', 'Nordsee Agency', 'Contract rates', {
    seq: '0655', services: ['IEX'], pre: { mode: 'truck', operator: 'TCI Freight' },
    via: [], sailings: ['09 Nov 2026', '23 Nov 2026'], transit: '24–25 days',
    terminal: 'CTA Altenwerder', co2: { tonnes: 14.3, level: 'Low' }, validTo: '20 Dec 2026', base: 9650, no45: true,
  }),
  extraRate('ZIM', 'ZIM', 'Atlas Freight Partners', 'Spot rates', {
    seq: '0390', services: ['ZMX', 'ZIM eQuote'], pre: { mode: 'rail', operator: 'APL Rail' },
    via: ['ILHFA'], sailings: ['06 Nov 2026', '13 Nov 2026'], transit: '27–29 days',
    terminal: 'CTB Burchardkai', co2: { tonnes: 17.2, level: 'Medium' }, validTo: '28 Dec 2026', base: 9100, hazardous: true,
  }),
  extraRate('HMM', 'HMM', 'Bluewave Logistics', 'Tariff rates', {
    seq: '0712', services: ['FEX'], pre: { mode: 'truck', operator: 'HMM Haulage' },
    via: ['AEJEA', 'EGPSD'], sailings: ['10 Nov 2026'], transit: '32–34 days',
    terminal: 'Eurogate', co2: { tonnes: 21.5, level: 'High' }, validTo: '31 Dec 2026', base: 8550,
  }),
  extraRate('Wan Hai', 'WHL', 'Pacific Link Agents', 'Spot rates', {
    seq: '0168', services: ['IA1'], pre: { mode: 'truck', operator: 'Wan Hai Inland' },
    via: ['SGSIN'], sailings: ['11 Nov 2026', '18 Nov 2026'], transit: '29–31 days',
    terminal: 'CTT Tollerort', co2: { tonnes: 16.4, level: 'Low' }, validTo: '10 Dec 2026', base: 8650,
    onCarriage: {
      point: { code: 'DEDUI', name: 'Duisburg', facility: 'Logport Duisburg', door: { name: 'Duisburg', code: '47229' } },
      leg: { mode: 'barge', operator: 'Contargo Barge' },
    },
  }),
];

export const rateCards: RateCard[] = [...baseRates, ...moreRates];

/** A container line from the search (step 1 load details). */
export interface SearchLine {
  type: string;
  qty: number;
  weightKg: number;
}

/** Ocean cost for the searched equipment (buy × qty); types the rate doesn't quote count as 0. */
export const oceanOf = (r: RateCard, lines: SearchLine[]) =>
  lines.reduce((a, l) => a + (r.prices[l.type]?.buy ?? 0) * l.qty, 0);

/* ── Charge breakdown per leg (expanded card) ──────────────────────────────── */

export type LegKey = 'pre' | 'origin' | 'ocean' | 'destination' | 'on';
type Amount = { buy: number; sell: number };

export interface ChargeLine {
  /** Stable id (labels are editable in step 3). */
  id: string;
  label: string;
  /** Optional note on this charge line. */
  comment?: string;
  /** Currency the amounts are quoted in (defaults to the rate's currency). */
  currency?: string;
  /** What the charge is levied on. */
  basis: 'Per container' | 'Per B/L';
  /** How the amount is worked out. */
  calc: 'Fixed' | 'Per unit' | '% of freight';
  /** Per-container charges: amount per unit, by equipment type. */
  perUnit?: Record<string, Amount>;
  /** Per-B/L charges: amount per bill of lading. */
  perBl?: Amount;
}

export interface LegCharges {
  key: LegKey;
  /** Leg name only, e.g. "Origin port". */
  title: string;
  mode: InlandMode | 'port' | 'ocean';
  charges: ChargeLine[];
}

/** Mock tariffs per equipment type (20' / 40' / 40'HC / 45'HC). */
const byType = (t20: number, t40: number, t40hc: number, t45: number, markup = 1.12): Record<string, Amount> => {
  const a = (buy: number) => ({ buy, sell: Math.round((buy * markup) / 5) * 5 });
  return { "20'GP": a(t20), "40'GP": a(t40), "40'HC": a(t40hc), "45'HC": a(t45) };
};
const tariff = {
  haulage: {
    truck: byType(250, 350, 350, 400, 1.2),
    rail: byType(220, 300, 300, 340, 1.2),
    barge: byType(200, 280, 280, 320, 1.2),
  },
  thcOrigin: byType(300, 450, 450, 520),
  seal: byType(10, 10, 10, 10, 1.5),
  docs: { buy: 450, sell: 500 },
  baf: byType(190, 367, 367, 410, 1.09),
  thcDest: byType(400, 600, 600, 680, 1.08),
  deliveryOrder: { buy: 85, sell: 100 },
};

/** Leg-by-leg charges (buy + sell) for a rate, per equipment unit and per B/L. */
export function chargeBreakdown(r: RateCard): LegCharges[] {
  const legs: (Omit<LegCharges, 'charges'> & { charges: Omit<ChargeLine, 'id'>[] })[] = [];
  const { origin, destination } = r.route;

  if (origin) {
    legs.push({
      key: 'pre',
      title: 'Pre-carriage',
      mode: origin.leg.mode,
      charges: [{ label: `${origin.leg.operator} haulage`, basis: 'Per container', calc: 'Per unit', perUnit: tariff.haulage[origin.leg.mode] }],
    });
  }
  legs.push({
    key: 'origin',
    title: 'Origin port',
    mode: 'port',
    charges: [
      { label: 'Terminal handling (THC)', basis: 'Per container', calc: 'Per unit', perUnit: tariff.thcOrigin },
      { label: 'Seal fee', basis: 'Per container', calc: 'Fixed', perUnit: tariff.seal },
      { label: 'Documentation & B/L', basis: 'Per B/L', calc: 'Fixed', perBl: tariff.docs },
    ],
  });
  // War-risk surcharge = 2% of the ocean freight, per type.
  const warRisk: Record<string, Amount> = Object.fromEntries(
    Object.entries(r.prices).map(([t, p]) => [t, { buy: Math.round(p.buy * 0.02), sell: Math.round(p.sell * 0.02) }]),
  );
  legs.push({
    key: 'ocean',
    title: 'Ocean',
    mode: 'ocean',
    charges: [
      { label: 'Ocean freight', basis: 'Per container', calc: 'Per unit', perUnit: r.prices },
      { label: 'Bunker / currency adj (BAF/CAF)', basis: 'Per container', calc: 'Per unit', perUnit: tariff.baf },
      { label: 'War risk surcharge (2%)', basis: 'Per container', calc: '% of freight', perUnit: warRisk },
    ],
  });
  legs.push({
    key: 'destination',
    title: 'Destination port',
    mode: 'port',
    charges: [
      { label: 'Terminal handling (THC)', basis: 'Per container', calc: 'Per unit', perUnit: tariff.thcDest },
      { label: 'Delivery order', basis: 'Per B/L', calc: 'Fixed', perBl: tariff.deliveryOrder },
    ],
  });
  if (destination) {
    legs.push({
      key: 'on',
      title: 'On-carriage',
      mode: destination.leg.mode,
      charges: [
        { label: `${destination.leg.operator} haulage`, basis: 'Per container', calc: 'Per unit', perUnit: tariff.haulage[destination.leg.mode] },
      ],
    });
  }
  // Stable ids per charge line (leg key + position).
  return legs.map((leg) => ({ ...leg, charges: leg.charges.map((c, i) => ({ ...c, id: `${leg.key}-${i}` })) }));
}

/* ── Currency (mock FX — would come from the rate platform) ────────────────── */

export const CURRENCIES = ['USD', 'EUR', 'INR', 'GBP', 'AED', 'SGD', 'CNY'] as const;
/** Value of 1 unit in USD. */
const usdPer: Record<string, number> = { USD: 1, EUR: 1.08, INR: 0.012, GBP: 1.27, AED: 0.2723, SGD: 0.74, CNY: 0.138 };

/** Convert an amount from one currency to another (totals are shown in the rate's currency). */
export const fx = (amount: number, from = 'USD', to = 'USD') =>
  from === to ? amount : Math.round((amount * (usdPer[from] ?? 1)) / (usdPer[to] ?? 1));

/** Charge total for the shipment (in `base`): per-container × qty + per-B/L × B/Ls. */
export const chargeTotal = (c: ChargeLine, kind: 'buy' | 'sell', lines: SearchLine[], bls: number, base = 'USD') =>
  fx(
    c.perBl ? c.perBl[kind] * bls : lines.reduce((a, l) => a + (c.perUnit?.[l.type]?.[kind] ?? 0) * l.qty, 0),
    c.currency ?? base,
    base,
  );

/** Sum of per-unit amounts (in `base`) for one equipment type across charges (per-B/L excluded). */
export const unitSum = (charges: ChargeLine[], type: string, kind: 'buy' | 'sell', base = 'USD') =>
  charges.reduce((a, c) => a + fx(c.perUnit?.[type]?.[kind] ?? 0, c.currency ?? base, base), 0);

/** Shipment totals (buy + sell, in `base`) across all legs. */
export const allInOf = (legs: LegCharges[], lines: SearchLine[], bls: number, base = 'USD') => {
  const all = legs.flatMap((l) => l.charges);
  return {
    buy: all.reduce((a, c) => a + chargeTotal(c, 'buy', lines, bls, base), 0),
    sell: all.reduce((a, c) => a + chargeTotal(c, 'sell', lines, bls, base), 0),
  };
};

/** Lower bound of the transit range, in days (for "Fastest"). */
export const transitMin = (r: RateCard) => Number(r.route.ocean.transit.match(/\d+/)?.[0] ?? 0);
