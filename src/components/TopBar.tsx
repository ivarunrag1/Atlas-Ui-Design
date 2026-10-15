import { ChevronLeft, MessageSquare, PanelRight } from 'lucide-react';

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
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid size-7 place-items-center rounded-md text-muted hover:bg-subtle"
        >
          <ChevronLeft size={18} />
        </button>
        <button onClick={onBack} className="text-muted hover:text-ink">
          {section}
        </button>
        <span className="text-faint">/</span>
        <span className="font-semibold text-ink">{title}</span>
        <span className="ml-1 rounded-md bg-subtle px-2 py-0.5 text-[12px] font-medium text-faint">{badge}</span>
      </div>

      {/* Opens / closes the agent chat panel */}
      <button
        onClick={onToggleChat}
        aria-pressed={chatOpen}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          chatOpen
            ? 'border-line-strong bg-subtle text-ink'
            : 'border-line bg-surface text-muted hover:bg-subtle'
        }`}
      >
        <MessageSquare size={16} />
        Ask Atlas
        <PanelRight size={15} className={chatOpen ? 'opacity-70' : 'opacity-50'} />
      </button>
    </header>
  );
}
