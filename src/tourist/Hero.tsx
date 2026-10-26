import type { Beach } from '../types/monitoring';

const QUICK_LINKS = [
  { href: '#conditions', label: 'Conditions' },
  { href: '#help', label: 'Emergency guidance' },
] as const;

/**
 * Welcome banner. The artwork is an original, theme-aware illustration drawn in SVG, so it needs
 * no photo licence, adds no image download and stays small so safety information is not pushed down.
 */
export function Hero({
  beach,
  beaches,
  onSelect,
}: {
  beach: Beach;
  beaches: readonly Beach[];
  onSelect: (id: Beach['id']) => void;
}) {
  return (
    <section className="vs-hero" aria-labelledby="vs-hero-title">
      <svg className="vs-hero__scene" viewBox="0 0 520 220" preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false">
        <circle className="vs-scene__sun" cx="400" cy="62" r="34" />
        <circle className="vs-scene__halo" cx="400" cy="62" r="54" />
        <path className="vs-scene__wave1" d="M0 120c60-18 100 14 170 0s110-22 180-4 120 18 170 0V220H0z" />
        <path className="vs-scene__wave2" d="M0 146c70-16 110 12 180 0s120-18 190 0 110 14 150-2V220H0z" />
        <path className="vs-scene__wave3" d="M0 172c80-14 120 10 200 0s130-14 200 2 90 8 120-2V220H0z" />
        <path className="vs-scene__sand" d="M0 196c90-10 160-6 260 2s180 6 260-6V220H0z" />
      </svg>

      <div className="vs-hero__body">
        <p className="vs-hero__eyebrow">Visitor safety information Â· Andhra Pradesh</p>
        <h1 id="vs-hero-title" className="vs-hero__title">
          Welcome to {beach.name}
        </h1>
        <p className="vs-hero__lead">
          Check modelled sea conditions and a provisional indicator. Follow posted warnings and lifeguard guidance.
        </p>

        <div className="vs-hero__row">
          <div className="vs-beachpick" role="group" aria-label="Choose a beach">
            {beaches.map((item) => {
              const active = item.id === beach.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={active ? 'vs-beachpick__btn is-active' : 'vs-beachpick__btn'}
                  aria-pressed={active}
                  onClick={() => onSelect(item.id)}
                >
                  <span className="vs-beachpick__name">{item.name}</span>
                  <span className="vs-beachpick__coords">
                    {item.lat.toFixed(4)}Â° N Â· {item.lng.toFixed(4)}Â° E
                  </span>
                </button>
              );
            })}
          </div>
          <nav className="vs-quick" aria-label="Jump to a section">
            {QUICK_LINKS.map((link) => (
              <a key={link.href} className="vs-chip-link" href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
