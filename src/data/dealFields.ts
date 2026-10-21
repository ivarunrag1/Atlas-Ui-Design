/*
 * CRM Deal custom fields (Atlas pack + pipeline) — from the field spec workbook
 * "Atlas Data Fields ( Frappe + Custom) .xlsx" → sheet "Atlas custom fields"
 * (red "not required" rows excluded). Values below are mock data per deal.
 */
import { stages, type DealSummary } from './deals';

export type DealFieldType = 'Check' | 'Currency' | 'Data' | 'Date' | 'Datetime' | 'Duration' | 'Float' | 'Int' | 'Link' | 'Select' | 'Small Text';
export type DealFieldGroup = 'commercial' | 'shipment' | 'followup' | 'pipeline';

export interface DealFieldSpec {
  key: string;
  label: string;
  type: DealFieldType;
  group: DealFieldGroup;
  /** pack = Atlas pack field; pipeline = only the deal pipeline writes it. */
  kind: 'pack' | 'pipeline';
  /** Editable from the Atlas UI. Otherwise `lockedBy` explains who sets it. */
  editable: boolean;
  lockedBy?: 'Pipeline' | 'Calculated' | 'Set current quote';
  options?: string[];
  notes?: string;
  /** Also shown in the deal's left pane (per the spec's "UI: Left pane" notes). */
  leftPane?: boolean;
}

export const dealFieldGroups: { key: DealFieldGroup; title: string; description: string }[] = [
  { key: 'commercial', title: 'Deal commercial', description: 'Buy side, carrier and quote validity' },
  { key: 'shipment', title: 'Shipment', description: 'Lane, cargo and equipment for this deal' },
  { key: 'followup', title: 'Follow-up', description: 'Next touchpoint and follow-ups sent after the quote' },
  { key: 'pipeline', title: 'Pipeline', description: 'Written by the deal pipeline — read-only' },
];

const pipe = { kind: 'pipeline', editable: false, lockedBy: 'Pipeline' } as const;
const pack = { kind: 'pack', editable: true } as const;

