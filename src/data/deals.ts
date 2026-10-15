/** Summary rows for the pipeline (Kanban + List) view, and the deal-detail left pane. */

export const stages = [
  'In contact',
  'Enquiry received',
  'Quoting',
  'Quote sent',
  'Negotiation',
  'Won',
] as const;

export type Stage = (typeof stages)[number];

/** Colour code per stage — a small categorical accent (layout stays neutral). */
export const stageColor: Record<Stage, string> = {
  'In contact': '#64748b', // slate
  'Enquiry received': '#3b82f6', // blue
  Quoting: '#d97706', // amber
  'Quote sent': '#a78bfa', // violet
  Negotiation: '#6366f1', // indigo
  Won: '#22c55e', // green
};

/** A scheduled/past touchpoint or task — `when` is the headline, `detail` the sub-line. */
export interface Interaction {
  when: string;
  detail: string;
}

export interface DealSummary {
  id: string;
  company: string;
  contact: string;
  contactRole: string;
  contactEmail: string;
  origin: string;
  destination: string;
  teu: string;
  equipment: string;
  /** FCL = containers (teu/equipment); LCL = loose cargo (see `load`). */
  mode: 'FCL' | 'LCL';
  /** LCL load details — weight / volume. */
  load?: string;
  owner: string;
  value: string;
  stage: Stage;
  updated: string;
  alert?: boolean;
  tasks: number;
  notes: number;
  comments: number;
  nextInteraction: Interaction;
  lastInteraction: Interaction;
  nextTask: Interaction;
}

