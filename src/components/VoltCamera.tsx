import { forwardRef } from 'react';
import manifest from '../volt-camera.json';

// Multiplicador del recorrido (brief §9: 1,2-1,3 si el despiece se queda corto). Con 1 las piezas terminan donde
// estaban en la foto original; más de 1 las separa aún más.
export const EXPLODE_FACTOR = 1;

/**
 * Despiece de cámara: cinco PNG apilados sobre grafito al ~22 % de opacidad, detrás del texto.
 * Posición absoluta por porcentaje sobre el lienzo 2752×1536; solo se anima la x, con una única variable --p (0-1):
 *   x = x_montada + assemble_dx × −p   →  p = 0 cámara montada, p = 1 despiece completo.
 * El cuerpo (dx = 0) no se mueve nunca: es el ancla de la composición.
 */
export const VoltCamera = forwardRef<HTMLDivElement>(function VoltCamera(_props, ref) {
  return (
    <div className="volt-cam" ref={ref} aria-hidden="true" style={{ '--k': EXPLODE_FACTOR } as React.CSSProperties}>
      {manifest.pieces.map((p) => {
        const base = `/media/volt-camera/${p.file.replace(/\.png$/, '')}`;
        return (
          <picture key={p.file}>
            <source type="image/webp" srcSet={`${base}.webp`} />
            <img
              src={`${base}.png`}
              alt=""
              decoding="async"
              loading="lazy"
              className="volt-cam__piece"
              style={
                {
                  left: `${p.x_pct + p.assemble_dx_pct}%`,
                  top: `${p.y_pct}%`,
                  width: `${p.w_pct}%`,
                  zIndex: p.z,
                  '--dx': p.assemble_dx_pct,
                } as React.CSSProperties
              }
            />
          </picture>
        );
      })}
    </div>
  );
});
