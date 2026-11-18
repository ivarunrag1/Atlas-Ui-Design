import { useEffect, useState } from 'react';
import { SignupScreen, sampleSignup } from './SignupScreen';
import { LinkExpiredScreen, SetPasswordScreen, SignInScreen } from './AuthScreens';
import { ProvisioningScreen } from './ProvisioningScreen';
import { InboxScreen } from './InboxScreen';
import { TeammatesScreen } from './TeammatesScreen';
import { SetupHome } from './SetupHome';
import { ConnectMailboxDialog } from './ConnectMailboxDialog';
import { FreightEngineDialog } from './FreightEngineDialog';
import { InviteDialog } from './InviteDialog';
import { PrototypeSwitcher, type Scenario } from './PrototypeSwitcher';
import { initialState, type OnboardingState, type Screen, type Setup, type StepKey } from './model';

const STORAGE_KEY = 'atlas.onboarding.v1';
const ADMIN_NAME = 'Varun Reddy';

/** Progress saves by itself (CL-10) — per viewer, falls back to a fresh start if storage is unavailable. */
function load(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const st = JSON.parse(raw) as OnboardingState;
      if ((st.screen as string) === 'dashboard') st.screen = 'home'; // renamed screen
      if (window.location.hash === '#/onboarding/home') st.screen = 'home';
      return st;
    }
  } catch {
    /* storage unavailable or corrupt — start fresh */
  }
  const st = initialState('admin');
  return window.location.hash === '#/onboarding/home' ? { ...st, screen: 'home' } : st;
}

type DialogKey = 'mailbox' | 'engine' | 'invite' | null;

/**
 * ATLAS onboarding prototype (Phase 1). Two journeys — Admin (signup → provisioning →
 * activation → teammates → Home + checklist) and Invited user (invite → set password
 * → teammates → personal checklist). A prototype switcher jumps between scenarios,
 * screens and failure states. Reached at #/onboarding.
 */
