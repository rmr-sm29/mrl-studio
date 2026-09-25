import { useCallback, useRef } from 'react';
import { closing } from '../content';
import { useReducedMotion, useSectionProgress } from '../hooks';
import { Booking } from './Booking';
import { Clock } from './Clock';

export function Closing() {
  const ref = useRef<HTMLElement>(null);
  const clockRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Agujas ligadas al scroll de la sección: 10:10 → 10:25, quince minutos exactos (lo que dura la llamada).
  const onProgress = useCallback((p: number) => {
    clockRef.current?.style.setProperty('--t', p.toFixed(4));
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
