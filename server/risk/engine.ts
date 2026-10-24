
export type PrototypeRiskLevel =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'gray';

export type EvidenceStatus = 'available' | 'stale' | 'unavailable';

export interface RiskInput {
  beachId: string;
  evidenceStatus: EvidenceStatus;
  waveHeightM: number | null;
  modelAgeSeconds: number | null;
  criticalHazardConfirmed?: boolean;
  officialClosureConfirmed?: boolean;
}

export interface RiskAssessment {
  beachId: string;
  level: PrototypeRiskLevel;
  score: number | null;
  assessmentStatus: 'provisional' | 'insufficient-evidence' | 'override';
  reasons: string[];
  provenance: 'live-model' | 'unavailable' | 'authority-entered';
  disclaimer: string;
}

const DISCLAIMER =
  'Prototype only. Not an official beach-safety assessment. ' +
  'Modelled wave forecasts cannot detect rip currents or establish that a beach is safe.';

const MAX_MODEL_AGE_SECONDS = 3 * 60 * 60;

function isValidNumber(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}

export function assessBeachRisk(input: RiskInput): RiskAssessment {
  const reasons: string[] = [];

  // Confirmed critical conditions take precedence over a numerical score.
  if (input.officialClosureConfirmed) {
    return {
      beachId: input.beachId,
      level: 'red',
      score: null,
      assessmentStatus: 'override',
      reasons: ['An official beach closure has been confirmed.'],
      provenance: 'authority-entered',
      disclaimer: DISCLAIMER,
    };
  }

  if (input.criticalHazardConfirmed) {
    return {
      beachId: input.beachId,
      level: 'red',
      score: null,
      assessmentStatus: 'override',
      reasons: ['A critical hazard has been confirmed by an authorized source.'],
      provenance: 'authority-entered',
      disclaimer: DISCLAIMER,
    };
  }

  // Never convert missing, stale or invalid evidence into a green status.
  if (input.evidenceStatus !== 'available') {
    return {
      beachId: input.beachId,
      level: 'gray',
      score: null,
      assessmentStatus: 'insufficient-evidence',
      reasons: [
        input.evidenceStatus === 'stale'
          ? 'Marine forecast evidence is stale.'
          : 'Marine forecast evidence is unavailable.',
      ],
      provenance: 'unavailable',
      disclaimer: DISCLAIMER,
    };
  }

  if (
    !isValidNumber(input.modelAgeSeconds) ||
    input.modelAgeSeconds < 0 ||
    input.modelAgeSeconds > MAX_MODEL_AGE_SECONDS
  ) {
    return {
      beachId: input.beachId,
      level: 'gray',
      score: null,
      assessmentStatus: 'insufficient-evidence',
      reasons: ['Forecast age is missing, invalid or outside the freshness limit.'],
      provenance: 'unavailable',
      disclaimer: DISCLAIMER,
    };
  }

  if (!isValidNumber(input.waveHeightM) || input.waveHeightM < 0) {
    return {
      beachId: input.beachId,
      level: 'gray',
      score: null,
      assessmentStatus: 'insufficient-evidence',
      reasons: ['A valid wave-height value is unavailable.'],
      provenance: 'unavailable',
      disclaimer: DISCLAIMER,
    };
  }

  // These are illustrative prototype thresholds, NOT official safety standards.
  let level: PrototypeRiskLevel;
  let score: number;

  if (input.waveHeightM >= 2.5) {
    level = 'red';
    score = 90;
    reasons.push('Illustrative rule: wave height is at least 2.5 m.');
  } else if (input.waveHeightM >= 1.8) {
    level = 'orange';
    score = 70;
    reasons.push('Illustrative rule: wave height is at least 1.8 m.');
  } else if (input.waveHeightM >= 1.2) {
    level = 'yellow';
    score = 45;
    reasons.push('Illustrative rule: wave height is at least 1.2 m.');
  } else {
    level = 'green';
    score = 15;
    reasons.push('Wave height is below the prototype thresholds.');
  }

  reasons.push(
    'This result uses modelled wave height only; other hazards may be present.',
  );

  return {
    beachId: input.beachId,
    level,
    score,
    assessmentStatus: 'provisional',
    reasons,
    provenance: 'live-model',
    disclaimer: DISCLAIMER,
  };
}
