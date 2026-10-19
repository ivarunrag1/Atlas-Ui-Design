import * as React from 'react';
import { ValueChip } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/**
 * RecipientInput — email addresses as chips in the Input chrome. Enter, comma or Tab
 * (or blur) adds the typed address; × removes; Backspace on an empty field removes
 * the last chip. Invalid addresses are shown in red.
 */
function RecipientInput({
  value,
  onChange,
  placeholder,
  className,
  'aria-label': ariaLabel,
}: {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}) {
  const [draft, setDraft] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const commit = () => {
    const parts = draft
      .split(/[,;\s]+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .filter((p) => !value.includes(p));
    if (parts.length) onChange([...value, ...parts]);
    setDraft('');
  };

  return (
    <div
      data-slot="recipient-input"
      onClick={() => inputRef.current?.focus()}
      className={cn(
        'flex min-h-8 w-full cursor-text flex-wrap items-center gap-1 rounded-lg border border-line bg-canvas px-1.5 py-1 transition-colors focus-within:border-line-strong',
        className,
      )}
    >
      {value.map((email) => (
        <ValueChip
          key={email}
          removeLabel={`Remove ${email}`}
          onRemove={() => onChange(value.filter((e) => e !== email))}
          className={isEmail(email) ? undefined : 'border-danger/50 text-danger'}
        >
          <span className="truncate">{email}</span>
        </ValueChip>
      ))}
      <input
        ref={inputRef}
        type="email"
        aria-label={ariaLabel}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',' || (e.key === 'Tab' && draft)) {
            e.preventDefault();
            commit();
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={commit}
        placeholder={value.length ? '' : placeholder}
        className="h-6 min-w-32 flex-1 bg-transparent px-1 text-[14px] text-ink outline-none placeholder:text-faint"
      />
    </div>
  );
}

export { RecipientInput };
