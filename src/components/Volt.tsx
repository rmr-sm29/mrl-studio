import { useRef } from 'react';
import { volt } from '../content';
import { rel, usePinned, useSequence } from '../hooks';
import { STATIC_SIZES, VOLT_TEXT_THRESHOLDS, staticSrcset } from '../orbit';

/**
 * Secuencia anclada de 5 estados: 00 título · 01 V · 02 O · 03 L · 04 T + calendario + CTA.
 * Mismo solape vertical que el portfolio.
 *
 * Fondo: imagen estática a resolución completa, el mismo encuadre en escritorio y en móvil.
 */
export function Volt() {
  const ref = useRef<HTMLDivElement>(null);
  const pinned = usePinned();

  // Bloques de texto: intro 24 %, cada letra 19 % del recorrido.
  const { index: active, fast } = useSequence(ref, 5, pinned, { thresholds: VOLT_TEXT_THRESHOLDS });



  const state = (i: number) => ({
    'data-rel': pinned ? rel(i, active) : 'active',
    inert: pinned && active !== i,
  });

  return (
    <div
      id="metodo"
      ref={ref}
      className={`volt-orbit-driver seq volt ${pinned ? 'is-pinned' : 'is-stacked'} ${fast ? 'is-fast' : ''}`}
      data-volt-driver
      style={{ '--states': 5 } as React.CSSProperties}
    >
      <section className="orbit volt-orbit" aria-labelledby="metodo-title">
        <div className="orbit__media">
          <picture>
            <source type="image/avif" srcSet={staticSrcset('volt-static', 'avif')} sizes={STATIC_SIZES} />
            <source type="image/webp" srcSet={staticSrcset('volt-static', 'webp')} sizes={STATIC_SIZES} />
            <img
              className="orbit__image"
              src="/media/volt-static-1920.jpg"
              srcSet={staticSrcset('volt-static', 'jpg')}
              sizes={STATIC_SIZES}
              alt="Director de fotografía de pie en un plató entre dos focos encendidos"
              width={4046}
              height={2258}
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>

        {/* El hueco del header sobre la imagen se rellena con su propio borde superior en espejo: sin banda negra. */}
        <div className="orbit__bleed" aria-hidden="true">
          <picture>
            <source type="image/avif" srcSet={staticSrcset('volt-static', 'avif')} sizes={STATIC_SIZES} />
            <source type="image/webp" srcSet={staticSrcset('volt-static', 'webp')} sizes={STATIC_SIZES} />
            <img src="/media/volt-static-1920.jpg" srcSet={staticSrcset('volt-static', 'jpg')} sizes={STATIC_SIZES} alt="" loading="lazy" decoding="async" />
          </picture>
        </div>

        <div className="orbit__scrim" />

        <div className="orbit__content seq__stage">
        <div className="seq__state volt-intro" {...state(0)}>
          <div className="container">
            <h2 id="metodo-title" className="volt-intro__title">{volt.heading}</h2>
            <p className="volt-intro__steps">{volt.steps.map((s) => s.name).join(' · ')}</p>
          </div>
        </div>

        {volt.steps.map((s, i) => (
          <div key={s.key} className={`seq__state volt-step ${s.key === 'T' ? 'volt-step--last' : ''}`} {...state(i + 1)}>
            <div className="container volt-step__grid">
              <div>
                <p className="volt-step__letter" aria-hidden="true">{s.key}</p>
                <h3 className="volt-step__name">
                  <span className="sr-only">{s.key} · </span>
                  {s.name}
                </h3>
                <p className="volt-step__what">{s.what}</p>
              </div>
              <div className="volt-step__text">
                <p className="volt-step__body">{s.body}</p>
                <p className="volt-step__closing">
                  <span aria-hidden="true">→ </span>
                  {s.closing}
                </p>
                <p className="volt-step__out">
                  <span>Qué sale</span> {s.out}
                </p>
              </div>

              {s.key === 'T' && (
                <div className="volt-step__end">
                  <ol className="volt-cal" aria-label="Calendario de 7 días">
                    {volt.calendar.map((c) => (
                      <li key={c.day}>
                        <span className="volt-cal__day">{c.day}</span>
                        <span className="volt-cal__phase">{c.step}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="volt-step__foot">
                    <p className="volt-step__deal">{volt.closing}</p>
                    <a href="#agendar" className="btn btn--primary">Agendar</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        </div>
      </section>
    </div>
  );
}
