
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const {
  authenticateClerkRequest,
  createHazardReport,
  getUserRole,
  listHazardReports,
  updateHazardReportStatus,
} = vi.hoisted(() => ({
  authenticateClerkRequest: vi.fn(),
  createHazardReport: vi.fn(),
  getUserRole: vi.fn(),
  listHazardReports: vi.fn(),
  updateHazardReportStatus: vi.fn(),
}));

vi.mock('../server/auth/clerk', () => ({
  authenticateClerkRequest,
}));

vi.mock('../server/auth/roles', () => ({
  getUserRole,
}));

vi.mock('../server/tourist/records', () => ({
  REPORT_CATEGORIES: [
    'rip-current',
    'rough-waves',
    'injured-person',
    'unsafe-area',
    'other',
  ],
  createHazardReport,
  listHazardReports,
  updateHazardReportStatus,
}));

vi.mock('mongodb', () => ({
  ObjectId: class MockObjectId {
    private readonly value: string;

    constructor(value: string) {
      this.value = value;
    }

    toString() {
      return this.value;
    }
  },
}));

import handler from '../api/reports';

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

async function call(method: string, body?: unknown) {
  const res = createRes();

  await handler(
    { method, body } as unknown as VercelRequest,
    res as unknown as VercelResponse,
  );

  return res;
}

function authenticateAs(userId = 'user_reporter') {
  authenticateClerkRequest.mockResolvedValue({
    status: 'signed-in',
    toAuth: () => ({ isAuthenticated: true, userId }),
  });
}

const reportId = '507f1f77bcf86cd799439011';

function sampleReport(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-10-27T12:00:00.000Z');

  return {
    _id: { toString: () => reportId },
    beachId: 'rushikonda',
    category: 'rough-waves',
    description: 'Waves are unusually strong near the shore.',
    submittedBy: 'user_reporter',
    status: 'submitted',
    verified: false,
    createdAt: now,
    updatedAt: now,
    statusHistory: [],
    ...overrides,
  };
}

