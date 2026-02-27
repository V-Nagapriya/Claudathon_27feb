# CLAUDE.md — Inventory Dashboard

## Project Overview

Full-stack CRUD inventory management web application built for the **Cognizant Claude-A-Thon 2026**.

**Stack:** React 18 + Vite + TypeScript (frontend) | Node.js + Express + TypeScript (backend) | SQLite via `node:sqlite` (Node 22 built-in — no native compilation needed)

## Repository Layout

```
sample project/
├── client/          ← React Vite frontend (port 5173)
├── server/          ← Express API backend (port 3001)
├── .claude/
│   ├── settings.json  ← SQLite MCP plugin
│   ├── hooks.json     ← Auto-lint hook
│   └── skills/
│       └── crud-test-suite.md
├── CLAUDE.md
├── requirements.md
├── Plan.md
├── prompts.md
└── package.json     ← Monorepo root
```

## Getting Started

```bash
npm install          # installs all workspaces
npm run dev          # starts both server (3001) + client (5173) concurrently
```

Default accounts (seeded on first run):

| User    | Password   | Role    |
|---------|------------|---------|
| admin   | admin123   | admin   |
| viewer  | viewer123  | viewer  |

## Architecture Decisions

- **better-sqlite3** — synchronous SQLite driver, no connection pool needed, zero-config
- **Zod validation** — shared schemas validate both API request bodies and CSV imports
- **express-session** — cookie-based sessions (no JWT complexity for hackathon scope)
- **Zustand** — minimal global state (user session, low-stock list, toast notifications)
- **Vite proxy** — dev frontend proxies `/api/*` to `localhost:3001` (no CORS issues)

## API Reference

| Method | Route               | Auth    | Description                     |
|--------|---------------------|---------|----------------------------------|
| POST   | /api/auth/login     | None    | Login, returns session cookie    |
| POST   | /api/auth/logout    | Any     | Destroy session                  |
| GET    | /api/auth/me        | Any     | Current user info                |
| GET    | /api/items          | Any     | List items (search/filter/page)  |
| GET    | /api/items/low-stock| Any     | Items below threshold            |
| GET    | /api/items/analytics| Any     | Aggregate stats                  |
| GET    | /api/items/:id      | Any     | Single item                      |
| POST   | /api/items          | Admin   | Create item                      |
| PUT    | /api/items/:id      | Admin   | Update item                      |
| DELETE | /api/items/:id      | Admin   | Delete item                      |
| GET    | /api/csv/export     | Any     | Download all items as CSV        |
| POST   | /api/csv/import     | Admin   | Upload CSV file for bulk insert  |

## Key Files

- [server/src/db/schema.sql](server/src/db/schema.sql) — DB schema + triggers + indexes
- [server/src/db/database.ts](server/src/db/database.ts) — singleton DB + seed data
- [server/src/routes/items.ts](server/src/routes/items.ts) — CRUD endpoints
- [server/src/schemas.ts](server/src/schemas.ts) — Zod validation schemas
- [client/src/pages/Inventory.tsx](client/src/pages/Inventory.tsx) — main CRUD page
- [client/src/pages/Dashboard.tsx](client/src/pages/Dashboard.tsx) — KPI + charts
- [client/src/pages/Analytics.tsx](client/src/pages/Analytics.tsx) — deep analytics

## Plugins / Hooks / Skills

### Plugin — SQLite MCP
Configured in `.claude/settings.json`. Allows Claude to query the live SQLite database
directly during development sessions using the `@modelcontextprotocol/server-sqlite` MCP server.

### Hook — Auto-Lint
Configured in `.claude/hooks.json`. After every `Edit` or `Write` tool use, runs ESLint
with `--fix` on `client/src`. Ensures React/TypeScript code stays lint-clean automatically.

### Skill — CRUD Test Suite
Defined in `.claude/skills/crud-test-suite.md`. Invoke with:
> "run the crud-test-suite skill"

Generates comprehensive Vitest + supertest integration tests for all 15 CRUD scenarios.

## Development Notes

- SQLite database file is created at `server/inventory.db` on first run
- Seed data (15 items + 2 users) is inserted automatically if tables are empty
- Low-stock threshold defaults to 10 units per item (configurable per item)
- Stock history is recorded on every create/update that changes quantity
- CSV import skips duplicate SKUs and returns a count of inserted vs skipped rows
