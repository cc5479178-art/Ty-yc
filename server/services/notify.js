const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;
if (config.smtp.host && config.smtp.user) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: { user: config.smtp.user, pass: config.smtp.pass }
  });
}

function money(cents, currency) {
  const symbols = { inr: '₹', usd: '$', eur: '€', gbp: '£' };
  const symbol = symbols[currency] || '';
  return `${symbol}${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

async function sendOwnerEmail(subject, text) {
  if (!config.ownerEmail || !transporter) {
    console.log('[mail] OWNER_EMAIL/SMTP not fully configured, email skipped:', subject);
    return false;
  }
  try {
    await transporter.sendMail({ from: config.smtp.from, to: config.ownerEmail, subject, text });
    return true;
  } catch (err) {
    console.error('[mail] failed:', err.message);
    return false;
  }
}

function waMessage(order, items) {
  const lines = items.map(i => `• ${i.name} x${i.qty} – ${money(i.price_cents * i.qty, order.currency)}`);
  return [
    `🛒 New CraftNest order #${order.id}`,
    `Customer: ${order.customer_name}`,
    `Phone: ${order.customer_phone}`,
    o => o,
    ...lines,
    `Total: ${money(order.total_cents, order.currency)}`,
    `Address: ${order.address}`
  ].filter(line => typeof line === 'string').join('\n');
}

function whatsappLink(order, items) {
  if (!config.ownerWhatsapp) return '';
  return `https://wa.me/${config.ownerWhatsapp}?text=${encodeURIComponent(waMessage(order, items))}`;
}

function registrationMessage(user) {
  return `👤 New CraftNest registration\nName: ${user.name}\nEmail: ${user.email}\nPhone: ${user.phone || 'not given'}`;
}

module.exports = { sendOwnerEmail, whatsappLink, registrationMessage, waMessage, money };
