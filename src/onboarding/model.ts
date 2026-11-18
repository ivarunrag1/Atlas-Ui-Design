/**
 * Onboarding prototype — state model and derived statuses.
 * Spec: ~/Desktop/ATLAS/atlas-onboarding-flow.md + atlas-onboarding-testcases.md (decisions D1–D11).
 * Everything is mock: no network, timers stand in for provisioning, OAuth and the email sync.
 */
import type { AgentId } from '../data/agents';

export type Journey = 'admin' | 'invited';
/** D2/D7: new = created by ATLAS at signup (source = ATLAS); existing = the company already had one. */
export type EngineKind = 'new' | 'existing';
export type Role = 'Admin' | 'Sales Manager' | 'Sales Rep';
export const ROLES: Role[] = ['Admin', 'Sales Manager', 'Sales Rep'];

export type Screen = 'signup' | 'signin' | 'provisioning' | 'inbox' | 'set-password' | 'link-expired' | 'teammates' | 'home';

export type StepStatus = 'not-started' | 'in-progress' | 'skipped' | 'action-needed' | 'done';
export type StepKey = 'activated' | 'teammates' | 'mailbox' | 'sync' | 'engine' | 'invite';

export interface Workspace {
  company: string;
  firstName: string;
  lastName: string;
  email: string;
  slug: string;
  engine: EngineKind;
  /** Existing engine only — saved at signup, linked when the user signs in (D7). */
  engineDomain: string;
}

export type InviteStatus = 'Invited' | 'Expired' | 'Revoked';
export interface Invite {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: InviteStatus;
  /** D8: email found in the Freight Engine → link; otherwise a new Freight Engine user is created. */
  engineUser: 'linked' | 'created';
  sentAt: string;
}

export interface Setup {
  teammates: 'not-started' | 'skipped' | 'done';
  mailbox: { mail: boolean; calendar: boolean; provider?: 'Gmail' | 'Outlook'; revoked?: boolean; skipped?: boolean };
  sync: { progress: number; state: 'idle' | 'running' | 'done' };
  engine: { connected: boolean; expired?: boolean; skipped?: boolean; synced?: { rates: number; customers: number } };
  invites: Invite[];
  inviteSkipped?: boolean;
  /** Rhea outreach — off until the Admin approves (AC9). */
  outreachApproved: boolean;
  /** Completion state shown once (CL-11). */
  completionSeen: boolean;
}

export interface Simulate {
  provisioningFails: boolean;
  linkExpired: boolean;
}

export interface OnboardingState {
  journey: Journey;
  screen: Screen;
  workspace: Workspace;
  /** The person going through the flow (the Admin, or the invited user). */
  me: { name: string; email: string; role: Role };
  setup: Setup;
  simulate: Simulate;
  panel: 'open' | 'minimized' | 'dismissed';
}

export const DEFAULT_WORKSPACE: Workspace = {
  company: 'Acme Logistics Pvt Ltd',
  firstName: 'Varun',
  lastName: 'Reddy',
  email: 'varun@acmelogistics.com',
  slug: 'acme-logistics-in',
  engine: 'new',
  engineDomain: 'acme',
};

export const emptySetup = (): Setup => ({
  teammates: 'not-started',
  mailbox: { mail: false, calendar: false },
  sync: { progress: 0, state: 'idle' },
  engine: { connected: false },
  invites: [],
  outreachApproved: false,
  completionSeen: false,
});

export function initialState(journey: Journey, engine: EngineKind = 'new'): OnboardingState {
  const workspace = { ...DEFAULT_WORKSPACE, engine };
  return {
    journey,
    screen: journey === 'admin' ? 'signup' : 'inbox',
    workspace,
    me:
      journey === 'admin'
        ? { name: `${workspace.firstName} ${workspace.lastName}`, email: workspace.email, role: 'Admin' }
        : { name: 'Priya Nair', email: 'priya@acmelogistics.com', role: 'Sales Rep' },
    setup: emptySetup(),
    simulate: { provisioningFails: false, linkExpired: false },
    panel: 'open',
  };
}

export const workspaceUrl = (slug: string) => `${slug}.freightify.ai`;
export const engineUrl = (domain: string) => `${domain}.freightengine.com`;

/* ------------------------------------------------------------------ *
 * Signup rules (A1)
 * ------------------------------------------------------------------ */

export const PERSONAL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com', 'aol.com', 'proton.me'];
export const RESERVED_SLUGS = ['www', 'app', 'api', 'admin', 'rms', 'support', 'mail'];
/** Mock "already taken" workspace URLs — `acme-logistics` is taken so the suggestion path shows. */
export const TAKEN_SLUGS = ['acme-logistics', 'orbit', 'orbit-freight', 'freightify', 'atlas'];
/** Mock emails that already belong to an ATLAS workspace (SU-11 / D6). */
export const EXISTING_EMAILS = ['priya@orbitfreight.com', 'admin@orbitfreight.com'];

