// Cliente de las funciones de /api de la agenda.

export const AGENDA_TZ = 'Europe/Madrid';

export type Slot = { start: string; label: string };
export type Day = { date: string; slots: Slot[] };
export type Slots = { timezone: string; slotMinutes: number; days: Day[] };

export type BookingView = {
  status: 'confirmed' | 'cancelled';
  startsAt: string;
  when: string;
  firstName: string;
  meetUrl: string | null;
  past: boolean;
};

export type Booked = { id: string; startsAt: string; when: string; meetUrl: string | null; manageUrl: string };

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  } catch {
    throw new ApiError('Sin conexión. Revisa tu red e inténtalo de nuevo.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? 'Algo ha fallado. Inténtalo de nuevo.', res.status, data.code, data.fields);
  return data as T;
}

export const getSlots = (exclude?: string) => request<Slots>(`/api/slots${exclude ? `?exclude=${exclude}` : ''}`);

export const book = (body: Record<string, unknown>) => request<Booked>('/api/book', { method: 'POST', body: JSON.stringify(body) });

export const getBooking = (id: string, t: string) =>
  request<BookingView>(`/api/booking?id=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}`);

export const manageBooking = (body: { id: string; t: string; action: 'cancel' | 'reschedule'; startsAt?: string }) =>
  request<BookingView>('/api/booking', { method: 'POST', body: JSON.stringify(body) });

/** Zona horaria del visitante, si es distinta de la de la agenda. */
export function visitorTz() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return null;
    // Misma hora que Madrid ahora mismo → no hace falta mostrar dos horas.
    const f = (z: string) => new Intl.DateTimeFormat('es-ES', { timeZone: z, hour: '2-digit', minute: '2-digit' }).format(new Date());
    return f(tz) === f(AGENDA_TZ) ? null : tz;
  } catch {
    return null;
  }
}

export const localTime = (iso: string, tz: string) =>
  new Intl.DateTimeFormat('es-ES', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));

/** "YYYY-MM-DD" → fecha a mediodía UTC, para formatear sin saltos de zona. */
export const dayDate = (key: string) => new Date(`${key}T12:00:00Z`);

export const formatDay = (key: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', ...opts }).format(dayDate(key));
