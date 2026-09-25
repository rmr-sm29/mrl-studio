import { useId, useState } from 'react';
import { faq } from '../content';

export function Faq() {
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));
  const uid = useId();

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <section id="faq" className="section faq" aria-labelledby="faq-title">
      <div className="container faq__layout">
        <h2 id="faq-title" className="section__title sd-rise">Preguntas frecuentes</h2>
        <div className="faq__list sd-rise">
          {faq.map((item, i) => {
            const isOpen = open.has(i);
            const btn = `${uid}-q${i}`;
            const panel = `${uid}-a${i}`;
            return (
              <div key={item.q} className={`faq__item ${isOpen ? 'is-open' : ''}`}>
                <h3 className="faq__q">
                  <button id={btn} type="button" aria-expanded={isOpen} aria-controls={panel} onClick={() => toggle(i)}>
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
