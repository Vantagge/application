# Operations and Deployment Guide

This document explains how to run, test, lint, format, build, and deploy the application in development and production. It also covers infrastructure dependencies (Supabase, Storage, Cron) required by key features like the Loyalty Program.

## Overview
- Framework: Next.js 16 (App Router)
- Language: TypeScript
- Package manager: pnpm
- Platform services: Supabase (Auth, Database, Storage)

## Prerequisites
- Node.js 18.18+ (recommend 20 LTS)
- pnpm 9+
- Supabase project and keys (URL + anon key; service role key recommended for server actions)

## Environment Variables
Set the following variables in a `.env.local` for local dev and in your hosting provider for deployments.

Required for runtime:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_URL (server)
- SUPABASE_SERVICE_ROLE_KEY (server; preferred) or SUPABASE_ANON_KEY
- CRON_SECRET (for the scheduled job endpoint)

Example `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-key
CRON_SECRET=change-me
```

## Database Setup
Run migrations in Supabase SQL Editor in order by filename (scripts/00x_*.sql). Important reward-related migrations:
- 014_extend_customer_loyalty_for_rewards.sql
- 015_create_reward_redemptions_table.sql
- 016_extend_establishment_configs_for_rewards.sql

## Storage Bucket
The server action that generates loyalty card images calls `ensureEstablishmentAssetsBucket()` and creates or updates the `establishment-assets` bucket as public and with size limits. No additional manual step is required, but you can pre-create this bucket in Supabase Storage for visibility.

## Cron Job (Rewards Expiration)
- Endpoint: `GET /api/cron/expire-rewards` with header `Authorization: Bearer ${CRON_SECRET}`
- Recommended schedule: daily
- Vercel example (vercel.json):
```
{
  "crons": [{ "path": "/api/cron/expire-rewards", "schedule": "0 0 * * *" }]
}
```

## Install and Run
- Install: `pnpm install`
- Dev server: `pnpm dev`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint` (fix: `pnpm lint:fix`)
- Format: `pnpm format` (check: `pnpm format:check`)
- Unit tests: `pnpm test` (watch: `pnpm test:watch`)
- Build: `pnpm build`
- Start: `pnpm start`

## CI
GitHub Actions workflow runs on push/PR:
- Install with pnpm
- Lint
- Typecheck
- Build (with dummy Supabase envs)
- Unit tests

See `.github/workflows/ci.yml`.

## Notes for Production
- Keep email confirmations enabled in production Auth.
- Use `SUPABASE_SERVICE_ROLE_KEY` on the server for bucket creation and admin operations.
- Restrict CRON endpoint with `CRON_SECRET` and only from your scheduler’s IPs if possible.
- Monitor `/api/health` endpoint for readiness.

## Troubleshooting
- "Supabase credentials not found": verify `.env.local` or hosting env configuration.
- Canvas/sharp build issues: ensure suitable build image (Ubuntu 20+), and install dependencies in CI before build.
- Next.js login redirects during cron: middleware allows `/api/health` and `/api/cron/*` through.
