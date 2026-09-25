import { useRef } from 'react';
import { why } from '../content';
import { useInViewOnce } from '../hooks';

export function Why() {
  const ref = useRef<HTMLOListElement>(null);
  const seen = useInViewOnce(ref, '0px 0px -20% 0px');
  return (
    <section className="section why" aria-labelledby="why-title">
      <div className="container">
        <h2 id="why-title" className="section__title why__heading">{why.heading}</h2>
        {/* Entrada escalonada en diagonal: 60 ms entre puntos; el numeral va 100 ms por detrás de su texto */}
        <ol ref={ref} className={`why__grid ${seen ? 'is-in' : ''}`}>
          {why.items.map((it, i) => (
            <li key={it.n} className="why__item" style={{ '--d': `${i * 60}ms` } as React.CSSProperties}>
              <span className="why__n" aria-hidden="true">{it.n}</span>
              <div className="why__body">
                <h3 className="why__title">{it.title}</h3>
                <p className="why__text">{it.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
