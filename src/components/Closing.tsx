import { useCallback, useRef } from 'react';
import { closing } from '../content';
import { useReducedMotion, useSectionProgress } from '../hooks';
import { Booking } from './Booking';
import { Clock } from './Clock';

export function Closing() {
  const ref = useRef<HTMLElement>(null);
  const clockRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Agujas ligadas al progreso de scroll de la sección (no a un temporizador): 10:10 → 10:25, los quince minutos
  // de la llamada. Bajar las avanza en sentido horario y subir las retrocede.
  const onProgress = useCallback((p: number) => {
    const el = clockRef.current;
    if (!el) return;
    el.style.setProperty('--h', `${(305 + 7.5 * p).toFixed(3)}deg`);
    el.style.setProperty('--m', `${(60 + 90 * p).toFixed(3)}deg`);
  }, []);
  useSectionProgress(ref, !reduced, onProgress);

  return (
    <section id="agendar" ref={ref} className="section closing" aria-labelledby="agendar-title">
      <Clock ref={clockRef} />
      <div className="container closing__inner">
        <h2 id="agendar-title" className="closing__title">{closing.heading}</h2>
        <p className="closing__sub">{closing.sub}</p>
        <Booking />
        <p className="closing__below">{closing.below}</p>
      </div>
    </section>
  );
}
