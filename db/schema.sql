-- Agenda de mrl. studio. Idempotente: se puede ejecutar varias veces (npm run db:migrate).

create table if not exists bookings (
  id               uuid primary key default gen_random_uuid(),
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  status           text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),

  -- datos del formulario
  name             text not null,
  email            text not null,
  company          text not null,
  website          text,
  goal             text,
  timezone         text,
  consent_at       timestamptz not null,

  -- Google Calendar
  google_event_id  text,
  meet_url         text,

  reminder_sent_at timestamptz,
  ip_hash          text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  cancelled_at     timestamptz
);

-- Un único hueco confirmado por hora de inicio: impide dobles reservas aunque lleguen a la vez.
create unique index if not exists bookings_slot_confirmed on bookings (starts_at) where status = 'confirmed';
create index if not exists bookings_email_idx on bookings (lower(email));
create index if not exists bookings_starts_idx on bookings (starts_at);
create index if not exists bookings_ip_created_idx on bookings (ip_hash, created_at);
