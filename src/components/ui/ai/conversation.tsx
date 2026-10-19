import * as React from 'react';
import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/**
 * Conversation — AI Elements–style chat log (shadcn registry), on the ATLAS tokens.
 * Sticks to the bottom as messages arrive (unless the user has scrolled up) and
 * shows a "scroll to latest" button when not at the bottom.
 */
interface ConversationCtx {
  viewport: React.RefObject<HTMLDivElement | null>;
  atBottom: boolean;
  scrollToBottom: (smooth?: boolean) => void;
}
const Ctx = React.createContext<ConversationCtx | null>(null);
const useConversation = () => React.useContext(Ctx);

const NEAR_BOTTOM = 48;

function Conversation({ className, children }: { className?: string; children: React.ReactNode }) {
  const viewport = React.useRef<HTMLDivElement | null>(null);
  const [atBottom, setAtBottom] = React.useState(true);

  const scrollToBottom = React.useCallback((smooth = true) => {
    const el = viewport.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  React.useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const onScroll = () => setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Ctx.Provider value={{ viewport, atBottom, scrollToBottom }}>
      <div data-slot="conversation" role="log" className={cn('relative min-h-0 flex-1', className)}>
        <ScrollArea viewportRef={viewport} className="h-full">
          {children}
        </ScrollArea>
      </div>
    </Ctx.Provider>
  );
}

/** Message list — follows new content while the reader is at the bottom. */
function ConversationContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const conv = useConversation();
  const ref = React.useRef<HTMLDivElement>(null);
  const follow = React.useRef(true);
  React.useEffect(() => {
    follow.current = conv?.atBottom ?? true;
  }, [conv?.atBottom]);

  // Stable (useCallback) — so this runs once: jump to the end, then follow growth.
  const scrollToBottom = conv?.scrollToBottom;
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !scrollToBottom) return;
    scrollToBottom(false);
    const obs = new ResizeObserver(() => {
      if (follow.current) scrollToBottom();
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [scrollToBottom]);

  return (
    <div ref={ref} data-slot="conversation-content" className={cn('flex flex-col gap-4 px-5 py-4', className)}>
      {children}
    </div>
  );
}

/** Floating "jump to latest" — only while scrolled up. */
function ConversationScrollButton({ className }: { className?: string }) {
  const conv = useConversation();
  if (!conv || conv.atBottom) return null;
  return (
    <Button
      variant="secondary"
      size="icon-sm"
      onClick={() => conv.scrollToBottom()}
      aria-label="Scroll to latest message"
      className={cn('absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full shadow-xl', className)}
    >
      <ArrowDown size={16} />
    </Button>
  );
}

export { Conversation, ConversationContent, ConversationScrollButton };
