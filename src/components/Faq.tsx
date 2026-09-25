import { useId, useRef, useState } from 'react';
import { faq } from '../content';
import { useInViewOnce } from '../hooks';

export function Faq() {
  // Cierre automático: solo una abierta a la vez (la primera, al cargar).
  const [open, setOpen] = useState<number | null>(0);
  const uid = useId();
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInViewOnce(ref, '0px 0px -10% 0px');

  return (
    <section id="faq" className="section faq" aria-labelledby="faq-title">
      <div className="faq__inner">
        <h2 id="faq-title" className="section__title faq__title">Preguntas frecuentes</h2>
        <div ref={ref} className={`faq__list ${seen ? 'is-in' : ''}`}>
          {faq.map((item, i) => {
            const isOpen = open === i;
            const btn = `${uid}-q${i}`;
            const panel = `${uid}-a${i}`;
            return (
              <div key={item.q} className={`faq__item ${isOpen ? 'is-open' : ''}`} style={{ '--d': `${i * 40}ms` } as React.CSSProperties}>
                <h3 className="faq__q">
                  <button id={btn} type="button" aria-expanded={isOpen} aria-controls={panel} onClick={() => setOpen(isOpen ? null : i)}>
                    <span>{item.q}</span>
                    <span className="faq__icon" aria-hidden="true" />
                  </button>
                </h3>
                <div id={panel} role="region" aria-labelledby={btn} className="faq__panel" inert={!isOpen}>
                  <div className="faq__panel-inner">
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
