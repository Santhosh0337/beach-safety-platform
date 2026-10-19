
# Beach Safety Intelligence Platform

A prototype web platform for beach-zone safety information for tourists, fishermen, lifeguards,
and coastal authorities. Not validated for real emergency response.

## Status

Phase 1: minimal runnable foundation (React + TypeScript + Vite, `/api/health`).

## Requirements

- Node.js 24.x, npm 11+

## Setup

```powershell
npm install
npm run dev
```

Open http://localhost:5173 and http://localhost:5173/api/health.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server (frontend and local API bridge) |
| `npm run build` | Typecheck and build for production |
| `npm run typecheck` | TypeScript check only |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |

## Environment variables

Copy `.env.example` to `.env`. Never commit `.env`. Never put secrets in `VITE_` variables.
