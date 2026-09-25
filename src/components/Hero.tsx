import { useEffect, useRef, useState } from 'react';
import { hero } from '../content';
import { sizes, srcset } from '../media';
import { useReducedMotion, useSequence } from '../hooks';

// Móvil: recorte 9:16 servido como archivo aparte (brief §5), nunca object-fit sobre el 16:9.
const MOBILE = '(max-width: 767px), (max-width: 1024px) and (orientation: portrait)';
const FLASH_SWAP_MS = 80; // el cambio de estado ocurre dentro del pico blanco
const FLASH_TOTAL_MS = 460;

/**
 * Secuencia anclada de 3 estados.
 * 1 → beige liso + gancho · 2 → imagen + primera frase · 3 → misma imagen + VOLT/7 días + CTA.
 * El único flash de la web tapa el paso 1 ↔ 2: nunca se ve un fundido cruzado.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  // El paso 1 ↔ 2 lleva el flash: el estado siguiente espera a que el blanco se retire antes de contar su permanencia.
  const { index, fast } = useSequence(ref, 3, !reduced, {
    extraHold: (from, to) => ((from === 0) !== (to === 0) ? FLASH_TOTAL_MS - FLASH_SWAP_MS : 0),
  });
  const [shown, setShown] = useState(reduced ? 2 : 0);
  const [flashId, setFlashId] = useState(0);
  const [flashing, setFlashing] = useState(false);
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    if (reduced) {
      setShown(2);
      return;
    }
    const prev = shownRef.current;
    if (prev === index) return;
    const crossesFlash = (prev === 0) !== (index === 0);
    if (!crossesFlash) {
      setShown(index);
      return;
    }
    setFlashId((n) => n + 1);
    setFlashing(true);
    const t = window.setTimeout(() => setShown(index), FLASH_SWAP_MS);
    const end = window.setTimeout(() => setFlashing(false), FLASH_TOTAL_MS);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(end);
    };
  }, [index, reduced]);

  // El header cambia de tinta según la superficie: grafito sobre el beige, hueso sobre la imagen.
  useEffect(() => {
    document.documentElement.dataset.hero = shown === 0 ? 'light' : 'image';
  }, [shown]);

  return (
    <section
      id="top"
      ref={ref}
      className={`hero ${reduced ? 'hero--static' : ''} ${flashing ? 'is-flashing' : ''} ${fast ? 'is-fast' : ''} ${shown > 0 ? 'hero--revelado' : ''}`}
      data-state={shown + 1}
      aria-labelledby="hero-title"
    >
      <div className="hero__stage">
        <div className="hero__media">
          <picture>
            <source media={MOBILE} type="image/avif" srcSet={srcset('hero-mobile', sizes.heroMobile, 'avif')} sizes="100vw" />
            <source media={MOBILE} type="image/webp" srcSet={srcset('hero-mobile', sizes.heroMobile, 'webp')} sizes="100vw" />
            <source media={MOBILE} srcSet={srcset('hero-mobile', sizes.heroMobile, 'jpg')} sizes="100vw" />
            <source type="image/avif" srcSet={srcset('hero-desktop', sizes.heroDesktop, 'avif')} sizes="100vw" />
            <source type="image/webp" srcSet={srcset('hero-desktop', sizes.heroDesktop, 'webp')} sizes="100vw" />
            <img
              className="hero__img"
              src="/media/hero-desktop-1920.jpg"
              srcSet={srcset('hero-desktop', sizes.heroDesktop, 'jpg')}
              sizes="100vw"
              width={2752}
              height={1536}
              alt=""
              fetchPriority="high"
              decoding="async"
            />
          </picture>
          <div className="hero__scrim" aria-hidden="true" />
        </div>

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
          <p className="hero__sig" aria-hidden="true">
            mrl. studio
          </p>
          <div className="hero__cta">
            <div className="hero__actions">
              <a href="#agendar" className="btn btn--primary" tabIndex={shown === 2 ? undefined : -1}>
                Agendar
              </a>
              <a href="#trabajo" className="btn btn--ghost" tabIndex={shown === 2 ? undefined : -1}>
                Ver trabajo
              </a>
            </div>
            <p className="hero__proof">{hero.proof}</p>
          </div>
        </div>

        {flashId > 0 && <div key={flashId} className="hero__flash" aria-hidden="true" style={{ animationDuration: `${FLASH_TOTAL_MS}ms` }} />}
        <span className="hero__scroll" aria-hidden="true" />
      </div>
    </section>
  );
}
