import { useEffect, useRef, useState, type ReactNode } from 'react';
import { portfolio, site } from '../content';
import { portfolioImg } from '../media';
import { useInViewOnce } from '../hooks';
import { VideoPiece } from './VideoPiece';
import { Ficha } from './Ficha';

const { intro, cine, ugc, studio, avatars, campaigns } = portfolio;

const BLOCKS = [
  { id: 'pf-cine', label: cine.nav },
  { id: 'pf-ugc', label: ugc.nav },
  { id: 'pf-estudio', label: studio.nav },
  { id: 'pf-avatares', label: avatars.nav },
  { id: 'pf-campanas', label: campaigns.nav },
];

/** true mientras el bloque esté en pantalla: solo se reproducen los vídeos del bloque visible. */
function useVisible<T extends Element>(ref: React.RefObject<T | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return visible;
}

/** Bloque del portfolio: número + título, el trabajo y, debajo, la línea de argumento. */
function Block({
  id,
  n,
  title,
  line,
  className,
  children,
}: {
  id: string;
  n: string;
  title: string;
  line: ReactNode;
  className: string;
  children: (visible: boolean) => ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const seen = useInViewOnce(ref, '0px 0px -12% 0px');
  const visible = useVisible(ref);
  return (
    <section id={id} ref={ref} className={`pf-block ${className} ${seen ? 'is-in' : ''}`} aria-labelledby={`${id}-title`}>
      <div className="container">
        <h3 id={`${id}-title`} className="portfolio-titulo">
          <span className="pf-block__n" aria-hidden="true">{n}</span>
          {title}
        </h3>
      </div>
      {children(visible)}
      <div className="container">
        <p className="pf-line">{line}</p>
      </div>
    </section>
  );
}

const stagger = (i: number) => ({ '--i': i }) as React.CSSProperties;

function Img({ id, alt, w, h }: { id: string; alt: string; w: number; h: number }) {
  return <img src={portfolioImg(id)} alt={alt} width={w} height={h} loading="lazy" decoding="async" />;
}

/** Barra de accesos rápidos: pegajosa dentro de la sección, marca el bloque activo. */
function QuickNav() {
  const [active, setActive] = useState(BLOCKS[0].id);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    BLOCKS.forEach((b) => {
      const el = document.getElementById(b.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  // En móvil la barra scrollea en horizontal: lleva el acceso activo a la vista sin mover la página.
  useEffect(() => {
    const list = listRef.current;
    const link = list?.querySelector<HTMLElement>(`[href="#${active}"]`);
    if (!list || !link || list.scrollWidth <= list.clientWidth) return;
    const target = link.offsetLeft - (list.clientWidth - link.offsetWidth) / 2;
    list.scrollTo({ left: target, behavior: 'smooth' });
  }, [active]);

  return (
    <nav className="pf-nav" aria-label="Bloques del portfolio">
      <ul ref={listRef} className="pf-nav__list">
        {BLOCKS.map((b) => (
          <li key={b.id}>
            <a href={`#${b.id}`} className="pf-nav__link" aria-current={active === b.id ? 'true' : undefined}>
              {b.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Parche 3: portfolio a scroll continuo, cinco bloques con ritmo alterno y barra de accesos rápidos.
 * El fondo de plató sigue anclado al viewport (sticky de altura 0, primer hijo).
 */
export function Portfolio() {
  return (
    <section id="trabajo" className="portfolio portfolio-bg" aria-labelledby="trabajo-title">
      <div className="portfolio-bg__backdrop" aria-hidden="true">
        <div className="portfolio-bg__frame">
          <img
            className="portfolio-bg__image"
            src="/media/portfolio/portfolio-bg-desktop.webp"
            srcSet="/media/portfolio/portfolio-bg-mobile.webp 900w, /media/portfolio/portfolio-bg-tablet.webp 1400w, /media/portfolio/portfolio-bg-desktop.webp 2400w"
            sizes="100vw"
            alt=""
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <header className="container pf-intro">
        <p className="eyebrow">Trabajo</p>
        <h2 id="trabajo-title" className="pf-intro__title">{intro.heading}</h2>
        <p className="pf-intro__body">{intro.body}</p>
      </header>

      <QuickNav />

      <Block id="pf-cine" n="01" title={cine.title} line={cine.line} className="pf-cine">
        {(visible) => (
          <div className="container pf-cine__grid">
            {cine.videos.map((v, i) => (
              <div key={v.id} className="pf-reveal" style={stagger(i)}>
                <VideoPiece {...v} active={visible} />
              </div>
            ))}
          </div>
        )}
      </Block>

      <Block
        id="pf-ugc"
        n="02"
        title={ugc.title}
        className="pf-ugc"
        line={
          <>
            {ugc.line}{' '}
            <a href={site.instagramUrl} target="_blank" rel="noopener">
              {ugc.lineLink}
            </a>
          </>
        }
      >
        {(visible) => (
          <div className="container pf-ugc__grid">
            {ugc.videos.map((v, i) => (
              <div key={v.id} className="pf-reveal" style={stagger(i)}>
                <VideoPiece {...v} active={visible} />
              </div>
            ))}
          </div>
        )}
      </Block>

      <Block id="pf-estudio" n="03" title={studio.title} line={studio.line} className="pf-studio">
        {() => (
          <div className="pf-studio__grid">
            {studio.items.map((p, i) => (
              <figure key={p.id} className="piece piece--image pf-reveal" style={stagger(i)}>
                <div className="piece__frame piece__frame--3x4">
                  <Img id={p.id} alt={p.alt} w={1200} h={1607} />
                </div>
                <figcaption>
                  <Ficha meta={p.meta} tech={p.tech} />
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Block>

      <Block id="pf-avatares" n="04" title={avatars.title} line={avatars.line} className="pf-avatars">
        {() => (
          <div className="container">
            <ol className="pf-avatars__grid" aria-label="Hoja de casting">
              {avatars.items.map((a, i) => (
                <li key={a.id} className="pf-reveal" style={stagger(i)}>
                  <div className="piece__frame piece__frame--3x4 avatar">
                    <Img id={a.id} alt={a.alt} w={900} h={1200} />
                  </div>
                  <span className="pf-avatars__n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Block>

      <Block id="pf-campanas" n="05" title={campaigns.title} line={campaigns.line} className="pf-campaigns">
        {() => (
          <div className="container pf-campaigns__list">
            {campaigns.items.map((c) => (
              <figure key={c.id} className="pf-campaign">
                <ol className="pf-campaign__grid" aria-label={`Campaña ${c.name}`}>
                  {c.alts.map((alt, i) => (
                    <li key={i} className="pf-reveal" style={stagger(i)}>
                      <div className="piece__frame piece__frame--3x4">
                        <Img id={`${c.id}-0${i + 1}`} alt={alt} w={1200} h={1607} />
                      </div>
                    </li>
                  ))}
                </ol>
                <figcaption className="pf-campaign__caption">
                  <strong>{c.name}</strong> · {c.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Block>
    </section>
  );
}