const LEGAL_SUFFIXES = /\b(pvt|private|ltd|limited|llc|inc|corp|co|gmbh|plc|llp)\b\.?/g;

/** "Acme Logistics Pvt Ltd" → "acme-logistics" (lowercase, spaces → hyphens, symbols and legal suffixes removed). */
export function slugify(company: string) {
  return company
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(LEGAL_SUFFIXES, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-|-$/g, '');
}

export type SlugCheck =
  | { state: 'empty' }
  | { state: 'checking' }
  | { state: 'available' }
  | { state: 'invalid'; reason: string }
  | { state: 'taken'; suggestions: string[] };

export function checkSlug(slug: string): Exclude<SlugCheck, { state: 'checking' }> {
  if (!slug) return { state: 'empty' };
  if (!/^[a-z0-9-]+$/.test(slug)) return { state: 'invalid', reason: 'Use lowercase letters, numbers and hyphens only.' };
  if (slug.length < 3) return { state: 'invalid', reason: 'Use at least 3 characters.' };
  if (RESERVED_SLUGS.includes(slug)) return { state: 'invalid', reason: `"${slug}" is reserved. Try another name.` };
  if (TAKEN_SLUGS.includes(slug)) {
    const compact = slug.replace(/-/g, '');
    const suggestions = [`${slug}-in`, compact, `${slug}-hq`].filter((s) => !TAKEN_SLUGS.includes(s) && s !== slug);
    return { state: 'taken', suggestions };
  }
  return { state: 'available' };
}

export const emailDomain = (email: string) => email.split('@')[1]?.toLowerCase() ?? '';
export const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
export const isPersonalEmail = (email: string) => PERSONAL_DOMAINS.includes(emailDomain(email));

/** Password rules (Q10 default until confirmed): 8+ characters, a letter and a number. */
export const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'A letter', test: (p: string) => /[a-z]/i.test(p) },
  { label: 'A number', test: (p: string) => /\d/.test(p) },
];

/* ------------------------------------------------------------------ *
 * Checklist (D9 — one flat list; Admin 6 steps, invited users 5)
 * ------------------------------------------------------------------ */

export interface Step {
  key: StepKey;
  title: string;
  status: StepStatus;
  /** One line on why to finish it — the cost of skipping (shown while not done). */
  unlocks: string;
  /** What the status means right now, e.g. "Syncing · 64%". */
  detail?: string;
  /** Automatic steps (activation, sync) have no action button. */
  auto?: boolean;
  skippable: boolean;
}

export function mailboxStatus(s: Setup): StepStatus {
  const m = s.mailbox;
  if (m.revoked) return 'action-needed';
  if (m.mail && m.calendar) return 'done';
  if (m.mail || m.calendar) return 'in-progress';
  if (m.skipped) return 'skipped';
  return 'not-started';
}

export function engineStatus(s: Setup): StepStatus {
  if (s.engine.expired) return 'action-needed';
  if (s.engine.connected) return 'done';
  if (s.engine.skipped) return 'skipped';
  return 'not-started';
}

export function buildSteps(st: OnboardingState): Step[] {
  const s = st.setup;
  const admin = st.journey === 'admin';
  const mailbox = mailboxStatus(s);
  const syncStatus: StepStatus = s.sync.state === 'done' ? 'done' : s.sync.state === 'running' ? 'in-progress' : 'not-started';

  const steps: Step[] = [
    {
      key: 'activated',
      title: admin ? 'Workspace created and account activated' : 'Account activated',
      status: 'done',
      unlocks: 'Access to Atlas',
      detail: workspaceUrl(st.workspace.slug),
      auto: true,
      skippable: false,
    },
    {
      key: 'teammates',
      title: 'Meet your AI teammates',
      status: s.teammates === 'done' ? 'done' : s.teammates === 'skipped' ? 'skipped' : 'not-started',
      unlocks: 'See what Max, Rhea and Maya each need to start working',
      skippable: true,
    },
    {
      key: 'mailbox',
      title: 'Connect mailbox and calendar',
      status: mailbox,
      unlocks: 'Max, Rhea and Maya start working on your inbox',
      detail: s.mailbox.revoked
        ? `${s.mailbox.provider} access was revoked. Reconnect to keep reading inquiries.`
        : s.mailbox.mail && !s.mailbox.calendar
          ? 'Mailbox connected · calendar not connected, so Maya can’t schedule follow-ups'
          : s.mailbox.calendar && !s.mailbox.mail
            ? 'Calendar connected · mailbox not connected, so your teammates can’t read inquiries'
            : s.mailbox.mail && s.mailbox.calendar
              ? `${s.mailbox.provider} mailbox and calendar connected`
              : undefined,
      skippable: true,
    },
    {
      key: 'sync',
      title: '7-day email sync',
      status: syncStatus,
      unlocks: 'Creates your customers and contacts from the last 7 days',
      detail:
        syncStatus === 'not-started'
          ? 'Starts by itself once your mailbox is connected'
          : syncStatus === 'in-progress'
            ? `Syncing · ${s.sync.progress}%`
            : `${syncCounts(100).companies} companies and ${syncCounts(100).contacts} contacts created`,
      auto: true,
      skippable: false,
    },
    {
      key: 'engine',
      title: 'Connect Freight Engine',
      status: engineStatus(s),
      unlocks: 'Max fetches Freight Engine rates and drafts quotes',
      detail: s.engine.expired
        ? 'Your Freight Engine session expired. Sign in again to keep fetching rates.'
        : s.engine.connected
          ? s.engine.synced
            ? `Freight Engine ready · linked to your existing account (${s.engine.synced.rates} rates, ${s.engine.synced.customers} customers synced)`
            : 'Freight Engine ready'
          : undefined,
      skippable: true,
    },
  ];
  if (admin) {
    const sent = s.invites.filter((i) => i.status !== 'Revoked').length;
    steps.push({
      key: 'invite',
      title: 'Invite your team',
      status: sent > 0 ? 'done' : s.inviteSkipped ? 'skipped' : 'not-started',
      unlocks: 'Teammates get their own mailbox, calendar and Freight Engine user',
      detail: sent > 0 ? `${sent} ${sent === 1 ? 'invite' : 'invites'} sent` : undefined,
      skippable: true,
    });
  }
  return steps;
}

