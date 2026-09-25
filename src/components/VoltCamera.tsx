import { forwardRef } from 'react';

// Multiplicador del recorrido (brief v2 §9: 1,2-1,3 si el despiece se queda corto).
export const EXPLODE_FACTOR = 1;

// Posiciones de despiece (x, y, ancho) y desplazamiento de montaje dx, todo en % del lienzo 2752×1536 (brief v3 · F).
// Ojo: el parasol es 22,711 %; un 18,35 en algún manifest es un valor antiguo.
const PIECES = [
  { file: '01-parasol', x: 8.576, y: 36.849, w: 14.135, dx: 22.711, z: 50 },
  { file: '02-objetivo', x: 23.401, y: 37.695, w: 14.462, dx: 13.081, z: 40 },
  { file: '03-cuerpo', x: 37.427, y: 36.979, w: 24.273, dx: 0, z: 30 },
  { file: '04-monitor', x: 61.264, y: 40.039, w: 15.443, dx: -15.988, z: 20 },
  { file: '05-empunadura', x: 88.045, y: 36.003, w: 7.703, dx: -26.853, z: 10 },
];

/**
 * Despiece de cámara: cinco PNG con transparencia al 13 % detrás del texto.
 * Cada pieza va en un envoltorio que ocupa el contenedor entero, para que el % de dx se resuelva contra el ancho
 * del lienzo y no contra el de la propia imagen (brief v3 · F: ese era el fallo de la empuñadura).
 *   translateX(dx × (1 − p))  →  p = 0 cámara montada, p = 1 despiece completo. El cuerpo (dx = 0) no se mueve.
 */
export const VoltCamera = forwardRef<HTMLDivElement>(function VoltCamera(_props, ref) {
  return (
    <div className="volt-camara" ref={ref} aria-hidden="true" style={{ '--p': 0, '--k': EXPLODE_FACTOR } as React.CSSProperties}>
      {PIECES.map((p) => {
        const base = `/media/volt-camera/${p.file}`;
        return (
          <div key={p.file} className="pieza-wrap" style={{ '--dx': `${p.dx}%`, zIndex: p.z } as React.CSSProperties}>
            <picture>
              <source type="image/webp" srcSet={`${base}.webp`} />
              <img
                src={`${base}.png`}
                alt=""
                decoding="async"
                loading="lazy"
                style={{ '--x': `${p.x}%`, '--y': `${p.y}%`, '--w': `${p.w}%` } as React.CSSProperties}
              />
            </picture>
          </div>
        );
      })}
    </div>
  );
});
