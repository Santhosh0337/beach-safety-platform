
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { authenticateClerkRequest } from '../server/auth/clerk.js';
import { getUserRole } from '../server/auth/roles.js';
import {
  REPORT_CATEGORIES,
  createHazardReport,
  listHazardReports,
  updateHazardReportStatus,
  type ReportCategory,
  type ReportStatus,
} from '../server/tourist/records.js';

const BEACH_IDS = new Set(['rushikonda', 'rk-beach']);
const MAX_DESCRIPTION_LENGTH = 1000;

const REPORT_STATUSES: readonly ReportStatus[] = [
  'submitted',
  'under-review',
  'verified',
  'rejected',
  'resolved',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function serializeReport(report: {
  _id?: ObjectId;
  beachId: string;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  verified: boolean;
  submittedBy: string;
  createdAt: Date;
  updatedAt: Date;
  statusHistory?: Array<{
    from: ReportStatus;
    to: ReportStatus;
    changedBy: string;
    changedAt: Date;
  }>;
}) {
  return {
    id: report._id?.toString(),
    beachId: report.beachId,
    category: report.category,
    description: report.description,
    status: report.status,
    verified: report.verified,
    submittedBy: report.submittedBy,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    statusHistory: (report.statusHistory ?? []).map((entry) => ({
      from: entry.from,
      to: entry.to,
      changedBy: entry.changedBy,
      changedAt: entry.changedAt.toISOString(),
    })),
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');

  if (!['GET', 'POST', 'PATCH'].includes(req.method ?? '')) {
    res.setHeader('Allow', 'GET, POST, PATCH');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const state = await authenticateClerkRequest(req);

    if (state.status !== 'signed-in') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const auth = state.toAuth();

    if (!auth.isAuthenticated || !auth.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.method === 'GET') {
      const role = await getUserRole(auth.userId);

      if (role !== 'authority') {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const reports = await listHazardReports();

      res.status(200).json({
        reports: reports.map(serializeReport),
      });
      return;
    }

    if (req.method === 'PATCH') {
      const role = await getUserRole(auth.userId);

      if (role !== 'authority') {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      if (!isRecord(req.body)) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
      }

      const id = typeof req.body.id === 'string' ? req.body.id : '';
      const status =
        typeof req.body.status === 'string' ? req.body.status : '';

      if (!/^[a-f\d]{24}$/i.test(id)) {
        res.status(400).json({
          error: 'Invalid report ID',
          fields: { id: 'Provide a valid report ID.' },
        });
        return;
      }

      if (
        !REPORT_STATUSES.includes(status as ReportStatus) ||
        status === 'submitted'
      ) {
        res.status(400).json({
          error: 'Invalid status',
          fields: {
            status: 'Choose a valid status for a report update.',
          },
        });
        return;
      }

      const result = await updateHazardReportStatus({
        id: new ObjectId(id),
        status: status as ReportStatus,
        changedBy: auth.userId,
      });

      if (!result.success) {
        if (result.reason === 'not-found') {
          res.status(404).json({ error: 'Report not found' });
          return;
        }

        res.status(409).json({
          error: 'Invalid status transition',
          currentStatus: result.currentStatus,
          requestedStatus: status,
        });
        return;
      }

      res.status(200).json({
        report: serializeReport(result.report),
      });
      return;
    }

    if (!isRecord(req.body)) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    const beachId =
      typeof req.body.beachId === 'string' ? req.body.beachId : '';
    const category =
      typeof req.body.category === 'string' ? req.body.category : '';
    const description =
      typeof req.body.description === 'string'
        ? req.body.description.trim()
        : '';

    if (!BEACH_IDS.has(beachId)) {
      res.status(400).json({
        error: 'Invalid beachId',
        fields: { beachId: 'Choose a supported beach.' },
      });
      return;
    }

    if (!REPORT_CATEGORIES.includes(category as ReportCategory)) {
      res.status(400).json({
        error: 'Invalid category',
        fields: { category: 'Choose a supported report category.' },
      });
      return;
    }

    if (
      description.length < 10 ||
      description.length > MAX_DESCRIPTION_LENGTH
    ) {
      res.status(400).json({
        error: 'Invalid description',
        fields: {
          description:
            'Description must be between 10 and 1000 characters.',
        },
      });
      return;
    }

    const report = await createHazardReport({
      beachId,
      category: category as ReportCategory,
      description,
      submittedBy: auth.userId,
    });

    res.status(201).json({
      report: {
        id: report._id?.toString(),
        beachId: report.beachId,
        category: report.category,
        description: report.description,
        status: report.status,
        verified: report.verified,
        createdAt: report.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(
      `${req.method} /api/reports failed:`,
      error instanceof Error ? error.message : error,
    );

    res.status(500).json({
      error: 'reports_request_failed',
      message: 'The request could not be completed. Please try again.',
    });
  }
}
