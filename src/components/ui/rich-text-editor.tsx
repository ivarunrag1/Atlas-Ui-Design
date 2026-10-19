import * as React from 'react';
import { Bold, Italic, Link2, List, ListOrdered, RemoveFormatting, Underline } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Hint } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * RichTextEditor — lightweight HTML editor (contentEditable + the browser's editing
 * commands) in the Input chrome: toolbar for bold / italic / underline, bulleted and
 * numbered lists, links and clear formatting. `value` / `onChange` are HTML strings.
 * Swap the internals for TipTap/Lexical in production — the props can stay the same.
 */
const tools: { cmd: string; label: string; icon: React.ComponentType<{ size?: number }>; arg?: () => string | null }[] = [
  { cmd: 'bold', label: 'Bold (⌘B)', icon: Bold },
  { cmd: 'italic', label: 'Italic (⌘I)', icon: Italic },
  { cmd: 'underline', label: 'Underline (⌘U)', icon: Underline },
  { cmd: 'insertUnorderedList', label: 'Bulleted list', icon: List },
  { cmd: 'insertOrderedList', label: 'Numbered list', icon: ListOrdered },
  { cmd: 'createLink', label: 'Link', icon: Link2, arg: () => window.prompt('Link URL', 'https://') },
  { cmd: 'removeFormat', label: 'Clear formatting', icon: RemoveFormatting },
];

function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  'aria-label': ariaLabel,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState<Record<string, boolean>>({});

  // Only push external value into the DOM when it differs (keeps the caret while typing).
  React.useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, [value]);

  const refreshActive = () =>
    setActive(Object.fromEntries(tools.map((t) => [t.cmd, safeState(t.cmd)])));

  const run = (cmd: string, arg?: string | null) => {
    if (arg === null) return; // prompt cancelled
    ref.current?.focus();
    document.execCommand(cmd, false, arg ?? undefined);
    onChange(ref.current?.innerHTML ?? '');
    refreshActive();
  };

  return (
    <div
      data-slot="rich-text-editor"
      className={cn(
        'overflow-hidden rounded-lg border border-line bg-canvas transition-colors focus-within:border-line-strong',
        className,
      )}
    >
      <div role="toolbar" aria-label="Formatting" className="flex items-center gap-0.5 border-b border-line px-1.5 py-1">
        {tools.map(({ cmd, label, icon: Icon, arg }) => (
          <Hint key={cmd} label="Format" value={label}>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={label}
              aria-pressed={active[cmd] ?? false}
              // Keep the selection in the editor when clicking the toolbar.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => run(cmd, arg?.())}
              className={cn('size-7 rounded-[6px]', active[cmd] && 'bg-subtle text-ink')}
            >
              <Icon size={14} />
            </Button>
          </Hint>
        ))}
      </div>
      <div
        ref={ref}
        role="textbox"
        aria-multiline
        aria-label={ariaLabel}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onKeyUp={refreshActive}
        onMouseUp={refreshActive}
        className={cn(
          'max-h-80 min-h-40 overflow-y-auto px-3 py-2 text-[14px] leading-relaxed text-ink outline-none',
          '[&_a]:text-brand [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5',
          'empty:before:text-faint empty:before:italic empty:before:content-[attr(data-placeholder)]',
        )}
      />
    </div>
  );
}

function safeState(cmd: string) {
  try {
    return document.queryCommandState(cmd);
  } catch {
    return false;
  }
}

/** Plain text (paragraphs separated by blank lines) → simple HTML for the editor. */
const textToHtml = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`)
    .join('');

export { RichTextEditor, textToHtml };
