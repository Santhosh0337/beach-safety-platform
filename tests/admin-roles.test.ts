
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const { authenticateClerkRequest, getDb } = vi.hoisted(() => ({
  authenticateClerkRequest: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock('../server/auth/clerk', () => ({
  authenticateClerkRequest,
}));

vi.mock('../server/db/mongodb', () => ({
  getDb,
}));

import handler from '../api/admin/roles';

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

function call(method: string, body?: unknown) {
  const res = createRes();

  return handler(
    { method, body } as unknown as VercelRequest,
    res as unknown as VercelResponse,
  ).then(() => res);
}

describe('POST /api/admin/roles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests', async () => {
    authenticateClerkRequest.mockResolvedValue({
      status: 'signed-out',
    });

    const res = await call('POST', {
      clerkUserId: 'user_target',
      role: 'lifeguard',
    });

    expect(res.statusCode).toBe(401);
    expect(getDb).not.toHaveBeenCalled();
  });

  it('rejects non-admin users', async () => {
    authenticateClerkRequest.mockResolvedValue({
      status: 'signed-in',
      toAuth: () => ({
        isAuthenticated: true,
        userId: 'user_regular',
      }),
    });

    const previous = process.env.ADMIN_CLERK_USER_IDS;
    process.env.ADMIN_CLERK_USER_IDS = 'user_admin';

    try {
      const res = await call('POST', {
        clerkUserId: 'user_target',
        role: 'authority',
      });

      expect(res.statusCode).toBe(403);
      expect(getDb).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) {
        delete process.env.ADMIN_CLERK_USER_IDS;
      } else {
        process.env.ADMIN_CLERK_USER_IDS = previous;
      }
    }
  });

  it('rejects non-POST requests', async () => {
    const res = await call('GET');

    expect(res.statusCode).toBe(405);
    expect(res.headers['Allow']).toBe('POST');
    expect(authenticateClerkRequest).not.toHaveBeenCalled();
  });
});
