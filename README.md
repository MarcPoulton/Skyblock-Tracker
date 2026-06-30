# Skyblock Progress Tracker

A private friend-group Skyblock progress tracker. Create a group, invite friends, link Minecraft accounts, and track maxing progress across skills, slayer, dungeons, collections, Senither weight, networth, minions, pets, and bestiary.

## Stack

- **Next.js 15+** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui components
- **PostgreSQL** + Drizzle ORM
- **Better Auth** (email/password)
- **Hypixel API** via `@skyblock-ts/core`
- **Networth** via `skyhelper-networth`
- **Vercel Cron** for scheduled syncs

## Prerequisites

1. Node.js 20+
2. PostgreSQL (local via Docker or [Neon](https://neon.tech) for production)
3. Hypixel API key from [developer.hypixel.net](https://developer.hypixel.net)
4. Each tracked player must enable **API settings in-game** (Settings → API)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Random 32+ char secret for auth |
| `BETTER_AUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Same as above, exposed to client |
| `HYPIXEL_API_KEY` | Server-side Hypixel API key |
| `CRON_SECRET` | Bearer token for `/api/sync` cron endpoint |

### 3. Start PostgreSQL (local)

```bash
docker compose up -d
```

Default connection: `postgresql://skyblock:skyblock@localhost:5432/skyblock_tracker`

### 4. Run database migrations

```bash
npm run db:push
```

Or apply the SQL migration manually:

```bash
psql $DATABASE_URL -f drizzle/0000_init.sql
```

### 5. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. **Register** an account and **create a group** (or join via invite code)
2. **Link your Minecraft IGN** and pick a Skyblock profile
3. View the **group dashboard** with sortable leaderboard
4. Click a player for **detailed category breakdowns** and **30-day trend charts**
5. **Manual refresh** is available once every 15 minutes per player

### Invite links

Share `/join/{INVITE_CODE}` with friends. Owners can regenerate codes in group settings.

### Scheduled sync

Vercel Cron hits `/api/sync` hourly (see `vercel.json`). Locally, trigger manually:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/sync
```

## Deploy to Vercel + Neon

1. Create a Neon PostgreSQL database and copy the connection string
2. Import the repo to Vercel
3. Set all environment variables from `.env.example`
4. Run `npm run db:push` against the Neon database (or apply `drizzle/0000_init.sql`)
5. Deploy — Vercel Cron will sync profiles automatically

## Project structure

```
app/           # Pages and API routes
components/    # UI (dashboard, player, shadcn)
db/            # Drizzle schema and client
lib/           # Auth, Hypixel client, metrics engine, sync
drizzle/       # SQL migrations
```

## Rate limits

Hypixel personal keys allow ~120 requests per 5 minutes. The sync job processes players sequentially with delays and caches API responses in Postgres.
