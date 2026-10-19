import * as React from 'react';
import { cn } from '@/lib/utils';

/** Multi-line input — same chrome as Input (see ui/input.tsx). */
function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'w-full min-w-0 resize-none rounded-lg border border-line bg-canvas px-3 py-2 text-[14px] leading-relaxed text-ink outline-none transition-colors placeholder:text-faint focus-visible:border-line-strong disabled:opacity-40',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Composer — auto-growing message box with a trailing action (chat, comments).
 * `submitOn` picks the keyboard shortcut: plain Enter (chat) or ⌘/Ctrl+Enter (notes).
 */
function Composer({
  value,
  onChange,
  onSubmit,
  submitOn = 'enter',
  placeholder,
  action,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitOn?: 'enter' | 'mod-enter';
  placeholder?: string;
  action: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="composer"
      className={cn(
        'flex items-end gap-2 rounded-xl border border-line bg-canvas p-2 transition-colors focus-within:border-line-strong',
        className,
      )}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          const fire = submitOn === 'enter' ? !e.shiftKey : e.metaKey || e.ctrlKey;
          if (fire) {
            e.preventDefault();
            onSubmit();
          }
        }}
        rows={1}
        placeholder={placeholder}
        className="max-h-28 min-h-[24px] flex-1 resize-none bg-transparent px-2 py-1 text-[14px] text-ink outline-none placeholder:text-faint"
      />
      {action}
    </div>
  );
}

export { Textarea, Composer };