/** Mock numbers the sync "finds" as it runs. */
export function syncCounts(progress: number) {
  const f = progress / 100;
  return { emails: Math.round(212 * f), companies: Math.round(18 * f), contacts: Math.round(42 * f), inquiries: progress >= 100 ? 1 : 0 };
}

/* ------------------------------------------------------------------ *
 * AI teammate readiness (3.1) — live, derived from the same setup state
 * ------------------------------------------------------------------ */

export type Readiness = 'Ready' | 'Waiting for email' | 'Waiting for calendar' | 'Waiting for Freight Engine' | 'Needs Admin approval';

export interface TeammateInfo {
  id: AgentId;
  name: string;
  role: string;
  does: string;
  needs: string[];
  startsAs: string;
}

export const TEAMMATES: TeammateInfo[] = [
  {
    id: 'max',
    name: 'Max',
    role: 'Sales, quote and inquiry agent',
    does: 'Reads inquiries in your mailbox, fetches Freight Engine rates, drafts quotes and follows deals to Won or Lost.',
    needs: ['Mailbox', 'Freight Engine'],
    startsAs: 'On once connected',
  },
  {
    id: 'rhea',
    name: 'Rhea',
    role: 'Lead agent',
    does: 'Finds shippers and buyers, creates and researches leads, and drafts outreach.',
    needs: ['Mailbox'],
    startsAs: 'Lead finding on · outreach off until the Admin approves',
  },
  {
    id: 'maya',
    name: 'Maya',
    role: 'CRM agent',
    does: 'Handles follow-ups and keeps your contacts and companies up to date.',
    needs: ['Mailbox', 'Calendar'],
    startsAs: 'On once connected',
  },
];

/** First blocker only (Q4 default). Each maps to the step that unlocks it (CL-13). */
export function readiness(id: AgentId, s: Setup): { tag: Readiness; step?: StepKey } {
  const mail = s.mailbox.mail && !s.mailbox.revoked;
  if (!mail) return { tag: 'Waiting for email', step: 'mailbox' };
  if (id === 'max' && (!s.engine.connected || s.engine.expired)) return { tag: 'Waiting for Freight Engine', step: 'engine' };
  if (id === 'maya' && !s.mailbox.calendar) return { tag: 'Waiting for calendar', step: 'mailbox' };
  if (id === 'rhea' && !s.outreachApproved) return { tag: 'Needs Admin approval' };
  return { tag: 'Ready' };
}

/* ------------------------------------------------------------------ *
 * Pipeline (D11 — spec stages)
 * ------------------------------------------------------------------ */

export const PIPELINE = ['Enquiry Received', 'Rates Received', 'Quoting', 'Quote Sent', 'Finalisation', 'Won', 'Lost'] as const;
export type PipelineStage = (typeof PIPELINE)[number];
export const pipelineColor: Record<PipelineStage, string> = {
  'Enquiry Received': 'var(--color-stage-blue)',
  'Rates Received': 'var(--color-stage-slate)',
  Quoting: 'var(--color-stage-amber)',
  'Quote Sent': 'var(--color-stage-violet)',
  Finalisation: 'var(--color-stage-coral)',
  Won: 'var(--color-stage-green)',
  Lost: 'var(--color-faint)',
};
