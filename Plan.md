# Implementation Plan — Plan A: React + Express + SQLite

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 + TypeScript |
| UI | Tailwind CSS (custom components) |
| Charts | Recharts |
| State | Zustand |
| Backend | Node.js + Express 4 + TypeScript |
| Database | SQLite via better-sqlite3 |
| Validation | Zod (shared FE + BE) |
| CSV | fast-csv |
| Auth | express-session + bcryptjs |

## Phased Build Steps

| Phase | Task | Status |
|---|---|---|
| 1 | Root monorepo + package.json + tsconfigs | DONE |
| 2 | DB schema (schema.sql) + singleton (database.ts) + 15-item seed | DONE |
| 3 | CRUD API: GET list, GET /:id, POST, PUT, DELETE + Zod validation | DONE |
| 4 | Auth API: POST /login, POST /logout, GET /me | DONE |
| 5 | CSV routes: GET /export (fast-csv), POST /import (multer + fast-csv) | DONE |
| 6 | Analytics route: summary, byCategory, bySupplier, recentHistory | DONE |
| 7 | Client foundation: Vite, Tailwind, Router, Zustand, Axios client | DONE |
| 8 | Layout: Sidebar, Header (low-stock badge), Layout wrapper | DONE |
| 9 | Shared components: Modal, ConfirmDialog, Toast, SearchBar | DONE |
| 10 | Inventory components: ItemTable (sortable), ItemForm (modal), FilterPanel | DONE |
| 11 | Dashboard page: StatsCards + LowStockAlert + Bar + Pie + History | DONE |
| 12 | Inventory page: full CRUD + search/filter/pagination + CSV import/export | DONE |
| 13 | Analytics page: 4 charts + category table | DONE |
| 14 | Login page: form + demo credential buttons | DONE |
| 15 | .claude/settings.json (SQLite MCP) | DONE |
| 16 | .claude/hooks.json (PostToolUse auto-lint) | DONE |
| 17 | .claude/skills/crud-test-suite.md | DONE |
| 18 | CLAUDE.md + requirements.md + Plan.md + prompts.md | DONE |

## Verification Checklist

- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts both servers
- [ ] Navigate to http://localhost:5173 → redirected to /login
- [ ] Login as admin/admin123 → Dashboard loads with charts
- [ ] Add new item → appears in table immediately
- [ ] Edit item → changes reflected
- [ ] Delete item → confirmation dialog → item removed
- [ ] Search by name/SKU → filtered results
- [ ] Import CSV → items added
- [ ] Export CSV → file downloads
- [ ] Analytics charts render with data
- [ ] Login as viewer/viewer123 → edit/delete buttons hidden
- [ ] Low-stock badge visible in header when items are below threshold
