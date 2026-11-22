import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, money, STATUS_LABELS } from '../api';
import { useApp } from '../context';

const STATUS_FLOW = ['paid', 'packed', 'shipped', 'delivered', 'cancelled'];

export default function AdminDashboard() {
  const { user, ready } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', description: '', category: 'Ornaments', price: '', image_url: '', stock: 10 });

  const isAdmin = user?.role === 'admin';

  const refresh = useCallback(() => {
    api('/admin/stats').then(setStats).catch(e => setError(e.message));
    api(`/admin/orders${filter ? `?status=${filter}` : ''}`).then(d => setOrders(d.orders)).catch(e => setError(e.message));
  }, [filter]);

  useEffect(() => {
    if (ready && !isAdmin) {
      navigate('/login');
      return;
    }
    if (!isAdmin) return;
    refresh();
    api('/admin/users').then(d => setUsers(d.users)).catch(() => {});
    api('/products').then(d => setProducts(d.products)).catch(() => {});
  }, [isAdmin, ready, refresh]);

  if (!isAdmin) return <main className="container narrow center-page"><p>Checking access…</p></main>;

  const setStatus = async (id, status) => {
    try {
      await api(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status } });
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      const d = await api('/products', { method: 'POST', body: newProduct });
      setProducts([d.product, ...products]);
      setNewProduct({ name: '', description: '', category: 'Ornaments', price: '', image_url: '', stock: 10 });
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleProduct = async (p) => {
    try {
      const d = await api(`/products/${p.id}`, { method: 'PATCH', body: { active: !p.active } });
      setProducts(products.map(x => (x.id === p.id ? d.product : x)));
    } catch (err) {
      setError(err.message);
    }
  };

  const restock = async (p) => {
    try {
      const d = await api(`/products/${p.id}`, { method: 'PATCH', body: { stock: p.stock + 10 } });
      setProducts(products.map(x => (x.id === p.id ? d.product : x)));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="container">
      <h2>Owner dashboard</h2>
      {error && <p className="error">{error}</p>}

      <div className="tabs">
        {['overview', 'orders', 'products', 'customers'].map(t => (
          <button key={t} className={`tab ${t === tab ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <>
          <div className="stats">
            <div className="stat">
              <span className="num">{stats.counts.paid}</span>
              <span className="lbl">New / to pack</span>
            </div>
            <div className="stat">
              <span className="num">{stats.counts.packed}</span>
              <span className="lbl">Packed</span>
            </div>
            <div className="stat">
              <span className="num">{stats.counts.shipped}</span>
              <span className="lbl">Shipped</span>
            </div>
            <div className="stat">
              <span className="num">{stats.counts.delivered}</span>
              <span className="lbl">Delivered</span>
            </div>
            <div className="stat">
              <span className="num">{stats.counts.pending_payment}</span>
              <span className="lbl">Pending payment</span>
            </div>
            <div className="stat">
              <span className="num">{money(stats.revenueCents, stats.currency)}</span>
              <span className="lbl">Revenue (paid orders)</span>
            </div>
            <div className="stat">
              <span className="num">{stats.customers}</span>
              <span className="lbl">Registered customers</span>
            </div>
          </div>
          {stats.lowStock.length > 0 && (
            <div className="panel">
              <h3>⚠️ Low stock (5 or fewer)</h3>
              <ul>{stats.lowStock.map(p => <li key={p.id}>{p.name} — {p.stock} left</li>)}</ul>
            </div>
          )}
          <div className="panel">
            <h3>Recent orders</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Customer</th><th>Total</th><th>Status</th><th>Placed</th></tr></thead>
                <tbody>
                  {stats.recent.map(o => (
                    <tr key={o.id}>
                      <td>#{o.id}</td>
                      <td>{o.customer_name}</td>
                      <td>{money(o.total_cents, o.currency)}</td>
                      <td><span className={`status ${o.status}`}>{STATUS_LABELS[o.status]}</span></td>
                      <td>{new Date(o.created_at + 'Z').toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'orders' && (
        <>
          <div className="filters">
            <button className={`chip ${filter === '' ? 'active' : ''}`} onClick={() => setFilter('')}>All</button>
            {['pending_payment', ...STATUS_FLOW].map(s => (
              <button key={s} className={`chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Customer</th><th>Phone</th><th>Address</th><th>Total</th><th>Status</th><th>Update</th><th>WhatsApp</th></tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>
                      {o.customer_name}
                      <div className="muted small">{o.user_email}</div>
                    </td>
                    <td>{o.customer_phone}</td>
                    <td className="addr">{o.address}</td>
                    <td>{money(o.total_cents, o.currency)}</td>
                    <td><span className={`status ${o.status}`}>{STATUS_LABELS[o.status]}</span></td>
                    <td>
                      <select value={o.status} onChange={e => setStatus(o.id, e.target.value)}>
                        {['pending_payment', ...STATUS_FLOW].map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <a
                        className="btn wa"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://wa.me/${(o.customer_phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${o.customer_name}, updates about your CraftNest order #${o.id}:`)}`}
                      >
                        💬
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small">Every paid order also sends an alert email to OWNER_EMAIL and records a one-tap WhatsApp message link for the owner.</p>
        </>
      )}

      {tab === 'products' && (
        <>
          <div className="panel">
            <h3>Add a new ornament</h3>
            <form className="product-form" onSubmit={addProduct}>
              <input placeholder="Name" required value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
              <input placeholder="Category" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} />
              <input placeholder="Price" type="number" step="0.01" min="0.5" required value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
              <input placeholder="Stock" type="number" min="0" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} />
              <input placeholder="Image URL (optional)" value={newProduct.image_url} onChange={e => setNewProduct({ ...newProduct, image_url: e.target.value })} />
              <input placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
              <button className="btn primary">Add product</button>
            </form>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Product</th><th>Price</th><th>Stock</th><th>Visible</th><th>Actions</th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>{p.name}</td>
                    <td>{money(p.price_cents)}</td>
                    <td>{p.stock}</td>
                    <td>{p.active ? 'Yes' : 'Hidden'}</td>
                    <td>
                      <button className="btn ghost" onClick={() => toggleProduct(p)}>{p.active ? 'Hide' : 'Show'}</button>
                      <button className="btn ghost" onClick={() => restock(p)}>+10 stock</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'customers' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Registered</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>{u.role}</td>
                  <td>{new Date(u.created_at + 'Z').toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
