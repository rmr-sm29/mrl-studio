import { useEffect, useState } from 'react';
import { nav } from '../content';
import { Wordmark } from './Wordmark';

export function Header() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    // Transparente mientras dura la secuencia del hero; sólido con sombra a partir de ahí.
    const onScroll = () => {
      const hero = document.getElementById('top');
      const end = hero ? hero.offsetTop + hero.offsetHeight - window.innerHeight : 0;
      setSolid(window.scrollY > Math.max(end, 8));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
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
