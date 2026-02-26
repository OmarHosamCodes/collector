# collector

`collector` is a Bun + Turborepo TypeScript monorepo.

It currently provides:

- A TanStack Start web app (`apps/web`)
- A tRPC API package (`packages/api`)
- A Drizzle + Turso/libSQL database package (`packages/db`)
- Shared environment validation package (`packages/env`)
- A multi-platform comment scraper (Facebook, Instagram, YouTube, TikTok)

## Tech stack

- Bun (package manager/runtime)
- Turborepo (workspace orchestration)
- TypeScript
- TanStack Start + TanStack Router + React Query
- tRPC
- Drizzle ORM + Turso/libSQL
- Zod + `@t3-oss/env-core`
- Biome

## Monorepo structure

```text
collector/
├── apps/
│   └── web/                 # TanStack Start app + tRPC HTTP handler
├── packages/
│   ├── api/                 # tRPC routers + comment scraper service
│   ├── db/                  # Drizzle setup (schema/migrations)
│   ├── env/                 # typed env validation (server/web)
│   └── config/              # shared tsconfig
└── turbo.json
```

## Prerequisites

- Bun `>= 1.3`
- Turso CLI only if you run `bun run db:local`

## Quick start

1. Install dependencies:

```bash
bun install
```

2. Create `apps/web/.env`:

```dotenv
DATABASE_URL=file:../../local.db
CORS_ORIGIN=http://localhost:3001
NODE_ENV=development

# Optional scraper config
FACEBOOK_GRAPH_API_VERSION=v23.0
FACEBOOK_ACCESS_TOKEN=
INSTAGRAM_ACCESS_TOKEN=
YOUTUBE_API_KEY=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
```

3. (Optional) Run local Turso DB file process:

```bash
bun run db:local
```

4. (Optional) Push schema:

```bash
bun run db:push
```

5. Start dev:

```bash
bun run dev
```

Open `http://localhost:3001`.

## Environment variables

Core (required):

- `DATABASE_URL`
- `CORS_ORIGIN`
- `NODE_ENV` (`development` | `production` | `test`)

Comment scraper (optional, per platform):

- `FACEBOOK_GRAPH_API_VERSION` (default: `v23.0`)
- `FACEBOOK_ACCESS_TOKEN`
- `INSTAGRAM_ACCESS_TOKEN`
- `YOUTUBE_API_KEY`
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`

### Token/permission notes (Meta)

1. `FACEBOOK_ACCESS_TOKEN`
   - Token type used by this implementation: **Page Access Token** (long-lived recommended), generated from a Facebook User access token.
   - Typical permissions: `pages_show_list`, `pages_read_engagement`, `pages_read_user_content`, `pages_manage_engagement` (if moderating/writing).

2. `INSTAGRAM_ACCESS_TOKEN`
   - Token type used by this implementation (`graph.facebook.com` flow): **Facebook User Access Token** (long-lived recommended) with access to the linked Page + Instagram professional account.
   - Main permission: `instagram_manage_comments` (plus dependency permissions in Meta docs).

## API surface (current)

The web app mounts tRPC at `/api/trpc`.

Routers/procedures currently available:

- `healthCheck` -> returns `"OK"`
- `comments.scrapeComments`

`comments.scrapeComments` input:

```ts
{
  platform: "facebook" | "instagram" | "youtube" | "tiktok";
  targetId: string;
  limit?: number; // 1..100
  cursor?: string;
}
```

Output (normalized):

```ts
{
  platform: string;
  targetId: string;
  comments: Array<{
    id: string;
    text: string;
    authorName: string | null;
    authorId: string | null;
    createdAt: string | null;
    likeCount: number | null;
    replyCount: number | null;
    raw: unknown;
  }>;
  nextCursor: string | null;
}
```

Example usage from web code:

```ts
const data = await trpc.comments.scrapeComments.query({
  platform: "youtube",
  targetId: "VIDEO_ID",
  limit: 25,
});
```

Notes:

- TikTok `targetId` must be numeric.
- TikTok cursor must be numeric when provided.
- Missing per-platform env vars return a `PRECONDITION_FAILED` API error.

## Scripts (root)

- `bun run dev` - run all dev tasks via Turbo
- `bun run build` - build workspaces
- `bun run check-types` - run Turbo `check-types` pipeline
- `bun run dev:web` - run only web dev task
- `bun run db:local` - run local Turso dev DB process
- `bun run db:push` - push Drizzle schema
- `bun run db:generate` - generate migrations/files via Drizzle
- `bun run db:migrate` - run migrations
- `bun run db:studio` - open Drizzle Studio
- `bun run check` - run Biome with write mode

## Official API docs used by scraper

- Facebook Graph API comments edge:
  - https://developers.facebook.com/docs/graph-api/reference/object/comments/
- Instagram Graph API media comments edge:
  - https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-media/comments
- YouTube Data API `commentThreads.list`:
  - https://developers.google.com/youtube/v3/docs/commentThreads/list
- TikTok Research API video comments:
  - https://developers.tiktok.com/doc/research-api-specs-query-video-comments/

Supporting docs:

- Meta access tokens:
  - https://developers.facebook.com/docs/facebook-login/guides/access-tokens/
- Meta permissions reference:
  - https://developers.facebook.com/docs/permissions
- YouTube API app setup:
  - https://developers.google.com/youtube/registering_an_application
- TikTok client token flow:
  - https://developers.tiktok.com/doc/client-access-token-management/

## Current implementation notes

- `packages/db/src/schema/index.ts` is currently a scaffold (`export {}`) with no tables yet.
- API context currently has no auth/session wiring.

## Compliance pages and scope usage

Public pages in the web app:

- `/privacy-policy` - Privacy Policy
- `/terms-of-service` - Terms of Service
- `/compliance` - Product and scope explanation

Submission-ready scope explanation:

- Product: Collector Web App
  - Lets users request comment retrieval by platform and target ID.
- Product: Collector API (`comments.scrapeComments`)
  - Retrieves public comment data from connected platform APIs and returns normalized results for analysis.
- Requested scope: `video.list`
  - Used by the TikTok integration to access video-linked resources needed for read-only comment retrieval and analysis.
  - No write, publish, edit, or delete actions are performed using this scope.

Revision included in this version (February 25, 2026):

- Added public Privacy Policy page.
- Added public Terms of Service page.
- Added `/compliance` page documenting products and `video.list` scope usage.