export const deals: DealSummary[] = [
  { id: 'AT-DEAL-0142', company: 'Orbit Manufacturing', contact: 'Marcus Reed', contactRole: 'Procurement Lead', contactEmail: 'marcus.reed@orbitmfg.com', origin: 'INNSA', destination: 'DEHAM', teu: '18 TEU', equipment: "40'HC ×9", owner: 'Varun Reddy', mode: 'FCL', value: '$96,000', stage: 'Quote sent', updated: '2h ago', alert: true, tasks: 2, notes: 3, comments: 1, nextInteraction: { when: 'Tomorrow · 10:00', detail: 'Call Marcus Reed · Varun Reddy' }, lastInteraction: { when: '3 days ago', detail: 'Call logged · Varun Reddy' }, nextTask: { when: 'Due Friday', detail: 'Send revised quote' } },
  { id: 'AT-DEAL-0138', company: 'Nordwind Logistics', contact: 'Lena Fischer', contactRole: 'Logistics Manager', contactEmail: 'lena.fischer@nordwind.com', origin: 'CNSHA', destination: 'USLAX', teu: '24 TEU', equipment: "40'HC ×12", owner: 'Varun Reddy', mode: 'FCL', value: '$142,500', stage: 'Negotiation', updated: '5h ago', tasks: 1, notes: 2, comments: 4, nextInteraction: { when: 'Thu · 14:00', detail: 'Rate review call · Varun Reddy' }, lastInteraction: { when: '5h ago', detail: 'Email sent · Varun Reddy' }, nextTask: { when: 'Due today', detail: 'Approve counter-offer' } },
  { id: 'AT-DEAL-0151', company: 'Takara Industries', contact: 'Kenji Sato', contactRole: 'Supply Chain Head', contactEmail: 'kenji.sato@takara-ind.jp', origin: 'JPYOK', destination: 'NLRTM', teu: '12 TEU', equipment: "40'HC ×6", owner: 'Varun Reddy', mode: 'FCL', value: '$78,200', stage: 'Quoting', updated: '1d ago', tasks: 3, notes: 1, comments: 0, nextInteraction: { when: 'Mon · 09:00', detail: 'Follow-up email · Varun Reddy' }, lastInteraction: { when: '1d ago', detail: 'Enquiry reviewed · Atlas' }, nextTask: { when: 'Due Wed', detail: 'Finalize carrier rates' } },
  { id: 'AT-DEAL-0155', company: 'Vellore Textiles', contact: 'Priya Menon', contactRole: 'Export Manager', contactEmail: 'priya.menon@velloretex.in', origin: 'INMAA', destination: 'GBFXT', teu: '10 TEU', equipment: "20'GP ×10", owner: 'Varun Reddy', mode: 'FCL', value: '$54,800', stage: 'Enquiry received', updated: '3h ago', alert: true, tasks: 1, notes: 0, comments: 2, nextInteraction: { when: 'Today · 16:30', detail: 'Intro call · Varun Reddy' }, lastInteraction: { when: '3h ago', detail: 'Enquiry logged · Atlas' }, nextTask: { when: 'Overdue', detail: 'Request packing list' } },
  { id: 'AT-DEAL-0129', company: 'Andes Copper Co', contact: 'Mateo Rojas', contactRole: 'Procurement Dir', contactEmail: 'mateo.rojas@andescopper.cl', origin: 'CLVAP', destination: 'CNSHA', teu: '40 TEU', equipment: "40'HC ×20", owner: 'Varun Reddy', mode: 'FCL', value: '$210,000', stage: 'Quote sent', updated: '2d ago', tasks: 0, notes: 2, comments: 1, nextInteraction: { when: 'Fri · 11:00', detail: 'Quote walkthrough · Varun Reddy' }, lastInteraction: { when: '2d ago', detail: 'Quote sent · Atlas' }, nextTask: { when: 'Due Fri', detail: 'Confirm sailing schedule' } },
  { id: 'AT-DEAL-0133', company: 'Baltic Steel', contact: 'Erik Lindqvist', contactRole: 'Logistics Lead', contactEmail: 'erik.lindqvist@balticsteel.se', origin: 'SEGOT', destination: 'USNYC', teu: '22 TEU', equipment: "40'HC ×11", owner: 'Varun Reddy', mode: 'FCL', value: '$118,400', stage: 'Negotiation', updated: '6h ago', alert: true, tasks: 4, notes: 1, comments: 3, nextInteraction: { when: 'Tomorrow · 09:30', detail: 'Negotiation call · Varun Reddy' }, lastInteraction: { when: '6h ago', detail: 'Call logged · Varun Reddy' }, nextTask: { when: 'Due today', detail: 'Send BAF breakdown' } },
  { id: 'AT-DEAL-0160', company: 'Cairo Agro Exports', contact: 'Omar Hassan', contactRole: 'Trade Manager', contactEmail: 'omar.hassan@cairoagro.eg', origin: 'EGALY', destination: 'ITGOA', teu: '8 TEU', equipment: "20'GP ×8", mode: 'LCL', load: '3,800 kg · 7.2 CBM', owner: 'Varun Reddy', value: '$42,300', stage: 'In contact', updated: '1d ago', tasks: 1, notes: 1, comments: 0, nextInteraction: { when: 'Wed · 13:00', detail: 'Discovery call · Varun Reddy' }, lastInteraction: { when: '1d ago', detail: 'Intro email · Varun Reddy' }, nextTask: { when: 'Due Thu', detail: 'Qualify requirements' } },
  { id: 'AT-DEAL-0147', company: 'Saigon Furniture', contact: 'Tran Minh', contactRole: 'Export Lead', contactEmail: 'tran.minh@saigonfurn.vn', origin: 'VNSGN', destination: 'AUMEL', teu: '14 TEU', equipment: "40'HC ×7", mode: 'LCL', load: '5,400 kg · 11.5 CBM', owner: 'Varun Reddy', value: '$67,900', stage: 'Quoting', updated: '4h ago', tasks: 2, notes: 0, comments: 1, nextInteraction: { when: 'Thu · 10:00', detail: 'Rate confirm call · Varun Reddy' }, lastInteraction: { when: '4h ago', detail: 'Rates searched · Atlas' }, nextTask: { when: 'Due Wed', detail: 'Compile quote options' } },
  { id: 'AT-DEAL-0162', company: 'Pacific Greens', contact: 'Hana Ono', contactRole: 'Ops Manager', contactEmail: 'hana.ono@pacificgreens.nz', origin: 'NZAKL', destination: 'JPTYO', teu: '6 TEU', equipment: "40'RF ×3", owner: 'Varun Reddy', mode: 'FCL', value: '$38,500', stage: 'In contact', updated: '2d ago', tasks: 0, notes: 1, comments: 0, nextInteraction: { when: 'Next week', detail: 'Intro call · Varun Reddy' }, lastInteraction: { when: '2d ago', detail: 'Lead captured · Atlas' }, nextTask: { when: 'Due Mon', detail: 'Send intro deck' } },
  { id: 'AT-DEAL-0118', company: 'Helsinki Pharma', contact: 'Aino Virtanen', contactRole: 'Supply Chain Mgr', contactEmail: 'aino.virtanen@helsinkipharma.fi', origin: 'FIHEL', destination: 'USBOS', teu: '9 TEU', equipment: "40'RF ×4", owner: 'Varun Reddy', mode: 'FCL', value: '$95,600', stage: 'Won', updated: '3d ago', tasks: 0, notes: 4, comments: 2, nextInteraction: { when: '—', detail: 'No action · closed won' }, lastInteraction: { when: '3d ago', detail: 'Quote accepted · Atlas' }, nextTask: { when: 'Done', detail: 'Hand off to ops' } },
  { id: 'AT-DEAL-0144', company: 'Dakar Minerals', contact: 'Fatou Diop', contactRole: 'Procurement Head', contactEmail: 'fatou.diop@dakarminerals.sn', origin: 'SNDKR', destination: 'CNSHA', teu: '30 TEU', equipment: "40'HC ×15", owner: 'Varun Reddy', mode: 'FCL', value: '$173,200', stage: 'Quote sent', updated: '7h ago', tasks: 3, notes: 2, comments: 1, nextInteraction: { when: 'Tomorrow · 15:00', detail: 'Follow-up call · Varun Reddy' }, lastInteraction: { when: '7h ago', detail: 'Quote sent · Atlas' }, nextTask: { when: 'Due Fri', detail: 'Chase approval' } },
  { id: 'AT-DEAL-0158', company: 'Lyon Automotive', contact: 'Claire Dubois', contactRole: 'Logistics Manager', contactEmail: 'claire.dubois@lyonauto.fr', origin: 'FRFOS', destination: 'MXZLO', teu: '16 TEU', equipment: "40'HC ×8", owner: 'Varun Reddy', mode: 'FCL', value: '$88,700', stage: 'Enquiry received', updated: '5h ago', tasks: 1, notes: 1, comments: 0, nextInteraction: { when: 'Fri · 10:30', detail: 'Intro call · Varun Reddy' }, lastInteraction: { when: '5h ago', detail: 'Enquiry logged · Atlas' }, nextTask: { when: 'Due Thu', detail: 'Confirm equipment type' } },
  { id: 'AT-DEAL-0126', company: 'Oslo Seafood', contact: 'Ingrid Hansen', contactRole: 'Export Manager', contactEmail: 'ingrid.hansen@osloseafood.no', origin: 'NOOSL', destination: 'KRPUS', teu: '12 TEU', equipment: "40'RF ×6", owner: 'Varun Reddy', mode: 'FCL', value: '$61,200', stage: 'Negotiation', updated: '8h ago', tasks: 2, notes: 2, comments: 1, nextInteraction: { when: 'Mon · 11:00', detail: 'Pricing call · Varun Reddy' }, lastInteraction: { when: '8h ago', detail: 'Counter sent · Varun Reddy' }, nextTask: { when: 'Due Mon', detail: 'Revise reefer surcharge' } },
  { id: 'AT-DEAL-0109', company: 'Mumbai Spices', contact: 'Rahul Kapoor', contactRole: 'Trade Lead', contactEmail: 'rahul.kapoor@mumbaispices.in', origin: 'INNSA', destination: 'AEJEA', teu: '7 TEU', equipment: "20'GP ×7", mode: 'LCL', load: '2,100 kg · 5.5 CBM', owner: 'Varun Reddy', value: '$33,400', stage: 'Won', updated: '4d ago', tasks: 0, notes: 1, comments: 0, nextInteraction: { when: '—', detail: 'No action · closed won' }, lastInteraction: { when: '4d ago', detail: 'Quote accepted · Atlas' }, nextTask: { when: 'Done', detail: 'Invoice issued' } },
];