export const dealFields: DealFieldSpec[] = [
  // Deal commercial
  { key: 'buy_value', label: 'Buy value', type: 'Currency', group: 'commercial', ...pack },
  {
    key: 'margin', label: 'Margin', type: 'Currency', group: 'commercial', kind: 'pack', editable: false, lockedBy: 'Calculated', leftPane: true,
    notes: 'deal_value − buy_value. Recalculated on save when either changes. Empty when buy_value is empty.',
  },
  { key: 'carrier', label: 'Carrier', type: 'Data', group: 'commercial', ...pack },
  { key: 'quote_valid_until', label: 'Quote valid until', type: 'Date', group: 'commercial', ...pack },
  { key: 'archived', label: 'Archived', type: 'Check', group: 'commercial', ...pack },

  // Shipment
  { key: 'shipment_type', label: 'Deal type', type: 'Select', group: 'shipment', ...pack, options: ['One-off', 'Recurring', 'Contract-Tender'] },
  { key: 'mode', label: 'Mode', type: 'Select', group: 'shipment', ...pack, options: ['FCL', 'LCL', 'Air', 'FTL', 'LTL'] },
  { key: 'movement', label: 'Movement', type: 'Select', group: 'shipment', ...pack, options: ['Port-to-Port', 'Door-to-Port', 'Port-to-Door', 'Door-to-Door'] },
  { key: 'trade_lanes', label: 'Trade lane', type: 'Data', group: 'shipment', ...pack },
  { key: 'origin', label: 'Origin', type: 'Data', group: 'shipment', ...pack },
  { key: 'origin_code', label: 'Origin code', type: 'Data', group: 'shipment', ...pack },
  { key: 'origin_country', label: 'Origin country', type: 'Data', group: 'shipment', ...pack },
  { key: 'destination', label: 'Destination', type: 'Data', group: 'shipment', ...pack },
  { key: 'destination_code', label: 'Destination code', type: 'Data', group: 'shipment', ...pack },
  { key: 'destination_country', label: 'Destination country', type: 'Data', group: 'shipment', ...pack },
  { key: 'incoterm', label: 'Incoterm', type: 'Data', group: 'shipment', ...pack },
  { key: 'equipment', label: 'Equipment', type: 'Data', group: 'shipment', ...pack },
  { key: 'cargo_type', label: 'Cargo type', type: 'Data', group: 'shipment', ...pack },
  { key: 'commodity', label: 'Commodity', type: 'Data', group: 'shipment', ...pack },
  { key: 'teu', label: 'TEU', type: 'Int', group: 'shipment', ...pack },
  { key: 'cbm', label: 'CBM', type: 'Float', group: 'shipment', ...pack },
  { key: 'weight', label: 'Weight (kg)', type: 'Float', group: 'shipment', ...pack },
  { key: 'cargo_ready_date', label: 'Cargo ready date', type: 'Date', group: 'shipment', ...pack },
  { key: 'services', label: 'Services', type: 'Small Text', group: 'shipment', ...pack },
  { key: 'customer_reference', label: 'Customer reference', type: 'Data', group: 'shipment', ...pack },

  // Follow-up
  {
    key: 'next_followup_at', label: 'Follow-up date', type: 'Datetime', group: 'followup', ...pack, leftPane: true,
    notes: 'Next follow-up due. Set by the rep, or by the follow-up agent after each follow-up. Cleared when the deal is Won or Lost. Red when overdue.',
  },
  {
    key: 'followup_count', label: 'Follow-ups done', type: 'Int', group: 'followup', ...pipe, leftPane: true,
    notes: '+1 each time a follow-up is sent after the quote (FOLLOWUP_SENT). Never decremented.',
  },

  // Pipeline
  { key: 'enquiry_id', label: 'Enquiry', type: 'Data', group: 'pipeline', ...pipe },
  { key: 'search_id', label: 'Search', type: 'Data', group: 'pipeline', ...pipe },
  {
    key: 'quote_id', label: 'Quote', type: 'Data', group: 'pipeline', kind: 'pipeline', editable: false, lockedBy: 'Set current quote',
    notes: 'Pipeline-owned. Set with deals.setCurrentQuote (deals:edit + quotes:edit).',
  },
  { key: 'flow', label: 'Pipeline flow', type: 'Select', group: 'pipeline', ...pipe, options: ['AUTOMATIC', 'MANUAL'] },
  {
    key: 'last_activity_type', label: 'Last activity type', type: 'Select', group: 'pipeline', ...pipe,
    options: ['ENQUIRY_RECEIVED', 'INFO_REQUESTED', 'QUOTE_CREATED', 'QUOTE_EMAIL_SENT', 'CUSTOMER_REPLY', 'FOLLOWUP_SENT', 'WON'],
  },
  { key: 'last_activity_at', label: 'Last activity at', type: 'Datetime', group: 'pipeline', ...pipe },
  { key: 'last_customer_activity_at', label: 'Last customer activity at', type: 'Datetime', group: 'pipeline', ...pipe },
  {
    key: 'quoted_at', label: 'Quoted at', type: 'Datetime', group: 'pipeline', ...pipe, leftPane: true,
    notes: 'Set when the first quote email is sent. Not overwritten by re-quotes.',
  },
  {
    key: 'quoted_by', label: 'Sales person quoted', type: 'Link', group: 'pipeline', ...pipe, leftPane: true,
    notes: 'User who sent the first quote. Can differ from the deal owner.',
  },
  { key: 'time_to_quote', label: 'Time to quote', type: 'Duration', group: 'pipeline', ...pipe, notes: 'quoted_at − deal creation (enquiry received).' },
];

/** Field values are kept as strings (inputs) — booleans as "1" / "0", dates as ISO. */
export type DealFieldValues = Record<string, string>;

