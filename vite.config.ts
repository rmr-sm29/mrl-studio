import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error módulo JS sin tipos
import { siteUrl } from './scripts/site-url.mjs';

export default defineConfig({
  plugins: [
    react(),
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
      },
    },
  },
});
