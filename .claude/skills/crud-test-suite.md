# CRUD Test Suite Skill

Generate unit + integration tests for all CRUD routes in `server/src/routes/items.ts`
using **Vitest** + **supertest**. Cover the following test cases:

## Required Test Cases

1. **POST /api/items** — create a valid item, expect 201 + returned item object
2. **POST /api/items** — create item with duplicate SKU, expect 400 + error message
3. **POST /api/items** — create item with missing required fields, expect 400 + validation errors
4. **GET /api/items** — list all items, expect 200 + pagination object
5. **GET /api/items?search=mouse** — search filter returns only matching items
6. **GET /api/items?lowStock=true** — returns only items at or below threshold
7. **GET /api/items/:id** — get single existing item, expect 200 + item data
8. **GET /api/items/999** — get non-existent item, expect 404
9. **PUT /api/items/:id** — update quantity, expect 200 + updated item
10. **PUT /api/items/:id** — update with duplicate SKU, expect 400
11. **DELETE /api/items/:id** — delete existing item, expect 200 + success message
12. **DELETE /api/items/999** — delete non-existent item, expect 404
13. **POST /api/csv/import** — upload valid CSV, expect inserted count > 0
14. **POST /api/csv/import** — upload CSV with malformed row, expect skipped count > 0
15. **GET /api/csv/export** — expect 200 + Content-Type text/csv

## Setup Requirements

- Use a separate in-memory SQLite database for tests (`:memory:`)
- Reset DB state between test suites using `beforeEach`
- Mock express-session to return admin user for write tests and viewer for read tests
- All tests must be independent and not rely on each other's state

## Output Format

Output a single file: `server/src/routes/__tests__/items.test.ts`
