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
import { deals as seedDeals, type DealSummary } from './data/deals';
import { dealValueOf, mockDealFieldValues, type DealFieldValues } from './data/dealFields';
import { contacts as seedContacts, type ContactSummary } from './data/contacts';
import { leads as seedLeads, type LeadSummary } from './data/leads';
import { organizations as seedOrganizations, type Organization } from './data/organizations';
import { CompaniesView } from './components/CompaniesView';
import { CompanyInfoPane } from './components/CompanyInfoPane';
import { CompanyTabs } from './components/CompanyTabs';
import { convertLead, type ConvertInput } from './data/convert';
import { ConvertLeadDialog } from './components/ConvertLeadDialog';
import { LeadsView } from './components/LeadsView';
import { LeadInfoPane } from './components/LeadInfoPane';
import { LeadTabs } from './components/LeadTabs';
import { AgentProvider, type AgentScope } from './lib/agent-context';
import { FocusProvider } from './lib/focus-context';

type View = 'pipeline' | 'deal' | 'leads' | 'lead' | 'contacts' | 'contact' | 'companies' | 'company';

export default function App() {
  const [view, setView] = useState<View>('pipeline');
  const [selectedDeal, setSelectedDeal] = useState<DealSummary | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const openDeal = (d: DealSummary) => {
    setSelectedDeal(d);
    setView('deal');
  };
  const openContact = (c: ContactSummary) => {
    setSelectedContactId(c.id);
    setView('contact');
  };
  const openCompany = (o: Organization) => {
    setSelectedCompanyId(o.id);
    setView('company');
  };
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const openLead = (l: LeadSummary) => {
    setSelectedLeadId(l.id);
    setView('lead');
  };

  // Records shared across views — lead conversion adds to deals, contacts and companies.
  const [dealItems, setDealItems] = useState<DealSummary[]>(seedDeals);
  const [contactItems, setContactItems] = useState<ContactSummary[]>(seedContacts);
  const [leadItems, setLeadItems] = useState<LeadSummary[]>(seedLeads);
  const [organizations, setOrganizations] = useState(seedOrganizations);
  const selectedLead = leadItems.find((l) => l.id === selectedLeadId) ?? null;
  const selectedContact = contactItems.find((c) => c.id === selectedContactId) ?? null;
  const selectedCompany = organizations.find((o) => o.id === selectedCompanyId) ?? null;
  const orgOf = (c: ContactSummary) =>
    organizations.find((o) => o.id === c.organizationId) ?? organizations.find((o) => o.name === c.company);
  const [converting, setConverting] = useState(false);

  const navigate = (label: string) => {
    if (label === 'Pipeline') setView('pipeline');
    else if (label === 'Leads') setView('leads');
    else if (label === 'Contacts') setView('contacts');
    else if (label === 'Companies') setView('companies');
  };
  const convert = (input: ConvertInput) => {
    const r = convertLead(input, dealItems.length);
    setDealItems((xs) => [r.deal, ...xs]);
    setFieldEdits((prev) => ({ ...prev, [r.deal.id]: { ...mockDealFieldValues(r.deal), ...r.dealFields } }));
    setContactItems((xs) =>
      r.contactCreated ? [r.contact, ...xs] : xs.map((c) => (c.id === r.contact.id ? { ...c, dealsCount: c.dealsCount + 1 } : c)),
    );
    setOrganizations((xs) => (r.organizationCreated ? [r.organization, ...xs] : xs.map((o) => (o.id === r.organization.id ? r.organization : o))));
    setLeadItems((xs) =>
      xs.map((l) =>
        l.id === input.lead.id
          ? { ...l, status: 'Qualified', convertedTo: { dealId: r.deal.id, contactId: r.contact.id, organizationId: r.organization.id } }
          : l,
      ),
    );
    setConverting(false);
    openDeal(r.deal);
  };
  const openDealById = (id: string) => {
    const d = dealItems.find((x) => x.id === id);
    if (d) openDeal(d);
  };

  const activeNav =
    view === 'contacts' || view === 'contact'
      ? 'Contacts'
      : view === 'companies' || view === 'company'
        ? 'Companies'
        : view === 'leads' || view === 'lead'
          ? 'Leads'
          : 'Pipeline';

  // Atlas deal field values per deal — shared by the left pane and the Attributes tab.
  const [fieldEdits, setFieldEdits] = useState<Record<string, DealFieldValues>>({});
  const fieldsFor = (d: DealSummary) => fieldEdits[d.id] ?? mockDealFieldValues(d);
  const setDealField = (d: DealSummary, key: string, value: string) =>
    setFieldEdits((prev) => {
      const next = { ...(prev[d.id] ?? mockDealFieldValues(d)), [key]: value };
      // margin = deal_value − buy_value (empty when buy_value is empty)
      if (key === 'buy_value') next.margin = value ? String(dealValueOf(d) - Number(value)) : '';
      return { ...prev, [d.id]: next };
    });

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

        {view === 'pipeline' && <DealsView items={dealItems} setItems={setDealItems} onOpenDeal={openDeal} />}
        {view === 'leads' && <LeadsView items={leadItems} setItems={setLeadItems} onOpenLead={openLead} />}
        {view === 'contacts' && <ContactsView contacts={contactItems} onOpenContact={openContact} />}
        {view === 'companies' && (
          <CompaniesView organizations={organizations} contacts={contactItems} deals={dealItems} onOpenCompany={openCompany} />
        )}

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
                {!focusOn && <DealInfoPane key={`info-${selectedDeal.id}`} deal={selectedDeal} fields={fieldsFor(selectedDeal)} />}
                <DealTabs
                  key={`tabs-${selectedDeal.id}`}
                  deal={selectedDeal}
                  activityLog={log}
                  fieldValues={fieldsFor(selectedDeal)}
                  onFieldChange={(k, v) => setDealField(selectedDeal, k, v)}
                />
              </div>
            </div>
            <AgentChat open={chatVisible} onClose={() => setChatOpen(false)} onRecord={recordActivity} />
          </>
        )}

        {view === 'lead' && selectedLead && (
          <>
            <div className="flex min-w-0 flex-1 flex-col">
              <TopBar
                section="Leads"
                title={selectedLead.company}
                badge={selectedLead.id}
                chatOpen={chatOpen}
                onToggleChat={() => setChatOpen((v) => !v)}
                onBack={() => setView('leads')}
              />
              {/* Same record layout as Contacts: pane · tabs · agent chat */}
              <div className="flex min-h-0 flex-1">
                <LeadInfoPane
                  key={`info-${selectedLead.id}`}
                  lead={selectedLead}
                  onConvert={() => setConverting(true)}
                  onOpenDeal={openDealById}
                />
                <LeadTabs key={`tabs-${selectedLead.id}`} lead={selectedLead} />
              </div>
            </div>
            <AgentChat open={chatOpen} onClose={() => setChatOpen(false)} onRecord={recordActivity} />
            <ConvertLeadDialog
              lead={selectedLead}
              open={converting}
              onOpenChange={setConverting}
              organizations={organizations}
              contacts={contactItems}
              onConfirm={convert}
            />
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
                <ContactInfoPane
                  key={`info-${selectedContact.id}`}
                  contact={selectedContact}
                  org={orgOf(selectedContact)}
                  onOpenCompany={openCompany}
                />
                <ContactTabs
                  key={`tabs-${selectedContact.id}`}
                  contact={selectedContact}
                  org={orgOf(selectedContact)}
                  deals={dealItems}
                  onOpenDeal={openDeal}
                />
              </div>
            </div>
            <AgentChat open={chatOpen} onClose={() => setChatOpen(false)} onRecord={recordActivity} />
          </>
        )}

        {view === 'company' && selectedCompany && (
          <>
            <div className="flex min-w-0 flex-1 flex-col">
              <TopBar
                section="Companies"
                title={selectedCompany.name}
                badge={selectedCompany.id}
                chatOpen={chatOpen}
                onToggleChat={() => setChatOpen((v) => !v)}
                onBack={() => setView('companies')}
              />
              {/* Same record layout as Leads and Contacts: pane · tabs · agent chat */}
              <div className="flex min-h-0 flex-1">
                <CompanyInfoPane key={`info-${selectedCompany.id}`} org={selectedCompany} />
                <CompanyTabs
                  key={`tabs-${selectedCompany.id}`}
                  org={selectedCompany}
                  deals={dealItems}
                  contacts={contactItems}
                  onOpenDeal={openDeal}
                  onOpenContact={openContact}
                />
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
