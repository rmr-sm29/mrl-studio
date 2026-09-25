// Rutas de los assets procesados por `npm run assets` (ver scripts/process-assets.mjs).
export const heroSizes = { wide: [1280, 1920, 2752], tall: [640, 1080] };
export const productSizes = [600, 1000];

export const srcset = (base: string, widths: number[], ext: string) =>
  widths.map((w) => `/media/${base}-${w}.${ext} ${w}w`).join(', ');

export const video = (id: string) => ({
  webm: `/media/video-${id}.webm`,
  mp4: `/media/video-${id}.mp4`,
  poster: `/media/video-${id}-poster.jpg`,
});
