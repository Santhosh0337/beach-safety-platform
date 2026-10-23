import type { ReactNode } from 'react';
import { DataBadge } from '../../components/ui/DataBadge';
import { RiskIcon } from '../../components/ui/icons';
import { SIMULATED_ENVIRONMENT, SIMULATED_INCIDENTS, SIMULATED_ZONES } from '../../data/demo';
import type { HealthState } from '../../hooks/useApiHealth';
import type { Beach, MapStatus, MetricId, RiskLevel } from '../../types/monitoring';

const RISK_LABELS: Record<RiskLevel, string> = {
  red: 'Critical',
  orange: 'Elevated',
  yellow: 'Moderate',
  green: 'Low risk',
  gray: 'Unknown',
};

const LEGEND: readonly { level: RiskLevel; meaning: string }[] = [
  { level: 'red', meaning: 'Official closure, verified critical hazard or critical override.' },
  { level: 'orange', meaning: 'Elevated risk indicated by an assessment.' },
  { level: 'yellow', meaning: 'Moderate risk indicated by an assessment.' },
  { level: 'green', meaning: 'Low risk indicated, only with fresh, complete evidence and no overrides.' },
  { level: 'gray', meaning: 'Unknown, stale or insufficient evidence. Not an indication of safety.' },
];

const METRICS: readonly { id: MetricId; label: string; symbol: string; unit: string }[] = [
  { id: 'wave-height', label: 'Significant wave height', symbol: 'Hs', unit: 'm' },
  { id: 'wave-period', label: 'Peak wave period', symbol: 'Tp', unit: 's' },
  { id: 'wind-speed', label: 'Surface wind velocity', symbol: 'W10', unit: 'km/h' },
  { id: 'sea-temperature', label: 'Sea surface temperature', symbol: 'SST', unit: '°C' },
];

type SourceRow = { name: string; provider: string; kind: 'basemap' | 'unconnected' };

const DATA_SOURCES: readonly SourceRow[] = [
  { name: 'Basemap and coastal geography', provider: 'OpenStreetMap', kind: 'basemap' },
  { name: 'Oceanographic and weather model', provider: 'INCOIS / ECMWF', kind: 'unconnected' },
  { name: 'Official weather and cyclone advisories', provider: 'IMD', kind: 'unconnected' },
  { name: 'Authority hazard overrides and beach flags', provider: 'Authority entry', kind: 'unconnected' },
  { name: 'Lifeguard patrol and incident feed', provider: 'Incident reporting', kind: 'unconnected' },
];

