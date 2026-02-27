# Prompts Log — Cognizant Claude-A-Thon 2026

This file documents all prompts used with Claude Code during this project, including
demonstrations of **Plugins**, **Hooks**, and **Skills** usage.

---

## Phase 1 — Planning (Plan Mode)

**Prompt:**
> "I need to build a production-ready CRUD inventory dashboard for the Cognizant Claude-A-Thon.
> Generate 3 different implementation plans with different tech stacks, scoring against the
> judging criteria: Feature Implementation (50pts), Prompt Engineering (30pts), Plugins/Hooks/Skills (10pts),
> Creativity (20pts). Include phased build steps, pros/cons, and a recommendation."

**Claude Feature Used:** Plan Mode (extended thinking applied to architectural trade-offs)

**Result:** 3 detailed plans (React+Express, Next.js+Prisma, React+FastAPI) with comparison matrix.

---

## Phase 2 — Implementation

**Prompt:**
> "im fine with proposed plan 1. proceed in implementation"

**Claude Feature Used:** Agentic execution — Claude autonomously built all 40+ files
across the full-stack without further intervention.

---

## Phase 3 — Plugin Usage (SQLite MCP)

**Prompt (example during development):**
> "Use the SQLite MCP tool to query the inventory database and show me which items
> are currently below their low_stock_threshold."

**Plugin:** `@modelcontextprotocol/server-sqlite` (configured in `.claude/settings.json`)

**Claude Feature Used:** MCP tool call — Claude queries the live SQLite DB directly,
no need to run curl commands or read log files.

**Example query Claude ran:**
```sql
SELECT name, sku, quantity, low_stock_threshold
FROM inventory_items
WHERE quantity <= low_stock_threshold AND status = 'active'
ORDER BY quantity ASC;
```

---

## Phase 4 — Hook Demonstration (PostToolUse Auto-Lint)

**Hook configuration** (`.claude/hooks.json`):
```json
{
  "PostToolUse": [{
    "matcher": "Edit|Write",
    "hooks": [{
      "type": "command",
      "command": "cd client && npx eslint src --fix --quiet 2>&1 | tail -5"
    }]
  }]
}
```

**How it works:**
Every time Claude uses the `Edit` or `Write` tool on a file, the hook automatically
runs ESLint with `--fix` on the `client/src` directory. This ensures all React/TypeScript
code remains lint-clean without manual intervention.

**Prompt that triggered the hook:**
> "Fix the ItemTable component to show a low-stock warning icon next to the item name."

After Claude edited `client/src/components/inventory/ItemTable.tsx`, the hook fired
automatically, corrected any lint issues, and Claude confirmed the hook output.

---

## Phase 5 — Skill Invocation (CRUD Test Suite)

**Skill definition** (`.claude/skills/crud-test-suite.md`): Documents 15 test scenarios
covering all CRUD operations, auth, validation errors, CSV import/export.

**Invocation prompt:**
> "run the crud-test-suite skill"

**Claude Feature Used:** Custom skill — Claude reads the skill definition and generates
a complete `server/src/routes/__tests__/items.test.ts` file with all 15 test cases
using Vitest + supertest, with an in-memory SQLite test database.

---

## Additional Prompts Used

### Validation debugging
> "The POST /api/items endpoint is returning 400 for valid data. Use the MCP SQLite
> plugin to check if the schema is correct, then diagnose the Zod schema mismatch."

### Chart enhancement
> "The analytics pie chart is too small on mobile. Update the Analytics page to use
> a responsive container and adjust the legend placement."

### CSV template generation
> "Generate a sample CSV template file that users can download as a starting point
> for bulk import, with headers matching our inventory schema."

### Role guard testing
> "Log in as the viewer user and confirm that the Add Item, Edit, and Delete buttons
> are not rendered. Check both the header and the ItemTable component."

---

## Prompt Engineering Techniques Used

