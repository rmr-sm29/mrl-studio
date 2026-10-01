import { useEffect, useRef, useState } from 'react';
import { portfolioVideo } from '../media';
import { useReducedMotion } from '../hooks';
import { Ficha } from './Ficha';

type Props = {
  id: string;
  meta: string;
  tech?: string;
  alt: string;
  /** Lo controla el bloque: solo se reproducen los vídeos del bloque visible. */
  active: boolean;
};

/**
 * Parche 3: vídeos sin pista de audio. Autoplay silenciado con póster; si el navegador rechaza play()
 * (Modo de Bajo Consumo de iOS, ahorro de datos) o hay movimiento reducido, botón de play sobre el póster.
 */
export function VideoPiece({ id, meta, tech, alt, active }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [blocked, setBlocked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const manual = reduced || blocked;
  const src = portfolioVideo(id);

  // iOS solo permite el autoplay si el vídeo está silenciado como atributo, no solo como propiedad: React no pinta el
  // atributo `muted`, así que se fija a mano antes del primer play().
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    el.setAttribute('muted', '');
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (active && !manual) {
      const start = () =>
        el.play().catch((err: DOMException) => {
          // AbortError = un pause() posterior interrumpió la carga; no es un bloqueo.
          if (err?.name === 'NotAllowedError') setBlocked(true);
        });
      start();
      // Con preload="metadata", iOS a veces rechaza el primer play() antes de tener datos: se reintenta al poder reproducir.
      el.addEventListener('canplay', start, { once: true });
      return () => el.removeEventListener('canplay', start);
    } else if (!active) {
      el.pause();
      if (el.currentTime > 0) el.currentTime = 0;
    }
  }, [active, manual]);

  const togglePlay = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  return (
    <figure className="piece piece--video">
      <div className="piece__frame piece__frame--9x16">
        <video
          ref={ref}
          muted
          loop
          playsInline
          preload="metadata"
          poster={src.poster}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          aria-label={alt}
          tabIndex={-1}
        >
          <source src={src.webm} type='video/webm; codecs="vp9"' />
          <source src={src.mp4} type="video/mp4" />
        </video>
        {manual && (
          <button
            type="button"
            className={`piece__play ${playing ? 'is-playing' : ''}`}
            onClick={togglePlay}
            aria-label={playing ? `Pausar: ${alt}` : `Reproducir: ${alt}`}
          >
            <span aria-hidden="true">{playing ? <PauseIcon /> : <PlayIcon />}</span>
          </button>
        )}
      </div>
      <figcaption>
        <Ficha meta={meta} tech={tech} />
      </figcaption>
    </figure>
  );
}

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
);
