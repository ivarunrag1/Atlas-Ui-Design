import * as React from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Tabs — re-skinned to the ATLAS/QuoteAI underline style (see src/index.css).
 * One tab style across the app: a bottom-bordered bar with a 2px active
 * underline. Count badges track the active state via `group-data-[state=active]`.
 */
function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex min-h-0 flex-col', className)}
      {...props}
    />
  );
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn('flex shrink-0 items-center gap-1 border-b border-line px-3', className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "group/tab -mb-px flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted outline-none transition-colors hover:text-ink data-[state=active]:border-ink data-[state=active]:text-ink disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('min-h-0 flex-1 overflow-hidden outline-none', className)}
      {...props}
    />
  );
}

/** Count badge — colour tracks the parent trigger's active state. */
function TabCount({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-line px-1.5 text-[10px] font-semibold text-faint group-data-[state=active]/tab:border-line-strong group-data-[state=active]/tab:text-ink">
      {children}
    </span>
  );
}

/** Convenience trigger: icon · label · optional count badge. */
function TabTrigger({
  value,
  icon: Icon,
  label,
  count,
}: {
  value: string;
  icon: LucideIcon;
  label: string;
  count?: number;
}) {
  return (
    <TabsTrigger value={value}>
      <Icon size={16} />
      {label}
      {count !== undefined && <TabCount>{count}</TabCount>}
    </TabsTrigger>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabTrigger };
