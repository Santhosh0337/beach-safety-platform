import { FEATURES } from './content';
import { SectionHeader, StatusChip } from './ui';

export function PlatformSection() {
  return (
    <section id="platform" className="bs-section bs-section--surface" aria-labelledby="platform-title">
      <div className="bs-container">
        <SectionHeader
          index="01"
          label="PLATFORM"
          titleId="platform-title"
          title="One picture of coastal risk."
          intro="Built so that visitors, fishermen, lifeguards and authorities work from the same explained, sourced view of each beach."
        />
        <ul className="bs-grid bs-grid--2 bs-list-reset">
          {FEATURES.map((feature) => (
            <li key={feature.index} className="bs-card bs-feature">
              <p className="bs-label bs-muted">{feature.index}</p>
              <h3 className="bs-h-sm">{feature.title}</h3>
              <p className="bs-body-md bs-muted">{feature.body}</p>
              <div className="bs-feature__foot">
                <StatusChip status={feature.status} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
