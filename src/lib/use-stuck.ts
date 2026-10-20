import { useEffect, useState } from 'react';

/**
 * Detects when a sticky header has stuck: pass the returned callback ref to a 1px
 * sentinel right before the sticky element. Once the sentinel scrolls out of view
 * (it's clipped by the scroll container), `stuck` turns true. A callback ref so it
 * re-attaches when the sentinel element changes (e.g. switching steps).
 */
export function useStuck<T extends Element = HTMLDivElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [el]);

  return [setEl, el ? stuck : false, el] as const;
}

/** Smoothly scroll the nearest scrollable ancestor of `el` back to the top. */
export function scrollToTop(el: Element | null) {
  let node = el?.parentElement ?? null;
  while (node && !/(auto|scroll)/.test(getComputedStyle(node).overflowY)) node = node.parentElement;
  node?.scrollTo({ top: 0, behavior: 'smooth' });
}
