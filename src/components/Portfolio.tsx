import { useRef } from 'react';
import { portfolio } from '../content';
import { sizes, srcset } from '../media';
import { usePinned, useSequence } from '../hooks';
import { VideoPiece } from './VideoPiece';
import { Ficha } from './Ficha';

export const rel = (i: number, active: number) => (i === active ? 'active' : i < active ? 'past' : 'future');

function Picture({ base, widths, sizesAttr, w, h, className }: { base: string; widths: number[]; sizesAttr: string; w: number; h: number; className?: string }) {
  return (
    <picture>
      <source type="image/avif" srcSet={srcset(base, widths, 'avif')} sizes={sizesAttr} />
      <source type="image/webp" srcSet={srcset(base, widths, 'webp')} sizes={sizesAttr} />
      <img className={className} src={`/media/${base}-${widths[widths.length - 1]}.jpg`} srcSet={srcset(base, widths, 'jpg')} sizes={sizesAttr} width={w} height={h} alt="" loading="lazy" decoding="async" />
    </picture>
  );
}

/**
 * Secuencia anclada de 4 estados: 00 entrada · 01 cinematográfico · 02 UGC · 03 imagen de producto.
 * Transición de carrusel con solape (el saliente sube y se desvanece, el entrante llega desde abajo). Sin flash.
 * En móvil / tablet vertical / movimiento reducido: los cuatro bloques apilados a scroll normal.
 */
export function Portfolio() {
  const ref = useRef<HTMLElement>(null);
  const pinned = usePinned();
  const { index: active, fast } = useSequence(ref, 4, pinned);
  const { intro, cinematic, ugc, products } = portfolio;
  const isOn = (i: number) => (pinned ? active === i : undefined);

  return (
    <section id="trabajo" ref={ref} className={`seq portfolio ${pinned ? 'is-pinned' : 'is-stacked'} ${fast ? 'is-fast' : ''}`} style={{ '--states': 4 } as React.CSSProperties} aria-labelledby="trabajo-title">
      <div className="seq__stage">
        <p className="seq__numeral" aria-hidden="true">
          {['01', '02', '03'].map((n, i) => (
            <span key={n} data-rel={rel(i + 1, active)}>{n}</span>
          ))}
        </p>

        {/* 00 · Entrada (obligatoria: explica que todas las piezas son de la marca propia mrl.) */}
        <div className="seq__state pf-intro" data-rel={pinned ? rel(0, active) : 'active'} inert={pinned && active !== 0}>
          <div className="container">
            <p className="eyebrow">Trabajo</p>
            <h2 id="trabajo-title" className="pf-intro__title">{intro.heading}</h2>
            <ol className="pf-chain" aria-label="Proceso completo">
              {intro.chain.map((c, i) => (
                <li key={c} style={{ '--i': i } as React.CSSProperties}>
                  <span className="pf-chain__tag">{c}</span>
                  {i < intro.chain.length - 1 && <span className="pf-chain__arrow" aria-hidden="true">→</span>}
                </li>
              ))}
            </ol>
            <p className="pf-intro__body">
              Todas las piezas son de <strong className="nowrap">mrl.</strong>. {intro.body}
            </p>
          </div>
        </div>

        {/* 01 · Cinematográfico: vídeo a la izquierda, ficha a la derecha y la tira de tres fotogramas */}
        <div className="seq__state pf-cine" data-rel={pinned ? rel(1, active) : 'active'} inert={pinned && active !== 1}>
          <div className="container pf-cine__grid">
            <VideoPiece id={cinematic.video.id} meta={cinematic.video.meta} active={isOn(1)} caption={false} className="pf-cine__video" />
            <div className="pf-cine__side">
              <h3 className="portfolio-titulo">{cinematic.title}</h3>
              <Ficha meta={cinematic.video.meta} tech={cinematic.video.tech} />
              <ol className="pf-stills" aria-label="Fotogramas del spot">
                {cinematic.stills.map((s) => (
                  <li key={s.id}>
                    {/* Sin ningún tratamiento CSS: contraluz con negros levantados, cualquier filtro lo emborrona */}
                    <Picture base={s.id} widths={sizes.still} sizesAttr="(min-width: 1025px) 14vw, 30vw" w={1080} h={1920} className="pf-still" />
                    <span className="pf-stills__label">{s.label}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* 02 · UGC: dos vídeos (~60 %) y el avatar a ancho completo de su columna (~40 %) */}
        <div className="seq__state pf-ugc" data-rel={pinned ? rel(2, active) : 'active'} inert={pinned && active !== 2}>
          <div className="container">
            <h3 className="portfolio-titulo">{ugc.title}</h3>
            <div className="pf-ugc__grid">
              <div className="pf-ugc__videos">
                {ugc.videos.map((v) => (
                  <VideoPiece key={v.id} {...v} active={isOn(2)} />
                ))}
              </div>
              <div className="pf-ugc__avatar">
                <h4 className="avatar-titulo">{ugc.avatarLabel}</h4>
                <div className="piece__frame piece__frame--3x4">
                  <Picture base="avatar" widths={sizes.product} sizesAttr="(min-width: 768px) 300px, 100vw" w={1792} h={2400} />
                </div>
                <p className="pf-ugc__desc">{ugc.avatarDesc}</p>
              </div>
            </div>
            <p className="pf-ugc__reach">{ugc.reach}</p>
          </div>
        </div>

        {/* 03 · Imagen de producto: rejilla de tres 3:4 a la misma altura */}
        <div className="seq__state pf-products" data-rel={pinned ? rel(3, active) : 'active'} inert={pinned && active !== 3}>
          <div className="container">
            <h3 className="portfolio-titulo">{products.title}</h3>
            <div className="pf-products__grid">
              {products.items.map((p) => (
                <figure key={p.id} className="piece piece--image">
                  <div className="piece__frame piece__frame--3x4">
                    <Picture base={`product-${p.id}`} widths={sizes.product} sizesAttr="(min-width: 768px) 30vw, 100vw" w={1792} h={2400} />
                  </div>
                  <figcaption>
                    <Ficha meta={p.meta} tech={p.tech} />
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