/** Shared panel frame: consistent header with title, optional meta and status badge. */
function Panel({
  id,
  title,
  meta,
  aside,
  className,
  children,
}: {
  id: string;
  title: string;
  meta?: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={className ? `cc-panel ${className}` : 'cc-panel'} aria-labelledby={id}>
      <header className="cc-panel__head">
        <div className="cc-panel__titles">
          <h2 id={id} className="cc-panel__title">
            {title}
          </h2>
          {meta ? <span className="cc-panel__meta">{meta}</span> : null}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

export function NoticeStrip() {
  return (
    <section className="cc-notice" aria-label="Prototype and access notices">
      <div className="cc-notice__cell">
        <span className="cc-tag cc-tag--warn">Prototype</span>
        <p>
          <strong>Not an official or emergency system.</strong> This is a hackathon prototype. Nothing
          here is official safety information, a warning or a certified risk assessment. In an
          emergency in India, dial <strong>112</strong>.
        </p>
      </div>
      <div className="cc-notice__cell">
        <span className="cc-tag">Access</span>
        <p>
          <strong>Access notice.</strong> Authentication and authority-role authorization are not
          enforced in this prototype. Anyone can view this page. Signing in does not make you an
          authorized official, and no role is checked.
        </p>
      </div>
    </section>
  );
}

export function SimulatedBanner({ beach }: { beach: Beach }) {
  return (
    <div className="cc-simbanner" role="status">
      <DataBadge provenance="simulated" />
      <p>
        Simulated demonstration data is shown. These are samples, not real conditions, assessments or
        incidents at {beach.name}.
      </p>
    </div>
  );
}

export function EnvironmentStrip({ beach, showSimulated }: { beach: Beach; showSimulated: boolean }) {
  return (
    <section className="cc-env" aria-labelledby="env-heading">
      <header className="cc-env__head">
        <h2 id="env-heading" className="cc-panel__title">
          Environmental conditions
        </h2>
        <span className="cc-panel__meta">{beach.name}</span>
        <p className="cc-env__note">
          When connected: regional forecast model, several kilometres resolution. Values describe the
          whole beach area, not individual zones.
        </p>
      </header>
      <ul className="cc-env__grid">
        {METRICS.map((metric) => {
          const sample = showSimulated ? SIMULATED_ENVIRONMENT[metric.id] : undefined;
          return (
            <li key={metric.id} className={sample ? 'cc-metric is-sim' : 'cc-metric'}>
              <div className="cc-metric__top">
                <span className="cc-metric__label">{metric.label}</span>
                <span className="cc-metric__sym">{metric.symbol}</span>
              </div>
              {sample ? (
                <p className="cc-metric__value">
                  {sample.value}
                  <span className="cc-metric__unit">{sample.unit}</span>
                </p>
              ) : (
                <p className="cc-metric__value cc-metric__value--empty">No data</p>
              )}
              <div className="cc-metric__foot">
                <DataBadge provenance={sample ? 'simulated' : 'unavailable'} />
                <span className="cc-metric__src">{sample ? 'Sample value' : 'Feed disconnected'}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ZonesPanel({ beach, showSimulated }: { beach: Beach; showSimulated: boolean }) {
  const zones = showSimulated ? SIMULATED_ZONES.filter((zone) => zone.beachId === beach.id) : [];

  return (
    <Panel
      id="zones-heading"
      title="Hazard registry"
      aside={<DataBadge provenance={zones.length > 0 ? 'simulated' : 'unavailable'} />}
    >
      {zones.length === 0 ? (
        <div className="cc-empty">
          <p className="cc-empty__title">Not assessed</p>
          <p className="cc-empty__text">
            The risk engine and verified zone boundaries are not connected, so no zone at {beach.name}{' '}
            has been assessed. An empty registry is not evidence that the beach is safe.
          </p>
        </div>
      ) : (
        <ul className="cc-rows">
          {zones.map((zone) => (
            <li key={zone.id} className={`cc-row cc-row--sim risk-${zone.level}`}>
              <span className="cc-risk">
                <RiskIcon level={zone.level} />
                <span className="cc-risk__name">{RISK_LABELS[zone.level]}</span>
              </span>
              <span className="cc-row__main">
                <span className="cc-row__title">{zone.label}</span>
                <span className="cc-row__text">{zone.summary}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function IncidentsPanel({ beach, showSimulated }: { beach: Beach; showSimulated: boolean }) {
  const incidents = showSimulated ? SIMULATED_INCIDENTS.filter((incident) => incident.beachId === beach.id) : [];

  return (
    <Panel
      id="incidents-heading"
      title="Incident log"
      aside={<DataBadge provenance={incidents.length > 0 ? 'simulated' : 'unavailable'} />}
    >
      {incidents.length === 0 ? (
        <div className="cc-empty">
          <p className="cc-empty__title">Feed not connected</p>
          <p className="cc-empty__text">
            Incident reporting is not built yet, so this log cannot show incidents for {beach.name}. An
            empty log does not mean that nothing has happened.
          </p>
        </div>
      ) : (
        <ul className="cc-rows">
          {incidents.map((incident) => (
            <li key={incident.id} className="cc-row cc-row--sim">
              <span className="cc-row__main">
                <span className="cc-row__title">{incident.label}</span>
                <span className="cc-row__text">{incident.status}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function RiskLegend() {
  return (
    <Panel id="legend-heading" title="Risk categories" meta="Provisional">
      <ul className="cc-legend">
        {LEGEND.map((item) => (
          <li key={item.level} className={`cc-legend__item risk-${item.level}`}>
            <span className="cc-risk">
              <RiskIcon level={item.level} />
              <span className="cc-risk__name">{RISK_LABELS[item.level]}</span>
            </span>
            <span className="cc-legend__meaning">{item.meaning}</span>
          </li>
        ))}
      </ul>
      <p className="cc-panel__note">
        Provisional prototype categories, not validated safety standards. The risk engine is not built,
        so no zone has been assessed. Unknown is never the same as safe.
      </p>
    </Panel>
  );
}

function sourceStatus(row: SourceRow, mapStatus: MapStatus): { label: string; tone: 'ok' | 'off' | 'warn' } {
  if (row.kind === 'unconnected') return { label: 'Not connected', tone: 'off' };
  // The basemap is the only source the app can observe: it reports from real tile responses.
  if (mapStatus === 'ready') return { label: 'Tiles responding', tone: 'ok' };
  if (mapStatus === 'unavailable') return { label: 'Unavailable', tone: 'warn' };
  return { label: 'Checking', tone: 'off' };
}

export function DataSourcesPanel({ mapStatus }: { mapStatus: MapStatus }) {
  return (
    <Panel id="sources-heading" title="Data ingestion" meta="Connection state is verified, not assumed">
      <div className="cc-tablewrap">
        <table className="cc-table">
          <thead>
            <tr>
              <th scope="col">Source</th>
              <th scope="col">Provider</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {DATA_SOURCES.map((row) => {
              const status = sourceStatus(row, mapStatus);
              return (
                <tr key={row.name}>
                  <th scope="row">{row.name}</th>
                  <td className="cc-mono">{row.provider}</td>
                  <td>
                    <span className={`cc-status cc-status--${status.tone}`}>
                      <span className="cc-status__dot" aria-hidden="true" />
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function PageFooter({ health }: { health: HealthState }) {
  return (
    <footer className="cc-foot">
      <p>
        <strong>What the API status means:</strong> it only confirms that the health endpoint answered.
        It does not verify the database connection or sign-in-protected endpoints. Greyed navigation
        items (Incidents, Advisories, Analytics, Settings) are planned and not available.
      </p>
      <details className="cc-foot__details">
        <summary>API response details</summary>
        {health.kind === 'loading' && <p>Checking…</p>}
        {health.kind === 'error' && <p>Request failed: {health.message}</p>}
        {health.kind === 'ok' && (
          <>
            <pre>{JSON.stringify(health.data, null, 2)}</pre>
            <p className="cc-panel__note">
              The “environment” value is a fallback label from the health handler. It does not
              identify where the application is running.
            </p>
          </>
        )}
      </details>
    </footer>
  );
}
