# Requirements

## Functional Requirements

### Authentication
- [x] Login with username and password
- [x] Session-based authentication (cookie)
- [x] Two roles: **Admin** (full CRUD) and **Viewer** (read-only)
- [x] Logout clears session

### Inventory CRUD
- [x] **Create** — add new inventory item via form modal
- [x] **Read** — paginated list of all items (20 per page)
- [x] **Update** — edit item via pre-filled modal form
- [x] **Delete** — delete item with confirmation dialog

### Item Data Model
- [x] id, name, sku (unique), category, quantity, unit_price
- [x] supplier, location, low_stock_threshold, status
- [x] created_at, updated_at (auto-managed)

### Search & Filtering
- [x] Full-text search by name, SKU, supplier
- [x] Filter by category
- [x] Filter by status (active / inactive / discontinued)
- [x] Filter by low stock (quantity ≤ threshold)
- [x] Sortable columns (name, sku, quantity, price, category, dates)

### Dashboard
- [x] Total active items count
- [x] Total inventory value
- [x] Low stock item count
- [x] Out-of-stock count
- [x] Bar chart: inventory value by category
- [x] Pie chart: item count by category
- [x] Recent stock activity feed

### Analytics Page
- [x] KPI summary cards
- [x] Bar chart: value by category (coloured)
- [x] Donut chart: quantity distribution
- [x] Horizontal bar chart: value by supplier
- [x] Radar chart: category item count
- [x] Category breakdown table with per-unit averages

### Low Stock Alerts
- [x] Header badge showing count of low-stock items
- [x] Dismissible alert banner on Dashboard
- [x] Low-stock items highlighted in red in the table

### CSV Operations
- [x] Export all items as CSV download
- [x] Import items from uploaded CSV file
- [x] Duplicate SKUs skipped on import with report
- [x] Malformed rows skipped with error log

### Stock History
- [x] Stock changes logged on create and quantity updates
- [x] History feed visible on Dashboard

## Non-Functional Requirements

- [x] TypeScript end-to-end (frontend + backend)
- [x] Zod validation on all API endpoints
- [x] Role-based access control (Admin vs Viewer)
- [x] SQLite database with proper indexes and foreign keys
- [x] WAL mode for better SQLite performance
- [x] Responsive layout (desktop-first, flex/grid)
- [x] Tailwind CSS for consistent styling

## Claude-A-Thon Specific Requirements

- [x] Plugin configured (SQLite MCP server)
- [x] Hook configured (PostToolUse auto-lint)
- [x] Skill defined (CRUD test suite)
- [x] CLAUDE.md with architecture documentation
- [x] Plan.md with phased build approach
- [x] prompts.md with all prompts used
- [x] Agentic architecture: Plan Mode → sequential implementation → verification
