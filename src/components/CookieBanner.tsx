import { setConsent, useBannerOpen } from '../consent';

export function CookieBanner() {
  const open = useBannerOpen();
  if (!open) return null;
  return (
    <div className="cookie" role="dialog" aria-live="polite" aria-label="Preferencias de cookies">
      <p>
        Solo usamos almacenamiento técnico para recordar tu elección. El calendario de reservas es de un tercero y usa sus
        propias cookies: solo se carga si aceptas. <a href="/cookies">Política de cookies</a>.
      </p>
      <div className="cookie__actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConsent('rejected')}>
          Rechazar
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConsent('accepted')}>
          Aceptar
        </button>
      </div>
    </div>
  );
}
