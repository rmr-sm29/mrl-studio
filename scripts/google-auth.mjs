/**
 * Autorización única de Google Calendar.
 *
 * Abre el consentimiento de Google (Calendar + envío de Gmail) con la cuenta dueña de la agenda, recibe el código en
 * http://localhost:5555/oauth2callback, lo cambia por un refresh token y lo guarda en .env.local
 * como GOOGLE_REFRESH_TOKEN (sin mostrarlo). Después comprueba el acceso con una consulta freeBusy.
 *
 * Requiere en .env.local: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (y opcional GOOGLE_CALENDAR_ID).
 * Uso: npm run google:auth
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { exec } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const ENV_FILE = new URL('../.env.local', import.meta.url);
const PORT = 5555;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.freebusy',
  // Emails de confirmación, recordatorio y aviso interno desde la propia cuenta (sin Resend).
  'https://www.googleapis.com/auth/gmail.send',
];

function readEnv() {
  if (!existsSync(ENV_FILE)) return {};
  const env = {};
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
  }
  return env;
}

function writeEnvVar(key, value) {
  const text = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';
  const line = `${key}="${value}"`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  const next = re.test(text) ? text.replace(re, line) : `${text.replace(/\n?$/, '\n')}${line}\n`;
  writeFileSync(ENV_FILE, next);
}

const env = readEnv();
const clientId = env.GOOGLE_CLIENT_ID;
const clientSecret = env.GOOGLE_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error('Faltan GOOGLE_CLIENT_ID y/o GOOGLE_CLIENT_SECRET en .env.local.');
  process.exit(1);
}

const state = randomBytes(16).toString('hex');
const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent', // fuerza que Google devuelva refresh token
    include_granted_scopes: 'true',
    state,
  });

async function checkAccess(accessToken) {
  const calendarId = env.GOOGLE_CALENDAR_ID || 'primary';
  const now = new Date();
  const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeMin: now.toISOString(),
      timeMax: new Date(now.getTime() + 7 * 864e5).toISOString(),
      items: [{ id: 'primary' }, ...(calendarId !== 'primary' ? [{ id: calendarId }] : [])],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
  for (const [id, cal] of Object.entries(data.calendars)) {
    const label = id === 'primary' ? 'principal' : 'agenda (GOOGLE_CALENDAR_ID)';
    if (cal.errors?.length) console.log(`  ✗ Calendario ${label}: ${cal.errors.map((e) => e.reason).join(', ')}`);
    else console.log(`  ✓ Calendario ${label}: ${cal.busy.length} franjas ocupadas en los próximos 7 días`);
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  if (url.pathname !== '/oauth2callback') return res.writeHead(404).end();

  const done = (msg, ok) => {
    res.writeHead(ok ? 200 : 400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<p style="font:16px system-ui;padding:2rem">${msg}</p>`);
    server.close();
  };

  if (url.searchParams.get('state') !== state) return done('Estado no válido. Vuelve a ejecutar el script.', false);
  const error = url.searchParams.get('error');
  if (error) {
    console.error(`Google devolvió un error: ${error}`);
    return done(`Autorización cancelada (${error}).`, false);
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: url.searchParams.get('code'),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokens.error_description || tokens.error || `HTTP ${tokenRes.status}`);
    if (!tokens.refresh_token) throw new Error('Google no devolvió refresh token. Revoca el acceso en myaccount.google.com/permissions y repite.');

    const granted = (tokens.scope || '').split(' ');
    const missing = SCOPES.filter((s) => !granted.includes(s));
    if (missing.length) console.warn(`Aviso: permisos no concedidos: ${missing.join(', ')}`);

    writeEnvVar('GOOGLE_REFRESH_TOKEN', tokens.refresh_token);
    console.log('✓ GOOGLE_REFRESH_TOKEN guardado en .env.local (valor oculto).');
    await checkAccess(tokens.access_token);
    done('Listo. Ya puedes cerrar esta pestaña y volver a la terminal.', true);
  } catch (e) {
    console.error(`Error: ${e.message}`);
    done(`Error: ${e.message}`, false);
    process.exitCode = 1;
  }
});

server.listen(PORT, () => {
  console.log('Abriendo el navegador para autorizar Google Calendar…');
  console.log('Si no se abre, copia esta dirección en el navegador:\n');
  console.log(authUrl + '\n');
  exec(`${process.platform === 'darwin' ? 'open' : 'xdg-open'} "${authUrl}"`);
});
