
import { describe, expect, it } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../api/health';

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

function call(method: string) {
  const res = createRes();
  handler({ method } as unknown as VercelRequest, res as unknown as VercelResponse);
  return res;
}

describe('GET /api/health', () => {
  it('returns 200 with status ok and an ISO timestamp', () => {
    const res = call('GET');
    expect(res.statusCode).toBe(200);
    const body = res.body as { status: string; service: string; timestamp: string };
    expect(body.status).toBe('ok');
    expect(body.service).toBe('beach-safety-platform');
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it('disables caching', () => {
    expect(call('GET').headers['Cache-Control']).toBe('no-store');
  });

  it('rejects non-GET methods with 405 and an Allow header', () => {
    const res = call('POST');
    expect(res.statusCode).toBe(405);
    expect(res.headers['Allow']).toBe('GET, HEAD');
  });
});
