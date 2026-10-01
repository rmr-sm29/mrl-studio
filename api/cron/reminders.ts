// GET /api/cron/reminders → tarea diaria (vercel.json, 07:00 UTC = 9:00 de Madrid). Vercel añade
// "Authorization: Bearer $CRON_SECRET" a la llamada. Hace dos cosas, en este orden:
//  1. Sincroniza: las reservas cuyo evento se borró a mano en Google Calendar pasan a canceladas (se libera el hueco
//     y se avisa al cliente y al administrador).
//  2. Recordatorio del día a las llamadas de las próximas 18 h.
import { env, siteUrl } from '../_lib/config.js';
import { sql, type BookingRow } from '../_lib/db.js';
import { notifyAdmin, sendCancelled, sendReminder } from '../_lib/email.js';
import { eventExists } from '../_lib/google.js';
import { fail, json, manageUrl } from '../_lib/http.js';

const mailOf = (b: BookingRow) => ({
  name: b.name,
  email: b.email,
  company: b.company,
  phone: b.phone,
  website: b.website,
  goal: b.goal,
  start: new Date(b.starts_at),
  meetUrl: b.meet_url,
  manageUrl: manageUrl(b.id),
});

export async function GET(request: Request) {
  const secret = env('CRON_SECRET');
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return fail(401, 'No autorizado.');

  const db = sql();

  const upcoming = (await db`select * from bookings
    where status = 'confirmed' and starts_at > now() and google_event_id is not null`) as BookingRow[];
  let synced = 0;
  for (const b of upcoming) {
    try {
      if (await eventExists(b.google_event_id!)) continue;
    } catch (e) {
      console.error('[cron] google', (e as Error).message);
      continue; // ante un error de Google no se cancela nada
    }
    await db`update bookings set status = 'cancelled', cancelled_at = now(), updated_at = now() where id = ${b.id}`;
    await Promise.all([
      sendCancelled(mailOf(b), siteUrl(request)),
      notifyAdmin('cancelada', mailOf(b), 'Anulada porque el evento se borró de Google Calendar.'),
    ]);
    synced++;
  }

  // Llamadas de las próximas 18 h sin recordatorio previo y reservadas con algo de antelación.
  const rows = (await db`select * from bookings
    where status = 'confirmed' and reminder_sent_at is null
      and starts_at > now() and starts_at < now() + interval '18 hours'
      and created_at < now() - interval '2 hours'`) as BookingRow[];
  let sent = 0;
  for (const b of rows) {
    await sendReminder(mailOf(b));
    await db`update bookings set reminder_sent_at = now() where id = ${b.id}`;
    sent++;
  }

  return json({ cancelledFromCalendar: synced, reminders: sent });
}
