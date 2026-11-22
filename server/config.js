require('dotenv').config({ override: true });

const config = {
  port: process.env.PORT || 4000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  dbFile: process.env.DB_FILE || require('path').join(__dirname, '..', 'data.sqlite'),

  adminEmail: process.env.ADMIN_EMAIL || 'admin@craftnest.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',

  ownerEmail: process.env.OWNER_EMAIL || '',
  ownerWhatsapp: (process.env.OWNER_WHATSAPP || '').replace(/[^0-9]/g, ''),

  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  currency: process.env.CURRENCY || 'inr',

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'CraftNest <no-reply@craftnest.local>'
  }
};

module.exports = config;
