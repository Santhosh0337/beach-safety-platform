import { describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRiskHandler } from '../api/risk';

function createRes() {
  return {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}

async function call(
  method: string,
  url: string,
  getConditions: (id: string | null | undefined) => Promise<unknown>,
) {
  const res = createRes();
  const handler = createRiskHandler({ getConditions } as never);

  await handler(
    { method, url } as unknown as VercelRequest,
    res as unknown as VercelResponse,
  );

  return res;
}

describe('GET /api/risk', () => {
  it('returns a provisional assessment with evidence metadata', async () => {
    const res = await call(
      'GET',
      '/api/risk?beachId=rushikonda',
      async () => ({
        ok: true,
        httpStatus: 200,
        body: {
          beachId: 'rushikonda',
          status: 'available',
          source: 'open-meteo-marine',
          provenance: 'modelled-forecast',
          data: {
            waveHeightM: 0.8,
            modelAgeSeconds: 600,
            modelTime: '2026-10-24T12:00:00.000Z',
            fetchedAt: '2026-10-24T12:10:00.000Z',
          },
          cache: 'refreshed',
          persisted: true,
          warning: null,
        },
      }),
    );

    expect(res.statusCode).toBe(200);
    expect(res.headers['Cache-Control']).toBe('no-store');

    const body = res.body as {
      assessment: { beachId: string; level: string; assessmentStatus: string };
      evidence: { provenance: string; persisted: boolean };
    };

    expect(body.assessment.beachId).toBe('rushikonda');
    expect(body.assessment.level).toBe('green');
    expect(body.assessment.assessmentStatus).toBe('provisional');
    expect(body.evidence.provenance).toBe('modelled-forecast');
    expect(body.evidence.persisted).toBe(true);
  });

  it('passes the requested beach ID to the service', async () => {
    const getConditions = vi.fn(async () => ({
      ok: false,
      httpStatus: 404,
      body: { message: 'Unknown beach', beachId: 'unknown' },
    }));

    await call(
      'GET',
      '/api/risk?beachId=not-a-real-beach',
      getConditions,
    );

    expect(getConditions).toHaveBeenCalledWith('not-a-real-beach');
  });

  it('returns an insufficient-evidence assessment when the service fails', async () => {
    const res = await call(
      'GET',
      '/api/risk?beachId=rushikonda',
      async () => ({
        ok: false,
        httpStatus: 503,
        body: {
          message: 'Marine data is unavailable',
          beachId: 'rushikonda',
        },
      }),
    );

    expect(res.statusCode).toBe(503);

    const body = res.body as {
      error: string;
      assessment: { level: string; score: number | null };
    };

    expect(body.error).toBe('risk_evidence_unavailable');
    expect(body.assessment.level).toBe('gray');
    expect(body.assessment.score).toBeNull();
  });

  it('does not score stale evidence as green', async () => {
    const res = await call(
      'GET',
      '/api/risk?beachId=rushikonda',
      async () => ({
        ok: true,
        httpStatus: 200,
        body: {
          beachId: 'rushikonda',
          status: 'stale',
          source: 'open-meteo-marine',
          provenance: 'modelled-forecast',
          data: {
            waveHeightM: 0.5,
            modelAgeSeconds: 12_000,
            modelTime: '2026-10-24T08:00:00.000Z',
            fetchedAt: '2026-10-24T08:10:00.000Z',
          },
          cache: 'fallback',
          persisted: true,
          warning: 'Using previously stored data',
        },
      }),
    );

    expect(res.statusCode).toBe(200);

    const body = res.body as {
      assessment: { level: string; score: number | null };
    };

    expect(body.assessment.level).toBe('gray');
    expect(body.assessment.score).toBeNull();
  });

  it('rejects non-GET requests with 405', async () => {
    const getConditions = vi.fn(async () => {
      throw new Error('Should not be called');
    });

    const res = await call(
      'POST',
      '/api/risk?beachId=rushikonda',
      getConditions,
    );

    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe('GET');
    expect(getConditions).not.toHaveBeenCalled();
  });

  it('hides internal error details on unexpected failures', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const res = await call(
        'GET',
        '/api/risk?beachId=rushikonda',
        async () => {
          throw new Error('mongodb://user:secret@internal-host');
        },
      );

      expect(res.statusCode).toBe(500);
      expect(JSON.stringify(res.body)).not.toContain('secret');
      expect(JSON.stringify(res.body)).not.toContain('internal-host');
    } finally {
      errorSpy.mockRestore();
    }
  });
});
