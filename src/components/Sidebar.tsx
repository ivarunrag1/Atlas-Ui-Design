import { useEffect, useState } from 'react';
import { Building2, LayoutDashboard, Target, Bot, Users, BarChart3, Settings, PanelLeftClose, PanelLeftOpen, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Hint } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/lib/use-theme';
import { cn } from '@/lib/utils';

const nav = [
  { icon: LayoutDashboard, label: 'Pipeline' },
  { icon: Target, label: 'Leads' },
  { icon: Bot, label: 'Agents' },
  { icon: Building2, label: 'Companies' },
  { icon: Users, label: 'Contacts' },
  { icon: BarChart3, label: 'Reports' },
];

const STORAGE_KEY = 'atlas.sidebarCollapsed';

/** Remembers the collapsed state per viewer (falls back to expanded if storage is unavailable). */
function useCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      /* storage unavailable — state just won't persist */
    }
  }, [collapsed]);
  return [collapsed, setCollapsed] as const;
}

/** Wraps an item in a hover hint when the sidebar is collapsed (labels are hidden then). */
function NavHint({ show, label, children }: { show: boolean; label: string; children: React.ReactElement }) {
  return show ? (
    <Hint label="Go to" value={label} side="right">
      {children}
    </Hint>
  ) : (
    children
  );
}

/**
 * Left navigation — expanded (240px, icons + labels) or collapsed (64px, icons only,
 * labels on hover). The toggle sits next to the brand; the choice is remembered.
 */
export function Sidebar({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate: (label: string) => void;
}) {
  const [collapsed, setCollapsed] = useCollapsed();
  const [theme, setTheme] = useTheme();
  const dark = theme === 'dark';

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-[240px]',
      )}
    >
      {/* Brand + collapse toggle */}
      <div className={cn('flex items-center py-4', collapsed ? 'flex-col gap-2 px-2' : 'justify-between px-5')}>
        <div className="flex items-center gap-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-subtle font-bold text-ink">
            Q
          </div>
          {!collapsed && <span className="text-[17px] font-bold text-ink">QuoteAI</span>}
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className="text-faint"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </Button>
      </div>

      {/* Nav */}
      <nav className={cn('flex flex-col gap-1 py-2', collapsed ? 'items-center px-2' : 'px-3')}>
        {nav.map(({ icon: Icon, label }) => (
          <NavHint key={label} show={collapsed} label={label}>
            <Button
              variant="ghost"
              onClick={() => onNavigate(label)}
              aria-label={collapsed ? label : undefined}
              aria-current={label === active ? 'page' : undefined}
              className={cn(
                collapsed ? 'size-9 justify-center p-0' : 'w-full justify-start gap-3',
                label === active && 'bg-subtle text-ink',
              )}
            >
              <Icon size={18} />
              {!collapsed && label}
            </Button>
          </NavHint>
        ))}
      </nav>

      <div className={cn('mt-auto flex flex-col gap-1 py-4', collapsed ? 'items-center px-2' : 'px-3')}>
        <NavHint show={collapsed} label="Settings">
          <a
            aria-label={collapsed ? 'Settings' : undefined}
            className={cn(
              'flex items-center rounded-lg text-sm font-medium text-muted hover:bg-subtle',
              collapsed ? 'size-9 justify-center' : 'gap-3 px-3 py-2',
            )}
          >
            <Settings size={18} />
            {!collapsed && 'Settings'}
          </a>
        </NavHint>

        {/* Theme toggle — icon button when collapsed, labelled switch when expanded */}
        {collapsed ? (
          <Hint label="Theme" value={dark ? 'Switch to light' : 'Switch to dark'} side="right">
            <Button
              variant="ghost"
              onClick={() => setTheme(dark ? 'light' : 'dark')}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="size-9 justify-center p-0"
            >
              {dark ? <Moon size={18} /> : <Sun size={18} />}
            </Button>
          </Hint>
        ) : (
          <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-subtle">
            {dark ? <Moon size={18} /> : <Sun size={18} />}
            <span className="flex-1">Dark mode</span>
            <Switch checked={dark} onCheckedChange={(on) => setTheme(on ? 'dark' : 'light')} aria-label="Dark mode" />
          </label>
        )}

        {collapsed ? (
          <Hint label="Agents" value="Auto" side="right">
            <span className="mt-2 grid size-9 place-items-center rounded-lg border border-line">
              <span className="size-2 rounded-full bg-success" />
            </span>
          </Hint>
        ) : (
          <div className="mx-2 mt-2 flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[12px] font-medium text-muted">
            <span className="size-2 rounded-full bg-success" />
            Agents · Auto
          </div>
        )}

        <div className={cn('mt-3 flex items-center gap-3', !collapsed && 'mx-1')}>
          <NavHint show={collapsed} label="Varun Reddy · Sales rep">
            <div className="grid size-9 shrink-0 place-items-center rounded-full border border-line-strong bg-subtle font-semibold text-ink">
              V
            </div>
          </NavHint>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold text-ink">Varun Reddy</div>
              <div className="text-[12px] text-faint">Sales rep</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
