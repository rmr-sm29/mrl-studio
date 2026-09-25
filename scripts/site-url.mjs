// URL pública del sitio. Prioridad: SITE_URL explícita > dominio de producción de Vercel > localhost.
export function siteUrl() {
  const explicit = process.env.SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return 'http://localhost:5173';
}
