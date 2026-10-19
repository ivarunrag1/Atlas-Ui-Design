import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { inputVariants } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface MultiSelectGroup {
  label: string;
  options: { value: string; label: string; icon?: React.ReactNode }[];
}

/**
 * GroupedMultiSelect — multi-select in the Input chrome. The field stays one line
 * however many are picked: a count badge + the selected names (truncated), or
 * `allLabel` when everything is selected. The menu lists options under group
 * labels, each group with an All / None shortcut, and stays open while ticking.
 */
function GroupedMultiSelect({
  value,
  onChange,
  groups,
  placeholder = 'Select…',
  allLabel = 'All',
  'aria-label': ariaLabel,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  groups: MultiSelectGroup[];
  placeholder?: string;
  /** Shown instead of the names when every option is selected. */
  allLabel?: string;
  'aria-label'?: string;
}) {
  const all = groups.flatMap((g) => g.options);
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const selected = all.filter((o) => value.includes(o.value));
  const summary = selected.length === all.length ? allLabel : selected.map((o) => o.label).join(', ');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          title={selected.length ? selected.map((o) => o.label).join(', ') : undefined}
          className={cn(
            inputVariants(),
            'relative flex cursor-pointer items-center gap-2 pr-8 text-left focus-visible:border-line-strong data-[state=open]:border-line-strong',
          )}
        >
          {selected.length === 0 ? (
            <span className="truncate text-faint italic">{placeholder}</span>
          ) : (
            <>
              <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-ink px-1.5 text-[10px] font-bold text-canvas">
                {selected.length}
              </span>
              <span className="min-w-0 truncate text-ink">{summary}</span>
            </>
          )}
          <ChevronDown size={14} className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-faint" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-64">
        {groups.map((g, gi) => {
          const values = g.options.map((o) => o.value);
          const allOn = values.every((v) => value.includes(v));
          return (
            <React.Fragment key={g.label}>
              {gi > 0 && <DropdownMenuSeparator />}
              <div className="flex items-center justify-between pr-1">
                <DropdownMenuLabel>{g.label}</DropdownMenuLabel>
                <button
                  type="button"
                  onClick={() =>
                    onChange(allOn ? value.filter((v) => !values.includes(v)) : [...new Set([...value, ...values])])
                  }
                  className="rounded px-1.5 text-[10px] font-semibold text-muted hover:text-ink"
                >
                  {allOn ? 'None' : 'All'}
                </button>
              </div>
              {g.options.map((o) => (
                <DropdownMenuCheckboxItem
                  key={o.value}
                  checked={value.includes(o.value)}
                  onCheckedChange={() => toggle(o.value)}
                >
                  {o.icon}
                  {o.label}
                </DropdownMenuCheckboxItem>
              ))}
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { GroupedMultiSelect };
