import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { env, siteUrl } from './config.js';

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });

export const fail = (status: number, error: string, extra: Record<string, unknown> = {}) => json({ error, ...extra }, status);

function secret() {
  const s = env('BOOKING_SECRET');
  if (!s) throw new Error('BOOKING_SECRET no definida');
  return s;
}

/** Firma del enlace de gestión de una reserva (cambiar / cancelar). */
export const signBooking = (id: string) => createHmac('sha256', secret()).update(`booking:${id}`).digest('base64url').slice(0, 32);

export function verifyBooking(id: string, token: string) {
  const a = Buffer.from(signBooking(id));
  const b = Buffer.from(token ?? '');
  return a.length === b.length && timingSafeEqual(a, b);
}

export const manageUrl = (id: string, request?: Request) =>
  `${siteUrl(request)}/reserva?id=${encodeURIComponent(id)}&t=${signBooking(id)}`;

/** IP anonimizada (hash con sal) para limitar abusos sin guardar la IP. */
export function ipHash(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'local';
  return createHash('sha256').update(`${ip}:${secret()}`).digest('hex').slice(0, 32);
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mismo origen: rechaza envíos de formularios desde otras webs. */
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host || new URL(origin).origin === siteUrl();
  } catch {
    return false;
  }
}
