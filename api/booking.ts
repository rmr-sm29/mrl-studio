// Gestión de una reserva desde el enlace firmado del email (/reserva?id=…&t=…).
// GET  /api/booking?id&t                      → datos de la reserva
// POST /api/booking { id, t, action: 'cancel' }
// POST /api/booking { id, t, action: 'reschedule', startsAt }
import { isAvailable } from './_lib/availability.js';
import { RULES, siteUrl } from './_lib/config.js';
import { getBooking, isUniqueViolation, sql, type BookingRow } from './_lib/db.js';
import { notifyAdmin, sendCancelled, sendRescheduled } from './_lib/email.js';
import { cancelEvent, moveEvent } from './_lib/google.js';
import { fail, json, manageUrl, sameOrigin, UUID, verifyBooking } from './_lib/http.js';
import { formatLong } from './_lib/time.js';

async function load(id: unknown, t: unknown) {
  if (typeof id !== 'string' || !UUID.test(id) || typeof t !== 'string' || !verifyBooking(id, t)) return null;
  return getBooking(id);
}

const view = (b: BookingRow) => {
  const start = new Date(b.starts_at);
  return {
    status: b.status,
    startsAt: start.toISOString(),
    when: formatLong(start, RULES.timezone),
    firstName: b.name.trim().split(/\s+/)[0],
    meetUrl: b.status === 'confirmed' ? b.meet_url : null,
    past: start.getTime() <= Date.now(),
  };
};

const mailOf = (b: BookingRow, request: Request, start = new Date(b.starts_at), meetUrl = b.meet_url) => ({
  name: b.name,
  email: b.email,
  company: b.company,
  phone: b.phone,
  website: b.website,
  goal: b.goal,
  start,
  meetUrl,
  manageUrl: manageUrl(b.id, request),
});

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  try {
    const b = await load(q.get('id'), q.get('t'));
    if (!b) return fail(404, 'No encontramos esta reserva. Revisa el enlace del email.');
    return json(view(b));
  } catch (e) {
    console.error('[booking] get', (e as Error).message);
    return fail(503, 'No hemos podido cargar la reserva.');
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail(403, 'Origen no permitido.');
  let body: { id?: string; t?: string; action?: string; startsAt?: string };
  try {
    body = await request.json();
  } catch {
    return fail(400, 'Solicitud no válida.');
  }

  const b = await load(body.id, body.t).catch(() => null);
  if (!b) return fail(404, 'No encontramos esta reserva. Revisa el enlace del email.');
  if (b.status !== 'confirmed') return fail(409, 'Esta reserva ya está cancelada.');
  if (new Date(b.starts_at).getTime() <= Date.now()) return fail(409, 'Esta llamada ya ha pasado.');
  const db = sql();

  if (body.action === 'cancel') {
    try {
      await db`update bookings set status = 'cancelled', cancelled_at = now(), updated_at = now() where id = ${b.id}`;
      if (b.google_event_id) await cancelEvent(b.google_event_id).catch((e) => console.error('[booking] cancel google', e.message));
    } catch (e) {
      console.error('[booking] cancel', (e as Error).message);
      return fail(500, 'No hemos podido cancelar la reserva. Inténtalo de nuevo.');
    }
    const mail = mailOf(b, request);
    await Promise.all([sendCancelled(mail, siteUrl(request)), notifyAdmin('cancelada', mail)]);
    return json({ ...view({ ...b, status: 'cancelled' }) });
  }

  if (body.action === 'reschedule') {
    const start = new Date(String(body.startsAt));
    if (Number.isNaN(start.getTime())) return fail(422, 'Elige un hueco.');
    const end = new Date(start.getTime() + RULES.callMinutes * 60_000);
    try {
      if (!(await isAvailable(start, b.id))) return fail(409, 'Ese hueco acaba de ocuparse. Elige otro, por favor.', { code: 'slot_taken' });
      await db`update bookings set starts_at = ${start.toISOString()}, ends_at = ${end.toISOString()},
        reminder_sent_at = null, updated_at = now() where id = ${b.id}`;
    } catch (e) {
      if (isUniqueViolation(e)) return fail(409, 'Ese hueco acaba de ocuparse. Elige otro, por favor.', { code: 'slot_taken' });
      console.error('[booking] reschedule', (e as Error).message);
      return fail(503, 'No hemos podido cambiar la hora. Inténtalo de nuevo.');
    }

    let meetUrl = b.meet_url;
    if (b.google_event_id) {
      try {
        meetUrl = (await moveEvent(b.google_event_id, start, end)).meetUrl ?? meetUrl;
      } catch (e) {
        // Se devuelve la reserva a su hora original para no desincronizar base de datos y calendario.
        console.error('[booking] move google', (e as Error).message);
        await db`update bookings set starts_at = ${b.starts_at}, ends_at = ${b.ends_at}, updated_at = now() where id = ${b.id}`;
        return fail(502, 'No hemos podido mover la llamada en el calendario. Inténtalo de nuevo en unos minutos.');
      }
    }

    const mail = mailOf(b, request, start, meetUrl);
    await Promise.all([sendRescheduled(mail), notifyAdmin('cambiada', mail)]);
    return json(view({ ...b, starts_at: start.toISOString(), ends_at: end.toISOString(), meet_url: meetUrl }));
  }

  return fail(400, 'Acción no válida.');
}
