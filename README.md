# mrl. studio — landing

React 19 + Vite + TypeScript. Sin librerías de animación: todo el movimiento es CSS + IntersectionObserver
y respeta `prefers-reduced-motion`.

```
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/ (+ sitemap.xml y robots.txt)
npm run assets     # reprocesa assets-src/ → public/media/ (requiere ffmpeg)
```

- Copy: `src/content.ts` (todo el texto del brief en un solo sitio)
- Estilos: `src/styles.css` (tokens de paleta en `:root`)
- Legales: `src/legal/LegalPage.tsx` → **completar los datos entre [corchetes]**

## Variables de entorno (Vercel → Settings → Environment Variables)

| Variable | Ejemplo | Uso |
|---|---|---|
| `VITE_BOOKING_PROVIDER` | `cal` o `tidycal` | Calendario embebido |
| `VITE_BOOKING_PATH` | `usuario/15min` | Ruta del evento en Cal.com / TidyCal |
| `VITE_CONTACT_EMAIL` | — | Email del footer y de los legales |
| `SITE_URL` | `https://tu-dominio.com` | URL canónica, og:image y sitemap. Si falta, se usa el dominio de producción de Vercel |

Las `VITE_*` se incrustan al compilar: tras cambiarlas hay que volver a desplegar.

## Calendario (Cal.com)

Crear un evento de 15 min, ubicación **videollamada** (Cal Video / Google Meet), y en *Booking questions*:

1. Nombre — obligatorio (viene por defecto)
2. Marca — texto corto, obligatorio
3. Email — obligatorio (viene por defecto)
4. `Teléfono (opcional)` — tipo *Phone*, **no** obligatorio. No usar la ubicación "Llamada telefónica"
5. Web o Instagram — texto corto, obligatorio
6. Qué necesitas — *Select*, obligatorio: `spot` · `UGC` · `imagen de producto` · `no lo tengo claro`

El calendario solo se carga tras aceptar cookies de terceros (RGPD).
