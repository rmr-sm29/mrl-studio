# mrl. studio — landing

React 19 + Vite + TypeScript (brief v2). Sin librerías de animación: las tres secuencias ancladas (hero, portfolio,
VOLT) usan `position: sticky` + un hook de progreso de scroll nativo (sin inercia añadida), y el resto es CSS +
IntersectionObserver. Todo respeta `prefers-reduced-motion`.

```
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/ (+ sitemap.xml y robots.txt)
npm run assets     # reprocesa assets-src/ → public/media/ (requiere ffmpeg)
```

- Copy: `src/content.ts` (todo el texto del brief en un solo sitio)
- Estilos: `src/styles.css` (tokens de paleta en `:root`)
- Legales: `src/legal/LegalPage.tsx` → **completar los datos entre [corchetes]**
- Fondo de VOLT: imagen estática `volt-desktop` / `volt-mobile` (parche 2 · S), generada por `npm run assets`
- Recorrido de scroll por estado de las secuencias: `--step` en `src/styles.css`

## Variables de entorno (Vercel → Settings → Environment Variables)

| Variable | Uso |
|---|---|
| `VITE_CONTACT_EMAIL` | Email del footer y de los legales |
| `SITE_URL` | URL canónica, og:image, sitemap y enlaces de los emails. Si falta, se usa el dominio de producción de Vercel |
| `DATABASE_URL` | Neon (la añade Vercel al conectar Storage → Neon) |
| `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` | Cliente OAuth "Aplicación web" del proyecto de Google Cloud |
| `GOOGLE_REFRESH_TOKEN` | Lo genera `npm run google:auth` en `.env.local` |
| `GOOGLE_CALENDAR_ID` | Calendario donde se crean las reservas (vacío = principal) |
| `RESEND_API_KEY` · `EMAIL_FROM` · `ADMIN_EMAIL` | Emails de confirmación, recordatorio y aviso interno |
| `BOOKING_SECRET` | Firma de los enlaces de gestión (`openssl rand -base64 32`) |
| `CRON_SECRET` | Protege `/api/cron/reminders`; Vercel lo envía solo en la tarea programada |

Las `VITE_*` se incrustan al compilar: tras cambiarlas hay que volver a desplegar.

## Agenda propia

- Reglas (duración, horario, antelación, tope diario): `api/_lib/config.ts`. Para bloquear un día u horas, crea un
  evento en Google Calendar: la disponibilidad descuenta todo lo ocupado del calendario principal y del de reservas.
- Funciones: `api/slots` (huecos), `api/book` (reserva + evento con Google Meet + emails), `api/booking` (ver, cambiar
  de hora, cancelar desde `/reserva?id&t`), `api/cron/reminders` (recordatorio diario, 07:00 UTC, `vercel.json`).
- Base de datos: `db/schema.sql`, aplicar con `npm run db:migrate`. El índice único sobre la hora impide dobles reservas.
- En local, `npm run dev` sirve también `/api` (plugin de `vite.config.ts`) con las variables de `.env.local`.
- Sin `RESEND_API_KEY` no se envían emails propios; la invitación de Google Calendar llega igualmente.
