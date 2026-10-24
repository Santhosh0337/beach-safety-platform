import { describe, expect, it } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createMarineHandler } from '../api/marine';

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
  const handler = createMarineHandler({ getConditions } as never);
  await handler({ method, url } as unknown as VercelRequest, res as unknown as VercelResponse);
  return res;
}

describe('GET /api/marine', () => {
  it('passes the beachId query parameter to the service and relays its result', async () => {
    let seen: string | null | undefined;
    const res = await call('GET', '/api/marine?beachId=rk-beach', async (id) => {
      seen = id;
      return { ok: true, httpStatus: 200, body: { beachId: 'rk-beach' } };
    });
    expect(seen).toBe('rk-beach');
    expect(res.statusCode).toBe(200);
    expect(res.headers['Cache-Control']).toBe('no-store');
  });

  it('relays a 503 from the service', async () => {
    const res = await call('GET', '/api/marine?beachId=rk-beach', async () => ({
      ok: false,
      httpStatus: 503,
      body: { error: 'marine_data_unavailable' },
    }));
    expect(res.statusCode).toBe(503);
  });

  it('rejects other methods with 405', async () => {
    const res = await call('POST', '/api/marine?beachId=rk-beach', async () => {
      throw new Error('should not run');
    });
    expect(res.statusCode).toBe(405);
    expect(res.headers['Allow']).toBe('GET');
  });

  it('hides internal error details on unexpected failures', async () => {
    const res = await call('GET', '/api/marine?beachId=rk-beach', async () => {
      throw new Error('mongodb://user:pass@host');
    });
    expect(res.statusCode).toBe(500);
    expect(JSON.stringify(res.body).includes('mongodb')).toBe(false);
  });
});
