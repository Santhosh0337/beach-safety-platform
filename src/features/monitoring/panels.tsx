import { DataBadge } from '../../components/ui/DataBadge';
import { RiskIcon } from '../../components/ui/icons';
import { SIMULATED_ENVIRONMENT, SIMULATED_INCIDENTS, SIMULATED_ZONES } from '../../data/demo';
import type { HealthState } from '../../hooks/useApiHealth';
import type { Beach, MetricId, RiskLevel } from '../../types/monitoring';

const RISK_LABELS: Record<RiskLevel, string> = {
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  gray: 'Gray',
};

// Category definitions only. No numeric thresholds are shown because the risk
// engine does not exist yet and the categories are provisional.
const LEGEND: readonly { level: RiskLevel; meaning: string }[] = [
  {
    level: 'red',
    meaning: 'Official closure, verified critical hazard or critical override.',
  },
  { level: 'orange', meaning: 'Elevated risk indicated by an assessment.' },
  { level: 'yellow', meaning: 'Moderate risk indicated by an assessment.' },
  {
    level: 'green',
    meaning:
      'Low risk indicated, only with fresh, complete evidence and no overrides.',
  },
  {
    level: 'gray',
    meaning: 'Unknown, stale or insufficient evidence. Not an indication of safety.',
  },
];

const METRICS: readonly { id: MetricId; label: string }[] = [
  { id: 'wave-height', label: 'Wave height' },
  { id: 'wave-period', label: 'Wave period' },
  { id: 'wind-speed', label: 'Wind speed' },
  { id: 'sea-temperature', label: 'Sea temperature' },
];

const DATA_SOURCES: readonly { name: string; detail: string }[] = [
  { name: 'Map tiles and coastline', detail: 'Not connected' },
  { name: 'Marine and weather model', detail: 'Not connected' },
  { name: 'Official advisories (IMD, INCOIS)', detail: 'Not connected' },
  { name: 'Authority-entered hazards', detail: 'Not connected' },
  { name: 'Incident reports', detail: 'Not connected' },
];

export function DisclaimerBanner() {
  return (
    <section className="banner banner-proto" aria-label="Prototype disclaimer">
      <span className="tag-proto">PROTOTYPE</span>
      <div className="banner-body">
        <p>
          <strong>Not an authoritative or emergency system.</strong> This is a
          hackathon prototype. Nothing on this page is official safety
          information, a warning or a risk assessment.
        </p>
        <p className="banner-note">
          General guidance, not a feature of this platform: in an emergency in
          India, call <strong>112</strong>.
        </p>
      </div>
    </section>
  );
}

export function AuthNotice() {
  return (
    <section className="banner banner-auth" aria-label="Access notice">
      <div className="banner-body">
        <p>
          <strong>Access notice:</strong> authentication and authority-role
          authorization are not enforced in this prototype. Anyone can view this
          page. Signing in does not make you an authorized official, and no role
          is checked.
        </p>
      </div>
    </section>
  );
}

export function SimulatedBanner({ beach }: { beach: Beach }) {
  return (
    <div className="banner banner-sim" role="status">
      <DataBadge provenance="simulated" />
      <div className="banner-body">
        <p>
          Simulated demonstration data is shown below. These are samples, not
          real conditions, assessments or incidents at {beach.name}.
        </p>
      </div>
    </div>
  );
}

