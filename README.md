# Beach Safety Intelligence Platform

A prototype web platform for beach-zone safety information for tourists, fishermen, lifeguards,
and coastal authorities, built for an Andhra Pradesh beach safety hackathon.

**Not validated for real emergency response.** Nothing in this project should be treated as
authoritative safety information.

## Status

- Phases 1-3 (foundation, authentication and database setup, deployment) are in place.
- Phase 4 (authority dashboard UI and map) is in progress on the `feat/authority-dashboard` branch.
- The current interface on `main` is a temporary setup page, not the finished product.
- Authenticated requests from the frontend to the API, and the API's connection to MongoDB Atlas
  in production, have not yet been verified end to end.

## Stack

| Area | Technology |
|---|---|
| Frontend | React, TypeScript, Vite (hosted on Vercel) |
| API | Express on Node.js (hosted on Render) |
| Authentication | Clerk |
| Database | MongoDB Atlas |

- Frontend: https://beach-safety-platform.vercel.app
- API health check: https://beach-safety-platform.onrender.com/api/health

## Requirements

- Node.js 24.x, npm 11+

## Setup

```powershell
npm install
npm run dev
```

Before running the app, create a `.env` file from `.env.example` and fill in your own values (see
below), then open http://localhost:5173.

The frontend calls the API at `VITE_API_BASE_URL`. The dev server also serves the handlers in `api/`
at `/api/<name>` through a development-only bridge in `vite.config.ts`; it is not used in production.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Typecheck and build the frontend for production |
| `npm run build:render` | Bundle the Express API into `dist-server/` |
| `npm run start:render` | Run the bundled API server |
| `npm run typecheck` | TypeScript check only |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |

## Environment variables

Copy `.env.example` to `.env`. Never commit `.env`. The repository is public, so every committed
file must be safe for anyone to read.

- **Browser-safe (`VITE_` prefix):** `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`. These are
  bundled into the frontend. Never put secrets in a `VITE_` variable.
- **Server-only:** `CLERK_SECRET_KEY`, `MONGODB_URI`, `MONGODB_DB_NAME`, `ADMIN_CLERK_USER_IDS`.
  These belong in your local `.env` and in the Render service settings only.

## Live marine conditions

`GET /api/marine?beachId=rushikonda|rk-beach` returns modelled wave height, wave period and sea-surface
temperature from the Open-Meteo Marine API. These are **model forecasts, not sensor observations**, and
not a safety assessment. The server reuses a stored `marine_observations` record for 10 minutes, otherwise
calls the provider (10 s timeout) and stores the result. If the provider fails it returns the last stored
record flagged `fallback` (and `stale` after 3 h of model age), or HTTP 503 with no values. Missing fields
stay `null`. Optional `CORS_ALLOWED_ORIGINS` (comma separated) allows extra browser origins.

`vercel.json` rewrites non-API paths to `index.html` so `/dashboard` works on direct visits.
