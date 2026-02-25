# collector

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Start, Self, TRPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **tRPC** - End-to-end type-safe APIs
- **Drizzle** - TypeScript-first ORM
- **SQLite/Turso** - Database engine
- **Biome** - Linting and formatting
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses SQLite with Drizzle ORM.

1. Start the local SQLite database (optional):

```bash
bun run db:local
```

2. Update your `.env` file in the `apps/web` directory with the appropriate connection details if needed.

3. Apply the schema to your database:

```bash
bun run db:push
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the fullstack application.

## Git Hooks and Formatting

- Format and lint fix: `bun run check`

## Project Structure

```
collector/
├── apps/
│   └── web/         # Fullstack application (React + TanStack Start)
├── packages/
│   ├── api/         # API layer / business logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run db:local`: Start the local SQLite database
- `bun run check`: Run Biome formatting and linting

## Comment Scraper (Facebook, Instagram, YouTube, TikTok)

The API now exposes `comments.scrapeComments` in tRPC:

- Input: `{ platform, targetId, limit?, cursor? }`
- Supported `platform` values: `facebook`, `instagram`, `youtube`, `tiktok`
- Output: normalized comments array + `nextCursor`

Example call from code:

```ts
const data = await trpc.comments.scrapeComments.query({
  platform: "youtube",
  targetId: "VIDEO_ID",
  limit: 25,
});
```

The scraper uses official platform APIs:

- Facebook Graph API comments edge:
  - https://developers.facebook.com/docs/graph-api/reference/object/comments/
- Instagram Graph API media comments edge:
  - https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-media/comments
- YouTube Data API v3 `commentThreads.list`:
  - https://developers.google.com/youtube/v3/docs/commentThreads/list
- TikTok Research API video comment list:
  - https://developers.tiktok.com/doc/research-api-specs-query-video-comments/

## Environment Variables for Comment Scraper

Create or update `apps/web/.env` (the API runs in the web app server process):

```dotenv
DATABASE_URL=file:../../local.db
CORS_ORIGIN=http://localhost:3001
NODE_ENV=development

# Meta (Facebook + Instagram Graph API)
FACEBOOK_GRAPH_API_VERSION=v23.0
FACEBOOK_ACCESS_TOKEN=
INSTAGRAM_ACCESS_TOKEN=

# YouTube Data API v3
YOUTUBE_API_KEY=

# TikTok Research API
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
```

How to obtain each variable from official docs:

1. `FACEBOOK_ACCESS_TOKEN`
   - Token guide: https://developers.facebook.com/docs/facebook-login/guides/access-tokens/
   - Graph API overview: https://developers.facebook.com/docs/graph-api/overview
   - You need an access token authorized to read comments on the target object.
2. `INSTAGRAM_ACCESS_TOKEN`
   - Instagram Graph API overview: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/overview
   - Media comments reference: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-media/comments
   - Use a token for an Instagram Professional account connected to a Facebook Page.
3. `YOUTUBE_API_KEY`
   - Enable and configure YouTube Data API: https://developers.google.com/youtube/registering_an_application
   - Use API key with `commentThreads.list`: https://developers.google.com/youtube/v3/docs/commentThreads/list
4. `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET`
   - Client token flow: https://developers.tiktok.com/doc/client-access-token-management/
   - Video comments endpoint: https://developers.tiktok.com/doc/research-api-specs-query-video-comments/
   - TikTok comment collection requires Research API access approval.
