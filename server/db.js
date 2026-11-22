const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const config = require('./config');

const db = new Database(config.dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Ornaments',
  price_cents INTEGER NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 10,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending_payment',
  total_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  stripe_session_id TEXT,
  notify_email_sent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  qty INTEGER NOT NULL
);
`);

function seedAdminAndProducts() {
  const admin = db.prepare("SELECT id FROM users WHERE email = ?").get(config.adminEmail);
  if (!admin) {
    db.prepare("INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, '', ?, 'admin')")
      .run('Owner', config.adminEmail, bcrypt.hashSync(config.adminPassword, 10));
    console.log(`Seeded admin account: ${config.adminEmail}`);
  }

  const count = db.prepare("SELECT COUNT(*) AS c FROM products").get().c;
  if (count === 0) {
    const insert = db.prepare(
      "INSERT INTO products (name, description, category, price_cents, image_url, stock) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const seed = [
      ['Handmade Diwali Diya Set', 'Set of 6 clay diyas hand-painted with traditional motifs.', 'Festive', 49900, 'https://images.unsplash.com/photo-1605018993452-c7c8b02d3a8d?w=600', 25],
      ['Brass Peacock Wall Hanging', 'Etched brass peacock ornament, perfect for living room walls.', 'Wall Decor', 129900, 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600', 12],
      ['Macrame Dream Catcher', 'Cotton macrame dream catcher with wooden beads, 45 cm.', 'Boho', 79900, 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=600', 18],
     ['Marble Ganesha Idol', 'Hand-carved marble dust Ganesha idol, 8 inch.', 'Spiritual', 99900, 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600', 15],
      ['Terracotta Wind Chime', 'Hand-molded terracotta bells strung on jute rope.', 'Garden', 64900, 'https://images.unsplash.com/photo-1526057565006-20beab8dd2ed?w=600', 20],
      ['Warli Art Coaster Set', 'Set of 4 wooden coasters painted with Warli tribal art.', 'Tableware', 35900, 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600', 30]
    ];
    for (const row of seed) insert.run(...row);
    console.log(`Seeded ${seed.length} sample products`);
  }
}

seedAdminAndProducts();

module.exports = db;
