// GET /api/cron/reminders → recordatorio del día. Lo lanza Vercel Cron cada mañana (vercel.json);
// Vercel añade "Authorization: Bearer $CRON_SECRET" a la llamada.
import { env } from '../_lib/config.js';
import { sql, type BookingRow } from '../_lib/db.js';
import { sendReminder } from '../_lib/email.js';
import { fail, json, manageUrl } from '../_lib/http.js';

export async function GET(request: Request) {
  const secret = env('CRON_SECRET');
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return fail(401, 'No autorizado.');

  const db = sql();
  // Llamadas de las próximas 18 h (la tarea corre a las 9:00 de Madrid → cubre las de hoy),
  // sin recordatorio previo y reservadas con algo de antelación.
  const rows = (await db`select * from bookings
    where status = 'confirmed' and reminder_sent_at is null
      and starts_at > now() and starts_at < now() + interval '18 hours'
      and created_at < now() - interval '2 hours'`) as BookingRow[];

  let sent = 0;
  for (const b of rows) {
    await sendReminder({
      name: b.name,
      email: b.email,
      company: b.company,
      start: new Date(b.starts_at),
      meetUrl: b.meet_url,
      manageUrl: manageUrl(b.id),
    });
    await db`update bookings set reminder_sent_at = now() where id = ${b.id}`;
    sent++;
  }
  return json({ sent });
}
