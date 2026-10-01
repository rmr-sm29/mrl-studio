// GET /api/slots → huecos libres de los próximos días.
import { availability } from './_lib/availability.js';
import { RULES } from './_lib/config.js';
import { fail, json, UUID } from './_lib/http.js';

export async function GET(request: Request) {
  const exclude = new URL(request.url).searchParams.get('exclude') ?? undefined;
  try {
    const days = await availability(new Date(), exclude && UUID.test(exclude) ? exclude : undefined);
    return json({ timezone: RULES.timezone, slotMinutes: RULES.slotMinutes, days });
  } catch (e) {
    console.error('[slots]', (e as Error).message);
    return fail(503, 'No hemos podido cargar la agenda. Inténtalo de nuevo en unos minutos.');
  }
}
