// Emails transaccionales. Por defecto se envían con Gmail desde la propia cuenta de la agenda (Gmail API, permiso
// gmail.send del mismo token de Google). Si se define RESEND_API_KEY, se usa Resend en su lugar.
import { env, RULES } from './config.js';
import { accessToken } from './google.js';
import { formatLong, formatTime } from './time.js';

type Mail = { to: string; subject: string; html: string; replyTo?: string };

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');
/** Cabecera con texto no ASCII (RFC 2047). */
const encWord = (s: string) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);

/** "Nombre <dir@dominio>" → cabecera From válida (el nombre "mrl. studio" lleva punto y debe ir codificado). */
function fromHeader(value: string) {
  const m = value.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (!m) return value.trim();
  return m[1] ? `=?UTF-8?B?${b64(m[1])}?= <${m[2]}>` : `<${m[2]}>`;
}

async function sendGmail({ to, subject, html, replyTo }: Mail) {
  const from = env('EMAIL_FROM');
  const headers = [
    ...(from ? [`From: ${fromHeader(from)}`] : []),
    `To: ${to}`,
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    `Subject: ${encWord(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
  ];
  const mime = `${headers.join('\r\n')}\r\n\r\n${b64(html).replace(/.{76}/g, '$&\r\n')}`;
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: Buffer.from(mime, 'utf8').toString('base64url') }),
  });
  if (!res.ok) throw new Error(`Gmail ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function sendResend({ to, subject, html, replyTo }: Mail) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env('EMAIL_FROM'), to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

const send = (mail: Mail) => (env('RESEND_API_KEY') && env('EMAIL_FROM') ? sendResend(mail) : sendGmail(mail));

/** Los fallos de email se registran pero no rompen la reserva. */
async function safeSend(mail: Mail) {
  try {
    await send(mail);
  } catch (e) {
    console.error('[email]', (e as Error).message);
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function layout(title: string, body: string, footer = true) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f4f1ea;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#100c0a">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
<p style="margin:0 0 32px;font-weight:700;font-size:20px;letter-spacing:-0.02em">mrl<span style="color:#e8a24a">.</span> <span style="font-size:11px;letter-spacing:0.3em;font-weight:600;opacity:.7">STUDIO</span></p>
<h1 style="margin:0 0 20px;font-size:26px;line-height:1.15;letter-spacing:-0.02em">${title}</h1>
${body}
${footer ? '<p style="margin:40px 0 0;font-size:12px;color:#5f5d57">Recibes este email porque has reservado una videollamada en mrl. studio.</p>' : ''}
</div></body></html>`;
}

const p = (html: string) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.55">${html}</p>`;
const btn = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;background:#100c0a;color:#f4f1ea;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:600;font-size:15px">${label}</a></p>`;
const link = (href: string, label: string) => `<a href="${href}" style="color:#8a4a0c">${label}</a>`;

export type MailBooking = {
  name: string;
  email: string;
  company: string;
  phone?: string | null;
  website?: string | null;
  goal?: string | null;
  start: Date;
  meetUrl: string | null;
  manageUrl: string;
};

const when = (b: MailBooking) => `${formatLong(b.start, RULES.timezone)} h (hora de Madrid)`;
const firstName = (n: string) => esc(n.trim().split(/\s+/)[0]);

export async function sendConfirmation(b: MailBooking) {
  await safeSend({
    to: b.email,
    replyTo: env('ADMIN_EMAIL') || undefined,
    subject: `Llamada confirmada · ${formatLong(b.start, RULES.timezone)}`,
    html: layout(
      `Hecho, ${firstName(b.name)}. Nos vemos el ${esc(formatLong(b.start, RULES.timezone))}.`,
      p(`Videollamada de ${RULES.callMinutes} minutos: <strong>${esc(when(b))}</strong>.`) +
        (b.meetUrl ? btn(b.meetUrl, 'Entrar en Google Meet') : '') +
        p('También te llega la invitación de Google Calendar con el mismo enlace.') +
        p('Si quieres adelantar algo, responde a este email con tu web, referencias o el producto que quieres anunciar.') +
        p(`¿Te viene mal? ${link(b.manageUrl, 'Cambia la hora o cancela aquí')}.`),
    ),
  });
}

export async function sendReminder(b: MailBooking) {
  await safeSend({
    to: b.email,
    replyTo: env('ADMIN_EMAIL') || undefined,
    subject: `Hoy a las ${formatTime(b.start, RULES.timezone)} · llamada con mrl. studio`,
    html: layout(
      `Hoy hablamos, ${firstName(b.name)}.`,
      p(`Te espero a las <strong>${esc(formatTime(b.start, RULES.timezone))} h</strong> (hora de Madrid).`) +
        (b.meetUrl ? btn(b.meetUrl, 'Entrar en Google Meet') : '') +
        p(`Si no puedes, ${link(b.manageUrl, 'cambia la hora o cancela aquí')}.`),
    ),
  });
}

export async function sendRescheduled(b: MailBooking) {
  await safeSend({
    to: b.email,
    replyTo: env('ADMIN_EMAIL') || undefined,
    subject: `Nueva hora · ${formatLong(b.start, RULES.timezone)}`,
    html: layout(
      'Llamada cambiada de hora.',
      p(`Nueva hora: <strong>${esc(when(b))}</strong>.`) +
        (b.meetUrl ? btn(b.meetUrl, 'Entrar en Google Meet') : '') +
        p(`${link(b.manageUrl, 'Gestionar la reserva')}.`),
    ),
  });
}

export async function sendCancelled(b: MailBooking, siteUrl: string) {
  await safeSend({
    to: b.email,
    subject: 'Llamada cancelada · mrl. studio',
    html: layout(
      'Llamada cancelada.',
      p(`Hemos cancelado la llamada del ${esc(when(b))}.`) +
        p(`Si quieres otra fecha, ${link(`${siteUrl}/#agendar`, 'reserva un nuevo hueco')}.`),
    ),
  });
}

/** Aviso interno al administrador. */
export async function notifyAdmin(kind: 'nueva' | 'cambiada' | 'cancelada', b: MailBooking, origin = '') {
  const to = env('ADMIN_EMAIL');
  if (!to) return;
  const rows: [string, string | null | undefined][] = [
    ['Cuándo', when(b)],
    ['Nombre', b.name],
    ['Email', b.email],
    ['Teléfono', b.phone],
    ['Marca', b.company],
    ['Web / Instagram', b.website],
    ['Objetivo', b.goal],
  ];
  const table = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#5f5d57;vertical-align:top">${k}</td><td style="padding:6px 0">${esc(v!)}</td></tr>`)
    .join('');
  await safeSend({
    to,
    replyTo: b.email,
    subject: `Reserva ${kind}: ${b.name} · ${formatLong(b.start, RULES.timezone)}`,
    html: layout(
      `Reserva ${kind}`,
      `<table style="font-size:15px;border-collapse:collapse">${table}</table>` +
        (kind === 'cancelada'
          ? p(origin ? `<span style="color:#5f5d57">${esc(origin)}</span>` : '')
          : btn(b.manageUrl, 'Cambiar de hora o cancelar') +
            p('<span style="color:#5f5d57;font-size:14px">Es el mismo enlace que tiene el cliente: si cancelas, se le avisa por email y Google le retira la invitación. También puedes borrar el evento en Google Calendar; la reserva se anula en la revisión diaria.</span>')),
      false,
    ),
  });
}
