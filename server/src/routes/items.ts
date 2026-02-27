import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { ItemCreateSchema, ItemUpdateSchema, PaginationSchema, PaginationQuery } from '../schemas';

const router = Router();

// GET /api/items — list with search, filter, sort, pagination
router.get('/', requireAuth, validateQuery(PaginationSchema), (req: Request, res: Response) => {
  const db = getDb();
  const q = (req as Request & { validatedQuery: PaginationQuery }).validatedQuery;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (q.search) {
    conditions.push("(name LIKE ? OR sku LIKE ? OR supplier LIKE ?)");
    const term = `%${q.search}%`;
    params.push(term, term, term);
  }
  if (q.category) {
    conditions.push("category = ?");
    params.push(q.category);
  }
  if (q.status) {
    conditions.push("status = ?");
    params.push(q.status);
  }
  if (q.lowStock) {
    conditions.push("quantity <= low_stock_threshold");
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = `ORDER BY ${q.sort} ${q.order.toUpperCase()}`;
  const offset = (q.page - 1) * q.limit;

  const total = (db.prepare(`SELECT COUNT(*) as count FROM inventory_items ${where}`).get(...params) as { count: number }).count;
  const items = db.prepare(`SELECT * FROM inventory_items ${where} ${orderBy} LIMIT ? OFFSET ?`).all(...params, q.limit, offset);

  res.json({
    data: items,
    pagination: {
      total,
      page: q.page,
      limit: q.limit,
      pages: Math.ceil(total / q.limit),
    },
  });
});

// GET /api/items/low-stock — items at or below threshold
router.get('/low-stock', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const items = db.prepare(
    "SELECT * FROM inventory_items WHERE quantity <= low_stock_threshold AND status = 'active' ORDER BY quantity ASC"
  ).all();
  res.json({ data: items, count: (items as unknown[]).length });
});

// GET /api/analytics/summary — aggregate stats
router.get('/analytics', requireAuth, (req: Request, res: Response) => {
  const db = getDb();

  const totalItems = (db.prepare("SELECT COUNT(*) as count FROM inventory_items WHERE status = 'active'").get() as { count: number }).count;
  const lowStockCount = (db.prepare("SELECT COUNT(*) as count FROM inventory_items WHERE quantity <= low_stock_threshold AND status = 'active'").get() as { count: number }).count;
  const totalValue = (db.prepare("SELECT SUM(quantity * unit_price) as value FROM inventory_items WHERE status = 'active'").get() as { value: number | null }).value ?? 0;
  const outOfStock = (db.prepare("SELECT COUNT(*) as count FROM inventory_items WHERE quantity = 0 AND status = 'active'").get() as { count: number }).count;

  const byCategory = db.prepare(`
    SELECT category, COUNT(*) as count, SUM(quantity * unit_price) as total_value, SUM(quantity) as total_qty
    FROM inventory_items WHERE status = 'active'
    GROUP BY category ORDER BY total_value DESC
  `).all();

  const bySupplier = db.prepare(`
    SELECT supplier, COUNT(*) as count, SUM(quantity * unit_price) as total_value
    FROM inventory_items WHERE status = 'active' AND supplier IS NOT NULL
    GROUP BY supplier ORDER BY total_value DESC LIMIT 10
  `).all();

  const recentHistory = db.prepare(`
    SELECT sh.*, ii.name as item_name, ii.sku
    FROM stock_history sh
    JOIN inventory_items ii ON ii.id = sh.item_id
    ORDER BY sh.recorded_at DESC LIMIT 20
  `).all();

  res.json({
    summary: { totalItems, lowStockCount, totalValue, outOfStock },
    byCategory,
    bySupplier,
    recentHistory,
  });
});

// GET /api/items/:id — single item
router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const item = db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  res.json({ data: item });
});

// POST /api/items — create
router.post('/', requireAdmin, validateBody(ItemCreateSchema), (req: Request, res: Response) => {
  const db = getDb();
  const body = req.body;

  // Check duplicate SKU
  const existing = db.prepare("SELECT id FROM inventory_items WHERE sku = ?").get(body.sku);
  if (existing) {
    res.status(400).json({ error: `SKU '${body.sku}' already exists` });
    return;
  }

  const result = db.prepare(`
    INSERT INTO inventory_items (name, sku, category, quantity, unit_price, supplier, location, low_stock_threshold, status)
    VALUES (@name, @sku, @category, @quantity, @unit_price, @supplier, @location, @low_stock_threshold, @status)
  `).run(body);

  const item = db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(result.lastInsertRowid);

  // Log stock history
  db.prepare("INSERT INTO stock_history (item_id, quantity, changed_by, note) VALUES (?, ?, ?, ?)")
    .run(result.lastInsertRowid, body.quantity, req.session?.user?.username ?? 'system', 'Item created');

  res.status(201).json({ data: item });
});

// PUT /api/items/:id — update
router.put('/:id', requireAdmin, validateBody(ItemUpdateSchema), (req: Request, res: Response) => {
  const db = getDb();
  const id = req.params.id;
  const body = req.body;

  const existing = db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(id);
  if (!existing) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  // Check SKU uniqueness if changing SKU
  if (body.sku) {
    const skuConflict = db.prepare("SELECT id FROM inventory_items WHERE sku = ? AND id != ?").get(body.sku, id);
    if (skuConflict) {
      res.status(400).json({ error: `SKU '${body.sku}' already used by another item` });
      return;
    }
  }

  const fields = Object.keys(body).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE inventory_items SET ${fields} WHERE id = @id`).run({ ...body, id });

  // Log stock change if quantity changed
  if (body.quantity !== undefined && body.quantity !== (existing as { quantity: number }).quantity) {
    db.prepare("INSERT INTO stock_history (item_id, quantity, changed_by, note) VALUES (?, ?, ?, ?)")
      .run(id, body.quantity, req.session?.user?.username ?? 'system', `Quantity updated from ${(existing as { quantity: number }).quantity} to ${body.quantity}`);
  }

  const updated = db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(id);
  res.json({ data: updated });
});

// DELETE /api/items/:id — delete
router.delete('/:id', requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM inventory_items WHERE id = ?").get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  db.prepare("DELETE FROM inventory_items WHERE id = ?").run(req.params.id);
  res.json({ message: 'Item deleted successfully' });
});

export default router;
