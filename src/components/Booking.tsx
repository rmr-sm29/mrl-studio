import { useEffect, useRef } from 'react';
import { site } from '../content';
import { setConsent, useConsent } from '../consent';

declare global {
  interface Window {
    Cal?: ((...args: unknown[]) => void) & { ns: Record<string, (...args: unknown[]) => void>; loaded?: boolean; q?: unknown[] };
  }
}

const PROVIDER_NAME = { cal: 'Cal.com', tidycal: 'TidyCal' } as const;

// Snippet oficial de embed inline de Cal.com, cargado bajo demanda.
function loadCal() {
  if (window.Cal) return;
  /* eslint-disable */
  (function (C: any, A: string, L: string) {
    const p = function (a: any, ar: any) { a.q.push(ar); };
    const d = C.document;
    C.Cal = C.Cal || function () {
      const cal = C.Cal; const ar = arguments;
      if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; }
      if (ar[0] === L) {
        const api: any = function () { p(api, arguments); };
        const namespace = ar[1]; api.q = api.q || [];
        if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); }
        else p(cal, ar);
        return;
      }
      p(cal, ar);
    };
  })(window, 'https://app.cal.com/embed/embed.js', 'init');
  /* eslint-enable */
}

export function Booking() {
  const consent = useConsent();
  const ref = useRef<HTMLDivElement>(null);
  const { provider, path } = site.booking;
  const ready = consent === 'accepted' && !!path;

  useEffect(() => {
    if (!ready || !ref.current) return;
    if (provider === 'cal') {
      loadCal();
      const Cal = window.Cal!;
      Cal('init', 'mrl', { origin: 'https://app.cal.com' });
      Cal.ns.mrl('inline', { elementOrSelector: '#cal-inline', calLink: path, config: { layout: 'month_view', theme: 'dark' } });
      Cal.ns.mrl('ui', {
        theme: 'dark',
        hideEventTypeDetails: false,
        layout: 'month_view',
        cssVarsPerTheme: { dark: { 'cal-brand': '#F4F1EA' } },
      });
    } else {
      const s = document.createElement('script');
      s.src = 'https://asset-tidycal.com/js/embed.js';
      s.async = true;
      document.body.appendChild(s);
    }
  }, [ready, provider, path]);

  if (!path) {
    return (
      <div className="booking booking--notice sd-rise" role="note">
        <p>Calendario pendiente de configurar.</p>
        <p className="muted">Define <code>VITE_BOOKING_PROVIDER</code> y <code>VITE_BOOKING_PATH</code> en Vercel.</p>
      </div>
    );
  }

  if (consent !== 'accepted') {
    return (
      <div className="booking booking--notice sd-rise">
        <p>
          El calendario lo sirve {PROVIDER_NAME[provider]}, que usa sus propias cookies. Para mostrarlo aquí necesitamos tu
          consentimiento.
        </p>
        <button type="button" className="btn btn--primary" onClick={() => setConsent('accepted')}>
          Cargar calendario
        </button>
        <p className="muted small">
          Más información en la <a href="/cookies">política de cookies</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="booking sd-rise" ref={ref}>
      {provider === 'cal' ? <div id="cal-inline" className="booking__frame" /> : <div className="tidycal-embed booking__frame" data-path={path} />}
    </div>
  );
}
