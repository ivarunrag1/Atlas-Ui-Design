import { ChevronLeft, MessageSquare, PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TopBar({
  section,
  title,
  badge,
  chatOpen,
  onToggleChat,
  onBack,
}: {
  section: string;
  title: string;
  badge: string;
  chatOpen: boolean;
  onToggleChat: () => void;
  onBack?: () => void;
}) {
  return (
    <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
      <div className="flex items-center gap-2 text-sm">
        <Button variant="ghost" size="icon-xs" onClick={onBack} aria-label="Back">
          <ChevronLeft size={18} />
        </Button>
        <Button variant="ghost" size="xs" onClick={onBack} className="px-1.5 text-sm font-normal">
          {section}
        </Button>
        <span className="text-faint">/</span>
        <span className="font-semibold text-ink">{title}</span>
        <span className="ml-1 rounded-md border border-line px-2 py-0.5 text-[12px] font-medium text-faint">{badge}</span>
      </div>

      {/* Opens / closes the agent chat panel */}
      <Button
        variant="outline"
        onClick={onToggleChat}
        aria-pressed={chatOpen}
        className={chatOpen ? 'gap-2 border-line-strong bg-subtle text-ink' : 'gap-2 bg-surface text-muted'}
      >
        <MessageSquare size={16} />
        Ask Atlas
        <PanelRight size={15} className={chatOpen ? 'opacity-70' : 'opacity-50'} />
      </Button>
    </header>
  );
}
