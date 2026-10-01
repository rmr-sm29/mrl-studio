// Procesa los originales de assets-src/ y deja las versiones web en public/media/.
// Requisitos: ffmpeg en el PATH (vídeo y extracción de fotogramas) y sharp (imágenes).
//
//   npm run assets            → procesa todo
//   npm run assets -- images  → solo imágenes
//   npm run assets -- videos  → solo vídeos
//
// Ajustes por variables de entorno:
//   UGC2_START / UGC2_DURATION  recorte opcional del UGC 2. Sin definir no se recorta: el clip v3 ya viene a 11,4 s.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const SRC = 'assets-src';
const OUT = 'public/media';
const TMP = `${SRC}/.tmp`;
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const only = process.argv[2];
const kb = (f) => `${Math.round(statSync(f).size / 1024)} KB`;
const firstOf = (...names) => names.map((n) => `${SRC}/${n}`).find(existsSync);
const has = (f) => existsSync(f) || (console.warn(`  falta ${f}, se omite`), false);

function ff(args) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
}

/** AVIF + WebP + JPEG en varios anchos. `prep` permite recortar antes de redimensionar. */
async function variants(input, base, widths, prep = (s) => s) {
  for (const w of widths) {
    const img = () => prep(sharp(input)).resize({ width: w, withoutEnlargement: true });
    await img().avif({ quality: 55, effort: 6 }).toFile(`${OUT}/${base}-${w}.avif`);
    await img().webp({ quality: 80 }).toFile(`${OUT}/${base}-${w}.webp`);
    await img().flatten({ background: '#0c0d0c' }).jpeg({ quality: 82, mozjpeg: true, progressive: true }).toFile(`${OUT}/${base}-${w}.jpg`);
    console.log(`  ${base}-${w}  jpg ${kb(`${OUT}/${base}-${w}.jpg`)} · avif ${kb(`${OUT}/${base}-${w}.avif`)}`);
  }
}

// og:image: recorte del hero de escritorio centrado en la figura, con el wordmark grande abajo a la izquierda
// (la tarjeta se ve a ~300 px de ancho en móvil).
const ogOverlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <text x="64" y="560" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="700" font-size="200" letter-spacing="-8" fill="#F4F1EA">mrl</text>
  <rect x="360" y="516" width="42" height="42" fill="#E8A24A"/>
</svg>`);

// Favicon: solo el cuadrado del punto, ámbar sobre grafito (a 32 px el wordmark sería una mancha).
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="10" fill="#0C0D0C"/>
  <rect x="20" y="20" width="24" height="24" rx="3" fill="#E8A24A"/>
</svg>
`;

async function images() {
  // Versión reescalada (v3): hero-desktop.png 4046×2258 y hero-mobile.png 2258×4046. Se acepta también .jpeg.
  const heroD = firstOf('hero-static.png', 'hero-desktop.png', 'hero-desktop.jpeg');
  const heroM = firstOf('hero-mobile.png', 'hero-mobile.jpeg');
  // El hero y VOLT usan ya las órbitas de frames (public/media/hero-orbit y volt-orbit), que este script NO procesa
  // (no se recomprimen ni se renombran). hero-desktop solo se usa aquí como origen del og:image.
  void heroM;

  // Hero y VOLT con imagen estática a resolución completa (se descarta la órbita de frames: perdía nitidez en móvil).
  // Hasta 4046 px: en móvil la imagen se recorta en vertical y a densidad 3x necesita ese ancho para verse nítida.
  for (const [src, base] of [['hero-static.png', 'hero-static'], ['volt-static.png', 'volt-static']]) {
    const file = firstOf(src);
    console.log(`Imagen estática ${base}`);
    if (file) await variants(file, base, [1280, 1920, 2752, 4046]);
    else console.warn(`  falta assets-src/${src}`);
  }

  console.log('og:image 1200×630');
  if (heroD) {
    // Se amplía a 760 px de alto para poder desplazar el encuadre hacia la figura (≈ 68 % del ancho).
    const scaledW = Math.round((2752 / 1536) * 760);
    const left = Math.min(Math.max(Math.round(scaledW * 0.68 - 600), 0), scaledW - 1200);
    await sharp(heroD)
      .resize({ height: 760 })
      .extract({ left, top: 40, width: 1200, height: 630 })
      .composite([{ input: ogOverlay }])
      .jpeg({ quality: 86, mozjpeg: true })
      .toFile(`${OUT}/og.jpg`);
  }

  console.log('Favicons');
  writeFileSync('public/favicon.svg', faviconSvg);
  await sharp(Buffer.from(faviconSvg)).resize(32, 32).png().toFile('public/favicon-32.png');
  await sharp(Buffer.from(faviconSvg)).resize(180, 180).png().toFile('public/apple-touch-icon.png');

  console.log('Producto 3:4');
  for (const id of ['fragancia', 'chocolate', 'proteina']) {
    if (has(`${SRC}/product-${id}.jpeg`)) await variants(`${SRC}/product-${id}.jpeg`, `product-${id}`, [600, 1000]);
  }

  console.log('Avatar UGC 3:4');
  // Marcador de posición (brief v3 · J): Replace_headphones_on_woman… hasta que llegue la versión definitiva.
  const avatar = firstOf('avatar.jpeg', 'avatar.jpg', 'avatar.png');
  if (avatar) await variants(avatar, 'avatar', [600, 1000]);
  else console.warn('  falta assets-src/avatar.*');

  console.log('Fotogramas del spot (2,0 · 4,8 · 8,2 s)');
  const stills = [
    ['01-detalle', 2.0],
    ['02-general', 4.8],
    ['03-producto', 8.2],
  ];
  for (const [name, t] of stills) {
    const src = existsSync(`${SRC}/cine-still-${name}.jpg`) ? `${SRC}/cine-still-${name}.jpg` : `${TMP}/cine-still-${name}.png`;
    if (!existsSync(src) && has(`${SRC}/video-cine.mov`)) ff(['-ss', String(t), '-i', `${SRC}/video-cine.mov`, '-frames:v', '1', src]);
    if (existsSync(src)) await variants(src, `cine-still-${name}`, [360, 540]);
  }

  console.log('Esfera del reloj (cierre)');
  const dial = ['clock-dial.jpeg', 'clock-dial.jpg'].map((f) => `${SRC}/${f}`).find(existsSync);
  if (dial) {
    await variants(dial, 'clock-dial', [1280, 1920, 2752]);
    // Recorte 9:16 para móvil: altura completa, 864 px de ancho centrados en el pin (48,5 % del ancho).
    const { width: dw, height: dh } = await sharp(dial).metadata();
    const cw = Math.round((dh * 9) / 16);
    const left = Math.min(Math.max(Math.round(dw * 0.485 - cw / 2), 0), dw - cw);
    await variants(dial, 'clock-mobile', [540, 864], (s) => s.extract({ left, top: 0, width: cw, height: dh }));
  }
  else console.warn('  falta assets-src/clock-dial.jpeg: el cierre muestra una esfera provisional en SVG');

}

