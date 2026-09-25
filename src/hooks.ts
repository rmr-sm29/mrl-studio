import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';

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

// Móvil a efectos del brief: pantalla estrecha o puntero táctil. Sin autoplay de vídeo.
export const useIsMobile = () => useMedia('(max-width: 767px), (hover: none) and (pointer: coarse)');

// Dónde se anclan portfolio y VOLT: escritorio y tablet en horizontal. En vertical se degrada a scroll apilado.
export const PIN_QUERY = '(min-width: 1025px), (min-width: 768px) and (orientation: landscape)';
export function usePinned() {
  const wide = useMedia(PIN_QUERY);
  const reduced = useReducedMotion();
  return wide && !reduced;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Secuencia anclada: la sección mide (n estados) y su escenario interior es `position: sticky`.
 * Devuelve el estado activo; el progreso continuo 0-1 se entrega por callback (sin re-render por frame).
 * El scroll es nativo: cada estado responde directamente a la rueda, sin inercia añadida.
 */
export function useSequence(
  ref: RefObject<HTMLElement | null>,
  count: number,
  enabled: boolean,
  onProgress?: (p: number) => void,
) {
  const [index, setIndex] = useState(0);
  const cb = useRef(onProgress);
  cb.current = onProgress;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) {
      setIndex(0);
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const travel = el.offsetHeight - window.innerHeight;
      const p = travel > 0 ? clamp01(-rect.top / travel) : 0;
      setIndex(Math.min(count - 1, Math.floor(p * count)));
      cb.current?.(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref, count, enabled]);

  return index;
}

/** Progreso 0-1 de una sección de scroll normal: 0 cuando su borde superior pasa del 75 % del viewport, 1 cuando su borde inferior llega al fondo. */
export function useSectionProgress(ref: RefObject<HTMLElement | null>, enabled: boolean, onProgress: (p: number) => void) {
  const cb = useRef(onProgress);
  cb.current = onProgress;
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.75;
      const span = Math.max(rect.height - (vh - start), 1);
      cb.current(clamp01((start - rect.top) / span));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref, enabled]);
}

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
