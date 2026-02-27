import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { getDb } from '../db/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ─── A2UI system prompt ────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are InvenTrack AI, an intelligent inventory management assistant powered by the A2UI (Agent-to-UI) protocol.

When users ask questions about inventory data, you MUST respond ONLY with newline-delimited JSON messages that follow the A2UI v0.9 protocol format.
Do NOT include any plain text or markdown — every line of your response must be a valid JSON object.

## A2UI Protocol Rules
1. Always start with a createSurface message.
2. Then send one or more updateComponents messages.
3. Each message is a complete JSON object on its own line.
4. Components have: id (unique string), type (see catalog below), parentId? (optional), data (object).
5. Use parentId to nest components (e.g. a row inside a container).

## Available Component Catalog
- Heading: data: { text: string, level: 1|2|3 }
- TextBlock: data: { content: string }
- AlertBanner: data: { message: string, variant: "info"|"warning"|"error"|"success" }
- StatsGrid: data: { stats: Array<{ title: string, value: string|number, subtitle?: string, color: "blue"|"green"|"yellow"|"red" }> }
- InventoryTable: data: { items: Array<InventoryItem>, caption?: string }
- CategoryChart: data: { data: Array<{ category: string, total_value: number, count: number, total_qty: number }> }
- SupplierChart: data: { data: Array<{ supplier: string, total_value: number, count: number }> }
- Divider: data: {}

## Example response for "Show low stock items":
{"type":"createSurface","surfaceId":"ai-panel"}
{"type":"updateComponents","surfaceId":"ai-panel","components":[{"id":"h1","type":"Heading","data":{"text":"Low Stock Items","level":2}},{"id":"alert1","type":"AlertBanner","data":{"message":"4 items are below their minimum threshold and need restocking.","variant":"warning"}},{"id":"tbl1","type":"InventoryTable","data":{"items":[...],"caption":"Items at or below threshold"}}]}

## Current Inventory Data
{INVENTORY_DATA}

Remember: respond ONLY with newline-delimited JSON. No prose, no markdown fences.`;

// ─── POST /api/ai/surface ──────────────────────────────────────────────────
router.post('/surface', requireAuth, async (req: Request, res: Response) => {
  const { query } = req.body as { query?: string };

  if (!query?.trim()) {
    res.status(400).json({ error: 'Query is required' });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured on server' });
    return;
  }

  // ── Collect inventory snapshot ────────────────────────────────────────────
  const db = getDb();

  const items = db.prepare(
    "SELECT * FROM inventory_items WHERE status = 'active' ORDER BY quantity ASC LIMIT 50"
  ).all();

  const lowStock = db.prepare(
    "SELECT * FROM inventory_items WHERE quantity <= low_stock_threshold AND status = 'active' ORDER BY quantity ASC"
  ).all();

  const byCategory = db.prepare(`
    SELECT category, COUNT(*) as count,
           SUM(quantity * unit_price) as total_value,
           SUM(quantity) as total_qty
    FROM inventory_items WHERE status = 'active'
    GROUP BY category ORDER BY total_value DESC
  `).all();

  const bySupplier = db.prepare(`
    SELECT supplier, COUNT(*) as count, SUM(quantity * unit_price) as total_value
    FROM inventory_items WHERE status = 'active' AND supplier IS NOT NULL
    GROUP BY supplier ORDER BY total_value DESC LIMIT 10
  `).all();

  const summary = db.prepare(`
    SELECT
      COUNT(*) as totalItems,
      SUM(quantity * unit_price) as totalValue,
      SUM(CASE WHEN quantity <= low_stock_threshold THEN 1 ELSE 0 END) as lowStockCount,
      SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as outOfStock
    FROM inventory_items WHERE status = 'active'
  `).get();

  const inventoryData = JSON.stringify({ summary, items, lowStock, byCategory, bySupplier });
  const systemPrompt = SYSTEM_PROMPT.replace('{INVENTORY_DATA}', inventoryData);

  // ── Set up SSE response ───────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (data: string) => {
    res.write(`data: ${data}\n\n`);
  };

  // ── Call Claude ───────────────────────────────────────────────────────────
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: query.trim() }],
    });

    let buffer = '';

    stream.on('text', (chunk) => {
      buffer += chunk;
      // Emit complete lines as SSE events
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          JSON.parse(trimmed); // Only emit valid JSON
          sendEvent(trimmed);
        } catch {
          // Skip non-JSON lines (shouldn't happen with correct prompt)
        }
      }
    });

    await stream.finalMessage();

    // Flush remaining buffer
    if (buffer.trim()) {
      try {
        JSON.parse(buffer.trim());
        sendEvent(buffer.trim());
      } catch {}
    }

    sendEvent(JSON.stringify({ type: 'done' }));
    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI error';
    sendEvent(JSON.stringify({ type: 'error', message }));
    res.end();
  }
});

export default router;
