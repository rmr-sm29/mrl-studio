import { portfolio } from '../content';
import { productSizes, srcset } from '../media';
import { VideoPiece } from './VideoPiece';

export function Portfolio() {
  return (
    <section id="trabajo" className="section portfolio" aria-labelledby="trabajo-title">
      <div className="container">
        <h2 id="trabajo-title" className="eyebrow">Trabajo</h2>
        <p className="portfolio__intro sd-rise">
          Todas las piezas son de <span className="nowrap">mrl.</span>, {portfolio.intro}
        </p>
      </div>

      <div className="portfolio__featured">
        <div className="container">
          <VideoPiece {...portfolio.cinematic} featured />
        </div>
      </div>

      <div className="container portfolio__block">
        <h3 className="block-label sd-rise">UGC</h3>
        <div className="grid grid--2">
          {portfolio.ugc.map((p) => (
            <VideoPiece key={p.id} {...p} headingLevel="h4" />
          ))}
        </div>
      </div>

      <div className="container portfolio__block">
        <h3 className="block-label sd-rise">Imagen de producto</h3>
        <div className="grid grid--3">
          {portfolio.products.map((p) => (
            <figure key={p.id} className={`piece piece--image piece--${p.id}`}>
              <div className="piece__frame piece__frame--3x4 sd-grow">
                <picture>
                  <source type="image/avif" srcSet={srcset(`product-${p.id}`, productSizes, 'avif')} sizes="(max-width: 767px) 100vw, 33vw" />
                  <source type="image/webp" srcSet={srcset(`product-${p.id}`, productSizes, 'webp')} sizes="(max-width: 767px) 100vw, 33vw" />
                  <img
                    src={`/media/product-${p.id}-1000.jpg`}
                    srcSet={srcset(`product-${p.id}`, productSizes, 'jpg')}
                    sizes="(max-width: 767px) 100vw, 33vw"
                    width={1792}
                    height={2400}
                    alt={p.desc}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
              </div>
              <figcaption className="ficha sd-rise">
                <h4 className="ficha__title">{p.title}</h4>
                <p className="ficha__desc">{p.desc}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
