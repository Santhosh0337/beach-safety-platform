
import 'dotenv/config';
import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import healthHandler from '../api/health';
import meHandler from '../api/me';
import marineHandler from '../api/marine';
import riskHandler from '../api/risk';
import adminRolesHandler from '../api/admin/roles';
import reportsHandler from '../api/reports';

const app = express();

app.use(express.json());

const allowedOrigins = new Set([
  'https://beach-safety-platform.vercel.app',
  'http://localhost:5173',
  // Optional extra origins (for example a Vercel preview or custom domain), comma separated.
  ...(process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

function adaptVercelHandler(
  handler: (
    req: VercelRequest,
    res: VercelResponse,
  ) => unknown,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const vercelReq = req as unknown as VercelRequest;
    const vercelRes = res as unknown as VercelResponse;

    Promise.resolve(handler(vercelReq, vercelRes)).catch(next);
  };
}

app.all('/api/health', adaptVercelHandler(healthHandler));
app.all('/api/me', adaptVercelHandler(meHandler));
app.all('/api/marine', adaptVercelHandler(marineHandler));
app.all('/api/risk', adaptVercelHandler(riskHandler));
app.all('/api/admin/roles', adaptVercelHandler(adminRolesHandler));
app.all('/api/reports', adaptVercelHandler(reportsHandler));

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    service: 'beach-safety-api',
    status: 'ok',
  });
});

app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    console.error('Unhandled API error:', error);

    if (res.headersSent) {
      next(error);
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  },
);

const port = Number(process.env.PORT) || 3000;

app.listen(port, '0.0.0.0', () => {
  console.log(`Beach Safety API listening on port ${port}`);
});
