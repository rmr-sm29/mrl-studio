import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { env } from './config.js';

let client: NeonQueryFunction<false, false> | null = null;

export function sql() {
  if (!client) {
    const url = env('DATABASE_URL');
    if (!url) throw new Error('DATABASE_URL no definida');
    client = neon(url);
  }
  return client;
}

export type BookingRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: 'confirmed' | 'cancelled';
  name: string;
  email: string;
  company: string;
  phone: string | null;
  website: string | null;
  goal: string | null;
  timezone: string | null;
  google_event_id: string | null;
  meet_url: string | null;
  reminder_sent_at: string | null;
  created_at: string;
};

export async function getBooking(id: string) {
  const rows = (await sql()`select * from bookings where id = ${id}`) as BookingRow[];
  return rows[0] ?? null;
}

/** Violación de índice único de Postgres (hueco ya ocupado). */
export const isUniqueViolation = (e: unknown) => (e as { code?: string })?.code === '23505';
