import { useState } from 'react';
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

  return (
    <div className="flex h-screen bg-canvas text-ink">
      <Sidebar active={activeNav} onNavigate={navigate} />

      {view === 'pipeline' && <DealsView onOpenDeal={openDeal} />}
      {view === 'contacts' && <ContactsView onOpenContact={openContact} />}

      {view === 'deal' && selectedDeal && (
        <>
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar
              section="Pipeline"
              title={selectedDeal.company}
              badge={selectedDeal.id}
              chatOpen={chatOpen}
              onToggleChat={() => setChatOpen((v) => !v)}
              onBack={() => setView('pipeline')}
            />
            <div className="flex min-h-0 flex-1">
              <DealInfoPane key={selectedDeal.id} deal={selectedDeal} />
              <DealTabs key={selectedDeal.id} deal={selectedDeal} activityLog={log} />
            </div>
          </div>
          <AgentChat open={chatOpen} onClose={() => setChatOpen(false)} onRecord={recordActivity} />
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
              <ContactInfoPane key={selectedContact.id} contact={selectedContact} />
              <ContactTabs key={selectedContact.id} contact={selectedContact} onOpenDeal={openDeal} />
            </div>
          </div>
          <AgentChat open={chatOpen} onClose={() => setChatOpen(false)} onRecord={recordActivity} />
        </>
      )}
    </div>
  );
}
