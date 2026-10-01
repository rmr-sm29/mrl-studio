import { sizes, srcset } from '../media';

const MOBILE = '(max-width: 767px), (max-width: 1024px) and (orientation: portrait)';

/**
 * Fondo del cierre: imagen estática del reloj (sin agujas, decisión del cliente).
 * Escritorio: 16:9. Móvil y tablet en vertical: recorte 9:16 centrado en el pin, a sangre.
 */
export function Clock() {
  return (
    <div className="clock" aria-hidden="true">
      <picture>
        <source media={MOBILE} type="image/avif" srcSet={srcset('clock-mobile', [540, 864], 'avif')} sizes="100vw" />
        <source media={MOBILE} type="image/webp" srcSet={srcset('clock-mobile', [540, 864], 'webp')} sizes="100vw" />
        <source media={MOBILE} srcSet={srcset('clock-mobile', [540, 864], 'jpg')} sizes="100vw" />
        <source type="image/avif" srcSet={srcset('clock-dial', sizes.dial, 'avif')} sizes="100vw" />
        <source type="image/webp" srcSet={srcset('clock-dial', sizes.dial, 'webp')} sizes="100vw" />
        <img className="clock__dial" src="/media/clock-dial-1920.jpg" alt="" loading="lazy" decoding="async" />
      </picture>
    </div>
  );
}
