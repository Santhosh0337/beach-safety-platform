import { NAV_LINKS } from './content';
import { Arrow } from './ui';

export function Footer() {
  return (
    <footer className="bs-footer">
      <div className="bs-container bs-footer__grid">
        <div className="bs-footer__about">
          <p className="bs-label">BEACH SAFETY INTELLIGENCE PLATFORM</p>
          <p className="bs-body-md bs-muted">
            A prototype for coastal safety in Andhra Pradesh. It is not an official warning system.
          </p>
          <p className="bs-body-md">In an emergency, call 112.</p>
        </div>

        <nav className="bs-footer__nav" aria-label="Footer">
          <ul className="bs-list-reset">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <a className="bs-nav__link" href={`#${link.id}`}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a className="bs-tertiary" href="#top">
            Back to top <Arrow />
          </a>
        </nav>
      </div>
    </footer>
  );
}
