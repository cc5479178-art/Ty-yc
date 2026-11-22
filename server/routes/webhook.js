const express = require('express');
const Stripe = require('stripe');
const db = require('../db');
const config = require('../config');
const { sendOwnerEmail, whatsappLink, money } = require('../services/notify');

const router = express.Router();
const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(400).send('Stripe not configured');

  let event;
  if (config.stripeWebhookSecret) {
    const sig = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret);
    } catch (err) {
      return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    }
  } else {
    event = JSON.parse(req.body.toString());
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = Number(session.metadata?.order_id || session.client_reference_id);
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (row && row.status === 'pending_payment') {
      db.prepare("UPDATE orders SET status = 'paid', updated_at = datetime('now') WHERE id = ?").run(orderId);
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
      await sendOwnerEmail(
        `CraftNest order #${orderId} paid`,
        `New paid order on CraftNest!\n\nOrder: #${orderId}\nCustomer: ${row.customer_name}\nPhone: ${row.customer_phone}\nAddress: ${row.address}\nTotal: ${money(row.total_cents, row.currency)}\n\nWhatsApp:\n${whatsappLink(row, items) || 'Set OWNER_WHATSAPP in .env to get one-tap WhatsApp alerts.'}`
      );
    }
  }

  res.json({ received: true });
});

module.exports = router;
