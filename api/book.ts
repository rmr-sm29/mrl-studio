// POST /api/book → crea la reserva: base de datos + evento de Google Calendar con Meet + emails.
import { isAvailable } from './_lib/availability.js';
import { RULES, siteUrl } from './_lib/config.js';
import { isUniqueViolation, sql } from './_lib/db.js';
import { notifyAdmin, sendConfirmation } from './_lib/email.js';
import { cancelEvent, createEvent } from './_lib/google.js';
import { fail, ipHash, json, manageUrl, sameOrigin } from './_lib/http.js';
import { formatLong } from './_lib/time.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Teléfono flexible: prefijo opcional, dígitos, espacios, guiones, puntos y paréntesis; de 6 a 15 dígitos. */
const PHONE = /^\+?[\d\s().-]{6,24}$/;
const MAX_PER_IP_24H = 3;

type Body = Partial<Record<'startsAt' | 'name' | 'email' | 'phone' | 'company' | 'website' | 'goal' | 'timezone' | 'hp', string>> & {
  consent?: boolean;
  elapsed?: number;
};

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail(403, 'Origen no permitido.');

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return fail(400, 'Solicitud no válida.');
  }

  // Antispam: campo trampa invisible y envío demasiado rápido para un humano.
  if (body.hp || (typeof body.elapsed === 'number' && body.elapsed < 2500)) return fail(400, 'No hemos podido procesar la reserva.');

  const name = clean(body.name, 100);
  const email = clean(body.email, 254).toLowerCase();
  const company = clean(body.company, 120);
  const phone = clean(body.phone, 30) || null;
  const website = clean(body.website, 200) || null;
  const goal = typeof body.goal === 'string' ? body.goal.trim().slice(0, 1000) : '';
  const timezone = clean(body.timezone, 64) || null;
  const start = new Date(String(body.startsAt));

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = 'Escribe tu nombre.';
  if (!EMAIL.test(email)) errors.email = 'Revisa el email.';
  if (company.length < 2) errors.company = 'Escribe el nombre de tu marca.';
  if (phone && (!PHONE.test(phone) || phone.replace(/\D/g, '').length < 6 || phone.replace(/\D/g, '').length > 15))
    errors.phone = 'Revisa el teléfono.';
  if (goal.length < 3) errors.goal = 'Cuéntame en una frase qué quieres conseguir.';
  if (body.consent !== true) errors.consent = 'Necesitamos tu aceptación para gestionar la reserva.';
  if (Number.isNaN(start.getTime())) errors.startsAt = 'Elige un hueco.';
  if (Object.keys(errors).length) return fail(422, 'Revisa los campos marcados.', { fields: errors });

  const end = new Date(start.getTime() + RULES.callMinutes * 60_000);
  const ip = ipHash(request);
  const db = sql();

  try {
    const [{ recent }] = (await db`select count(*)::int as recent from bookings
      where ip_hash = ${ip} and created_at > now() - interval '24 hours'`) as { recent: number }[];
    if (recent >= MAX_PER_IP_24H) return fail(429, 'Has hecho demasiadas reservas seguidas. Escríbenos si necesitas ayuda.');

    const existing = (await db`select id from bookings
      where lower(email) = ${email} and status = 'confirmed' and starts_at > now() limit 1`) as { id: string }[];
    if (existing.length)
      return fail(409, 'Ya tienes una llamada reservada. Te hemos enviado el enlace para cambiarla en el email de confirmación.', {
        code: 'already_booked',
      });

    if (!(await isAvailable(start))) return fail(409, 'Ese hueco acaba de ocuparse. Elige otro, por favor.', { code: 'slot_taken' });
  } catch (e) {
    console.error('[book] comprobación', (e as Error).message);
    return fail(503, 'No hemos podido comprobar la agenda. Inténtalo de nuevo en unos minutos.');
  }

  let id: string;
  try {
    const rows = (await db`insert into bookings (starts_at, ends_at, name, email, phone, company, website, goal, timezone, consent_at, ip_hash)
      values (${start.toISOString()}, ${end.toISOString()}, ${name}, ${email}, ${phone}, ${company}, ${website}, ${goal}, ${timezone}, now(), ${ip})
      returning id`) as { id: string }[];
    id = rows[0].id;
  } catch (e) {
    if (isUniqueViolation(e)) return fail(409, 'Ese hueco acaba de ocuparse. Elige otro, por favor.', { code: 'slot_taken' });
    console.error('[book] insert', (e as Error).message);
    return fail(500, 'No hemos podido guardar la reserva. Inténtalo de nuevo.');
  }

  const manage = manageUrl(id, request);
  let event: { id: string; meetUrl: string | null };
  try {
    event = await createEvent({
      requestId: id,
      start,
      end,
      name,
      email,
      description: [
        `Videollamada de ${RULES.callMinutes} min con mrl. studio.`,
        '',
        `Marca: ${company}`,
        phone ? `Teléfono: ${phone}` : '',
        website ? `Web / Instagram: ${website}` : '',
        `Objetivo: ${goal}`,
        '',
        `Cambiar o cancelar: ${manage}`,
      ]
        .filter((l, i, a) => l || a[i - 1])
        .join('\n'),
    });
  } catch (e) {
    console.error('[book] google', (e as Error).message);
    await db`delete from bookings where id = ${id}`;
    return fail(502, 'No hemos podido confirmar la llamada en el calendario. Inténtalo de nuevo en unos minutos.');
  }

  try {
    await db`update bookings set google_event_id = ${event.id}, meet_url = ${event.meetUrl}, updated_at = now() where id = ${id}`;
  } catch (e) {
    // Sin el id del evento no podríamos moverlo ni cancelarlo: se deshace todo.
    console.error('[book] update', (e as Error).message);
    await cancelEvent(event.id).catch(() => {});
    await db`delete from bookings where id = ${id}`.catch(() => {});
    return fail(500, 'No hemos podido guardar la reserva. Inténtalo de nuevo.');
  }

  const mail = { name, email, phone, company, website, goal, start, meetUrl: event.meetUrl, manageUrl: manage };
  await Promise.all([sendConfirmation(mail), notifyAdmin('nueva', mail)]);

  return json(
    {
      id,
      startsAt: start.toISOString(),
      when: formatLong(start, RULES.timezone),
      meetUrl: event.meetUrl,
      manageUrl: manage.replace(siteUrl(request), ''),
    },
    201,
  );
}
