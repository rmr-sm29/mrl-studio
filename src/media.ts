// Rutas de los assets procesados por `npm run assets` (ver scripts/process-assets.mjs).
export const sizes = {
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

// Parche 3: recursos del portfolio (public/media/portfolio), solo WebP en imagen y WebM + MP4 en vídeo.
export const portfolioImg = (id: string) => `/media/portfolio/img/${id}.webp`;

export const portfolioVideo = (id: string) => ({
  webm: `/media/portfolio/video/${id}.webm`,
  mp4: `/media/portfolio/video/${id}.mp4`,
  poster: `/media/portfolio/video/${id}-poster.jpg`,
});
