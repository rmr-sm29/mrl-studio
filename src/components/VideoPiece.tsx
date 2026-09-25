import { useEffect, useRef, useState } from 'react';
import { video } from '../media';
import { useIsMobile, useReducedMotion } from '../hooks';

type Props = { id: string; title: string; desc: string; featured?: boolean; headingLevel?: 'h3' | 'h4' };

// Al activar el sonido de un vídeo, el resto se silencia.
const UNMUTE_EVENT = 'mrl:unmute';

export function VideoPiece({ id, title, desc, featured = false, headingLevel: H = 'h3' }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const manual = isMobile || reduced; // sin autoplay: póster + play bajo demanda
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const src = video(id);

  // Escritorio: autoplay silenciado en bucle cuando supera el 50 % de viewport; pausa al salir.
  useEffect(() => {
    const el = ref.current;
    if (!el || manual) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [manual]);

  useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id && ref.current) {
        ref.current.muted = true;
        setMuted(true);
      }
    };
    window.addEventListener(UNMUTE_EVENT, onOther);
    return () => window.removeEventListener(UNMUTE_EVENT, onOther);
  }, [id]);

  const toggleSound = () => {
    const el = ref.current;
    if (!el) return;
    const next = !el.muted;
    el.muted = next;
    setMuted(next);
    if (!next) {
      window.dispatchEvent(new CustomEvent(UNMUTE_EVENT, { detail: id }));
      if (el.paused) el.play().catch(() => {});
    }
  };

  const togglePlay = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  return (
    <figure className={`piece piece--video ${featured ? 'piece--featured' : ''}`}>
      <div className="piece__frame piece__frame--9x16 sd-grow">
        <video
          ref={ref}
          muted
          loop
          playsInline
          preload="none"
          poster={src.poster}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          aria-label={title}
        >
          <source src={src.webm} type="video/webm" />
          <source src={src.mp4} type="video/mp4" />
        </video>
        {manual && (
          <button type="button" className={`piece__play ${playing ? 'is-playing' : ''}`} onClick={togglePlay} aria-label={playing ? `Pausar: ${title}` : `Reproducir: ${title}`}>
            <span aria-hidden="true">{playing ? <PauseIcon /> : <PlayIcon />}</span>
          </button>
        )}
        <button type="button" className="piece__sound" onClick={toggleSound} aria-pressed={!muted} aria-label={muted ? 'Activar sonido' : 'Silenciar'}>
          {muted ? <MutedIcon /> : <SoundIcon />}
        </button>
      </div>
      <figcaption className="ficha sd-rise">
        <H className="ficha__title">{title}</H>
        {desc && <p className="ficha__desc">{desc}</p>}
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
const MutedIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
    <path d="M16.5 9.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const SoundIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
  </svg>
);
