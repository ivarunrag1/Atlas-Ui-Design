/**
 * Mock data for the Deal Detail screen (Orbit Manufacturing / AT-DEAL-0142).
 *
 * The data is deliberately split into two streams so the UI never
 * double-reports an event:
 *   - `messages`  → customer-facing email thread (center column)
 *   - `activity`  → agent / system audit trail (right rail)
 * Activity items may reference the message they produced via `linkedMessageId`.
 *
 * There is a single AI agent across the product: Atlas.
 */

export type Actor = 'atlas' | 'system' | 'you' | 'customer';

export interface Party {
  name: string;
  /** Short label shown on the avatar. */
  initials: string;
  actor: Actor;
}

export interface Attachment {
  kind: 'quote' | 'file';
  label: string;
  meta: string;
}

export interface Message {
  id: string;
  from: Party;
  to: string;
  timestamp: string;
  /** Paragraphs of the message body. */
  body: string[];
  attachments?: Attachment[];
  /** Read-receipt line, e.g. "Viewed 2×". */
  receipt?: string;
  /** A draft the agent has staged but not yet sent. */
  status?: 'sent' | 'draft-pending';
}

export type ActivityType =
  | 'flag'
  | 'sent'
  | 'draft'
  | 'stage'
  | 'convert'
  | 'capture'
  | 'chat'
  | 'note'
  | 'call'
  | 'edit';

export interface ActivityStep {
  label: string;
  detail?: string;
  status: 'done' | 'current' | 'pending';
}

export interface Activity {
  id: string;
  type: ActivityType;
  actor: Actor;
  title: string;
  detail?: string;
  timestamp: string;
  linkedMessageId?: string;
  /** Sub-steps the agent executed to complete this action. */
  steps?: ActivityStep[];
}

export const deal = {
  id: 'AT-DEAL-0142',
  company: 'Orbit Manufacturing',
  stage: 'Quote sent',
  owner: { name: 'Atlas', initials: 'A', actor: 'atlas' as Actor },
  mode: 'Auto' as 'Auto' | 'Manual',
  temperature: 'Hot' as 'Hot' | 'Warm' | 'Cold',
  value: '$96,000',
  tradeLane: { origin: 'INNSA', destination: 'DEHAM', route: 'Nhava Sheva → Hamburg' },
  teu: '18 TEU',
  equipment: "40'HC ×9",
  status: 'Quote sent',
  alert: { label: 'No reply · 4 days', by: 'Atlas', ago: '2h ago' },
  contact: {
    name: 'Marcus Reed',
    role: 'Procurement Lead',
    email: 'marcus.reed@orbitmfg.com',
    company: 'Orbit Manufacturing',
  },
  linked: {
    quote: { id: 'Q-0142', value: '$96,000', meta: '18 TEU · sent 4d ago' },
    thread: { subject: 'RE: Ocean freight quote — INNSA → DEHAM', meta: '5 messages' },
  },
};

const atlas: Party = { name: 'Atlas', initials: 'A', actor: 'atlas' };
const customer: Party = { name: 'Marcus Reed', initials: 'M', actor: 'customer' };

export const messages: Message[] = [
  {
    id: 'm1',
    from: customer,
    to: 'Atlas (QuoteAI)',
    timestamp: '8 days ago · Mon 09:12',
    body: [
      'Hi — we’re moving 9×40′HC from Nhava Sheva to Hamburg, targeting an early-November sailing.',
      'Can you put together an all-in ocean freight quote? Happy to share the packing list if useful.',
    ],
  },
  {
    id: 'm2',
    from: atlas,
    to: 'Marcus Reed',
    timestamp: '8 days ago · Mon 09:14',
    body: [
      'Thanks Marcus — happy to help. I’ve logged this as an enquiry and pulled your company details.',
      'I’ll prepare the quote and follow up shortly.',
    ],
    status: 'sent',
  },
  {
    id: 'm3',
    from: atlas,
    to: 'Marcus Reed',
    timestamp: '4 days ago · Fri 11:30',
    body: [
      'Hi Marcus, please find attached our all-in ocean freight quote for INNSA → DEHAM, 9×40′HC.',
      'Rate is valid for 14 days and includes THC at both ends. Let me know if you’d like to lock in the early-November sailing.',
    ],
    attachments: [
      { kind: 'quote', label: 'Quote #Q-0142', meta: '$96,000 · 18 TEU · PDF' },
    ],
    status: 'sent',
  },
  {
    id: 'draft',
    from: atlas,
    to: 'Marcus Reed',
    timestamp: 'Scheduled · sends in 2h',
    body: [
      'Hi Marcus, just checking in on the ocean-freight quote for INNSA → DEHAM. Happy to walk through transit times or adjust the TEU count — let me know what works.',
    ],
    status: 'draft-pending',
  },
];

export interface DealDocument {
  id: string;
  name: string;
  kind: 'Quote' | 'Packing list' | 'B/L draft' | 'Invoice';
  meta: string;
  by: Actor;
  timestamp: string;
  receipt?: string;
}

