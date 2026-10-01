// Reglas de la agenda. Para bloquear un día u horas sueltas basta con crear un evento en Google Calendar:
// la disponibilidad descuenta todo lo que aparezca como ocupado.
export const RULES = {
  timezone: 'Europe/Madrid',
  /** Separación entre huecos: 15 min de llamada + 15 de margen. */
  slotMinutes: 30,
  /** Duración de la llamada (evento de Google Calendar y textos). */
  callMinutes: 15,
  /** 1 = lunes … 7 = domingo */
  weekdays: [1, 2, 3, 4, 5],
  dayStart: '15:00',
  dayEnd: '20:00',
  minNoticeHours: 12,
  horizonDays: 21,
  maxPerDay: 3,
};

export const env = (key: string) => process.env[key] ?? '';

/** URL pública para los enlaces de los emails (misma prioridad que scripts/site-url.mjs). */
export function siteUrl(request?: Request) {
  const explicit = env('SITE_URL');
  if (explicit) return explicit.replace(/\/$/, '');
  const vercel = env('VERCEL_PROJECT_PRODUCTION_URL');
  if (vercel) return `https://${vercel}`;
  return request ? new URL(request.url).origin : 'http://localhost:5173';
}
