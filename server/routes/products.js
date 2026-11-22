const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../auth');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY id DESC').all();
  res.json({ products: rows });
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Product not found' });
  res.json({ product: row });
});

router.post('/', requireAdmin, (req, res) => {
  const { name, description, category, price, image_url, stock } = req.body || {};
  if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });
  const info = db.prepare(
    'INSERT INTO products (name, description, category, price_cents, image_url, stock) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    String(name).trim(),
    String(description || '').trim(),
    String(category || 'Ornaments').trim(),
    Math.round(Number(price) * 100),
    String(image_url || '').trim(),
    Number(stock) || 0
  );
  res.json({ product: db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid) });
});

router.patch('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  const b = req.body || {};
  db.prepare(`UPDATE products SET
      name = ?, description = ?, category = ?, price_cents = ?, image_url = ?, stock = ?, active = ?
    WHERE id = ?`).run(
    b.name !== undefined ? String(b.name).trim() : existing.name,
    b.description !== undefined ? String(b.description).trim() : existing.description,
    b.category !== undefined ? String(b.category).trim() : existing.category,
    b.price !== undefined ? Math.round(Number(b.price) * 100) : existing.price_cents,
    b.image_url !== undefined ? String(b.image_url).trim() : existing.image_url,
    b.stock !== undefined ? Number(b.stock) : existing.stock,
    b.active !== undefined ? (b.active ? 1 : 0) : existing.active,
    existing.id
  );
  res.json({ product: db.prepare('SELECT * FROM products WHERE id = ?').get(existing.id) });
});

router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
