const jwt = require('jsonwebtoken');
const config = require('./config');
const db = require('./db');

function authUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return db.prepare('SELECT id, name, email, phone, role FROM users WHERE id = ?').get(payload.id) || null;
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const user = authUser(req);
  if (!user) return res.status(401).json({ error: 'Please log in to continue' });
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  const user = authUser(req);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  req.user = user;
  next();
}

module.exports = { authUser, requireAuth, requireAdmin };
