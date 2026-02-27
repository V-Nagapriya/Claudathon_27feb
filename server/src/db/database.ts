// Uses Node.js built-in node:sqlite (available in Node 22.5+) — no native compilation needed
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(__dirname, '../../inventory.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH);
    _db.exec('PRAGMA journal_mode = WAL');
    _db.exec('PRAGMA foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: DatabaseSync): void {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);
  seedData(db);
}

function seedData(db: DatabaseSync): void {
  // Seed admin user if none exist
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount === 0) {
    const adminHash = bcrypt.hashSync('admin123', 10);
    const viewerHash = bcrypt.hashSync('viewer123', 10);
    db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)").run('admin', adminHash, 'admin');
    db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)").run('viewer', viewerHash, 'viewer');
  }

  // Seed inventory items if none exist
  const itemCount = (db.prepare('SELECT COUNT(*) as count FROM inventory_items').get() as { count: number }).count;
  if (itemCount === 0) {
    const insert = db.prepare(`
      INSERT INTO inventory_items (name, sku, category, quantity, unit_price, supplier, location, low_stock_threshold, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seedItems: [string, string, string, number, number, string, string, number, string][] = [
      ['Wireless Mouse', 'WM-001', 'Electronics', 45, 29.99, 'TechSupply Co', 'Warehouse A', 10, 'active'],
      ['Mechanical Keyboard', 'KB-002', 'Electronics', 8, 89.99, 'TechSupply Co', 'Warehouse A', 15, 'active'],
      ['Standing Desk', 'SD-003', 'Furniture', 12, 399.00, 'OfficeWorld', 'Warehouse B', 5, 'active'],
      ['Monitor 27"', 'MN-004', 'Electronics', 3, 349.99, 'DisplayTech', 'Warehouse A', 10, 'active'],
      ['Ergonomic Chair', 'EC-005', 'Furniture', 20, 259.00, 'OfficeWorld', 'Warehouse B', 8, 'active'],
      ['USB-C Hub', 'UH-006', 'Accessories', 60, 49.99, 'TechSupply Co', 'Warehouse A', 20, 'active'],
      ['Webcam HD', 'WC-007', 'Electronics', 5, 79.99, 'DisplayTech', 'Warehouse A', 10, 'active'],
      ['Desk Lamp', 'DL-008', 'Accessories', 35, 39.99, 'OfficeWorld', 'Warehouse C', 10, 'active'],
      ['Laptop Stand', 'LS-009', 'Accessories', 2, 59.99, 'TechSupply Co', 'Warehouse A', 5, 'active'],
      ['Headset Pro', 'HP-010', 'Electronics', 18, 149.99, 'SoundMax', 'Warehouse A', 10, 'active'],
      ['Notebook A4', 'NB-011', 'Stationery', 150, 4.99, 'PaperCo', 'Warehouse C', 50, 'active'],
      ['Whiteboard Markers', 'WBM-012', 'Stationery', 80, 12.99, 'PaperCo', 'Warehouse C', 30, 'active'],
      ['Power Strip', 'PS-013', 'Accessories', 25, 24.99, 'TechSupply Co', 'Warehouse B', 10, 'active'],
      ['Printer Paper', 'PP-014', 'Stationery', 9, 19.99, 'PaperCo', 'Warehouse C', 20, 'active'],
      ['Cable Organiser', 'CO-015', 'Accessories', 40, 14.99, 'TechSupply Co', 'Warehouse A', 15, 'active'],
    ];

    db.exec('BEGIN');
    try {
      for (const item of seedItems) {
        insert.run(...item);
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    // Seed some stock history
    const historyInsert = db.prepare(`
      INSERT INTO stock_history (item_id, quantity, changed_by, note)
      VALUES (?, ?, ?, ?)
    `);
    historyInsert.run(1, 45, 'system', 'Initial stock');
    historyInsert.run(2, 8, 'system', 'Initial stock');
    historyInsert.run(4, 3, 'system', 'Initial stock — low stock warning');
  }
}
