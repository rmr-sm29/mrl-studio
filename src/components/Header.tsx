import { useEffect, useState } from 'react';
import { nav } from '../content';
import { Wordmark } from './Wordmark';

export function Header() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`header ${solid ? 'is-solid' : ''}`}>
      <div className="header__inner">
        <a href="#top" className="header__brand" aria-label="mrl. studio, volver al inicio">
          <Wordmark />
        </a>
        <nav className="header__nav" aria-label="Principal">
          {nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a href="#agendar" className="btn btn--primary btn--sm">
          Agendar
        </a>
      </div>
    </header>
  );
}