export function EnvironmentStrip({
  beach,
  showSimulated,
}: {
  beach: Beach;
  showSimulated: boolean;
}) {
  return (
    <section className="panel" aria-labelledby="env-heading">
      <div className="panel-head">
        <h2 id="env-heading" className="panel-title">
          Environmental conditions · {beach.name}
        </h2>
      </div>
      <p className="panel-note">
        When connected, these values will come from a regional forecast model
        with a resolution of several kilometres. They describe the whole beach
        area and are not measurements for individual zones.
      </p>
      <ul className="metrics">
        {METRICS.map((metric) => {
          const sample = showSimulated ? SIMULATED_ENVIRONMENT[metric.id] : undefined;
          return (
            <li key={metric.id} className={sample ? 'metric is-sim' : 'metric'}>
              <span className="metric-label">{metric.label}</span>
              {sample ? (
                <>
                  <span className="metric-value">
                    {sample.value}
                    <span className="metric-unit"> {sample.unit}</span>
                  </span>
                  <DataBadge provenance="simulated" />
                  <span className="metric-meta">Source: simulated sample</span>
                  <span className="metric-meta">Updated: not applicable</span>
                </>
              ) : (
                <>
                  <span className="metric-value metric-empty">No data</span>
                  <DataBadge provenance="unavailable" />
                  <span className="metric-meta">Source: not connected</span>
                  <span className="metric-meta">Updated: n/a</span>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function RiskLegend() {
  return (
    <div className="legend">
      <h3 className="legend-title">Risk categories</h3>
      <ul className="legend-list">
        {LEGEND.map((item) => (
          <li key={item.level} className={`legend-item risk-${item.level}`}>
            <span className="risk-mark">
              <RiskIcon level={item.level} />
              <span className="risk-name">{RISK_LABELS[item.level]}</span>
            </span>
            <span className="legend-meaning">{item.meaning}</span>
          </li>
        ))}
      </ul>
      <p className="panel-note">
        Provisional prototype categories, not validated safety standards. The
        risk engine is not built, so no zone has been assessed.
      </p>
    </div>
  );
}

export function MapPlaceholder({ beach }: { beach: Beach }) {
  return (
    <section className="panel map-panel" aria-labelledby="map-heading">
      <div className="panel-head">
        <h2 id="map-heading" className="panel-title">
          Coastal monitoring map · {beach.name}
        </h2>
        <span className="panel-sub">
          {beach.locality}, {beach.state}
        </span>
      </div>
      <div className="map-stage">
        <DataBadge provenance="unavailable" />
        <p className="map-title">Map not connected</p>
        <p className="map-text">
          The interactive map, verified coastline boundary and hexagonal zones
          are added in a later step. Nothing is drawn here because no verified
          geographic data has been loaded.
        </p>
      </div>
      <RiskLegend />
    </section>
  );
}

export function ZonesPanel({
  beach,
  showSimulated,
}: {
  beach: Beach;
  showSimulated: boolean;
}) {
  const zones = showSimulated
    ? SIMULATED_ZONES.filter((zone) => zone.beachId === beach.id)
    : [];

  return (
    <section className="panel" aria-labelledby="zones-heading">
      <div className="panel-head">
        <h2 id="zones-heading" className="panel-title">
          Hazard zones
        </h2>
        <DataBadge provenance={zones.length > 0 ? 'simulated' : 'unavailable'} />
      </div>
      {zones.length === 0 ? (
        <div className="empty">
          <p className="empty-title">No data</p>
          <p className="empty-text">
            No zone has been assessed. The risk engine and verified zone
            boundaries are not built yet.
          </p>
        </div>
      ) : (
        <ul className="rows is-sim">
          {zones.map((zone) => (
            <li key={zone.id} className={`row risk-${zone.level}`}>
              <span className="risk-mark">
                <RiskIcon level={zone.level} />
                <span className="risk-name">{RISK_LABELS[zone.level]}</span>
              </span>
              <span className="row-main">
                <span className="row-title">{zone.label}</span>
                <span className="row-text">{zone.summary}</span>
              </span>
              <DataBadge provenance={zone.provenance} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function IncidentsPanel({
  beach,
  showSimulated,
}: {
  beach: Beach;
  showSimulated: boolean;
}) {
  const incidents = showSimulated
    ? SIMULATED_INCIDENTS.filter((incident) => incident.beachId === beach.id)
    : [];

  return (
    <section className="panel" aria-labelledby="incidents-heading">
      <div className="panel-head">
        <h2 id="incidents-heading" className="panel-title">
          Incidents
        </h2>
        <DataBadge provenance={incidents.length > 0 ? 'simulated' : 'unavailable'} />
      </div>
      {incidents.length === 0 ? (
        <div className="empty">
          <p className="empty-title">No data</p>
          <p className="empty-text">
            Incident reporting is not connected. No incident information is
            available.
          </p>
        </div>
      ) : (
        <ul className="rows is-sim">
          {incidents.map((incident) => (
            <li key={incident.id} className="row">
              <span className="row-main">
                <span className="row-title">{incident.label}</span>
                <span className="row-text">{incident.status}</span>
              </span>
              <DataBadge provenance={incident.provenance} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function DataSourcesPanel() {
  return (
    <section className="panel" aria-labelledby="sources-heading">
      <div className="panel-head">
        <h2 id="sources-heading" className="panel-title">
          Data sources
        </h2>
      </div>
      <ul className="rows">
        {DATA_SOURCES.map((source) => (
          <li key={source.name} className="row">
            <span className="row-main">
              <span className="row-title">{source.name}</span>
            </span>
            <span className="row-status">{source.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PageFooter({ health }: { health: HealthState }) {
  return (
    <footer className="page-foot">
      <p>
        <strong>What the API status means:</strong> it only confirms that the
        health endpoint answered. It does not verify the database connection or
        sign-in-protected endpoints. Greyed navigation items (Incidents,
        Advisories, Analytics, Settings) are planned and not available.
      </p>
      <details className="api-details">
        <summary>API response details</summary>
        {health.kind === 'loading' && <p>Checking…</p>}
        {health.kind === 'error' && <p>Request failed: {health.message}</p>}
        {health.kind === 'ok' && (
          <>
            <pre>{JSON.stringify(health.data, null, 2)}</pre>
            <p className="panel-note">
              The “environment” value is a fallback label from the health
              handler. It does not identify where the application is running.
            </p>
          </>
        )}
      </details>
    </footer>
  );
}
