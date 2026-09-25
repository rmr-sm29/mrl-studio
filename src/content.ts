// Todo el copy de la landing (brief v2).
// Reglas (brief §17): cero resultados de cliente, solo cifras de proceso/mercado verificables, máximo tres acentos
// ámbar por pantalla, un único CTA (agendar), el flash solo en el hero y los plazos solo en VOLT.

export const site = {
  instagram: 'arnaumrl.ai',
  instagramUrl: 'https://www.instagram.com/arnaumrl.ai/',
  email: import.meta.env.VITE_CONTACT_EMAIL ?? '',
  booking: {
    // Cal.com, embebido (brief §12). Ruta del evento, p. ej. "usuario/15min".
    path: import.meta.env.VITE_BOOKING_PATH ?? '',
  },
};

export const nav = [
  { label: 'Trabajo', href: '#trabajo' },
  // Además de navegar, permite saltarse la secuencia del portfolio de un clic.
  { label: 'Método', href: '#metodo' },
  { label: 'FAQ', href: '#faq' },
];

export const hero = {
  hook: 'Cero rodajes, cero esperas',
  line2: 'Consigue anuncios de alta calidad y UGC cada mes, sin rodajes, sin esperas, sin apostarlo todo a una pieza',
  proof: 'Sin castings · Sin rodajes · Licencia comercial completa',
};

export const marquee = {
  top: ['Spot cinematográfico', 'UGC', 'Imagen de producto', 'Packaging'],
  bottom: ['Avatares IA', 'Voz en castellano', 'Color grade', 'Formatos para Meta y TikTok'],
  thumbsTop: ['cine-1', 'fragancia', 'ugc1', 'chocolate'],
  thumbsBottom: ['ugc2', 'cine-3', 'proteina', 'cine-2'],
};

export const portfolio = {
  intro: {
    heading: 'Una marca entera, hecha desde cero.',
    chain: ['Producto', 'Packaging', 'Spot', 'UGC', 'Estáticos'],
    body: 'Si puedo montar una marca entera, puedo montar la tuya.',
  },
  cinematic: {
    title: 'Cinematográfico',
    video: { id: 'cine', meta: '9:16 · Cosmética · 10 s', tech: 'Personaje consistente en exterior con luz natural de atardecer y producto en mano.' },
    stills: [
      { id: 'cine-still-01-detalle', label: 'Detalle' },
      { id: 'cine-still-02-general', label: 'General' },
      { id: 'cine-still-03-producto', label: 'Producto' },
    ],
  },
  ugc: {
    title: 'UGC',
    videos: [
      { id: 'ugc1', meta: '9:16 · Solar facial · 10 s' },
      // Brief v3 · J: clip recortado a 11,4 s (decisión pendiente nº 2 cerrada).
      {
        id: 'ugc2',
        meta: '9:16 · Audio · 11 s',
        tech: 'Cámara frontal en interior con luz de ventana, producto en mano y voz sincronizada en castellano.',
      },
    ],
    avatarLabel: 'Avatares UGC',
    avatarDesc: 'Avatares digitales con consistencia real que escalan el contenido de tu marca los 365 días del año',
    reach: 'Los avatares se reutilizan en cualquier formato: UGC, spot cinematográfico o imagen de producto.',
  },
  products: {
    title: 'Imagen de producto',
    items: [
      { id: 'fragancia', meta: '3:4 · Fragancia', tech: 'Producto en contacto con el rostro, refracción del líquido sobre la piel y wordmark legible en el cristal.' },
      { id: 'chocolate', meta: '3:4 · Alimentación', tech: 'Cenital con packaging abierto, troquelado del producto y textura de migas como prueba de realismo.' },
      { id: 'proteina', meta: '3:4 · Nutrición deportiva', tech: 'Figura sobre fondo limpio, piel con sudor y packaging mate sin reflejos parásitos.' },
    ],
  },
};

export const problem = {
  heading: 'Producir vídeo publicitario cuesta más de lo que parece',
  // Brief v3 · L: 300-400 € (antes 400-800 €).
  stats: [
    { from: 300, to: 400, suffix: ' €', text: 'Lo que cobra un creador UGC por una sola pieza. Sin contar el briefing, los retrasos ni las repeticiones.' },
    { from: 2, to: 3, suffix: ' semanas', text: 'Lo que tarda una producción tradicional desde el brief hasta la entrega. Si hay casting, más.' },
    { to: 1, suffix: ' creatividad', text: 'Lo que puedes testear con ese presupuesto. Si no funciona, vuelta a empezar.' },
  ] as { from?: number; to: number; suffix: string; text: string }[],
  closing: 'El problema casi nunca es el presupuesto. Es no poder probar.',
};

export type VoltKey = 'V' | 'O' | 'L' | 'T';

