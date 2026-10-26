import { RiskIcon } from '../components/ui/icons';
import { formatAge, formatDateTime } from './format';
import type { RiskLevel, RiskResponse } from './types';
import { useResource } from './useResource';
import { VisitorIcon } from './visitorIcons';

const LABELS: Record<RiskLevel, string> = {
  red: 'Critical',
  orange: 'Elevated',
  yellow: 'Moderate',
  green: 'Low (provisional)',
  gray: 'Not assessed',
};

const LIMITATION =
  'This is a prototype indicator based only on one modelled wave-height forecast. It cannot detect rip currents or local hazards, it is not an official assessment, and a low reading never means the beach is safe. Check posted signs and any lifeguard guidance on the beach.';

export function RiskCard({ beachId, beachName }: { beachId: string; beachName: string }) {
  const { state, reload } = useResource<RiskResponse>(`/api/risk?beachId=${encodeURIComponent(beachId)}`, false);

  // The API answers with an "insufficient evidence" assessment (and an error status) when forecast data is missing.
  const assessment =
    state.kind === 'ok' ? state.data.assessment : state.kind === 'error' ? (state.body?.assessment ?? null) : null;
  const evidence = state.kind === 'ok' ? state.data.evidence : null;
  const level: RiskLevel = assessment?.level ?? 'gray';

  return (
    <section className="vs-card vs-riskcard" aria-labelledby="vs-risk-heading">
      <header className="vs-card__head">
        <div className="vs-card__titles">
          <span className="vs-card__icon">
            <VisitorIcon name="wave" size={20} />
          </span>
          <div>
            <h2 id="vs-risk-heading" className="vs-card__title">
              Provisional beach indicator
            </h2>
            <span className="vs-card__meta">{beachName}</span>
          </div>
        </div>
        <span className="vs-badge">Model forecast</span>
      </header>

      <div className="vs-riskcard__body">
        {state.kind === 'loading' && (
          <p className="vs-hint" role="status">
            Loading the indicator… the first request after a quiet period can take up to a minute.
          </p>
        )}

        {state.kind === 'error' && !assessment && (
          <div role="alert">
            <p className="vs-rlevel risk-gray">
              <RiskIcon level="gray" />
              Unavailable
            </p>
            <p className="vs-hint">
              The indicator could not be loaded: {state.message} This does not mean conditions are safe.
            </p>
            <button type="button" className="vs-btn" onClick={reload}>
              Try again
            </button>
          </div>
        )}

        {assessment && (
          <div className={`risk-${level}`}>
            <p className="vs-rlevel">
              <RiskIcon level={level} />
              {LABELS[level]}
            </p>
            {assessment.assessmentStatus === 'insufficient-evidence' && (
              <p className="vs-riskcard__sub">There is not enough current forecast data to assess this beach.</p>
            )}
            <ul className="vs-riskcard__reasons">
              {assessment.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p className="vs-mono">
              {evidence
                ? `Modelled forecast · ${evidence.source} · ${formatDateTime(evidence.modelTime)} (${formatAge(evidence.modelAgeSeconds)})`
                : 'No current forecast evidence is available.'}
            </p>
            {evidence?.warning && <p className="vs-error">{evidence.warning}</p>}
            {state.kind === 'error' && (
              <button type="button" className="vs-btn" onClick={reload}>
                Try again
              </button>
            )}
          </div>
        )}

        <p className="vs-callout" role="note">
          <VisitorIcon name="info" size={20} />
          <span>
            <strong>Please read.</strong> {LIMITATION}
          </span>
        </p>
      </div>
    </section>
  );
}
