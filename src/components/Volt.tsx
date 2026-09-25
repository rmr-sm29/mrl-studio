import { useEffect, useRef, useState } from 'react';
import { volt, type VoltKey } from '../content';
import { useIsMobile } from '../hooks';
import { VoltVisual } from './VoltVisual';

export function Volt() {
  const sectionRef = useRef<HTMLElement>(null);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState<VoltKey>('V');
  const [inView, setInView] = useState(false);
  const isMobile = useIsMobile();

  // Paso activo: el que cruza la franja central del viewport.
  useEffect(() => {
    if (isMobile) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive((e.target as HTMLElement).dataset.key as VoltKey);
        });
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [isMobile]);

  // En esta pantalla solo las cuatro iniciales llevan ámbar: el punto del wordmark del header se apaga.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      setInView(e.isIntersecting);
      document.documentElement.toggleAttribute('data-accent-lock', e.isIntersecting);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      document.documentElement.removeAttribute('data-accent-lock');
    };
  }, []);

  return (
    <section id="metodo" ref={sectionRef} className="section volt" aria-labelledby="metodo-title">
      <div className="container">
        <header className="volt__head sd-rise">
          <h2 id="metodo-title" className="section__title">{volt.heading}</h2>
          <p className="volt__lede">{volt.lede}</p>
        </header>

        <div className="volt__layout">
          <ol className="volt__steps">
            {volt.steps.map((s, i) => (
              <li
                key={s.key}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                data-key={s.key}
                className={`volt-step ${!isMobile && active === s.key ? 'is-active' : ''}`}
              >
                <p className="volt-step__letter" aria-hidden="true">{s.key}</p>
                <h3 className="volt-step__name">
                  <span className="sr-only">{s.key} · </span>
                  {s.name}
                </h3>
                <p className="volt-step__what">{s.what}</p>
                <p className="volt-step__body">{s.body}</p>
                <p className="volt-step__closing">{s.closing}</p>
                <p className="volt-step__out">
                  <span>Qué sale</span> {s.out}
                </p>
                {isMobile && <VoltVisual state={s.key} play={s.key === 'T'} tall />}
              </li>
            ))}
          </ol>

          {!isMobile && (
            <div className="volt__pin">
              <VoltVisual state={active} play={inView} />
              <p className="volt__pin-caption" aria-hidden="true">
                {volt.steps.find((s) => s.key === active)?.key} · {volt.steps.find((s) => s.key === active)?.name}
              </p>
            </div>
          )}
        </div>

        <ol className="volt__calendar sd-rise" aria-label="Calendario de 7 días">
          {volt.calendar.map((c) => (
            <li key={c.day}>
              <span className="volt__day">{c.day}</span>
              <span className="volt__phase">{c.step}</span>
            </li>
          ))}
        </ol>

        <div className="volt__foot sd-rise">
          <p className="volt__closing">{volt.closing}</p>
          <a href="#agendar" className="btn btn--ghost">Agendar</a>
        </div>
      </div>
    </section>
  );
}
