
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { timingSafeEqual } from 'node:crypto';
import { MongoClient } from 'mongodb';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const expected = process.env.MONGODB_DIAGNOSTIC_TOKEN;
  const supplied = req.headers['x-diagnostic-token'];

  if (
    !expected ||
    typeof supplied !== 'string' ||
    supplied.length !== expected.length ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  ) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    res.status(500).json({ error: 'MongoDB configuration missing' });
    return;
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
  });

  try {
    await client.connect();
    await client.db(process.env.MONGODB_DB_NAME).command({ ping: 1 });
    res.status(200).json({ success: true, message: 'MongoDB connection successful' });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    console.error('MongoDB diagnostic failed:', {
      name: err.name,
      code: err.code,
      message: err.message,
    });
    res.status(502).json({
      success: false,
      errorName: err.name,
      errorCode: err.code ?? null,
      message: 'MongoDB connection failed; inspect function logs',
    });
  } finally {
    await client.close().catch(() => undefined);
  }
}