async function thumbs() {
  // Miniaturas del marquee: verticales, 60 px de alto (se generan a 2×), recortadas de las piezas del portfolio.
  console.log('Miniaturas del marquee');
  mkdirSync(`${OUT}/thumbs`, { recursive: true });
  const sources = [
    ['cine-1', `${TMP}/cine-still-01-detalle.png`],
    ['cine-2', `${TMP}/cine-still-02-general.png`],
    ['cine-3', `${TMP}/cine-still-03-producto.png`],
    ['ugc1', `${OUT}/video-ugc1-poster.jpg`],
    ['ugc2', `${OUT}/video-ugc2-poster.jpg`],
    ['fragancia', `${SRC}/product-fragancia.jpeg`],
    ['chocolate', `${SRC}/product-chocolate.jpeg`],
    ['proteina', `${SRC}/product-proteina.jpeg`],
  ];
  for (const [id, src] of sources) {
    if (!existsSync(src)) continue;
    await sharp(src).resize(76, 120, { fit: 'cover', position: 'attention' }).webp({ quality: 78 }).toFile(`${OUT}/thumbs/${id}.webp`);
  }
}

function videos() {
  const list = [
    { id: 'cine', poster: 1.2 },
    { id: 'ugc1', poster: 0.8 },
    {
      id: 'ugc2',
      poster: 1,
      ...(process.env.UGC2_START || process.env.UGC2_DURATION
        ? { start: Number(process.env.UGC2_START ?? 0), duration: Number(process.env.UGC2_DURATION ?? 12) }
        : {}),
    },
  ];
  // Brief v3 · J: 1080×1920, H.264 +faststart y VP9. Objetivo ≤ 2 MB por pieza.
  const scale = 'scale=1080:1920:flags=lanczos';

  for (const v of list) {
    const input = `${SRC}/video-${v.id}.mov`;
    if (!has(input)) continue;
    const cut = v.start !== undefined ? ['-ss', String(v.start), '-t', String(v.duration)] : [];
    console.log(`Vídeo ${v.id}`);
    ff([...cut, '-i', input, '-vf', scale, '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '24',
      '-maxrate', '1500k', '-bufsize', '3000k', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      '-c:a', 'aac', '-b:a', '96k', '-ac', '2', `${OUT}/video-${v.id}.mp4`]);
    ff([...cut, '-i', input, '-vf', scale, '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '1300k', '-row-mt', '1',
      '-deadline', 'good', '-cpu-used', '2', '-c:a', 'libopus', '-b:a', '80k', `${OUT}/video-${v.id}.webm`]);
    const at = (v.start ?? 0) + v.poster;
    ff(['-ss', String(at), '-i', input, '-frames:v', '1', '-vf', 'scale=1080:1920:flags=lanczos', '-q:v', '3', `${OUT}/video-${v.id}-poster.jpg`]);
    console.log(`  mp4 ${kb(`${OUT}/video-${v.id}.mp4`)} · webm ${kb(`${OUT}/video-${v.id}.webm`)}`);
  }
}

if (only !== 'videos') await images();
if (only !== 'images') videos();
await thumbs();
if (!only) rmSync(TMP, { recursive: true, force: true });
console.log('Listo.');
