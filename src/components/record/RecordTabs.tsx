import { type LucideIcon } from 'lucide-react';
import { Tabs, TabsList, TabsContent, TabTrigger } from '@/components/ui/tabs';

export interface RecordTab {
  key: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  content: React.ReactNode;
}

/**
 * RecordTabs — the shared middle section of a CRM record page (Contacts, Leads, …):
 * an underline tab bar with icon · label · count, and each tab's content.
 */
export function RecordTabs({ tabs, defaultTab }: { tabs: RecordTab[]; defaultTab?: string }) {
  return (
    <Tabs defaultValue={defaultTab ?? tabs[0]?.key} className="flex-1 overflow-hidden bg-surface">
      <TabsList>
        {tabs.map(({ key, label, icon, count }) => (
          <TabTrigger key={key} value={key} icon={icon} label={label} count={count} />
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.key} value={t.key}>
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
