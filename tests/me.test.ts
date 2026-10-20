
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const { authenticateClerkRequest, getUserRole } = vi.hoisted(() => ({
  authenticateClerkRequest: vi.fn(),
  getUserRole: vi.fn(),
}));

vi.mock('../server/auth/roles', () => ({
  getUserRole,
}));
vi.mock('../server/auth/clerk', () => ({
  authenticateClerkRequest,
}));

import handler from '../api/me';

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
  return handler(
    { method } as unknown as VercelRequest,
    res as unknown as VercelResponse,
  ).then(() => res);
}

describe('GET /api/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserRole.mockResolvedValue('tourist');
  });

  it('rejects unauthenticated requests', async () => {
    authenticateClerkRequest.mockResolvedValue({
      status: 'signed-out',
    });

    const res = await call('GET');

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('returns the authenticated user ID and default role', async () => {
    authenticateClerkRequest.mockResolvedValue({
      status: 'signed-in',
      toAuth: () => ({
        isAuthenticated: true,
        userId: 'user_test_123',
      }),
    });

    const res = await call('GET');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      userId: 'user_test_123',
      role: 'tourist',
    });
    expect(res.headers['Cache-Control']).toBe('no-store');
  });

  it('rejects non-GET requests', async () => {
    const res = await call('POST');

    expect(res.statusCode).toBe(405);
    expect(res.headers['Allow']).toBe('GET');
    expect(authenticateClerkRequest).not.toHaveBeenCalled();
  });
});
