import { Pause } from 'lucide-react';
import { agents, type AgentId, type AgentLook } from '../data/agents';
import { cn } from '@/lib/utils';

export type AgentState = 'working' | 'needs-you' | 'paused';

/**
 * AgentAvatar — an AI teammate's portrait in a circle, at any size. `look` picks the
 * human photo (default) or the 3D render; photos are labelled "AI agent" so nobody
 * mistakes the agent for a person. States are drawn
 * in code (not exported art): `needs-you` adds a danger dot, `paused` (agent set to
 * Manual) greys the portrait and adds a pause badge. Badges scale with the avatar.
 */
export function AgentAvatar({
  agent,
  state = 'working',
  size = 32,
  look = 'photo',
  className,
}: {
  agent: AgentId;
  state?: AgentState;
  /** Diameter in px. */
  size?: number;
  look?: AgentLook;
  className?: string;
}) {
  const a = agents[agent];
  const badge = Math.max(8, Math.round(size * 0.3));
  const portrait = a.portraits[look];
  const label = `${a.name} · AI agent${state === 'needs-you' ? ' · needs you' : state === 'paused' ? ' · paused' : ''}`;

  return (
    <span className={cn('relative inline-flex shrink-0', className)} style={{ width: size, height: size }} role="img" aria-label={label} title={label}>
      {/* Accent circle with the initial shows until (or if) the portrait loads */}
      <span
        className="relative grid size-full place-items-center overflow-hidden rounded-full font-semibold text-surface"
        style={{ background: a.accent, fontSize: Math.max(9, size * 0.4) }}
      >
        {a.name[0]}
        <picture className="absolute inset-0">
          <source srcSet={portrait.webp} type="image/webp" />
          <img
            src={portrait.png}
            alt=""
            width={size}
            height={size}
            loading="lazy"
            decoding="async"
            className={cn('aspect-square size-full object-cover', state === 'paused' && 'grayscale')}
          />
        </picture>
      </span>

      {state === 'needs-you' && (
        <span
          className="absolute -top-px -right-px rounded-full bg-danger ring-2 ring-surface"
          style={{ width: badge, height: badge }}
          aria-hidden
        />
      )}
      {state === 'paused' && (
        <span
          className="absolute -right-0.5 -bottom-0.5 grid place-items-center rounded-full bg-faint text-surface ring-2 ring-surface"
          style={{ width: badge + 2, height: badge + 2 }}
          aria-hidden
        >
          <Pause size={Math.max(6, badge - 4)} strokeWidth={3} fill="currentColor" />
        </span>
      )}
    </span>
  );
}
