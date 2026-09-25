import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react';

function mediaStore(query: string) {
  return {
    subscribe(cb: () => void) {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    get: () => window.matchMedia(query).matches,
  };
}

export function useMedia(query: string) {
  const [store] = useState(() => mediaStore(query));
  return useSyncExternalStore(store.subscribe, store.get, () => false);
}

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)');

// Móvil a efectos del brief: pantalla estrecha o puntero táctil. Sin autoplay, sin pin.
export const useIsMobile = () => useMedia('(max-width: 767px), (hover: none) and (pointer: coarse)');

/** true la primera vez que el elemento entra en viewport (y se queda en true). */
export function useInViewOnce<T extends Element>(ref: RefObject<T | null>, rootMargin = '0px 0px -15% 0px') {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, seen]);
  return seen;
}
