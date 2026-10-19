import { Sparkles } from 'lucide-react';
import type { Actor } from '../data/deal';
import { cn } from '@/lib/utils';

/**
 * Actor → colour mapping. Minimal treatment: outlined (stroke) accents on a
 * transparent/dark background rather than filled tints.
 */
export const actorStyle: Record<Actor, { fg: string; border: string; label: string }> = {
  atlas: { fg: 'text-atlas', border: 'border-atlas/40', label: 'Atlas · AI' },
  system: { fg: 'text-muted', border: 'border-line', label: 'System' },
  you: { fg: 'text-ink', border: 'border-line-strong', label: 'Varun Reddy' },
  customer: { fg: 'text-ink', border: 'border-line-strong', label: 'Customer' },
};

export function Avatar({
  initials,
  actor,
  size = 36,
}: {
  initials: string;
  actor: Actor;
  size?: number;
}) {
  const s = actorStyle[actor];
  const isAgent = actor === 'atlas';
  return (
    <div
      className={cn('grid shrink-0 place-items-center rounded-full border bg-transparent font-semibold', s.border, s.fg)}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={s.label}
    >
      {isAgent ? <Sparkles size={Math.round(size * 0.5)} /> : initials}
    </div>
  );
}

export function Chip({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'atlas' | 'danger' | 'success';
}) {
  // Outlined chips — colour lives in the stroke + text, never a fill.
  const tones: Record<string, string> = {
    neutral: 'border-line text-muted',
    brand: 'border-brand/40 text-brand',
    atlas: 'border-atlas/40 text-atlas',
    danger: 'border-danger/40 text-danger',
    success: 'border-success/40 text-success',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border bg-transparent px-2 py-0.5 text-[10px] font-medium tracking-[0.02em]',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/* 3-bar temperature signal — Hot = 3 green, Warm = 1 amber, Cold = 1 blue. */
export function TempSignal({ temperature }: { temperature: 'Hot' | 'Warm' | 'Cold' }) {
  const config = {
    Hot: { active: 3, color: 'var(--color-hot)' },
    Warm: { active: 1, color: 'var(--color-warm)' },
    Cold: { active: 1, color: 'var(--color-cold)' },
  }[temperature];
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex items-end gap-[3px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[5px] rounded-[1px]"
            style={{
              height: 7 + i * 3,
              background: i < config.active ? config.color : 'var(--color-line-strong)',
            }}
          />
        ))}
      </span>
      <span className="text-[14px] font-semibold text-ink">{temperature}</span>
    </span>
  );
}
