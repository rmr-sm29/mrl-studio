// Google Calendar vía REST con el refresh token de la cuenta dueña de la agenda (scripts/google-auth.mjs).
import { env, RULES } from './config.js';

const API = 'https://www.googleapis.com/calendar/v3';
let cached: { token: string; exp: number } | null = null;

export async function accessToken() {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env('GOOGLE_CLIENT_ID'),
      client_secret: env('GOOGLE_CLIENT_SECRET'),
      refresh_token: env('GOOGLE_REFRESH_TOKEN'),
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google OAuth: ${data.error_description || data.error || res.status}`);
  cached = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return cached.token;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json', ...init.headers },
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google Calendar ${res.status}: ${data.error?.message ?? 'error'}`);
  return data as T;
}

/** Calendario donde se crean las reservas. */
export const bookingCalendar = () => env('GOOGLE_CALENDAR_ID') || 'primary';

export type Interval = { start: number; end: number };

/** Franjas ocupadas del calendario principal y del de reservas. Falla cerrado: si un calendario da error, lanza. */
export async function freeBusy(timeMin: Date, timeMax: Date): Promise<Interval[]> {
  const ids = [...new Set(['primary', bookingCalendar()])];
  const data = await call<{ calendars: Record<string, { busy: { start: string; end: string }[]; errors?: unknown[] }> }>(
    '/freeBusy',
    {
      method: 'POST',
      body: JSON.stringify({ timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString(), items: ids.map((id) => ({ id })) }),
    },
  );
  const out: Interval[] = [];
  for (const [id, cal] of Object.entries(data.calendars)) {
    if (cal.errors?.length) throw new Error(`freeBusy: calendario ${id} no accesible`);
    for (const b of cal.busy) out.push({ start: Date.parse(b.start), end: Date.parse(b.end) });
  }
  return out;
}

type EventInput = {
  requestId: string;
  start: Date;
  end: Date;
  name: string;
  email: string;
  description: string;
};

type GEvent = { id: string; hangoutLink?: string; conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] } };

const meetUrl = (e: GEvent) => e.hangoutLink ?? e.conferenceData?.entryPoints?.find((p) => p.entryPointType === 'video')?.uri ?? null;
const cal = () => encodeURIComponent(bookingCalendar());

/** Crea el evento con Google Meet e invita a la persona (Google le envía la invitación). */
export async function createEvent(input: EventInput) {
  const event = await call<GEvent>(`/calendars/${cal()}/events?conferenceDataVersion=1&sendUpdates=all`, {
    method: 'POST',
    body: JSON.stringify({
      summary: `Llamada mrl. studio · ${input.name}`,
      description: input.description,
      start: { dateTime: input.start.toISOString(), timeZone: RULES.timezone },
      end: { dateTime: input.end.toISOString(), timeZone: RULES.timezone },
      attendees: [{ email: input.email, displayName: input.name }],
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      conferenceData: { createRequest: { requestId: input.requestId, conferenceSolutionKey: { type: 'hangoutsMeet' } } },
    }),
  });
  return { id: event.id, meetUrl: meetUrl(event) };
}

export async function moveEvent(eventId: string, start: Date, end: Date) {
  const event = await call<GEvent>(`/calendars/${cal()}/events/${encodeURIComponent(eventId)}?sendUpdates=all`, {
    method: 'PATCH',
    body: JSON.stringify({
      start: { dateTime: start.toISOString(), timeZone: RULES.timezone },
      end: { dateTime: end.toISOString(), timeZone: RULES.timezone },
    }),
  });
  return { meetUrl: meetUrl(event) };
}

/** Cancela el evento; Google avisa a la persona invitada. */
export async function cancelEvent(eventId: string) {
  await call(`/calendars/${cal()}/events/${encodeURIComponent(eventId)}?sendUpdates=all`, { method: 'DELETE' }).catch(
    (e: Error) => {
      if (!/ 410:| 404:/.test(e.message)) throw e; // ya borrado desde el calendario
    },
  );
}
