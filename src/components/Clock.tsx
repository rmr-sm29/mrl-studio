import { forwardRef, useState } from 'react';
import { sizes, srcset } from '../media';

/**
 * Reloj de fondo del cierre. Esfera fotográfica sin agujas + agujas en SVG sobre un plano inclinado
 * que reproduce el escorzo de la esfera (61°, eje mayor rotado −5,6°, pivote en 48,5 % / 50,6 %).
 * El giro lo controlan --h y --m, que escribe el cierre según su scroll: 10:10 → 10:25.
 */
export const Clock = forwardRef<HTMLDivElement>(function Clock(_props, ref) {
  const [dialOk, setDialOk] = useState(true);
  return (
    <div className={`clock ${dialOk ? '' : 'clock--fallback'}`} ref={ref} aria-hidden="true">
      {dialOk && (
        <picture>
          <source type="image/avif" srcSet={srcset('clock-dial', sizes.dial, 'avif')} sizes="100vw" />
          <source type="image/webp" srcSet={srcset('clock-dial', sizes.dial, 'webp')} sizes="100vw" />
          <img className="clock__dial" src="/media/clock-dial-1920.jpg" alt="" loading="lazy" decoding="async" onError={() => setDialOk(false)} />
        </picture>
      )}
      <div className="reloj-agujas">
        {/* Esfera provisional mientras no exista la foto (assets-src/clock-dial.jpeg) */}
        {!dialOk && (
          <svg className="clock__ring" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="100" cy="100" r="86" fill="none" stroke="currentColor" strokeWidth="0.5" />
            {Array.from({ length: 60 }, (_, i) => (
              <line key={i} x1="100" y1={i % 5 ? 5 : 3} x2="100" y2={i % 5 ? 10 : 16} stroke="currentColor" strokeWidth={i % 5 ? 0.6 : 2} transform={`rotate(${i * 6} 100 100)`} />
            ))}
          </svg>
        )}
        {/* Brief v3 · G: horaria más corta y ancha, minutera más larga y fina (≤ 75 % del radio). Sin segundero. */}
        <svg viewBox="0 0 200 200">
          <path className="horaria" d="M100 100 L96.5 54 L100 47 L103.5 54 Z" />
          <path className="minutera" d="M100 100 L98 33 L100 26 L102 33 Z" />
        </svg>
      </div>
    </div>
  );
});
