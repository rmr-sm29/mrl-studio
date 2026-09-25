import { useEffect, useRef, useState } from 'react';
import { hero } from '../content';
import { heroSizes, srcset } from '../media';
import { useIsMobile } from '../hooks';

// Mismo criterio que el CSS y el preload de index.html: móvil y tablet en vertical usan el recorte 4:5.
const STACKED = '(max-width: 767px), (max-width: 1024px) and (orientation: portrait)';

export function Hero() {
  const imgRef = useRef<HTMLImageElement>(null);
  const [lit, setLit] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();

  // Flash de entrada: una sola vez, cuando la imagen está lista. Si tarda, el texto no espera más de 600 ms.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) setLit(true);
    const t = window.setTimeout(() => setLit(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 4) {
        setScrolled(true);
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section id="top" className={`hero ${lit ? 'is-lit' : ''}`} aria-labelledby="hero-title">
      <div className="hero__media">
        <picture>
          <source media={STACKED} type="image/avif" srcSet={srcset('hero-4x5', heroSizes.tall, 'avif')} sizes="100vw" />
          <source media={STACKED} type="image/webp" srcSet={srcset('hero-4x5', heroSizes.tall, 'webp')} sizes="100vw" />
          <source media={STACKED} srcSet={srcset('hero-4x5', heroSizes.tall, 'jpg')} sizes="100vw" />
          <source type="image/avif" srcSet={srcset('hero-16x9', heroSizes.wide, 'avif')} sizes="100vw" />
          <source type="image/webp" srcSet={srcset('hero-16x9', heroSizes.wide, 'webp')} sizes="100vw" />
          <img
            ref={imgRef}
            className="hero__img"
            src="/media/hero-16x9-1920.jpg"
            srcSet={srcset('hero-16x9', heroSizes.wide, 'jpg')}
            sizes="100vw"
            width={2752}
            height={1536}
            alt=""
            fetchPriority="high"
            decoding="async"
            onLoad={() => setLit(true)}
          />
        </picture>
        {hero.hasLoop && !isMobile && (
          <video className="hero__loop" autoPlay muted loop playsInline preload="none" poster="/media/hero-16x9-1920.jpg" aria-hidden="true">
            <source src="/media/hero-loop.webm" type="video/webm" />
            <source src="/media/hero-loop.mp4" type="video/mp4" />
          </video>
        )}
        <div className="hero__vignette" aria-hidden="true" />
      </div>

      <div className="hero__content">
        <p className="kicker">{hero.kicker}</p>
        <h1 id="hero-title" className="hero__title">
          <span className="only-desktop">
            Anuncios de <strong>alta producción y UGC</strong> todos los meses, sin esperar <strong>tres semanas</strong> ni
            apostarlo todo a <strong>una sola creatividad</strong>, gracias a mi metodología <strong className="accent">VOLT</strong>{' '}
            en <strong className="accent">7&nbsp;días</strong>.
          </span>
          <span className="only-mobile">
            Anuncios de <strong>alta producción y UGC</strong> todos los meses, sin esperas ni apuestas a{' '}
            <strong>una sola creatividad</strong>. Metodología <strong className="accent">VOLT</strong>,{' '}
            <strong className="accent">7&nbsp;días</strong>.
          </span>
        </h1>
        <p className="hero__sub">
          {hero.sub}
          <span className="only-desktop">{hero.subRest}</span>
        </p>
        <div className="hero__actions">
          <a href="#agendar" className="btn btn--primary">
            Agendar
          </a>
          <a href="#trabajo" className="btn btn--ghost">
            Ver trabajo
          </a>
        </div>
        <p className="hero__proof only-desktop">{hero.proof.join(' · ')}</p>
        <p className="hero__proof only-mobile">{hero.proofMobile.join(' · ')}</p>
      </div>

      <span className={`hero__scroll ${scrolled ? 'is-hidden' : ''}`} aria-hidden="true" />
    </section>
  );
}