export const documents: DealDocument[] = [
  {
    id: 'd1',
    name: 'Quote #Q-0142.pdf',
    kind: 'Quote',
    meta: '$96,000 · 18 TEU · 240 KB',
    by: 'atlas',
    timestamp: 'Sent 4d ago',
  },
  {
    id: 'd2',
    name: 'Packing list — Orbit Mfg.xlsx',
    kind: 'Packing list',
    meta: '9×40′HC · 61 KB',
    by: 'customer',
    timestamp: 'Received 8d ago',
  },
  {
    id: 'd3',
    name: 'Draft B/L — INNSA-DEHAM.pdf',
    kind: 'B/L draft',
    meta: 'Not yet issued · 180 KB',
    by: 'atlas',
    timestamp: 'Drafted 4d ago',
  },
];

export interface Comment {
  id: string;
  from: Party;
  body: string;
  timestamp: string;
  internal: boolean;
}

export const comments: Comment[] = [
  {
    id: 'c1',
    from: { name: 'Priya Nair', initials: 'P', actor: 'you' },
    body: 'Marcus mentioned budget sign-off lands this week — worth holding the early-Nov sailing if we can.',
    timestamp: '3d ago',
    internal: true,
  },
  {
    id: 'c2',
    from: { name: 'Atlas', initials: 'A', actor: 'atlas' },
    body: 'Noted. I’ve kept the rate valid for 14 days and flagged the deal if no reply by Friday.',
    timestamp: '3d ago',
    internal: true,
  },
];

export interface ChatMessage {
  id: string;
  from: 'you' | 'atlas';
  timestamp: string;
  /** User turns (and simple agent text) use this. */
  body?: string;
  /** Agent turns render in the activity style, with an optional step trace. */
  trace?: Activity;
}

export const agentChat: ChatMessage[] = [
  {
    id: 'ch1',
    from: 'you',
    timestamp: '1h ago',
    body: 'Can we still hold the early-November sailing if Marcus confirms this week?',
  },
  {
    id: 'ch2',
    from: 'atlas',
    timestamp: '1h ago',
    trace: {
      id: 'tr1',
      type: 'convert',
      actor: 'atlas',
      title: 'Checked sailing availability',
      detail:
        'The early-Nov slot can be held through Friday if Marcus confirms. I can extend the quote validity to match — want me to add that to the follow-up?',
      timestamp: '1h ago',
      steps: [
        { label: 'Checked carrier schedule', detail: 'Maersk early-Nov sailing still open', status: 'done' },
        { label: 'Confirmed hold window', detail: 'Slot can be held until Fri EOD', status: 'done' },
        { label: 'Proposed quote extension', detail: 'Extend Q-0142 validity to Friday', status: 'current' },
      ],
    },
  },
];

export const activity: Activity[] = [
  {
    id: 'u1',
    type: 'note',
    actor: 'you',
    title: 'Comment added on the deal',
    timestamp: '1h ago',
  },
  {
    id: 'a1',
    type: 'draft',
    actor: 'atlas',
    title: 'Follow-up drafted — awaiting review',
    detail: 'Deal is cooling after 4 days of no reply. Auto-sends in 2h unless you edit or pause.',
    timestamp: '2h ago',
    linkedMessageId: 'draft',
  },
  {
    id: 'a2',
    type: 'flag',
    actor: 'atlas',
    title: 'Flagged: no reply for 4 days',
    detail: 'Atlas recommends a follow-up — the deal is cooling.',
    timestamp: '2h ago',
  },
  {
    id: 'u2',
    type: 'call',
    actor: 'you',
    title: 'Call logged with Marcus Reed',
    timestamp: '3d ago',
  },
  {
    id: 'a3',
    type: 'sent',
    actor: 'atlas',
    title: 'Quote #Q-0142 sent to Marcus Reed',
    detail: 'Auto-sent after the preview window closed.',
    timestamp: '4d ago',
    linkedMessageId: 'm3',
    steps: [
      {
        label: 'Search results',
        detail: 'Queried 12 carrier rates for INNSA → DEHAM, 40′HC ×9',
        status: 'done',
      },
      {
        label: 'Selected rate card',
        detail: 'Maersk FAK — best transit/price for early-Nov sailing',
        status: 'done',
      },
      {
        label: 'Pricing finalized',
        detail: 'Base ocean + THC both ends · 14-day validity',
        status: 'done',
      },
      {
        label: 'Quote PDF output',
        detail: 'Generated Quote #Q-0142.pdf — $96,000',
        status: 'done',
      },
      {
        label: 'Emailed to Marcus Reed',
        detail: 'Auto-sent after the preview window closed',
        status: 'done',
      },
    ],
  },
  {
    id: 'a4',
    type: 'draft',
    actor: 'atlas',
    title: 'Quote drafted — $96,000 · 18 TEU',
    detail: 'INNSA → DEHAM · 40′HC ×9',
    timestamp: '4d ago',
  },
  {
    id: 'a5',
    type: 'stage',
    actor: 'system',
    title: 'Stage moved to Quote sent',
    timestamp: '4d ago',
  },
  {
    id: 'u3',
    type: 'edit',
    actor: 'you',
    title: 'Updated contact details',
    timestamp: '5d ago',
  },
  {
    id: 'a6',
    type: 'convert',
    actor: 'atlas',
    title: 'Enquiry received',
    detail: 'Atlas converted the inbound lead into an enquiry.',
    timestamp: '6d ago',
    linkedMessageId: 'm1',
  },
  {
    id: 'a7',
    type: 'capture',
    actor: 'atlas',
    title: 'Lead captured from web form',
    detail: 'Atlas enriched company + contact details automatically.',
    timestamp: '8d ago',
  },
];