const countryOf: Record<string, string> = {
  IN: 'India', DE: 'Germany', CN: 'China', US: 'United States', JP: 'Japan', NL: 'Netherlands', GB: 'United Kingdom',
  CL: 'Chile', SE: 'Sweden', EG: 'Egypt', VN: 'Vietnam', NZ: 'New Zealand', BE: 'Belgium', SG: 'Singapore', AE: 'UAE',
};
const portNames: Record<string, string> = {
  INNSA: 'Nhava Sheva', DEHAM: 'Hamburg', CNSHA: 'Shanghai', USLAX: 'Los Angeles', JPYOK: 'Yokohama', NLRTM: 'Rotterdam',
  INMAA: 'Chennai', GBFXT: 'Felixstowe',
};

/** Deal value as a number ("$96,000" → 96000). */
export const dealValueOf = (d: DealSummary) => Number(d.value.replace(/[^0-9.]/g, '')) || 0;
/** Whether the deal has been quoted (deal value exists from Quote sent onward). */
export const isQuoted = (d: DealSummary) => stages.indexOf(d.stage) >= stages.indexOf('Quote sent');

/** Mock values for a deal — derived from the deal summary where possible. */
export function mockDealFieldValues(d: DealSummary): DealFieldValues {
  const n = Number(d.id.replace(/\D/g, '')) || 0;
  const quoted = isQuoted(d);
  const value = dealValueOf(d);
  const buy = quoted ? Math.round(value * 0.88) : 0;
  const oc = d.origin.slice(0, 2);
  const dc = d.destination.slice(0, 2);
  const teu = Number(d.teu.replace(/\D/g, '')) || 0;
  return {
    buy_value: quoted ? String(buy) : '',
    margin: quoted ? String(value - buy) : '',
    carrier: quoted ? ['Maersk', 'MSC', 'CMA CGM', 'Hapag-Lloyd'][n % 4] : '',
    quote_valid_until: quoted ? '2026-11-04' : '',
    archived: '0',

    shipment_type: ['One-off', 'Recurring', 'Contract-Tender'][n % 3],
    mode: d.mode,
    movement: n % 2 ? 'Door-to-Port' : 'Port-to-Port',
    trade_lanes: `${d.origin} - ${d.destination}`,
    origin: d.origin,
    origin_code: oc,
    origin_country: countryOf[oc] ?? oc,
    destination: d.destination,
    destination_code: dc,
    destination_country: countryOf[dc] ?? dc,
    incoterm: ['FCA', 'FOB', 'CIF', 'EXW'][n % 4],
    equipment: d.equipment,
    cargo_type: 'FAK',
    commodity: ['General cargo', 'Auto parts', 'Textiles', 'Electronics'][n % 4],
    teu: String(teu),
    cbm: d.mode === 'LCL' ? '12.5' : '',
    weight: String(teu ? teu * 11000 : 4800),
    cargo_ready_date: '2026-10-31',
    services: 'Export customs clearance, Cargo insurance',
    customer_reference: `${d.id.slice(-4)} to ${d.destination} / 2026-10-01`,

    next_followup_at: d.stage === 'Won' ? '' : n % 3 === 0 ? '2026-10-20T10:00' : '2026-10-22T10:00',
    followup_count: quoted ? String(n % 3) : '0',

    enquiry_id: `Inq${String(124000 + n).padStart(6, '0')}`,
    search_id: String(689237238000 + n),
    quote_id: quoted ? `QUI${513000 + n}` : '',
    flow: n % 2 ? 'AUTOMATIC' : 'MANUAL',
    last_activity_type: quoted ? 'QUOTE_EMAIL_SENT' : 'ENQUIRY_RECEIVED',
    last_activity_at: '2026-10-20T17:23',
    last_customer_activity_at: '2026-10-19T09:12',
    quoted_at: quoted ? '2026-10-17T15:40' : '',
    quoted_by: quoted ? 'varun@quoteai.com' : '',
    time_to_quote: quoted ? '12 H 23 M' : '',
  };
}

export const portLabel = (code: string) => (portNames[code] ? `${portNames[code]} (${code})` : code);
