import { useState } from 'react';
import { BEACHES, DEFAULT_BEACH_ID } from '../data/beaches';
import type { BeachId } from '../types/monitoring';
import { ConditionTiles } from './ConditionTiles';
import { Hero } from './Hero';
import { RiskCard } from './RiskCard';
import { TouristTopBar } from './TouristTopBar';
import { VisitorIcon } from './visitorIcons';
import './visitor.css';

export function TouristPage() {
  const [beachId, setBeachId] = useState<BeachId>(DEFAULT_BEACH_ID);
  const beach = BEACHES.find((item) => item.id === beachId) ?? BEACHES[0];

  return (
    <div className="vs">
      <a className="vs-skip" href="#main">Skip to main content</a>
      <TouristTopBar />

      <div className="vs-emergency" role="note">
        <div className="vs-wrap vs-emergency__in">
          <p className="vs-emergency__text">
            <VisitorIcon name="phone" size={20} />
            <span>
              <strong>Real emergency in India? Call 112.</strong>{' '}
              This hackathon prototype does not contact emergency services,
              police or lifeguards. Its forecast and indicator are not official safety information.
            </span>
          </p>
          <a className="vs-btn vs-btn--sos" href="tel:112">Call 112</a>
        </div>
      </div>

      <main id="main" className="vs-main vs-wrap" tabIndex={-1}>
        <Hero beach={beach} beaches={BEACHES} onSelect={setBeachId} />

        <section id="conditions" className="vs-section" aria-labelledby="vs-conditions-title">
          <div className="vs-section__head">
            <h2 id="vs-conditions-title" className="vs-h2">Conditions near {beach.name}</h2>
            <p className="vs-hint">
              Modelled forecast information, not direct measurements at the beach.
            </p>
          </div>
          <div className="vs-conditions">
            <RiskCard beachId={beach.id} beachName={beach.name} />
            <ConditionTiles beachId={beach.id} beachName={beach.name} />
          </div>
        </section>

        <section id="help" className="vs-section" aria-labelledby="vs-help-title">
          <div className="vs-section__head">
            <h2 id="vs-help-title" className="vs-h2">Need help?</h2>
            <p className="vs-hint">
              Reporting and case-submission services are not available in this version.
              For a real emergency in India, call 112.
            </p>
          </div>
          <div className="vs-panel">
            <div className="vs-panel__inner">
              <h3 className="vs-panel__title">
                <VisitorIcon name="phone" size={20} /> Emergency guidance
              </h3>
              <p>
                Follow instructions from lifeguards and local authorities, and observe
                posted beach warnings. Do not rely on this prototype to decide whether
                entering the water is safe.
              </p>
              <a className="vs-btn vs-btn--sos" href="tel:112">Call 112</a>
            </div>
          </div>
        </section>

        <p className="vs-foot">
          Prototype limitations: forecasts may be delayed or unavailable; the indicator
          uses limited modelled evidence and cannot detect rip currents or all local hazards.
          No emergency dispatch, reporting, case management or notification service is provided here.
        </p>
      </main>
    </div>
  );
}
