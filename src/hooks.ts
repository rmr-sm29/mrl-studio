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


// Dónde se anclan portfolio y VOLT: escritorio y tablet en horizontal. En vertical se degrada a scroll apilado.
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
};

/**
 * Secuencia anclada: la sección mide (n estados) y su escenario interior es `position: sticky`.
 * El scroll es nativo; el progreso continuo 0-1 se entrega por callback (sin re-render por frame).
 *
 * Máquina de estados que no puede saltarse estados (brief v3 · B): el objetivo sale del progreso y puede saltar,
 * pero el estado mostrado avanza como mucho uno por transición, permanece al menos 220 ms y, si quedan pasos en
 * cola, la transición se acelera (`fast`). Al soltar el scroll, la secuencia asienta en el estado más cercano (snap 1/(n−1)).
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
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let current = 0;
    let target = 0;
    let lastChange = 0;
    let holdUntil = 0;
    let timer = 0;
    let raf = 0;
    let snapTimer = 0;
    let touching = false;

    const metrics = () => {
      const rect = el.getBoundingClientRect();
      const travel = el.offsetHeight - window.innerHeight;
      const p = travel > 0 ? clamp01(-rect.top / travel) : 0;
      const onScreen = rect.bottom > 0 && rect.top < window.innerHeight;
      return { rect, travel, p, onScreen };
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
      const { p, onScreen } = metrics();
      optsRef.current.onProgress?.(p);
      target = Math.round(p * (count - 1));
      if (!onScreen) {
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

    // Snap: al terminar el gesto, asentar en un estado (p = k/(n−1)) y no quedarse a medio camino.
    const snap = () => {
      if (touching) return;
      const { rect, travel, p } = metrics();
      if (travel <= 0 || p <= 0 || p >= 1) return;
      const k = Math.round(p * (count - 1));
      const goal = k / (count - 1);
      if (Math.abs(goal - p) * travel < 4) return;
      window.scrollTo({ top: window.scrollY + rect.top + goal * travel, behavior: reduced ? 'auto' : 'smooth' });
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(snap, 160); // equivalente a scrollend, también en navegadores sin ese evento
    };

    const onTouchStart = () => {
      touching = true;
      window.clearTimeout(snapTimer);
    };
    const onTouchEnd = () => {
      touching = false;
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(snap, 160);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.clearTimeout(snapTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [ref, count, enabled]);

  return { index, fast };
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