describe('/api/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserRole.mockResolvedValue('tourist');
  });

  describe('method handling and authentication', () => {
    it('rejects unsupported methods', async () => {
      const res = await call('DELETE');

      expect(res.statusCode).toBe(405);
      expect(res.headers.Allow).toBe('GET, POST, PATCH');
      expect(authenticateClerkRequest).not.toHaveBeenCalled();
    });

    it('rejects unauthenticated requests', async () => {
      authenticateClerkRequest.mockResolvedValue({
        status: 'signed-out',
      });

      const res = await call('POST', {
        beachId: 'rushikonda',
        category: 'rough-waves',
        description: 'Waves are unusually strong near the shore.',
      });

      expect(res.statusCode).toBe(401);
      expect(createHazardReport).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/reports', () => {
    it('rejects unsupported beach IDs', async () => {
      authenticateAs();

      const res = await call('POST', {
        beachId: 'unknown-beach',
        category: 'rough-waves',
        description: 'Waves are unusually strong near the shore.',
      });

      expect(res.statusCode).toBe(400);
      expect(createHazardReport).not.toHaveBeenCalled();
    });

    it('rejects descriptions that are too short', async () => {
      authenticateAs();

      const res = await call('POST', {
        beachId: 'rushikonda',
        category: 'rough-waves',
        description: 'Danger!',
      });

      expect(res.statusCode).toBe(400);
      expect(createHazardReport).not.toHaveBeenCalled();
    });

    it('creates a report using the authenticated user identity', async () => {
      authenticateAs('user_real_reporter');
      createHazardReport.mockResolvedValue(
        sampleReport({ submittedBy: 'user_real_reporter' }),
      );

      const res = await call('POST', {
        beachId: 'rushikonda',
        category: 'rough-waves',
        description: '  Waves are unusually strong near the shore.  ',
        submittedBy: 'user_attacker',
        status: 'verified',
        verified: true,
      });

      expect(res.statusCode).toBe(201);
      expect(createHazardReport).toHaveBeenCalledWith({
        beachId: 'rushikonda',
        category: 'rough-waves',
        description: 'Waves are unusually strong near the shore.',
        submittedBy: 'user_real_reporter',
      });

      expect(res.body).toMatchObject({
        report: {
          id: reportId,
          status: 'submitted',
          verified: false,
        },
      });
    });

    it('hides internal persistence error details', async () => {
      authenticateAs();
      createHazardReport.mockRejectedValue(
        new Error('mongodb://user:secret@internal-host'),
      );

      const errorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      try {
        const res = await call('POST', {
          beachId: 'rushikonda',
          category: 'other',
          description: 'A damaged warning sign is near the beach entrance.',
        });

        expect(res.statusCode).toBe(500);
        expect(JSON.stringify(res.body)).not.toContain('secret');
        expect(JSON.stringify(res.body)).not.toContain('internal-host');
      } finally {
        errorSpy.mockRestore();
      }
    });
  });

  describe('GET /api/reports', () => {
    it('allows authorities to list reports', async () => {
      authenticateAs('authority_user');
      getUserRole.mockResolvedValue('authority');
      listHazardReports.mockResolvedValue([sampleReport()]);

      const res = await call('GET');

      expect(res.statusCode).toBe(200);
      expect(listHazardReports).toHaveBeenCalledOnce();
      expect(res.body).toMatchObject({
        reports: [
          {
            id: reportId,
            beachId: 'rushikonda',
            status: 'submitted',
            statusHistory: [],
          },
        ],
      });
    });

    it('denies report listing to tourists', async () => {
      authenticateAs('tourist_user');
      getUserRole.mockResolvedValue('tourist');

      const res = await call('GET');

      expect(res.statusCode).toBe(403);
      expect(listHazardReports).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /api/reports', () => {
    it('denies status updates to non-authorities', async () => {
      authenticateAs('tourist_user');
      getUserRole.mockResolvedValue('tourist');

      const res = await call('PATCH', {
        id: reportId,
        status: 'under-review',
      });

      expect(res.statusCode).toBe(403);
      expect(updateHazardReportStatus).not.toHaveBeenCalled();
    });

    it('rejects malformed report IDs', async () => {
      authenticateAs('authority_user');
      getUserRole.mockResolvedValue('authority');

      const res = await call('PATCH', {
        id: 'not-an-object-id',
        status: 'under-review',
      });

      expect(res.statusCode).toBe(400);
      expect(updateHazardReportStatus).not.toHaveBeenCalled();
    });

    it('rejects submitted as an update status', async () => {
      authenticateAs('authority_user');
      getUserRole.mockResolvedValue('authority');

      const res = await call('PATCH', {
        id: reportId,
        status: 'submitted',
      });

      expect(res.statusCode).toBe(400);
      expect(updateHazardReportStatus).not.toHaveBeenCalled();
    });

    it('returns 404 when the report does not exist', async () => {
      authenticateAs('authority_user');
      getUserRole.mockResolvedValue('authority');
      updateHazardReportStatus.mockResolvedValue({
        success: false,
        reason: 'not-found',
      });

      const res = await call('PATCH', {
        id: reportId,
        status: 'under-review',
      });

      expect(res.statusCode).toBe(404);
    });

    it('returns 409 for an invalid status transition', async () => {
      authenticateAs('authority_user');
      getUserRole.mockResolvedValue('authority');
      updateHazardReportStatus.mockResolvedValue({
        success: false,
        reason: 'invalid-transition',
        currentStatus: 'submitted',
      });

      const res = await call('PATCH', {
        id: reportId,
        status: 'resolved',
      });

      expect(res.statusCode).toBe(409);
      expect(res.body).toMatchObject({
        error: 'Invalid status transition',
        currentStatus: 'submitted',
        requestedStatus: 'resolved',
      });
    });

    it('updates status and returns audit history for authorities', async () => {
      authenticateAs('authority_user');
      getUserRole.mockResolvedValue('authority');

      const changedAt = new Date('2026-10-27T12:30:00.000Z');
      const updatedReport = sampleReport({
        status: 'under-review',
        updatedAt: changedAt,
        statusHistory: [
          {
            from: 'submitted',
            to: 'under-review',
            changedBy: 'authority_user',
            changedAt,
          },
        ],
      });

      updateHazardReportStatus.mockResolvedValue({
        success: true,
        report: updatedReport,
      });

      const res = await call('PATCH', {
        id: reportId,
        status: 'under-review',
      });

      expect(res.statusCode).toBe(200);
      expect(updateHazardReportStatus).toHaveBeenCalledWith({
        id: expect.objectContaining({}),
        status: 'under-review',
        changedBy: 'authority_user',
      });

      expect(res.body).toMatchObject({
        report: {
          id: reportId,
          status: 'under-review',
          statusHistory: [
            {
              from: 'submitted',
              to: 'under-review',
              changedBy: 'authority_user',
              changedAt: changedAt.toISOString(),
            },
          ],
        },
      });
    });
  });
});