export default function OnboardingApp() {
  const [st, setSt] = useState<OnboardingState>(load);
  const [dialog, setDialog] = useState<DialogKey>(null);
  const [existingEmail, setExistingEmail] = useState<string | null>(null);
  const [signupSeed, setSignupSeed] = useState<{ v: number; values: ReturnType<typeof sampleSignup> | undefined }>({ v: 0, values: undefined });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
    } catch {
      /* storage unavailable — progress just won't persist */
    }
  }, [st]);

  const go = (screen: Screen) => setSt((s) => ({ ...s, screen }));
  const patchSetup = (fn: (s: Setup) => Setup) => setSt((x) => ({ ...x, setup: fn(x.setup) }));

  // The 7-day email sync runs by itself once the mailbox is connected.
  const syncing = st.setup.sync.state === 'running';
  useEffect(() => {
    if (!syncing) return;
    const t = setInterval(() => {
      patchSetup((s) => {
        const progress = Math.min(100, s.sync.progress + 7);
        return { ...s, sync: { progress, state: progress >= 100 ? 'done' : 'running' } };
      });
    }, 450);
    return () => clearInterval(t);
  }, [syncing]);

  const startScenario = (sc: Scenario) => {
    const [journey, engine] = sc.split('-') as ['admin' | 'invited', 'new' | 'existing'];
    setDialog(null);
    setExistingEmail(null);
    setSignupSeed((x) => ({ v: x.v + 1, values: undefined }));
    setSt(initialState(journey, engine));
  };

  const openStep = (k: StepKey) => {
    if (k === 'teammates') go('teammates');
    else if (k === 'mailbox' || k === 'engine' || k === 'invite') setDialog(k);
  };

  const skipStep = (k: StepKey) =>
    patchSetup((s) => {
      if (k === 'teammates') return { ...s, teammates: 'skipped' };
      if (k === 'mailbox') return { ...s, mailbox: { ...s.mailbox, skipped: true } };
      if (k === 'engine') return { ...s, engine: { ...s.engine, skipped: true } };
      if (k === 'invite') return { ...s, inviteSkipped: true };
      return s;
    });

  const isAdmin = st.journey === 'admin';
  const { workspace: ws, me, setup } = st;

  let screen: React.ReactNode;
  switch (st.screen) {
    case 'signup':
      screen = (
        <SignupScreen
          key={`${ws.engine}-${signupSeed.v}`}
          initial={signupSeed.values}
          engine={ws.engine}
          onSignIn={() => {
            setExistingEmail(null);
            go('signin');
          }}
          onExistingUser={(email) => {
            setExistingEmail(email);
            go('signin');
          }}
          onSubmit={({ country: _country, ...w }) =>
            setSt((s) => ({
              ...s,
              workspace: w,
              me: { name: `${w.firstName} ${w.lastName}`, email: w.email, role: 'Admin' },
              screen: 'provisioning',
            }))
          }
        />
      );
      break;
    case 'signin':
      screen = (
        <SignInScreen
          email={existingEmail ?? undefined}
          existing={!!existingEmail}
          onSignIn={() => go('home')}
          onCreate={() => {
            setExistingEmail(null);
            go('signup');
          }}
        />
      );
      break;
    case 'provisioning':
      screen = (
        <ProvisioningScreen
          key={String(st.simulate.provisioningFails)}
          workspace={ws}
          fails={st.simulate.provisioningFails}
          onOpenInbox={() => go('inbox')}
        />
      );
      break;
    case 'inbox':
      screen = (
        <InboxScreen
          journey={st.journey}
          workspace={ws}
          me={me}
          invitedBy={ADMIN_NAME}
          engineEmail={ws.engine === 'new'}
          onOpenLink={() => go(st.simulate.linkExpired ? 'link-expired' : 'set-password')}
        />
      );
      break;
    case 'set-password':
      screen = (
        <SetPasswordScreen
          journey={st.journey}
          email={me.email}
          name={me.name}
          company={ws.company}
          slug={ws.slug}
          invitedBy={ADMIN_NAME}
          onDone={() => go('teammates')}
        />
      );
      break;
    case 'link-expired':
      screen = (
        <LinkExpiredScreen
          journey={st.journey}
          invitedBy={ADMIN_NAME}
          email={me.email}
          onResend={() => setSt((s) => ({ ...s, simulate: { ...s.simulate, linkExpired: false }, screen: 'inbox' }))}
          onSignIn={() => go('signin')}
        />
      );
      break;
    case 'teammates':
      screen = (
        <TeammatesScreen
          firstName={me.name.split(' ')[0]}
          isAdmin={isAdmin}
          setup={setup}
          onApproveOutreach={(on) => patchSetup((s) => ({ ...s, outreachApproved: on }))}
          onConnect={() => {
            setSt((s) => ({ ...s, screen: 'home', panel: 'open', setup: { ...s.setup, teammates: 'done' } }));
            // Straight into checklist step: connect mailbox + calendar (unless already done).
            if (!(setup.mailbox.mail && setup.mailbox.calendar)) setDialog('mailbox');
          }}
          onSkip={() =>
            setSt((s) => ({
              ...s,
              screen: 'home',
              panel: 'open',
              setup: { ...s.setup, teammates: s.setup.teammates === 'done' ? 'done' : 'skipped' },
            }))
          }
        />
      );
      break;
    case 'home':
      screen = (
        <SetupHome
          state={st}
          onOpenStep={openStep}
          onSkipStep={skipStep}
          onPanel={(panel) => setSt((s) => ({ ...s, panel }))}
          onNavigate={(label) => {
            if (label !== 'Home') window.location.hash = '';
          }}
          onCompletionSeen={() => setSt((s) => ({ ...s, panel: 'dismissed', setup: { ...s.setup, completionSeen: true } }))}
        />
      );
      break;
  }

  return (
    <div className="h-full">
      {screen}

      {/* Dialogs mount only while open, so each open starts fresh. */}
      {dialog === 'mailbox' && (
        <ConnectMailboxDialog
          open
          onOpenChange={(v) => setDialog(v ? 'mailbox' : null)}
          email={me.email}
          reconnect={setup.mailbox.revoked ? setup.mailbox.provider : undefined}
          onConnected={({ provider, mail, calendar }) =>
            patchSetup((s) => {
              const m = {
                ...s.mailbox,
                provider,
                mail: s.mailbox.mail || mail,
                calendar: s.mailbox.calendar || calendar,
                revoked: false,
                skipped: false,
              };
              const startSync = m.mail && s.sync.state === 'idle';
              return { ...s, mailbox: m, sync: startSync ? { progress: 0, state: 'running' } : s.sync };
            })
          }
        />
      )}
      {dialog === 'engine' && (
        <FreightEngineDialog
          open
          onOpenChange={(v) => setDialog(v ? 'engine' : null)}
          kind={ws.engine}
          domain={ws.engineDomain}
          email={me.email}
          isAdmin={isAdmin}
          reconnect={setup.engine.expired}
          onConnected={(synced) => patchSetup((s) => ({ ...s, engine: { connected: true, synced: synced ?? s.engine.synced } }))}
        />
      )}
      {isAdmin && dialog === 'invite' && (
        <InviteDialog
          open
          onOpenChange={(v) => setDialog(v ? 'invite' : null)}
          engine={ws.engine}
          myEmail={me.email}
          invites={setup.invites}
          onSend={(rows) =>
            patchSetup((s) => ({
              ...s,
              inviteSkipped: false,
              invites: [
                ...s.invites,
                ...rows.map((r, i) => ({ ...r, id: `inv-${Date.now()}-${i}`, status: 'Invited' as const, sentAt: 'Just now' })),
              ],
            }))
          }
          onResend={(id) =>
            patchSetup((s) => ({ ...s, invites: s.invites.map((iv) => (iv.id === id ? { ...iv, status: 'Invited', sentAt: 'Just now' } : iv)) }))
          }
          onRevoke={(id) => patchSetup((s) => ({ ...s, invites: s.invites.map((iv) => (iv.id === id ? { ...iv, status: 'Revoked' } : iv)) }))}
        />
      )}

      <PrototypeSwitcher
        state={st}
        onScenario={startScenario}
        onScreen={(screen) => {
          setDialog(null);
          if (screen === 'signin') setExistingEmail(null);
          go(screen);
        }}
        onSimulate={(k, v) => setSt((s) => ({ ...s, simulate: { ...s.simulate, [k]: v } }))}
        onFillSignup={() => setSignupSeed((x) => ({ v: x.v + 1, values: sampleSignup(ws.engine) }))}
        onBreakMailbox={() => {
          patchSetup((s) => ({
            ...s,
            mailbox: { ...s.mailbox, mail: true, calendar: true, provider: s.mailbox.provider ?? 'Gmail', revoked: true },
            sync: s.sync.state === 'idle' ? { progress: 100, state: 'done' } : s.sync,
          }));
          go('home');
        }}
        onExpireEngine={() => {
          patchSetup((s) => ({ ...s, engine: { ...s.engine, connected: true, expired: true } }));
          go('home');
        }}
        onExpireInvite={() =>
          patchSetup((s) => {
            const i = s.invites.findIndex((iv) => iv.status === 'Invited');
            return i < 0 ? s : { ...s, invites: s.invites.map((iv, k) => (k === i ? { ...iv, status: 'Expired', sentAt: '2 days ago' } : iv)) };
          })
        }
        onCompleteAll={() => {
          setSt((s) => ({
            ...s,
            screen: 'home',
            panel: 'open',
            setup: {
              ...s.setup,
              teammates: 'done',
              mailbox: { mail: true, calendar: true, provider: s.setup.mailbox.provider ?? 'Gmail' },
              sync: { progress: 100, state: 'done' },
              engine: { connected: true, synced: s.workspace.engine === 'existing' ? { rates: 128, customers: 36 } : undefined },
              invites:
                s.journey === 'admin' && s.setup.invites.length === 0
                  ? [
                      {
                        id: 'inv-sample',
                        name: 'Priya Nair',
                        email: 'priya@acmelogistics.com',
                        role: 'Sales Rep',
                        status: 'Invited',
                        engineUser: 'created',
                        sentAt: 'Just now',
                      },
                    ]
                  : s.setup.invites,
              completionSeen: false,
            },
          }));
        }}
        onReset={() => startScenario(`${st.journey}-${ws.engine}` as Scenario)}
      />
    </div>
  );
}
