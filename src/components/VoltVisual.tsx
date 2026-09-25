import { useEffect, useRef, useState } from 'react';
import { volt, type VoltKey } from '../content';
import { useReducedMotion } from '../hooks';

type Props = { state: VoltKey; play: boolean; tall?: boolean };

// Una sola pieza en bucle y cuatro estados conseguidos con capas CSS encima (brief §9).
// Mientras no exista el vídeo, se muestra una maqueta cenital hecha con CSS con la misma geometría:
// el "monitor" ocupa la caja .volt-visual__screen, que es donde actúan las capas V y O.
export function VoltVisual({ state, play, tall = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (play && !reduced) el.play().catch(() => {});
    else el.pause();
  }, [play, reduced]);

  const base = tall ? '/media/volt-4x5' : '/media/volt';

  return (
    <div className={`volt-visual ${tall ? 'volt-visual--tall sd-grow' : ''}`} data-state={state} aria-hidden="true">
      <div className="volt-visual__scene">
        {volt.hasVideo ? (
          <video ref={videoRef} muted loop playsInline preload="none" poster={`${base}-poster.jpg`}>
            <source src={`${base}.webm`} type="video/webm" />
            <source src={`${base}.mp4`} type="video/mp4" />
          </video>
        ) : (
          <div className="desk">
            <div className="desk__sheet" />
            <div className="desk__print desk__print--1" />
            <div className="desk__print desk__print--2" />
            <div className="desk__print desk__print--3" />
            <div className="desk__monitor" />
            <div className="desk__beam" />
          </div>
        )}
      </div>
      <div className="volt-visual__dark" />
      <div className="volt-visual__amber" />
      <div className="volt-visual__screen">
        <Script active={state === 'V'} />
        <div className="volt-visual__grid">
          <span /><span /><span /><span />
        </div>
      </div>
    </div>
  );
}

function Script({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const full = volt.scriptLines.join('\n');
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (reduced) return setN(full.length);
    setN(0);
    const id = window.setInterval(() => {
      setN((c) => {
        if (c >= full.length) {
          window.clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, 28);
    return () => window.clearInterval(id);
  }, [active, reduced, full.length]);

  return (
    <pre className="volt-visual__script">
      {full.slice(0, n)}
      <span className="caret" />
    </pre>
  );
}
