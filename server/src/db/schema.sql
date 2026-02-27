-- Inventory Items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  name                TEXT NOT NULL,
  sku                 TEXT UNIQUE NOT NULL,
  category            TEXT NOT NULL,
  quantity            INTEGER NOT NULL DEFAULT 0,
  unit_price          REAL NOT NULL,
  supplier            TEXT,
  location            TEXT,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active','inactive','discontinued')),
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table (admin / viewer roles)
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'viewer'
                  CHECK(role IN ('admin','viewer')),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Stock history for analytics
CREATE TABLE IF NOT EXISTS stock_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id    INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL,
  changed_by TEXT,
  note       TEXT,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Triggers to keep updated_at current
CREATE TRIGGER IF NOT EXISTS update_item_timestamp
AFTER UPDATE ON inventory_items
BEGIN
  UPDATE inventory_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_items_sku      ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_items_status   ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_history_item   ON stock_history(item_id);
