import { Fragment, useEffect, useRef } from 'react';
import { marquee } from '../content';
import { useReducedMotion } from '../hooks';

const SCROLL_GAIN = 0.12;

type RowProps = { terms: string[]; thumbs: string[]; trackRef: React.RefObject<HTMLDivElement | null> };

// Tira mixta: término · miniatura · término… Los separadores (punto medio ámbar) son el único acento de la franja.
function Row({ terms, thumbs, trackRef }: RowProps) {
  const set = (hidden: boolean, offset: number) => (
    <ul className="marquee__row" aria-hidden={hidden || undefined}>
      {/* Cada mitad repite la lista dos veces para cubrir pantallas anchas sin hueco en el bucle */}
      {[...terms, ...terms].map((t, i) => (
        <Fragment key={i}>
          <li className="marquee__term">{t}</li>
          <li className="marquee__sep" aria-hidden="true" style={{ animationDelay: `${-((i + offset) * 0.7) % 2.8}s` }} />
          <li className="marquee__thumb" aria-hidden="true">
            <img src={`/media/thumbs/${thumbs[i % thumbs.length]}.webp`} alt="" width={34} height={60} loading="lazy" decoding="async" />
          </li>
          <li className="marquee__sep" aria-hidden="true" style={{ animationDelay: `${-((i + offset) * 0.7 + 0.35) % 2.8}s` }} />
        </Fragment>
      ))}
    </ul>
  );
  return (
    <div className="marquee__track" ref={trackRef}>
      {set(false, 0)}
      {set(true, 2)}
    </div>
  );
}

export function Marquee() {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const top = topRef.current;
    const bottom = bottomRef.current;
    if (!top || !bottom || reduced) return;

    // Fila superior hacia la izquierda, inferior hacia la derecha, a velocidades ligeramente distintas.
    const rows = [
      { el: top, x: 0, speed: 0.34, sign: -1 },
      { el: bottom, x: 0, speed: 0.27, sign: 1 },
    ];
    let dir = 1;
    let boost = 0;
    let lastY = window.scrollY;
    let visible = true;
    let raf = 0;
    let last = performance.now();

    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      if (dy !== 0) dir = dy > 0 ? 1 : -1; // al scrollear hacia arriba, ambas filas invierten su sentido
      boost = Math.min(boost + Math.abs(dy) * SCROLL_GAIN, 28);
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;
      if (visible) {
        for (const r of rows) {
          const half = r.el.scrollWidth / 2;
          r.x += (r.speed + boost * r.speed * 2.4) * r.sign * dir * dt;
          if (r.x <= -half) r.x += half;
          if (r.x > 0) r.x -= half;
          r.el.style.transform = `translate3d(${r.x}px,0,0)`;
        }
      }
      boost *= 0.92;
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(top);
    window.addEventListener('scroll', onScroll, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [reduced]);

  return (
    <section className="marquee" aria-label="Capacidades">
      <Row terms={marquee.top} thumbs={marquee.thumbsTop} trackRef={topRef} />
      <Row terms={marquee.bottom} thumbs={marquee.thumbsBottom} trackRef={bottomRef} />
    </section>
  );
}
