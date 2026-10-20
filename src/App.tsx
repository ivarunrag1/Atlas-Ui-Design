import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DealInfoPane } from './components/DealInfoPane';
import { DealTabs } from './components/DealTabs';
import { AgentChat } from './components/AgentChat';
import { DealsView } from './components/DealsView';
import { ContactsView } from './components/ContactsView';
import { ContactInfoPane } from './components/ContactInfoPane';
import { ContactTabs } from './components/ContactTabs';
import { activity, type Activity } from './data/deal';
import { type DealSummary } from './data/deals';
import { type ContactSummary } from './data/contacts';
import { AgentProvider, type AgentScope } from './lib/agent-context';
import { FocusProvider } from './lib/focus-context';

type View = 'pipeline' | 'deal' | 'contacts' | 'contact';

export default function App() {
  const [view, setView] = useState<View>('pipeline');
  const [selectedDeal, setSelectedDeal] = useState<DealSummary | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactSummary | null>(null);

  const openDeal = (d: DealSummary) => {
    setSelectedDeal(d);
    setView('deal');
  };
  const openContact = (c: ContactSummary) => {
    setSelectedContact(c);
    setView('contact');
  };

  const navigate = (label: string) => {
    if (label === 'Pipeline') setView('pipeline');
    else if (label === 'Contacts') setView('contacts');
  };
  const activeNav = view === 'contacts' || view === 'contact' ? 'Contacts' : 'Pipeline';

  // Shared activity log — shown in Overview; the agent chat appends to it.
  const [log, setLog] = useState<Activity[]>(activity);
  const recordActivity = (a: Activity) => setLog((l) => [a, ...l]);

  const [chatOpen, setChatOpen] = useState(true);
  // What the agent panel is scoped to — set by "Ask Atlas" buttons anywhere in the app.
  const [agentScope, setAgentScope] = useState<AgentScope | null>(null);
  const agent = {
    scope: agentScope,
    askAtlas: (scope: AgentScope) => {
      setAgentScope(scope);
      setChatOpen(true);
      setChatInFocus(true);
    },
    clearScope: () => setAgentScope(null),
  };

  // Expand (Enquiry): hide sidebar, record pane and chat. Only while the Enquiry tab is
  // showing — leaving it collapses, returning restores. Esc turns it off.
  const [expandWanted, setExpandWanted] = useState(false);
  const [expandable, setExpandable] = useState(false);
  const focusOn = expandWanted && expandable && view === 'deal';
  // While expanded the chat is hidden, unless the user opens it from there.
  const [chatInFocus, setChatInFocus] = useState(false);
  const setFocus = (on: boolean) => {
    setExpandWanted(on);
    setChatInFocus(false);
  };
  useEffect(() => {
    if (!focusOn) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !(e.target as HTMLElement)?.closest('[role="dialog"],[role="menu"]')) {
        setExpandWanted(false);
        setChatInFocus(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusOn]);
  const chatVisible = chatOpen && (!focusOn || chatInFocus);
  const toggleChat = () => {
    if (focusOn && !chatInFocus) {
      setChatOpen(true);
      setChatInFocus(true);
    } else setChatOpen((v) => !v);
  };

  return (
    <FocusProvider value={{ focus: focusOn, setFocus, setExpandable }}>
    <AgentProvider value={agent}>
      <div className="flex h-screen bg-canvas text-ink">
        {!focusOn && <Sidebar active={activeNav} onNavigate={navigate} />}

        {view === 'pipeline' && <DealsView onOpenDeal={openDeal} />}
        {view === 'contacts' && <ContactsView onOpenContact={openContact} />}

        {view === 'deal' && selectedDeal && (
          <>
            <div className="flex min-w-0 flex-1 flex-col">
              <TopBar
                section="Pipeline"
                title={selectedDeal.company}
                badge={selectedDeal.id}
                chatOpen={chatVisible}
                onToggleChat={toggleChat}
                onBack={() => setView('pipeline')}
              />
              {/* Distinct sibling keys (per deal) — the info pane is removed/re-added by Focus mode. */}
              <div className="flex min-h-0 flex-1">
                {!focusOn && <DealInfoPane key={`info-${selectedDeal.id}`} deal={selectedDeal} />}
                <DealTabs key={`tabs-${selectedDeal.id}`} deal={selectedDeal} activityLog={log} />
              </div>
            </div>
            <AgentChat open={chatVisible} onClose={() => setChatOpen(false)} onRecord={recordActivity} />
          </>
        )}

        {view === 'contact' && selectedContact && (
          <>
            <div className="flex min-w-0 flex-1 flex-col">
              <TopBar
                section="Contacts"
                title={selectedContact.name}
                badge={selectedContact.company}
                chatOpen={chatOpen}
                onToggleChat={() => setChatOpen((v) => !v)}
                onBack={() => setView('contacts')}
              />
              <div className="flex min-h-0 flex-1">
                <ContactInfoPane key={`info-${selectedContact.id}`} contact={selectedContact} />
                <ContactTabs key={`tabs-${selectedContact.id}`} contact={selectedContact} onOpenDeal={openDeal} />
              </div>
            </div>
            <AgentChat open={chatOpen} onClose={() => setChatOpen(false)} onRecord={recordActivity} />
          </>
        )}
      </div>
    </AgentProvider>
    </FocusProvider>
  );
}
