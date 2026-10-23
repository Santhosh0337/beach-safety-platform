import { OceanWaves } from '../components/ocean/OceanWaves';
import { Arrow } from './ui';

export function Hero() {
  return (
    <section id="top" className="bs-hero" aria-labelledby="hero-title">
      <OceanWaves />
      <div className="bs-hero__shade" aria-hidden="true" />
      <div className="bs-hero__vignette" aria-hidden="true" />

      <div className="bs-container bs-hero__content">
        <p className="bs-label bs-hero__eyebrow">ANDHRA PRADESH · 974 KM OF COASTLINE</p>
        <h1 id="hero-title" className="bs-h-display">
          <span className="bs-line">Know the water</span>
          <span className="bs-line">before you enter it.</span>
        </h1>
        <p className="bs-body-lg bs-hero__lead">
          A coastal safety intelligence prototype. Beach-zone risk, advisories and incident
          coordination, explained in plain terms.
        </p>
        <div className="bs-actions">
          <a className="bs-btn bs-btn--primary" href="#platform">
            Explore platform
          </a>
          <a className="bs-btn bs-btn--secondary" href="#roles">
            View roles
          </a>
        </div>
      </div>

      <div className="bs-container bs-hero__foot">
        <div className="bs-card bs-notice" role="note">
          <p className="bs-label">PROTOTYPE</p>
          <p className="bs-body-sm-text">
            Nothing on this page is live data. This is not an official warning system and must
            not be used in an emergency.
          </p>
          <a className="bs-tertiary" href="#risk">
            How risk is explained <Arrow />
          </a>
        </div>
      </div>
    </section>
  );
}
