import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMarineBeach } from '../server/marine/beaches.js';
import {
  createMarineService,
  withTimeout,
} from '../server/marine/service.js';
import {
  assessBeachRisk,
  type EvidenceStatus,
} from '../server/risk/engine.js';

const DB_TIMEOUT_MS = 5_000;

async function loadStorage() {
  return import('../server/services/marineStorage.js');
}

const marineService = createMarineService({
  resolveBeach: getMarineBeach,
  fetchFresh: async (beach) => {
    const { fetchMarineConditions } = await import('../server/marine/openMeteo.js');
    return fetchMarineConditions(beach);
  },
  loadLatest: async (beachId) => {
    const storage = await loadStorage();
    return withTimeout(
      storage.getLatestMarineConditions(beachId),
      DB_TIMEOUT_MS,
      'MongoDB read',
    );
  },
  save: async (conditions) => {
    const storage = await loadStorage();
    await withTimeout(
      storage.storeMarineConditions(conditions),
      DB_TIMEOUT_MS,
      'MongoDB write',
    );
  },
  now: () => Date.now(),
  log: (message, error) => {
    console.error(message, error instanceof Error ? error.message : error);
  },
});

function readBeachId(req: VercelRequest): string | null {
  try {
    return new URL(req.url ?? '/', 'http://localhost')
      .searchParams.get('beachId');
  } catch {
    return null;
  }
}

export function createRiskHandler(service: {
  getConditions: ReturnType<typeof createMarineService>['getConditions'];
}) {
  return async function handler(
    req: VercelRequest,
    res: VercelResponse,
  ): Promise<void> {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const beachId = readBeachId(req);

    try {
      const result = await service.getConditions(beachId);

      if (!result.ok) {
        res.status(result.httpStatus).json({
          error: 'risk_evidence_unavailable',
          message: result.body.message,
          beachId: result.body.beachId ?? beachId,
          assessment: assessBeachRisk({
            beachId: result.body.beachId ?? beachId ?? 'unknown',
            evidenceStatus: 'unavailable',
            waveHeightM: null,
            modelAgeSeconds: null,
          }),
        });
        return;
      }

      const evidenceStatus: EvidenceStatus =
        result.body.status === 'stale' ? 'stale' : 'available';

      const assessment = assessBeachRisk({
        beachId: result.body.beachId,
        evidenceStatus,
        waveHeightM: result.body.data.waveHeightM,
        modelAgeSeconds: result.body.data.modelAgeSeconds,
      });

      res.status(200).json({
        assessment,
        evidence: {
          source: result.body.source,
          provenance: result.body.provenance,
          modelTime: result.body.data.modelTime,
          fetchedAt: result.body.data.fetchedAt,
          modelAgeSeconds: result.body.data.modelAgeSeconds,
          cache: result.body.cache,
          persisted: result.body.persisted,
          warning: result.body.warning,
        },
      });
    } catch (error) {
      console.error(
        'GET /api/risk failed:',
        error instanceof Error ? error.message : error,
      );
      res.status(500).json({
        error: 'risk_assessment_failed',
        message: 'The risk assessment could not be completed.',
      });
    }
  };
}

export default createRiskHandler(marineService);
