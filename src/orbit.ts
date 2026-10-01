import { srcset } from './media';

/** Umbrales de texto de VOLT (inicio de V, O, L y T): intro 24 %, cada letra 19 % del recorrido. */
export const VOLT_TEXT_THRESHOLDS = [0.24, 0.43, 0.62, 0.81];

/** Anchos de las imágenes estáticas del hero y de VOLT (npm run assets). */
export const STATIC_WIDTHS = [1280, 1920, 2752, 4046];
/**
 * La imagen cubre la pantalla (object-fit: cover). En vertical se recorta a lo ancho y se pinta a ~1,79 veces la
 * altura de la pantalla: `sizes` lo declara para que el móvil descargue la versión grande y se vea nítida.
 */
export const STATIC_SIZES = '(max-aspect-ratio: 16/9) 179vh, 100vw';
export const staticSrcset = (base: string, ext: string) => srcset(base, STATIC_WIDTHS, ext);
