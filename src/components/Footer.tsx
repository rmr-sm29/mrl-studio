import { footer, site } from '../content';
import { Wordmark } from './Wordmark';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <a href="/" aria-label="mrl. studio, inicio">
            <Wordmark />
          </a>
          <p className="footer__tagline">{footer.tagline}</p>
        </div>
        <ul className="footer__contact">
          <li>
            <a href={site.instagramUrl} rel="noopener" target="_blank">
              Instagram · {site.instagram}
            </a>
          </li>
          {site.email && (
            <li>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </li>
          )}
        </ul>
        <ul className="footer__legal">
          {footer.legal.map((l) => (
            <li key={l.href}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ul>
        <p className="footer__copy">{footer.copyright}</p>
      </div>
    </footer>
  );
}
