import { writeFileSync } from 'node:fs';
import { siteUrl } from './site-url.mjs';

const url = siteUrl();
// Las páginas legales llevan noindex, así que solo la home entra en el sitemap.
const pages = ['/'];
const today = new Date().toISOString().slice(0, 10);

writeFileSync(
  'public/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${url}${p === '/' ? '/' : p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`,
);
writeFileSync('public/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${url}/sitemap.xml\n`);
console.log(`sitemap.xml y robots.txt generados para ${url}`);
