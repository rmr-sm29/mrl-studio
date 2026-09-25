import type { ReactNode } from 'react';
import { Wordmark } from '../components/Wordmark';
import { Footer } from '../components/Footer';
import { CookieBanner } from '../components/CookieBanner';
import { site } from '../content';
import { openConsentSettings } from '../consent';

// ⚠️ Los datos entre [corchetes] son del titular y deben completarse antes de publicar.
// Texto base orientativo (LSSI-CE, RGPD, LOPDGDD): conviene que lo revise un profesional.
const HOLDER = {
  name: '[Nombre y apellidos o razón social]',
  nif: '[NIF/CIF]',
  address: '[Domicilio completo]',
};
const email = site.email || '[email de contacto]';
const updated = '24 de septiembre de 2026';

const PROVIDER = 'Cal.com';

const pages: Record<'aviso-legal' | 'privacidad' | 'cookies', { title: string; body: ReactNode }> = {
  'aviso-legal': {
    title: 'Aviso legal',
    body: (
      <>
        <h2>Titular del sitio web</h2>
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio
          Electrónico (LSSI-CE), se informa de los datos del titular de este sitio web, que opera bajo la marca comercial
          mrl. studio:
        </p>
        <ul>
          <li>Titular: {HOLDER.name}</li>
          <li>NIF: {HOLDER.nif}</li>
          <li>Domicilio: {HOLDER.address}</li>
          <li>Email: {email}</li>
        </ul>
        <h2>Objeto</h2>
        <p>
          Este sitio presenta los servicios de producción de contenido publicitario generado con inteligencia artificial y
          permite reservar una videollamada informativa.
        </p>
        <h2>Propiedad intelectual</h2>
        <p>
          Los contenidos del sitio (textos, imágenes, vídeos, marca y diseño) pertenecen al titular o se usan con licencia.
          Queda prohibida su reproducción, distribución o transformación sin autorización expresa.
        </p>
        <h2>Contenido generado con IA</h2>
        <p>
          Las piezas del portfolio se han producido con herramientas de inteligencia artificial generativa para la marca
          propia mrl. y no representan a personas reales ni a clientes.
        </p>
        <h2>Responsabilidad</h2>
        <p>
          El titular no se responsabiliza del uso que terceros hagan de la información publicada ni de los contenidos de
          sitios externos enlazados.
        </p>
        <h2>Legislación aplicable</h2>
        <p>Este aviso se rige por la legislación española.</p>
      </>
    ),
  },
  privacidad: {
    title: 'Política de privacidad',
    body: (
      <>
        <h2>Responsable del tratamiento</h2>
        <p>
          {HOLDER.name}, NIF {HOLDER.nif}, {HOLDER.address}. Contacto: {email}.
        </p>
        <h2>Qué datos tratamos</h2>
        <p>
          Los que facilitas al reservar una llamada: nombre, marca, email, teléfono (opcional), web o perfil de Instagram y
          el tipo de servicio que te interesa.
        </p>
        <h2>Finalidad y base legal</h2>
        <ul>
          <li>Gestionar la reserva y celebrar la videollamada: aplicación de medidas precontractuales a petición tuya (art. 6.1.b RGPD).</li>
          <li>Responder a tus consultas y, en su caso, enviarte una propuesta: interés legítimo y medidas precontractuales.</li>
        </ul>
        <p>No se toman decisiones automatizadas ni se elaboran perfiles.</p>
        <h2>Destinatarios</h2>
        <p>
          No se ceden datos a terceros salvo obligación legal. Actúan como encargados del tratamiento: {PROVIDER} (gestión
          del calendario de reservas) y Vercel Inc. (alojamiento web). Ambos pueden tratar datos fuera del Espacio
          Económico Europeo, con las garantías del Marco de Privacidad de Datos UE-EE. UU. o cláusulas contractuales tipo
          aprobadas por la Comisión Europea.
        </p>
        <h2>Conservación</h2>
        <p>
          Mientras dure la relación precontractual o comercial y, después, durante los plazos legales de prescripción. Si
          no llegamos a trabajar juntos, los datos se suprimen en un plazo máximo de [12] meses.
        </p>
        <h2>Tus derechos</h2>
        <p>
          Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo
          a {email}. Si consideras que el tratamiento no es correcto, puedes reclamar ante la Agencia Española de Protección
          de Datos (<a href="https://www.aepd.es" rel="noopener">aepd.es</a>).
        </p>
      </>
    ),
  },
  cookies: {
    title: 'Política de cookies',
    body: (
      <>
        <h2>Qué usamos</h2>
        <ul>
          <li>
            <strong>Almacenamiento técnico propio</strong> (<code>mrl-consent</code>, localStorage): recuerda tu elección
            sobre cookies. Es necesario y no requiere consentimiento.
          </li>
          <li>
            <strong>Cookies de terceros de {PROVIDER}</strong>: se instalan solo si aceptas, al cargar el calendario de
            reservas embebido. Sirven para su funcionamiento (sesión, zona horaria, seguridad).
          </li>
        </ul>
        <p>Este sitio no usa cookies analíticas ni publicitarias.</p>
        <h2>Cómo cambiar tu elección</h2>
        <p>
          Puedes cambiarla en cualquier momento desde{' '}
          <button type="button" className="linklike" onClick={openConsentSettings}>
            configurar cookies
          </button>{' '}
          o borrando los datos del sitio en tu navegador.
        </p>
      </>
    ),
  },
};

export function LegalPage({ page }: { page: keyof typeof pages }) {
  const { title, body } = pages[page] ?? pages['aviso-legal'];
  return (
    <>
      <header className="header legal-header is-solid">
        <div className="header__inner">
          <a href="/" aria-label="mrl. studio, volver a la página principal">
            <Wordmark />
          </a>
        </div>
      </header>
      <main className="legal">
        <div className="container">
          <h1>{title}</h1>
          <p className="legal__meta">Última actualización: {updated}</p>
          {body}
        </div>
      </main>
      <Footer />
      <CookieBanner />
    </>
  );
}
