
import type { Collection, ObjectId } from 'mongodb';
import { getDb } from '../db/mongodb.js';

export const REPORT_CATEGORIES = [
  'rip-current',
  'rough-waves',
  'injured-person',
  'unsafe-area',
  'other',
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export type ReportStatus =
  | 'submitted'
  | 'under-review'
  | 'verified'
  | 'rejected'
  | 'resolved';

export interface ReportStatusHistoryEntry {
  from: ReportStatus;
  to: ReportStatus;
  changedBy: string;
  changedAt: Date;
}

export interface HazardReport {
  _id?: ObjectId;
  beachId: string;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  verified: boolean;
  submittedBy: string;
  createdAt: Date;
  updatedAt: Date;
  statusHistory?: ReportStatusHistoryEntry[];
}

const COLLECTION_NAME = 'hazard_reports';
const MAX_REPORTS_PER_REQUEST = 200;

const ALLOWED_TRANSITIONS: Record<ReportStatus, readonly ReportStatus[]> = {
  submitted: ['under-review', 'rejected'],
  'under-review': ['verified', 'rejected'],
  verified: ['resolved'],
  rejected: [],
  resolved: [],
};

async function getCollection(): Promise<Collection<HazardReport>> {
  const db = await getDb();
  return db.collection<HazardReport>(COLLECTION_NAME);
}

export interface CreateHazardReportInput {
  beachId: string;
  category: ReportCategory;
  description: string;
  submittedBy: string;
}

export async function createHazardReport(
  input: CreateHazardReportInput,
): Promise<HazardReport> {
  const now = new Date();

  const report: HazardReport = {
    ...input,
    status: 'submitted',
    verified: false,
    createdAt: now,
    updatedAt: now,
    statusHistory: [],
  };

  const collection = await getCollection();
  const result = await collection.insertOne(report);

  return {
    ...report,
    _id: result.insertedId,
  };
}

export async function getHazardReportById(
  id: ObjectId,
): Promise<HazardReport | null> {
  const collection = await getCollection();
  return collection.findOne({ _id: id });
}

export async function listHazardReports(): Promise<HazardReport[]> {
  const collection = await getCollection();

  return collection
    .find({})
    .sort({ createdAt: -1 })
    .limit(MAX_REPORTS_PER_REQUEST)
    .toArray();
}

export type UpdateHazardReportStatusResult =
  | { success: true; report: HazardReport }
  | {
      success: false;
      reason: 'not-found' | 'invalid-transition';
      currentStatus?: ReportStatus;
    };

export async function updateHazardReportStatus(input: {
  id: ObjectId;
  status: ReportStatus;
  changedBy: string;
}): Promise<UpdateHazardReportStatusResult> {
  const collection = await getCollection();
  const now = new Date();

  // Read the current status before validating the transition.
  const existing = await collection.findOne(
    { _id: input.id },
    { projection: { status: 1 } },
  );

  if (!existing) {
    return { success: false, reason: 'not-found' };
  }

  const currentStatus = existing.status;

  if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(input.status)) {
    return {
      success: false,
      reason: 'invalid-transition',
      currentStatus,
    };
  }

  const historyEntry: ReportStatusHistoryEntry = {
    from: currentStatus,
    to: input.status,
    changedBy: input.changedBy,
    changedAt: now,
  };

  // Include the previous status in the update filter so a concurrent
  // authority update cannot overwrite a newer status transition.
  const updated = await collection.findOneAndUpdate(
    {
      _id: input.id,
      status: currentStatus,
    },
    {
      $set: {
        status: input.status,
        verified: input.status === 'verified',
        updatedAt: now,
      },
      $push: {
        statusHistory: historyEntry,
      },
    },
    { returnDocument: 'after' },
  );

  if (!updated) {
    const latest = await collection.findOne(
      { _id: input.id },
      { projection: { status: 1 } },
    );

    if (!latest) {
      return { success: false, reason: 'not-found' };
    }

    return {
      success: false,
      reason: 'invalid-transition',
      currentStatus: latest.status,
    };
  }

  return { success: true, report: updated };
}
