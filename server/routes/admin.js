const express = require('express');
const db = require('../db');
const config = require('../config');
const { requireAdmin } = require('../auth');

const router = express.Router();

const STATUSES = ['pending_payment', 'paid', 'packed', 'shipped', 'delivered', 'cancelled'];

function orderWithItems(id) {
  const order = db.prepare(`SELECT o.*, u.email AS user_email, u.phone AS user_phone
    FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?`).get(id);
  if (!order) return {};
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  return { order, items };
}

router.get('/stats', requireAdmin, (req, res) => {
  const counts = {};
  for (const s of STATUSES) counts[s] = 0;
  for (const row of db.prepare('SELECT status, COUNT(*) AS c FROM orders GROUP BY status').all()) {
    counts[row.status] = row.c;
  }
  const totalOrders = db.prepare('SELECT COUNT(*) AS c FROM orders').get().c;
  const paid = ['paid', 'packed', 'shipped', 'delivered'].map(s => counts[s]).reduce((a, b) => a + b, 0);
  const revenueRow = db.prepare(
    "SELECT COALESCE(SUM(total_cents), 0) AS revenue FROM orders WHERE status IN ('paid','packed','shipped','delivered')"
  ).get();
  const customers = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role != 'admin'").get().c;
  const lowStock = db.prepare('SELECT id, name, stock FROM products WHERE active = 1 AND stock <= 5 ORDER BY stock').all();
  const recent = db.prepare(`SELECT o.id, o.customer_name, o.status, o.total_cents, o.currency, o.created_at
    FROM orders o ORDER BY o.id DESC LIMIT 8`).all();
  res.json({
    counts, totalOrders, paidOrders: paid,
    revenueCents: revenueRow.revenue, currency: config.currency,
    customers, lowStock, recent
  });
});

router.get('/orders', requireAdmin, (req, res) => {
  const status = req.query.status;
  const base = `SELECT o.*, u.email AS user_email, u.phone AS user_phone
    FROM orders o JOIN users u ON u.id = o.user_id ${status ? 'WHERE o.status = ?' : ''}
    ORDER BY o.id DESC`;
  const rows = status ? db.prepare(base).all(status) : db.prepare(base).all();
  res.json({ orders: rows });
});

router.get('/orders/:id', requireAdmin, (req, res) => {
  const { order, items } = orderWithItems(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order, items });
});

router.patch('/orders/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, order.id);
  const result = orderWithItems(order.id);
  res.json({ order: result.order, items: result.items });
});

router.get('/users', requireAdmin, (req, res) => {
  res.json({ users: db.prepare('SELECT id, name, email, phone, role, created_at FROM users ORDER BY id DESC').all() });
});

module.exports = router;
