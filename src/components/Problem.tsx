import { useEffect, useRef, useState } from 'react';
import { problem } from '../content';
import { useInViewOnce, useReducedMotion } from '../hooks';

const fmt = (n: number) => n.toLocaleString('es-ES');

function Counter({ from, to, suffix, run }: { from?: number; to: number; suffix: string; run: boolean }) {
  const reduced = useReducedMotion();
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!run) return;
    if (reduced) return setT(1);
    const start = performance.now();
    const dur = 1100;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setT(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run, reduced]);

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

export function Problem() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInViewOnce(ref, '0px 0px -25% 0px');

  return (
    <section className="section problem" aria-labelledby="problema-title">
      <div className="container">
        <h2 id="problema-title" className="section__title problem__title sd-rise">
          {problem.heading}
        </h2>
        <div className="stats" ref={ref}>
          {problem.stats.map((s) => (
            <div key={s.suffix} className="stat sd-rise">
              <Counter {...s} run={seen} />
              <p className="stat__text">{s.text}</p>
            </div>
          ))}
        </div>
        <p className="problem__closing sd-rise">{problem.closing}</p>
      </div>
    </section>
  );
}
