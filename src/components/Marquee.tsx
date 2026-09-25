import { useEffect, useRef } from 'react';
import { capabilities } from '../content';
import { useReducedMotion } from '../hooks';

const BASE_SPEED = 0.35; // px por frame a 60 fps
const SCROLL_GAIN = 0.12;

export function Marquee() {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const track = trackRef.current;
    if (!track || reduced) return;

    let x = 0;
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
      if (dy !== 0) dir = dy > 0 ? 1 : -1;
      boost = Math.min(boost + Math.abs(dy) * SCROLL_GAIN, 30);
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;
      if (visible) {
        const half = track.scrollWidth / 2;
        x -= (BASE_SPEED + boost) * dir * dt;
        if (x <= -half) x += half;
        if (x > 0) x -= half;
        track.style.transform = `translate3d(${x}px,0,0)`;
      }
      boost *= 0.92;
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(track);
    window.addEventListener('scroll', onScroll, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [reduced]);

  const row = (hidden: boolean) => (
    <ul className="marquee__row" aria-hidden={hidden || undefined}>
      {capabilities.map((c) => (
        <li key={c}>
          {c}
          <span className="marquee__sep" aria-hidden="true">·</span>
        </li>
      ))}
    </ul>
  );

  return (
    <section className="marquee" aria-label="Capacidades">
      <div className="marquee__track" ref={trackRef}>
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}