export const volt = {
  heading: 'Metodología VOLT',
  steps: [
    {
      key: 'V' as VoltKey,
      name: 'Visión',
      what: 'Ángulo de venta, concepto y guion',
      out: 'Concepto + guion aprobado',
      body: 'No se empieza por la imagen, se empieza por qué tiene que vender la pieza. Producto, público y objetivo entran; sale un ángulo y un guion.',
      closing: 'Un vídeo bonito que no vende es un vídeo caro.',
    },
    {
      key: 'O' as VoltKey,
      name: 'Óptica',
      what: 'Dirección de arte: personaje, producto, referencias, storyboard',
      out: 'Storyboard y hoja de personaje',
      body: 'Se fija el personaje, el producto y el lenguaje visual antes de generar un solo fotograma. Hoja de personaje, referencias de luz y color, storyboard plano a plano.',
      closing: 'Apruebas aquí. A partir de este punto, lo que ves es lo que recibes.',
    },
    {
      key: 'L' as VoltKey,
      name: 'Luz',
      what: 'Generación y montaje: tomas, color y audio',
      out: 'Piezas montadas',
      body: 'Generación de las tomas, montaje, etalonaje y audio.',
      closing: 'Montaje, color, voz en castellano y sonido incluidos.',
    },
    {
      key: 'T' as VoltKey,
      name: 'Test',
      what: 'Variantes por plataforma y formatos para testear',
      out: 'Pack de entrega',
      body: 'La pieza no se entrega sola. Salen variantes de gancho y los formatos que necesita cada plataforma.',
      closing: 'Diez versiones donde antes tenías una.',
    },
  ],
  calendar: [
    { day: 'Día 1', step: 'V · Visión' },
    { day: 'Días 2-3', step: 'O · Óptica' },
    { day: 'Días 4-6', step: 'L · Luz' },
    { day: 'Día 7', step: 'T · Test' },
  ],
  closing: 'Solo necesito dos cosas de ti: el brief del día 1 y el visto bueno del día 3. El resto es mío.',
};

export const why = {
  heading: 'Por qué mrl.',
  items: [
    { n: '01', title: 'Criterio de dirección, no de prompt', text: 'La diferencia entre un vídeo generado y un vídeo dirigido no está en el modelo. Está en quién decide el plano.' },
    { n: '02', title: 'Apruebas antes de generar', text: 'Concepto, guion y storyboard pasan por ti. Lo que apruebas es lo que recibes.' },
    { n: '03', title: 'Variantes de serie', text: 'Cada campaña sale con varias versiones de gancho y los formatos de cada plataforma. Testear no es un extra.' },
    { n: '04', title: 'Marca propia, proceso probado', text: 'Antes de venderlo lo monté entero: producto, packaging, spot, UGC y estáticos. El portfolio es el método funcionando de principio a fin.' },
    { n: '05', title: 'Interlocutor único', text: 'Hablas conmigo desde el brief hasta la entrega. Sin cadena de cuentas.' },
  ],
};

// La tercera respuesta depende de políticas de terceros: revisar el día previo al lanzamiento.
export const faq = [
  {
    q: '¿Se nota que el contenido está generado con IA?',
    a: 'Depende enteramente de quién lo dirija. Se nota en la piel plana, en las manos, en el texto del packaging y en los movimientos de cámara imposibles. Todo eso se corrige con criterio de dirección y con postproducción real: textura, etalonaje, grano, sonido. Tienes el portfolio justo arriba para juzgarlo tú.',
  },
  {
    q: '¿Voy a perder la conexión con mi audiencia?',
    a: 'La conexión la construye el mensaje, no la cámara. Un anuncio conecta cuando dice algo que le pasa a quien lo ve. Por eso el método empieza por el guion y no por la imagen: si el ángulo de venta está bien elegido, el formato es un vehículo.',
  },
  {
    q: '¿Instagram puede tumbarme la cuenta por publicar contenido generado con IA?',
    a: 'No. Las plataformas penalizan la suplantación, el contenido engañoso y el spam, no la herramienta con la que se produce. Lo que sí piden algunas es etiquetar el contenido sintético, y eso se hace desde la propia app al publicar.',
  },
  {
    q: '¿Esto vende o solo es bonito?',
    a: 'Un anuncio vende por el ángulo, el gancho y la oferta. Lo que aporta la producción generada es poder probar varias versiones en lugar de apostarlo todo a una, que es exactamente donde se pierde el presupuesto de la mayoría de marcas.',
  },
  {
    q: '¿El algoritmo recorta el alcance si detecta IA?',
    a: 'El alcance lo decide la retención. Si el vídeo aguanta los tres primeros segundos y se ve entero, se distribuye. Esa es la razón de que el guion sea la primera fase del proceso y no la última.',
  },
  {
    q: '¿De quién es el contenido una vez entregado?',
    a: 'Tuyo, con licencia comercial completa. Sin royalties y sin restricciones de uso: anuncios, web, catálogo o redes.',
  },
];

export const closing = {
  heading: 'Cuéntame tu marca en 15 minutos.',
  sub: 'Te digo qué se puede hacer con ella, cómo lo haría y cuánto cuesta. Si no encaja, te lo digo en la llamada.',
  below: 'Sin compromiso. 15 minutos por videollamada.',
};

export const footer = {
  tagline: 'Contenido generado con IA para marcas de producto',
  legal: [
    { label: 'Aviso legal', href: '/aviso-legal' },
    { label: 'Política de privacidad', href: '/privacidad' },
    { label: 'Política de cookies', href: '/cookies' },
  ],
  copyright: '© 2026 mrl. studio',
};
