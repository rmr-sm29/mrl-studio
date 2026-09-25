// Procesa los originales de assets-src/ y deja las versiones web en public/media/.
// Requisitos: ffmpeg en el PATH (vídeo) y sharp (imágenes, ya en devDependencies).
//
//   npm run assets            → procesa todo
//   npm run assets -- images  → solo imágenes
//   npm run assets -- videos  → solo vídeos
//
// Ajustes por variables de entorno:
//   HERO_45_X      desplazamiento horizontal (px sobre el original 2752×1536) del recorte móvil 4:5.
//                  Si existe assets-src/hero-4x5.jpeg (recorte generado aparte), se usa ese y se ignora.
//   UGC2_START     segundo de inicio del recorte de 0910.mov (por defecto 0)
//   UGC2_DURATION  duración del recorte (por defecto 12 s; el brief pide 10-12 s)

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import sharp from 'sharp';

const SRC = 'assets-src';
const OUT = 'public/media';
mkdirSync(OUT, { recursive: true });

const only = process.argv[2];
const kb = (f) => `${Math.round(statSync(f).size / 1024)} KB`;

async function variants(input, base, widths, { extract } = {}) {
  for (const w of widths) {
    const img = () => {
      let s = sharp(input);
      if (extract) s = s.extract(extract);
      return s.resize({ width: w, withoutEnlargement: true });
    };
    await img().avif({ quality: 55, effort: 6 }).toFile(`${OUT}/${base}-${w}.avif`);
    await img().webp({ quality: 78 }).toFile(`${OUT}/${base}-${w}.webp`);
    await img().jpeg({ quality: 80, mozjpeg: true, progressive: true }).toFile(`${OUT}/${base}-${w}.jpg`);
    console.log(`  ${base}-${w}  jpg ${kb(`${OUT}/${base}-${w}.jpg`)} · avif ${kb(`${OUT}/${base}-${w}.avif`)}`);
  }
}

const ogOverlay = (w, h) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <text x="84" y="360" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="700" font-size="168" letter-spacing="-6" fill="#0C0D0C">mrl</text>
  <rect x="332" y="326" width="34" height="34" fill="#E8A24A"/>
  <text x="90" y="418" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="600" font-size="30" letter-spacing="10" fill="#0C0D0C">STUDIO</text>
</svg>`);

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#0C0D0C"/>
  <text x="7" y="43" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="700" font-size="30" letter-spacing="-1.5" fill="#F4F1EA">mrl</text>
  <rect x="51" y="36" width="7" height="7" fill="#E8A24A"/>
</svg>
`;

async function images() {
  console.log('Hero 16:9');
  const hero = `${SRC}/hero.jpeg`;
  await variants(hero, 'hero-16x9', [1280, 1920, 2752]);

  console.log('Hero 4:5 (móvil)');
  const hero45 = `${SRC}/hero-4x5.jpeg`;
  if (existsSync(hero45)) {
    await variants(hero45, 'hero-4x5', [640, 1080]);
  } else {
    // Recorte provisional desde el 16:9: altura completa, paraguas y zapatos dentro del encuadre.
    const { width, height } = await sharp(hero).metadata();
    const w = Math.round((height * 4) / 5);
    const left = Math.min(Number(process.env.HERO_45_X ?? Math.round(width * 0.47)), width - w);
    await variants(hero, 'hero-4x5', [640, 1080], { extract: { left, top: 0, width: w, height } });
  }

  console.log('og:image 1200×630');
  await sharp(hero)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .composite([{ input: ogOverlay(1200, 630) }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(`${OUT}/og.jpg`);

  console.log('Favicons');
  const { writeFileSync } = await import('node:fs');
  writeFileSync('public/favicon.svg', faviconSvg);
  await sharp(Buffer.from(faviconSvg)).resize(32, 32).png().toFile('public/favicon-32.png');
  await sharp(Buffer.from(faviconSvg)).resize(180, 180).flatten({ background: '#0C0D0C' }).png().toFile('public/apple-touch-icon.png');

  console.log('Producto 3:4');
  for (const id of ['fragancia', 'chocolate', 'proteina']) {
    await variants(`${SRC}/product-${id}.jpeg`, `product-${id}`, [600, 1000]);
  }
}

function ff(args) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
}

function videos() {
  const list = [
    { id: 'cine', poster: 1.2 },
    { id: 'ugc1', poster: 0.8 },
    {
      id: 'ugc2',
      poster: 1,
      start: Number(process.env.UGC2_START ?? 0),
      duration: Number(process.env.UGC2_DURATION ?? 12),
    },
  ];
  // 720×1280 basta para un 9:16 que en pantalla no pasa de ~80 vh y deja cada pieza en ≤ 4 MB.
  const scale = 'scale=720:1280:flags=lanczos,fps=30';

  for (const v of list) {
    const input = `${SRC}/video-${v.id}.mov`;
    if (!existsSync(input)) {
      console.warn(`  falta ${input}, se omite`);
      continue;
    }
    const cut = v.start !== undefined ? ['-ss', String(v.start), '-t', String(v.duration)] : [];
    console.log(`Vídeo ${v.id}`);
    ff([...cut, '-i', input, '-vf', scale, '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '24',
      '-maxrate', '2800k', '-bufsize', '5600k', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      '-c:a', 'aac', '-b:a', '96k', '-ac', '2', `${OUT}/video-${v.id}.mp4`]);
    ff([...cut, '-i', input, '-vf', scale, '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '2400k', '-row-mt', '1',
      '-deadline', 'good', '-cpu-used', '2', '-c:a', 'libopus', '-b:a', '80k', `${OUT}/video-${v.id}.webm`]);
    // Póster: fotograma limpio del arranque (relativo al recorte, si lo hay).
    const at = (v.start ?? 0) + v.poster;
    ff(['-ss', String(at), '-i', input, '-frames:v', '1', '-vf', 'scale=720:1280:flags=lanczos', '-q:v', '3',
      `${OUT}/video-${v.id}-poster.jpg`]);
    console.log(`  mp4 ${kb(`${OUT}/video-${v.id}.mp4`)} · webm ${kb(`${OUT}/video-${v.id}.webm`)}`);
  }
}

if (only !== 'videos') await images();
if (only !== 'images') videos();
console.log('Listo.');
