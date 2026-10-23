import type { DevStatus } from './content';

export function Arrow() {
  return (
    <svg className="bs-arrow" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
      <path d="M1 8h13M9 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

export function StatusChip({ status }: { status: DevStatus }) {
  return <span className="bs-chip">{status}</span>;
}

type SectionHeaderProps = {
  index: string;
  label: string;
  titleId: string;
  title: string;
  intro: string;
};

export function SectionHeader({ index, label, titleId, title, intro }: SectionHeaderProps) {
  return (
    <div className="bs-section__head">
      <p className="bs-label">
        {index} / {label}
      </p>
      <h2 id={titleId} className="bs-h-lg">
        {title}
      </h2>
      <p className="bs-body-lg bs-muted bs-section__intro">{intro}</p>
    </div>
  );
}
