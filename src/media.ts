// Rutas de los assets procesados por `npm run assets` (ver scripts/process-assets.mjs).
export const sizes = {
  heroDesktop: [1280, 1920, 2752],
  heroMobile: [720, 1080, 1536],
  product: [600, 1000],
  still: [360, 540],
  dial: [1280, 1920, 2752],
};

export const srcset = (base: string, widths: number[], ext: string) =>
  widths.map((w) => `/media/${base}-${w}.${ext} ${w}w`).join(', ');

export const video = (id: string) => ({
  webm: `/media/video-${id}.webm`,
  mp4: `/media/video-${id}.mp4`,
  poster: `/media/video-${id}-poster.jpg`,
});
