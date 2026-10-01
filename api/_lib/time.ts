// Conversión entre hora de pared de una zona (Europe/Madrid) y UTC sin dependencias, vía Intl.

type Parts = { year: number; month: number; day: number; hour: number; minute: number; weekday: number };

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function formatter(tz: string) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
    });
    fmtCache.set(tz, f);
  }
  return f;
}

const WEEKDAYS: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function zonedParts(date: Date, tz: string): Parts & { second: number } {
  const p = Object.fromEntries(formatter(tz).formatToParts(date).map((x) => [x.type, x.value]));
  return {
    year: +p.year,
    month: +p.month,
    day: +p.day,
    hour: +p.hour,
    minute: +p.minute,
    second: +p.second,
    weekday: WEEKDAYS[p.weekday],
  };
}

function offsetMs(date: Date, tz: string) {
  const p = zonedParts(date, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Hora de pared en `tz` → instante UTC. */
export function zonedToUtc(year: number, month: number, day: number, hour: number, minute: number, tz: string) {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const first = offsetMs(new Date(guess), tz);
  const second = offsetMs(new Date(guess - first), tz);
  return new Date(guess - second);
}

/** Clave de día "YYYY-MM-DD" en la zona indicada. */
export function dateKey(date: Date, tz: string) {
  const p = zonedParts(date, tz);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export const hhmm = (s: string) => s.split(':').map(Number) as [number, number];

/** "jueves, 2 de octubre · 16:00" en español y en la zona indicada. */
export function formatLong(date: Date, tz: string) {
  const day = new Intl.DateTimeFormat('es-ES', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  return `${day} · ${formatTime(date, tz)}`;
}

export const formatTime = (date: Date, tz: string) =>
  new Intl.DateTimeFormat('es-ES', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
