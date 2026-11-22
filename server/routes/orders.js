const express = require('express');
const Stripe = require('stripe');
const db = require('../db');
const config = require('../config');
const { requireAuth } = require('../auth');
const { sendOwnerEmail, whatsappLink, money } = require('../services/notify');

const router = express.Router();
const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

function loadOrder(id) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return {};
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  return { order, items };
}

router.post('/', requireAuth, async (req, res) => {
  const { items, customer_name, customer_phone, address } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty' });
  }
  if (!customer_name || !customer_phone || !address) {
    return res.status(400).json({ error: 'Name, phone and delivery address are required' });
  }

  const getProduct = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1');
  let total = 0;
  const lineItems = [];
  for (const it of items) {
    const p = getProduct.get(it.product_id);
    if (!p) return res.status(400).json({ error: 'One of the items is no longer available' });
    const qty = Math.max(1, Math.min(Number(it.qty) || 1, 50));
    total += p.price_cents * qty;
    lineItems.push({ product_id: p.id, name: p.name, price_cents: p.price_cents, qty });
  }

  const tx = db.transaction(() => {
    const info = db.prepare(`INSERT INTO orders
        (user_id, status, total_cents, currency, customer_name, customer_phone, address, stripe_session_id)
      VALUES (?, 'pending_payment', ?, ?, ?, ?, ?, ?)`)
      .run(req.user.id, total, config.currency, String(customer_name).trim(),
           String(customer_phone).trim(), String(address).trim(), null);
    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, name, price_cents, qty) VALUES (?, ?, ?, ?, ?)'
    );
    for (const li of lineItems) insertItem.run(info.lastInsertRowid, li.product_id, li.name, li.price_cents, li.qty);
    return info.lastInsertRowid;
  });
  const orderId = tx();
  const { order } = loadOrder(orderId);

  if (stripe) {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems.map(li => ({
          quantity: li.qty,
          price_data: {
            currency: config.currency,
            unit_amount: li.price_cents,
            product_data: { name: li.name }
          }
        })),
        customer_email: req.user.email,
        client_reference_id: String(order.id),
        metadata: { order_id: String(order.id) },
        success_url: `${config.clientUrl}/order-success?order=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.clientUrl}/cart?cancelled=${order.id}`
      });
      db.prepare('UPDATE orders SET stripe_session_id = ? WHERE id = ?').run(session.id, order.id);
      return res.json({ order, checkout_url: session.url });
    } catch (err) {
      console.error('[stripe] checkout failed:', err.message);
      return res.status(500).json({ error: 'Could not start payment. Please try again.' });
    }
  }

  res.json({
    order,
    simulated: true,
    checkout_url: `${config.clientUrl}/order-success?order=${order.id}&simulated=1`
  });
});

router.get('/mine', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT o.*, (SELECT COALESCE(SUM(qty),0) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
    FROM orders o WHERE o.user_id = ? ORDER BY o.id DESC`).all(req.user.id);
  res.json({ orders: rows });
});

router.get('/:id', requireAuth, (req, res) => {
  const { order, items } = loadOrder(req.params.id);
  if (!order || (order.user_id !== req.user.id && req.user.role !== 'admin')) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({ order, items, whatsapp_url: whatsappLink(order, items) });
});

router.post('/:id/simulate-payment', requireAuth, async (req, res) => {
  const { order, items } = loadOrder(req.params.id);
  if (!order || order.user_id !== req.user.id) return res.status(404).json({ error: 'Order not found' });
  if (config.stripeSecretKey) {
    return res.status(400).json({ error: 'Stripe is configured; use the real checkout' });
  }
  if (order.status === 'pending_payment') {
    db.prepare("UPDATE orders SET status = 'paid', updated_at = datetime('now') WHERE id = ?").run(order.id);
    const fresh = loadOrder(order.id).order;
    await sendOwnerEmail(
      `CraftNest order #${order.id} paid`,
      `New paid order on CraftNest!\n\nOrder: #${order.id}\nCustomer: ${fresh.customer_name}\nPhone: ${fresh.customer_phone}\nAddress: ${fresh.address}\nTotal: ${money(fresh.total_cents, fresh.currency)}\n\nWhatsApp:\n${whatsappLink(fresh, items) || 'Set OWNER_WHATSAPP in .env to get one-tap WhatsApp alerts.'}`
    );
  }
  const updated = loadOrder(order.id);
  res.json({ order: updated.order, items: updated.items, whatsapp_url: whatsappLink(updated.order, updated.items) });
});

module.exports = router;
