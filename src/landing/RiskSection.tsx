import { useState } from 'react';
import { PRINCIPLES, RISK_STATES } from './content';
import { SectionHeader } from './ui';

export function RiskSection() {
  const [selectedId, setSelectedId] = useState<string>('gray');
  const selected = RISK_STATES.find((state) => state.id === selectedId) ?? RISK_STATES[0];
  if (!selected) return null;

  return (
    <section id="risk" className="bs-section bs-section--surface" aria-labelledby="risk-title">
      <div className="bs-container">
        <SectionHeader
          index="03"
          label="RISK MODEL"
          titleId="risk-title"
          title="Honest about what is not known."
          intro="Five states, each with a fixed meaning. The colour never stands alone: every rating comes with its reasons, sources and timestamps."
        />

        <div className="bs-risk">
          <div className="bs-statelist" role="group" aria-label="Risk states">
            {RISK_STATES.map((state) => (
              <button
                key={state.id}
                type="button"
                className="bs-state"
                aria-pressed={state.id === selectedId}
                onClick={() => setSelectedId(state.id)}
              >
                <span className="bs-dot" style={{ backgroundColor: state.color }} aria-hidden="true" />
                <span className="bs-state__label">{state.label}</span>
                <span className="bs-state__tag">{state.tag}</span>
              </button>
            ))}
          </div>

          <div className="bs-card bs-statepanel" aria-live="polite">
            <p className="bs-label bs-muted">STATE / {selected.tag}</p>
            <div className="bs-statepanel__title">
              <span className="bs-dot bs-dot--lg" style={{ backgroundColor: selected.color }} aria-hidden="true" />
              <h3 className="bs-h-md">{selected.label}</h3>
            </div>
            <p className="bs-body-lg">{selected.meaning}</p>
            <p className="bs-body-sm-text bs-note">
              Risk ratings are provisional prototype settings, not validated safety standards.
            </p>
          </div>
        </div>

        <ul className="bs-grid bs-grid--3 bs-list-reset bs-principles">
          {PRINCIPLES.map((principle) => (
            <li key={principle.index} className="bs-card bs-feature">
              <p className="bs-label bs-muted">{principle.index}</p>
              <h3 className="bs-h-sm">{principle.title}</h3>
              <p className="bs-body-md bs-muted">{principle.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
