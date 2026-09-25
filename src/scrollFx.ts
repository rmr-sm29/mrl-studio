// Animaciones ligadas al scroll.
// Navegadores con scroll-driven animations (Chrome, Edge, Safari 26+): todo lo hace el CSS con
// `animation-timeline: view()`, sin JS. En el resto (Firefox) se degrada a un revelado al entrar en viewport.
export function initScrollFx() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || CSS.supports('animation-timeline: view()')) return () => {};

  document.documentElement.classList.add('sd-fallback');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  const observe = () => document.querySelectorAll('.sd-grow:not(.is-in), .sd-rise:not(.is-in)').forEach((el) => io.observe(el));
  observe();
  // Elementos que aparecen después (p. ej. el calendario tras aceptar cookies)
  const mo = new MutationObserver(observe);
  mo.observe(document.body, { childList: true, subtree: true });
  return () => {
    io.disconnect();
    mo.disconnect();
  };
}
