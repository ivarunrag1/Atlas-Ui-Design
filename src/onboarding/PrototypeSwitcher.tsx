import { useState } from 'react';
import { ArrowLeft, FlaskConical, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import type { OnboardingState, Screen, Simulate } from './model';

export type Scenario = 'admin-new' | 'admin-existing' | 'invited-new' | 'invited-existing';

const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: 'admin-new', label: 'Admin · new Freight Engine' },
  { value: 'admin-existing', label: 'Admin · existing Freight Engine' },
  { value: 'invited-new', label: 'Invited rep · new Freight Engine' },
  { value: 'invited-existing', label: 'Invited rep · existing Freight Engine' },
];

const SCREENS: { value: Screen; label: string; admin?: boolean }[] = [
  { value: 'signup', label: 'Signup', admin: true },
  { value: 'provisioning', label: 'Provisioning', admin: true },
  { value: 'signin', label: 'Sign in' },
  { value: 'inbox', label: 'Inbox (emails)' },
  { value: 'set-password', label: 'Set password' },
  { value: 'link-expired', label: 'Link expired' },
  { value: 'teammates', label: 'Meet your AI teammates' },
  { value: 'home', label: 'Home + setup' },
];

/**
 * Prototype controls — not part of the product. Jumps between journeys, screens and the
 * failure states from the test cases, and lists the inputs that trigger the rest.
 */
export function PrototypeSwitcher({
  state,
  onScenario,
  onScreen,
  onSimulate,
  onFillSignup,
  onBreakMailbox,
  onExpireEngine,
  onExpireInvite,
  onCompleteAll,
  onReset,
}: {
  state: OnboardingState;
  onScenario: (s: Scenario) => void;
  onScreen: (s: Screen) => void;
  onSimulate: (k: keyof Simulate, v: boolean) => void;
  onFillSignup: () => void;
  onBreakMailbox: () => void;
  onExpireEngine: () => void;
  onExpireInvite: () => void;
  onCompleteAll: () => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const scenario = `${state.journey}-${state.workspace.engine}` as Scenario;
  const screens = SCREENS.filter((s) => !s.admin || state.journey === 'admin');

  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-3 right-3 z-[60] flex items-center gap-1.5 rounded-full border border-atlas/40 bg-atlas-bg px-3 py-1.5 text-[12px] font-medium text-atlas shadow-lg transition-colors hover:border-atlas"
      >
        <FlaskConical size={14} /> Prototype
      </button>
    );

  return (
    <div className="fixed top-3 right-3 z-[60] flex max-h-[calc(100vh-24px)] w-[min(320px,calc(100vw-24px))] flex-col overflow-hidden rounded-xl border border-line-strong bg-surface text-ink shadow-2xl">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="flex items-center gap-2 font-semibold">
          <FlaskConical size={15} className="text-atlas" /> Prototype controls
        </span>
        <Button variant="ghost" size="icon-xs" onClick={() => setOpen(false)} aria-label="Close prototype controls">
          <X size={14} />
        </Button>
      </div>
      <div className="flex flex-col gap-4 overflow-auto px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <SectionLabel>Journey</SectionLabel>
          <div className="flex flex-col gap-1">
            {SCENARIOS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => onScenario(s.value)}
                className={`rounded-lg border px-2.5 py-1.5 text-left text-[12px] transition-colors ${
                  s.value === scenario ? 'border-line-strong bg-subtle text-ink' : 'border-transparent text-muted hover:bg-subtle'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <SectionLabel>Jump to screen</SectionLabel>
          <div className="flex flex-wrap gap-1">
            {screens.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => onScreen(s.value)}
                className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                  s.value === state.screen ? 'border-ink bg-ink text-canvas' : 'border-line text-muted hover:border-line-strong hover:text-ink'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <SectionLabel>Simulate</SectionLabel>
          {state.journey === 'admin' && (
            <Toggle label="Provisioning step fails" checked={state.simulate.provisioningFails} onChange={(v) => onSimulate('provisioningFails', v)} />
          )}
          <Toggle
            label={state.journey === 'admin' ? 'Activation link expired' : 'Invite link expired'}
            checked={state.simulate.linkExpired}
            onChange={(v) => onSimulate('linkExpired', v)}
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {state.journey === 'admin' && state.screen === 'signup' && (
              <Button variant="outline" size="xs" onClick={onFillSignup}>
                Fill signup
              </Button>
            )}
            <Button variant="outline" size="xs" onClick={onBreakMailbox}>
              Revoke mailbox
            </Button>
            <Button variant="outline" size="xs" onClick={onExpireEngine}>
              Expire Freight Engine
            </Button>
            {state.journey === 'admin' && (
              <Button variant="outline" size="xs" onClick={onExpireInvite} disabled={!state.setup.invites.some((i) => i.status === 'Invited')}>
                Expire an invite
              </Button>
            )}
            <Button variant="outline" size="xs" onClick={onCompleteAll}>
              Finish all steps
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <SectionLabel>Try these inputs</SectionLabel>
          <ul className="t-desc flex list-disc flex-col gap-1 pl-4 text-muted">
            <li>
              Company “Acme Logistics” → URL <code className="text-ink">acme-logistics</code> is taken, pick a suggestion
            </li>
            <li>
              URL <code className="text-ink">admin</code> / <code className="text-ink">ab</code> → reserved / too short
            </li>
            <li>A gmail.com / yahoo.com email → blocked</li>
            <li>
              <code className="text-ink">priya@orbitfreight.com</code> → already has a workspace
            </li>
            <li>
              Freight Engine password <code className="text-ink">wrong</code> → login failed
            </li>
            <li>
              Invite <code className="text-ink">rahul@acmelogistics.com</code> (existing engine) → linked, not created
            </li>
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
        <Button variant="ghost" size="xs" onClick={() => (window.location.hash = '')}>
          <ArrowLeft /> CRM app
        </Button>
        <Button variant="outline" size="xs" onClick={onReset}>
          <RotateCcw /> Restart journey
        </Button>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-[12px] text-muted">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </label>
  );
}
