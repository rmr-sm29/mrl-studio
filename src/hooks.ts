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


// Dónde se ancla VOLT: escritorio y tablet en horizontal. En vertical se degrada a scroll apilado.
export const PIN_QUERY = '(min-width: 1025px), (min-width: 768px) and (orientation: landscape)';
export function usePinned() {
  const wide = useMedia(PIN_QUERY);
  const reduced = useReducedMotion();
  return wide && !reduced;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export const MIN_DWELL_MS = 220; // permanencia mínima por estado (brief v3 · B)

type SequenceOptions = {
  onProgress?: (p: number) => void;
  /** Permanencia extra para una transición concreta (p. ej. el flash del hero). */
  extraHold?: (from: number, to: number) => number;
  /**
   * Umbrales de progreso (0-1) en los que empieza cada estado a partir del segundo. Permiten dar más recorrido de
   * scroll a un estado concreto. Por defecto, reparto uniforme: cada estado ocupa el mismo tramo.
   */
  thresholds?: number[];
};

/**
 * Secuencia anclada: la sección mide (n estados) y su escenario interior es `position: sticky`.
 * El scroll es nativo y la página nunca se mueve sola (sin snap): cada bloque aparece cuando el scroll llega a su tramo.
 * El progreso continuo 0-1 se entrega por callback (sin re-render por frame).
 *
 * No se pueden saltar estados (brief v3 · B): el estado mostrado avanza como mucho uno por transición y permanece al menos
 * 220 ms; si quedan pasos en cola, la transición se acelera (`fast`).
 */
export function useSequence(ref: RefObject<HTMLElement | null>, count: number, enabled: boolean, opts: SequenceOptions = {}) {
  const [index, setIndex] = useState(0);
  const [fast, setFast] = useState(false);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) {
      setIndex(0);
      setFast(false);
      return;
    }
    let current = 0;
    let target = 0;
    let lastChange = 0;
    let holdUntil = 0;
    let timer = 0;
    let raf = 0;

    const stateAt = (p: number) => {
      const th = optsRef.current.thresholds ?? Array.from({ length: count - 1 }, (_, i) => (i + 1) / count);
      let k = 0;
      while (k < th.length && p >= th[k]) k++;
      return k;
    };

    const pump = (queued: boolean) => {
      timer = 0;
      if (current === target) {
        setFast(false);
        return;
      }
      const now = performance.now();
      const wait = Math.max(lastChange + MIN_DWELL_MS, holdUntil) - now;
      if (wait > 0) {
        timer = window.setTimeout(() => pump(true), wait);
        return;
      }
      const from = current;
      current += Math.sign(target - current); // el paso nunca supera 1
      lastChange = now;
      holdUntil = now + (optsRef.current.extraHold?.(from, current) ?? 0);
      setFast(queued || current !== target);
      setIndex(current);
      if (current !== target) timer = window.setTimeout(() => pump(true), Math.max(MIN_DWELL_MS, holdUntil - now));
    };

    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const travel = el.offsetHeight - window.innerHeight;
      const p = travel > 0 ? clamp01(-rect.top / travel) : 0;
      optsRef.current.onProgress?.(p);
      target = stateAt(p);
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
        // Fuera de pantalla (p. ej. al saltar con el enlace "Método") no hay nada que dibujar: se salta directo.
        window.clearTimeout(timer);
        timer = 0;
        current = target;
        setIndex(current);
        setFast(false);
        return;
      }
      if (!timer) pump(false);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref, count, enabled]);

  return { index, fast };
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

/** Posición de un estado respecto al activo en una secuencia anclada. */
export const rel = (i: number, active: number) => (i === active ? 'active' : i < active ? 'past' : 'future');
