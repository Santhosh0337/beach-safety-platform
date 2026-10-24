import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMarineBeach } from '../server/marine/beaches.js';
import { fetchMarineConditions } from '../server/marine/openMeteo.js';
import {
  createMarineService,
  withTimeout,
} from '../server/marine/service.js';
import type { MarineConditions } from '../server/types/marine.js';

const DB_TIMEOUT_MS = 5_000;

// Storage is loaded lazily so that a missing or unreachable database degrades
// to "live data, not persisted" instead of failing every request.
async function loadStorage() {
  return import('../server/services/marineStorage.js');
}

const defaultService = createMarineService({
  resolveBeach: getMarineBeach,
  fetchFresh: fetchMarineConditions,
  loadLatest: async (beachId) => {
    const storage = await loadStorage();
    return withTimeout(
      storage.getLatestMarineConditions(beachId),
      DB_TIMEOUT_MS,
      'MongoDB read',
    ) as Promise<MarineConditions | null>;
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
    // Server logs only. Error details are never sent to the browser.
    console.error(message, error instanceof Error ? error.message : error);
  },
});

function readBeachId(req: VercelRequest): string | null {
  // Parsed from the URL so it works in Express, Vercel and the Vite dev bridge.
  try {
    return new URL(req.url ?? '/', 'http://localhost').searchParams.get(
      'beachId',
    );
  } catch {
    return null;
  }
}

export function createMarineHandler(service: {
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

    try {
      const result = await service.getConditions(readBeachId(req));
      res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error(
        'GET /api/marine failed:',
        error instanceof Error ? error.message : error,
      );
      res.status(500).json({
        error: 'marine_data_unavailable',
        message: 'Marine conditions could not be retrieved.',
        retryable: true,
      });
    }
  };
}

export default createMarineHandler(defaultService);
