import { useEffect, useRef, useState } from 'react';
import { problem } from '../content';
import { useReducedMotion } from '../hooks';

const fmt = (n: number) => n.toLocaleString('es-ES');
const DURATION = 1100;

function Counter({ from, to, suffix, t }: { from?: number; to: number; suffix: string; t: number }) {
  const final = `${from !== undefined ? `${fmt(from)}-` : ''}${fmt(to)}${suffix}`;
  const value = from !== undefined ? `${fmt(Math.round(from * t))}-${fmt(Math.round(to * t))}` : fmt(Math.round(to * t));
  return (
    <span className="stat__num">
      <span aria-hidden="true">
        {value}
        <span className="stat__unit">{suffix}</span>
      </span>
      <span className="sr-only">{final}</span>
    </span>
  );
}

/**
 * Los contadores se reinician cada vez que la sección entra en viewport desde fuera (brief v2 §8):
 * IntersectionObserver sin unobserve, se rearma solo cuando la sección sale del todo, y queda bloqueado mientras anima,
 * así los micro-scrolls dentro de la sección no los reinician.
 */
export function Problem() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [t, setT] = useState(reduced ? 1 : 0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) return setT(1);
    let armed = true;
    let running = false;
    let raf = 0;
    let ratio = 0;

    const run = () => {
      running = true;
      armed = false;
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min((now - start) / DURATION, 1);
        setT(1 - Math.pow(1 - p, 3));
        if (p < 1) raf = requestAnimationFrame(step);
        else {
          running = false;
          // Si la sección salió mientras animaba, se rearma ya para la próxima entrada.
          if (ratio === 0) {
            armed = true;
            setT(0);
          }
        }
      };
      raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        ratio = e.intersectionRatio;
        if (e.intersectionRatio === 0 && !running) {
          armed = true;
          setT(0);
        } else if (e.intersectionRatio >= 0.45 && armed && !running) {
          run();
        }
      },
      { threshold: [0, 0.45] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <section className="section problem" aria-labelledby="problema-title">
      <div className="container" ref={ref}>
        <h2 id="problema-title" className="section__title problem__title">{problem.heading}</h2>
        <div className="stats">
          {problem.stats.map((s) => (
            <div key={s.suffix} className="stat">
              <Counter {...s} t={t} />
              <p className="stat__text">{s.text}</p>
            </div>
          ))}
        </div>
        <p className="problem__closing">{problem.closing}</p>
      </div>
    </section>
  );
}
