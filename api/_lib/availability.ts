import { RULES } from './config.js';
import { sql } from './db.js';
import { freeBusy, type Interval } from './google.js';
import { dateKey, formatTime, hhmm, zonedParts, zonedToUtc } from './time.js';

export type Day = { date: string; slots: { start: string; label: string }[] };

/** Huecos candidatos según las reglas (sin mirar calendario ni reservas). */
function candidates(now: Date) {
  const tz = RULES.timezone;
  const step = RULES.slotMinutes * 60_000;
  const earliest = now.getTime() + RULES.minNoticeHours * 3_600_000;
  const today = zonedParts(now, tz);
  const [sh, sm] = hhmm(RULES.dayStart);
  const [eh, em] = hhmm(RULES.dayEnd);

  const days: { date: string; starts: Date[] }[] = [];
  for (let i = 0; i < RULES.horizonDays; i++) {
    const d = new Date(Date.UTC(today.year, today.month - 1, today.day + i));
    const [y, m, day] = [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
    const weekday = d.getUTCDay() || 7;
    const date = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const starts: Date[] = [];
    if (RULES.weekdays.includes(weekday)) {
      const open = zonedToUtc(y, m, day, sh, sm, tz).getTime();
      const close = zonedToUtc(y, m, day, eh, em, tz).getTime();
      for (let t = open; t + step <= close; t += step) if (t >= earliest) starts.push(new Date(t));
    }
    days.push({ date, starts });
  }
  return days;
}

/**
 * Disponibilidad real: reglas − franjas ocupadas en Google Calendar − reservas confirmadas − días completos.
 * `excludeId` deja fuera una reserva (al cambiarla de hora no cuenta para el tope diario).
 */
export async function availability(now = new Date(), excludeId?: string): Promise<Day[]> {
  const days = candidates(now);
  const all = days.flatMap((d) => d.starts);
  if (!all.length) return days.map((d) => ({ date: d.date, slots: [] }));

  const step = RULES.slotMinutes * 60_000;
  const from = all[0];
  const to = new Date(all[all.length - 1].getTime() + step);

  const [busy, rows] = await Promise.all([
    freeBusy(from, to),
    sql()`select id, starts_at, ends_at from bookings
          where status = 'confirmed' and starts_at < ${to.toISOString()} and ends_at > ${from.toISOString()}`,
  ]) as [Interval[], { id: string; starts_at: string; ends_at: string }[]];

  const booked: Interval[] = [];
  const perDay = new Map<string, number>();
  for (const r of rows) {
    if (r.id === excludeId) continue;
    const s = new Date(r.starts_at);
    booked.push({ start: s.getTime(), end: new Date(r.ends_at).getTime() });
    const k = dateKey(s, RULES.timezone);
    perDay.set(k, (perDay.get(k) ?? 0) + 1);
  }
  // Las reservas propias también están en Google; se suman por si el evento aún no se ha creado o se borró a mano.
  const blocked = [...busy, ...booked];

  return days.map(({ date, starts }) => {
    if ((perDay.get(date) ?? 0) >= RULES.maxPerDay) return { date, slots: [] };
    const slots = starts
      .filter((s) => {
        const a = s.getTime();
        const b = a + step;
        return !blocked.some((x) => a < x.end && x.start < b);
      })
      .map((s) => ({ start: s.toISOString(), label: formatTime(s, RULES.timezone) }));
    return { date, slots };
  });
}

/** ¿Sigue libre este hueco exacto? */
export async function isAvailable(start: Date, excludeId?: string) {
  const days = await availability(new Date(), excludeId);
  const iso = start.toISOString();
  return days.some((d) => d.slots.some((s) => s.start === iso));
}
