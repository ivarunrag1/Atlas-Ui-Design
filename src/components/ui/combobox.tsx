import * as React from 'react';
import { Check, X } from 'lucide-react';
import { inputVariants } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * ChipCombobox — searchable single-select in the Input chrome.
 * The chosen value renders as a chip inside the box; typing filters the dropdown,
 * ↑/↓ + Enter pick, Esc closes, Backspace on an empty query (or the chip's ×) clears.
 * `renderItem` draws both the chip content and each dropdown row, so they match.
 */
/** Outlined value chip with an optional remove (×). Used inside inputs and in chip lists. */
function ValueChip({
  onRemove,
  removeLabel = 'Remove',
  className,
  children,
}: {
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      data-slot="value-chip"
      className={cn(
        'inline-flex h-6 min-w-0 shrink items-center gap-1.5 rounded-[6px] border border-line-strong px-2 text-[12px]',
        className,
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          aria-label={removeLabel}
          onPointerDown={(e) => e.stopPropagation()} // don't open a parent menu trigger
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="-mr-1 grid size-4 shrink-0 place-items-center rounded text-faint hover:text-ink"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}

function ChipCombobox<T>({
  value,
  onChange,
  options,
  getKey,
  matches,
  renderItem,
  placeholder,
  emptyText = 'No matches',
  'aria-label': ariaLabel,
}: {
  value: T | null;
  onChange: (v: T | null) => void;
  options: T[];
  getKey: (item: T) => string;
  matches: (item: T, query: string) => boolean;
  renderItem: (item: T) => React.ReactNode;
  placeholder?: string;
  emptyText?: string;
  'aria-label'?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [highlight, setHighlight] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listId = React.useId();

  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => matches(o, q)) : options;

  const close = () => {
    setOpen(false);
    setQuery('');
  };
  const pick = (item: T) => {
    onChange(item);
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter' && open && filtered[highlight]) {
      e.preventDefault();
      pick(filtered[highlight]);
    } else if (e.key === 'Escape') {
      close();
    } else if (e.key === 'Backspace' && !query && value) {
      onChange(null);
    }
  };

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) close();
      }}
    >
      <div
        onClick={() => {
          inputRef.current?.focus();
          setOpen(true);
        }}
        className={cn(
          inputVariants(),
          'flex cursor-text items-center gap-1.5 px-1.5 focus-within:border-line-strong',
          open && 'border-line-strong',
        )}
      >
        {value && !query && (
          <ValueChip
            className="max-w-[calc(100%-1.5rem)]"
            onRemove={() => {
              onChange(null);
              inputRef.current?.focus();
            }}
          >
            {renderItem(value)}
          </ValueChip>
        )}
        <input
          ref={inputRef}
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={listId}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={value ? '' : placeholder}
          className="h-full min-w-8 flex-1 bg-transparent px-1 text-[14px] outline-none placeholder:text-faint"
        />
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-xl"
        >
          {filtered.map((item, i) => {
            const selected = value !== null && getKey(item) === getKey(value);
            return (
              <li
                key={getKey(item)}
                role="option"
                aria-selected={selected}
                onMouseDown={(e) => e.preventDefault()} // keep focus in the input
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(item)}
                className={cn(
                  'flex h-9 cursor-pointer items-center gap-1.5 rounded-[6px] px-2.5 text-[14px]',
                  i === highlight && 'bg-subtle',
                )}
              >
                {renderItem(item)}
                {selected && <Check size={14} className="ml-auto shrink-0 text-ink" />}
              </li>
            );
          })}
          {filtered.length === 0 && <li className="px-2.5 py-2 text-[12px] text-faint">{emptyText}</li>}
        </ul>
      )}
    </div>
  );
}

export { ChipCombobox, ValueChip };
