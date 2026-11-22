const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const config = require('./config');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhook');

const app = express();
app.use(cors({ origin: config.clientUrl }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'CraftNest API' }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);

app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.listen(config.port, () => {
  console.log(`CraftNest API listening on http://localhost:${config.port}`);
  console.log(`Stripe: ${config.stripeSecretKey ? 'enabled' : 'dev mode (simulated payments)'}`);
  console.log(`WhatsApp owner number: ${config.ownerWhatsapp ? 'configured' : 'not set (wa.me links disabled)'}`);
  console.log(`Email: ${config.ownerEmail && config.smtp.host ? 'configured' : 'not set'}`);
});
