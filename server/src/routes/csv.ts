import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parse } from 'fast-csv';
import { format } from 'fast-csv';
import { Readable, Writable } from 'stream';
import { getDb } from '../db/database';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { ItemCreateSchema } from '../schemas';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/csv/export — download all items as CSV
router.get('/export', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const items = db.prepare("SELECT * FROM inventory_items ORDER BY id ASC").all() as Record<string, unknown>[];

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="inventory-${Date.now()}.csv"`);

  const csvStream = format({ headers: true });
  csvStream.pipe(res as unknown as Writable);

  for (const item of items) {
    csvStream.write(item);
  }
  csvStream.end();
});

// POST /api/csv/import — bulk insert from uploaded CSV
router.post('/import', requireAdmin, upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const db = getDb();
  const results: { inserted: number; skipped: number; errors: string[] } = {
    inserted: 0,
    skipped: 0,
    errors: [],
  };

  const rows: Record<string, unknown>[] = [];

  const stream = Readable.from(req.file.buffer.toString('utf8'));
  const parser = parse({ headers: true, trim: true, ignoreEmpty: true });

  parser.on('data', (row: Record<string, string>) => {
    rows.push({
      name: row.name || row.Name,
      sku: (row.sku || row.SKU || '').toUpperCase(),
      category: row.category || row.Category,
      quantity: parseInt(row.quantity || row.Quantity || '0', 10),
      unit_price: parseFloat(row.unit_price || row['Unit Price'] || '0'),
      supplier: row.supplier || row.Supplier || null,
      location: row.location || row.Location || null,
      low_stock_threshold: parseInt(row.low_stock_threshold || row['Low Stock Threshold'] || '10', 10),
      status: row.status || row.Status || 'active',
    });
  });

  parser.on('end', () => {
    const insertStmt = db.prepare(`
      INSERT INTO inventory_items (name, sku, category, quantity, unit_price, supplier, location, low_stock_threshold, status)
      VALUES (@name, @sku, @category, @quantity, @unit_price, @supplier, @location, @low_stock_threshold, @status)
    `);

    db.exec('BEGIN');
    try {
      for (const row of rows) {
        const parsed = ItemCreateSchema.safeParse(row);
        if (!parsed.success) {
          results.errors.push(`Row SKU '${row.sku}': ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
          results.skipped++;
          continue;
        }
        const existing = db.prepare("SELECT id FROM inventory_items WHERE sku = ?").get(parsed.data.sku);
        if (existing) {
          results.skipped++;
          results.errors.push(`SKU '${parsed.data.sku}' already exists — skipped`);
          continue;
        }
        insertStmt.run(parsed.data);
        results.inserted++;
      }
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }
    res.json({ message: `Import complete`, ...results });
  });

  parser.on('error', (err) => {
    res.status(400).json({ error: 'CSV parse error', detail: err.message });
  });

  stream.pipe(parser);
});

export default router;
