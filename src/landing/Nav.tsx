import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ThemeSelector } from '../components/ui/ThemeSelector';
import { useMediaQuery, useWindowScrolled } from '../hooks/browserHooks';
import { NAV_LINKS } from './content';

// The full bar (brand, four links, theme selector, two buttons) needs about 1,010px of content
// width. Below this the menu button is used instead, so nothing can run off the screen.
const COMPACT_QUERY = '(max-width: 1120px)';

type NavProps = {
  /** Sign-in controls supplied by the app (kept out of this component so auth stays in one place). */
  authSlot?: ReactNode;
  activeId: string | null;
};

function BrandMark() {
  return (
    <svg className="bs-brand__mark" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round">
        <path d="M2 7.5c2.2-2.2 4.4-2.2 6.6 0s4.4 2.2 6.6 0 4.4-2.2 6.8 0" />
        <path d="M2 12.5c2.2-2.2 4.4-2.2 6.6 0s4.4 2.2 6.6 0 4.4-2.2 6.8 0" />
        <path d="M2 17.5c2.2-2.2 4.4-2.2 6.6 0s4.4 2.2 6.6 0 4.4-2.2 6.8 0" />
      </g>
    </svg>
  );
}

export function Nav({ authSlot, activeId }: NavProps) {
  const isCompact = useMediaQuery(COMPACT_QUERY);
  const scrolled = useWindowScrolled(8);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const navRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuOpen = open && isCompact;

  // Leaving the compact layout always closes the menu.
  useEffect(() => {
    const mql = window.matchMedia(COMPACT_QUERY);
    const close = () => setOpen(false);
    mql.addEventListener('change', close);
    return () => mql.removeEventListener('change', close);
  }, []);

  // While open: Escape and clicks outside the nav close the menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (navRef.current && event.target instanceof Node && !navRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [menuOpen]);

  const links = NAV_LINKS.map((link) => (
    <li key={link.id}>
      <a
        className="bs-nav__link"
        href={`#${link.id}`}
        aria-current={activeId === link.id ? 'location' : undefined}
        onClick={() => setOpen(false)}
      >
        {link.label}
      </a>
    </li>
  ));

  return (
    <nav ref={navRef} className="bs-nav" data-solid={scrolled || menuOpen} aria-label="Primary">
      <div className="bs-container bs-nav__bar">
        <a className="bs-brand" href="#top" aria-label="Beach Safety Intelligence Platform, back to top">
          <BrandMark />
          <span className="bs-brand__text">
            BEACH SAFETY<span className="bs-brand__sub"> / INTELLIGENCE</span>
          </span>
        </a>

        {isCompact ? (
          <button
            ref={buttonRef}
            type="button"
            className="bs-menu-btn"
            aria-expanded={menuOpen}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
          >
            {menuOpen ? 'CLOSE' : 'MENU'}
          </button>
        ) : (
          <>
            <ul className="bs-nav__links">{links}</ul>
            <div className="bs-nav__theme">
              <ThemeSelector />
            </div>
            {authSlot ? <div className="bs-nav__auth">{authSlot}</div> : null}
          </>
        )}
      </div>

      {menuOpen ? (
        <div id={panelId} className="bs-nav__panel">
          <div className="bs-container">
            <ul className="bs-nav__panel-links">{links}</ul>
            <div className="bs-nav__theme bs-nav__theme--panel">
              <ThemeSelector />
            </div>
            {authSlot ? <div className="bs-nav__panel-auth">{authSlot}</div> : null}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
