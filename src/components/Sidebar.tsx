import {
  LayoutDashboard,
  Bot,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
} from 'lucide-react';

const nav = [
  { icon: LayoutDashboard, label: 'Pipeline' },
  { icon: Bot, label: 'Agents' },
  { icon: Users, label: 'Contacts' },
  { icon: BarChart3, label: 'Reports' },
];

export function Sidebar({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate: (label: string) => void;
}) {
  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r border-line bg-surface">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg border border-line bg-subtle font-bold text-ink">
            Q
          </div>
          <span className="text-[17px] font-bold text-ink">QuoteAI</span>
        </div>
        <button
          aria-label="Collapse sidebar"
          className="grid size-7 place-items-center rounded-md text-faint hover:bg-subtle"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3 py-2">
        {nav.map(({ icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => onNavigate(label)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
              label === active ? 'bg-subtle text-ink' : 'text-muted hover:bg-subtle'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 px-3 py-4">
        <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-subtle">
          <Settings size={18} />
          Settings
        </a>
        <div className="mx-2 mt-2 flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[12px] font-medium text-muted">
          <span className="size-2 rounded-full bg-success" />
          Agents · Auto
        </div>
        <div className="mx-1 mt-3 flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-full border border-line-strong bg-subtle font-semibold text-ink">
            V
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-ink">Varun Reddy</div>
            <div className="text-[12px] text-faint">Sales rep</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