| Technique | Where Applied |
|---|---|
| **Structured output request** | Plan generation (3 plans in table format) |
| **Constraint specification** | "Zod validation on all endpoints", "WAL mode" |
| **Role specification** | "Admin (full CRUD) vs Viewer (read-only)" |
| **Context preservation** | Session stored in express-session; Claude referenced it across calls |
| **Tool use direction** | "Use the MCP SQLite tool to query..." |
| **Incremental refinement** | Chart layout adjustments without full rewrites |
| **Skill composition** | Skill file breaks down 15 test scenarios Claude executes atomically |

---

## Plugins / Hooks / Skills Summary

### Plugin — SQLite MCP Server
- **Config:** `.claude/settings.json`
- **Purpose:** Allows Claude to query the live SQLite database during development
  using natural language or SQL via the MCP protocol.
- **Benefit:** Eliminates need to write throw-away debug scripts; Claude can validate
  data integrity and seed state without leaving the conversation.

### Hook — PostToolUse Auto-Lint
- **Config:** `.claude/hooks.json`
- **Trigger:** Every `Edit` or `Write` tool use
- **Command:** `cd client && npx eslint src --fix --quiet 2>&1 | tail -5`
- **Benefit:** Code quality is enforced automatically — no manual lint runs,
  no lint-failing CI surprises. Claude also sees lint output and can correct issues.

### Skill — CRUD Test Suite
- **Definition:** `.claude/skills/crud-test-suite.md`
- **Invocation:** "run the crud-test-suite skill"
- **Output:** Complete Vitest + supertest test file covering 15 scenarios
- **Benefit:** Reusable, well-defined test generation protocol. Can be re-run
  after any route changes to regenerate tests that match the current API.

---

## Phase 6 — A2UI Integration (Google Agent-to-UI Protocol)

**Prompt:**
> "suggest the ways of converting current user interface to A2UI"
> "convert my frontend to A2UI"

**Claude Feature Used:** Plan Mode to evaluate 3 approaches, then agentic implementation of
the recommended Hybrid approach.

### What was built

A Claude-powered **AI Assistant Panel** that implements the A2UI v0.9 protocol:

| File | Purpose |
|---|---|
| `server/src/routes/ai.ts` | SSE endpoint — queries DB, calls Claude, streams A2UI JSON |
| `client/src/a2ui/types.ts` | A2UI protocol type definitions (v0.9) |
| `client/src/a2ui/useSurface.ts` | Hook — processes A2UI messages, maintains surface state |
| `client/src/a2ui/catalog.tsx` | Component catalog (Heading, StatsGrid, InventoryTable, Charts…) |
| `client/src/a2ui/A2UISurfaceRenderer.tsx` | Renders A2UI surfaces using the catalog |
| `client/src/components/ai/AIAssistantPanel.tsx` | Panel UI — query input + live A2UI renderer |
| `client/src/api/ai.ts` | SSE stream helper |
| `client/src/components/layout/Header.tsx` | Added "Ask AI" button |

### How it works

1. User clicks **"Ask AI"** button in the app header
2. Types a natural language query (e.g. "show all low stock electronics")
3. Frontend POSTs to `/api/ai/surface`, receives SSE stream
4. Server queries inventory DB → feeds data to Claude with A2UI system prompt
5. Claude responds with A2UI protocol messages (newline-delimited JSON):
   ```json
   {"type":"createSurface","surfaceId":"ai-panel"}
   {"type":"updateComponents","surfaceId":"ai-panel","components":[...]}
   ```
6. `useSurface` hook processes each message, updating surface state
7. `A2UISurfaceRenderer` renders the live surface using the registered catalog components

### A2UI Protocol Coverage

| Message Type | Status |
|---|---|
| `createSurface` | Implemented |
| `updateComponents` | Implemented |
| `updateDataModel` | Implemented |
| `deleteSurface` | Implemented |
| `done` / `error` (extensions) | Implemented |

### A2UI Catalog Components Available to Claude

`Heading` · `TextBlock` · `Divider` · `AlertBanner` · `StatsGrid` · `InventoryTable` · `CategoryChart` · `SupplierChart`

### Setup

Set your Anthropic API key before starting the server:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```
