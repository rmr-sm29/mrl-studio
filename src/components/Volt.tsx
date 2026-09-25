import { useCallback, useEffect, useRef, useState } from 'react';
import { volt } from '../content';
import { useInViewOnce, usePinned, useReducedMotion, useSequence } from '../hooks';
import { rel } from './Portfolio';
import { VoltCamera } from './VoltCamera';

/**
 * Secuencia anclada de 5 estados: 00 título · 01 V · 02 O · 03 L · 04 T + calendario + CTA.
 * Mismo solape vertical que el portfolio. El despiece de la cámara es continuo y va ligado al progreso de toda la secuencia.
 */
export function Volt() {
  const ref = useRef<HTMLElement>(null);
  const camRef = useRef<HTMLDivElement>(null);
  const pinned = usePinned();
  const reduced = useReducedMotion();

  const onProgress = useCallback((p: number) => {
    // El estado 00 arranca exactamente en --p: 0 (brief v3 · F, prueba 2)
    camRef.current?.style.setProperty('--p', p < 0.0005 ? '0' : p.toFixed(4));
  }, []);
  const { index: active, fast } = useSequence(ref, 5, pinned, { onProgress });

  // Sin anclaje: las piezas se separan en una animación corta al entrar la sección. Con movimiento reducido: despiece completo, quieto.
  const seen = useInViewOnce(ref, '0px 0px -30% 0px');
  useEffect(() => {
    if (pinned) return;
    camRef.current?.style.setProperty('--p', reduced || seen ? '1' : '0');
  }, [pinned, reduced, seen]);

  // En esta pantalla solo las cuatro iniciales llevan ámbar: el punto del wordmark del header se apaga.
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '-10% 0px -10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    document.documentElement.toggleAttribute('data-accent-lock', inView);
    return () => document.documentElement.removeAttribute('data-accent-lock');
  }, [inView]);

  const state = (i: number) => ({
    'data-rel': pinned ? rel(i, active) : 'active',
    inert: pinned && active !== i,
  });

  return (
    <section id="metodo" ref={ref} className={`seq volt ${pinned ? 'is-pinned' : 'is-stacked'} ${fast ? 'is-fast' : ''}`} style={{ '--states': 5 } as React.CSSProperties} aria-labelledby="metodo-title">
      <div className="seq__stage">
        <div className={`volt__bg ${pinned ? '' : 'is-animated'}`}>
          <VoltCamera ref={camRef} />
        </div>

        <div className="seq__state volt-intro" {...state(0)}>
          <div className="container">
            <h2 id="metodo-title" className="volt-intro__title">{volt.heading}</h2>
            <p className="volt-intro__steps">{volt.steps.map((s) => s.name).join(' · ')}</p>
          </div>
        </div>

        {volt.steps.map((s, i) => (
          <div key={s.key} className={`seq__state volt-step ${s.key === 'T' ? 'volt-step--last' : ''}`} {...state(i + 1)}>
            <div className="container volt-step__grid">
              <div>
                <p className="volt-step__letter" aria-hidden="true">{s.key}</p>
                <h3 className="volt-step__name">
                  <span className="sr-only">{s.key} · </span>
                  {s.name}
                </h3>
                <p className="volt-step__what">{s.what}</p>
              </div>
              <div className="volt-step__text">
                <p className="volt-step__body">{s.body}</p>
                <p className="volt-step__closing">
                  <span aria-hidden="true">→ </span>
                  {s.closing}
                </p>
                <p className="volt-step__out">
                  <span>Qué sale</span> {s.out}
                </p>
              </div>

              {s.key === 'T' && (
                <div className="volt-step__end">
                  <ol className="volt-cal" aria-label="Calendario de 7 días">
                    {volt.calendar.map((c) => (
                      <li key={c.day}>
                        <span className="volt-cal__day">{c.day}</span>
                        <span className="volt-cal__phase">{c.step}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="volt-step__foot">
                    <p className="volt-step__deal">{volt.closing}</p>
                    <a href="#agendar" className="btn btn--primary">Agendar</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
