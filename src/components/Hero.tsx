import { useEffect, useRef } from 'react';
import { hero } from '../content';
import { useReducedMotion, useSequence } from '../hooks';
import { STATIC_SIZES, staticSrcset } from '../orbit';
import { Wordmark } from './Wordmark';

/**
 * Secuencia anclada de 3 estados: gancho · primera frase · VOLT/7 días + CTA.
 * Fondo: imagen estática a resolución completa, el mismo encuadre en escritorio y en móvil.
 */
export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // Reparto del recorrido ya validado: el mensaje 1 cede enseguida (12 %), el 2 se queda más de la mitad (12-70 %).
  const { index, fast } = useSequence(ref, 3, !reduced, { thresholds: [0.12, 0.7] });
  const shown = reduced ? 2 : index;

  // El header va siempre sobre imagen.
  useEffect(() => {
    document.documentElement.dataset.hero = 'image';
  }, []);

  return (
    <div id="top" ref={ref} className="hero-orbit-driver" data-hero-driver>
      <section
        className={`orbit hero-orbit hero ${reduced ? 'hero--static' : ''} ${fast ? 'is-fast' : ''}`}
        data-state={shown + 1}
        aria-labelledby="hero-title"
      >
        <div className="orbit__media">
          <picture>
            <source type="image/avif" srcSet={staticSrcset('hero-static', 'avif')} sizes={STATIC_SIZES} />
            <source type="image/webp" srcSet={staticSrcset('hero-static', 'webp')} sizes={STATIC_SIZES} />
            <img
              className="orbit__image"
              src="/media/hero-static-1920.jpg"
              srcSet={staticSrcset('hero-static', 'jpg')}
              sizes={STATIC_SIZES}
              alt="Director de fotografía sentado en un plató con dos focos encendidos"
              width={4046}
              height={2258}
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </div>

        <div className="orbit__scrim" />

        <div className="orbit__content">
          <div className="hero__copy">
            <div className="hero__lines">
              <p className="hero__hook" aria-hidden={shown !== 0}>
                {hero.hook}
              </p>
              {/* Un solo h1 estable en el DOM con las frases de los estados 2 y 3; la animación solo controla su visibilidad. */}
              <h1 id="hero-title" className="hero__h1">
                <span className="hero__line hero__line--2">{hero.line2}</span>{' '}
                <span className="hero__line hero__line--3">
                  Gracias a mi metodología <span className="accent">VOLT</span> en <span className="accent">7&nbsp;días</span>.
                </span>
              </h1>
            </div>
            {/* Firma: "by" + el logo del header, en el mismo gris monocromático de la firma */}
            <p className="hero__sig" aria-hidden="true">
              <span className="hero__by">by</span>
              <Wordmark />
            </p>
            <div className="hero__cta">
              <div className="hero__actions">
                <a href="#agendar" className="btn btn--primary" tabIndex={shown === 2 ? undefined : -1}>
                  Agendar
                </a>
                <a href="#trabajo" className="btn btn--ghost" tabIndex={shown === 2 ? undefined : -1}>
                  Ver portfolio
                </a>
              </div>
              <p className="hero__proof">{hero.proof}</p>
            </div>
          </div>

          <span className="hero__scroll" aria-hidden="true" />
        </div>
      </section>
    </div>
  );
}
