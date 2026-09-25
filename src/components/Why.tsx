import { useRef } from 'react';
import { why } from '../content';
import { useInViewOnce } from '../hooks';

function Item({ n, title, text, index }: { n: string; title: string; text: string; index: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const seen = useInViewOnce(ref);
  return (
    <li ref={ref} className={`why__item reveal ${seen ? 'is-in' : ''}`} style={{ transitionDelay: `${(index % 2) * 90}ms` }}>
      <span className="why__n" aria-hidden="true">{n}</span>
      <div>
        <h3 className="why__title">{title}</h3>
        <p className="why__text">{text}</p>
      </div>
    </li>
  );
}

export function Why() {
  return (
    <section className="section why" aria-labelledby="why-title">
      <div className="container why__layout">
        <h2 id="why-title" className="section__title why__heading">{why.heading}</h2>
        <ol className="why__list">
          {why.items.map((it, i) => (
            <Item key={it.n} {...it} index={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}
