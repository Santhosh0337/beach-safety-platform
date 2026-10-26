/** Response shapes of the Phase 7 API (mirrors server/tourist/records.ts). */

export interface PublicAdvisory {
  id: string;
  beachId: string;
  title: string;
  summary: string | null;
  sourceName: string;
  sourceUrl: string | null;
  issuedAt: string | null;
  verifiedAt: string;
}

export interface PublicKnownHazard {
  id: string;
  beachId: string;
  title: string;
  description: string | null;
  category: string | null;
  status: 'verified';
  sourceName: string;
  sourceUrl: string | null;
  verifiedAt: string;
}

export interface PublicFacility {
  id: string;
  beachId: string;
  name: string;
  kind: string;
  sourceName: string | null;
  sourceUrl: string | null;
  verifiedAt: string;
}

export interface PublicReport {
  id: string;
  beachId: string;
  category: string;
  description: string;
  status: 'submitted';
  verified: false;
  locationShared: boolean;
  createdAt: string;
}

export interface PublicIncident {
  id: string;
  type: 'sos';
  beachId: string;
  message: string | null;
  status: 'recorded';
  forwardedToEmergencyServices: false;
  locationShared: boolean;
  createdAt: string;
}

export interface PublicMissingCase {
  id: string;
  beachId: string;
  personName: string | null;
  approximateAge: number | null;
  description: string;
  lastSeenAt: string;
  lastSeenPlace: string | null;
  status: 'submitted';
  forwardedToEmergencyServices: false;
  locationShared: boolean;
  createdAt: string;
}

export interface PublicNotification {
  id: string;
  kind: string;
  body: string;
  recordType: string;
  recordId: string;
  deliveredVia: 'in-app';
  createdAt: string;
  acknowledgedAt: string | null;
}

export type RiskLevel = 'red' | 'orange' | 'yellow' | 'green' | 'gray';

export interface RiskAssessmentDto {
  beachId: string;
  level: RiskLevel;
  score: number | null;
  assessmentStatus: 'provisional' | 'insufficient-evidence' | 'override';
  reasons: string[];
  disclaimer: string;
}

export interface RiskResponse {
  assessment: RiskAssessmentDto;
  evidence: {
    source: string;
    provenance: string;
    modelTime: string | null;
    fetchedAt: string;
    modelAgeSeconds: number | null;
    cache: string;
    warning: string | null;
  };
}

export interface ApiErrorBody {
  error?: string;
  message?: string;
  fields?: Record<string, string>;
  recorded?: boolean;
  retryAfterSeconds?: number;
  assessment?: RiskAssessmentDto;
}

/** GET /api/marine response (modelled forecast, not a sensor observation). */
export interface MarineResponse {
  beachId: string;
  status: 'available' | 'stale';
  source: string;
  provenance: string;
  attribution: string;
  data: {
    modelTime: string | null;
    fetchedAt: string;
    modelAgeSeconds: number | null;
    gridPoint: { latitude: number; longitude: number };
    waveHeightM: number | null;
    wavePeriodSeconds: number | null;
    seaSurfaceTemperatureC: number | null;
  };
  cache: 'hit' | 'refreshed' | 'fallback';
  warning: string | null;
}
