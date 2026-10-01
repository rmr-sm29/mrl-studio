import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error módulo JS sin tipos
import { siteUrl } from './scripts/site-url.mjs';

/**
 * En desarrollo sirve las funciones de /api (las mismas que despliega Vercel) desde el servidor de Vite,
 * para no depender de `vercel dev`. Cada archivo exporta GET/POST con la firma Web (Request → Response).
 */
function apiDev(): Plugin {
  return {
    name: 'api-dev',
    apply: 'serve',
    configureServer(server) {
      // Como cleanUrls en Vercel: /reserva?… sirve reserva/index.html (Vite solo lo hace con la barra final).
      server.middlewares.use((req, _res, next) => {
        const m = req.url?.match(/^\/(reserva|aviso-legal|privacidad|cookies)(\?.*)?$/);
        if (m) req.url = `/${m[1]}/${m[2] ?? ''}`;
        next();
      });
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        const url = new URL(req.url, `http://${req.headers.host}`);
        const file = resolve(import.meta.dirname, `.${url.pathname}.ts`);
        if (!/^\/api\/[a-z0-9/-]+$/.test(url.pathname) || !existsSync(file)) {
          res.statusCode = 404;
          return res.end();
        }
        try {
          const mod = await server.ssrLoadModule(file);
          const handler = mod[req.method ?? 'GET'];
          if (typeof handler !== 'function') {
            res.statusCode = 405;
            return res.end();
          }
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
          const request = new Request(url, {
            method: req.method,
            headers,
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
          });
          const response: Response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (e) {
          server.config.logger.error(`[api] ${(e as Error).stack}`);
          res.statusCode = 500;
          res.end();
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Variables de servidor (DATABASE_URL, GOOGLE_*, …) para las funciones de /api en local.
  for (const [k, v] of Object.entries(loadEnv(mode, import.meta.dirname, ''))) process.env[k] ??= v;

  return {
    plugins: [
      react(),
      apiDev(),
      {
        name: 'site-url',
        transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl()),
      },
    ],
    // host: true → accesible por localhost y por la IP de la red local (p. ej. http://192.168.1.63:5173)
    server: { host: true, port: 5173 },
    preview: { host: true, port: 4173 },
    build: {
      rollupOptions: {
        input: {
          main: resolve(import.meta.dirname, 'index.html'),
          avisoLegal: resolve(import.meta.dirname, 'aviso-legal/index.html'),
          privacidad: resolve(import.meta.dirname, 'privacidad/index.html'),
          cookies: resolve(import.meta.dirname, 'cookies/index.html'),
          reserva: resolve(import.meta.dirname, 'reserva/index.html'),
        },
      },
    },
  };
});
